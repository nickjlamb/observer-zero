/**
 * ObserverAgent: perception → memory → action → (occasionally) belief update.
 *
 * The agent's entire knowledge of the world arrives as AgentView objects.
 * Everything else it owns: persona, memory, notebook analysis, beliefs.
 */

import { instrumentsAt, type AgentView } from "../engine/types.js";
import type { ColleagueInfo, MailItem, ModelProvider } from "../models/provider.js";
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

export class ObserverAgent {
  readonly memory = new MemoryStore();
  beliefs: BeliefState = structuredClone(INITIAL_BELIEFS);
  readonly beliefTimeline: BeliefSnapshot[] = [];
  readonly actionHistory: { day: number; action: AgentAction }[] = [];
  /** Belief reviews that failed (provider/validation) — kept visible, never silent. */
  failedUpdates: { day: number }[] = [];

  constructor(
    readonly persona: Persona,
    private provider: ModelProvider,
    /** Public directory of other agents in this run. */
    readonly colleagues: ColleagueInfo[] = [],
  ) {}

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

  async decide(view: AgentView): Promise<AgentAction> {
    try {
      const { inbox, outbox } = this.mail(view);
      const action = await this.provider.decide({
        persona: this.persona,
        day: view.day,
        location: view.currentLocation,
        memories: this.memory.retrieve({ recentEpisodic: 10 }),
        notebook: buildNotebook(view),
        beliefs: this.beliefs,
        availableInstruments: instrumentsAt(this.persona.home as never).map((i) => ({
          id: i.id,
          kind: i.kind,
        })),
        colleagues: this.colleagues,
        inbox,
        outbox,
        recentObservations: view.observations.slice(-120),
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

  async updateBeliefs(view: AgentView): Promise<void> {
    try {
      const { inbox, outbox } = this.mail(view);
      const update = await this.provider.updateBeliefs({
        persona: this.persona,
        day: view.day,
        notebook: buildNotebook(view),
        recentObservations: view.observations.slice(-40),
        beliefs: this.beliefs,
        inbox,
        outbox,
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
