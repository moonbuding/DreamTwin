import { useEffect, useRef } from "react";
import { Bell, ChevronLeft, DoorOpen, RotateCcw } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";

interface WaitingPageProps {
  node: DreamNode;
  userName: string;
  simulation: RelationshipSimulation;
  onBackToSimulation: (nodeId: string) => void;
  onConfirm: (nodeId: string) => void;
  onOpenToday: () => void;
  onExplore: () => void;
  showDemoControls: boolean;
  onWithdraw: (nodeId: string) => void;
}

export function WaitingPage({
  node,
  userName,
  simulation,
  onBackToSimulation,
  onConfirm,
  showDemoControls,
  onWithdraw,
}: WaitingPageProps) {
  const isReady = node.status === "both_entered" || node.status === "opened" || node.status === "in_chat";
  const isFriendInvite = simulation.entryMode === "friend_invite";
  const waitingLabel = isFriendInvite ? "等待好友入梦" : "等待对方入梦";
  const sentTitle = `你已入梦，正在等待 ${simulation.counterpartName} 共赴这场梦境。`;
  const acceptedTitle =
    node.status === "both_entered"
      ? `${simulation.counterpartName} 已入梦，可以开始聊天。`
      : isFriendInvite
        ? `${simulation.counterpartName} 已接受入梦邀请。`
        : "对方已经选择进入。";
  const statusLabel = isFriendInvite && node.status === "waiting" ? "等待好友入梦" : undefined;
  const responsePreviewLabel = `${userName} 正在等你共赴一场梦境`;
  const description = isFriendInvite
    ? "好友确认前，这里只保留等待状态。你可以随时撤回这次入梦。"
    : "对方确认前，这里只保留等待状态。你可以随时把这次入梦撤回。";
  const systemReminder = `${userName} 已进入「${simulation.title}」`;
  const shouldAutoConfirmXiaomeng =
    !showDemoControls && !isReady && !isFriendInvite && node.status === "waiting" && simulation.counterpartName === "小梦";
  const waitingGuardrails = isFriendInvite
    ? ["好友确认前不生成共同预演", "不会替你表达关系意图", "可以随时撤回邀请"]
    : ["对方确认前不打开聊天", "不会替你发送真实消息", "可以随时撤回这次入梦"];
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;

  useEffect(() => {
    if (!shouldAutoConfirmXiaomeng) return undefined;
    const timer = window.setTimeout(() => confirmRef.current(node.id), 5_000);
    return () => window.clearTimeout(timer);
  }, [node.id, shouldAutoConfirmXiaomeng]);

  return (
    <section className="page page-scroll dt-page waiting-page">
      <div className="page-content dt-content waiting-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <button className="dt-icon-btn" onClick={() => onBackToSimulation(node.id)} type="button" aria-label="返回">
              <ChevronLeft size={18} />
            </button>
          </div>
          <span className="dt-head-title">{isReady ? "双方已入梦" : waitingLabel}</span>
          <div className="dt-head-right" />
        </header>

        <div className="dt-greeting">
          <h1>{isReady ? acceptedTitle : sentTitle}</h1>
        </div>

        <div className="waiting-stage dt-zone-dark" aria-hidden="true">
          <div className="waiting-orbit">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="dt-panel">
          <StatusPill status={node.status} label={statusLabel} />
          <strong className="dt-panel-title">{simulation.title}</strong>
          <p>{description}</p>
          {shouldAutoConfirmXiaomeng ? <p>小梦将在 5 秒后确认入梦。</p> : null}
          {!isReady ? (
            <div className="waiting-guards" aria-label="等待期间的关系边界">
              {waitingGuardrails.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
        </div>

        {!isReady && showDemoControls ? (
          <div className="dt-note" style={{ textAlign: "left" }}>
            <span>对方收到的系统提醒</span>
            <span>{systemReminder}</span>
            <span>真实 App 会等待对方在自己手机上点击入梦。</span>
          </div>
        ) : null}
      </div>

      <div className="bottom-action">
        {isReady ? (
          <PrimaryButton icon={<DoorOpen size={18} />} onClick={() => onConfirm(node.id)}>
            进入聊天
          </PrimaryButton>
        ) : (
          <>
            {showDemoControls ? (
              <PrimaryButton variant="secondary" icon={<Bell size={17} />} onClick={() => onConfirm(node.id)}>
                {responsePreviewLabel}
              </PrimaryButton>
            ) : null}
            <PrimaryButton variant="secondary" icon={<RotateCcw size={17} />} onClick={() => onWithdraw(node.id)}>
              撤回这次入梦
            </PrimaryButton>
          </>
        )}
      </div>
    </section>
  );
}
