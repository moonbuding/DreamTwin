import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const qaBuildDir = join(rootDir, ".qa-build");
mkdirSync(qaBuildDir, { recursive: true });
writeFileSync(join(qaBuildDir, "package.json"), "{\"type\":\"commonjs\"}\n");

const require = createRequire(import.meta.url);
const { demoProfile, demoTwin } = require("../.qa-build/src/data/demoData.js");
const { demoFlowReducer, initialDemoFlowState } = require("../.qa-build/src/state/demoFlow.js");
const { liveSimulationResultKey } = require("../.qa-build/src/state/liveSimulationKey.js");
const { selectTodayPrimaryNode } = require("../.qa-build/src/utils/relationshipState.js");
const {
  DEMO_STORAGE_KEY,
  isDemoState,
  loadPersistedState,
  normalizePersistedState,
  persistDemoState,
} = require("../.qa-build/src/state/persistence.js");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function reduce(state, action) {
  return demoFlowReducer(state, action);
}

function nodeStatus(state, nodeId) {
  return state.nodes.find((node) => node.id === nodeId)?.status;
}

function createMemoryStorage() {
  const items = new Map();
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => {
      items.set(key, String(value));
    },
    removeItem: (key) => {
      items.delete(key);
    },
    clear: () => {
      items.clear();
    },
  };
}

function makeResult(label) {
  return {
    conclusion: `${label} 可能成为一次低压关系预演。`,
    attractionScore: 72,
    paceScore: 61,
    riskScore: 34,
    likelyDialogue: [`${label} 会先从共同场景聊起。`],
    behaviorPreview: [`${label} 会保留退出空间。`],
    relationshipTrajectory: [`${label} 有机会带回真实聊天。`],
    romancePossibility: `${label} 或许存在亲密想象。`,
    conflictRisk: "如果急着定义关系，可能增加压力。",
    badOutcomeScenario: "如果忽略边界，关系可能后退。",
    suggestedMove: `${label} 建议先轻轻开启话题。`,
    possibleFirstLine: `${label} 第一句话。`,
    safetyHint: "AI 只提供关系预演，不替用户判断或聊天。",
  };
}

function completeTwinSetup() {
  let state = initialDemoFlowState;
  assert(state.currentPage === "auth", "Initial state should require login/register first.");
  state = reduce(state, { type: "AUTH_SUCCESS", token: "test-token", phone: "13800138000", hasTwin: false });
  assert(state.authToken === "test-token", "AUTH_SUCCESS should store the auth token.");
  assert(state.currentPage === "twin-create", "Registering a new account should open twin-create.");
  state = reduce(state, { type: "START_TWIN_CREATE" });
  assert(state.currentPage === "twin-create", "START_TWIN_CREATE should open twin-create.");
  state = reduce(state, { type: "SUBMIT_TWIN_PROFILE", profile: demoProfile });
  assert(state.currentPage === "twin-generating", "SUBMIT_TWIN_PROFILE should open twin-generating.");
  assert(Object.keys(state.liveSimulationResults).length === 0, "Submitting a profile should clear live results.");
  state = reduce(state, { type: "COMPLETE_TWIN_GENERATION", twin: demoTwin });
  assert(state.currentPage === "today", "COMPLETE_TWIN_GENERATION should open today.");
  assert(state.hasCompletedTwinSetup, "Twin setup should be marked complete.");
  assert(state.pageHistory.length === 0, "Today should reset page history after setup.");
  return state;
}

function assertOvernightDiscoveryFlow() {
  let state = completeTwinSetup();
  state = reduce(state, { type: "ENTER_DREAM_PLAZA" });
  assert(state.currentPage === "dream-log", "ENTER_DREAM_PLAZA should open dream-log.");
  assert(state.pageHistory[0] === "today", "Dream plaza should return to today.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "today", "GO_BACK from dream-log should return to today.");
  assert(state.pageHistory.length === 0, "GO_BACK from dream-log should clear history.");

  state = reduce(state, { type: "OPEN_DREAM_TAB" });
  assert(state.currentPage === "dream-log", "Bottom dream tab should open dream-log.");
  assert(state.pageHistory.length === 0, "Bottom dream tab should behave like a top-level tab.");

  state = reduce(state, { type: "ENTER_DREAM_PLAZA" });
  state = reduce(state, { type: "SELECT_NODE", nodeId: "node-rain-store" });
  assert(state.currentPage === "simulation-detail", "SELECT_NODE should open simulation-detail.");
  assert(nodeStatus(state, "node-rain-store") === "viewed", "Selecting a new node should mark it viewed.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "dream-log", "GO_BACK from simulation-detail should return to dream-log.");
  assert(nodeStatus(state, "node-rain-store") === "viewed", "GO_BACK should not reset a viewed node.");

  state = reduce(state, { type: "SELECT_NODE", nodeId: "node-rain-store" });
  state = reduce(state, { type: "ENTER_DREAM", nodeId: "node-rain-store" });
  assert(state.currentPage === "waiting", "ENTER_DREAM should open waiting.");
  assert(nodeStatus(state, "node-rain-store") === "waiting", "ENTER_DREAM should mark node waiting.");

  state = reduce(state, { type: "OPEN_TODAY" });
  assert(state.currentPage === "today", "Real app waiting state should be able to return to today.");
  assert(nodeStatus(state, "node-rain-store") === "waiting", "Returning to today should preserve the waiting node.");

  state = reduce(state, { type: "OPEN_MESSAGES" });
  assert(state.currentPage === "messages", "Waiting relationships should also be visible from messages status reminders.");
  assert(nodeStatus(state, "node-rain-store") === "waiting", "Opening messages should preserve waiting status.");

  state = reduce(state, { type: "OPEN_WAITING", nodeId: "node-rain-store" });
  assert(state.currentPage === "waiting", "OPEN_WAITING should reopen the waiting screen from app surfaces.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "messages", "GO_BACK from a surface-opened waiting state should return to the previous app surface.");
  assert(nodeStatus(state, "node-rain-store") === "waiting", "GO_BACK should preserve waiting status.");

  state = reduce(state, { type: "OPEN_SIMULATION_RESULT", nodeId: "node-rain-store" });
  state = reduce(state, { type: "ENTER_DREAM", nodeId: "node-rain-store" });
  state = reduce(state, { type: "SIMULATE_COUNTERPART_CONFIRM", nodeId: "node-rain-store" });
  assert(state.currentPage === "dream-gate", "Counterpart confirm should open dream-gate.");
  assert(nodeStatus(state, "node-rain-store") === "opened", "Counterpart confirm should open the node.");

  state = reduce(state, { type: "OPEN_MESSAGES" });
  assert(state.currentPage === "messages", "Opened dream gates should be reachable from messages.");
  assert(nodeStatus(state, "node-rain-store") === "opened", "Opening messages should preserve opened status.");

  state = reduce(state, { type: "OPEN_DREAM_GATE", nodeId: "node-rain-store" });
  assert(state.currentPage === "dream-gate", "OPEN_DREAM_GATE should reopen the gate from messages or today.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "messages", "GO_BACK from a surface-opened dream-gate should return to the previous app surface.");
  assert(nodeStatus(state, "node-rain-store") === "opened", "GO_BACK should preserve opened status.");

  state = reduce(state, { type: "OPEN_DREAM_GATE", nodeId: "node-rain-store" });
  state = reduce(state, { type: "OPEN_CHAT_ENTRY", nodeId: "node-rain-store" });
  assert(state.currentPage === "chat-entry", "OPEN_CHAT_ENTRY should open chat-entry.");
  assert(nodeStatus(state, "node-rain-store") === "opened", "Opening chat-entry should not mark the relationship in-chat before sending.");
  state = reduce(state, { type: "MARK_CHAT_SENT", nodeId: "node-rain-store", text: "我想把刚才的预演带回现实聊聊。" });
  assert(nodeStatus(state, "node-rain-store") === "in_chat", "Sending the first line should mark the relationship in-chat.");
  assert(
    state.sentFirstMessages["node-rain-store"] === "我想把刚才的预演带回现实聊聊。",
    "Sending the first line should persist the user's actual first message.",
  );
}

function assertFriendInviteFlowAndLiveIsolation() {
  let state = completeTwinSetup();
  state = reduce(state, { type: "OPEN_FRIEND_INVITE" });
  assert(state.currentPage === "friends", "OPEN_FRIEND_INVITE should open friends.");
  assert(state.pageHistory.length === 0, "Friend tab should reset page history.");

  state = reduce(state, { type: "SELECT_ROAMING_SCENE", sceneId: "starlight" });
  state = reduce(state, { type: "SEND_DREAM_INVITE", friendId: "friend-mika", sceneId: "starlight" });
  assert(state.currentPage === "waiting", "SEND_DREAM_INVITE should open waiting.");
  assert(state.selectedRoamingSceneId === "starlight", "Friend invite should keep selected roaming scene.");
  assert(state.dreamInviteStatus === "sent", "Friend invite status should become sent.");
  assert(nodeStatus(state, "node-friend-mika") === "waiting", "Friend invite node should become waiting.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "friends", "GO_BACK from friend waiting should return to friends.");
  assert(state.dreamInviteStatus === "sent", "GO_BACK from friend waiting should preserve sent invite status.");
  assert(nodeStatus(state, "node-friend-mika") === "waiting", "GO_BACK from friend waiting should preserve waiting node.");

  state = reduce(state, { type: "SEND_DREAM_INVITE", friendId: "friend-mika", sceneId: "starlight" });
  state = reduce(state, { type: "SIMULATE_FRIEND_ACCEPT", nodeId: "node-friend-mika" });
  assert(state.currentPage === "dream-log", "Friend accept should return to the unified dream map.");
  assert(state.dreamInviteStatus === "accepted", "Friend accept should mark invite accepted.");
  assert(nodeStatus(state, "node-friend-mika") === "both_entered", "Friend accept should mark both sides entered.");

  state = reduce(state, { type: "OPEN_TODAY" });
  assert(state.currentPage === "today", "Accepted friend invite should be visible from today.");
  state = reduce(state, { type: "OPEN_DREAM_LOG" });
  assert(state.currentPage === "dream-log", "Both-entered friend states should route through the unified dream map before shared simulation.");
  assert(nodeStatus(state, "node-friend-mika") === "both_entered", "Opening the unified map should preserve both-entered friend state.");

  state = reduce(state, { type: "SELECT_ROAMING_SCENE", sceneId: "movie" });
  state = reduce(state, { type: "OPEN_ROAMING_SIMULATION", nodeId: "node-friend-mika" });
  assert(state.currentPage === "simulation-detail", "Choosing a friend scene from the unified map should open shared simulation.");
  assert(state.selectedRoamingSceneId === "movie", "Shared scene choice from the map should be preserved.");
  assert(nodeStatus(state, "node-friend-mika") === "both_entered", "Choosing a friend scene should preserve both-entered status.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "dream-log", "GO_BACK from accepted friend simulation should return to dream-log.");
  assert(state.dreamInviteStatus === "accepted", "GO_BACK should preserve accepted friend invite status.");
  assert(nodeStatus(state, "node-friend-mika") === "both_entered", "GO_BACK should preserve both-entered friend node.");

  state = reduce(state, { type: "SELECT_NODE", nodeId: "node-friend-mika" });
  state = reduce(state, { type: "SIMULATE_COUNTERPART_CONFIRM", nodeId: "node-friend-mika" });
  assert(state.currentPage === "dream-gate", "Confirming the accepted friend simulation should open dream-gate.");
  assert(nodeStatus(state, "node-friend-mika") === "opened", "Confirming the accepted friend simulation should open friend node.");

  const movieKey = liveSimulationResultKey("node-friend-mika", "movie");
  const starKey = liveSimulationResultKey("node-friend-mika", "starlight");
  const seaKey = liveSimulationResultKey("node-friend-mika", "undersea");
  const standaloneKey = liveSimulationResultKey("node-rain-store", null);
  assert(movieKey === "node-friend-mika:movie", "Friend map scene key should include the selected scene.");
  assert(starKey === "node-friend-mika:starlight", "Friend scene key should include roaming scene.");
  assert(seaKey === "node-friend-mika:undersea", "Different roaming scenes need different keys.");
  assert(standaloneKey === "node-rain-store", "Overnight node key should stay node-only.");

  state = reduce(state, { type: "STORE_LIVE_SIMULATION_RESULT", resultKey: movieKey, result: makeResult("电影") });
  state = reduce(state, { type: "STORE_LIVE_SIMULATION_RESULT", resultKey: seaKey, result: makeResult("海底") });
  assert(state.liveSimulationResults[movieKey].possibleFirstLine === "电影 第一句话。", "Map-selected friend scene result should be stored by scene key.");
  assert(state.liveSimulationResults[seaKey].possibleFirstLine === "海底 第一句话。", "Sea result should be stored by scene key.");
  assert(
    state.liveSimulationResults[movieKey].possibleFirstLine !== state.liveSimulationResults[seaKey].possibleFirstLine,
    "Different friend scenes must not overwrite each other.",
  );

  state = reduce(state, { type: "OPEN_DREAM_GATE", nodeId: "node-friend-mika" });
  assert(state.currentPage === "dream-gate", "Opened friend simulation should continue to dream-gate.");
  assert(nodeStatus(state, "node-friend-mika") === "opened", "Opening friend dream gate should preserve opened status.");

  state = reduce(state, { type: "OPEN_CHAT_ENTRY", nodeId: "node-friend-mika" });
  assert(state.currentPage === "chat-entry", "Opened friend gate should continue to chat-entry.");
  assert(nodeStatus(state, "node-friend-mika") === "opened", "Opening friend chat-entry should not mark in-chat before sending.");
  state = reduce(state, { type: "MARK_CHAT_SENT", nodeId: "node-friend-mika", text: "刚才那个星际梦境，我有点想听你的真实版本。" });
  assert(nodeStatus(state, "node-friend-mika") === "in_chat", "Sending a friend first line should mark the relationship in-chat.");
  assert(
    state.sentFirstMessages["node-friend-mika"] === "刚才那个星际梦境，我有点想听你的真实版本。",
    "Sending a friend first line should persist the user's actual friend message.",
  );
  assert(state.selectedRoamingSceneId === "movie", "Friend chat should keep the selected roaming scene.");
  assert(
    state.liveSimulationResults[movieKey].possibleFirstLine === "电影 第一句话。",
    "Friend chat should still be able to read the scene-specific live result.",
  );
}

function assertWithdrawAndReset() {
  let state = completeTwinSetup();
  state = reduce(state, { type: "SEND_DREAM_INVITE", friendId: "friend-mika", sceneId: "undersea" });
  state = reduce(state, { type: "WITHDRAW_DREAM", nodeId: "node-friend-mika" });
  assert(state.currentPage === "friends", "Withdrawing friend invite should return to friends.");
  assert(state.dreamInviteStatus === "withdrawn", "Withdrawing friend invite should mark status withdrawn.");
  assert(nodeStatus(state, "node-friend-mika") === "unviewed", "Withdrawing friend invite should reset friend node.");

  state = reduce(state, {
    type: "STORE_LIVE_SIMULATION_RESULT",
    resultKey: liveSimulationResultKey("node-friend-mika", "undersea"),
    result: makeResult("海底"),
  });
  state = reduce(state, { type: "RESET_DEMO" });
  assert(state.currentPage === "auth", "RESET_DEMO should return to the auth gate.");
  assert(state.authToken === null, "RESET_DEMO should clear the auth token.");
  assert(!state.hasCompletedTwinSetup, "RESET_DEMO should clear completed twin setup.");
  assert(Object.keys(state.liveSimulationResults).length === 0, "RESET_DEMO should clear live results.");
  assert(Object.keys(state.sentFirstMessages).length === 0, "RESET_DEMO should clear sent first messages.");
  assert(state.selectedRoamingSceneId === "undersea", "RESET_DEMO should restore default roaming scene.");
}

function assertEditingTwinResetsGeneratedState() {
  let state = completeTwinSetup();
  const liveResultKey = liveSimulationResultKey("node-friend-mika", "starlight");

  state = reduce(state, { type: "SELECT_NODE", nodeId: "node-rain-store" });
  state = reduce(state, { type: "ENTER_DREAM", nodeId: "node-rain-store" });
  state = reduce(state, { type: "SIMULATE_COUNTERPART_CONFIRM", nodeId: "node-rain-store" });
  state = reduce(state, { type: "STORE_LIVE_SIMULATION_RESULT", resultKey: liveResultKey, result: makeResult("星际") });
  assert(nodeStatus(state, "node-rain-store") === "opened", "Setup should create an opened node before re-editing.");
  assert(Object.keys(state.liveSimulationResults).length === 1, "Setup should create a live result before re-editing.");

  state = reduce(state, { type: "OPEN_TWIN_HOME" });
  state = reduce(state, { type: "EDIT_TWIN" });
  assert(state.currentPage === "twin-create", "EDIT_TWIN should open twin-create.");

  const editedProfile = {
    ...demoProfile,
    nickname: "新林星",
    relationshipIntention: "想用更清晰的方式靠近一个真实的人",
    interests: ["星空漫游", ...demoProfile.interests.slice(1)],
  };

  state = reduce(state, { type: "SUBMIT_TWIN_PROFILE", profile: editedProfile });
  assert(state.currentPage === "twin-generating", "Re-submitting a profile should open twin-generating.");
  assert(!state.hasCompletedTwinSetup, "Re-submitting a profile should mark setup incomplete until generation finishes.");
  assert(state.profile.nickname === "新林星", "Re-submitting should keep the edited profile.");
  assert(state.selectedNodeId === null, "Re-submitting should clear selected node.");
  assert(state.selectedFriendId === "friend-mika", "Re-submitting should restore the default friend.");
  assert(state.selectedRoamingSceneId === "undersea", "Re-submitting should restore the default roaming scene.");
  assert(state.dreamInviteStatus === "draft", "Re-submitting should reset invite status.");
  assert(state.resumeAtOutcomeNodeId === null, "Re-submitting should clear resume target.");
  assert(Object.keys(state.liveSimulationResults).length === 0, "Re-submitting should clear live results.");
  assert(Object.keys(state.sentFirstMessages).length === 0, "Re-submitting should clear sent first messages.");
  assert(state.nodes.every((node) => node.status === "unviewed"), "Re-submitting should reset all dream node statuses.");
  assert(
    state.simulations.some((simulation) => simulation.scene.includes("星空漫游")),
    "Re-submitting should regenerate simulations from the edited profile.",
  );

  state = reduce(state, { type: "COMPLETE_TWIN_GENERATION" });
  assert(state.currentPage === "today", "Completing edited twin generation should return to today.");
  assert(state.hasCompletedTwinSetup, "Completing edited twin generation should mark setup complete again.");
  assert(state.pageHistory.length === 0, "Completing edited twin generation should reset page history.");
}

function assertPersistedStateRecovery() {
  let state = completeTwinSetup();
  const starKey = liveSimulationResultKey("node-friend-mika", "starlight");

  state = reduce(state, { type: "OPEN_FRIEND_INVITE" });
  state = reduce(state, { type: "SELECT_ROAMING_SCENE", sceneId: "starlight" });
  state = reduce(state, { type: "SEND_DREAM_INVITE", friendId: "friend-mika", sceneId: "starlight" });
  state = reduce(state, { type: "SIMULATE_FRIEND_ACCEPT", nodeId: "node-friend-mika" });
  state = reduce(state, { type: "STORE_LIVE_SIMULATION_RESULT", resultKey: starKey, result: makeResult("星际") });
  state = reduce(state, { type: "OPEN_DREAM_GATE", nodeId: "node-friend-mika" });
  state = reduce(state, { type: "OPEN_CHAT_ENTRY", nodeId: "node-friend-mika" });
  state = reduce(state, { type: "MARK_CHAT_SENT", nodeId: "node-friend-mika", text: "我想知道你会怎么记住这段星光。" });
  assert(state.currentPage === "chat-entry", "Setup should reach chat-entry before persistence recovery.");
  assert(Object.keys(state.liveSimulationResults).length === 1, "Setup should include one live result before persistence recovery.");

  const recovered = normalizePersistedState(state);
  assert(recovered.currentPage === "today", "Reload after completed setup should return to today.");
  assert(recovered.pageHistory.length === 0, "Reload should clear page history.");
  assert(recovered.hasCompletedTwinSetup, "Reload should preserve completed twin setup.");
  assert(Object.keys(recovered.liveSimulationResults).length === 0, "Reload should clear live results to avoid stale AI content.");
  assert(nodeStatus(recovered, "node-friend-mika") === "in_chat", "Reload should preserve friend chat status.");
  assert(
    recovered.sentFirstMessages["node-friend-mika"] === "我想知道你会怎么记住这段星光。",
    "Reload should preserve the sent first message for message continuity.",
  );
  assert(recovered.selectedRoamingSceneId === "starlight", "Reload should preserve selected friend roaming scene.");
  assert(
    recovered.simulations.some((simulation) => simulation.scene.includes(state.profile.interests[0])),
    "Reload should regenerate simulations from the persisted profile.",
  );

  const unfinished = normalizePersistedState({
    ...initialDemoFlowState,
    authToken: "test-token",
    currentPage: "twin-create",
    pageHistory: [],
    hasCompletedTwinSetup: false,
  });
  assert(unfinished.currentPage === "twin-create", "Reload before setup completion should keep the current creation page.");
  assert(!unfinished.hasCompletedTwinSetup, "Reload before setup completion should not mark twin setup complete.");

  const legacyCompleted = { ...state };
  delete legacyCompleted.hasCompletedTwinSetup;
  const recoveredLegacy = normalizePersistedState(legacyCompleted);
  assert(recoveredLegacy.currentPage === "today", "Legacy completed states should infer twin setup and recover to today.");
  assert(recoveredLegacy.hasCompletedTwinSetup, "Legacy completed states should infer completed twin setup.");

  assert(isDemoState(state), "A valid flow state should pass the persisted state guard.");
  assert(!isDemoState({ ...state, simulations: [{ scenarios: null }] }), "Invalid simulation payloads should fail the persisted state guard.");

  const storage = createMemoryStorage();
  persistDemoState(state, storage);
  assert(storage.getItem(DEMO_STORAGE_KEY), "Persisting state should write the current storage key.");
  const loaded = loadPersistedState(storage);
  assert(loaded.currentPage === "today", "Loading persisted state should normalize back to today.");
  assert(Object.keys(loaded.liveSimulationResults).length === 0, "Loading persisted state should clear stale live results.");
  assert(
    loaded.sentFirstMessages["node-friend-mika"] === "我想知道你会怎么记住这段星光。",
    "Loading persisted state should keep sent first messages.",
  );

  const invalidStorage = createMemoryStorage();
  invalidStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ currentPage: "chat-entry" }));
  const invalidLoaded = loadPersistedState(invalidStorage);
  assert(invalidLoaded.currentPage === "auth", "Invalid persisted payloads should fall back to the initial auth gate.");
}

function assertTodayPrimaryNodePriority() {
  let state = completeTwinSetup();

  assert(selectTodayPrimaryNode(state.nodes)?.id === "node-rain-store", "Today should default to the first unviewed AI preview.");

  state = {
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === "node-rain-store"
        ? { ...node, status: "in_chat" }
        : node.id === "node-seaside-radio"
          ? { ...node, status: "unviewed" }
          : node,
    ),
  };
  assert(
    selectTodayPrimaryNode(state.nodes)?.id === "node-rain-store",
    "Today should prioritize a sent first line waiting for a real reply over a fresh preview.",
  );

  state = {
    ...state,
    nodes: state.nodes.map((node) =>
      node.id === "node-moon-platform"
        ? { ...node, status: "waiting" }
        : node.id === "node-friend-mika"
          ? { ...node, status: "both_entered" }
          : node,
    ),
  };
  assert(
    selectTodayPrimaryNode(state.nodes)?.id === "node-friend-mika",
    "Today should prioritize a both-entered friend dream over passive waiting states.",
  );

  state = {
    ...state,
    nodes: state.nodes.map((node) => (node.id === "node-moon-platform" ? { ...node, status: "opened" } : node)),
  };
  assert(selectTodayPrimaryNode(state.nodes)?.id === "node-moon-platform", "Today should prioritize opened dream gates first.");
}

assertOvernightDiscoveryFlow();
assertFriendInviteFlowAndLiveIsolation();
assertWithdrawAndReset();
assertEditingTwinResetsGeneratedState();
assertPersistedStateRecovery();
assertTodayPrimaryNodePriority();

console.log("DreamTwin state flow QA passed.");
