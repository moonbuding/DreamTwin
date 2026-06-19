import type { AvatarStyleSpec, DreamTwinDb, RelationshipSimulationResult, TwinProjection, UserProfile } from "./types.js";

export const defaultProfile: UserProfile = {
  id: "user-local-demo",
  nickname: "林星",
  personalityKeywords: ["慢热", "高共情", "夜间思考者", "重视真实感"],
  relationshipIntention: "想遇见一个可以自然聊深的人",
  interests: ["城市夜行", "独立音乐", "心理学", "影像叙事"],
  optionalSignals: ["近期常听深夜电台", "更偏好低压开场", "喜欢从小事聊到价值观"],
  mbti: "INFJ",
  zodiac: "水瓶座",
  mysticTags: ["月亮感强", "夜间直觉"],
  communicationStyle: "先观察，再用具体细节靠近",
  values: ["真实", "边界感", "深度连接"],
};

export function createAvatarStyleSpec(profile: UserProfile, palette: string[]): AvatarStyleSpec {
  const joinedSignals = [
    ...profile.personalityKeywords,
    ...profile.interests,
    ...profile.optionalSignals,
    ...(profile.values ?? []),
    ...(profile.mysticTags ?? []),
    profile.mbti ?? "",
    profile.zodiac ?? "",
    profile.communicationStyle ?? "",
  ].join(" ");
  const isCurious = /好奇|探索|风象|旅行|影像|心理/.test(joinedSignals);
  const isGrounded = /真实|边界|长期|稳定|土象|低压/.test(joinedSignals);
  const isIntuitive = /INF|INFP|INFJ|夜|直觉|月亮|水象|双鱼/.test(joinedSignals);
  const isActionLed = /行动|直接|火象|运动|表达/.test(joinedSignals);
  const posture = isActionLed || joinedSignals.includes("直接")
    ? "open"
    : isCurious
      ? "curious"
      : isGrounded
        ? "grounded"
        : "reserved";
  const material = isIntuitive ? "star-thread" : joinedSignals.includes("共情") ? "mist-light" : "glass-light";
  const motionSignature = isActionLed
    ? "spark_drift"
    : joinedSignals.includes("共情") || joinedSignals.includes("温柔")
      ? "soft_pulse"
      : "slow_orbit";

  return {
    silhouette: "full_body_luminous",
    posture,
    material,
    auraColor: palette[0] ?? "#6fd3ff",
    secondaryColor: palette[1] ?? "#a779ff",
    accentColor: palette[2] ?? "#f4f7ff",
    motionSignature,
    keywords: [
      ...profile.personalityKeywords.slice(0, 2),
      ...(profile.mbti ? [profile.mbti] : []),
      ...(profile.values?.slice(0, 1) ?? []),
      ...(profile.mysticTags?.slice(0, 1) ?? []),
    ].slice(0, 5),
  };
}

export function createDefaultTwin(profile: UserProfile): TwinProjection {
  const keywords = [...profile.personalityKeywords.slice(0, 3), ...profile.interests.slice(0, 1)];
  const colorPalette = ["#6fd3ff", "#a779ff", "#f4f7ff"];

  return {
    id: "twin-local-demo",
    nickname: `${profile.nickname || "你"} 的 DreamTwin`,
    summary: `它会记住你“${profile.relationshipIntention || "想认真靠近一段关系"}”的愿望，用${profile.personalityKeywords.slice(0, 2).join("、") || "真实、温柔"}的方式帮你预演关系可能性。`,
    colorPalette,
    lightShape: "orbit",
    keywords: keywords.length ? keywords : ["真实连接", "温柔预演", "慢速靠近"],
    avatarStyleSpec: createAvatarStyleSpec(profile, colorPalette),
    version: 1,
  };
}

export const defaultRelationshipSimulation: RelationshipSimulationResult = {
  conclusion: "这段关系适合从一个具体、轻、不逼迫的共同情境开始。",
  attractionScore: 72,
  paceScore: 58,
  riskScore: 36,
  likelyDialogue: [
    "你们会先从场景里的一个小选择聊起，而不是直接聊关系定义。",
    "对方会观察你是否尊重边界，也会用轻松回应确认安全感。",
  ],
  behaviorPreview: [
    "你的分身会先给出一个低压邀请，把选择权留给对方。",
    "对方如果愿意继续，会用追问或补充细节释放推进信号。",
  ],
  relationshipTrajectory: [
    "第一阶段建立共同语境。",
    "第二阶段通过具体行动确认舒适度。",
    "第三阶段再进入真实聊天或线下邀约。",
  ],
  romancePossibility: "存在升温可能，但需要通过稳定互动而不是强表白推动。",
  conflictRisk: "如果过早要求明确回应，对方可能把关系推进误读为压力。",
  badOutcomeScenario: "双方都保持礼貌，但没有人给出下一步，关系停在一次短暂体验。",
  suggestedMove: "先提出一个共享的小行动，再观察对方是否愿意补充细节。",
  possibleFirstLine: "这个场景有点像我们会遇到的真实小岔路，你会先往哪边走？",
  safetyHint: "AI 只提供预演和建议，不代表对方真实承诺，也不会替用户发送消息。",
};

export const defaultDb: DreamTwinDb = {
  profile: defaultProfile,
  twin: createDefaultTwin(defaultProfile),
};
