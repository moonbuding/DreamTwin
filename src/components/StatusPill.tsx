import type { DreamNodeStatus } from "../types/dreamtwin";

const labels: Record<DreamNodeStatus, string> = {
  unviewed: "未查看",
  viewed: "已查看",
  waiting: "等待对方入梦",
  both_entered: "双方已入梦",
  opened: "梦境门打开",
  in_chat: "已进入聊天",
};

export function StatusPill({ label, status }: { label?: string; status: DreamNodeStatus }) {
  return <span className={`status-pill status-${status}`}>{label ?? labels[status]}</span>;
}
