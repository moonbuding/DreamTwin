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
    scenarios: [
      {
        mode: "first_meet",
        label: "初次相遇",
        premise: "如果你们第一次在雨夜便利店相遇，AI 会先测试双方能不能从一个低压细节聊起来。",
        likelyDialogue: [
          "你们会从雨、伞、城市安静下来的感觉聊起，而不是立刻交换背景资料。",
          "她会用一句简短但准确的回应确认你是不是在认真观察当下。",
          "第二轮对话会自然转向：你们为什么都不喜欢被催促的认识方式。",
        ],
        behaviorPreview: [
          "你的分身会把伞往中间推，留下可以一起走也可以拒绝的空间。",
          "对方分身会停顿、观察，再用一个小动作接住你的善意。",
          "双方都会避免过度热情，关系靠稳定来回而不是瞬间上头推进。",
        ],
        relationshipOutcome: "大概率形成一次舒服的真实聊天入口，但需要你先给出一个具体、轻、不逼迫的开场。",
        romanceSignal: "恋爱信号来自安全感累积，不是强烈火花；如果她连续两次接住你的细节，后续可能升温。",
        riskSignal: "最大风险是双方都太谨慎，把对方的慢热误判成没兴趣，导致关系在礼貌里冷掉。",
        suggestedMove: "先提出一个共享的小行动，例如一起走到路口，而不是直接问她对你有没有兴趣。",
      },
      {
        mode: "shared_event",
        label: "一起经历",
        premise: "如果你们从避雨变成一起处理一个小意外，比如找不到车或临时绕路，AI 会推演协作里的关系变化。",
        likelyDialogue: [
          "你们会讨论怎么走、要不要等雨小一点，实际问题会让聊天更自然。",
          "她会观察你在小麻烦里是不是急躁，还是能让现场保持轻松。",
          "你会开始知道她处理不确定性的方式：安静分析，还是需要被安抚。",
        ],
        behaviorPreview: [
          "你的分身会先确认她是否舒服，再提出路线选择。",
          "对方分身会把自己的偏好说出来一点，关系从氛围进入真实协作。",
          "如果你能照顾节奏而不包办，她会更愿意继续同行。",
        ],
        relationshipOutcome: "这类共同经历会让关系更快落地，适合从陌生感过渡到真实生活感。",
        romanceSignal: "恋爱可能会在“被照顾但不被控制”的体验里上升。",
        riskSignal: "如果你过度安排，她会把你的主动理解成压力；如果你完全不表达，她会觉得你不够明确。",
        suggestedMove: "给出两个轻选择：一起等雨小一点，或者我陪你走到打车点。",
      },
      {
        mode: "romance",
        label: "恋爱可能",
        premise: "如果这段关系继续三次聊天，AI 会看它是否从舒服聊天变成更明确的亲密可能。",
        likelyDialogue: [
          "第三次聊天会从城市夜行聊到各自理想中的亲密节奏。",
          "她可能不会直接说喜欢，但会主动延长话题或分享更私人的判断。",
          "你们会试探“见面以后还想不想继续了解”，而不是马上定义关系。",
        ],
        behaviorPreview: [
          "你的分身会逐步提高明确度，从细节陪伴变成表达期待。",
          "对方分身会用稳定回应和主动提问表示靠近。",
          "关系会进入慢热但有方向的暧昧期。",
        ],
        relationshipOutcome: "有发展为恋爱的可能，但前提是你们都允许关系慢慢确认，不急着要答案。",
        romanceSignal: "高价值信号是她开始主动分享日常，而不是只回应你的提问。",
        riskSignal: "如果你因为慢热而反复试探，她会感到被检查；如果她一直不主动，你会失去安全感。",
        suggestedMove: "在第三次高质量来回后，用一句低压邀请把关系从线上推到线下。",
      },
      {
        mode: "conflict",
        label: "不好走向",
        premise: "如果其中一方突然沉默或误解了慢热，AI 会推演这段关系怎样变坏，以及哪里可以提前止损。",
        likelyDialogue: [
          "你可能会问：是不是我刚才说得太多了？她可能只回：没有，我只是有点累。",
          "真正的问题不是这句话，而是双方都不愿先承认自己需要确认。",
          "对话会变成礼貌解释，而不是继续靠近。",
        ],
        behaviorPreview: [
          "你的分身会倾向补偿式解释，试图把冷掉的气氛救回来。",
          "对方分身会进一步放慢，因为她不想被情绪推着回应。",
          "如果继续追问，关系会从谨慎变成压力。",
        ],
        relationshipOutcome: "最坏结果不是争吵，而是双方都觉得对方没有兴趣，最后自然断联。",
        romanceSignal: "恋爱信号会被误读掩盖，除非有人用清楚但不逼迫的话重新校准。",
        riskSignal: "慢热关系最怕用猜测替代确认，越猜越像拒绝。",
        suggestedMove: "用一句低压校准代替追问：我不确定刚才是不是推进太快了，可以慢一点。",
      },
    ],
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
    scenarios: [
      {
        mode: "first_meet",
        label: "初次相遇",
        premise: "如果你们第一次在凌晨电台里相遇，AI 会测试双方能否把共同感受转成真实对话。",
        likelyDialogue: [
          "你们会从一段留言聊到为什么有些话不适合白天说。",
          "他会接住你的隐喻，但不会马上暴露太多现实信息。",
          "第三轮对话会出现一次轻微停顿，用来确认是否继续聊深。",
        ],
        behaviorPreview: [
          "你的分身会用感受开场，而不是用问题压过去。",
          "对方分身会用相似隐喻回应，表示同频但保留距离。",
          "系统判断你们能形成稳定文字来回，但推进速度偏慢。",
        ],
        relationshipOutcome: "适合建立精神共鸣，但必须在第二轮加入一个现实落点，避免只停在氛围里。",
        romanceSignal: "他愿意把隐喻落回自己的真实经历时，恋爱可能开始上升。",
        riskSignal: "如果两个人都只讲漂亮话，关系会很有感觉但没有行动。",
        suggestedMove: "先接住他的表达，再问一个轻现实问题：你通常会在什么时刻最想听这类歌？",
      },
      {
        mode: "shared_event",
        label: "一起经历",
        premise: "如果你们一起完成一段未寄出的电台留言，AI 会推演协作表达里的亲密感。",
        likelyDialogue: [
          "你们会一起斟酌一句话该不该说出口。",
          "他会露出更真实的犹豫，因为共同创作比闲聊更容易暴露价值观。",
          "你们可能第一次讨论：表达真实和保护自己之间怎么平衡。",
        ],
        behaviorPreview: [
          "你的分身会先写半句，把剩下的位置留给他。",
          "对方分身会补上一个意料之外但准确的结尾。",
          "共同完成一段表达后，关系会从旁观彼此变成短暂共创。",
        ],
        relationshipOutcome: "共同经历会显著提升亲近感，但也会让双方更在意对方是否真正理解自己。",
        romanceSignal: "如果他主动保留你写过的那句话，说明关系开始带有私人意义。",
        riskSignal: "如果他只把这当成深夜氛围，你会觉得被浪漫化但没有被认真看见。",
        suggestedMove: "把共同创作变成轻邀请：下次如果还有这样的留言，我们各写一半。",
      },
      {
        mode: "romance",
        label: "恋爱可能",
        premise: "如果你们连续几晚保持高质量来回，AI 会判断这段精神共鸣能否进入恋爱关系。",
        likelyDialogue: [
          "你们会开始记住彼此每天的情绪温度，而不只是分享音乐。",
          "他可能会问你白天是什么样的人，这是从氛围走向现实的信号。",
          "你们会讨论见面会不会破坏这份夜间默契。",
        ],
        behaviorPreview: [
          "你的分身会把对话从深夜延伸到白天的一件小事。",
          "对方分身若愿意回应白天生活，说明他不只想停在情绪陪伴。",
          "关系会进入精神吸引强、现实验证不足的阶段。",
        ],
        relationshipOutcome: "恋爱可能中等偏高，但需要线下节奏验证，否则容易成为只在深夜成立的关系。",
        romanceSignal: "他主动把你带入他的白天生活，是最强的升温信号。",
        riskSignal: "高共鸣可能掩盖生活习惯差异，见面后落差会比较明显。",
        suggestedMove: "把下一次对话约到白天：我想知道这首歌在下午听会不会变成另一种感觉。",
      },
      {
        mode: "conflict",
        label: "不好走向",
        premise: "如果这段关系一直停在隐喻和情绪里，AI 会推演它如何变成漂亮但无效的连接。",
        likelyDialogue: [
          "你们会说很多像诗一样的话，但很少确认真实需求。",
          "当你想推进时，他可能用一句轻描淡写的玩笑把话题带开。",
          "你会开始怀疑：他是在认真靠近，还是只享受被理解的感觉。",
        ],
        behaviorPreview: [
          "你的分身会试图把话题落地，问见面或日常。",
          "对方分身若持续回到抽象表达，系统会标记为推进不足。",
          "关系会在高频聊天里逐渐耗损，因为没有现实承接。",
        ],
        relationshipOutcome: "最坏走向是成为深夜情绪出口，亲密感很强，但现实关系没有发生。",
        romanceSignal: "除非他主动给出现实时间和行动，否则恋爱信号会持续偏弱。",
        riskSignal: "你可能把被理解误认为被选择。",
        suggestedMove: "尽早提出一个小现实锚点，判断他是否愿意让关系离开电台。",
      },
    ],
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
    scenarios: [
      {
        mode: "first_meet",
        label: "初次相遇",
        premise: "如果你们第一次在候车厅相遇，AI 会测试价值观相近是否能变成舒服聊天，而不是过早沉重。",
        likelyDialogue: [
          "你们会从“慢一点才听见自己”聊到舒服关系的节奏。",
          "她会试探你是不是只会赞同，还是能讲出自己的具体理解。",
          "对话很容易变深，所以系统会提醒保留一点轻松感。",
        ],
        behaviorPreview: [
          "你的分身会回应价值观，再加一句轻松缓冲。",
          "对方分身会因为被理解而继续展开，但不会立刻给出情绪承诺。",
          "双方会快速建立被看见的感觉。",
        ],
        relationshipOutcome: "高质量开场概率高，但要避免第一次就把关系聊成心理访谈。",
        romanceSignal: "她愿意继续问你的关系观，说明不只是礼貌回应。",
        riskSignal: "太快聊深会让双方第二天想后退，因为暴露感来得太早。",
        suggestedMove: "先说你理解她那句话，再补一句轻的：不过现在我更想知道这班车会不会准时。",
      },
      {
        mode: "shared_event",
        label: "一起经历",
        premise: "如果夜车继续延误，你们被迫一起等更久，AI 会推演等待里的真实相处感。",
        likelyDialogue: [
          "你们会讨论等待时怎么让自己不焦虑。",
          "她可能会分享一个习惯，比如写下想法或观察路人。",
          "你会看到她在不确定里是否需要空间，还是需要陪伴。",
        ],
        behaviorPreview: [
          "你的分身会提出一起做一件很轻的小事，例如猜下一班车的到达时间。",
          "对方分身会在轻松任务里放下防备。",
          "共同等待会把价值观连接转成真实陪伴感。",
        ],
        relationshipOutcome: "这类共同经历能增强亲密想象，因为你们会看到彼此如何处理漫长和不确定。",
        romanceSignal: "如果她主动把等待时间延长成一次共同记忆，恋爱可能明显升高。",
        riskSignal: "如果你一直谈深度，她可能会觉得没有喘息空间。",
        suggestedMove: "在深话题之后安排一个轻动作，让关系有呼吸感。",
      },
      {
        mode: "romance",
        label: "恋爱可能",
        premise: "如果你们后续继续围绕关系观聊天，AI 会判断它是否会走向恋爱，还是只停留在相互理解。",
        likelyDialogue: [
          "你们会讨论安全感、边界、独处和陪伴的比例。",
          "她可能会把自己的脆弱讲得很清楚，但仍然需要节奏控制。",
          "你会感到很快被看见，也会担心是不是靠得太快。",
        ],
        behaviorPreview: [
          "你的分身会表达欣赏，但不会马上定义关系。",
          "对方分身会用持续提问确认你是否稳定，而不是只会短暂共鸣。",
          "关系有机会快速进入暧昧，但需要慢慢验真。",
        ],
        relationshipOutcome: "恋爱可能高，但稳定性取决于你们能否把深度和轻松同时保留。",
        romanceSignal: "她在深聊之后还愿意分享轻松日常，是关系健康升温的信号。",
        riskSignal: "如果只靠深度推进，容易产生灵魂伴侣错觉，现实相处反而跟不上。",
        suggestedMove: "不要急着表白，先约一次低压力见面，验证日常里的舒服程度。",
      },
      {
        mode: "conflict",
        label: "不好走向",
        premise: "如果你们把第一次共鸣误认为关系已经确定，AI 会推演这段关系的压力如何出现。",
        likelyDialogue: [
          "你可能会想确认她是不是也有同样感觉，她可能会说：我需要慢一点。",
          "你会把慢一点听成拒绝，她会把你的确认听成压力。",
          "双方都没有错，但节奏没有对齐。",
        ],
        behaviorPreview: [
          "你的分身会因为高匹配而想尽快确认。",
          "对方分身会在压力出现时退回观察。",
          "系统会标记：高共鸣关系更需要节奏保护。",
        ],
        relationshipOutcome: "最坏走向是第一次聊得太深，第二次因为压力过高而断开。",
        romanceSignal: "恋爱信号仍然存在，但会被节奏焦虑压住。",
        riskSignal: "越早定义，越容易把本来可以发展的关系推向防御。",
        suggestedMove: "把确认改成邀请：我很喜欢刚才那段聊天，但我们可以慢慢来。",
      },
    ],
  },
  ];
}

export const demoSimulations: RelationshipSimulation[] = createSimulationsForProfile(demoProfile);
