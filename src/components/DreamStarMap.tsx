import type { DreamNode } from "../types/dreamtwin";
import { StatusPill } from "./StatusPill";
import { ThreeDreamScene } from "./ThreeDreamScene";

interface DreamStarMapProps {
  nodes: DreamNode[];
  onSelectNode: (nodeId: string) => void;
}

export function DreamStarMap({ nodes, onSelectNode }: DreamStarMapProps) {
  return (
    <section className="star-map">
      <ThreeDreamScene variant="star-map" />
      <div className="star-map-overlay">
        {nodes.map((node) => (
          <button
            aria-label={`打开${node.title}关系预演`}
            className={`dream-node dream-node-${node.status}`}
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            style={{ left: `${node.x * 100}%`, top: `${node.y * 100}%` }}
            type="button"
          >
            <span className="node-core" />
            <span className="node-title">{node.title}</span>
            <StatusPill status={node.status} />
          </button>
        ))}
      </div>
    </section>
  );
}
