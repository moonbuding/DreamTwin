import { ArrowLeft, ChevronLeft, Compass, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";

interface DreamGatePageProps {
  node: DreamNode;
  selectedRoamingSceneId: string | null;
  simulation: RelationshipSimulation;
  onBack: () => void;
  onBackToSimulation: (nodeId: string) => void;
  onBackToLog: () => void;
  onOpenChat: (nodeId: string) => void;
}

export function DreamGatePage({ node, selectedRoamingSceneId, simulation, onBack, onBackToSimulation, onBackToLog, onOpenChat }: DreamGatePageProps) {
  const isFriendInvite = simulation.entryMode === "friend_invite";
  const activeRoamingScene =
    simulation.roamingScenes?.find((scene) => scene.id === selectedRoamingSceneId) ?? simulation.roamingScenes?.[0];
  const activeSceneLabel = activeRoamingScene?.label ?? simulation.title;
  const firstLinePreview = activeRoamingScene?.possibleFirstLine ?? simulation.possibleFirstLine;

  return (
    <section className="page page-scroll dt-page dt-light gate-page">
      <div className="page-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <button className="dt-icon-btn" onClick={onBack} type="button" aria-label="返回">
              <ChevronLeft size={18} />
            </button>
          </div>
          <span className="dt-head-title">梦境门</span>
          <div className="dt-head-right" />
        </header>
        <div className="dt-greeting">
          <h1>{isFriendInvite ? `${simulation.counterpartName} 确认了这段共同梦境。` : `${simulation.counterpartName} 也选择进入。`}</h1>
        </div>
        <div className="gate-status">
          <StatusPill entryMode={node.entryMode} status={node.status} />
          <span>{isFriendInvite ? `${simulation.title} · ${activeSceneLabel}` : simulation.title}</span>
        </div>
        <div className="gate-threshold" aria-label="梦境门打开条件">
          <span>{isFriendInvite ? "邀请确认" : "你确认进入"}</span>
          <span>{isFriendInvite ? "共同梦境确认" : `${simulation.counterpartName} 确认`}</span>
          <span>真实聊天打开</span>
        </div>
        <p className="lead">
          {isFriendInvite
            ? `你们已经在「${activeSceneLabel}」里完成共同预演。梦境门打开后，真实关系仍然交还给你们两个人。`
            : "双方都确认愿意继续。预演结束，真实关系现在交还给你们两个人。"}
        </p>
        {isFriendInvite ? (
          <section className="gate-shared-origin" aria-label="共同梦境来源">
            <span>共同梦境来源</span>
            <strong>{activeSceneLabel}</strong>
            <p>这不是普通好友私信。它来自双方确认过的共同梦境，第一句话仍由你亲自编辑发送。</p>
          </section>
        ) : null}
        <div className="gate-confirmation" aria-label="双方确认状态">
          <span>{isFriendInvite ? "你的邀请已确认" : "你已确认进入"}</span>
          <span>{simulation.counterpartName} 已回应</span>
        </div>
        <section className="gate-handoff-panel" aria-label="聊天交接说明">
          <div>
            <Sparkles size={15} />
            <span>AI 已把预演压缩成低压开场</span>
          </div>
          <div>
            <ShieldCheck size={15} />
            <span>双方确认后，才允许进入真人聊天</span>
          </div>
        </section>
        <section className="gate-next-step" aria-label="梦境门后的下一步">
          <span>下一步只做一件事</span>
          <strong>把建议改成你的语气，发出第一句话。</strong>
          <p>{`“${firstLinePreview}”`}</p>
        </section>
        <PrimaryButton icon={<MessageCircle size={18} />} onClick={() => onOpenChat(node.id)}>
          去写第一句话
        </PrimaryButton>
        <div className="action-row">
          <PrimaryButton variant="secondary" icon={<ArrowLeft size={17} />} onClick={() => onBackToSimulation(node.id)}>
            回看预演结果
          </PrimaryButton>
          <PrimaryButton variant="ghost" icon={<Compass size={17} />} onClick={onBackToLog}>
            回到梦境地图
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
