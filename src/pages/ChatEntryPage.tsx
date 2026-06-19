import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Compass, MessageCircle, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { RelationshipSimulation, RelationshipSimulationResult } from "../types/dreamtwin";
import { adaptFriendInviteMoveAfterAcceptance } from "../utils/relationshipCopy";

interface ChatEntryPageProps {
  hasSentFirstMessage?: boolean;
  liveSimulationResult?: RelationshipSimulationResult;
  sentFirstMessage?: string;
  simulation: RelationshipSimulation;
  selectedRoamingSceneId: string | null;
  onBackToLog: () => void;
  onBackToSimulation: () => void;
  onFirstMessageSent: (text: string) => void;
  onOpenMessages: () => void;
}

export function ChatEntryPage({
  hasSentFirstMessage = false,
  liveSimulationResult,
  sentFirstMessage,
  simulation,
  selectedRoamingSceneId,
  onBackToLog,
  onBackToSimulation,
  onFirstMessageSent,
  onOpenMessages,
}: ChatEntryPageProps) {
  const activeRoamingScene =
    simulation.roamingScenes?.find((scene) => scene.id === selectedRoamingSceneId) ?? simulation.roamingScenes?.[0];
  const isFriendInvite = simulation.entryMode === "friend_invite";
  const suggestedFirstLine = liveSimulationResult?.possibleFirstLine ?? activeRoamingScene?.possibleFirstLine ?? simulation.possibleFirstLine;
  const recommendedMove = adaptFriendInviteMoveAfterAcceptance(
    liveSimulationResult?.suggestedMove ?? activeRoamingScene?.suggestedMove ?? simulation.recommendedMove,
    isFriendInvite,
  );
  const handoffOutcome = liveSimulationResult?.conclusion ?? activeRoamingScene?.relationshipOutcome ?? simulation.rehearsalOutcome;
  const sceneTitle = activeRoamingScene?.label ?? simulation.title;
  const [selectedStarter, setSelectedStarter] = useState("recommended");
  const [draft, setDraft] = useState(suggestedFirstLine);
  const [sentMessages, setSentMessages] = useState<string[]>([]);
  const starterOptions = useMemo(
    () => [
      {
        id: "recommended",
        label: "用建议第一句",
        note: "最贴近预演结论",
        value: suggestedFirstLine,
      },
      {
        id: "soft",
        label: "先轻一点",
        note: "降低压力，留给对方空间",
        value: `我想先从${sceneTitle}这件事聊起，你会怎么开始？`,
      },
      {
        id: "honest",
        label: "问真实感受",
        note: "把预演拉回真实体验",
        value: "刚才那段预演里，有哪一秒让你觉得像真实会发生的事？",
      },
    ],
    [sceneTitle, suggestedFirstLine],
  );
  const activeStarter = starterOptions.find((option) => option.id === selectedStarter) ?? starterOptions[0];
  const displaySentMessages = sentFirstMessage
    ? [sentFirstMessage]
    : hasSentFirstMessage && sentMessages.length === 0
      ? [suggestedFirstLine]
      : sentMessages;
  const hasSentMessage = hasSentFirstMessage || sentMessages.length > 0;

  useEffect(() => {
    setSelectedStarter("recommended");
    setDraft(suggestedFirstLine);
    setSentMessages([]);
  }, [simulation.id, selectedRoamingSceneId, suggestedFirstLine]);

  const selectStarter = (option: (typeof starterOptions)[number]) => {
    setSelectedStarter(option.id);
    setDraft(option.value);
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    const isFirstMessage = sentMessages.length === 0;
    setSentMessages((messages) => [...messages, text]);
    setDraft("");
    if (isFirstMessage) onFirstMessageSent(text);
  };

  return (
    <section className="page page-scroll scene-page chat-entry-page">
      <ThreeDreamScene variant="ambient" className="page-scene chat-scene" />
      <div className="page-content chat-entry-content">
        <p className="label">真实聊天入口</p>
        <h1>{hasSentFirstMessage ? "第一句话已经发出。" : "现在由你开始。"}</h1>
        <section className="counterpart-presence">
          <span>
            {hasSentFirstMessage
              ? "真实聊天正在等待真人回应"
              : isFriendInvite
                ? "好友梦境漫游已转入真实聊天"
                : "双人关系预演已转入真实聊天"}
          </span>
          <strong>{simulation.counterpartName}</strong>
          <p>{handoffOutcome}</p>
        </section>
        {isFriendInvite ? (
          <section className="chat-shared-origin" aria-label="共同梦境来源">
            <span>共同梦境来源</span>
            <strong>{sceneTitle}</strong>
            <p>这不是普通好友私信。你们先一起入梦、共同选择场景，再把预演结果带回真实聊天。</p>
          </section>
        ) : null}
        <section className="chat-handoff-panel" aria-label="真实聊天交接状态">
          <div>
            <CheckCircle2 size={15} />
            <span>
              {hasSentFirstMessage ? "第一句话已进入真实聊天" : liveSimulationResult ? "AI 预演建议已带入" : "预演建议已带入"}
            </span>
          </div>
          <div>
            <ShieldCheck size={15} />
            <span>{hasSentFirstMessage ? "AI 不再继续推进" : "第一句话已低压处理"}</span>
          </div>
          <div>
            <Send size={15} />
            <span>{hasSentFirstMessage ? "等待真人回应" : "等待你亲自发送"}</span>
          </div>
        </section>
        <section className="chat-briefing" aria-label="预演后的行动建议">
          <span>{hasSentFirstMessage ? "当前状态" : "建议动作"}</span>
          <p>
            {hasSentFirstMessage
              ? `你已经把预演带回真实聊天。DreamTwin 不会替你继续推进，只等待 ${simulation.counterpartName} 的真实回应。`
              : recommendedMove}
          </p>
        </section>
        {!hasSentFirstMessage ? (
          <>
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
                <b>发送方式</b>
                <p>预演建议已经转成可编辑的第一句话，发送前你可以改成自己的语气。</p>
              </div>
            </section>
          </>
        ) : null}
        <section className="chat-thread" aria-label="聊天预览">
          <div className="chat-delivery-receipt">
            <ShieldCheck size={15} />
            <span>
              {hasSentFirstMessage
                ? `梦境门已打开。你已经向 ${simulation.counterpartName} 发出第一句话，接下来只等待真人回应。`
                : `梦境门已打开。${simulation.counterpartName} 已确认进入，真实聊天从你亲自发送的第一句话开始。`}
            </span>
          </div>
          {displaySentMessages.map((message, index) => (
            <div className="chat-bubble chat-bubble-me" key={`${message}-${index}`}>
              <span>你</span>
              <p>{message}</p>
            </div>
          ))}
          {hasSentMessage ? (
            <div className="chat-delivery-receipt" aria-label="发送完成状态">
              <CheckCircle2 size={15} />
              <span>第一句话已进入真实聊天。DreamTwin 的工作到这里结束，接下来只等待真人回应。</span>
            </div>
          ) : null}
          {hasSentMessage ? (
            <PrimaryButton variant="secondary" icon={<MessageCircle size={17} />} onClick={onOpenMessages}>
              回到消息等待回应
            </PrimaryButton>
          ) : null}
        </section>
        {!hasSentFirstMessage ? (
          <>
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
          </>
        ) : null}
      </div>
      <div className="bottom-action">
        <div className="action-row">
          <PrimaryButton variant="secondary" icon={<ArrowLeft size={18} />} onClick={onBackToSimulation}>
            回看预演结果
          </PrimaryButton>
          <PrimaryButton variant="ghost" icon={<Compass size={18} />} onClick={onBackToLog}>
            回到梦境地图
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
