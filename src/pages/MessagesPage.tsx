import { ArrowRight, Bell, Compass, DoorOpen, MessageCircle, PenLine, ShieldCheck } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
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

export function MessagesPage({ nodes, sentFirstMessages = {}, simulations, onOpenChat, onOpenDreamMap, onReviewNode }: MessagesPageProps) {
  const chatReadyNodes = nodes.filter((node) => node.status === "opened" || node.status === "in_chat");
  const pendingNodes = nodes.filter((node) => node.status === "waiting" || node.status === "both_entered");
  const readyToSendNodes = nodes.filter((node) => node.status === "opened");
  const inChatNodes = nodes.filter((node) => node.status === "in_chat");
  const waitingNodes = nodes.filter((node) => node.status === "waiting");
  const getSimulation = (node: DreamNode) => simulations.find((simulation) => simulation.id === node.simulationId) ?? simulations[0];
  const primaryThread = chatReadyNodes.find((node) => node.status === "opened") ?? chatReadyNodes[0];
  const primarySimulation = primaryThread ? getSimulation(primaryThread) : null;
  const primarySentFirstMessage = primaryThread ? sentFirstMessages[primaryThread.id] : undefined;
  const secondaryChatNodes = primaryThread ? chatReadyNodes.filter((node) => node.id !== primaryThread.id) : [];
  const heroTitle = primaryThread
    ? readyToSendNodes.length > 0 && inChatNodes.length > 0
      ? `${readyToSendNodes.length} 段待写，${inChatNodes.length} 段等回应。`
      : readyToSendNodes.length > 0
        ? `${readyToSendNodes.length} 段关系待你写第一句。`
        : `${inChatNodes.length} 段关系等待真人回应。`
    : "梦境门打开后，聊天才会出现。";
  const heroActionTitle =
    primaryThread?.status === "opened"
      ? "先写第一句话"
      : primaryThread?.status === "in_chat"
        ? "等真人回应"
        : pendingNodes.length > 0
          ? "先看等待状态"
          : "去梦境地图开启关系";
  const heroCopy =
    primaryThread?.status === "opened"
      ? "梦境门已经打开，AI 只把预演整理成建议，真实聊天必须由你亲自发出。"
      : primaryThread?.status === "in_chat"
        ? "第一句话已经发出。DreamTwin 不再推进对话，也不会替你追问。"
        : pendingNodes.length > 0
          ? "这里不会提前出现普通私信。等待项确认后，才会进入写第一句或选共同梦境。"
          : "还没有可聊天关系。先去梦境地图看一段 AI 关系预演，再决定要不要进入。";
  const heroActionLabel =
    primaryThread?.status === "opened"
      ? "写第一句话"
      : primaryThread?.status === "in_chat"
        ? "查看等待回应"
        : pendingNodes.length > 0
          ? "查看等待项"
          : "去梦境地图";
  const openHeroAction = () => {
    if (primaryThread) {
      onOpenChat(primaryThread.id);
      return;
    }
    if (waitingNodes[0]) {
      onReviewNode(waitingNodes[0].id);
      return;
    }
    onOpenDreamMap();
  };
  const primaryGateLabels =
    primaryThread?.status === "in_chat"
      ? ["第一句已发出", "AI 不再代聊", "等真人回应"]
      : ["梦境门已打开", "AI 不再代聊", "由你发送"];
  const boundaryTitle =
    primaryThread?.status === "in_chat" ? "第一句话已由你发出。" : "第一句话由你编辑发送。";
  const boundaryCopy =
    primaryThread?.status === "in_chat"
      ? "DreamTwin 不会继续推进对话，也不会替你追问，只等待对方的真实回应。"
      : "DreamTwin 只整理预演建议，不替你聊天，也不提前打开陌生私信。";
  const lifecycleSteps = primaryThread?.status === "in_chat"
    ? ["梦境门已开", "第一句已发出", "AI 停止推进", "等待真人回应"]
    : ["梦境地图", "双方确认", "你写第一句", "真人聊天"];
  const nextStepTitle =
    primaryThread?.status === "opened"
      ? "现在只需要写第一句话。"
      : primaryThread?.status === "in_chat"
        ? "现在只等待真人回应。"
        : "先让一段关系打开梦境门。";
  const nextStepCopy =
    primaryThread?.status === "opened"
      ? "AI 已经把预演整理成低压开场，但发送动作必须由你完成。"
      : primaryThread?.status === "in_chat"
        ? "第一句话发出后，DreamTwin 不再继续推进对话，也不会替你追加消息。"
        : "消息页不会提前展示陌生人私信。先去梦境地图查看预演，等双方确认后再回来写第一句。";
  const messageModes = [
    {
      className: "message-mode-write",
      icon: <PenLine size={16} />,
      label: "待写第一句",
      value: readyToSendNodes.length,
      helper: "梦境门已打开",
      copy: readyToSendNodes.length > 0 ? "关系已经确认，下一步由你亲自开启真实聊天。" : "有关系开门后，会先停在这里等你编辑。",
      onClick: () => (readyToSendNodes[0] ? onOpenChat(readyToSendNodes[0].id) : onOpenDreamMap()),
    },
    {
      className: "message-mode-sent",
      icon: <MessageCircle size={16} />,
      label: "等真人回应",
      value: inChatNodes.length,
      helper: "AI 不再推进",
      copy: inChatNodes.length > 0 ? "第一句话已经发出，DreamTwin 不会替你追问。" : "你发出第一句话后，这里只承接真实回应。",
      onClick: () => (inChatNodes[0] ? onOpenChat(inChatNodes[0].id) : onOpenDreamMap()),
    },
    {
      className: "message-mode-locked",
      icon: <DoorOpen size={16} />,
      label: "未开门",
      value: pendingNodes.length,
      helper: "系统提醒",
      copy: pendingNodes.length > 0 ? "这些关系还没进入聊天，只能回看状态或继续选梦。" : "没有等待项时，先去梦境地图查看关系预演。",
      onClick: () => (waitingNodes[0] ? onReviewNode(waitingNodes[0].id) : onOpenDreamMap()),
    },
  ];

  return (
    <section className="page page-scroll scene-page messages-page">
      <ThreeDreamScene variant="ambient" className="page-scene messages-scene" />
      <div className="page-content messages-content">
        <header className="messages-hero">
          <p className="label">消息</p>
          <h1>{heroTitle}</h1>
          <p>{heroCopy}</p>
          <div className="messages-hero-action" aria-label="消息页当前行动">
            <div>
              <span>当前行动</span>
              <strong>{heroActionTitle}</strong>
            </div>
            <PrimaryButton icon={<ArrowRight size={17} />} onClick={openHeroAction}>
              {heroActionLabel}
            </PrimaryButton>
          </div>
          <div className="messages-hero-counters" aria-label="消息状态概览">
            <span>{`${readyToSendNodes.length} 待写`}</span>
            <span>{`${inChatNodes.length} 等回应`}</span>
            <span>{`${pendingNodes.length} 未开门`}</span>
          </div>
        </header>

        <section className="message-lifecycle" aria-label="消息打开规则">
          {lifecycleSteps.map((step, index) => (
            <span className={index === 0 || primaryThread ? "message-lifecycle-active" : ""} key={step}>
              {step}
            </span>
          ))}
        </section>

        {primaryThread && primarySimulation ? (
          <section className="message-primary-thread" aria-label="当前最重要聊天">
            <div>
              <span>{primaryThread.status === "opened" ? "待你发送第一句" : "等待真人回应"}</span>
              <strong>{primarySimulation.title}</strong>
              <p>{primarySimulation.rehearsalOutcome}</p>
            </div>
            <StatusPill entryMode={primaryThread.entryMode} status={primaryThread.status} />
            <div className="message-thread-gate" aria-label="聊天打开条件">
              {primaryGateLabels.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>
            <PrimaryButton icon={<ArrowRight size={17} />} onClick={() => onOpenChat(primaryThread.id)}>
              {primaryThread.status === "opened" ? "写第一句话" : "查看等待回应"}
            </PrimaryButton>
            {primaryThread.status === "in_chat" && primarySentFirstMessage ? (
              <blockquote className="message-first-line-preview">{primarySentFirstMessage}</blockquote>
            ) : null}
          </section>
        ) : (
          <section className="message-gate-locked" aria-label="消息未开放状态">
            <DoorOpen size={19} />
            <div>
              <span>还没有可进入的真人聊天</span>
              <strong>先让一段关系打开梦境门。</strong>
              <p>当前没有开放私信入口。DreamTwin 会等双方确认后，再把第一句话交给你编辑发送。</p>
            </div>
            <PrimaryButton variant="secondary" icon={<Compass size={17} />} onClick={onOpenDreamMap}>
              去梦境地图
            </PrimaryButton>
          </section>
        )}

        <section className="message-boundary-panel" aria-label="聊天准备说明">
          <ShieldCheck size={17} />
          <div>
            <strong>{boundaryTitle}</strong>
            <p>{boundaryCopy}</p>
          </div>
        </section>

        <section className="message-next-step" aria-label="当前消息下一步">
          <span>当前下一步</span>
          <strong>{nextStepTitle}</strong>
          <p>{nextStepCopy}</p>
        </section>

        <section className="message-mode-router" aria-label="消息状态分类">
          <div className="section-heading-inline">
            <span>消息不是私信列表</span>
            <strong>只显示梦境门后的关系。</strong>
          </div>
          <div className="message-mode-row">
            {messageModes.map((item) => (
              <button className={`message-mode-card ${item.className}`} key={item.label} onClick={item.onClick} type="button">
                <i>{item.icon}</i>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
                <small>{item.helper}</small>
                <p>{item.copy}</p>
              </button>
            ))}
          </div>
        </section>

        {secondaryChatNodes.length ? (
          <section className="message-list" aria-label="其他已打开的聊天">
            <div className="section-heading-inline">
              <span>其他聊天</span>
              <strong>{`${secondaryChatNodes.length} 段关系`}</strong>
            </div>
            {secondaryChatNodes.map((node) => {
              const simulation = getSimulation(node);

              return (
                <article className="message-thread-card" key={node.id}>
                  <div>
                    <span>{simulation.counterpartName}</span>
                    <strong>{simulation.title}</strong>
                    <p>{simulation.rehearsalOutcome}</p>
                  </div>
                  <StatusPill entryMode={node.entryMode} status={node.status} />
                  <PrimaryButton icon={<MessageCircle size={17} />} onClick={() => onOpenChat(node.id)}>
                    {node.status === "opened" ? "写第一句话" : "查看等待回应"}
                  </PrimaryButton>
                </article>
              );
            })}
          </section>
        ) : null}

        {pendingNodes.length ? (
          <section className="message-system-list" aria-label="系统状态提醒">
            <div className="section-heading-inline">
              <span>系统状态</span>
              <strong>还没进入聊天</strong>
            </div>
            {pendingNodes.map((node) => {
              const simulation = getSimulation(node);
              const isFriendInvite = simulation.entryMode === "friend_invite";

              return (
                <button
                  className="message-system-item"
                  key={node.id}
                  onClick={() => (node.status === "both_entered" ? onOpenDreamMap() : onReviewNode(node.id))}
                  type="button"
                >
                  <StatusPill entryMode={node.entryMode} status={node.status} />
                  <span>{simulation.title}</span>
                  <p>
                    {node.status === "both_entered"
                      ? "双方已入梦，去梦境地图继续选择或查看预演。"
                      : isFriendInvite
                        ? "好友邀请等待中，接受后会回到统一梦境地图。"
                        : "等待对方确认中，梦境门打开后才会出现第一句话。"}
                  </p>
                  <Bell size={14} />
                </button>
              );
            })}
          </section>
        ) : null}
      </div>
    </section>
  );
}
