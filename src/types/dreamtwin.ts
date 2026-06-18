export type DreamNodeStatus = "unviewed" | "viewed" | "waiting" | "opened";

export type SimulationScenarioMode = "first_meet" | "shared_event" | "romance" | "conflict";

export type RelationshipEntryMode = "overnight_discovery" | "friend_invite";

export type DreamInviteStatus = "draft" | "sent" | "accepted" | "withdrawn";

export type DemoPage =
  | "welcome"
  | "twin-create"
  | "twin-generating"
  | "twin-home"
  | "dream-log"
  | "friend-invite"
  | "simulation-detail"
  | "waiting"
  | "dream-gate"
  | "chat-entry";

export interface UserProfile {
  id: string;
  nickname: string;
  personalityKeywords: string[];
  relationshipIntention: string;
  interests: string[];
  optionalSignals: string[];
}

export interface TwinProjection {
  id: string;
  nickname: string;
  summary: string;
  colorPalette: string[];
  lightShape: "halo" | "mist" | "pulse" | "orbit";
  keywords: string[];
}

export interface DreamNode {
  id: string;
  title: string;
  status: DreamNodeStatus;
  simulationId: string;
  entryMode: RelationshipEntryMode;
  x: number;
  y: number;
  intensity: number;
}

export interface FriendProfile {
  id: string;
  name: string;
  relationLabel: string;
  presence: string;
  keywords: string[];
}

export interface RelationshipScenario {
  mode: SimulationScenarioMode;
  label: string;
  premise: string;
  likelyDialogue: string[];
  behaviorPreview: string[];
  relationshipOutcome: string;
  romanceSignal: string;
  riskSignal: string;
  suggestedMove: string;
}

export interface DreamRoamingScene {
  id: string;
  label: string;
  premise: string;
  relationshipOutcome: string;
  likelyDialogue: string[];
  behaviorPreview: string[];
  romanceSignal: string;
  riskSignal: string;
  suggestedMove: string;
  possibleFirstLine: string;
  attraction: number;
  pace: number;
  risk: number;
  verdict: string;
  paceLabel: string;
  riskLabel: string;
}

export interface RelationshipSimulation {
  id: string;
  nodeId: string;
  entryMode: RelationshipEntryMode;
  friendProfile?: FriendProfile;
  title: string;
  counterpartName: string;
  counterpartProjection: string;
  scene: string;
  relationshipHypothesis: string;
  twinApproach: string;
  counterpartSimulatedReply: string;
  rehearsalOutcome: string;
  conversationPreview: string[];
  relationshipTrajectory: string[];
  romancePossibility: string;
  conflictRisk: string;
  badOutcomeScenario: string;
  recommendedMove: string;
  hypothesisSignal: string;
  approachSignal: string;
  replySignal: string;
  outcomeSignal: string;
  frictionSignal: string;
  tension: string;
  possibleFirstLine: string;
  matchReasons: string[];
  scenarios: RelationshipScenario[];
  roamingScenes?: DreamRoamingScene[];
}

export interface DemoFlowState {
  currentPage: DemoPage;
  pageHistory: DemoPage[];
  hasCompletedTwinSetup: boolean;
  selectedNodeId: string | null;
  selectedFriendId: string | null;
  selectedRoamingSceneId: string | null;
  dreamInviteStatus: DreamInviteStatus;
  resumeAtOutcomeNodeId: string | null;
  profile: UserProfile;
  twin: TwinProjection;
  friends: FriendProfile[];
  nodes: DreamNode[];
  simulations: RelationshipSimulation[];
}
