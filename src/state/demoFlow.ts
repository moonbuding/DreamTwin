import {
  createSimulationsForProfile,
  createTwinFromProfile,
  demoFriends,
  demoNodes,
  demoProfile,
  demoSimulations,
  demoTwin,
} from "../data/demoData";
import type {
  DemoFlowState,
  DemoPage,
  DreamNodeStatus,
  RelationshipSimulationResult,
  TwinProjection,
  UserProfile,
} from "../types/dreamtwin";

export type DemoFlowAction =
  | { type: "START_TWIN_CREATE" }
  | { type: "SUBMIT_TWIN_PROFILE"; profile: UserProfile }
  | { type: "COMPLETE_TWIN_GENERATION"; twin?: TwinProjection }
  | { type: "OPEN_TODAY" }
  | { type: "OPEN_MESSAGES" }
  | { type: "OPEN_FRIENDS" }
  | { type: "OPEN_TWIN_HOME" }
  | { type: "EDIT_TWIN" }
  | { type: "ENTER_DREAM_PLAZA" }
  | { type: "OPEN_DREAM_LOG" }
  | { type: "OPEN_FRIEND_INVITE" }
  | { type: "SELECT_FRIEND"; friendId: string }
  | { type: "SELECT_ROAMING_SCENE"; sceneId: string }
  | { type: "SEND_DREAM_INVITE"; friendId: string }
  | { type: "SELECT_NODE"; nodeId: string }
  | { type: "OPEN_SIMULATION_RESULT"; nodeId: string }
  | { type: "ENTER_DREAM"; nodeId: string }
  | { type: "OPEN_WAITING"; nodeId: string }
  | { type: "OPEN_DREAM_GATE"; nodeId: string }
  | { type: "SIMULATE_COUNTERPART_CONFIRM"; nodeId: string }
  | { type: "SIMULATE_FRIEND_ACCEPT"; nodeId: string }
  | { type: "OPEN_ROAMING_SIMULATION"; nodeId: string }
  | { type: "STORE_LIVE_SIMULATION_RESULT"; resultKey: string; result: RelationshipSimulationResult }
  | { type: "WITHDRAW_DREAM"; nodeId: string }
  | { type: "OPEN_CHAT_ENTRY"; nodeId: string }
  | { type: "GO_BACK" }
  | { type: "RESET_DEMO" };

export const initialDemoFlowState: DemoFlowState = {
  currentPage: "welcome",
  pageHistory: [],
  hasCompletedTwinSetup: false,
  selectedNodeId: null,
  selectedFriendId: demoFriends[0]?.id ?? null,
  selectedRoamingSceneId: "undersea",
  dreamInviteStatus: "draft",
  resumeAtOutcomeNodeId: null,
  liveSimulationResults: {},
  profile: demoProfile,
  twin: demoTwin,
  friends: demoFriends,
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

function openDreamLog(state: DemoFlowState): DemoFlowState {
  return {
    ...state,
    currentPage: "dream-log",
    pageHistory: state.hasCompletedTwinSetup ? ["today"] : [],
  };
}

function openAppTab(state: DemoFlowState, currentPage: DemoPage): DemoFlowState {
  return {
    ...state,
    currentPage,
    pageHistory: [],
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
          hasCompletedTwinSetup: false,
          nodes: demoNodes.map((node) => ({ ...node, status: "unviewed" })),
          simulations: createSimulationsForProfile(action.profile),
          selectedNodeId: null,
          selectedFriendId: demoFriends[0]?.id ?? null,
          selectedRoamingSceneId: "undersea",
          dreamInviteStatus: "draft",
          resumeAtOutcomeNodeId: null,
          liveSimulationResults: {},
        },
        "twin-generating",
      );
    case "COMPLETE_TWIN_GENERATION":
      return {
        ...state,
        twin: action.twin ?? state.twin,
        hasCompletedTwinSetup: true,
        currentPage: "today",
        pageHistory: [],
      };
    case "OPEN_TODAY":
      return openAppTab(state, "today");
    case "OPEN_MESSAGES":
      return openAppTab(state, "messages");
    case "OPEN_FRIENDS":
      return openAppTab(state, "friends");
    case "OPEN_TWIN_HOME":
      return openAppTab(state, "twin-home");
    case "EDIT_TWIN":
      return goToPage(state, "twin-create");
    case "ENTER_DREAM_PLAZA":
    case "OPEN_DREAM_LOG":
      return openDreamLog(state);
    case "OPEN_FRIEND_INVITE":
      return openAppTab(
        {
          ...state,
          selectedFriendId: state.selectedFriendId ?? state.friends[0]?.id ?? null,
          selectedRoamingSceneId: state.selectedRoamingSceneId ?? "undersea",
          dreamInviteStatus: state.dreamInviteStatus,
        },
        "friends",
      );
    case "SELECT_FRIEND":
      return { ...state, selectedFriendId: action.friendId };
    case "SELECT_ROAMING_SCENE":
      return { ...state, selectedRoamingSceneId: action.sceneId };
    case "SEND_DREAM_INVITE":
      return goToPage(
        {
          ...setNodeStatus(state, "node-friend-mika", "waiting"),
          selectedFriendId: action.friendId,
          dreamInviteStatus: "sent",
          resumeAtOutcomeNodeId: null,
        },
        "waiting",
      );
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
    case "SIMULATE_FRIEND_ACCEPT":
      return goToPage(
        {
          ...setNodeStatus(state, action.nodeId, "both_entered"),
          dreamInviteStatus: "accepted",
          resumeAtOutcomeNodeId: action.nodeId,
        },
        "dream-log",
      );
    case "OPEN_ROAMING_SIMULATION":
      return goToPage({ ...state, selectedNodeId: action.nodeId, resumeAtOutcomeNodeId: action.nodeId }, "simulation-detail");
    case "STORE_LIVE_SIMULATION_RESULT":
      return {
        ...state,
        liveSimulationResults: {
          ...(state.liveSimulationResults ?? {}),
          [action.resultKey]: action.result,
        },
      };
    case "WITHDRAW_DREAM":
      if (state.nodes.find((node) => node.id === action.nodeId)?.entryMode === "friend_invite") {
        return goToPage(
          {
            ...setNodeStatus(state, action.nodeId, "unviewed"),
            dreamInviteStatus: "withdrawn",
            resumeAtOutcomeNodeId: null,
          },
          "friends",
        );
      }
      return goToPage({ ...setNodeStatus(state, action.nodeId, "viewed"), resumeAtOutcomeNodeId: action.nodeId }, "simulation-detail");
    case "OPEN_CHAT_ENTRY":
      return goToPage({ ...setNodeStatus(state, action.nodeId, "in_chat"), selectedNodeId: action.nodeId }, "chat-entry");
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
