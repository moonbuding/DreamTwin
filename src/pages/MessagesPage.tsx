import { Compass, DoorOpen, MessageCircle, ShieldCheck } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";

interface MessagesPageProps {
  nodes: DreamNode[];
  simulations: RelationshipSimulation[];
  onOpenChat: (nodeId: string) => void;
  onOpenDreamMap: () => void;
  onReviewNode: (nodeId: string) => void;
}

export function MessagesPage({ nodes, simulations, onOpenChat, onOpenDreamMap, onReviewNode }: MessagesPageProps) {
  const chatReadyNodes = nodes.filter((node) => node.status === "opened" || node.status === "in_chat");
  const pendingNodes = nodes.filter((node) => node.status === "waiting" || node.status === "both_entered");
  const getSimulation = (node: DreamNode) => simulations.find((simulation) => simulation.id === node.simulationId) ?? simulations[0];

  return (
    <section className="page page-scroll scene-page messages-page">
      <ThreeDreamScene variant="ambient" className="page-scene messages-scene" />
      <div className="page-content messages-content">
        <header className="messages-hero">
          <p className="label">消息</p>
          <h1>只接住梦境门后的真人聊天。</h1>
          <p>这里不是开放私信。没有双方确认，DreamTwin 不会把关系推进到聊天。</p>
        </header>

        <section className="message-boundary-panel" aria-label="消息边界">
          <ShieldCheck size={17} />
          <div>
            <strong>AI 不代聊，消息不抢跑。</strong>
            <p>AI 只把预演建议交给你。第一句话仍然由你编辑并亲自发送。</p>
          </div>
        </section>

        <section className="message-list" aria-label="已打开的聊天">
          <div className="section-heading-inline">
            <span>可进入聊天</span>
            <strong>{chatReadyNodes.length ? `${chatReadyNodes.length} 段关系` : "暂无"}</strong>
          </div>
          {chatReadyNodes.length ? (
            chatReadyNodes.map((node) => {
              const simulation = getSimulation(node);

              return (
                <article className="message-thread-card" key={node.id}>
                  <div>
                    <span>{simulation.counterpartName}</span>
                    <strong>{simulation.title}</strong>
                    <p>{simulation.rehearsalOutcome}</p>
                  </div>
                  <StatusPill status={node.status} />
                  <PrimaryButton icon={<MessageCircle size={17} />} onClick={() => onOpenChat(node.id)}>
                    进入聊天
                  </PrimaryButton>
                </article>
              );
            })
          ) : (
            <div className="message-empty">
              <DoorOpen size={18} />
              <p>梦境门打开后，聊天会出现在这里。现在可以先去梦境地图看 AI 预演。</p>
              <PrimaryButton variant="secondary" icon={<Compass size={17} />} onClick={onOpenDreamMap}>
                去梦境地图
              </PrimaryButton>
            </div>
          )}
        </section>

        {pendingNodes.length ? (
          <section className="message-system-list" aria-label="系统状态提醒">
            <div className="section-heading-inline">
              <span>系统状态</span>
              <strong>还没进入聊天</strong>
            </div>
            {pendingNodes.map((node) => {
              const simulation = getSimulation(node);

              return (
                <button className="message-system-item" key={node.id} onClick={() => onReviewNode(node.id)} type="button">
                  <StatusPill status={node.status} />
                  <span>{simulation.title}</span>
                  <p>{node.status === "both_entered" ? "双方已入梦，去梦境地图继续选择或查看预演。" : "等待确认中，真实聊天尚未打开。"}</p>
                </button>
              );
            })}
          </section>
        ) : null}
      </div>
    </section>
  );
}
