import { Bell, Send } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
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

// Contacts sub-tab of the 好友 hub: consent-first invite only — no scene cards
// or simulation output before the friend accepts (scene selection lives on the dream map).
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
  const isAccepted = inviteStatus === "accepted" || node.status === "both_entered" || node.status === "opened" || node.status === "in_chat";
  const isSent = inviteStatus === "sent" || node.status === "waiting";
  const statusLine = isAccepted ? "好友已入梦 · 去地图共同选梦" : isSent ? "等待好友入梦" : "选择好友后发起邀请";

  const primaryAction = () => {
    if (isAccepted) return onOpenDreamMap();
    if (isSent) return onOpenWaiting(node.id);
    if (selectedFriend) onInvite(selectedFriend.id);
  };

  return (
    <div className="dt-contacts-pane">
      <div className="dt-panel">
        <span className="dt-panel-title">先邀请，不先分析</span>
        <p>不单方面分析好友、不读取通讯录，也不替你表达关系意图。好友接受后，你们才会进入同一张梦境地图，在地图上共同选择场景。</p>
      </div>

      <div className="dt-friend-list">
        {friends.map((friend) => {
          const selected = friend.id === selectedFriend?.id;

          return (
            <button
              className={selected ? "dt-friend-item is-selected" : "dt-friend-item"}
              key={friend.id}
              onClick={() => onSelectFriend(friend.id)}
              type="button"
            >
              <span className="dt-ava">{friend.name.slice(0, 1)}</span>
              <span className="dt-friend-meta">
                <strong>{friend.name}</strong>
                <span>{friend.presence}</span>
              </span>
              <span className="dt-friend-invite">{selected ? "已选" : "邀请"}</span>
            </button>
          );
        })}
      </div>

      <div className="dt-select-bar">
        <strong>已选：{selectedFriend?.name ?? "好友"}</strong>
        <p>AI 只提供关系预演，不会替你表达或发送任何信息</p>
        <PrimaryButton icon={isSent ? <Bell size={17} /> : <Send size={17} />} onClick={primaryAction}>
          {isAccepted ? "进入梦境地图" : isSent ? "查看等待状态" : "邀请好友入梦"}
        </PrimaryButton>
        <span className="dt-status-line">状态：{statusLine}</span>
      </div>
    </div>
  );
}
