import type { DreamNode, RelationshipSimulation, TwinProjection, UserProfile } from "../types/dreamtwin";

export const demoProfile: UserProfile = {
  id: "user-aurora",
  nickname: "林星",
  personalityKeywords: ["慢热", "高共情", "夜间思考者", "重视真实感"],
  relationshipIntention: "想遇见一个可以自然聊深的人",
  interests: ["城市夜行", "独立音乐", "心理学", "影像叙事"],
  optionalSignals: ["近期常听深夜电台", "更偏好低压开场", "喜欢从小事聊到价值观"],
};

export const demoTwin: TwinProjection = {
  id: "twin-aurora",
  nickname: "你的 DreamTwin",
  summary: "它记住你的慢热、敏感和好奇心，先替你走进关系可能性里，带回值得亲自开启的片段。",
  colorPalette: ["#6fd3ff", "#a779ff", "#ff72d2"],
  lightShape: "orbit",
  keywords: ["慢热但深", "温柔试探", "真实连接", "夜色感"],
};

export function createTwinFromProfile(profile: UserProfile): TwinProjection {
  const primaryColor = profile.personalityKeywords.includes("直接表达") ? "#ffbe74" : "#6fd3ff";
  const secondColor = profile.personalityKeywords.includes("好奇心强") ? "#ff72d2" : "#a779ff";
  const topKeywords = [...profile.personalityKeywords.slice(0, 3), ...profile.interests.slice(0, 1)];

  return {
    ...demoTwin,
    nickname: `${profile.nickname || "你"} 的 DreamTwin`,
    summary: `它会记住你“${profile.relationshipIntention || "想认真靠近一段关系"}”的愿望，用${profile.personalityKeywords.slice(0, 2).join("、") || "真实、温柔"}的方式先替你试探关系可能性。`,
    colorPalette: [primaryColor, secondColor, "#f4f7ff"],
    keywords: topKeywords.length ? topKeywords : demoTwin.keywords,
  };
}

export const demoNodes: DreamNode[] = [
  {
    id: "node-rain-store",
    title: "雨夜便利店",
    status: "unviewed",
    simulationId: "simulation-rain-store",
    x: 0.25,
    y: 0.36,
    intensity: 0.84,
  },
  {
    id: "node-seaside-radio",
    title: "凌晨海边电台",
    status: "unviewed",
    simulationId: "simulation-seaside-radio",
    x: 0.66,
    y: 0.28,
    intensity: 0.96,
  },
  {
    id: "node-moon-platform",
    title: "月光候车厅",
    status: "unviewed",
    simulationId: "simulation-moon-platform",
    x: 0.72,
    y: 0.68,
    intensity: 0.88,
  },
];

export function createSimulationsForProfile(profile: UserProfile): RelationshipSimulation[] {
  const interest = profile.interests[0] ?? "城市夜行";
  const secondInterest = profile.interests[1] ?? "独立音乐";
  const intention = profile.relationshipIntention || "想遇见一个可以自然聊深的人";
  const openingStyle = profile.personalityKeywords.includes("直接表达") ? "更坦白地" : "不急着";
  const closenessStyle = profile.personalityKeywords.includes("直接表达") ? "先把真实意图说清楚" : "先用低压细节确认安全感";

  return [
  {
    id: "simulation-rain-store",
    nodeId: "node-rain-store",
    title: "雨夜便利店",
    counterpartName: "Nora",
    counterpartProjection: "她像一束很安静的蓝色灯光，习惯先观察，再用一句很准的话靠近。",
    scene: `雨停在便利店门口，你们同时拿起最后一把透明伞。她注意到你资料里的“${interest}”，${openingStyle}把伞柄往你这边推了一点。`,
    relationshipHypothesis: `你的分身判断：这段关系不是靠热闹破冰开始，而是靠“${interest}”这样的日常细节慢慢确认彼此是否能聊深。`,
    twinApproach: `你的 DreamTwin 选择${closenessStyle}，没有追问背景，也没有表演幽默，只把共同处境轻轻递给对方。`,
    counterpartSimulatedReply: "她没有立刻给出热情回应，但把伞往中间挪了一点。这说明她愿意继续，只是不喜欢被推着走。",
    rehearsalOutcome: "预演结论：如果你从具体细节开场，关系有机会自然延长到真实聊天；如果一上来问太多，连接会变浅。",
    conversationPreview: [
      "你：这场雨像是把城市音量调低了。",
      "Nora：所以便利店反而像一个临时避难所。",
      "你：那我们可以先不急着介绍自己，只聊这十分钟发生了什么。",
    ],
    relationshipTrajectory: [
      "前 3 分钟：从共同处境和雨夜细节建立安全感。",
      "第 1 次转深：聊到为什么都喜欢低压、不被催促的关系。",
      "后续可能：如果双方都保持慢节奏，会从一次短聊延伸成稳定来回。",
    ],
    romancePossibility: "恋爱可能：中等偏高。不是强烈心动型，而是慢慢确认型，适合从朋友式靠近发展。",
    conflictRisk: "冲突风险：如果你急着确认她的态度，她会后退；如果她太慢，你可能误以为她没兴趣。",
    badOutcomeScenario: "不好的走向：两个人都把谨慎当成拒绝，真实聊天在几句礼貌话后自然冷掉。",
    recommendedMove: "建议动作：先发一条具体、轻、不逼迫回应的话，把主动权留给对方。",
    hypothesisSignal: "共同细节被点亮",
    approachSignal: "你的分身发出低压试探",
    replySignal: "对方分身接住但保持慢速",
    outcomeSignal: "适合从具体细节进入真实聊天",
    frictionSignal: "风险点：双方都慢热，容易把谨慎误读成冷淡。",
    tension: `你们都在寻找低压但真实的靠近方式。你的愿望是“${intention}”，她刚好也讨厌被催促的破冰。`,
    possibleFirstLine: profile.personalityKeywords.includes("直接表达")
      ? "我想把伞分你一半，但也想知道你为什么喜欢这样的雨夜。"
      : "如果这把伞只能送一个人回家，我们可以先一起走到路口。",
    matchReasons: ["都偏慢热", `都对${interest}有感受`, "聊天节奏适合从小事开始"],
  },
  {
    id: "simulation-seaside-radio",
    nodeId: "node-seaside-radio",
    title: "凌晨海边电台",
    counterpartName: "Kai",
    counterpartProjection: "他像低频电台里的回声，外表松弛，但会认真接住别人没有说完的部分。",
    scene: `凌晨两点的海边电台正在征集一段未寄出的留言，你们都提到了“${secondInterest}”，文字被主播连续读到。`,
    relationshipHypothesis: `你的分身判断：这段关系会从共同的表达媒介开始，不是问答式认识，而是借“${secondInterest}”确认彼此的情绪频率。`,
    twinApproach: "你的 DreamTwin 没有直接问职业和年龄，而是先把你们都在意的那段声音指出来，测试对方是否愿意接住隐含情绪。",
    counterpartSimulatedReply: "他接住了你的隐喻，并没有急着转移话题。这说明他愿意在不尴尬的距离里继续聊深。",
    rehearsalOutcome: "预演结论：如果第一句话围绕共同感受展开，对话会进入稳定来回；如果变成查户口，关系热度会明显下降。",
    conversationPreview: [
      "你：你刚才那句留言，像一封没寄出去的信。",
      "Kai：可能是，因为有些话寄出去就变重了。",
      "你：那我们先不寄，只把它放在这里听一会儿。",
    ],
    relationshipTrajectory: [
      "前 3 分钟：从电台留言和音乐建立共同频道。",
      "第 1 次转深：聊到各自为什么习惯用隐喻表达真实情绪。",
      "后续可能：会形成高质量文字来回，但需要有人主动把隐喻落回现实。",
    ],
    romancePossibility: "恋爱可能：中等。精神共鸣明显，但需要从氛围感落到真实生活节奏。",
    conflictRisk: "冲突风险：两个人都容易把真实需求藏起来，聊得很美但不一定推进。",
    badOutcomeScenario: "不好的走向：关系停在深夜情绪共鸣里，白天恢复距离，最后变成只偶尔点赞的熟人。",
    recommendedMove: "建议动作：用共同感受开场，但第二轮要补一个现实问题，让关系有落点。",
    hypothesisSignal: "情绪频率开始同步",
    approachSignal: "你的分身选择隐喻开场",
    replySignal: "对方分身保持同一频道",
    outcomeSignal: "适合用共同感受开启真实对话",
    frictionSignal: "风险点：两个人都习惯把真实想法藏在比喻里，可能需要更慢地确认边界。",
    tension: "你们都把很多表达藏在音乐、天气和深夜里，但不是为了逃避，而是为了让表达更准确。",
    possibleFirstLine: `你刚刚说的${secondInterest}，是不是也有一点像没寄出去的信？`,
    matchReasons: [`都提到${secondInterest}`, "都习惯夜间思考", "对情绪表达有相似边界"],
  },
  {
    id: "simulation-moon-platform",
    nodeId: "node-moon-platform",
    title: "月光候车厅",
    counterpartName: "Mika",
    counterpartProjection: "她像月光下的候车牌，清醒、明亮，也愿意等一个真正说得上话的人。",
    scene: "一班延迟的夜车把你们留在同一个候车厅。她在纸杯上写下一句：人有时候需要慢一点才听见自己。",
    relationshipHypothesis: `你的分身判断：这段关系的核心不是相似兴趣，而是你们都在寻找“不催促、不表演”的靠近方式。`,
    twinApproach: "你的 DreamTwin 没有马上制造话题，而是回应她那句关于慢下来的判断，测试价值观是否真的相邻。",
    counterpartSimulatedReply: "她停了一下，然后继续说自己的判断。这说明她不是礼貌回应，而是在确认你是否真的理解她的节奏。",
    rehearsalOutcome: "预演结论：如果你从价值观切入，关系会更快进入真实层；如果只停留在场景寒暄，会浪费一次高质量开场。",
    conversationPreview: [
      "你：你刚写的那句话，让我想到很多聊天其实都太急了。",
      "Mika：对，急到还没听懂对方，就开始判断对方。",
      "你：那我们可以先慢一点，只确认一件事：什么样的关系会让你觉得安全？",
    ],
    relationshipTrajectory: [
      "前 3 分钟：从慢下来和真实表达建立价值观连接。",
      "第 1 次转深：聊到安全感、边界和不想表演的亲密。",
      "后续可能：很容易进入深层关系想象，但需要保留轻松感避免过早暴露。",
    ],
    romancePossibility: "恋爱可能：高但不稳定。价值观贴近，容易快速靠近，也容易因为太快聊深而紧张。",
    conflictRisk: "冲突风险：如果一开始就进入关系定义，双方都可能感到压力。",
    badOutcomeScenario: "不好的走向：两个人都觉得被看见，但因为太快暴露脆弱，第二天反而想后退。",
    recommendedMove: "建议动作：先回应价值观，再加一句轻松缓冲，让深度和松弛同时存在。",
    hypothesisSignal: "关系节奏被识别",
    approachSignal: "你的分身回应核心价值观",
    replySignal: "对方分身停顿后继续靠近",
    outcomeSignal: "适合从价值观切入但放慢速度",
    frictionSignal: "风险点：太快聊深可能让双方都觉得暴露，需要保留一点轻松感。",
    tension: `你们都在寻找一种不催促、不表演的亲密感。系统判断这和你“${intention}”的表达高度接近。`,
    possibleFirstLine: "你也觉得，真正舒服的聊天不是越快越好吗？",
    matchReasons: ["关系期待相近", "都讨厌高压破冰", "价值观里都有真实和耐心"],
  },
  ];
}

export const demoSimulations: RelationshipSimulation[] = createSimulationsForProfile(demoProfile);
