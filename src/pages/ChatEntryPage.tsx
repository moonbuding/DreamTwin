import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Compass, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { RelationshipSimulation } from "../types/dreamtwin";

interface ChatEntryPageProps {
  simulation: RelationshipSimulation;
  onBackToLog: () => void;
  onBackToSimulation: () => void;
}

export function ChatEntryPage({ simulation, onBackToLog, onBackToSimulation }: ChatEntryPageProps) {
  const [selectedStarter, setSelectedStarter] = useState("recommended");
  const [draft, setDraft] = useState(simulation.possibleFirstLine);
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const simulatedReplySource = simulation.counterpartSimulatedReply || simulation.counterpartProjection;
  const starterOptions = useMemo(
    () => [
      {
        id: "recommended",
        label: "用建议第一句",
        note: "最贴近预演结论",
        value: simulation.possibleFirstLine,
      },
      {
        id: "soft",
        label: "先轻一点",
        note: "降低压力，留给对方空间",
        value: `我想先从${simulation.title}这件小事聊起，你会怎么开始？`,
      },
      {
        id: "honest",
        label: "问真实感受",
        note: "把预演拉回真实体验",
        value: "刚才那段预演里，有哪一秒让你觉得像真实会发生的事？",
      },
    ],
    [simulation.possibleFirstLine, simulation.title],
  );
  const activeStarter = starterOptions.find((option) => option.id === selectedStarter) ?? starterOptions[0];
  const simulatedReply = useMemo(
    () =>
      simulatedReplySource.replace("她", "我").replace("他", "我").replace("这说明", "所以"),
    [simulatedReplySource],
  );
  const hasSentMessage = sentMessages.length > 0;

  useEffect(() => {
    setSelectedStarter("recommended");
    setDraft(simulation.possibleFirstLine);
    setSentMessages([]);
  }, [simulation.id, simulation.possibleFirstLine]);

  const selectStarter = (option: (typeof starterOptions)[number]) => {
    setSelectedStarter(option.id);
    setDraft(option.value);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setSentMessages((messages) => [...messages, text]);
    setDraft("");
  };

  return (
    <section className="page page-scroll scene-page chat-entry-page">
      <ThreeDreamScene variant="ambient" className="page-scene chat-scene" />
      <div className="page-content chat-entry-content">
        <p className="label">真实聊天入口</p>
        <h1>现在由你开始。</h1>
        <section className="counterpart-presence">
          <span>双人关系预演已转入真实聊天</span>
          <strong>{simulation.counterpartName}</strong>
          <p>{simulation.rehearsalOutcome}</p>
        </section>
        <section className="chat-handoff-panel" aria-label="真实聊天交接状态">
          <div>
            <CheckCircle2 size={15} />
            <span>预演结论已锁定</span>
          </div>
          <div>
            <ShieldCheck size={15} />
            <span>第一句话风险已校准</span>
          </div>
          <div>
            <Send size={15} />
            <span>等待你亲自发送</span>
          </div>
        </section>
        <section className="chat-briefing" aria-label="预演后的行动建议">
          <span>建议动作</span>
          <p>{simulation.recommendedMove}</p>
        </section>
        <section className="chat-suggestions" aria-label="第一句话建议">
          <span>选择一种开场</span>
          <div>
            {starterOptions.map((option) => (
              <button
                aria-pressed={option.id === selectedStarter}
                className={option.id === selectedStarter ? "chat-suggestion-active" : ""}
                key={option.id}
                onClick={() => selectStarter(option)}
                type="button"
              >
                <strong>{option.label}</strong>
                <small>{option.note}</small>
              </button>
            ))}
          </div>
        </section>
        <section className="message-readiness" aria-label="发送前确认">
          <span>发送前确认</span>
          <div>
            <b>策略</b>
            <p>{activeStarter.note}</p>
          </div>
          <div>
            <b>边界</b>
            <p>这不是 AI 代替你聊天，只是把预演建议转成你可以亲自发送的第一句话。</p>
          </div>
        </section>
        <section className="chat-thread" aria-label="聊天预览">
          <div className="chat-bubble chat-bubble-counterpart">
            <span>{simulation.counterpartName}</span>
            <p>我也看到了刚才的关系预演。你想从哪一句开始聊？</p>
          </div>
          {sentMessages.map((message, index) => (
            <div className="chat-bubble chat-bubble-me" key={`${message}-${index}`}>
              <span>你</span>
              <p>{message}</p>
            </div>
          ))}
          {sentMessages.length > 0 ? (
            <div className="chat-bubble chat-bubble-counterpart">
              <span>{simulation.counterpartName}</span>
              <p>{simulatedReply}</p>
            </div>
          ) : null}
          {hasSentMessage ? (
            <div className="chat-delivery-receipt" aria-label="发送完成状态">
              <CheckCircle2 size={15} />
              <span>第一句话已进入真实聊天。DreamTwin 的工作到这里结束，接下来交还给你。</span>
            </div>
          ) : null}
        </section>
        <div className="chat-composer" aria-label="编辑第一句话">
          <div className="composer-label">
            <span>由你亲自发送</span>
            <strong>{activeStarter.label}</strong>
          </div>
          <textarea
            aria-label="输入第一句话"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) sendMessage();
            }}
          />
          <div className="composer-actions">
            <button onClick={() => setDraft(activeStarter.value)} type="button" aria-label="恢复当前建议">
              <RefreshCw size={15} />
            </button>
            <button
              className="composer-send-button"
              disabled={!draft.trim()}
              onClick={sendMessage}
              type="button"
              aria-label="发送第一句话"
            >
              <Send size={17} />
              <span>发送</span>
            </button>
          </div>
        </div>
        <p className="helper-copy">可编辑后发送。按 Ctrl / Command + Enter 也可以发送。</p>
      </div>
      <div className="bottom-action">
        <div className="action-row">
          <PrimaryButton variant="secondary" icon={<ArrowLeft size={18} />} onClick={onBackToSimulation}>
            回看预演结果
          </PrimaryButton>
          <PrimaryButton variant="ghost" icon={<Compass size={18} />} onClick={onBackToLog}>
            回到星图
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
