import { createSimulationsForProfile, demoFriends, demoNodes } from "../data/demoData";
import type { DemoFlowState, RelationshipSimulation } from "../types/dreamtwin";
import { initialDemoFlowState } from "./demoFlow";

export const DEMO_STORAGE_KEY = "dreamtwin.demoFlow.v3";
export const LEGACY_DEMO_STORAGE_KEYS = ["dreamtwin.demoFlow.v2", "dreamtwin.demoFlow.v1"];

export function isDemoState(value: unknown): value is DemoFlowState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DemoFlowState>;
  const simulations = state.simulations as Partial<RelationshipSimulation>[] | undefined;
  return (
    typeof state.currentPage === "string" &&
    Array.isArray(state.pageHistory) &&
    Array.isArray(state.nodes) &&
    Array.isArray(state.friends) &&
    Array.isArray(simulations) &&
    simulations.every((simulation) => Array.isArray(simulation.scenarios)) &&
    Boolean(state.profile) &&
    Boolean(state.twin)
  );
}

export function normalizePersistedState(state: DemoFlowState): DemoFlowState {
  const inferredTwinSetup =
    typeof state.hasCompletedTwinSetup === "boolean"
      ? state.hasCompletedTwinSetup
      : state.currentPage !== "welcome" && state.currentPage !== "twin-create";
  const nodeStatusById = new Map(state.nodes.map((node) => [node.id, node.status]));
  const refreshedNodes = demoNodes.map((node) => ({
    ...node,
    status: nodeStatusById.get(node.id) ?? node.status,
  }));
  const merged = {
    ...initialDemoFlowState,
    ...state,
    friends: demoFriends,
    nodes: refreshedNodes,
    simulations: createSimulationsForProfile(state.profile),
    hasCompletedTwinSetup: inferredTwinSetup,
    liveSimulationResults: {},
  };

  if (!inferredTwinSetup) return merged;

  return {
    ...merged,
    currentPage: "today",
    pageHistory: [],
  };
}

function getBrowserStorage(): Storage | undefined {
  return (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage;
}

export function loadPersistedState(storage?: Storage): DemoFlowState {
  const storageSource = storage ?? getBrowserStorage();
  if (!storageSource) return initialDemoFlowState;

  try {
    const storageKeys = [DEMO_STORAGE_KEY, ...LEGACY_DEMO_STORAGE_KEYS];
    const raw = storageKeys.map((key) => storageSource.getItem(key)).find(Boolean);
    if (!raw) return initialDemoFlowState;
    const parsed = JSON.parse(raw);
    if (!isDemoState(parsed)) return initialDemoFlowState;
    return normalizePersistedState(parsed);
  } catch {
    return initialDemoFlowState;
  }
}

export function persistDemoState(state: DemoFlowState, storage?: Storage): void {
  const storageTarget = storage ?? getBrowserStorage();
  if (!storageTarget) return;
  storageTarget.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
}
