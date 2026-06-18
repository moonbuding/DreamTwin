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
  version: number;
}

export interface GenerationJob {
  id: string;
  type: "twin_summary" | "relationship_simulation";
  status: "queued" | "running" | "succeeded" | "failed" | "blocked";
  createdAt: string;
  completedAt?: string;
  errorCode?: string;
}

export interface RelationshipSimulationResult {
  conclusion: string;
  attractionScore: number;
  paceScore: number;
  riskScore: number;
  likelyDialogue: string[];
  behaviorPreview: string[];
  relationshipTrajectory: string[];
  romancePossibility: string;
  conflictRisk: string;
  badOutcomeScenario: string;
  suggestedMove: string;
  possibleFirstLine: string;
  safetyHint: string;
}

export interface DreamTwinDb {
  profile: UserProfile;
  twin: TwinProjection | null;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}
