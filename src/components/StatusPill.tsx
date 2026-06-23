import type { DreamNodeStatus, RelationshipEntryMode } from "../types/dreamtwin";

const labels: Record<DreamNodeStatus, string> = {
  unviewed: "未查看",
  viewed: "已查看",
  waiting: "等待对方入梦",
  both_entered: "双方已入梦",
  opened: "梦境门打开",
  in_chat: "等待真人回应",
};

function getStatusLabel(status: DreamNodeStatus, entryMode?: RelationshipEntryMode) {
  if (entryMode === "friend_invite" && status === "waiting") return "等待好友入梦";
  return labels[status];
}

export function StatusPill({
  entryMode,
  label,
  status,
}: {
  entryMode?: RelationshipEntryMode;
  label?: string;
  status: DreamNodeStatus;
}) {
  return <span className={`status-pill status-${status}`}>{label ?? getStatusLabel(status, entryMode)}</span>;
}
