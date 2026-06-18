import { useMemo, useState } from "react";
import { ArrowLeft, Compass, Send } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { RelationshipSimulation } from "../types/dreamtwin";

interface ChatEntryPageProps {
  simulation: RelationshipSimulation;
  onBackToLog: () => void;
  onBackToSimulation: () => void;
}

export function ChatEntryPage({ simulation, onBackToLog, onBackToSimulation }: ChatEntryPageProps) {
  const [draft, setDraft] = useState(simulation.possibleFirstLine);
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const simulatedReplySource = simulation.counterpartSimulatedReply || simulation.counterpartProjection;
  const starterOptions = useMemo(
    () => [
      { label: "用建议第一句", value: simulation.possibleFirstLine },
      { label: "先轻一点", value: `我想先从${simulation.title}这件小事聊起，你会怎么开始？` },
      { label: "问真实感受", value: "刚才那段预演里，有哪一秒让你觉得像真实会发生的事？" },
    ],
    [simulation.possibleFirstLine, simulation.title],
  );
  const simulatedReply = useMemo(
    () =>
      simulatedReplySource.replace("她", "我").replace("他", "我").replace("这说明", "所以"),
    [simulatedReplySource],
  );

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
        <section className="chat-briefing" aria-label="预演后的行动建议">
          <span>建议动作</span>
          <p>{simulation.recommendedMove}</p>
        </section>
        <section className="chat-suggestions" aria-label="第一句话建议">
          <span>选择一种开场</span>
          <div>
            {starterOptions.map((option) => (
              <button key={option.label} onClick={() => setDraft(option.value)} type="button">
                {option.label}
              </button>
            ))}
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
        </section>
        <div className="chat-composer">
          <input
            aria-label="输入第一句话"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendMessage();
            }}
          />
          <button disabled={!draft.trim()} onClick={sendMessage} type="button" aria-label="发送第一句话">
            <Send size={17} />
          </button>
        </div>
        <p className="helper-copy">DreamTwin 只把关系可能性带到门口，真正的第一句话由你亲自发送。</p>
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
