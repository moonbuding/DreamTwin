import {
  createSimulationsForProfile,
  createTwinFromProfile,
  demoNodes,
  demoProfile,
  demoSimulations,
  demoTwin,
} from "../data/demoData";
import type { DemoFlowState, DemoPage, DreamNodeStatus, UserProfile } from "../types/dreamtwin";

export type DemoFlowAction =
  | { type: "START_TWIN_CREATE" }
  | { type: "SUBMIT_TWIN_PROFILE"; profile: UserProfile }
  | { type: "COMPLETE_TWIN_GENERATION" }
  | { type: "OPEN_DREAM_LOG" }
  | { type: "SELECT_NODE"; nodeId: string }
  | { type: "OPEN_SIMULATION_RESULT"; nodeId: string }
  | { type: "ENTER_DREAM"; nodeId: string }
  | { type: "OPEN_WAITING"; nodeId: string }
  | { type: "OPEN_DREAM_GATE"; nodeId: string }
  | { type: "SIMULATE_COUNTERPART_CONFIRM"; nodeId: string }
  | { type: "WITHDRAW_DREAM"; nodeId: string }
  | { type: "OPEN_CHAT_ENTRY"; nodeId: string }
  | { type: "GO_BACK" }
  | { type: "RESET_DEMO" };

export const initialDemoFlowState: DemoFlowState = {
  currentPage: "welcome",
  pageHistory: [],
  selectedNodeId: null,
  resumeAtOutcomeNodeId: null,
  profile: demoProfile,
  twin: demoTwin,
  nodes: demoNodes,
  simulations: demoSimulations,
};

function goToPage(state: DemoFlowState, currentPage: DemoPage): DemoFlowState {
  return {
    ...state,
    currentPage,
    pageHistory: [...(state.pageHistory ?? []), state.currentPage],
  };
}

function setNodeStatus(state: DemoFlowState, nodeId: string, status: DreamNodeStatus): DemoFlowState {
  return {
    ...state,
    selectedNodeId: nodeId,
    nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, status } : node)),
  };
}

function selectNode(state: DemoFlowState, nodeId: string): DemoFlowState {
  return {
    ...state,
    selectedNodeId: nodeId,
    nodes: state.nodes.map((node) => {
      if (node.id !== nodeId) return node;
      if (node.status !== "unviewed") return node;
      return { ...node, status: "viewed" };
    }),
  };
}

export function demoFlowReducer(state: DemoFlowState, action: DemoFlowAction): DemoFlowState {
  switch (action.type) {
    case "START_TWIN_CREATE":
      return goToPage(state, "twin-create");
    case "SUBMIT_TWIN_PROFILE":
      return goToPage(
        {
          ...state,
          profile: action.profile,
          twin: createTwinFromProfile(action.profile),
          nodes: demoNodes.map((node) => ({ ...node, status: "unviewed" })),
          simulations: createSimulationsForProfile(action.profile),
          selectedNodeId: null,
          resumeAtOutcomeNodeId: null,
        },
        "twin-generating",
      );
    case "COMPLETE_TWIN_GENERATION":
    case "OPEN_DREAM_LOG":
      return goToPage(state, "dream-log");
    case "SELECT_NODE":
      return goToPage({ ...selectNode(state, action.nodeId), resumeAtOutcomeNodeId: null }, "simulation-detail");
    case "OPEN_SIMULATION_RESULT":
      return goToPage({ ...state, selectedNodeId: action.nodeId, resumeAtOutcomeNodeId: action.nodeId }, "simulation-detail");
    case "ENTER_DREAM":
      return goToPage({ ...setNodeStatus(state, action.nodeId, "waiting"), resumeAtOutcomeNodeId: null }, "waiting");
    case "OPEN_WAITING":
      return goToPage({ ...state, selectedNodeId: action.nodeId, resumeAtOutcomeNodeId: action.nodeId }, "waiting");
    case "OPEN_DREAM_GATE":
      return goToPage({ ...state, selectedNodeId: action.nodeId, resumeAtOutcomeNodeId: action.nodeId }, "dream-gate");
    case "SIMULATE_COUNTERPART_CONFIRM":
      return goToPage({ ...setNodeStatus(state, action.nodeId, "opened"), resumeAtOutcomeNodeId: action.nodeId }, "dream-gate");
    case "WITHDRAW_DREAM":
      return goToPage({ ...setNodeStatus(state, action.nodeId, "viewed"), resumeAtOutcomeNodeId: action.nodeId }, "simulation-detail");
    case "OPEN_CHAT_ENTRY":
      return goToPage({ ...state, selectedNodeId: action.nodeId }, "chat-entry");
    case "GO_BACK": {
      const pageHistory = state.pageHistory ?? [];
      const previousPage = pageHistory[pageHistory.length - 1];
      if (!previousPage) return state;
      return {
        ...state,
        currentPage: previousPage,
        pageHistory: pageHistory.slice(0, -1),
      };
    }
    case "RESET_DEMO":
      return initialDemoFlowState;
    default:
      return state;
  }
}
