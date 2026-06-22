import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, MessageCircle, RefreshCw, Route } from "lucide-react";
import {
  describeDreamTwinApiError,
  generateRelationshipSimulation,
  isDreamTwinApiEnabled,
  type DreamTwinApiMode,
} from "../api/dreamTwinApi";
import { PrimaryButton } from "../components/PrimaryButton";
import type {
  DreamNode,
  RelationshipScenario,
  RelationshipSimulation,
  RelationshipSimulationResult,
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

interface Insight {
  attraction: number;
  pace: number;
  risk: number;
  verdict: string;
}

const SCENARIO_INSIGHT: Record<SimulationScenarioMode, Insight> = {
  first_meet: { attraction: 76, pace: 68, risk: 32, verdict: "慢热可进入" },
  shared_event: { attraction: 74, pace: 66, risk: 46, verdict: "协作会升温" },
  romance: { attraction: 82, pace: 72, risk: 56, verdict: "有亲密潜力" },
  conflict: { attraction: 48, pace: 36, risk: 78, verdict: "需要校准" },
};

function softenRelationshipCopy(text: string): string {
  return text
    .replace(/一定|必然|肯定/g, "可能")
    .replace(/注定/g, "有机会");
}

function looksLikeInventedMemory(line: string): boolean {
  return /上次|昨天|昨晚|前天|那天|之前|刚刚|刚才|记得你|我知道你/.test(line.replace(/\s/g, ""));
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
  const isFriendInvite = simulation.entryMode === "friend_invite";
  const roamingScenes = simulation.roamingScenes ?? [];
  const [activeScenarioMode, setActiveScenarioMode] = useState<SimulationScenarioMode>(
    simulation.scenarios[0]?.mode ?? "first_meet",
  );
  const [showDetails, setShowDetails] = useState(false);
  const [liveSimulation, setLiveSimulation] = useState<RelationshipSimulationResult | null>(null);
  const [apiMode, setApiMode] = useState<DreamTwinApiMode>("static");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const activeRoamingScene = useMemo(
    () => roamingScenes.find((scene) => scene.id === selectedRoamingSceneId) ?? roamingScenes[0],
    [roamingScenes, selectedRoamingSceneId],
  );
  const activeScenario = useMemo(
    () => simulation.scenarios.find((scenario) => scenario.mode === activeScenarioMode) ?? simulation.scenarios[0],
    [activeScenarioMode, simulation.scenarios],
  );

  const baseExperience = useMemo(() => {
    if (isFriendInvite && activeRoamingScene) {
      return {
        subtitle: activeRoamingScene.premise,
        conclusion: activeRoamingScene.relationshipOutcome,
        likelyDialogue: activeRoamingScene.likelyDialogue,
        behaviorPreview: activeRoamingScene.behaviorPreview,
        riskSignal: activeRoamingScene.riskSignal,
        suggestedMove: activeRoamingScene.suggestedMove,
        possibleFirstLine: activeRoamingScene.possibleFirstLine,
        insight: {
          attraction: activeRoamingScene.attraction,
          pace: activeRoamingScene.pace,
          risk: activeRoamingScene.risk,
          verdict: activeRoamingScene.verdict,
        } as Insight,
      };
    }

    const scenario = activeScenario as RelationshipScenario;
    return {
      subtitle: simulation.relationshipHypothesis,
      conclusion: scenario?.relationshipOutcome ?? simulation.rehearsalOutcome,
      likelyDialogue: scenario?.likelyDialogue ?? simulation.conversationPreview,
      behaviorPreview: scenario?.behaviorPreview ?? simulation.relationshipTrajectory,
      riskSignal: scenario?.riskSignal ?? simulation.conflictRisk,
      suggestedMove: scenario?.suggestedMove ?? simulation.recommendedMove,
      possibleFirstLine: simulation.possibleFirstLine,
      insight: SCENARIO_INSIGHT[activeScenario?.mode ?? "first_meet"],
    };
  }, [activeRoamingScene, activeScenario, isFriendInvite, simulation]);

  const experience = useMemo(() => {
    if (!liveSimulation) return baseExperience;
    return {
      ...baseExperience,
      conclusion: liveSimulation.conclusion,
      likelyDialogue: liveSimulation.likelyDialogue,
      behaviorPreview: liveSimulation.behaviorPreview,
      riskSignal: `${liveSimulation.conflictRisk} ${liveSimulation.badOutcomeScenario}`,
      suggestedMove: liveSimulation.suggestedMove,
      possibleFirstLine: liveSimulation.possibleFirstLine,
      insight: {
        attraction: liveSimulation.attractionScore,
        pace: liveSimulation.paceScore,
        risk: liveSimulation.riskScore,
        verdict: "AI 实时预演",
      } as Insight,
    };
  }, [baseExperience, liveSimulation]);

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
  }, [isFriendInvite, simulation]);

  const relationshipGoal =
    simulation.relationshipGoal ||
    (isFriendInvite ? `判断和 ${simulation.counterpartName} 的好友关系能否自然推进。` : profile.relationshipIntention);
  const scenePrompt =
    isFriendInvite && activeRoamingScene
      ? `${simulation.title} / ${activeRoamingScene.label}：${activeRoamingScene.premise}`
      : `${simulation.title} / ${activeScenario?.label ?? "关系预演"}：${activeScenario?.premise ?? simulation.scene}`;

  useEffect(() => {
    let isCurrent = true;
    setLiveSimulation(null);
    setGenerationError(null);
    setApiMode("static");

    if (!isDreamTwinApiEnabled()) return undefined;

    generateRelationshipSimulation({
      profile,
      counterpartName: simulation.counterpartName,
      counterpartProfile,
      scene: scenePrompt,
      sceneStageSpec: activeRoamingScene?.sceneStageSpec ?? simulation.sceneStageSpec,
      guidedSceneEvents: activeRoamingScene?.guidedSceneEvents ?? simulation.guidedSceneEvents,
      relationshipGoal,
    })
      .then((result) => {
        if (!isCurrent) return;
        const safeFirstLine = looksLikeInventedMemory(result.simulation.possibleFirstLine)
          ? baseExperience.possibleFirstLine
          : softenRelationshipCopy(result.simulation.possibleFirstLine);
        const normalized: RelationshipSimulationResult = {
          ...result.simulation,
          conclusion: softenRelationshipCopy(result.simulation.conclusion),
          suggestedMove: softenRelationshipCopy(result.simulation.suggestedMove),
          possibleFirstLine: safeFirstLine,
        };
        setLiveSimulation(normalized);
        setApiMode("live");
        onLiveSimulationResult(resultStorageKey, normalized);
      })
      .catch((error) => {
        if (!isCurrent) return;
        setGenerationError(describeDreamTwinApiError(error));
        setApiMode("fallback");
      });

    return () => {
      isCurrent = false;
    };
  }, [
    activeRoamingScene,
    baseExperience.possibleFirstLine,
    counterpartProfile,
    onLiveSimulationResult,
    profile,
    relationshipGoal,
    resultStorageKey,
    scenePrompt,
    simulation,
  ]);

  const insight = experience.insight;
  const suggestedMoveLabel = isFriendInvite && node.status === "opened" ? "建议下一步" : "建议第一步";
  const displaySuggestedMove = adaptFriendInviteMoveAfterAcceptance(experience.suggestedMove, isFriendInvite);
  const enterLabel =
    node.status === "opened"
      ? "进入梦境门"
      : node.status === "waiting"
        ? "回到等待状态"
        : isFriendInvite
          ? "进入这段共同梦境"
          : "想进入这个梦境";

  const cycleAlternative = () => {
    setShowDetails(false);
    if (isFriendInvite && roamingScenes.length > 1 && activeRoamingScene) {
      const index = roamingScenes.findIndex((scene) => scene.id === activeRoamingScene.id);
      onSelectRoamingScene(roamingScenes[(index + 1) % roamingScenes.length].id);
      return;
    }
    const modes = simulation.scenarios.map((scenario) => scenario.mode);
    if (modes.length > 1) {
      const index = modes.indexOf(activeScenarioMode);
      setActiveScenarioMode(modes[(index + 1) % modes.length]);
    }
  };

  const gauges = [
    { label: "吸引", value: insight.attraction, color: "#6fd3ff" },
    { label: "推进", value: insight.pace, color: "#a779ff" },
    { label: "风险", value: insight.risk, color: "#ffbe74" },
  ];

  return (
    <section className="page page-scroll dt-page dt-light simulation-page">
      <div className="page-content dt-content simulation-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <button className="dt-icon-btn" onClick={onBackToLog} type="button" aria-label="返回">
              <ChevronLeft size={18} />
            </button>
          </div>
          <span className="dt-head-title">{simulation.title}</span>
          <div className="dt-head-right">
            <button className="dt-chip-btn" onClick={onBackToLog} type="button">
              <RefreshCw size={14} />
              换个梦境
            </button>
          </div>
        </header>

        <div className="dt-sim-headline">
          <h1>{experience.conclusion}</h1>
          <p>{experience.subtitle}</p>
        </div>

        {isFriendInvite ? (
          <p className="dt-status-line">共同梦境确认后梦境门打开，真实聊天仍由你亲自开始。</p>
        ) : null}

        <div className="dt-gauges">
          {gauges.map((gauge) => (
            <div className="dt-gauge" key={gauge.label}>
              <div
                className="dt-gauge-ring"
                style={{ ["--val" as string]: gauge.value, ["--g-color" as string]: gauge.color }}
              >
                <strong>{gauge.value}</strong>
              </div>
              <span className="dt-gauge-label">{gauge.label}</span>
            </div>
          ))}
        </div>

        <div className="dt-panel">
          <span className="dt-panel-title">{suggestedMoveLabel}</span>
          <p>{displaySuggestedMove}</p>
          <blockquote className="dt-quote">“{experience.possibleFirstLine}”</blockquote>
        </div>

        {showDetails ? (
          <div className="dt-panel">
            <span className="dt-panel-title">
              <MessageCircle size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              可能会聊什么
            </span>
            {experience.likelyDialogue.slice(0, 4).map((line, index) => (
              <p key={index}>· {line}</p>
            ))}
            <span className="dt-panel-title" style={{ marginTop: 6 }}>
              <Route size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              关系可能怎么走
            </span>
            {experience.behaviorPreview.slice(0, 3).map((line, index) => (
              <p key={index}>· {line}</p>
            ))}
            <p style={{ color: "var(--gold)" }}>风险：{experience.riskSignal}</p>
          </div>
        ) : null}

        {apiMode === "fallback" && generationError ? (
          <p className="dt-status-line">{generationError}</p>
        ) : null}

        <div className="dt-actions">
          <PrimaryButton onClick={() => onContinue(node.id)}>{enterLabel}</PrimaryButton>
          <div className="dt-actions dt-actions-split">
            <PrimaryButton variant="secondary" onClick={() => setShowDetails((value) => !value)}>
              {showDetails ? "收起推演" : "看详细推演"}
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={cycleAlternative}>
              换个问题
            </PrimaryButton>
          </div>
        </div>
      </div>
    </section>
  );
}
