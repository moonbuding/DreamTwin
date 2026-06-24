import type {
  DreamNode,
  RelationshipEntryMode,
  RelationshipSimulation,
  RelationshipState,
  RelationshipStateStatus,
} from "@dreamtwin/api-types";

export function relationshipStatusFromNode(node: DreamNode): RelationshipStateStatus {
  if (node.status === "waiting") return "waiting_counterpart";
  if (node.status === "both_entered") return "both_entered";
  if (node.status === "opened") return "gate_opened";
  if (node.status === "in_chat") return "in_chat";
  return "ai_previewed";
}

export function relationshipStatusLabel(status: RelationshipStateStatus, entryMode?: RelationshipEntryMode): string {
  const labels: Record<RelationshipStateStatus, string> = {
    ai_previewed: "AI 已预演",
    waiting_counterpart: "等待对方入梦",
    both_entered: "双方已入梦",
    gate_opened: "梦境门打开",
    in_chat: "等待真人回应",
  };

  if (entryMode === "friend_invite" && status === "waiting_counterpart") return "等待好友入梦";
  return labels[status];
}

export function createRelationshipStates(
  nodes: DreamNode[],
  simulations: RelationshipSimulation[],
): RelationshipState[] {
  return nodes.map((node) => {
    const status = relationshipStatusFromNode(node);
    const simulation = simulations.find((item) => item.id === node.simulationId);

    return {
      id: `relationship-${node.id}`,
      nodeId: node.id,
      simulationId: node.simulationId,
      entryMode: node.entryMode,
      status,
      label: simulation
        ? `${simulation.title} · ${relationshipStatusLabel(status, node.entryMode)}`
        : relationshipStatusLabel(status, node.entryMode),
    };
  });
}

export function selectTodayPrimaryNode(nodes: DreamNode[]): DreamNode | undefined {
  return (
    nodes.find((node) => node.status === "both_entered") ??
    nodes.find((node) => node.status === "opened") ??
    nodes.find((node) => node.status === "in_chat") ??
    nodes.find((node) => node.status === "waiting") ??
    nodes.find((node) => node.entryMode === "overnight_discovery" && node.status === "unviewed") ??
    nodes.find((node) => node.entryMode === "overnight_discovery") ??
    nodes[0]
  );
}

export function adaptFriendInviteMoveAfterAcceptance(text: string, isFriendInvite: boolean): string {
  if (!isFriendInvite) return text;
  return text.replace(/^邀请时说[:：]?\s*/, "接下来可以说：");
}
