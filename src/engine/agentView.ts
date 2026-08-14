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
import { toOpaqueId } from "./opaqueIds.js";

/**
 * Study 3 (design v0.2 §5, audit item 1): how event ids are presented to the
 * agent. "sequential" is the Study 1/2 surface, unchanged. "opaque" re-encodes
 * ids per agent so that hidden events leave no gap and other agents' activity
 * leaves no stride — see opaqueIds.ts for the leak this closes.
 */
export interface ObservationIdMode {
  mode: "opaque";
  runKey: string;
}

/** Payload fields that carry event ids and must be re-encoded with them. */
const PAYLOAD_ID_FIELDS = ["postEventId", "predictionEventId"] as const;

function toObservation(event: WorldEvent, agentId: string, ids?: ObservationIdMode): Observation {
  // Explicit whitelist. `groundTruth` and `visibleTo` are structurally absent.
  const detail: Record<string, unknown> = { ...event.payload };
  if (ids) {
    for (const f of PAYLOAD_ID_FIELDS) {
      if (typeof detail[f] === "number") {
        detail[f] = toOpaqueId(ids.runKey, agentId, detail[f] as number);
      }
    }
  }
  const obs: Observation = {
    eventId: ids ? toOpaqueId(ids.runKey, agentId, event.id) : event.id,
    day: event.day,
    type: event.type,
    location: event.location,
    detail,
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
  /** Omit for the Study 1/2 surface (sequential ids, byte-identical). */
  observationIds?: ObservationIdMode;
}): AgentView {
  const visible = args.events.filter((e) => e.visibleTo.includes(args.agentId));
  const view: AgentView = {
    agentId: args.agentId,
    day: args.day,
    currentLocation: args.currentLocation,
    observations: visible.map((e) => toObservation(e, args.agentId, args.observationIds)),
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
