export interface AuthUser {
  id: string;
  phone: string;
}

export interface UserProfile {
  id: string;
  nickname: string;
  personalityKeywords: string[];
  relationshipIntention: string;
  interests: string[];
  optionalSignals: string[];
  appearanceTags?: string[];
  education?: string;
  mbti?: string;
  bloodType?: string;
  zodiac?: string;
  mysticTags?: string[];
  communicationStyle?: string;
  values?: string[];
}

export interface AvatarStyleSpec {
  silhouette: "full_body_luminous" | "abstract_projection";
  posture: "reserved" | "open" | "curious" | "grounded";
  material: "glass-light" | "mist-light" | "star-thread";
  auraColor: string;
  secondaryColor: string;
  accentColor: string;
  motionSignature: "slow_orbit" | "soft_pulse" | "spark_drift";
  keywords: string[];
}

export interface TwinProjection {
  id: string;
  nickname: string;
  summary: string;
  colorPalette: string[];
  lightShape: "halo" | "mist" | "pulse" | "orbit";
  keywords: string[];
  avatarStyleSpec?: AvatarStyleSpec;
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

export interface RelationshipCounterpartProfile {
  name: string;
  relationLabel?: string;
  personalityKeywords: string[];
  interests: string[];
  communicationStyle?: string;
  values?: string[];
  optionalSignals?: string[];
  appearanceTags?: string[];
  education?: string;
}

export interface GuidedSceneEventInput {
  id: string;
  label: string;
  prompt: string;
  hotspot: string;
  relationQuestion: string;
  expectedSignal: string;
}

export type SceneStageVariant = "rain_store" | "starlight" | "undersea" | "sushi" | "cinema" | "badminton";

export interface SceneStageSpecInput {
  variant: SceneStageVariant;
  title: string;
  visualTone: string;
  spatialMetaphor: string;
  relationTrigger: string;
  cameraHint: string;
  boundaryNote: string;
  palette: string[];
}

export interface RelationshipSimulationInput {
  profile: UserProfile;
  counterpartName?: string;
  counterpartProfile?: RelationshipCounterpartProfile;
  scene?: string;
  sceneStageSpec?: SceneStageSpecInput;
  sceneEvent?: GuidedSceneEventInput;
  guidedSceneEvents?: GuidedSceneEventInput[];
  relationshipGoal?: string;
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
