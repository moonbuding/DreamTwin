import type { DreamNode, TwinProjection as TwinProjectionModel } from "../types/dreamtwin";
import { DreamStarMap } from "../components/DreamStarMap";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import { TwinProjection } from "../components/TwinProjection";

interface DreamLogPageProps {
  twin: TwinProjectionModel;
  nodes: DreamNode[];
  onSelectNode: (nodeId: string) => void;
}

export function DreamLogPage({ twin, nodes, onSelectNode }: DreamLogPageProps) {
  const viewedCount = nodes.filter((node) => node.status !== "unviewed").length;
  const waitingCount = nodes.filter((node) => node.status === "waiting").length;
  const openedCount = nodes.filter((node) => node.status === "opened").length;
  const hasAnyProgress = viewedCount + waitingCount + openedCount > 0;

  return (
    <section className="page page-scroll scene-page dream-log-page">
      <ThreeDreamScene variant="ambient" className="page-scene dream-log-scene" />
      <div className="page-content dream-log-content">
        <div className="dream-log-hero">
          <p className="label">昨夜梦境日志</p>
          <h1>你的分身带回了 3 个关系入口。</h1>
          <div className="dream-log-stats" aria-label="梦境星图状态">
            <span>{viewedCount}/3 已预演</span>
            <span>{waitingCount} 等待回应</span>
            <span>{openedCount} 已打开</span>
          </div>
          <section className="dream-log-guidance" aria-label="演示状态说明">
            <span>{hasAnyProgress ? "继续选择节点，观察状态如何变化。" : "点击第一个节点，先看一段完整关系预演。"}</span>
            <p>每个节点都是一次 AI 双人模拟：先看如果相遇会怎样，再决定是否把真实关系打开。</p>
          </section>
        </div>
        <TwinProjection twin={twin} compact />
        <div className="star-map-stage">
          <DreamStarMap nodes={nodes} onSelectNode={onSelectNode} />
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
