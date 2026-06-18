import type { DreamNode, TwinProjection as TwinProjectionModel } from "../types/dreamtwin";
import { DreamStarMap } from "../components/DreamStarMap";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import { TwinProjection } from "../components/TwinProjection";
import { PrimaryButton } from "../components/PrimaryButton";
import { Send } from "lucide-react";

interface DreamLogPageProps {
  twin: TwinProjectionModel;
  nodes: DreamNode[];
  onOpenFriendInvite: () => void;
  onSelectNode: (nodeId: string) => void;
}

export function DreamLogPage({ twin, nodes, onOpenFriendInvite, onSelectNode }: DreamLogPageProps) {
  const overnightNodes = nodes.filter((node) => node.entryMode === "overnight_discovery");
  const friendNode = nodes.find((node) => node.entryMode === "friend_invite");
  const viewedCount = overnightNodes.filter((node) => node.status !== "unviewed").length;
  const waitingCount = overnightNodes.filter((node) => node.status === "waiting").length;
  const openedCount = overnightNodes.filter((node) => node.status === "opened").length;
  const friendStateText =
    friendNode?.status === "opened" ? "好友已入梦" : friendNode?.status === "waiting" ? "邀请等待中" : "可邀请";
  const hasAnyProgress = viewedCount + waitingCount + openedCount > 0;

  return (
    <section className="page page-scroll scene-page dream-log-page">
      <ThreeDreamScene variant="ambient" className="page-scene dream-log-scene" />
      <div className="page-content dream-log-content">
        <div className="dream-log-hero">
          <p className="label">梦境广场</p>
          <h1>昨夜 AI 已预演好 3 个关系入口。</h1>
          <div className="dream-log-stats" aria-label="梦境星图状态">
            <span>{viewedCount}/3 已预演</span>
            <span>{waitingCount} 等待回应</span>
            <span>{openedCount} 已打开</span>
          </div>
          <section className="dream-log-guidance" aria-label="演示状态说明">
            <span>{hasAnyProgress ? "继续选择节点，查看新的关系可能。" : "点击一个节点，先看结论再决定要不要进入。"}</span>
            <p>每个节点都是一次 AI 双人关系预演，不是聊天记录，也不是可走地图。</p>
          </section>
        </div>
        <section className="dream-entry-switch" aria-label="DreamTwin 使用场景入口">
          <article>
            <span>昨晚我遇见了谁</span>
            <strong>下班后打开，直接看值得开启的关系。</strong>
            <p>先看 AI 预演结论，再决定是否让真实关系发生。</p>
          </article>
          <article className="dream-entry-invite">
            <span>邀请好友梦境漫游 · {friendStateText}</span>
            <strong>已有好友时，先邀请，再共同预演。</strong>
            <p>好友接受后，双方一起看共同经历会怎样改变关系。</p>
            <PrimaryButton icon={<Send size={16} />} onClick={onOpenFriendInvite}>
              邀请好友入梦
            </PrimaryButton>
          </article>
        </section>
        <TwinProjection twin={twin} compact />
        <div className="star-map-stage">
          <DreamStarMap nodes={overnightNodes} onSelectNode={onSelectNode} />
          <div className="star-map-legend" aria-label="节点状态图例">
            <span>未查看</span>
            <span>已预演</span>
            <span>等待回应</span>
            <span>门已打开</span>
          </div>
          <div className="star-map-caption">
            <span>Dream Star Map</span>
            <p>点击任意节点，查看你的 AI 分身替你完成的关系预演。</p>
          </div>
        </div>
        <p className="helper-copy">这些不是聊天记录，也不是可探索地图，只是关系可能性的预演。</p>
      </div>
    </section>
  );
}
