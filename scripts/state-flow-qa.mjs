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
  state = reduce(state, { type: "START_TWIN_CREATE" });
  assert(state.currentPage === "twin-create", "START_TWIN_CREATE should open twin-create.");
  state = reduce(state, { type: "SUBMIT_TWIN_PROFILE", profile: demoProfile });
  assert(state.currentPage === "twin-generating", "SUBMIT_TWIN_PROFILE should open twin-generating.");
  assert(Object.keys(state.liveSimulationResults).length === 0, "Submitting a profile should clear live results.");
  state = reduce(state, { type: "COMPLETE_TWIN_GENERATION", twin: demoTwin });
  assert(state.currentPage === "twin-home", "COMPLETE_TWIN_GENERATION should open twin-home.");
  assert(state.hasCompletedTwinSetup, "Twin setup should be marked complete.");
  assert(state.pageHistory.length === 0, "Twin home should reset page history after setup.");
  return state;
}

function assertOvernightDiscoveryFlow() {
  let state = completeTwinSetup();
  state = reduce(state, { type: "ENTER_DREAM_PLAZA" });
  assert(state.currentPage === "dream-log", "ENTER_DREAM_PLAZA should open dream-log.");
  assert(state.pageHistory[0] === "twin-home", "Dream plaza should return to twin-home.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "twin-home", "GO_BACK from dream-log should return to twin-home.");
  assert(state.pageHistory.length === 0, "GO_BACK from dream-log should clear history.");

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

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "simulation-detail", "GO_BACK from waiting should return to simulation-detail.");
  assert(nodeStatus(state, "node-rain-store") === "waiting", "GO_BACK should preserve waiting status.");

  state = reduce(state, { type: "ENTER_DREAM", nodeId: "node-rain-store" });
  state = reduce(state, { type: "SIMULATE_COUNTERPART_CONFIRM", nodeId: "node-rain-store" });
  assert(state.currentPage === "dream-gate", "Counterpart confirm should open dream-gate.");
  assert(nodeStatus(state, "node-rain-store") === "opened", "Counterpart confirm should open the node.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "waiting", "GO_BACK from dream-gate should return to waiting.");
  assert(nodeStatus(state, "node-rain-store") === "opened", "GO_BACK should preserve opened status.");

  state = reduce(state, { type: "OPEN_DREAM_GATE", nodeId: "node-rain-store" });
  state = reduce(state, { type: "OPEN_CHAT_ENTRY", nodeId: "node-rain-store" });
  assert(state.currentPage === "chat-entry", "OPEN_CHAT_ENTRY should open chat-entry.");
}

function assertFriendInviteFlowAndLiveIsolation() {
  let state = completeTwinSetup();
  state = reduce(state, { type: "OPEN_FRIEND_INVITE" });
  assert(state.currentPage === "friend-invite", "OPEN_FRIEND_INVITE should open friend-invite.");
  assert(state.pageHistory[0] === "twin-home", "Friend invite should return to twin-home.");

  state = reduce(state, { type: "SELECT_ROAMING_SCENE", sceneId: "starlight" });
  state = reduce(state, { type: "SEND_DREAM_INVITE", friendId: "friend-mika", sceneId: "starlight" });
  assert(state.currentPage === "waiting", "SEND_DREAM_INVITE should open waiting.");
  assert(state.selectedRoamingSceneId === "starlight", "Friend invite should keep selected roaming scene.");
  assert(state.dreamInviteStatus === "sent", "Friend invite status should become sent.");
  assert(nodeStatus(state, "node-friend-mika") === "waiting", "Friend invite node should become waiting.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "friend-invite", "GO_BACK from friend waiting should return to friend-invite.");
  assert(state.dreamInviteStatus === "sent", "GO_BACK from friend waiting should preserve sent invite status.");
  assert(nodeStatus(state, "node-friend-mika") === "waiting", "GO_BACK from friend waiting should preserve waiting node.");

  state = reduce(state, { type: "SEND_DREAM_INVITE", friendId: "friend-mika", sceneId: "starlight" });
  state = reduce(state, { type: "SIMULATE_FRIEND_ACCEPT", nodeId: "node-friend-mika" });
  assert(state.currentPage === "simulation-detail", "Friend accept should open shared simulation.");
  assert(state.dreamInviteStatus === "accepted", "Friend accept should mark invite accepted.");
  assert(nodeStatus(state, "node-friend-mika") === "opened", "Friend accept should open friend node.");

  state = reduce(state, { type: "GO_BACK" });
  assert(state.currentPage === "waiting", "GO_BACK from accepted friend simulation should return to waiting.");
  assert(state.dreamInviteStatus === "accepted", "GO_BACK should preserve accepted friend invite status.");
  assert(nodeStatus(state, "node-friend-mika") === "opened", "GO_BACK should preserve opened friend node.");

  state = reduce(state, { type: "OPEN_DREAM_GATE", nodeId: "node-friend-mika" });
  assert(state.currentPage === "dream-gate", "An already opened friend waiting state should continue to dream-gate.");
  assert(nodeStatus(state, "node-friend-mika") === "opened", "Continuing from opened friend waiting should preserve opened status.");

  state = reduce(state, { type: "OPEN_ROAMING_SIMULATION", nodeId: "node-friend-mika" });

  const starKey = liveSimulationResultKey("node-friend-mika", "starlight");
  const seaKey = liveSimulationResultKey("node-friend-mika", "undersea");
  const standaloneKey = liveSimulationResultKey("node-rain-store", null);
  assert(starKey === "node-friend-mika:starlight", "Friend scene key should include roaming scene.");
  assert(seaKey === "node-friend-mika:undersea", "Different roaming scenes need different keys.");
  assert(standaloneKey === "node-rain-store", "Overnight node key should stay node-only.");

  state = reduce(state, { type: "STORE_LIVE_SIMULATION_RESULT", resultKey: starKey, result: makeResult("星际") });
  state = reduce(state, { type: "STORE_LIVE_SIMULATION_RESULT", resultKey: seaKey, result: makeResult("海底") });
  assert(state.liveSimulationResults[starKey].possibleFirstLine === "星际 第一句话。", "Star result should be stored by scene key.");
  assert(state.liveSimulationResults[seaKey].possibleFirstLine === "海底 第一句话。", "Sea result should be stored by scene key.");
  assert(
    state.liveSimulationResults[starKey].possibleFirstLine !== state.liveSimulationResults[seaKey].possibleFirstLine,
    "Different friend scenes must not overwrite each other.",
  );

  state = reduce(state, { type: "OPEN_DREAM_GATE", nodeId: "node-friend-mika" });
  assert(state.currentPage === "dream-gate", "Opened friend simulation should continue to dream-gate.");
  assert(nodeStatus(state, "node-friend-mika") === "opened", "Opening friend dream gate should preserve opened status.");

  state = reduce(state, { type: "OPEN_CHAT_ENTRY", nodeId: "node-friend-mika" });
  assert(state.currentPage === "chat-entry", "Opened friend gate should continue to chat-entry.");
  assert(state.selectedRoamingSceneId === "starlight", "Friend chat should keep the selected roaming scene.");
  assert(
    state.liveSimulationResults[starKey].possibleFirstLine === "星际 第一句话。",
    "Friend chat should still be able to read the scene-specific live result.",
  );
}

function assertWithdrawAndReset() {
  let state = completeTwinSetup();
  state = reduce(state, { type: "SEND_DREAM_INVITE", friendId: "friend-mika", sceneId: "undersea" });
  state = reduce(state, { type: "WITHDRAW_DREAM", nodeId: "node-friend-mika" });
  assert(state.currentPage === "friend-invite", "Withdrawing friend invite should return to friend-invite.");
  assert(state.dreamInviteStatus === "withdrawn", "Withdrawing friend invite should mark status withdrawn.");
  assert(nodeStatus(state, "node-friend-mika") === "unviewed", "Withdrawing friend invite should reset friend node.");

  state = reduce(state, {
    type: "STORE_LIVE_SIMULATION_RESULT",
    resultKey: liveSimulationResultKey("node-friend-mika", "undersea"),
    result: makeResult("海底"),
  });
  state = reduce(state, { type: "RESET_DEMO" });
  assert(state.currentPage === "welcome", "RESET_DEMO should return to welcome.");
  assert(!state.hasCompletedTwinSetup, "RESET_DEMO should clear completed twin setup.");
  assert(Object.keys(state.liveSimulationResults).length === 0, "RESET_DEMO should clear live results.");
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
  assert(state.nodes.every((node) => node.status === "unviewed"), "Re-submitting should reset all dream node statuses.");
  assert(
    state.simulations.some((simulation) => simulation.scene.includes("星空漫游")),
    "Re-submitting should regenerate simulations from the edited profile.",
  );

  state = reduce(state, { type: "COMPLETE_TWIN_GENERATION" });
  assert(state.currentPage === "twin-home", "Completing edited twin generation should return to twin-home.");
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
  assert(state.currentPage === "chat-entry", "Setup should reach chat-entry before persistence recovery.");
  assert(Object.keys(state.liveSimulationResults).length === 1, "Setup should include one live result before persistence recovery.");

  const recovered = normalizePersistedState(state);
  assert(recovered.currentPage === "twin-home", "Reload after completed setup should return to twin-home.");
  assert(recovered.pageHistory.length === 0, "Reload should clear page history.");
  assert(recovered.hasCompletedTwinSetup, "Reload should preserve completed twin setup.");
  assert(Object.keys(recovered.liveSimulationResults).length === 0, "Reload should clear live results to avoid stale AI content.");
  assert(nodeStatus(recovered, "node-friend-mika") === "opened", "Reload should preserve opened friend node status.");
  assert(recovered.selectedRoamingSceneId === "starlight", "Reload should preserve selected friend roaming scene.");
  assert(
    recovered.simulations.some((simulation) => simulation.scene.includes(state.profile.interests[0])),
    "Reload should regenerate simulations from the persisted profile.",
  );

  const unfinished = normalizePersistedState({
    ...initialDemoFlowState,
    currentPage: "twin-create",
    pageHistory: ["welcome"],
    hasCompletedTwinSetup: false,
  });
  assert(unfinished.currentPage === "twin-create", "Reload before setup completion should keep the current creation page.");
  assert(!unfinished.hasCompletedTwinSetup, "Reload before setup completion should not mark twin setup complete.");

  const legacyCompleted = { ...state };
  delete legacyCompleted.hasCompletedTwinSetup;
  const recoveredLegacy = normalizePersistedState(legacyCompleted);
  assert(recoveredLegacy.currentPage === "twin-home", "Legacy completed states should infer twin setup and recover to twin-home.");
  assert(recoveredLegacy.hasCompletedTwinSetup, "Legacy completed states should infer completed twin setup.");

  assert(isDemoState(state), "A valid flow state should pass the persisted state guard.");
  assert(!isDemoState({ ...state, simulations: [{ scenarios: null }] }), "Invalid simulation payloads should fail the persisted state guard.");

  const storage = createMemoryStorage();
  persistDemoState(state, storage);
  assert(storage.getItem(DEMO_STORAGE_KEY), "Persisting state should write the current storage key.");
  const loaded = loadPersistedState(storage);
  assert(loaded.currentPage === "twin-home", "Loading persisted state should normalize back to twin-home.");
  assert(Object.keys(loaded.liveSimulationResults).length === 0, "Loading persisted state should clear stale live results.");

  const invalidStorage = createMemoryStorage();
  invalidStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ currentPage: "chat-entry" }));
  const invalidLoaded = loadPersistedState(invalidStorage);
  assert(invalidLoaded.currentPage === "welcome", "Invalid persisted payloads should fall back to the initial welcome state.");
}

assertOvernightDiscoveryFlow();
assertFriendInviteFlowAndLiveIsolation();
assertWithdrawAndReset();
assertEditingTwinResetsGeneratedState();
assertPersistedStateRecovery();

console.log("DreamTwin state flow QA passed.");
