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
  const openedCount = overnightNodes.filter((node) => node.status === "opened" || node.status === "in_chat").length;
  const friendStateText =
    friendNode?.status === "in_chat"
      ? "已进入聊天"
      : friendNode?.status === "opened"
        ? "梦境门打开"
        : friendNode?.status === "both_entered"
          ? "好友已入梦"
          : friendNode?.status === "waiting"
            ? "邀请等待中"
            : "可邀请";
  const hasAnyProgress = viewedCount + waitingCount + openedCount > 0;
  const mapNodes =
    friendNode && friendNode.status !== "unviewed" ? [...overnightNodes, friendNode] : overnightNodes;

  return (
    <section className="page page-scroll scene-page dream-log-page">
      <ThreeDreamScene variant="ambient" className="page-scene dream-log-scene" />
      <div className="page-content dream-log-content">
        <div className="dream-log-hero">
          <p className="label">梦境广场</p>
          <h1>同一张梦境地图，承接新关系和好友入梦。</h1>
          <div className="dream-log-stats" aria-label="梦境星图状态">
            <span>{viewedCount}/3 已预演</span>
            <span>{waitingCount} 等待回应</span>
            <span>{openedCount} 已打开</span>
          </div>
          <section className="dream-log-guidance" aria-label="梦境广场说明">
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
            <strong>已有好友时，先邀请，再回到这张地图选场景。</strong>
            <p>好友接受后，共同梦境节点会在地图里点亮。</p>
            <PrimaryButton icon={<Send size={16} />} onClick={onOpenFriendInvite}>
              邀请好友入梦
            </PrimaryButton>
          </article>
        </section>
        <TwinProjection twin={twin} compact />
        <div className="star-map-stage">
          <DreamStarMap nodes={mapNodes} onSelectNode={onSelectNode} />
          <div className="star-map-legend" aria-label="节点状态图例">
            <span>未查看</span>
            <span>已预演</span>
            <span>等待 / 已入梦</span>
            <span>门已打开</span>
          </div>
          <div className="star-map-route-tip" aria-label="推荐节点">
            <span>推荐入口</span>
            <strong>先点「雨夜便利店」</strong>
          </div>
          <div className="star-map-caption">
            <span>Dream Star Map</span>
          <p>点击任意节点，查看 AI 双人关系预演；好友节点也回到同一张地图。</p>
          </div>
        </div>
        <p className="helper-copy">这不是可走地图，也不是游戏关卡；它只是关系可能性的共同入口。</p>
      </div>
    </section>
  );
}
