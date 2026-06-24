import { Bell, Compass } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";

interface MessagesPageProps {
  nodes: DreamNode[];
  sentFirstMessages?: Record<string, string>;
  simulations: RelationshipSimulation[];
  onOpenChat: (nodeId: string) => void;
  onOpenDreamMap: () => void;
  onOpenWaiting: (nodeId: string) => void;
  onReviewNode?: (nodeId: string) => void;
}

const THREAD_TIMES = ["21:42", "20:15", "19:03", "17:48"];

// Chat sub-tab of the 好友 hub: waiting reminders and entered dreams both appear here.
export function MessagesPage({
  nodes,
  sentFirstMessages = {},
  simulations,
  onOpenChat,
  onOpenDreamMap,
  onOpenWaiting,
}: MessagesPageProps) {
  const waitingNodes = nodes.filter((node) => node.status === "waiting");
  const chatReadyNodes = nodes.filter(
    (node) => node.status === "both_entered" || node.status === "opened" || node.status === "in_chat",
  );
  const threadNodes = [...waitingNodes, ...chatReadyNodes];
  const readyToSendNodes = nodes.filter((node) => node.status === "both_entered" || node.status === "opened");
  const inChatNodes = nodes.filter((node) => node.status === "in_chat");
  const pendingNodes = nodes.filter((node) => node.status === "waiting");
  const getSimulation = (node: DreamNode) => simulations.find((simulation) => simulation.id === node.simulationId) ?? simulations[0];
  const nextAction =
    waitingNodes.length > 0
      ? "等对方入梦"
      : readyToSendNodes.length > 0
        ? "进入正常聊天"
        : inChatNodes.length > 0
          ? "等真人回应"
          : "去梦境地图开启关系";

  const threadPreview = (node: DreamNode, simulation: RelationshipSimulation) => {
    if (node.status === "waiting") return `你已进入「${simulation.title}」，正在等待 ${simulation.counterpartName} 入梦`;
    if (node.status === "both_entered") return "双方都已入梦，点击进入正常聊天";
    const sent = sentFirstMessages[node.id];
    if (sent) return `你：${sent}`;
    if (node.status === "in_chat") return `他：${simulation.counterpartSimulatedReply}`;
    return simulation.possibleFirstLine;
  };

  const threadTitle = (node: DreamNode, simulation: RelationshipSimulation) => {
    if (node.status === "waiting") return `系统提醒 · 「${simulation.title}」已入梦`;
    if (node.status === "both_entered") return `「${simulation.title}」双方已入梦`;
    if (node.status === "opened") return `「${simulation.title}」梦境门已打开`;
    return simulation.title;
  };

  return (
    <div className="dt-chat-pane">
      {threadNodes.length ? (
        <div className="dt-thread-list">
          {threadNodes.map((node, index) => {
            const simulation = getSimulation(node);
            const isUnread = node.status === "waiting" || node.status === "both_entered" || node.status === "opened";
            const openThread = () => (node.status === "waiting" ? onOpenWaiting(node.id) : onOpenChat(node.id));

            return (
              <button className="dt-thread" key={node.id} onClick={openThread} type="button">
                <span className={node.status === "waiting" ? "dt-ava dt-sys-icon" : "dt-ava"}>
                  {node.status === "waiting" ? <Bell size={18} /> : simulation.counterpartName.slice(0, 1)}
                </span>
                <span className="dt-thread-body">
                  <strong>{threadTitle(node, simulation)}</strong>
                  <p>{threadPreview(node, simulation)}</p>
                </span>
                <span className="dt-thread-meta">
                  <span className="dt-thread-time">{THREAD_TIMES[index] ?? "今天"}</span>
                  {isUnread ? <span className="dt-badge">1</span> : <span style={{ height: 18 }} />}
                </span>
              </button>
            );
          })}

        </div>
      ) : (
        <div className="dt-empty">
          <span className="dt-card-icon">
            <Compass size={20} />
          </span>
          <strong>还没有可进入的真人聊天</strong>
          <p>双方都入梦后，会直接进入正常聊天。</p>
          <PrimaryButton onClick={onOpenDreamMap}>去梦境广场</PrimaryButton>
        </div>
      )}

      <div className="dt-msg-states" aria-label="消息状态总览">
        <span>待写第一句 {readyToSendNodes.length}</span>
        <span>等真人回应 {inChatNodes.length}</span>
        <span>待入梦 {pendingNodes.length}</span>
      </div>
      <p className="dt-status-line">当前行动 · {nextAction}</p>

      <div className="dt-note">
        <span>真实聊天仅在双方都入梦后开始</span>
        <span>AI 只带入预演摘要，不会替你发送任何消息</span>
      </div>
    </div>
  );
}
