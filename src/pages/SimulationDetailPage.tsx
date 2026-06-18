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
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type {
  DreamNode,
  DreamRoamingScene,
  RelationshipScenario,
  RelationshipSimulation,
  SimulationScenarioMode,
} from "../types/dreamtwin";

interface SimulationDetailPageProps {
  node: DreamNode;
  simulation: RelationshipSimulation;
  resumeAtOutcome: boolean;
  selectedRoamingSceneId: string | null;
  onBackToLog: () => void;
  onContinue: (nodeId: string) => void;
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

export function SimulationDetailPage({
  node,
  simulation,
  selectedRoamingSceneId,
  onBackToLog,
  onContinue,
  onSelectRoamingScene,
}: SimulationDetailPageProps) {
  const [activeScenarioMode, setActiveScenarioMode] = useState<SimulationScenarioMode>("first_meet");
  const [showDetails, setShowDetails] = useState(false);
  const [detailMode, setDetailMode] = useState<DetailMode>("overview");
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
        paceLabel: "低压试探",
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

  const actionLabel =
    isFriendInvite && node.status === "opened"
      ? "进入梦境门"
      : isFriendInvite && node.status === "waiting"
        ? "回到等待好友入梦"
        : node.status === "opened"
          ? "进入已打开的梦境门"
          : node.status === "waiting"
            ? "回到等待状态"
            : "想进入这个梦境";
  const reportMetrics = [
    { label: "吸引", value: activeExperience.insight.attraction, tone: "blue" },
    { label: "推进", value: activeExperience.insight.pace, tone: "violet" },
    { label: "风险", value: activeExperience.insight.risk, tone: "gold" },
  ];
  const detailSections: Array<{ id: DetailMode; icon: JSX.Element; label: string }> = [
    { id: "overview", icon: <Sparkles size={14} />, label: "推演过程" },
    { id: "dialogue", icon: <MessageCircle size={14} />, label: "会聊什么" },
    { id: "behavior", icon: <Route size={14} />, label: "会做什么" },
    { id: "risk", icon: <AlertTriangle size={14} />, label: "风险走向" },
  ];

  useEffect(() => {
    setActiveScenarioMode(simulation.scenarios[0]?.mode ?? "first_meet");
    setShowDetails(false);
    setDetailMode("overview");
  }, [simulation.id, simulation.scenarios]);

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
      <ThreeDreamScene variant="ambient" className="page-scene simulation-scene" />
      <div className="page-content simulation-content">
        <div className="simulation-hero simulation-hero-compact">
          <div>
            <p className="label">{isFriendInvite ? "共同梦境预演" : "先看关系结论"}</p>
            <h1>{simulation.title}</h1>
            <p className="simulation-subtitle">
              {isFriendInvite
                ? `你和 ${simulation.counterpartName} 选择了「${activeExperience.label}」，先看关系会被怎样推动。`
                : `AI 已模拟你和 ${simulation.counterpartName} 的第一段关系走向。`}
            </p>
          </div>
          <StatusPill status={node.status} />
        </div>
        <button className="text-button simulation-log-link" onClick={onBackToLog} type="button">
          <Compass size={15} />
          回到梦境星图
        </button>

        <section className="simulation-decision" aria-label="关系预演结论">
          <div className="decision-kicker">
            <span>{isFriendInvite ? "AI 漫游结论" : "AI 关系结论"}</span>
            <strong>你 × {simulation.counterpartName}</strong>
          </div>
          <div className="decision-verdict">
            <strong>{activeExperience.insight.verdict}</strong>
            <p>{activeExperience.relationshipOutcome}</p>
          </div>
          <div className="report-meter-row decision-meter-row" aria-label="关系预演指标">
            {reportMetrics.map((metric) => (
              <div className={`report-meter report-meter-${metric.tone}`} key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <div>
                  <i style={{ width: `${metric.value}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="recommended-move decision-move">
            <span>建议第一步</span>
            <strong>{activeExperience.suggestedMove}</strong>
            <blockquote className="simulation-quote">{activeExperience.possibleFirstLine}</blockquote>
          </div>
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
                  {activeExperience.likelyDialogue.map((line, index) => (
                    <div className={index % 2 === 0 ? "script-line script-line-self" : "script-line script-line-other"} key={line}>
                      <span>{index % 2 === 0 ? "你的分身" : simulation.counterpartName}</span>
                      <p>{line}</p>
                    </div>
                  ))}
                </section>
              ) : null}

              {detailMode === "behavior" ? (
                <section className="detail-panel relationship-trajectory" aria-label="可能行为轨迹">
                  {activeExperience.behaviorPreview.map((step, index) => (
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
                    <strong>{activeExperience.insight.paceLabel}</strong>
                    <p>{activeExperience.romanceSignal}</p>
                  </article>
                  <article>
                    <AlertTriangle size={15} />
                    <span>风险与不好走向</span>
                    <strong>{activeExperience.insight.riskLabel}</strong>
                    <p>{activeExperience.riskSignal}</p>
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
