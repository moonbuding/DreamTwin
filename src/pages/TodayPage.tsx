import { ArrowRight, Bell, Compass, DoorOpen, MessageCircle, Moon, Sparkles, Users } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamInviteStatus, DreamNode, FriendProfile, RelationshipSimulation, TwinProjection } from "../types/dreamtwin";
import { createRelationshipStates, relationshipStatusLabel, selectTodayPrimaryNode } from "../utils/relationshipState";

interface TodayPageProps {
  dreamInviteStatus: DreamInviteStatus;
  friends: FriendProfile[];
  nodes: DreamNode[];
  sentFirstMessages?: Record<string, string>;
  simulations: RelationshipSimulation[];
  twin: TwinProjection;
  onContinueNode: (nodeId: string) => void;
  onOpenDreamMap: () => void;
  onOpenFriends: () => void;
  onOpenMessages: () => void;
  onOpenTwin: () => void;
}

export function TodayPage({
  dreamInviteStatus,
  friends,
  nodes,
  sentFirstMessages = {},
  simulations,
  twin,
  onContinueNode,
  onOpenDreamMap,
  onOpenFriends,
  onOpenMessages,
  onOpenTwin,
}: TodayPageProps) {
  const relationshipStates = createRelationshipStates(nodes, simulations);
  const overnightNodes = nodes.filter((node) => node.entryMode === "overnight_discovery");
  const friendNode = nodes.find((node) => node.entryMode === "friend_invite");
  const waitingNodes = nodes.filter((node) => node.status === "waiting");
  const friendWaitingCount = waitingNodes.filter((node) => node.entryMode === "friend_invite").length;
  const bothEnteredNodes = nodes.filter((node) => node.status === "both_entered");
  const gateNodes = nodes.filter((node) => node.status === "opened");
  const chatNodes = nodes.filter((node) => node.status === "in_chat");
  const hasReadyToSend = gateNodes.length > 0;
  const hasSentWaiting = chatNodes.length > 0;
  const unreadCount = overnightNodes.filter((node) => node.status === "unviewed").length;
  const recommendedNode = overnightNodes.find((node) => node.status === "unviewed") ?? overnightNodes[0] ?? nodes[0];
  const recommendedSimulation = simulations.find((simulation) => simulation.id === recommendedNode?.simulationId) ?? simulations[0];
  const selectedFriend = friends[0];
  const friendName = selectedFriend?.name ?? "好友";
  const isFriendInviteSent = dreamInviteStatus === "sent" || friendNode?.status === "waiting";
  const isFriendInviteAccepted =
    dreamInviteStatus === "accepted" || friendNode?.status === "both_entered" || friendNode?.status === "opened" || friendNode?.status === "in_chat";
  const primaryFocus = selectTodayPrimaryNode(nodes);
  const primaryFocusState = relationshipStates.find((state) => state.nodeId === primaryFocus?.id);
  const isPrimaryAcceptedFriend = Boolean(primaryFocus?.entryMode === "friend_invite" && primaryFocus.status === "both_entered");
  const primarySentFirstMessage = primaryFocus ? sentFirstMessages[primaryFocus.id] : undefined;
  const latestSentNode = chatNodes.find((node) => sentFirstMessages[node.id]) ?? chatNodes[0];
  const latestSentFirstMessage = latestSentNode ? sentFirstMessages[latestSentNode.id] : undefined;
  const hasFriendInFlow = Boolean(friendNode && (friendNode.status !== "unviewed" || dreamInviteStatus !== "draft"));
  const visibleRelationshipStates = relationshipStates
    .filter((state) => {
      const node = nodes.find((item) => item.id === state.nodeId);
      return node?.entryMode !== "friend_invite" || hasFriendInFlow;
    })
    .slice(0, 2);
  const inboxCount = gateNodes.length + chatNodes.length;
  const messageTaskLabel = hasReadyToSend ? "梦境门" : "消息";
  const messageTaskTitle = hasReadyToSend
    ? hasSentWaiting
      ? `${gateNodes.length} 待写，${chatNodes.length} 等回应`
      : `${gateNodes.length} 段关系待写第一句`
    : hasSentWaiting
      ? `${chatNodes.length} 段关系等待真人回应`
      : "梦境门还未打开";
  const messageTaskCopy = hasReadyToSend
    ? "双方确认后的关系已进入消息页，先由你亲自写出第一句话。"
    : hasSentWaiting
      ? latestSentFirstMessage
        ? `你发出的第一句话已在消息页等待回应：“${latestSentFirstMessage}”`
        : "第一句话已经发出。DreamTwin 不再推进，只等待对方真实回应。"
      : "只有双方都愿意，消息入口才会出现。";
  const messageTaskAction = hasReadyToSend ? "写第一句" : hasSentWaiting ? "查看等待回应" : "去梦境地图";
  const messageRouteCopy = hasReadyToSend
    ? "待写第一句话"
    : hasSentWaiting
      ? "第一句已发出，等回应"
      : "梦境门后出现";
  const chatBoundaryCopy = hasReadyToSend
    ? "梦境门打开后，系统会把建议整理成可编辑的第一句话，真实互动由你亲自开始。"
    : hasSentWaiting
      ? "第一句话发出后，DreamTwin 不再推进对话，也不会替你追问。接下来只等待真人回应。"
      : "梦境门打开后，系统才会把建议整理成可编辑的第一句话，真实互动由你亲自开始。";
  const waitingCount = waitingNodes.length;
  const inviteText =
    isFriendInviteSent
      ? "好友邀请等待中"
      : isFriendInviteAccepted
        ? "好友已入梦，去梦境地图选择场景"
        : "可以邀请好友一起入梦";
  const friendTaskTitle =
    isFriendInviteSent
      ? `等待 ${friendName} 入梦`
      : isFriendInviteAccepted
        ? `${friendName} 已入梦`
        : `邀请 ${friendName} 一起入梦`;
  const friendTaskCopy =
    isFriendInviteSent
      ? "好友接受前不会进入共同预演，也不会发送真实聊天内容。"
      : isFriendInviteAccepted
        ? "好友已接受。下一步回到同一张梦境地图，共同选择梦境坐标。"
        : "已有好友关系也先低压邀请，确认后再一起看 AI 预演。";
  const friendTaskAction = isFriendInviteAccepted ? "去梦境地图" : isFriendInviteSent ? "查看邀请" : "发起邀请";
  const primaryFocusTitle = isPrimaryAcceptedFriend ? `${friendName} 已入梦` : primaryFocus ? primaryFocus.title : "梦境广场";
  const primaryFocusLabel =
    primaryFocus?.status === "opened"
      ? "梦境门已打开"
      : primaryFocus?.status === "in_chat"
        ? "第一句已发出"
        : primaryFocus?.status === "both_entered"
          ? primaryFocus.entryMode === "friend_invite"
            ? "好友已入梦"
            : "双方已入梦"
          : primaryFocus?.status === "waiting"
            ? primaryFocus.entryMode === "friend_invite"
              ? "等待好友入梦"
              : "等待回应中"
            : primaryFocusState
              ? relationshipStatusLabel(primaryFocusState.status, primaryFocusState.entryMode)
              : "今日推荐";
  const primaryFocusCopy =
    primaryFocus?.status === "waiting"
      ? primaryFocus.entryMode === "friend_invite"
        ? "好友还没确认。这次入梦会停在等待区，你可以回看邀请或撤回。"
        : "对方还没确认。这段关系会停在等待区，你可以回看预演或撤回。"
      : primaryFocus?.status === "opened"
        ? "双方都确认了。现在最重要的是写出第一句话，把预演带回真实聊天。"
        : primaryFocus?.status === "in_chat"
          ? primarySentFirstMessage
            ? "这段关系已经进入消息页。DreamTwin 不再推进对话，只等待对方真实回应。"
            : "第一句话已经发出。这段关系进入消息页，接下来等真人回应。"
          : primaryFocus?.status === "both_entered"
            ? primaryFocus.entryMode === "friend_invite"
              ? `${friendName} 已经接受入梦。现在不是直接聊天，而是先回到同一张梦境地图，选择你们要共同经历的坐标。`
              : "双方已经入梦。下一步先回到同一张梦境地图，选择共同场景。"
            : recommendedSimulation?.rehearsalOutcome ?? "先从梦境地图里选择一段关系预演。";
  const primaryActionLabel =
    primaryFocus?.status === "opened"
      ? "去写第一句话"
      : primaryFocus?.status === "in_chat"
        ? "回到消息"
        : primaryFocus?.status === "both_entered"
          ? "去地图选共同梦境"
          : primaryFocus?.status === "waiting"
            ? "查看等待状态"
            : "查看今日推荐";
  const openPrimaryFocus = () => {
    if (!primaryFocus) {
      onOpenDreamMap();
      return;
    }
    if (primaryFocus.status === "in_chat") {
      onOpenMessages();
      return;
    }
    if (primaryFocus.status === "both_entered") {
      onOpenDreamMap();
      return;
    }
    onContinueNode(primaryFocus.id);
  };
  const openRelationshipState = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (node?.status === "both_entered") {
      onOpenDreamMap();
      return;
    }
    if (node?.status === "in_chat") {
      onOpenMessages();
      return;
    }
    onContinueNode(nodeId);
  };
  const inboxSummary = [
    {
      label: "待查看",
      value: unreadCount,
      helper: "AI 已带回",
      onClick: () => (recommendedNode ? onContinueNode(recommendedNode.id) : onOpenDreamMap()),
    },
    {
      label: "等待",
      value: waitingCount,
      helper: waitingCount > 0 ? "等确认" : "暂无",
      onClick: () => (waitingNodes[0] ? onContinueNode(waitingNodes[0].id) : onOpenFriends()),
    },
    {
      label: "已入梦",
      value: bothEnteredNodes.length,
      helper: bothEnteredNodes.length > 0 ? "去地图" : "待确认",
      onClick: onOpenDreamMap,
    },
    {
      label: "聊天",
      value: inboxCount,
      helper: inboxCount > 0 ? "去消息" : "门后开启",
      onClick: inboxCount > 0 ? onOpenMessages : onOpenDreamMap,
    },
  ];
  const dailyActionPath = [
    {
      id: "look",
      icon: <Moon size={15} />,
      label: "先看",
      title: unreadCount > 0 ? `${unreadCount} 个新预演` : "看地图",
      helper: "AI 带回",
      onClick: () => (recommendedNode ? onContinueNode(recommendedNode.id) : onOpenDreamMap()),
    },
    {
      id: "wait",
      icon: <Bell size={15} />,
      label: "等待",
      title: waitingCount > 0 ? `${waitingCount} 个确认` : "暂无",
      helper: "不催促",
      onClick: () => (waitingNodes[0] ? onContinueNode(waitingNodes[0].id) : onOpenDreamMap()),
    },
    {
      id: "chat",
      icon: <MessageCircle size={15} />,
      label: "聊天",
      title: gateNodes.length > 0 ? "写第一句" : chatNodes.length > 0 ? "等回应" : "未开门",
      helper: "真人开始",
      onClick: inboxCount > 0 ? onOpenMessages : onOpenDreamMap,
    },
    {
      id: "invite",
      icon: <Users size={15} />,
      label: "邀友",
      title: isFriendInviteSent ? "等待中" : isFriendInviteAccepted ? "去地图" : "发邀请",
      helper: "共同入梦",
      onClick: isFriendInviteAccepted ? onOpenDreamMap : onOpenFriends,
    },
  ];
  const dailyTasks = [
    {
      id: "recommended",
      icon: <Moon size={16} />,
      label: "今日推荐",
      title: recommendedNode?.title ?? "梦境地图",
      copy: recommendedSimulation?.rehearsalOutcome ?? "先从梦境地图里选择一段关系预演。",
      action: "查看预演",
      onClick: () => (recommendedNode ? onContinueNode(recommendedNode.id) : onOpenDreamMap()),
      visible: Boolean(recommendedNode),
    },
    {
      id: "waiting",
      icon: <Bell size={16} />,
      label: "等待回应",
      title:
        waitingCount > 0
          ? friendWaitingCount === waitingCount
            ? `${waitingCount} 个好友邀请正在等待`
            : `${waitingCount} 段关系正在等待确认`
          : "暂无等待",
      copy: waitingCount > 0 ? "真实聊天不会提前打开，你可以回看预演或撤回。" : "发出入梦邀请后，这里会承接等待状态。",
      action: waitingCount > 0 ? "查看等待" : "去梦境地图",
      onClick: () => (waitingNodes[0] ? onContinueNode(waitingNodes[0].id) : onOpenDreamMap()),
      visible: waitingCount > 0,
    },
    {
      id: "gate",
      icon: <DoorOpen size={16} />,
      label: messageTaskLabel,
      title: messageTaskTitle,
      copy: messageTaskCopy,
      action: inboxCount > 0 ? messageTaskAction : "去梦境地图",
      onClick: inboxCount > 0 ? onOpenMessages : onOpenDreamMap,
      visible: inboxCount > 0,
    },
    {
      id: "friend",
      icon: <Users size={16} />,
      label: "好友入梦",
      title: friendTaskTitle,
      copy: friendTaskCopy,
      action: friendTaskAction,
      onClick: isFriendInviteAccepted ? onOpenDreamMap : onOpenFriends,
      visible: true,
    },
  ];
  const visibleDailyTasks = dailyTasks
    .filter((task) => task.id !== "recommended")
    .filter((task) => task.id !== "friend" || hasFriendInFlow)
    .filter((task) => task.visible)
    .slice(0, 2);

  return (
    <section className="page page-scroll scene-page today-page">
      <ThreeDreamScene variant="ambient" className="page-scene today-scene" />
      <div className="page-content today-content">
        <div className="today-priority-stage" aria-label="今日优先行动">
          <header className="today-hero">
            <p className="label">今日</p>
            <h1>今天先处理一段关系。</h1>
            <p>{twin.nickname} 已保存。DreamTwin 会把新预演、等待回应和梦境门整理成每天的关系待办。</p>
          </header>

          <section className={`today-focus today-focus-${primaryFocus?.status ?? "none"}`} aria-label="今日最重要关系状态">
            <div className="today-focus-copy">
              <span>{primaryFocusLabel}</span>
              <strong>{primaryFocusTitle}</strong>
              <p>{primaryFocusCopy}</p>
            </div>
            {primaryFocus ? <StatusPill entryMode={primaryFocus.entryMode} status={primaryFocus.status} /> : null}
            {isPrimaryAcceptedFriend ? (
              <div className="today-shared-map-handoff" aria-label="好友共同入梦状态">
                <span>你已入梦</span>
                <strong>同一张梦境地图</strong>
                <span>{friendName} 已入梦</span>
                <p>下一步去地图选择共同坐标，再让 AI 基于双方分身画像和场景事件预演关系。</p>
              </div>
            ) : null}
            {primaryFocus?.status === "in_chat" && primarySentFirstMessage ? (
              <blockquote className="today-first-line-preview">{primarySentFirstMessage}</blockquote>
            ) : null}
            <PrimaryButton icon={<ArrowRight size={18} />} onClick={openPrimaryFocus}>
              {primaryActionLabel}
            </PrimaryButton>
          </section>

          <section className="today-inbox" aria-label="今日关系收件箱">
            <div className="today-section-heading">
              <span>关系收件箱</span>
              <strong>先处理有变化的关系。</strong>
            </div>
            <div className="today-inbox-row">
              {inboxSummary.map((item) => (
                <button key={item.label} onClick={item.onClick} type="button">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                  <small>{item.helper}</small>
                </button>
              ))}
            </div>
          </section>
        </div>

        {visibleDailyTasks.length ? (
          <section className="today-agenda" aria-label="今日关系任务">
            <div className="today-section-heading">
              <span>接下来可以做</span>
              <strong>只显示有变化的关系。</strong>
            </div>
            <div className="today-task-list">
              {visibleDailyTasks.map((task) => (
                <button key={task.id} onClick={task.onClick} type="button">
                  <i>{task.icon}</i>
                  <span>{task.label}</span>
                  <strong>{task.title}</strong>
                  <p>{task.copy}</p>
                  <b>{task.action}</b>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section className="today-action-path" aria-label="今天还能做什么">
          <div className="today-section-heading">
            <span>今天还能做什么</span>
            <strong>看预演、等回应、写第一句或邀请好友。</strong>
          </div>
          <div className="today-action-path-row">
            {dailyActionPath.map((item) => (
              <button className={`today-action-${item.id}`} key={item.id} onClick={item.onClick} type="button">
                <i>{item.icon}</i>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <small>{item.helper}</small>
              </button>
            ))}
          </div>
        </section>

        {visibleRelationshipStates.length ? (
          <section className="relationship-state-strip" aria-label="关系状态概览">
            {visibleRelationshipStates.map((state) => (
              <button key={state.id} onClick={() => openRelationshipState(state.nodeId)} type="button">
                <span>{relationshipStatusLabel(state.status, state.entryMode)}</span>
                <strong>{state.label.split(" · ")[0]}</strong>
              </button>
            ))}
          </section>
        ) : null}

        <section className="today-next-loop" aria-label="今日主循环入口">
          <div>
            <span>下一步</span>
            <strong>梦境地图是统一入口。</strong>
            <p>新关系发现和好友共同入梦，都回到同一张地图选择梦境场景。</p>
          </div>
          <div className="today-loop-actions">
            <button onClick={onOpenDreamMap} type="button">
              <Compass size={17} />
              <span>梦境地图</span>
              <strong>{nodes.filter((node) => node.entryMode === "overnight_discovery").length} 个预演入口</strong>
            </button>
            <button onClick={onOpenFriends} type="button">
              <Users size={17} />
              <span>好友入梦</span>
              <strong>{selectedFriend ? `${selectedFriend.name} · ${inviteText}` : inviteText}</strong>
            </button>
            <button onClick={onOpenTwin} type="button">
              <Sparkles size={17} />
              <span>分身画像</span>
              <strong>补全关系信号</strong>
            </button>
          </div>
        </section>

        <section className="today-boundary" aria-label="真实聊天说明">
          <DoorOpen size={16} />
          <p>{chatBoundaryCopy}</p>
        </section>
      </div>
    </section>
  );
}
