/**
 * Immutable, append-only event log.
 *
 * Every consequential thing that happens in the world is recorded here with
 * full ground truth, giving the evaluator perfect post-hoc data. Events are
 * deep-frozen on append; the log hands out no mutable references.
 */

import { WorldEventSchema, type WorldEvent } from "./types.js";

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      deepFreeze(value);
    }
    Object.freeze(obj);
  }
  return obj;
}

export class EventLog {
  private events: WorldEvent[] = [];

  append(event: Omit<WorldEvent, "id">): WorldEvent {
    const withId = { ...event, id: this.events.length };
    const validated = WorldEventSchema.parse(withId);
    deepFreeze(validated);
    this.events.push(validated);
    return validated;
  }

  get length(): number {
    return this.events.length;
  }

  /** Full privileged log (simulator/evaluator only). */
  all(): readonly WorldEvent[] {
    return this.events;
  }

  /** Events visible to a given agent (still privileged shape — use agentView to cross the boundary). */
  visibleTo(agentId: string): readonly WorldEvent[] {
    return this.events.filter((e) => e.visibleTo.includes(agentId));
  }

  byType(type: WorldEvent["type"]): readonly WorldEvent[] {
    return this.events.filter((e) => e.type === type);
  }

  toJSON(): WorldEvent[] {
    return [...this.events];
  }
}
