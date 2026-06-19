import { useCallback, useEffect, useMemo, useReducer } from "react";
import { AppShell, type AppTab } from "./components/AppShell";
import { demoFlowReducer, initialDemoFlowState } from "./state/demoFlow";
import { liveSimulationResultKey } from "./state/liveSimulationKey";
import { loadPersistedState, persistDemoState } from "./state/persistence";
import { ChatEntryPage } from "./pages/ChatEntryPage";
import { DreamGatePage } from "./pages/DreamGatePage";
import { DreamLogPage } from "./pages/DreamLogPage";
import { FriendInvitePage } from "./pages/FriendInvitePage";
import { MessagesPage } from "./pages/MessagesPage";
import { SimulationDetailPage } from "./pages/SimulationDetailPage";
import { TodayPage } from "./pages/TodayPage";
import { TwinCreatePage } from "./pages/TwinCreatePage";
import { TwinGeneratingPage } from "./pages/TwinGeneratingPage";
import { TwinHomePage } from "./pages/TwinHomePage";
import { WaitingPage } from "./pages/WaitingPage";
import { WelcomePage } from "./pages/WelcomePage";
import type { DemoPage, RelationshipSimulationResult } from "./types/dreamtwin";

const pageProgress: Record<DemoPage, { label: string; value: number }> = {
  welcome: { label: "产品解释", value: 8 },
  "twin-create": { label: "创建分身", value: 20 },
  "twin-generating": { label: "生成投影", value: 34 },
  today: { label: "今日首页", value: 42 },
  "twin-home": { label: "分身", value: 48 },
  "dream-log": { label: "梦境地图", value: 56 },
  messages: { label: "消息", value: 60 },
  friends: { label: "好友", value: 60 },
  "friend-invite": { label: "好友", value: 60 },
  "simulation-detail": { label: "关系预演", value: 64 },
  waiting: { label: "等待回应", value: 78 },
  "dream-gate": { label: "梦境门", value: 90 },
  "chat-entry": { label: "真实聊天", value: 100 },
};

function isDemoModeFromUrl(): boolean {
  const search = (globalThis as typeof globalThis & { location?: Location }).location?.search ?? "";
  const params = new URLSearchParams(search);
  return params.get("demo") === "1" || params.get("demo") === "true" || params.has("ux-profile-qa");
}

export function App() {
  const [state, dispatch] = useReducer(demoFlowReducer, initialDemoFlowState, () => loadPersistedState());

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
  const friendInviteNode = useMemo(
    () => state.nodes.find((node) => node.entryMode === "friend_invite") ?? state.nodes[0],
    [state.nodes],
  );
  const selectedLiveResultKey = useMemo(
    () =>
      liveSimulationResultKey(
        selectedNode.id,
        selectedSimulation.entryMode === "friend_invite" ? state.selectedRoamingSceneId : null,
      ),
    [selectedNode.id, selectedSimulation.entryMode, state.selectedRoamingSceneId],
  );
  const openNodeFromSurface = (nodeId: string) => {
    const node = state.nodes.find((item) => item.id === nodeId);
    if (node?.status === "in_chat") {
      dispatch({ type: "OPEN_CHAT_ENTRY", nodeId });
      return;
    }
    if (node?.status === "opened") {
      dispatch({ type: "OPEN_DREAM_GATE", nodeId });
      return;
    }
    if (node?.status === "waiting") {
      dispatch({ type: "OPEN_WAITING", nodeId });
      return;
    }
    dispatch({ type: "SELECT_NODE", nodeId });
  };
  const continueNode = (nodeId: string) => {
    const node = state.nodes.find((item) => item.id === nodeId);
    if (node?.status === "in_chat") {
      dispatch({ type: "OPEN_CHAT_ENTRY", nodeId });
      return;
    }
    if (node?.status === "opened") {
      dispatch({ type: "OPEN_DREAM_GATE", nodeId });
      return;
    }
    if (node?.status === "waiting") {
      dispatch({ type: "OPEN_WAITING", nodeId });
      return;
    }
    if (node?.status === "both_entered") {
      dispatch({ type: "SIMULATE_COUNTERPART_CONFIRM", nodeId });
      return;
    }
    dispatch({ type: "ENTER_DREAM", nodeId });
  };
  const confirmWaitingNode = (nodeId: string) => {
    const node = state.nodes.find((item) => item.id === nodeId);
    if (node?.status === "in_chat") {
      dispatch({ type: "OPEN_CHAT_ENTRY", nodeId });
      return;
    }
    if (node?.status === "opened") {
      dispatch({ type: "OPEN_DREAM_GATE", nodeId });
      return;
    }
    if (selectedSimulation.entryMode === "friend_invite") {
      dispatch({ type: "SIMULATE_FRIEND_ACCEPT", nodeId });
      return;
    }
    dispatch({ type: "SIMULATE_COUNTERPART_CONFIRM", nodeId });
  };
  const storeLiveSimulationResult = useCallback((resultKey: string, result: RelationshipSimulationResult) => {
    dispatch({ type: "STORE_LIVE_SIMULATION_RESULT", resultKey, result });
  }, []);

  const canGoBack = (state.pageHistory ?? []).length > 0;
  const showDemoChrome = useMemo(() => isDemoModeFromUrl(), []);
  const currentProgress = pageProgress[state.currentPage] ?? pageProgress.welcome;
  const progressLabel = `${Math.round(currentProgress.value)}%`;
  const stepLabel = currentProgress.label;
  const showTabs =
    state.hasCompletedTwinSetup &&
    state.currentPage !== "welcome" &&
    state.currentPage !== "twin-create" &&
    state.currentPage !== "twin-generating";
  const activeTab: AppTab =
    state.currentPage === "messages" || state.currentPage === "chat-entry"
      ? "messages"
      : state.currentPage === "friends" || state.currentPage === "friend-invite"
        ? "friends"
        : state.currentPage === "twin-home"
          ? "twin"
          : state.currentPage === "today"
            ? "today"
            : "dream";
  const navigateTab = (tab: AppTab) => {
    if (tab === "today") dispatch({ type: "OPEN_TODAY" });
    if (tab === "dream") dispatch({ type: "OPEN_DREAM_LOG" });
    if (tab === "messages") dispatch({ type: "OPEN_MESSAGES" });
    if (tab === "friends") dispatch({ type: "OPEN_FRIENDS" });
    if (tab === "twin") dispatch({ type: "OPEN_TWIN_HOME" });
  };

  useEffect(() => {
    persistDemoState(state);
  }, [state]);

  return (
    <AppShell
      activeTab={activeTab}
      canGoBack={canGoBack}
      progressLabel={progressLabel}
      progressValue={currentProgress.value}
      showDemoChrome={showDemoChrome}
      showTabs={showTabs}
      stepLabel={stepLabel}
      onBack={() => dispatch({ type: "GO_BACK" })}
      onNavigateTab={navigateTab}
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
        <TwinGeneratingPage
          profile={state.profile}
          twin={state.twin}
          onComplete={(twin) => dispatch({ type: "COMPLETE_TWIN_GENERATION", twin })}
        />
      )}
      {state.currentPage === "today" && (
        <TodayPage
          dreamInviteStatus={state.dreamInviteStatus}
          friends={state.friends}
          nodes={state.nodes}
          simulations={state.simulations}
          twin={state.twin}
          onContinueNode={openNodeFromSurface}
          onOpenDreamMap={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onOpenFriends={() => dispatch({ type: "OPEN_FRIENDS" })}
          onOpenMessages={() => dispatch({ type: "OPEN_MESSAGES" })}
          onOpenTwin={() => dispatch({ type: "OPEN_TWIN_HOME" })}
        />
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
          onSelectNode={openNodeFromSurface}
        />
      )}
      {(state.currentPage === "friends" || state.currentPage === "friend-invite") && (
        <FriendInvitePage
          friends={state.friends}
          inviteStatus={state.dreamInviteStatus}
          node={friendInviteNode}
          selectedFriendId={state.selectedFriendId}
          simulation={friendInviteSimulation}
          onInvite={(friendId) => dispatch({ type: "SEND_DREAM_INVITE", friendId })}
          onOpenDreamMap={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onSelectFriend={(friendId) => dispatch({ type: "SELECT_FRIEND", friendId })}
        />
      )}
      {state.currentPage === "messages" && (
        <MessagesPage
          nodes={state.nodes}
          simulations={state.simulations}
          onOpenChat={(nodeId) => dispatch({ type: "OPEN_CHAT_ENTRY", nodeId })}
          onOpenDreamMap={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onReviewNode={openNodeFromSurface}
        />
      )}
      {state.currentPage === "simulation-detail" && (
        <SimulationDetailPage
          node={selectedNode}
          profile={state.profile}
          resultStorageKey={selectedLiveResultKey}
          simulation={selectedSimulation}
          selectedRoamingSceneId={state.selectedRoamingSceneId}
          resumeAtOutcome={
            state.resumeAtOutcomeNodeId === selectedNode.id ||
            selectedNode.status === "both_entered" ||
            selectedNode.status === "waiting" ||
            selectedNode.status === "opened"
          }
          onBackToLog={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onContinue={continueNode}
          onLiveSimulationResult={storeLiveSimulationResult}
          onSelectRoamingScene={(sceneId) => dispatch({ type: "SELECT_ROAMING_SCENE", sceneId })}
        />
      )}
      {state.currentPage === "waiting" && (
        <WaitingPage
          node={selectedNode}
          simulation={selectedSimulation}
          onBackToSimulation={(nodeId) =>
            selectedSimulation.entryMode === "friend_invite"
              ? dispatch({ type: "OPEN_FRIENDS" })
              : dispatch({ type: "OPEN_SIMULATION_RESULT", nodeId })
          }
          onConfirm={confirmWaitingNode}
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
          liveSimulationResult={state.liveSimulationResults?.[selectedLiveResultKey]}
          simulation={selectedSimulation}
          selectedRoamingSceneId={state.selectedRoamingSceneId}
          onBackToLog={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onBackToSimulation={() => dispatch({ type: "OPEN_SIMULATION_RESULT", nodeId: selectedNode.id })}
        />
      )}
    </AppShell>
  );
}
