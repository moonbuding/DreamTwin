import { useCallback, useEffect, useMemo, useReducer } from "react";
import { AppShell, type AppTab } from "./components/AppShell";
import { demoFlowReducer, initialDemoFlowState } from "./state/demoFlow";
import { liveSimulationResultKey } from "./state/liveSimulationKey";
import { loadPersistedState, persistDemoState } from "./state/persistence";
import { AuthApiError, fetchMe } from "./api/authApi";
import { saveTwin as saveTwinToBackend, setAuthToken } from "./api/dreamTwinApi";
import { AuthPage } from "./pages/AuthPage";
import { ChatEntryPage } from "./pages/ChatEntryPage";
import { DreamGatePage } from "./pages/DreamGatePage";
import { DreamLogPage } from "./pages/DreamLogPage";
import { FriendsHubPage } from "./pages/FriendsHubPage";
import { SimulationDetailPage } from "./pages/SimulationDetailPage";
import { TodayPage } from "./pages/TodayPage";
import { TwinCreatePage } from "./pages/TwinCreatePage";
import { TwinGeneratingPage } from "./pages/TwinGeneratingPage";
import { TwinHomePage } from "./pages/TwinHomePage";
import { WaitingPage } from "./pages/WaitingPage";
import { WelcomePage } from "./pages/WelcomePage";
import type { DemoPage, RelationshipSimulationResult } from "./types/dreamtwin";

const pageProgress: Record<DemoPage, { label: string; value: number }> = {
  auth: { label: "登录注册", value: 4 },
  welcome: { label: "产品解释", value: 8 },
  "twin-create": { label: "创建分身", value: 20 },
  "twin-generating": { label: "生成投影", value: 34 },
  today: { label: "今日首页", value: 42 },
  plaza: { label: "广场", value: 46 },
  "twin-home": { label: "我的", value: 48 },
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
  const openFriendSceneFromMap = (sceneId: string, nodeId: string) => {
    dispatch({ type: "SELECT_ROAMING_SCENE", sceneId });
    dispatch({ type: "OPEN_ROAMING_SIMULATION", nodeId });
  };
  const storeLiveSimulationResult = useCallback((resultKey: string, result: RelationshipSimulationResult) => {
    dispatch({ type: "STORE_LIVE_SIMULATION_RESULT", resultKey, result });
  }, []);

  const canGoBack = (state.pageHistory ?? []).length > 0;
  const showDemoChrome = useMemo(() => isDemoModeFromUrl(), []);
  const currentProgress = pageProgress[state.currentPage] ?? pageProgress.welcome;
  const progressLabel = `${Math.round(currentProgress.value)}%`;
  const stepLabel = currentProgress.label;
  // Redesigned pages render their own in-page header, so the global topbar is hidden for them.
  const ownHeaderPages: DemoPage[] = [
    "today",
    "plaza",
    "dream-log",
    "messages",
    "friends",
    "friend-invite",
    "twin-home",
    "simulation-detail",
    "waiting",
    "auth",
  ];
  const showTabs =
    state.hasCompletedTwinSetup &&
    state.currentPage !== "welcome" &&
    state.currentPage !== "twin-create" &&
    state.currentPage !== "twin-generating" &&
    state.currentPage !== "simulation-detail";
  const activeTab: AppTab =
    state.currentPage === "messages" ||
    state.currentPage === "chat-entry" ||
    state.currentPage === "friends" ||
    state.currentPage === "friend-invite"
      ? "messages"
      : state.currentPage === "twin-home"
        ? "me"
        : state.currentPage === "today"
          ? "today"
          : "dream";
  const navigateTab = (tab: AppTab) => {
    if (tab === "today") dispatch({ type: "OPEN_TODAY" });
    if (tab === "dream") dispatch({ type: "OPEN_DREAM_TAB" });
    if (tab === "messages") dispatch({ type: "OPEN_MESSAGES" });
    if (tab === "me") dispatch({ type: "OPEN_TWIN_HOME" });
  };

  useEffect(() => {
    persistDemoState(state);
  }, [state]);

  // Keep the API client's bearer token in sync, and refresh the signed-in
  // user's profile/twin from the server (logging out on an invalid token).
  useEffect(() => {
    setAuthToken(state.authToken);
    if (!state.authToken) return;
    let cancelled = false;
    fetchMe(state.authToken)
      .then((me) => {
        if (!cancelled) dispatch({ type: "HYDRATE_PROFILE", profile: me.profile, twin: me.twin });
      })
      .catch((error) => {
        if (!cancelled && error instanceof AuthApiError && error.status === 401) {
          dispatch({ type: "LOGOUT" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [state.authToken]);

  return (
    <AppShell
      activeTab={activeTab}
      canGoBack={canGoBack}
      themeMode={state.themeMode}
      progressLabel={progressLabel}
      progressValue={currentProgress.value}
      showDemoChrome={showDemoChrome}
      showTopbar={showDemoChrome || !ownHeaderPages.includes(state.currentPage)}
      showTabs={showTabs}
      stepLabel={stepLabel}
      onBack={() => dispatch({ type: "GO_BACK" })}
      onNavigateTab={navigateTab}
      onReset={() => dispatch({ type: "RESET_DEMO" })}
    >
      {state.currentPage === "auth" && (
        <AuthPage
          onAuthed={(result) =>
            dispatch({ type: "AUTH_SUCCESS", token: result.token, phone: result.user.phone, hasTwin: result.hasTwin })
          }
        />
      )}
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
          onComplete={(twin) => {
            if (state.authToken && twin) void saveTwinToBackend(twin).catch(() => undefined);
            dispatch({ type: "COMPLETE_TWIN_GENERATION", twin });
          }}
        />
      )}
      {state.currentPage === "today" && (
        <TodayPage
          dreamInviteStatus={state.dreamInviteStatus}
          friends={state.friends}
          nodes={state.nodes}
          sentFirstMessages={state.sentFirstMessages}
          simulations={state.simulations}
          twin={state.twin}
          themeMode={state.themeMode}
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
          themeMode={state.themeMode}
          onSetTheme={(mode) => dispatch({ type: "SET_THEME", mode })}
          onEditTwin={() => dispatch({ type: "EDIT_TWIN" })}
          onLogout={() => dispatch({ type: "LOGOUT" })}
          onBack={() => dispatch({ type: "OPEN_TODAY" })}
        />
      )}
      {state.currentPage === "dream-log" && (
        <DreamLogPage
          nodes={state.nodes}
          simulations={state.simulations}
          selectedRoamingSceneId={state.selectedRoamingSceneId}
          onOpenFriendInvite={() => dispatch({ type: "OPEN_FRIEND_INVITE" })}
          onOpenFriendScene={openFriendSceneFromMap}
          onSelectRoamingScene={(sceneId) => dispatch({ type: "SELECT_ROAMING_SCENE", sceneId })}
          onSelectNode={openNodeFromSurface}
        />
      )}
      {(state.currentPage === "friends" || state.currentPage === "friend-invite" || state.currentPage === "messages") && (
        <FriendsHubPage
          initialSubTab={state.currentPage === "messages" ? "chat" : "contacts"}
          friends={state.friends}
          inviteStatus={state.dreamInviteStatus}
          node={friendInviteNode}
          selectedFriendId={state.selectedFriendId}
          nodes={state.nodes}
          sentFirstMessages={state.sentFirstMessages}
          simulations={state.simulations}
          onInvite={(friendId) => dispatch({ type: "SEND_DREAM_INVITE", friendId })}
          onOpenChat={(nodeId) => dispatch({ type: "OPEN_CHAT_ENTRY", nodeId })}
          onOpenDreamMap={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onOpenWaiting={(nodeId) => dispatch({ type: "OPEN_WAITING", nodeId })}
          onSelectFriend={(friendId) => dispatch({ type: "SELECT_FRIEND", friendId })}
          onReviewNode={openNodeFromSurface}
          onBack={() => dispatch({ type: "OPEN_TODAY" })}
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
          onOpenToday={() => dispatch({ type: "OPEN_TODAY" })}
          onExplore={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          showDemoControls={showDemoChrome}
          onWithdraw={(nodeId) => dispatch({ type: "WITHDRAW_DREAM", nodeId })}
        />
      )}
      {state.currentPage === "dream-gate" && (
        <DreamGatePage
          node={selectedNode}
          selectedRoamingSceneId={state.selectedRoamingSceneId}
          simulation={selectedSimulation}
          onBackToSimulation={(nodeId) => dispatch({ type: "OPEN_SIMULATION_RESULT", nodeId })}
          onBackToLog={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onOpenChat={(nodeId) => dispatch({ type: "OPEN_CHAT_ENTRY", nodeId })}
        />
      )}
      {state.currentPage === "chat-entry" && (
        <ChatEntryPage
          hasSentFirstMessage={selectedNode.status === "in_chat"}
          liveSimulationResult={state.liveSimulationResults?.[selectedLiveResultKey]}
          sentFirstMessage={state.sentFirstMessages?.[selectedNode.id]}
          simulation={selectedSimulation}
          selectedRoamingSceneId={state.selectedRoamingSceneId}
          onBackToLog={() => dispatch({ type: "OPEN_DREAM_LOG" })}
          onBackToSimulation={() => dispatch({ type: "OPEN_SIMULATION_RESULT", nodeId: selectedNode.id })}
          onFirstMessageSent={(text) => dispatch({ type: "MARK_CHAT_SENT", nodeId: selectedNode.id, text })}
          onOpenMessages={() => dispatch({ type: "OPEN_MESSAGES" })}
        />
      )}
    </AppShell>
  );
}
