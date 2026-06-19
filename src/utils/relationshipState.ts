import type { DreamNode, RelationshipSimulation, RelationshipState, RelationshipStateStatus } from "../types/dreamtwin";

export function relationshipStatusFromNode(node: DreamNode): RelationshipStateStatus {
  if (node.status === "waiting") return "waiting_counterpart";
  if (node.status === "both_entered") return "both_entered";
  if (node.status === "opened") return "gate_opened";
  if (node.status === "in_chat") return "in_chat";
  return "ai_previewed";
}

export function relationshipStatusLabel(status: RelationshipStateStatus): string {
  const labels: Record<RelationshipStateStatus, string> = {
    ai_previewed: "AI 已预演",
    waiting_counterpart: "等待对方入梦",
    both_entered: "双方已入梦",
    gate_opened: "梦境门打开",
    in_chat: "已进入聊天",
  };

  return labels[status];
}

export function createRelationshipStates(nodes: DreamNode[], simulations: RelationshipSimulation[]): RelationshipState[] {
  return nodes.map((node) => {
    const status = relationshipStatusFromNode(node);
    const simulation = simulations.find((item) => item.id === node.simulationId);

    return {
      id: `relationship-${node.id}`,
      nodeId: node.id,
      simulationId: node.simulationId,
      entryMode: node.entryMode,
      status,
      label: simulation ? `${simulation.title} · ${relationshipStatusLabel(status)}` : relationshipStatusLabel(status),
    };
  });
}
