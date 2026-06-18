import { useEffect, useMemo, useReducer } from "react";
import { AppShell } from "./components/AppShell";
import { demoFlowReducer, initialDemoFlowState } from "./state/demoFlow";
import { ChatEntryPage } from "./pages/ChatEntryPage";
import { DreamGatePage } from "./pages/DreamGatePage";
import { DreamLogPage } from "./pages/DreamLogPage";
import { FriendInvitePage } from "./pages/FriendInvitePage";
import { SimulationDetailPage } from "./pages/SimulationDetailPage";
import { TwinCreatePage } from "./pages/TwinCreatePage";
import { TwinGeneratingPage } from "./pages/TwinGeneratingPage";
import { TwinHomePage } from "./pages/TwinHomePage";
import { WaitingPage } from "./pages/WaitingPage";
import { WelcomePage } from "./pages/WelcomePage";
import type { DemoFlowState, DemoPage, RelationshipSimulation } from "./types/dreamtwin";

const DEMO_STORAGE_KEY = "dreamtwin.demoFlow.v3";
const LEGACY_DEMO_STORAGE_KEYS = ["dreamtwin.demoFlow.v2", "dreamtwin.demoFlow.v1"];

const pageProgress: Record<DemoPage, { label: string; value: number }> = {
  welcome: { label: "产品解释", value: 8 },
  "twin-create": { label: "创建分身", value: 20 },
  "twin-generating": { label: "生成投影", value: 34 },
  "twin-home": { label: "AI 分身", value: 42 },
  "dream-log": { label: "梦境广场", value: 52 },
  "friend-invite": { label: "好友入梦", value: 56 },
  "simulation-detail": { label: "关系预演", value: 64 },
  waiting: { label: "等待回应", value: 78 },
  "dream-gate": { label: "梦境门", value: 90 },
  "chat-entry": { label: "真实聊天", value: 100 },
};

function isDemoState(value: unknown): value is DemoFlowState {
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

function normalizePersistedState(state: DemoFlowState): DemoFlowState {
  const inferredTwinSetup =
    typeof state.hasCompletedTwinSetup === "boolean"
      ? state.hasCompletedTwinSetup
      : state.currentPage !== "welcome" && state.currentPage !== "twin-create";
  const merged = {
    ...initialDemoFlowState,
    ...state,
    hasCompletedTwinSetup: inferredTwinSetup,
  };

  if (!inferredTwinSetup) return merged;

  return {
    ...merged,
    currentPage: "twin-home",
    pageHistory: [],
  };
}

function loadPersistedState(): DemoFlowState {
  if (typeof window === "undefined") return initialDemoFlowState;

  try {
    const storageKeys = [DEMO_STORAGE_KEY, ...LEGACY_DEMO_STORAGE_KEYS];
    const raw = storageKeys.map((key) => window.localStorage.getItem(key)).find(Boolean);
    if (!raw) return initialDemoFlowState;
    const parsed = JSON.parse(raw);
    if (!isDemoState(parsed)) return initialDemoFlowState;
    return normalizePersistedState(parsed);
  } catch {
    return initialDemoFlowState;
  }
}

export function App() {
  const [state, dispatch] = useReducer(demoFlowReducer, initialDemoFlowState, loadPersistedState);

  const selectedNode = useMemo(
    () => state.nodes.find((node) => node.id === state.selectedNodeId) ?? state.nodes[0],
    [state.nodes, state.selectedNodeId],
  );
  const selectedSimulation = useMemo(
    () => state.simulations.find((simulation) => simulation.id === selectedNode.simulationId) ?? state.simulations[0],
    [selectedNode.simulationId, state.simulations],
  );
  const friendInviteSimulation = useMemo(
    () => state.simulations.find((simulation) => simulation.entryMode === "friend_invite") ?? state.simulations[0],
    [state.simulations],
  );
  const continueNode = (nodeId: string) => {
    const node = state.nodes.find((item) => item.id === nodeId);
    if (node?.status === "opened") {
      dispatch({ type: "OPEN_DREAM_GATE", nodeId });
      return;
    }
    if (node?.status === "waiting") {
      dispatch({ type: "OPEN_WAITING", nodeId });
      return;
    }
    dispatch({ type: "ENTER_DREAM", nodeId });
  };

  const canGoBack = (state.pageHistory ?? []).length > 0;
  const currentProgress = pageProgress[state.currentPage] ?? pageProgress.welcome;
  const progressLabel = `${Math.round(currentProgress.value)}%`;
  const stepLabel = currentProgress.label;

  useEffect(() => {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <AppShell
      canGoBack={canGoBack}
      progressLabel={progressLabel}
      progressValue={currentProgress.value}
      stepLabel={stepLabel}
      onBack={() => dispatch({ type: "GO_BACK" })}
      onReset={() => dispatch({ type: "RESET_DEMO" })}
    >
      {state.currentPage === "welcome" && <WelcomePage onStart={() => dispatch({ type: "START_TWIN_CREATE" })} />}
      {state.currentPage === "twin-create" && (
        <TwinCreatePage
          profile={state.profile}
          onSubmit={(profile) => dispatch({ type: "SUBMIT_TWIN_PROFILE", profile })}
        />
      )}
      {state.currentPage === "twin-generating" && (
        <TwinGeneratingPage twin={state.twin} onComplete={() => dispatch({ type: "COMPLETE_TWIN_GENERATION" })} />
      )}
      {state.currentPage === "twin-home" && (
        <TwinHomePage
          profile={state.profile}
          twin={state.twin}
          nodes={state.nodes}
          onEditTwin={() => dispatch({ type: "EDIT_TWIN" })}
          onEnterDreamPlaza={() => dispatch({ type: "ENTER_DREAM_PLAZA" })}
          onInviteFriend={() => dispatch({ type: "OPEN_FRIEND_INVITE" })}
        />
      )}
      {state.currentPage === "dream-log" && (
        <DreamLogPage
          twin={state.twin}
          nodes={state.nodes}
          onOpenFriendInvite={() => dispatch({ type: "OPEN_FRIEND_INVITE" })}
          onSelectNode={(nodeId) => dispatch({ type: "SELECT_NODE", nodeId })}
        />
      )}
      {state.currentPage === "friend-invite" && (
        <FriendInvitePage
          friends={state.friends}
          inviteStatus={state.dreamInviteStatus}
          selectedFriendId={state.selectedFriendId}
          selectedSceneId={state.selectedRoamingSceneId}
          simulation={friendInviteSimulation}
          onInvite={(friendId, sceneId) => dispatch({ type: "SEND_DREAM_INVITE", friendId, sceneId })}
          onSelectFriend={(friendId) => dispatch({ type: "SELECT_FRIEND", friendId })}
          onSelectScene={(sceneId) => dispatch({ type: "SELECT_ROAMING_SCENE", sceneId })}
        />
      )}
      {state.currentPage === "simulation-detail" && (
        <SimulationDetailPage
          node={selectedNode}
          simulation={selectedSimulation}
          selectedRoamingSceneId={state.selectedRoamingSceneId}
          resumeAtOutcome={
            state.resumeAtOutcomeNodeId === selectedNode.id ||
            selectedNode.status === "waiting" ||
            selectedNode.status === "opened"
          }
          onBackToLog={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onContinue={continueNode}
          onSelectRoamingScene={(sceneId) => dispatch({ type: "SELECT_ROAMING_SCENE", sceneId })}
        />
      )}
      {state.currentPage === "waiting" && (
        <WaitingPage
          node={selectedNode}
          simulation={selectedSimulation}
          onBackToSimulation={(nodeId) =>
            selectedSimulation.entryMode === "friend_invite"
              ? dispatch({ type: "OPEN_FRIEND_INVITE" })
              : dispatch({ type: "OPEN_SIMULATION_RESULT", nodeId })
          }
          onConfirm={(nodeId) =>
            selectedSimulation.entryMode === "friend_invite"
              ? dispatch({ type: "SIMULATE_FRIEND_ACCEPT", nodeId })
              : dispatch({ type: "SIMULATE_COUNTERPART_CONFIRM", nodeId })
          }
          onExplore={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onWithdraw={(nodeId) => dispatch({ type: "WITHDRAW_DREAM", nodeId })}
        />
      )}
      {state.currentPage === "dream-gate" && (
        <DreamGatePage
          node={selectedNode}
          simulation={selectedSimulation}
          onBackToSimulation={(nodeId) => dispatch({ type: "OPEN_SIMULATION_RESULT", nodeId })}
          onBackToLog={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onOpenChat={(nodeId) => dispatch({ type: "OPEN_CHAT_ENTRY", nodeId })}
        />
      )}
      {state.currentPage === "chat-entry" && (
        <ChatEntryPage
          simulation={selectedSimulation}
          selectedRoamingSceneId={state.selectedRoamingSceneId}
          onBackToLog={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onBackToSimulation={() => dispatch({ type: "OPEN_SIMULATION_RESULT", nodeId: selectedNode.id })}
        />
      )}
    </AppShell>
  );
}
