import { ArrowLeft, Compass, DoorOpen, FastForward, RotateCcw, Sparkles } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
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
  onOpenToday,
  onExplore,
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
  const waitingGuardrails = isFriendInvite
    ? ["好友确认前不生成共同预演", "不会替你表达关系意图", "可以随时撤回邀请"]
    : ["对方确认前不打开聊天", "不会替你发送真实消息", "可以随时撤回这次入梦"];

  return (
    <section className="page waiting-page scene-page">
      <ThreeDreamScene variant="ambient" className="page-scene waiting-scene" />
      <div className="page-content waiting-content">
        <p className="label">{isOpened ? "梦境门已打开" : waitingLabel}</p>
        <h1>{isOpened ? acceptedTitle : sentTitle}</h1>
        <div className="waiting-orbit">
          <span />
          <span />
          <span />
        </div>
        <section className="waiting-copy">
          <StatusPill status={node.status} label={statusLabel} />
          <h2>{simulation.title}</h2>
          <p>
            {isFriendInvite
              ? "好友确认前，这里只保留等待状态。你可以回看邀请，也可以撤回这次入梦。"
              : "对方确认前，这里只保留等待状态。你可以先回看预演，或把这次入梦撤回。"}
          </p>
          <div className="waiting-signal-transfer" aria-label={isOpened ? "梦境门打开进度" : "入梦等待进度"}>
            <span>{isFriendInvite ? "邀请已送达" : "低压邀请已送达"}</span>
            <span>{isOpened ? `${simulation.counterpartName} 已回应` : isFriendInvite ? "等待好友选择" : "等待对方确认"}</span>
            <span>{isOpened ? "梦境门已打开" : "梦境门待确认"}</span>
          </div>
          <div className="waiting-state-grid">
            <span>{isFriendInvite ? "你发起了入梦邀请" : "你的入梦邀请已准备好"}</span>
            <span>
              {isOpened
                ? `${simulation.counterpartName} 已确认愿意继续`
                : isFriendInvite
                  ? "等待好友接受这次梦境漫游"
                  : "等待对方确认是否愿意继续"}
            </span>
            <span>{isFriendInvite ? "好友接受后，你们会回到同一张梦境地图。" : simulation.frictionSignal}</span>
          </div>
          {!isOpened ? (
            <section className="waiting-next-step" aria-label="等待后续入口">
              <span>不用停在这里等</span>
              <strong>{isFriendInvite ? "好友回应会出现在关系收件箱。" : "对方回应会出现在今日关系动态。"}</strong>
              <p>
                {isFriendInvite
                  ? "你可以先回今日或梦境地图。好友接受后，系统会把你们带回统一梦境地图继续选梦。"
                  : "你可以先回今日或继续看别的预演。对方确认后，梦境门会打开，消息页会出现可编辑的第一句话。"}
              </p>
            </section>
          ) : null}
          {!isOpened ? (
            <div className="waiting-guardrails" aria-label="等待期间的关系边界">
              {waitingGuardrails.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}
          {!isOpened && showDemoControls ? (
            <div className="demo-control-note" aria-label="Demo 控制说明">
              <span>Demo 控制</span>
              <p>下面的模拟按钮只用于本地演示跑通。真实 App 会等待对方在自己的手机上确认。</p>
            </div>
          ) : null}
        </section>
      </div>
      <div className="bottom-action">
        <PrimaryButton
          icon={isOpened ? <DoorOpen size={18} /> : <Sparkles size={18} />}
          onClick={() => (isOpened ? onConfirm(node.id) : onOpenToday())}
        >
          {isOpened ? "进入已打开的梦境门" : "回到今日等待回应"}
        </PrimaryButton>
        <div className="action-row">
          <PrimaryButton variant="secondary" icon={<ArrowLeft size={17} />} onClick={() => onBackToSimulation(node.id)}>
            {isFriendInvite && !isOpened ? "返回邀请设置" : "返回预演结果"}
          </PrimaryButton>
          <PrimaryButton variant="secondary" icon={<Compass size={17} />} onClick={onExplore}>
            回到梦境地图
          </PrimaryButton>
        </div>
        {!isOpened && showDemoControls ? (
          <div className="action-row">
            <PrimaryButton variant="secondary" icon={<FastForward size={17} />} onClick={() => onConfirm(node.id)}>
              {responsePreviewLabel}
            </PrimaryButton>
            <PrimaryButton variant="ghost" icon={<RotateCcw size={17} />} onClick={() => onWithdraw(node.id)}>
              撤回这次入梦
            </PrimaryButton>
          </div>
        ) : null}
        {!isOpened && !showDemoControls ? (
          <div className="single-action-row">
            <PrimaryButton variant="ghost" icon={<RotateCcw size={17} />} onClick={() => onWithdraw(node.id)}>
              撤回这次入梦
            </PrimaryButton>
          </div>
        ) : null}
      </div>
    </section>
  );
}
