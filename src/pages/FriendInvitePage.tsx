import { Bell, Compass, Send, ShieldCheck, Users } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamInviteStatus, DreamNode, FriendProfile } from "../types/dreamtwin";

interface FriendInvitePageProps {
  friends: FriendProfile[];
  inviteStatus: DreamInviteStatus;
  node: DreamNode;
  selectedFriendId: string | null;
  onInvite: (friendId: string) => void;
  onOpenDreamMap: () => void;
  onOpenWaiting: (nodeId: string) => void;
  onSelectFriend: (friendId: string) => void;
}

export function FriendInvitePage({
  friends,
  inviteStatus,
  node,
  selectedFriendId,
  onInvite,
  onOpenDreamMap,
  onOpenWaiting,
  onSelectFriend,
}: FriendInvitePageProps) {
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? friends[0];
  const inviteCopy =
    inviteStatus === "withdrawn"
      ? "上一次邀请已撤回，可以换一个梦境重新发起。"
      : inviteStatus === "sent"
        ? "邀请已发出。好友接受前，这里只保留等待状态。"
        : inviteStatus === "accepted"
          ? "好友已经入梦。下一步回到梦境地图，在同一张地图里共同选择场景。"
          : "好友接受后，你们会进入同一张梦境地图，再一起选择场景和查看关系预演。";

  const canInvite = Boolean(selectedFriend);
  const isAccepted = inviteStatus === "accepted" || node.status === "both_entered" || node.status === "opened" || node.status === "in_chat";
  const isSent = inviteStatus === "sent" || node.status === "waiting";
  const statusCopy = isAccepted ? "双方已入梦" : isSent ? "邀请已发出" : "等待发起";
  const heroTitle = isAccepted ? "好友已入梦，回地图一起选梦。" : isSent ? "给好友一点确认时间。" : "先邀请，不先分析。";
  const heroCopy = isAccepted
    ? "你们已经进入同一张梦境地图入口，下一步共同选择想经历的场景。"
    : isSent
      ? "好友接受前，DreamTwin 不会生成共同预演，也不会打开聊天。"
      : "先发出一个低压入梦邀请。对方接受后，你们才会进入同一张梦境地图。";
  const trustTitle = isAccepted ? "共同入梦后，仍由你们选择下一步。" : "好友接受前，只保存邀请状态。";
  const trustCopy = isAccepted
    ? "AI 只帮你们预演共同场景，不替任何一方表达关系意图，真实聊天仍要等梦境门打开。"
    : "不单方面分析好友、不读取通讯录、不替你发送关系表达。接受后再共同选择梦境场景。";
  const nextStepLabel = isAccepted ? "地图选梦" : isSent ? "等待回应" : "发起邀请";
  const inviteBoundaryText = isSent
    ? "这次邀请只停在等待状态。好友接受前，不会生成共同预演，也不会出现第一句话建议。"
    : "邀请内容只说明“一起入梦”。关系结论、第一句话和共同预演，都要等对方接受后才出现。";

  return (
    <section className="page page-scroll scene-page friend-invite-page">
      <ThreeDreamScene variant="ambient" className="page-scene friend-invite-scene" />
      <div className="page-content friend-invite-content">
        <div className="friend-invite-hero">
          <p className="label">好友</p>
          <h1>{heroTitle}</h1>
          <p>{heroCopy}</p>
        </div>

        <section className="friend-map-rule" aria-label="好友共同入梦规则">
          <span>好友页只负责邀请</span>
          <strong>接受后，场景选择回到梦境地图。</strong>
          <p>这样你不是单方面分析好友，而是先征得对方进入同一个关系实验场。</p>
        </section>

        <section className="friend-relationship-snapshot" aria-label="好友关系状态">
          <div>
            <span>当前好友</span>
            <strong>{selectedFriend?.name ?? "未选择"}</strong>
          </div>
          <div>
            <span>关系状态</span>
            <strong>{statusCopy}</strong>
          </div>
          <div>
            <span>下一步</span>
            <strong>{nextStepLabel}</strong>
          </div>
        </section>

        <section className="friend-entry-console" aria-label="好友入梦邀请入口">
          <div className="friend-entry-main">
            <span>
              <Users size={15} />
              一起入梦邀请
            </span>
            <strong>{selectedFriend?.name ?? "选择好友"}</strong>
            <p>
              {isAccepted
                ? "好友已接受。现在回到统一梦境地图，在同一张地图里一起选择共同经历。"
                : isSent
                  ? "邀请已发出。等待好友确认前，不会进入共同预演，也不会打开聊天。"
                  : "选择一个好友并发起入梦邀请。对方接受后，才会进入同一张梦境地图。"}
            </p>
          </div>
          <StatusPill status={node.status} label={statusCopy} />
          <PrimaryButton
            disabled={!canInvite && !isAccepted && !isSent}
            icon={isAccepted ? <Compass size={17} /> : isSent ? <Bell size={17} /> : <Send size={17} />}
            onClick={() => {
              if (isAccepted) {
                onOpenDreamMap();
                return;
              }

              if (isSent) {
                onOpenWaiting(node.id);
                return;
              }

              if (selectedFriend) {
                onInvite(selectedFriend.id);
              }
            }}
          >
            {isAccepted ? "进入梦境地图" : isSent ? "查看等待状态" : "邀请好友入梦"}
          </PrimaryButton>
          <div className="friend-flow-steps" aria-label="好友入梦流程">
            <span>邀请</span>
            <span>好友接受</span>
            <span>地图选梦</span>
          </div>
        </section>

        <section className="friend-trust-strip" aria-label="好友邀请边界">
          <ShieldCheck size={17} />
          <div>
            <strong>{trustTitle}</strong>
            <p>{trustCopy}</p>
          </div>
        </section>

        <section className="friend-picker" aria-label="好友关系列表">
          <div className="section-heading-inline">
            <span>好友关系</span>
            <strong>先邀请，再共同预演</strong>
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

        {!isAccepted ? (
          <section className="invite-preview" aria-label="邀请状态">
            <div>
              <Compass size={16} />
              <span>{isSent ? "邀请状态" : "邀请预览"}</span>
            </div>
            <strong>{isSent ? `等待 ${selectedFriend?.name ?? "好友"} 入梦` : `邀请 ${selectedFriend?.name ?? "好友"} 一起进入梦境地图`}</strong>
            <p>{inviteCopy}</p>
            <div className="friend-invite-state">
              <StatusPill status={node.status} label={isSent ? "等待好友入梦" : "可邀请"} />
              <span>只有好友接受后，才会进入共同预演。</span>
            </div>
            <blockquote>{inviteBoundaryText}</blockquote>
          </section>
        ) : null}

      </div>

      <div className="bottom-action">
        {isAccepted ? (
          <PrimaryButton icon={<Compass size={18} />} onClick={onOpenDreamMap}>
            进入统一梦境地图
          </PrimaryButton>
        ) : isSent ? (
          <PrimaryButton icon={<Bell size={18} />} onClick={() => onOpenWaiting(node.id)}>
            查看等待好友入梦
          </PrimaryButton>
        ) : (
          <PrimaryButton
            disabled={!canInvite}
            icon={<Send size={18} />}
            onClick={() => {
              if (!selectedFriend) return;
              onInvite(selectedFriend.id);
            }}
          >
            邀请好友入梦
          </PrimaryButton>
        )}
      </div>
    </section>
  );
}
