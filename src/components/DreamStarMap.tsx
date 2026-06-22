import type { CSSProperties } from "react";
import type { DreamNode } from "../types/dreamtwin";
import { StatusPill } from "./StatusPill";
import { ThreeDreamScene } from "./ThreeDreamScene";

interface DreamStarMapProps {
  nodes: DreamNode[];
  onSelectNode: (nodeId: string) => void;
}

export function DreamStarMap({ nodes, onSelectNode }: DreamStarMapProps) {
  const nodeEntryLabel = (node: DreamNode) => (node.entryMode === "friend_invite" ? "好友共梦" : "新关系");
  const nodeActionLabel = (node: DreamNode) => {
    if (node.status === "unviewed") return "查看预演";
    if (node.status === "viewed") return "继续判断";
    if (node.status === "waiting") return node.entryMode === "friend_invite" ? "等好友" : "等回应";
    if (node.status === "both_entered") return node.entryMode === "friend_invite" ? "选共同梦" : "双方已入梦";
    if (node.status === "opened") return "门已打开";
    return "等真人回";
  };

  return (
    <section className="star-map">
      <ThreeDreamScene variant="star-map" />
      <div className="star-map-orbits" aria-hidden="true">
        <span />
        <span />
        <span />
        <i />
      </div>
      <div className="star-map-overlay">
        {nodes.map((node) => (
          <button
            aria-label={`打开${node.title}关系预演，${nodeEntryLabel(node)}，${nodeActionLabel(node)}`}
            className={`dream-node dream-node-${node.status} dream-node-${node.entryMode}`}
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            style={
              {
                left: `${node.x * 100}%`,
                top: `${node.y * 100}%`,
                "--node-intensity": node.intensity,
              } as CSSProperties
            }
            type="button"
          >
            <span className="node-entry">{nodeEntryLabel(node)}</span>
            <span className="node-core" />
            <span className="node-title">{node.title}</span>
            <span className="node-action">{nodeActionLabel(node)}</span>
            <StatusPill entryMode={node.entryMode} status={node.status} />
          </button>
        ))}
      </div>
    </section>
  );
}
