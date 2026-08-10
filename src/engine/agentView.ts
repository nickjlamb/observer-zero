/**
 * The information-flow boundary.
 *
 * This module is the ONLY place where privileged WorldEvents are converted
 * into agent-safe Observations. Everything an agent (and, from Milestone 2,
 * every prompt builder) receives passes through here.
 *
 * Rules enforced:
 *   1. toObservation() copies an explicit whitelist of fields. It does not
 *      redact — a new object is built, so a forgotten field is invisible,
 *      not leaked.
 *   2. buildAgentView() only includes events whose visibleTo contains the
 *      agent.
 *   3. The output is validated against AgentViewSchema, whose shape has no
 *      groundTruth field at all, then deep-frozen.
 *
 * Downstream rule (lint-enforced from Milestone 2): no function that
 * constructs a model prompt may import WorldRules, WorldState, or EventLog —
 * only AgentView.
 */

import {
  AgentViewSchema,
  ObservationSchema,
  type AgentView,
  type Location,
  type Observation,
  type WorldEvent,
} from "./types.js";

function toObservation(event: WorldEvent): Observation {
  // Explicit whitelist. `groundTruth` and `visibleTo` are structurally absent.
  const obs: Observation = {
    eventId: event.id,
    day: event.day,
    type: event.type,
    location: event.location,
    detail: { ...event.payload },
  };
  return ObservationSchema.parse(obs);
}

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    for (const value of Object.values(obj as Record<string, unknown>)) {
      deepFreeze(value);
    }
    Object.freeze(obj);
  }
  return obj;
}

export function buildAgentView(args: {
  agentId: string;
  day: number;
  currentLocation: Location;
  events: readonly WorldEvent[];
}): AgentView {
  const visible = args.events.filter((e) => e.visibleTo.includes(args.agentId));
  const view: AgentView = {
    agentId: args.agentId,
    day: args.day,
    currentLocation: args.currentLocation,
    observations: visible.map(toObservation),
  };
  const validated = AgentViewSchema.parse(view);

  // Belt-and-braces: assert no privileged keys survived serialization.
  const json = JSON.stringify(validated);
  for (const forbidden of ["groundTruth", "truePeriodBeats", "biasApplied", "visibleTo"]) {
    if (json.includes(`"${forbidden}"`)) {
      throw new Error(`AgentView leak: forbidden key "${forbidden}" present`);
    }
  }
  return deepFreeze(validated);
}
