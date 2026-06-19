import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  DoorOpen,
  Heart,
  MessageCircle,
  Route,
  Sparkles,
} from "lucide-react";
import {
  DreamTwinApiError,
  describeDreamTwinApiError,
  generateRelationshipSimulation,
  isDreamTwinApiEnabled,
  type DreamTwinApiMode,
} from "../api/dreamTwinApi";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { SceneVariant } from "../components/ThreeDreamScene";
import type {
  DreamNode,
  DreamRoamingScene,
  GuidedSceneEvent,
  RelationshipScenario,
  RelationshipSimulation,
  RelationshipSimulationResult,
  SceneStageSpec,
  SceneStageVariant,
  SimulationScenarioMode,
  UserProfile,
} from "../types/dreamtwin";
import { adaptFriendInviteMoveAfterAcceptance } from "../utils/relationshipCopy";

interface SimulationDetailPageProps {
  node: DreamNode;
  profile: UserProfile;
  simulation: RelationshipSimulation;
  resultStorageKey: string;
  resumeAtOutcome: boolean;
  selectedRoamingSceneId: string | null;
  onBackToLog: () => void;
  onContinue: (nodeId: string) => void;
  onLiveSimulationResult: (resultKey: string, result: RelationshipSimulationResult) => void;
  onSelectRoamingScene: (sceneId: string) => void;
}

type DetailMode = "overview" | "dialogue" | "behavior" | "risk";

type ActiveExperience = {
  label: string;
  premise: string;
  relationshipOutcome: string;
  likelyDialogue: string[];
  behaviorPreview: string[];
  romanceSignal: string;
  riskSignal: string;
  suggestedMove: string;
  possibleFirstLine: string;
  className: string;
  insight: {
    attraction: number;
    pace: number;
    paceLabel: string;
    risk: number;
    riskLabel: string;
    verdict: string;
  };
};

function fallbackGuidedEvents(label: string): GuidedSceneEvent[] {
  return [
    {
      id: "scene-entry",
      label: "进入场景",
      hotspot: `${label}的入口光点`,
      prompt: "两个人进入同一段梦境，先确认彼此是否愿意靠近。",
      relationQuestion: "第一步靠近是否足够低压？",
      expectedSignal: "对方是否愿意继续停留",
    },
    {
      id: "scene-choice",
      label: "共同选择",
      hotspot: `${label}里的共同选择点`,
      prompt: "场景给出一个小选择，两个人需要决定如何配合。",
      relationQuestion: "选择权是否被双方共享？",
      expectedSignal: "关系推进是否自然",
    },
    {
      id: "scene-exit",
      label: "离开前",
      hotspot: `${label}的出口光线`,
      prompt: "梦境即将结束，系统观察这段关系是否有进入真实聊天的理由。",
      relationQuestion: "这段体验能不能带回现实？",
      expectedSignal: "是否出现第一句话入口",
    },
  ];
}

function fallbackSceneStageSpec(label: string, variant: SceneStageVariant = "starlight"): SceneStageSpec {
  return {
    variant,
    title: `${label}舞台`,
    visualTone: "漂浮光层、柔和粒子、低压空间感",
    spatialMetaphor: "一段用于观察关系选择的梦境舞台",
    relationTrigger: "共同情境能否自然变成真实互动",
    cameraHint: "镜头只在关键关系事件之间移动",
    boundaryNote: "不可自由探索，只服务 AI 关系预演。",
    palette: ["#6fd3ff", "#a779ff", "#ff72d2"],
  };
}

function sceneVariantForStage(variant?: SceneStageVariant): SceneVariant {
  if (variant === "rain_store") return "stage-rain";
  if (variant === "undersea") return "stage-ocean";
  if (variant === "sushi" || variant === "cinema") return "stage-social";
  if (variant === "badminton") return "stage-motion";
  if (variant === "starlight") return "stage-space";
  return "ambient";
}

function signalLevel(value: number, kind: "connection" | "pace" | "risk"): string {
  if (kind === "risk") {
    if (value >= 70) return "需要留意";
    if (value >= 45) return "可以校准";
    return "相对低压";
  }

  if (value >= 70) return kind === "connection" ? "共鸣明显" : "可以推进";
  if (value >= 45) return kind === "connection" ? "有机会" : "慢慢靠近";
  return kind === "connection" ? "线索较少" : "先停一停";
}

function sceneAnchorKeywords(stageSpec: SceneStageSpec, events: GuidedSceneEvent[], label: string): string[] {
  const variantAnchors = {
    rain_store: ["下雨", "雨夜", "便利店", "伞", "货架", "路口", "热饮", "热可可"],
    starlight: ["星", "飞船", "舷窗", "电台", "海边", "留言", "返航"],
    undersea: ["海底", "下潜", "暗流", "洞穴", "气泡", "光束", "潜入"],
    sushi: ["日料", "吧台", "菜单", "点餐", "上菜"],
    cinema: ["电影", "银幕", "观影", "散场", "走廊"],
    badminton: ["羽毛球", "球场", "发球", "失误", "场边"],
  } satisfies Record<SceneStageVariant, string[]>;
  const eventAnchors = events.flatMap((event) => [event.label, event.hotspot, event.prompt, event.expectedSignal]);
  const rawAnchors = [
    label,
    stageSpec.title,
    stageSpec.visualTone,
    stageSpec.spatialMetaphor,
    stageSpec.relationTrigger,
    ...eventAnchors,
    ...variantAnchors[stageSpec.variant],
  ];

  return Array.from(
    new Set(
      rawAnchors
        .flatMap((item) => item.split(/[，。、：:；;、\s/]+/))
        .map((item) => item.trim())
        .filter((item) => item.length >= 2),
    ),
  );
}

function isSceneAnchoredSimulation(
  result: RelationshipSimulationResult,
  stageSpec: SceneStageSpec,
  events: GuidedSceneEvent[],
  label: string,
): boolean {
  const anchors = sceneAnchorKeywords(stageSpec, events, label);
  if (!anchors.length) return true;

  const primaryText = [result.conclusion, result.suggestedMove].join(" ");
  return anchors.some((anchor) => primaryText.includes(anchor));
}

function hasSceneAnchor(text: string, anchors: string[]): boolean {
  return anchors.some((anchor) => text.includes(anchor));
}

function softenRelationshipCopy(text: string): string {
  return text
    .replace(/观察/g, "看看")
    .replace(/测试/g, "确认")
    .replace(/一定/g, "可能")
    .replace(/必然/g, "可能")
    .replace(/肯定/g, "可能")
    .replace(/注定/g, "有机会");
}

function looksLikeInventedSharedMemory(firstLine: string): boolean {
  const compact = firstLine.replace(/\s/g, "");
  return /上次|昨天|昨晚|前天|那天|之前|刚刚|刚才|你.*说的|你.*提到|我们.*见过|记得你|我知道你/.test(compact);
}

function normalizeLiveSimulation(
  result: RelationshipSimulationResult,
  fallbackFirstLine: string,
  fallbackSuggestedMove: string,
  sceneAnchors: string[],
): RelationshipSimulationResult {
  const possibleFirstLine = looksLikeInventedSharedMemory(result.possibleFirstLine) ||
    !hasSceneAnchor(result.possibleFirstLine, sceneAnchors)
    ? fallbackFirstLine
    : softenRelationshipCopy(result.possibleFirstLine);
  const suggestedMove = !looksLikeInventedSharedMemory(result.suggestedMove) &&
    hasSceneAnchor(result.suggestedMove, sceneAnchors)
    ? softenRelationshipCopy(result.suggestedMove)
    : fallbackSuggestedMove;

  return {
    ...result,
    conclusion: softenRelationshipCopy(result.conclusion),
    likelyDialogue: result.likelyDialogue.map(softenRelationshipCopy),
    behaviorPreview: result.behaviorPreview.map(softenRelationshipCopy),
    relationshipTrajectory: result.relationshipTrajectory.map(softenRelationshipCopy),
    romancePossibility: softenRelationshipCopy(result.romancePossibility),
    conflictRisk: softenRelationshipCopy(result.conflictRisk),
    badOutcomeScenario: softenRelationshipCopy(result.badOutcomeScenario),
    suggestedMove,
    possibleFirstLine,
    safetyHint: softenRelationshipCopy(result.safetyHint),
  };
}

export function SimulationDetailPage({
  node,
  profile,
  resultStorageKey,
  simulation,
  selectedRoamingSceneId,
  onBackToLog,
  onContinue,
  onLiveSimulationResult,
  onSelectRoamingScene,
}: SimulationDetailPageProps) {
  const [activeScenarioMode, setActiveScenarioMode] = useState<SimulationScenarioMode>("first_meet");
  const [showDetails, setShowDetails] = useState(false);
  const [detailMode, setDetailMode] = useState<DetailMode>("overview");
  const [liveSimulation, setLiveSimulation] = useState<RelationshipSimulationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [apiMode, setApiMode] = useState<DreamTwinApiMode>("static");
  const [activeSceneEventId, setActiveSceneEventId] = useState<string | null>(null);
  const scenarioRef = useRef<HTMLElement | null>(null);
  const detailsRef = useRef<HTMLElement | null>(null);
  const isFriendInvite = simulation.entryMode === "friend_invite";
  const roamingScenes = simulation.roamingScenes ?? [];

  const activeScenario = useMemo(
    () => simulation.scenarios.find((scenario) => scenario.mode === activeScenarioMode) ?? simulation.scenarios[0],
    [activeScenarioMode, simulation.scenarios],
  );
  const scenarioInsight = useMemo(() => {
    const insightMap = {
      first_meet: {
        verdict: "慢热可进入",
        attraction: 68,
        risk: 38,
        pace: 54,
        paceLabel: "低压靠近",
        riskLabel: "误读慢热",
      },
      shared_event: {
        verdict: "协作会升温",
        attraction: 74,
        risk: 46,
        pace: 66,
        paceLabel: "共同经历",
        riskLabel: "主动边界",
      },
      romance: {
        verdict: "有亲密潜力",
        attraction: 82,
        risk: 56,
        pace: 72,
        paceLabel: "慢速升温",
        riskLabel: "过早定义",
      },
      conflict: {
        verdict: "需要校准",
        attraction: 48,
        risk: 78,
        pace: 36,
        paceLabel: "暂停确认",
        riskLabel: "压力后退",
      },
    } satisfies Record<SimulationScenarioMode, {
      attraction: number;
      pace: number;
      paceLabel: string;
      risk: number;
      riskLabel: string;
      verdict: string;
    }>;

    return insightMap[activeScenario?.mode ?? "first_meet"];
  }, [activeScenario?.mode]);
  const activeRoamingScene = useMemo(
    () => roamingScenes.find((scene) => scene.id === selectedRoamingSceneId) ?? roamingScenes[0],
    [roamingScenes, selectedRoamingSceneId],
  );
  const liveScenePrompt = useMemo(() => {
    if (isFriendInvite && activeRoamingScene) {
      return `${simulation.title} / ${activeRoamingScene.label}：${activeRoamingScene.premise}`;
    }

    return `${simulation.title} / ${activeScenario?.label ?? "关系预演"}：${activeScenario?.premise ?? simulation.scene}`;
  }, [activeRoamingScene, activeScenario?.label, activeScenario?.premise, isFriendInvite, simulation.scene, simulation.title]);
  const activeExperience: ActiveExperience = useMemo(() => {
    if (isFriendInvite && activeRoamingScene) {
      return {
        label: activeRoamingScene.label,
        premise: activeRoamingScene.premise,
        relationshipOutcome: activeRoamingScene.relationshipOutcome,
        likelyDialogue: activeRoamingScene.likelyDialogue,
        behaviorPreview: activeRoamingScene.behaviorPreview,
        romanceSignal: activeRoamingScene.romanceSignal,
        riskSignal: activeRoamingScene.riskSignal,
        suggestedMove: activeRoamingScene.suggestedMove,
        possibleFirstLine: activeRoamingScene.possibleFirstLine,
        className: `friend-roaming friend-roaming-${activeRoamingScene.id}`,
        insight: {
          attraction: activeRoamingScene.attraction,
          pace: activeRoamingScene.pace,
          paceLabel: activeRoamingScene.paceLabel,
          risk: activeRoamingScene.risk,
          riskLabel: activeRoamingScene.riskLabel,
          verdict: activeRoamingScene.verdict,
        },
      };
    }

    const scenario = activeScenario as RelationshipScenario;

    return {
      label: scenario.label,
      premise: scenario.premise,
      relationshipOutcome: scenario.relationshipOutcome,
      likelyDialogue: scenario.likelyDialogue,
      behaviorPreview: scenario.behaviorPreview,
      romanceSignal: scenario.romanceSignal,
      riskSignal: scenario.riskSignal,
      suggestedMove: scenario.suggestedMove,
      possibleFirstLine: simulation.possibleFirstLine,
      className: scenario.mode,
      insight: scenarioInsight,
    };
  }, [activeRoamingScene, activeScenario, isFriendInvite, scenarioInsight, simulation.possibleFirstLine]);
  const renderedExperience: ActiveExperience = useMemo(() => {
    if (!liveSimulation) return activeExperience;

    return {
      ...activeExperience,
      relationshipOutcome: liveSimulation.conclusion,
      likelyDialogue: liveSimulation.likelyDialogue,
      behaviorPreview: liveSimulation.behaviorPreview,
      romanceSignal: liveSimulation.romancePossibility,
      riskSignal: `${liveSimulation.conflictRisk} ${liveSimulation.badOutcomeScenario}`,
      suggestedMove: liveSimulation.suggestedMove,
      possibleFirstLine: liveSimulation.possibleFirstLine,
      insight: {
        ...activeExperience.insight,
        attraction: liveSimulation.attractionScore,
        pace: liveSimulation.paceScore,
        risk: liveSimulation.riskScore,
        verdict: "AI 实时预演",
      },
    };
  }, [activeExperience, liveSimulation]);
  const guidedSceneEvents = useMemo(() => {
    const events =
      isFriendInvite && activeRoamingScene?.guidedSceneEvents?.length
        ? activeRoamingScene.guidedSceneEvents
        : simulation.guidedSceneEvents;

    return events?.length ? events : fallbackGuidedEvents(activeExperience.label);
  }, [activeExperience.label, activeRoamingScene?.guidedSceneEvents, isFriendInvite, simulation.guidedSceneEvents]);
  const activeSceneStageSpec = useMemo(() => {
    if (isFriendInvite && activeRoamingScene?.sceneStageSpec) return activeRoamingScene.sceneStageSpec;
    if (simulation.sceneStageSpec) return simulation.sceneStageSpec;

    return fallbackSceneStageSpec(
      activeExperience.label,
      activeRoamingScene?.sceneStageVariant ?? simulation.sceneStageVariant ?? "starlight",
    );
  }, [
    activeExperience.label,
    activeRoamingScene?.sceneStageSpec,
    activeRoamingScene?.sceneStageVariant,
    isFriendInvite,
    simulation.sceneStageSpec,
    simulation.sceneStageVariant,
  ]);
  const activeSceneEvent = useMemo(
    () => guidedSceneEvents.find((event) => event.id === activeSceneEventId) ?? guidedSceneEvents[0],
    [activeSceneEventId, guidedSceneEvents],
  );
  const counterpartProfile = useMemo(() => {
    if (simulation.counterpartProfileSnapshot) return simulation.counterpartProfileSnapshot;
    if (simulation.friendProfile) {
      return {
        name: simulation.friendProfile.name,
        relationLabel: simulation.friendProfile.relationLabel,
        personalityKeywords: simulation.friendProfile.keywords,
        interests: [],
        communicationStyle: simulation.friendProfile.presence,
        values: ["边界感", "共同经历"],
        optionalSignals: [simulation.friendProfile.presence],
      };
    }

    return {
      name: simulation.counterpartName,
      relationLabel: isFriendInvite ? "好友梦境漫游对象" : "梦境广场预演对象",
      personalityKeywords: [simulation.counterpartProjection],
      interests: [],
      communicationStyle: simulation.counterpartProjection,
      values: ["关系可能性", "真实互动"],
      optionalSignals: simulation.matchReasons,
    };
  }, [
    isFriendInvite,
    simulation.counterpartName,
    simulation.counterpartProfileSnapshot,
    simulation.counterpartProjection,
    simulation.friendProfile,
    simulation.matchReasons,
  ]);
  const relationshipGoal =
    simulation.relationshipGoal ||
    (isFriendInvite
      ? `判断和 ${simulation.counterpartName} 的好友关系能否通过共同经历自然推进。`
      : profile.relationshipIntention);
  const simulationBasis = [
    { label: "你的分身", value: profile.personalityKeywords.slice(0, 2).join(" / ") || profile.nickname },
    { label: "对方画像", value: counterpartProfile.personalityKeywords.slice(0, 2).join(" / ") || simulation.counterpartName },
    { label: "场景舞台", value: activeSceneStageSpec.relationTrigger },
    { label: "场景事件", value: activeSceneEvent.label },
    { label: "关系目标", value: relationshipGoal },
  ];

  const actionLabel =
    isFriendInvite && node.status === "opened"
      ? "进入梦境门"
      : isFriendInvite && node.status === "both_entered"
        ? "确认这段共同梦境"
      : isFriendInvite && node.status === "waiting"
        ? "回到等待好友入梦"
        : node.status === "opened"
          ? "进入已打开的梦境门"
          : node.status === "waiting"
            ? "回到等待状态"
            : "发送入梦邀请";
  const actionHint =
    isFriendInvite && node.status === "opened"
      ? "梦境门已打开，下一步由你亲自编辑第一句话。"
      : isFriendInvite && node.status === "both_entered"
        ? "双方已入梦，确认这段共同梦境后才会打开真实聊天入口。"
      : isFriendInvite && node.status === "waiting"
        ? "好友确认前不会生成共同预演，也不会打开聊天。"
        : node.status === "opened"
          ? "梦境门已打开，下一步由你亲自编辑第一句话。"
          : node.status === "waiting"
            ? "对方确认前不会打开消息，你可以回到今日等待回应。"
            : "发送后进入等待区；对方确认前不会出现真实聊天。";
  const reportMetrics = [
    {
      label: "共鸣线索",
      value: renderedExperience.insight.attraction,
      display: signalLevel(renderedExperience.insight.attraction, "connection"),
      tone: "blue",
    },
    {
      label: "推进节奏",
      value: renderedExperience.insight.pace,
      display: signalLevel(renderedExperience.insight.pace, "pace"),
      tone: "violet",
    },
    {
      label: "误解风险",
      value: renderedExperience.insight.risk,
      display: signalLevel(renderedExperience.insight.risk, "risk"),
      tone: "gold",
    },
  ];
  const suggestedMoveLabel = isFriendInvite && node.status === "opened" ? "建议下一步" : "建议第一步";
  const displaySuggestedMove = adaptFriendInviteMoveAfterAcceptance(renderedExperience.suggestedMove, isFriendInvite);
  const apiStatusLabel =
    apiMode === "live"
      ? "当前结论来自 AI 生成，本地保底内容仍可随时接管。"
      : apiMode === "fallback"
        ? generationError
        : isGenerating
          ? "正在尝试生成当前关系预演。"
          : "当前使用本地保底预演内容。";
  const detailSections: Array<{ id: DetailMode; icon: JSX.Element; label: string }> = [
    { id: "overview", icon: <Sparkles size={14} />, label: "推演过程" },
    { id: "dialogue", icon: <MessageCircle size={14} />, label: "会聊什么" },
    { id: "behavior", icon: <Route size={14} />, label: "会做什么" },
    { id: "risk", icon: <AlertTriangle size={14} />, label: "风险走向" },
  ];
  const stageVariant = sceneVariantForStage(activeSceneStageSpec.variant);

  useEffect(() => {
    setActiveScenarioMode(simulation.scenarios[0]?.mode ?? "first_meet");
    setShowDetails(false);
    setDetailMode("overview");
    setActiveSceneEventId(null);
  }, [simulation.id, simulation.scenarios]);

  useEffect(() => {
    setActiveSceneEventId(guidedSceneEvents[0]?.id ?? null);
  }, [activeExperience.label, guidedSceneEvents]);

  useEffect(() => {
    let isCurrent = true;

    setLiveSimulation(null);
    setIsGenerating(true);
    setGenerationError(null);
    setApiMode("static");

    if (!isDreamTwinApiEnabled()) {
      setIsGenerating(false);
      return () => {
        isCurrent = false;
      };
    }

    generateRelationshipSimulation({
      profile,
      counterpartName: simulation.counterpartName,
      counterpartProfile,
      scene: liveScenePrompt,
      sceneStageSpec: activeSceneStageSpec,
      sceneEvent: activeSceneEvent,
      guidedSceneEvents,
      relationshipGoal,
    })
      .then((result) => {
        if (!isCurrent) return;
        if (!isSceneAnchoredSimulation(result.simulation, activeSceneStageSpec, guidedSceneEvents, activeExperience.label)) {
          throw new DreamTwinApiError(
            "scene_unanchored",
            "AI 输出没有贴合当前梦境场景，已切回静态场景预演。",
          );
        }
        const normalizedSimulation = normalizeLiveSimulation(
          result.simulation,
          activeExperience.possibleFirstLine,
          activeExperience.suggestedMove,
          sceneAnchorKeywords(activeSceneStageSpec, guidedSceneEvents, activeExperience.label),
        );
        setLiveSimulation(normalizedSimulation);
        setApiMode("live");
        onLiveSimulationResult(resultStorageKey, normalizedSimulation);
      })
      .catch((error) => {
        if (!isCurrent) return;
        setGenerationError(describeDreamTwinApiError(error));
        setApiMode("fallback");
      })
      .finally(() => {
        if (!isCurrent) return;
        setIsGenerating(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [
    activeSceneEvent,
    activeSceneStageSpec,
    counterpartProfile,
    guidedSceneEvents,
    liveScenePrompt,
    node.id,
    onLiveSimulationResult,
    profile,
    relationshipGoal,
    resultStorageKey,
    simulation.counterpartName,
  ]);

  const selectScenario = (mode: SimulationScenarioMode) => {
    setActiveScenarioMode(mode);
    setShowDetails(false);
    setDetailMode("overview");
  };
  const selectRoamingScene = (sceneId: string) => {
    onSelectRoamingScene(sceneId);
    setShowDetails(false);
    setDetailMode("overview");
  };

  const scrollIntoView = (element: HTMLElement | null) => {
    window.requestAnimationFrame(() => element?.scrollIntoView({ block: "start", behavior: "smooth" }));
  };

  const openDetails = (mode: DetailMode = "overview") => {
    setDetailMode(mode);
    setShowDetails(true);
    scrollIntoView(detailsRef.current);
  };

  const toggleDetails = () => {
    if (showDetails) {
      setShowDetails(false);
      return;
    }
    openDetails("overview");
  };

  return (
    <section className={`page page-scroll scene-page simulation-page simulation-scenario-${activeExperience.className}`}>
      <ThreeDreamScene variant={stageVariant} className={`page-scene simulation-scene simulation-stage-scene-${stageVariant}`} />
      <div className="page-content simulation-content">
        <div className="simulation-hero simulation-hero-compact">
          <div>
            <p className="label">{isFriendInvite ? "共同梦境预演" : "先看关系结论"}</p>
            <h1>{simulation.title}</h1>
            <p className="simulation-subtitle">
              {isFriendInvite
                ? `你和 ${simulation.counterpartName} 选择了「${renderedExperience.label}」，先看关系可能被怎样推动。`
                : `AI 正在预演你和 ${simulation.counterpartName} 的第一段关系可能。`}
            </p>
          </div>
          <StatusPill entryMode={node.entryMode} status={node.status} />
        </div>
        <button className="text-button simulation-log-link" onClick={onBackToLog} type="button">
          <Compass size={15} />
          回到梦境地图
        </button>

        <section className="simulation-decision" aria-label="关系预演结论">
          <div className="decision-kicker">
            <span>{isFriendInvite ? "AI 漫游结论" : "AI 关系结论"}</span>
            <strong>你 × {simulation.counterpartName}</strong>
          </div>
          <div className="decision-steps" aria-label="关系预演决策节奏">
            <span>先看结论</span>
            <span>再看原因</span>
            <span>最后决定</span>
          </div>
          {isFriendInvite ? (
            <div className="simulation-shared-handoff" aria-label="共同梦境确认路径">
              <span>{simulation.counterpartName} 已入梦</span>
              <strong>{renderedExperience.label}</strong>
              <span>确认后梦境门打开</span>
            </div>
          ) : null}
          <div className={`api-status simulation-api-status api-status-${apiMode}`} role="status">
            <span>{apiMode === "live" ? "AI 生成" : apiMode === "fallback" ? "保底内容" : "本地内容"}</span>
            <p>{apiStatusLabel}</p>
          </div>
          <div className="decision-verdict">
            <strong>{renderedExperience.insight.verdict}</strong>
            <p>{renderedExperience.relationshipOutcome}</p>
          </div>
          <div className="report-meter-row decision-meter-row" aria-label="关系预演信号">
            {reportMetrics.map((metric) => (
              <div
                aria-label={`${metric.label}：${metric.display}`}
                className={`report-meter report-meter-${metric.tone}`}
                key={metric.label}
              >
                <span>{metric.label}</span>
                <strong>{metric.display}</strong>
                <div>
                  <i style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="recommended-move decision-move">
            <span>{suggestedMoveLabel}</span>
            <strong>{displaySuggestedMove}</strong>
            <blockquote className="simulation-quote">{renderedExperience.possibleFirstLine}</blockquote>
          </div>
          <div className="decision-action-strip" aria-label="关系预演后可选择的下一步">
            <button onClick={() => onContinue(node.id)} type="button">
              <DoorOpen size={15} />
              <span>{actionLabel}</span>
            </button>
            <button onClick={() => scrollIntoView(scenarioRef.current)} type="button">
              <ArrowRight size={15} />
              <span>{isFriendInvite ? "换个场景" : "换个问题"}</span>
            </button>
            <button onClick={() => openDetails("overview")} type="button">
              <Sparkles size={15} />
              <span>看原因</span>
            </button>
          </div>
          <p className="decision-action-hint">{actionHint}</p>
        </section>

        <section className="scenario-switcher scenario-switcher-compact" ref={scenarioRef} aria-label="换个问题看看">
          <div className="scenario-switcher-heading">
            <span>{isFriendInvite ? "换个共同经历" : "换个关系问题"}</span>
            <strong>{isFriendInvite ? "同一个好友，不同梦境。" : "轻量切换，不打断决策。"}</strong>
          </div>
          <div className="scenario-tabs" role="tablist" aria-label="关系预演场景">
            {isFriendInvite
              ? roamingScenes.map((scene) => (
                  <button
                    aria-selected={scene.id === activeRoamingScene?.id}
                    className={scene.id === activeRoamingScene?.id ? "scenario-tab-active" : ""}
                    key={scene.id}
                    onClick={() => selectRoamingScene(scene.id)}
                    role="tab"
                    type="button"
                  >
                    {scene.label}
                  </button>
                ))
              : simulation.scenarios.map((scenario) => (
                  <button
                    aria-selected={scenario.mode === activeScenarioMode}
                    className={scenario.mode === activeScenarioMode ? "scenario-tab-active" : ""}
                    key={scenario.mode}
                    onClick={() => selectScenario(scenario.mode)}
                    role="tab"
                    type="button"
                  >
                    {scenario.label}
                  </button>
                ))}
          </div>
          <p>{activeExperience.premise}</p>
        </section>

        <section className={`simulation-details ${showDetails ? "simulation-details-open" : ""}`} ref={detailsRef}>
          <div className="detail-summary-row">
            <span>想看原因和片段再展开</span>
            <button onClick={toggleDetails} type="button">
              {showDetails ? "收起详细推演" : "看详细推演"}
            </button>
          </div>
          {showDetails ? (
            <>
              <div className="detail-mode-tabs" role="tablist" aria-label="详细推演分段">
                {detailSections.map((section) => (
                  <button
                    aria-selected={section.id === detailMode}
                    className={section.id === detailMode ? "detail-mode-active" : ""}
                    key={section.id}
                    onClick={() => setDetailMode(section.id)}
                    role="tab"
                    type="button"
                  >
                    {section.icon}
                    <span>{section.label}</span>
                  </button>
                ))}
              </div>

              {detailMode === "overview" ? (
                <section className="detail-panel" aria-label="关系推演过程">
                  <div className="simulation-basis simulation-basis-detail" aria-label="AI 模拟依据">
                    {simulationBasis.map((item) => (
                      <div key={item.label}>
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                  <section className="guided-scene-events guided-scene-events-inline" aria-label="引导式梦境场景事件">
                    <div className="guided-scene-heading">
                      <span>场景触发点</span>
                      <strong>{activeSceneStageSpec.relationTrigger}</strong>
                    </div>
                    <div className="guided-hotspot-row" role="tablist" aria-label="梦境事件热点">
                      {guidedSceneEvents.map((event, index) => (
                        <button
                          aria-selected={event.id === activeSceneEvent.id}
                          className={event.id === activeSceneEvent.id ? "guided-hotspot-active" : ""}
                          key={event.id}
                          onClick={() => setActiveSceneEventId(event.id)}
                          role="tab"
                          type="button"
                        >
                          <b>{String(index + 1).padStart(2, "0")}</b>
                          <span>{event.label}</span>
                        </button>
                      ))}
                    </div>
                    <article className="guided-scene-panel" aria-label="当前梦境事件">
                      <div>
                        <span>{activeSceneStageSpec.title}</span>
                        <strong>{activeSceneEvent.hotspot}</strong>
                      </div>
                      <p>{activeSceneEvent.prompt}</p>
                      <div className="guided-scene-question">
                        <span>{activeSceneEvent.relationQuestion}</span>
                        <strong>{activeSceneEvent.expectedSignal}</strong>
                      </div>
                      <div className="guided-scene-camera">
                        <span>场景范围</span>
                        <strong>{activeSceneStageSpec.boundaryNote}</strong>
                      </div>
                    </article>
                  </section>
                  <section className="relationship-animation relationship-animation-compact relationship-animation-4">
                    <div className="relation-depth-grid" />
                    <div className="relation-field-label relation-field-label-self">你的分身</div>
                    <div className="relation-field-label relation-field-label-other">{simulation.counterpartName}</div>
                    <div className="relation-signal-board" aria-label="关系预演信号">
                      <div>
                        <span>SELF</span>
                        <strong>{simulation.approachSignal}</strong>
                      </div>
                      <div>
                        <span>OTHER</span>
                        <strong>{simulation.replySignal}</strong>
                      </div>
                      <div>
                        <span>SYSTEM</span>
                        <strong>{simulation.outcomeSignal}</strong>
                      </div>
                    </div>
                    <div className="relation-orb relation-orb-self" />
                    <div className="relation-orb relation-orb-other" />
                    <div className="relation-trace relation-trace-primary" />
                    <div className="relation-trace relation-trace-reply" />
                    <div className="relation-gate-pulse" />
                    <div className="relation-contact-point" />
                    <div className="relation-signal-readout">
                      <span>关系推演</span>
                      <p>{simulation.tension}</p>
                    </div>
                  </section>
                  <div className="simulation-detail-summary">
                    <span>为什么是这个结论</span>
                    <p>{simulation.relationshipHypothesis}</p>
                  </div>
                </section>
              ) : null}

              {detailMode === "dialogue" ? (
                <section className="detail-panel relationship-script" aria-label="可能对话回放">
                  {renderedExperience.likelyDialogue.map((line, index) => (
                    <div className={index % 2 === 0 ? "script-line script-line-self" : "script-line script-line-other"} key={line}>
                      <span>{index % 2 === 0 ? "你的分身" : simulation.counterpartName}</span>
                      <p>{line}</p>
                    </div>
                  ))}
                </section>
              ) : null}

              {detailMode === "behavior" ? (
                <section className="detail-panel relationship-trajectory" aria-label="可能行为轨迹">
                  {renderedExperience.behaviorPreview.map((step, index) => (
                    <div className="trajectory-step" key={step}>
                      <b>{String(index + 1).padStart(2, "0")}</b>
                      <p>{step}</p>
                    </div>
                  ))}
                </section>
              ) : null}

              {detailMode === "risk" ? (
                <section className="detail-panel relationship-outcome-panel" aria-label="恋爱可能和不好走向">
                  <article>
                    <Heart size={15} />
                    <span>恋爱可能性</span>
                    <strong>{renderedExperience.insight.paceLabel}</strong>
                    <p>{renderedExperience.romanceSignal}</p>
                  </article>
                  <article>
                    <AlertTriangle size={15} />
                    <span>风险与不好走向</span>
                    <strong>{renderedExperience.insight.riskLabel}</strong>
                    <p>{renderedExperience.riskSignal}</p>
                  </article>
                </section>
              ) : null}
            </>
          ) : null}
        </section>
      </div>

      <div className="bottom-action simulation-bottom-action">
        <PrimaryButton icon={<DoorOpen size={18} />} onClick={() => onContinue(node.id)}>
          {actionLabel}
        </PrimaryButton>
        <div className="action-row">
          <PrimaryButton
            variant="secondary"
            icon={<ArrowRight size={17} />}
            onClick={() => scrollIntoView(scenarioRef.current)}
          >
            {isFriendInvite ? "换个场景看看" : "换个问题看看"}
          </PrimaryButton>
          <PrimaryButton variant="ghost" icon={<MessageCircle size={17} />} onClick={() => openDetails("dialogue")}>
            看详细推演
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
