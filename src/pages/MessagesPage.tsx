import { Bell, Compass, MoreHorizontal, Search } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";

interface MessagesPageProps {
  nodes: DreamNode[];
  sentFirstMessages?: Record<string, string>;
  simulations: RelationshipSimulation[];
  onOpenChat: (nodeId: string) => void;
  onOpenDreamMap: () => void;
  onReviewNode: (nodeId: string) => void;
}

const THREAD_TIMES = ["21:42", "20:15", "19:03", "17:48"];

export function MessagesPage({ nodes, sentFirstMessages = {}, simulations, onOpenChat, onOpenDreamMap }: MessagesPageProps) {
  const chatReadyNodes = nodes.filter((node) => node.status === "opened" || node.status === "in_chat");
  const waitingNodes = nodes.filter((node) => node.status === "waiting");
  const readyToSendNodes = nodes.filter((node) => node.status === "opened");
  const inChatNodes = nodes.filter((node) => node.status === "in_chat");
  const pendingNodes = nodes.filter((node) => node.status === "waiting" || node.status === "both_entered");
  const getSimulation = (node: DreamNode) => simulations.find((simulation) => simulation.id === node.simulationId) ?? simulations[0];
  const unreadCount = readyToSendNodes.length;
  const nextAction =
    readyToSendNodes.length > 0 ? "先写第一句话" : inChatNodes.length > 0 ? "等真人回应" : "去梦境地图开启关系";

  const threadPreview = (node: DreamNode, simulation: RelationshipSimulation) => {
    const sent = sentFirstMessages[node.id];
    if (sent) return `你：${sent}`;
    if (node.status === "in_chat") return `他：${simulation.counterpartSimulatedReply}`;
    return simulation.possibleFirstLine;
  };

  return (
    <section className="page page-scroll scene-page dt-page messages-page">
      <ThreeDreamScene variant="ambient" className="page-scene messages-scene" />
      <div className="page-content dt-content messages-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <span className="dt-head-title" style={{ justifySelf: "start", fontSize: 18 }}>消息</span>
          </div>
          <div className="dt-head-right">
            <button className="dt-icon-btn" type="button" aria-label="搜索">
              <Search size={17} />
            </button>
            <button className="dt-icon-btn" type="button" aria-label="更多">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </header>

        <div className="dt-msg-tabs">
          <span className="dt-msg-tab dt-msg-tab-active">全部</span>
          <span className="dt-msg-tab">
            未读
            {unreadCount > 0 ? <span className="dt-badge">{unreadCount}</span> : null}
          </span>
        </div>

        {chatReadyNodes.length ? (
          <div className="dt-thread-list">
            {chatReadyNodes.map((node, index) => {
              const simulation = getSimulation(node);
              const isUnread = node.status === "opened";

              return (
                <button className="dt-thread" key={node.id} onClick={() => onOpenChat(node.id)} type="button">
                  <span className="dt-ava">{simulation.counterpartName.slice(0, 1)}</span>
                  <span className="dt-thread-body">
                    <strong>{simulation.title}梦境门已打开</strong>
                    <p>{threadPreview(node, simulation)}</p>
                  </span>
                  <span className="dt-thread-meta">
                    <span className="dt-thread-time">{THREAD_TIMES[index] ?? "今天"}</span>
                    {isUnread ? <span className="dt-badge">1</span> : <span style={{ height: 18 }} />}
                  </span>
                </button>
              );
            })}

            <div className="dt-thread">
              <span className="dt-ava dt-sys-icon">
                <Bell size={18} />
              </span>
              <span className="dt-thread-body">
                <strong>系统提醒</strong>
                <p>你有 {waitingNodes.length} 个邀请正在等待对方入梦</p>
              </span>
              <span className="dt-thread-meta">
                <span className="dt-thread-time">18:30</span>
                <span style={{ height: 18 }} />
              </span>
            </div>
          </div>
        ) : (
          <div className="dt-panel" style={{ marginTop: 8, textAlign: "center", justifyItems: "center" }}>
            <span className="dt-card-icon tint-pink" style={{ margin: "0 auto" }}>
              <Compass size={20} />
            </span>
            <strong className="dt-panel-title">还没有可进入的真人聊天</strong>
            <p>梦境门打开后，第一句话会先交给你编辑发送。</p>
            <PrimaryButton icon={<Compass size={17} />} onClick={onOpenDreamMap}>
              去梦境广场
            </PrimaryButton>
          </div>
        )}

        <div className="dt-msg-states" aria-label="消息状态总览">
          <span>待写第一句 {readyToSendNodes.length}</span>
          <span>等真人回应 {inChatNodes.length}</span>
          <span>未开门 {pendingNodes.length}</span>
        </div>
        <p className="dt-status-line">当前行动 · {nextAction}</p>

        <div className="dt-note">
          <span>真实聊天仅在梦境门开启后开始</span>
          <span>第一句话发出后，AI 不再推进对话，也不会替你发送任何消息</span>
        </div>
      </div>
    </section>
  );
}
