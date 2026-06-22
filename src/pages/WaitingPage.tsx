import { ChevronLeft, DoorOpen, FastForward, RotateCcw } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";

interface WaitingPageProps {
  node: DreamNode;
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
  simulation,
  onBackToSimulation,
  onConfirm,
  showDemoControls,
  onWithdraw,
}: WaitingPageProps) {
  const isOpened = node.status === "opened" || node.status === "in_chat";
  const isFriendInvite = simulation.entryMode === "friend_invite";
  const waitingLabel = isFriendInvite ? "等待好友入梦" : "等待对方入梦";
  const sentTitle = isFriendInvite ? "邀请已送达，选择权留给好友。" : "入梦邀请已送达，选择权留给对方。";
  const acceptedTitle = isFriendInvite ? `${simulation.counterpartName} 已接受入梦邀请。` : "对方已经选择进入。";
  const statusLabel = isFriendInvite && node.status === "waiting" ? "等待好友入梦" : undefined;
  const responsePreviewLabel = isFriendInvite ? "演示：模拟好友接受" : "演示：模拟对方确认";
  const description = isFriendInvite
    ? "好友确认前，这里只保留等待状态。你可以随时撤回这次入梦。"
    : "对方确认前，这里只保留等待状态。你可以随时把这次入梦撤回。";
  const waitingGuardrails = isFriendInvite
    ? ["好友确认前不生成共同预演", "不会替你表达关系意图", "可以随时撤回邀请"]
    : ["对方确认前不打开聊天", "不会替你发送真实消息", "可以随时撤回这次入梦"];

  return (
    <section className="page page-scroll dt-page waiting-page">
      <div className="page-content dt-content waiting-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <button className="dt-icon-btn" onClick={() => onBackToSimulation(node.id)} type="button" aria-label="返回">
              <ChevronLeft size={18} />
            </button>
          </div>
          <span className="dt-head-title">{isOpened ? "梦境门打开" : waitingLabel}</span>
          <div className="dt-head-right" />
        </header>

        <div className="dt-greeting">
          <h1>{isOpened ? acceptedTitle : sentTitle}</h1>
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
          {!isOpened ? (
            <div className="waiting-guards" aria-label="等待期间的关系边界">
              {waitingGuardrails.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
        </div>

        {!isOpened && showDemoControls ? (
          <div className="dt-note" style={{ textAlign: "left" }}>
            <span>Demo 控制 · 下面的模拟按钮只用于本地跑通,真实 App 会等待对方在自己手机上确认。</span>
          </div>
        ) : null}
      </div>

      <div className="bottom-action">
        {isOpened ? (
          <PrimaryButton icon={<DoorOpen size={18} />} onClick={() => onConfirm(node.id)}>
            进入已打开的梦境门
          </PrimaryButton>
        ) : (
          <>
            {showDemoControls ? (
              <PrimaryButton variant="secondary" icon={<FastForward size={17} />} onClick={() => onConfirm(node.id)}>
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
