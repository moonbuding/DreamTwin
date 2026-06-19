import { Compass, DoorOpen, Send, Users } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamInviteStatus, DreamNode, FriendProfile, RelationshipSimulation } from "../types/dreamtwin";

interface FriendInvitePageProps {
  friends: FriendProfile[];
  inviteStatus: DreamInviteStatus;
  node: DreamNode;
  selectedFriendId: string | null;
  simulation: RelationshipSimulation;
  onInvite: (friendId: string) => void;
  onOpenDreamMap: () => void;
  onSelectFriend: (friendId: string) => void;
}

export function FriendInvitePage({
  friends,
  inviteStatus,
  node,
  selectedFriendId,
  simulation,
  onInvite,
  onOpenDreamMap,
  onSelectFriend,
}: FriendInvitePageProps) {
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? friends[0];
  const inviteCopy =
    inviteStatus === "withdrawn"
      ? "上一次邀请已撤回，可以换一个梦境重新发起。"
      : inviteStatus === "sent"
        ? "邀请已发出。好友接受前，DreamTwin 不会替你表达关系意图。"
        : inviteStatus === "accepted"
          ? "好友已经入梦。下一步回到梦境地图，在同一张地图里共同选择场景。"
          : "好友接受后，你们会进入同一张梦境地图，再一起选择场景和查看关系预演。";

  const canInvite = Boolean(selectedFriend);
  const isAccepted = inviteStatus === "accepted" || node.status === "both_entered" || node.status === "opened" || node.status === "in_chat";
  const isSent = inviteStatus === "sent" || node.status === "waiting";

  return (
    <section className="page page-scroll scene-page friend-invite-page">
      <ThreeDreamScene variant="ambient" className="page-scene friend-invite-scene" />
      <div className="page-content friend-invite-content">
        <div className="friend-invite-hero">
          <p className="label">好友</p>
          <h1>先邀请，再共同入梦。</h1>
          <p>
            好友页只负责发起和确认邀请。场景选择回到统一梦境地图，避免偷偷分析，也避免把好友路径做成另一套玩法。
          </p>
        </div>

        <section className="friend-picker" aria-label="选择好友">
          <div className="section-heading-inline">
            <span>选择好友</span>
            <strong>当前使用示例好友</strong>
          </div>
          <div className="friend-card-row">
            {friends.map((friend) => (
              <button
                aria-pressed={friend.id === selectedFriend?.id}
                className={friend.id === selectedFriend?.id ? "friend-card friend-card-active" : "friend-card"}
                key={friend.id}
                onClick={() => onSelectFriend(friend.id)}
                type="button"
              >
                <span>
                  <Users size={15} />
                  {friend.relationLabel}
                </span>
                <strong>{friend.name}</strong>
                <p>{friend.presence}</p>
                <small>{friend.keywords.join(" / ")}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="invite-preview" aria-label="邀请状态">
          <div>
            <Compass size={16} />
            <span>邀请状态</span>
          </div>
          <strong>
            {isAccepted
              ? `${selectedFriend?.name ?? "好友"} 已进入梦境地图入口`
              : isSent
                ? `等待 ${selectedFriend?.name ?? "好友"} 入梦`
                : `邀请 ${selectedFriend?.name ?? "好友"} 一起进入梦境地图`}
          </strong>
          <p>{inviteCopy}</p>
          <div className="friend-invite-state">
            <StatusPill status={node.status} label={isAccepted ? "双方已入梦" : isSent ? "等待好友入梦" : "可邀请"} />
            <span>先邀请好友，再共同预演。AI 不会单方面分析好友。</span>
          </div>
          <blockquote>{simulation.possibleFirstLine}</blockquote>
        </section>

        {isAccepted ? (
          <section className="friend-map-handoff" aria-label="共同梦境地图入口">
            <DoorOpen size={18} />
            <div>
              <strong>下一步进入同一张梦境地图。</strong>
              <p>你们会在梦境地图中共同选择海底、星空、日料、电影等场景，再查看 AI 关系预演。</p>
            </div>
            <PrimaryButton icon={<Compass size={17} />} onClick={onOpenDreamMap}>
              进入梦境地图
            </PrimaryButton>
          </section>
        ) : null}
      </div>

      <div className="bottom-action">
        <PrimaryButton
          disabled={!canInvite || isSent || isAccepted}
          icon={<Send size={18} />}
          onClick={() => {
            if (!selectedFriend) return;
            onInvite(selectedFriend.id);
          }}
        >
          {isSent ? "已发送，等待好友" : isAccepted ? "好友已入梦" : "邀请好友入梦"}
        </PrimaryButton>
      </div>
    </section>
  );
}
