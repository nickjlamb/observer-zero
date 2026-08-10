/**
 * Per-agent persistent memory (spec §8): episodic, semantic, social.
 *
 * No embeddings at MVP — structured recency/tag retrieval is deterministic
 * and auditable. Social memory becomes meaningful in Milestone 3.
 */

export interface EpisodicEntry {
  day: number;
  eventId: number | null;
  text: string;
  tags: string[];
}

export interface SemanticEntry {
  day: number;
  text: string;
}

export interface SocialEntry {
  aboutAgentId: string;
  day: number;
  text: string;
}

export class MemoryStore {
  readonly episodic: EpisodicEntry[] = [];
  readonly semantic: SemanticEntry[] = [];
  readonly social: SocialEntry[] = [];
  private seenEventIds = new Set<number>();

  hasSeen(eventId: number): boolean {
    return this.seenEventIds.has(eventId);
  }

  addEpisodic(entry: EpisodicEntry): void {
    if (entry.eventId !== null) {
      if (this.seenEventIds.has(entry.eventId)) return;
      this.seenEventIds.add(entry.eventId);
    }
    this.episodic.push(entry);
  }

  addSemantic(entry: SemanticEntry): void {
    this.semantic.push(entry);
  }

  addSocial(entry: SocialEntry): void {
    this.social.push(entry);
  }

  /** Recency-based retrieval; semantic conclusions always included. */
  retrieve(opts: { recentEpisodic?: number; tag?: string } = {}): string {
    const n = opts.recentEpisodic ?? 12;
    let episodic = this.episodic;
    if (opts.tag) episodic = episodic.filter((e) => e.tags.includes(opts.tag!));
    const recent = episodic.slice(-n);
    const lines: string[] = [];
    for (const s of this.semantic.slice(-8)) {
      lines.push(`(conclusion, day ${s.day}) ${s.text}`);
    }
    for (const e of recent) {
      lines.push(`(day ${e.day}) ${e.text}`);
    }
    return lines.length ? lines.join("\n") : "(no notes yet)";
  }
}
