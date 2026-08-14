/**
 * ObserverAgent: perception → memory → action → (occasionally) belief update.
 *
 * The agent's entire knowledge of the world arrives as AgentView objects.
 * Everything else it owns: persona, memory, notebook analysis, beliefs.
 */

import { instrumentsAt, type AgentView } from "../engine/types.js";
import type {
  BulletinItem,
  BulletinStatus,
  ColleagueInfo,
  MailItem,
  ModelProvider,
} from "../models/provider.js";
import { REST_FALLBACK, type AgentAction } from "./actions.js";
import {
  INITIAL_BELIEFS,
  normalizeUpdate,
  type BeliefSnapshot,
  type BeliefState,
} from "./beliefs.js";
import { MemoryStore } from "./memory.js";
import { buildNotebook } from "./notebook.js";
import type { Persona } from "./persona.js";

/** Study 3 per-agent configuration; every field absent for Study 1/2 runs. */
export interface AgentStudy3Options {
  /** Instrument sites beyond the persona's home (solo two-site config). */
  sites?: string[];
  /** Render the statistical workbench in notebook sections. */
  workbench?: boolean;
  /** Offer the record_prediction action. */
  predictions?: boolean;
}

export class ObserverAgent {
  readonly memory = new MemoryStore();
  beliefs: BeliefState = structuredClone(INITIAL_BELIEFS);
  readonly beliefTimeline: BeliefSnapshot[] = [];
  readonly actionHistory: { day: number; action: AgentAction }[] = [];
  /** Belief reviews that failed (provider/validation) — kept visible, never silent. */
  failedUpdates: { day: number }[] = [];
  readonly sites: string[];

  constructor(
    readonly persona: Persona,
    private provider: ModelProvider,
    /** Public directory of other agents in this run. */
    readonly colleagues: ColleagueInfo[] = [],
    private study3: AgentStudy3Options = {},
  ) {
    this.sites = study3.sites ?? [persona.home];
  }

  /** Fold new observations into episodic (and social) memory. */
  perceive(view: AgentView): void {
    for (const obs of view.observations) {
      if (this.memory.hasSeen(obs.eventId)) continue;
      if (obs.type === "experiment_result") {
        this.memory.addEpisodic({
          day: obs.day,
          eventId: obs.eventId,
          text:
            `Measured ${String(obs.detail["instrumentId"])} trial ${String(obs.detail["trial"])}: ` +
            `${Number(obs.detail["observedValue"]).toFixed(4)} ${String(obs.detail["unit"])}.`,
          tags: ["measurement", String(obs.detail["instrumentId"])],
        });
      } else if (obs.type === "message_sent") {
        const from = String(obs.detail["from"]);
        const to = String(obs.detail["to"]);
        const mine = from === this.persona.agentId;
        this.memory.addEpisodic({
          day: obs.day,
          eventId: obs.eventId,
          text: mine
            ? `I wrote to ${to}: "${String(obs.detail["text"])}"`
            : `Message from ${from}: "${String(obs.detail["text"])}"`,
          tags: ["message", mine ? to : from],
        });
        if (!mine) {
          this.memory.addSocial({ aboutAgentId: from, day: obs.day, text: String(obs.detail["text"]) });
        }
      } else if (obs.type === "bulletin_posted") {
        // Only own posts are visible as bulletin_posted events.
        this.memory.addEpisodic({
          day: obs.day,
          eventId: obs.eventId,
          text: `I pinned a notice to the public bulletin: "${String(obs.detail["text"])}"`,
          tags: ["bulletin", "own_post"],
        });
      } else if (obs.type === "bulletin_read") {
        if (obs.detail["noNewPosts"]) {
          this.memory.addEpisodic({
            day: obs.day,
            eventId: obs.eventId,
            text: "Read the bulletin board: no notices I had not already seen.",
            tags: ["bulletin"],
          });
        } else {
          const author = String(obs.detail["author"]);
          const text = String(obs.detail["text"]);
          this.memory.addEpisodic({
            day: obs.day,
            eventId: obs.eventId,
            text: `Bulletin notice (posted day ${String(obs.detail["postDay"])} by ${author}): "${text}"`,
            tags: ["bulletin", author],
          });
          this.memory.addSocial({ aboutAgentId: author, day: obs.day, text });
        }
      } else if (obs.type === "prediction_registered") {
        this.memory.addEpisodic({
          day: obs.day,
          eventId: obs.eventId,
          text:
            `I recorded a forecast for ${String(obs.detail["instrumentId"])}: mean of next ` +
            `${String(obs.detail["trials"])} trials ${Number(obs.detail["predictedMean"]).toFixed(4)} ` +
            `± ${Number(obs.detail["tolerance"]).toFixed(4)}.`,
          tags: ["prediction", String(obs.detail["instrumentId"])],
        });
      } else if (obs.type === "prediction_resolved") {
        this.memory.addEpisodic({
          day: obs.day,
          eventId: obs.eventId,
          text:
            `My recorded forecast for ${String(obs.detail["instrumentId"])} resolved: observed mean ` +
            `${Number(obs.detail["observedMean"]).toFixed(4)} vs forecast ` +
            `${Number(obs.detail["predictedMean"]).toFixed(4)} ± ${Number(obs.detail["tolerance"]).toFixed(4)} — ` +
            `${obs.detail["withinTolerance"] ? "WITHIN tolerance" : "outside tolerance"}.`,
          tags: ["prediction", String(obs.detail["instrumentId"])],
        });
      } else if (obs.type === "day_started") {
        // Mark seen without storing filler memories.
        this.memory.addEpisodic({ day: obs.day, eventId: obs.eventId, text: "", tags: ["tick"] });
      }
    }
  }

  /** Derive inbox/outbox from the agent's own view — nothing privileged. */
  private mail(view: AgentView): { inbox: MailItem[]; outbox: MailItem[] } {
    const inbox: MailItem[] = [];
    const outbox: MailItem[] = [];
    for (const obs of view.observations) {
      if (obs.type !== "message_sent") continue;
      const item: MailItem = {
        eventId: obs.eventId,
        day: obs.day,
        from: String(obs.detail["from"]),
        to: String(obs.detail["to"]),
        text: String(obs.detail["text"]),
      };
      if (item.to === this.persona.agentId) inbox.push(item);
      if (item.from === this.persona.agentId) outbox.push(item);
    }
    return { inbox, outbox };
  }

  /**
   * The bulletin as THIS agent has experienced it: its own posts plus every
   * notice delivered through its reads. Derived from its own view only.
   */
  private bulletinFeed(view: AgentView): BulletinItem[] {
    const items: BulletinItem[] = [];
    for (const obs of view.observations) {
      if (obs.type === "bulletin_posted") {
        items.push({
          eventId: obs.eventId,
          postDay: obs.day,
          author: this.persona.agentId,
          text: String(obs.detail["text"]),
          mine: true,
        });
      } else if (obs.type === "bulletin_read" && !obs.detail["noNewPosts"]) {
        items.push({
          eventId: obs.eventId,
          postDay: Number(obs.detail["postDay"]),
          author: String(obs.detail["author"]),
          text: String(obs.detail["text"]),
          mine: false,
        });
      }
    }
    return items;
  }

  /**
   * Bulletin status for the decision prompt: the public post count comes
   * from the latest day_started that carries one (one day stale by design —
   * the count as of this morning's board, before today's pinning).
   */
  private bulletinStatus(view: AgentView): BulletinStatus | undefined {
    let totalPosts: number | null = null;
    for (const obs of view.observations) {
      if (obs.type === "day_started" && obs.detail["bulletinPostCount"] !== undefined) {
        totalPosts = Number(obs.detail["bulletinPostCount"]);
      }
    }
    if (totalPosts === null) return undefined;
    // Own posts count as seen — the author witnessed them being pinned.
    const seen = this.bulletinFeed(view).length;
    return { totalPosts, seenPosts: Math.min(seen, totalPosts) };
  }

  async decide(view: AgentView): Promise<AgentAction> {
    try {
      const { inbox, outbox } = this.mail(view);
      const action = await this.provider.decide({
        persona: this.persona,
        day: view.day,
        location: view.currentLocation,
        memories: this.memory.retrieve({ recentEpisodic: 10 }),
        notebook: buildNotebook(view, 10, { workbench: this.study3.workbench ?? false }),
        beliefs: this.beliefs,
        availableInstruments: this.sites.flatMap((s) =>
          instrumentsAt(s as never).map((i) => ({ id: i.id, kind: i.kind })),
        ),
        colleagues: this.colleagues,
        inbox,
        outbox,
        bulletin: this.bulletinStatus(view),
        bulletinFeed: this.bulletinFeed(view),
        recentObservations: view.observations.slice(-120),
        ...(this.sites.length > 1 ? { sites: this.sites } : {}),
        ...(this.study3.predictions ? { predictionsEnabled: true } : {}),
      });
      this.actionHistory.push({ day: view.day, action });
      return action;
    } catch {
      this.actionHistory.push({ day: view.day, action: REST_FALLBACK });
      return REST_FALLBACK;
    }
  }

  /**
   * Evening-reflection trigger. Real-LLM Ada measured for 25 straight days
   * before her first belief review; a working scientist reads her own
   * notebook. Force a review when (a) any series has drifted past z=2 and
   * beliefs are ≥3 days stale, or (b) there is real data and beliefs are
   * ≥10 days stale. Agent-side policy on agent-visible data only.
   */
  shouldForceReview(view: AgentView): boolean {
    const nb = buildNotebook(view);
    const staleness = view.day - this.beliefs.updatedOnDay;
    const drifted = nb.instruments.some(
      (i) => i.driftZ !== null && Math.abs(i.driftZ) > 2,
    );
    const hasData = nb.instruments.some((i) => i.totalTrials >= 12);
    if (drifted && staleness >= 3) return true;
    if (hasData && staleness >= 10) return true;
    return false;
  }

  async updateBeliefs(view: AgentView, isFinalReview = false): Promise<void> {
    try {
      const { inbox, outbox } = this.mail(view);
      const update = await this.provider.updateBeliefs({
        persona: this.persona,
        day: view.day,
        notebook: buildNotebook(view, 10, { workbench: this.study3.workbench ?? false }),
        recentObservations: view.observations.slice(-40),
        beliefs: this.beliefs,
        inbox,
        outbox,
        bulletinFeed: this.bulletinFeed(view),
        isFinalReview,
      });
      this.beliefs = normalizeUpdate(update, view.day);
      this.beliefTimeline.push({
        day: view.day,
        state: structuredClone(this.beliefs),
        summaryOfChange: update.summaryOfChange,
      });
      this.memory.addSemantic({
        day: view.day,
        text: `Belief review: ${update.summaryOfChange}`,
      });
    } catch {
      // Failed update: keep priors. Honest failure beats hallucinated beliefs —
      // but it must be VISIBLE. A live run silently lost Maya's entire final
      // 11 days of reviews to truncated JSON.
      this.failedUpdates.push({ day: view.day });
      this.memory.addSemantic({
        day: view.day,
        text: "Attempted a belief review but could not complete it; keeping prior hypotheses.",
      });
    }
  }
}
