// DreamTwin shared domain contract — entity types returned by the API and
// consumed by the mobile app. Ported from the legacy web app's
// src/types/dreamtwin.ts (app-layer state types DemoPage/DemoFlowState are
// intentionally left out; navigation/state live in each app).

export type DreamNodeStatus = "unviewed" | "viewed" | "waiting" | "both_entered" | "opened" | "in_chat";

export type RelationshipStateStatus =
  | "ai_previewed"
  | "waiting_counterpart"
  | "both_entered"
  | "gate_opened"
  | "in_chat";

export type SimulationScenarioMode = "first_meet" | "shared_event" | "romance" | "conflict";

export type RelationshipEntryMode = "overnight_discovery" | "friend_invite";

export type DreamInviteStatus = "draft" | "sent" | "accepted" | "withdrawn";

export type ThemeMode = "day" | "night";

export type SceneStageVariant = "rain_store" | "starlight" | "undersea" | "sushi" | "cinema" | "badminton";

export interface PlazaProfile {
  id: string;
  name: string;
  tagline: string;
  keywords: string[];
  colorPalette: string[];
  presence: string;
}

// 依恋类型:亲密关系情境里预测力最强的维度之一。
export type AttachmentStyle = "secure" | "anxious" | "avoidant" | "fearful";

// CAPS 情境-行为签名:把性格翻译成"在某情境下的倾向行为",比抽象标签更可预测。
export interface IfThenSignal {
  situation: string; // 触发情境,如「对方迟到不解释」
  tendency: string; // 倾向行为,如「嘴上说没事但变冷淡」
}

// 心理学派生层:在自由标签之上沉淀的、效度更高的结构化预测维度。全部可选。
// 整体随 UserProfile 存为 jsonb,无需数据库迁移;缺省即退化为纯标签行为。
export interface PersonaPsychology {
  bigFive?: {
    openness?: number; // 开放性 0–100
    conscientiousness?: number; // 尽责性 0–100
    extraversion?: number; // 外向性 0–100
    agreeableness?: number; // 宜人性 0–100
    neuroticism?: number; // 神经质 0–100
  };
  attachmentStyle?: AttachmentStyle;
  dealbreakers?: string[]; // 红线:绝不接受的事(同时作为监管安全边界)
  loveLanguages?: string[]; // 爱的语言,优先级在前
  conflictStyle?: string; // 竞争/合作/妥协/回避/迁就
  emotionRegulation?: string; // 重评/抑制/宣泄/回避
  ifThenSignals?: IfThenSignal[]; // 情境签名
  voiceSamples?: string[]; // 语气/口头禅样本,作为 few-shot 让分身「说话像本人」
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
  psychology?: PersonaPsychology; // 心理学派生层(可选,见上)
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

export interface RelationshipState {
  id: string;
  nodeId: string;
  simulationId: string;
  entryMode: RelationshipEntryMode;
  status: RelationshipStateStatus;
  label: string;
}

export interface FriendProfile {
  id: string;
  name: string;
  relationLabel: string;
  presence: string;
  keywords: string[];
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
  psychology?: PersonaPsychology; // 「梦中人」心理学派生层(可选)
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
  sceneStageVariant?: SceneStageVariant;
  sceneStageSpec?: SceneStageSpec;
  guidedSceneEvents?: GuidedSceneEvent[];
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

export interface GuidedSceneEvent {
  id: string;
  label: string;
  prompt: string;
  hotspot: string;
  relationQuestion: string;
  expectedSignal: string;
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

export interface SceneStageSpec {
  variant: SceneStageVariant;
  title: string;
  visualTone: string;
  spatialMetaphor: string;
  relationTrigger: string;
  cameraHint: string;
  boundaryNote: string;
  palette: string[];
}

export interface RelationshipSimulation {
  id: string;
  nodeId: string;
  entryMode: RelationshipEntryMode;
  friendProfile?: FriendProfile;
  title: string;
  counterpartName: string;
  counterpartProfileSnapshot?: RelationshipCounterpartProfile;
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
  sceneStageVariant?: SceneStageVariant;
  sceneStageSpec?: SceneStageSpec;
  guidedSceneEvents?: GuidedSceneEvent[];
  relationshipGoal?: string;
  scenarios: RelationshipScenario[];
  roamingScenes?: DreamRoamingScene[];
}

// ---- API request/response DTOs ----

export interface AuthUser {
  id: string;
  phone: string;
  nickname: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  profile: UserProfile;
  twin: TwinProjection;
}

export interface MeResponse {
  user: AuthUser;
  profile: UserProfile;
  twin: TwinProjection;
}

export interface TodayResponse {
  greetingName: string;
  nodes: DreamNode[];
  friends: FriendProfile[];
  newDreamCount: number;
  waitingCount: number;
  bothEnteredCount: number;
}

// 「梦境相遇」图文短故事(6 帧叙事 + 1 帧关系预言)。固定模板与 AI 生成共用此结构。
export type StoryFrameVisual = "scene" | "you" | "ta" | "prop" | "turn" | "freeze" | "reading";

export interface StoryFrame {
  visual: StoryFrameVisual;
  icon?: string;
  text?: string;
  youLine?: string;
  taLine?: string;
  read?: string;
  opener?: string;
}

export interface DreamStory {
  sceneId: string;
  title: string;
  theme: { glow: string; accent: string };
  frames: StoryFrame[];
  source?: "ai" | "fixed";
}
