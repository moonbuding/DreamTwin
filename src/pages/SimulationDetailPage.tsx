import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  DoorOpen,
  Eye,
  Heart,
  MessageCircle,
  RotateCcw,
  Route,
  SkipForward,
} from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamNode, RelationshipSimulation, SimulationScenarioMode } from "../types/dreamtwin";

interface SimulationDetailPageProps {
  node: DreamNode;
  simulation: RelationshipSimulation;
  resumeAtOutcome: boolean;
  onBackToLog: () => void;
  onContinue: (nodeId: string) => void;
}

const BEAT_DURATION_MS = 5600;

export function SimulationDetailPage({
  node,
  simulation,
  resumeAtOutcome,
  onBackToLog,
  onContinue,
}: SimulationDetailPageProps) {
  const [activeBeatIndex, setActiveBeatIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isBeatSkipped, setIsBeatSkipped] = useState(false);
  const [hasViewedOutcome, setHasViewedOutcome] = useState(false);
  const [replayToken, setReplayToken] = useState(0);
  const [activeScenarioMode, setActiveScenarioMode] = useState<SimulationScenarioMode>("first_meet");
  const reportRef = useRef<HTMLElement | null>(null);
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

    return insightMap[activeScenario.mode];
  }, [activeScenario.mode]);
  const beats = useMemo(
    () => [
      {
        eyebrow: "双人建模",
        title: "先模拟你和对方是谁",
        body: simulation.relationshipHypothesis,
        signal: "双方画像开始建模",
        selfSignal: "读取你的靠近方式",
        otherSignal: "识别对方边界",
        systemSignal: "生成匹配假设",
      },
      {
        eyebrow: "相遇模拟",
        title: `如果进入：${activeScenario.label}`,
        body: activeScenario.premise,
        signal: simulation.hypothesisSignal,
        selfSignal: "进入相遇场景",
        otherSignal: "进入同一事件",
        systemSignal: "生成第一接触",
      },
      {
        eyebrow: "对话行为",
        title: "你们可能会聊什么、做什么",
        body: simulation.twinApproach,
        signal: simulation.approachSignal,
        selfSignal: "发出第一动作",
        otherSignal: "等待是否接住",
        systemSignal: "生成对话片段",
        details: activeScenario.likelyDialogue,
      },
      {
        eyebrow: "关系走势",
        title: "如果继续，会怎么发展",
        body: activeScenario.relationshipOutcome,
        signal: simulation.replySignal,
        selfSignal: "观察推进欲望",
        otherSignal: "回应轨迹出现",
        systemSignal: "推演关系路径",
        details: activeScenario.behaviorPreview,
      },
      {
        eyebrow: "结果建议",
        title: "AI 模拟结果和下一步建议",
        body: activeScenario.suggestedMove,
        signal: simulation.outcomeSignal,
        selfSignal: "整理第一句话",
        otherSignal: "确认关系入口",
        systemSignal: "输出行动建议",
      },
    ],
    [activeScenario, simulation],
  );
  const outcomeIndex = beats.length - 1;
  const activeBeat = beats[activeBeatIndex];
  const isLastBeat = activeBeatIndex === outcomeIndex;
  const rehearsalModeLabel = isAutoPlaying ? "自动预演中" : hasViewedOutcome ? "结论已生成" : "手动推演";
  const hasActiveDecision = node.status === "waiting" || node.status === "opened";
  const actionLabel =
    node.status === "opened" ? "进入已打开的梦境门" : node.status === "waiting" ? "回到等待状态" : "想进入这个梦境";
  const canEnterDream = (hasViewedOutcome && isLastBeat) || hasActiveDecision;
  const reportMetrics = [
    { label: "吸引可能", value: scenarioInsight.attraction, tone: "blue" },
    { label: "推进速度", value: scenarioInsight.pace, tone: "violet" },
    { label: "风险压力", value: scenarioInsight.risk, tone: "gold" },
  ];

  const scrollReportIntoView = () => {
    window.requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  };

  useEffect(() => {
    setActiveScenarioMode(simulation.scenarios[0]?.mode ?? "first_meet");
    setActiveBeatIndex(resumeAtOutcome ? outcomeIndex : 0);
    setIsAutoPlaying(!resumeAtOutcome);
    setIsBeatSkipped(false);
    setHasViewedOutcome(resumeAtOutcome);
    setReplayToken(0);
  }, [outcomeIndex, resumeAtOutcome, simulation.id, simulation.scenarios]);

  useEffect(() => {
    if (!isAutoPlaying) return undefined;

    const timer = window.setTimeout(() => {
      setIsBeatSkipped(false);
      if (activeBeatIndex < outcomeIndex) {
        setActiveBeatIndex((current) => current + 1);
        return;
      }
      setHasViewedOutcome(true);
      setIsAutoPlaying(false);
    }, BEAT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [activeBeatIndex, isAutoPlaying, outcomeIndex, replayToken]);

  const showOutcome = (manual = true) => {
    if (manual) setIsAutoPlaying(false);
    setIsBeatSkipped(false);
    setActiveBeatIndex(outcomeIndex);
    setHasViewedOutcome(true);
    setReplayToken((current) => current + 1);
    if (manual) scrollReportIntoView();
  };

  const skipBeat = () => {
    setIsAutoPlaying(false);
    setIsBeatSkipped(true);
    if (activeBeatIndex >= outcomeIndex) {
      setHasViewedOutcome(true);
      return;
    }
    const nextIndex = activeBeatIndex + 1;
    setActiveBeatIndex(nextIndex);
    if (nextIndex === outcomeIndex) setHasViewedOutcome(true);
    setReplayToken((current) => current + 1);
    if (nextIndex === outcomeIndex) scrollReportIntoView();
  };

  const replayCurrentBeat = () => {
    setIsAutoPlaying(false);
    setIsBeatSkipped(false);
    setReplayToken((current) => current + 1);
  };

  const selectBeat = (index: number) => {
    setIsAutoPlaying(false);
    setIsBeatSkipped(false);
    setActiveBeatIndex(index);
    setHasViewedOutcome(index === outcomeIndex);
    setReplayToken((current) => current + 1);
    if (index === outcomeIndex) scrollReportIntoView();
  };

  const selectScenario = (mode: SimulationScenarioMode) => {
    setActiveScenarioMode(mode);
    setIsAutoPlaying(false);
    setIsBeatSkipped(false);
    setReplayToken((current) => current + 1);

    if (activeBeatIndex === 0) {
      setActiveBeatIndex(1);
      return;
    }
    if (activeBeatIndex === outcomeIndex || hasViewedOutcome) {
      setHasViewedOutcome(true);
      scrollReportIntoView();
    }
  };

  return (
    <section
      className={`page page-scroll scene-page simulation-page simulation-beat-${activeBeatIndex} simulation-scenario-${activeScenario.mode}`}
    >
      <ThreeDreamScene variant="ambient" className="page-scene simulation-scene" />
      <div className="page-content simulation-content">
        <div className="simulation-hero">
          <div>
            <p className="label">AI 双人关系模拟</p>
            <h1>{simulation.title}</h1>
            <p className="simulation-subtitle">
              正在推演：如果你和 {simulation.counterpartName} 真实相遇，会聊什么、怎么靠近、哪里可能变好或变坏。
            </p>
          </div>
          <StatusPill status={node.status} />
        </div>
        <button className="text-button simulation-log-link" onClick={onBackToLog} type="button">
          <Compass size={15} />
          回到梦境星图
        </button>
        <section className="simulation-brief-strip" aria-label="关系模拟摘要">
          <div>
            <span>模拟对象</span>
            <strong>你 × {simulation.counterpartName}</strong>
          </div>
          <div>
            <span>核心变量</span>
            <strong>{simulation.tension}</strong>
          </div>
          <div>
            <span>输出内容</span>
            <strong>{activeScenario.label} / 对话 / 行为 / 走势 / 风险</strong>
          </div>
        </section>
        <section className="scenario-switcher" aria-label="选择关系预演问题">
          <div className="scenario-switcher-heading">
            <span>选择预演问题</span>
            <strong>你想看这段关系在哪一种情况下会怎么发展？</strong>
          </div>
          <div className="scenario-tabs" role="tablist" aria-label="关系预演场景">
            {simulation.scenarios.map((scenario) => (
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
          <p>{activeScenario.premise}</p>
          <div className="scenario-signal-strip" aria-label="当前预演信号">
            <span>结论：{scenarioInsight.verdict}</span>
            <span>吸引 {scenarioInsight.attraction}</span>
            <span>风险 {scenarioInsight.risk}</span>
          </div>
        </section>
        <div className="simulation-stage">
          <section className="relationship-lab" aria-live="polite">
            <span>{rehearsalModeLabel}</span>
            <strong>
              {isBeatSkipped ? "已跳到下一段判断。" : `正在推演「${activeScenario.label}」里的双人反应。`}
            </strong>
          </section>
          <section
            className={`relationship-animation relationship-animation-${activeBeatIndex}`}
            key={`${activeBeatIndex}-${replayToken}`}
            aria-label={activeBeat.signal}
          >
            <div className="relation-depth-grid" />
            <div className="relation-field-label relation-field-label-self">你的分身</div>
            <div className="relation-field-label relation-field-label-other">{simulation.counterpartName}</div>
            <div className="relation-signal-board" aria-label="关系预演信号">
              <div>
                <span>SELF</span>
                <strong>{activeBeat.selfSignal}</strong>
              </div>
              <div>
                <span>OTHER</span>
                <strong>{activeBeat.otherSignal}</strong>
              </div>
              <div>
                <span>SYSTEM</span>
                <strong>{activeBeat.systemSignal}</strong>
              </div>
            </div>
            <div className="relation-orb relation-orb-self" />
            <div className="relation-orb relation-orb-other" />
            <div className="relation-trace relation-trace-primary" />
            <div className="relation-trace relation-trace-reply" />
            <div className="relation-gate-pulse" />
            <div className="relation-contact-point" />
            <div className="relation-signal-readout">
              <span>{activeBeat.eyebrow}</span>
              <p>{activeBeat.signal}</p>
            </div>
            {isAutoPlaying ? (
              <div
                className="rehearsal-autoplay-bar"
                key={`bar-${activeBeatIndex}-${replayToken}`}
                style={{ animationDuration: `${BEAT_DURATION_MS}ms` }}
              />
            ) : null}
          </section>
          <section className="simulation-beat">
            <div className="beat-index">{String(activeBeatIndex + 1).padStart(2, "0")}</div>
            <div>
              <span>{activeBeat.eyebrow}</span>
              <strong>{activeBeat.title}</strong>
              <p>{activeBeat.body}</p>
              {"details" in activeBeat && activeBeat.details ? (
                <div className="simulation-lines">
                  {activeBeat.details.map((detail) => (
                    <span key={detail}>{detail}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
          <section className="simulation-progress-dots" aria-label="关系预演进度">
            {beats.map((beat, index) => (
              <button
                aria-label={`查看${beat.eyebrow}`}
                className={index === activeBeatIndex ? "simulation-dot-active" : ""}
                key={beat.eyebrow}
                onClick={() => selectBeat(index)}
                type="button"
              />
            ))}
          </section>
          {isLastBeat ? (
            <section className="simulation-report" ref={reportRef} aria-label="AI 双人关系模拟结果">
              <div className="simulation-report-hero">
                <div>
                  <span>AI 双人关系模拟结果</span>
                  <strong>{scenarioInsight.verdict}</strong>
                  <p>{activeScenario.relationshipOutcome}</p>
                </div>
                <div className="report-verdict-orbit" aria-hidden="true">
                  <i />
                  <b />
                </div>
              </div>
              <div className="report-meter-row" aria-label="关系预演指标">
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
              <section className="relationship-script" aria-label="可能对话回放">
                <div className="report-section-title">
                  <MessageCircle size={15} />
                  <span>可能会聊什么</span>
                </div>
                {activeScenario.likelyDialogue.map((line, index) => (
                  <div className={index % 2 === 0 ? "script-line script-line-self" : "script-line script-line-other"} key={line}>
                    <span>{index % 2 === 0 ? "你的分身" : simulation.counterpartName}</span>
                    <p>{line}</p>
                  </div>
                ))}
              </section>
              <section className="relationship-trajectory" aria-label="可能行为轨迹">
                <div className="report-section-title">
                  <Route size={15} />
                  <span>可能会做什么</span>
                </div>
                {activeScenario.behaviorPreview.map((step, index) => (
                  <div className="trajectory-step" key={step}>
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <p>{step}</p>
                  </div>
                ))}
              </section>
              <section className="relationship-outcome-panel" aria-label="关系走势和风险">
                <article>
                  <Heart size={15} />
                  <span>恋爱可能性</span>
                  <strong>{scenarioInsight.paceLabel}</strong>
                  <p>{activeScenario.romanceSignal}</p>
                </article>
                <article>
                  <AlertTriangle size={15} />
                  <span>风险与不好走向</span>
                  <strong>{scenarioInsight.riskLabel}</strong>
                  <p>{activeScenario.riskSignal}</p>
                </article>
              </section>
              <div className="recommended-move recommended-move-primary">
                <span>建议第一步</span>
                <strong>{activeScenario.suggestedMove}</strong>
                <blockquote className="simulation-quote">{simulation.possibleFirstLine}</blockquote>
              </div>
            </section>
          ) : null}
          <div className="match-reasons">
            <span>预演里的有效信号</span>
            <div className="keyword-row">
              {simulation.matchReasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="bottom-action">
        <div className="rehearsal-control-row">
          <button onClick={skipBeat} type="button" aria-label="跳过本幕">
            <SkipForward size={15} />
            <span>跳过本幕</span>
          </button>
          <button onClick={() => showOutcome()} type="button" aria-label="直接看结论">
            <Eye size={15} />
            <span>直接看结论</span>
          </button>
          <button onClick={replayCurrentBeat} type="button" aria-label="重播当前幕">
            <RotateCcw size={15} />
            <span>重播当前幕</span>
          </button>
        </div>
        {!canEnterDream ? (
          <PrimaryButton icon={<ArrowRight size={18} />} onClick={skipBeat}>
            继续播放关系预演
          </PrimaryButton>
        ) : (
          <PrimaryButton icon={<DoorOpen size={18} />} onClick={() => onContinue(node.id)}>
            {actionLabel}
          </PrimaryButton>
        )}
      </div>
    </section>
  );
}
