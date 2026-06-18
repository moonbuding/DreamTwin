export type DreamNodeStatus = "unviewed" | "viewed" | "waiting" | "opened";

export type SimulationScenarioMode = "first_meet" | "shared_event" | "romance" | "conflict";

export type DemoPage =
  | "welcome"
  | "twin-create"
  | "twin-generating"
  | "dream-log"
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
  x: number;
  y: number;
  intensity: number;
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

export interface RelationshipSimulation {
  id: string;
  nodeId: string;
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
}

export interface DemoFlowState {
  currentPage: DemoPage;
  pageHistory: DemoPage[];
  selectedNodeId: string | null;
  resumeAtOutcomeNodeId: string | null;
  profile: UserProfile;
  twin: TwinProjection;
  nodes: DreamNode[];
  simulations: RelationshipSimulation[];
}
