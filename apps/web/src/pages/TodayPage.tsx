import { Bell, CalendarCheck, ChevronRight, DoorOpen, Hourglass, Sparkles, Users } from "lucide-react";
import type { DreamInviteStatus, DreamNode, FriendProfile, RelationshipSimulation, ThemeMode, TwinProjection } from "../types/dreamtwin";

interface TodayPageProps {
  dreamInviteStatus: DreamInviteStatus;
  friends: FriendProfile[];
  nodes: DreamNode[];
  sentFirstMessages?: Record<string, string>;
  simulations: RelationshipSimulation[];
  twin: TwinProjection;
  themeMode: ThemeMode;
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
  twin,
  themeMode,
  onContinueNode,
  onOpenDreamMap,
  onOpenFriends,
  onOpenMessages,
}: TodayPageProps) {
  const userName = twin.nickname.replace(/\s*的\s*DreamTwins?.*$/, "").trim() || "你";
  const greeting = themeMode === "day" ? "早安" : "晚安";
  const overnightNodes = nodes.filter((node) => node.entryMode === "overnight_discovery");
  const newCount = overnightNodes.filter((node) => node.status === "unviewed").length || overnightNodes.length;
  const waitingNodes = nodes.filter((node) => node.status === "waiting");
  const chatNodes = nodes.filter((node) => node.status === "both_entered" || node.status === "opened" || node.status === "in_chat");
  const friendInitial = (friends[0]?.name ?? "友").slice(0, 1);
  const friendNode = nodes.find((node) => node.entryMode === "friend_invite");
  const isFriendAccepted =
    dreamInviteStatus === "accepted" ||
    friendNode?.status === "both_entered" ||
    friendNode?.status === "opened" ||
    friendNode?.status === "in_chat";
  const sentNode = nodes.find((node) => sentFirstMessages[node.id]);
  const latestSentMessage = sentNode ? sentFirstMessages[sentNode.id] : undefined;

  const openWaiting = () => (waitingNodes[0] ? onContinueNode(waitingNodes[0].id) : onOpenFriends());

  return (
    <section className="page page-scroll dt-page today-page">
      <div className="page-content dt-content today-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <span className="dt-brand">
              <span className="dt-brand-mark" />
              DreamTwins
            </span>
          </div>
          <div className="dt-head-right">
            <button className="dt-icon-btn" type="button" aria-label="今日">
              <CalendarCheck size={18} />
            </button>
            <button className="dt-icon-btn" type="button" aria-label="通知">
              <Bell size={18} />
            </button>
          </div>
        </header>

        <div className="dt-greeting">
          <h1>{greeting}，{userName} ✨</h1>
          <p>这是你今日的关系动态</p>
        </div>

        <button className="dt-card" onClick={onOpenDreamMap} type="button">
          <span className="dt-card-icon tint-violet">
            <Sparkles size={22} />
          </span>
          <span className="dt-card-body">
            <strong>今日梦境</strong>
            <span>{newCount} 个新的关系入口在等你</span>
          </span>
          <span className="dt-card-aside">
            <ChevronRight size={20} />
          </span>
        </button>

        <button className="dt-card" onClick={openWaiting} type="button">
          <span className="dt-card-icon tint-gold">
            <Hourglass size={20} />
          </span>
          <span className="dt-card-body">
            <strong>等待回应</strong>
            <span>{waitingNodes.length} 个邀请正在等待对方入梦</span>
          </span>
          <span className="dt-card-aside">
            <span className="dt-ava">{friendInitial}</span>
          </span>
        </button>

        <button className="dt-card" onClick={onOpenMessages} type="button">
          <span className="dt-card-icon tint-pink">
            <DoorOpen size={20} />
          </span>
          <span className="dt-card-body">
            <strong>双方已入梦</strong>
            <span>{chatNodes.length} 段梦境可进入正常聊天</span>
          </span>
          <span className="dt-card-aside dt-ava-stack">
            <span className="dt-ava">她</span>
            <span className="dt-ava">他</span>
          </span>
        </button>

        <button className="dt-card" onClick={onOpenFriends} type="button">
          <span className="dt-card-icon">
            <Users size={20} />
          </span>
          <span className="dt-card-body">
            <strong>好友邀请</strong>
            <span>邀请好友开启共同梦境</span>
          </span>
          <span className="dt-card-aside">
            <ChevronRight size={20} />
          </span>
        </button>

        {isFriendAccepted ? (
          <div className="dt-note">
            <span>好友已入梦 · 回到同一张梦境地图，选择共同坐标</span>
          </div>
        ) : null}
        {latestSentMessage ? (
          <div className="dt-note">
            <span>你发出的第一句话：「{latestSentMessage}」，正在等待真人回应</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
