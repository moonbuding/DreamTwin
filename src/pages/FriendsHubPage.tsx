import { useState } from "react";
import { ChevronLeft, Plus } from "lucide-react";
import type { DreamInviteStatus, DreamNode, FriendProfile, RelationshipSimulation } from "../types/dreamtwin";
import { FriendInvitePage } from "./FriendInvitePage";
import { MessagesPage } from "./MessagesPage";

type SubTab = "contacts" | "chat";

interface FriendsHubPageProps {
  initialSubTab: SubTab;
  friends: FriendProfile[];
  inviteStatus: DreamInviteStatus;
  node: DreamNode;
  selectedFriendId: string | null;
  nodes: DreamNode[];
  sentFirstMessages?: Record<string, string>;
  simulations: RelationshipSimulation[];
  onInvite: (friendId: string) => void;
  onOpenChat: (nodeId: string) => void;
  onOpenDreamMap: () => void;
  onOpenWaiting: (nodeId: string) => void;
  onSelectFriend: (friendId: string) => void;
  onReviewNode: (nodeId: string) => void;
  onBack: () => void;
}

export function FriendsHubPage({
  initialSubTab,
  friends,
  inviteStatus,
  node,
  selectedFriendId,
  nodes,
  sentFirstMessages,
  simulations,
  onInvite,
  onOpenChat,
  onOpenDreamMap,
  onOpenWaiting,
  onSelectFriend,
  onReviewNode,
  onBack,
}: FriendsHubPageProps) {
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab);

  return (
    <section className="page page-scroll dt-page dt-light friends-hub-page">
      <div className="page-content dt-content friends-hub-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <button className="dt-icon-btn" onClick={onBack} type="button" aria-label="返回">
              <ChevronLeft size={18} />
            </button>
          </div>
          <span className="dt-head-title">好友</span>
          <div className="dt-head-right">
            <button className="dt-icon-btn" type="button" aria-label="添加">
              <Plus size={18} />
            </button>
          </div>
        </header>

        <div className="dt-subtabs">
          <button
            className={subTab === "contacts" ? "dt-subtab dt-subtab-active" : "dt-subtab"}
            onClick={() => setSubTab("contacts")}
            type="button"
          >
            通讯录
          </button>
          <button
            className={subTab === "chat" ? "dt-subtab dt-subtab-active" : "dt-subtab"}
            onClick={() => setSubTab("chat")}
            type="button"
          >
            聊天
          </button>
        </div>

        {subTab === "contacts" ? (
          <FriendInvitePage
            friends={friends}
            inviteStatus={inviteStatus}
            node={node}
            selectedFriendId={selectedFriendId}
            onInvite={onInvite}
            onOpenDreamMap={onOpenDreamMap}
            onOpenWaiting={onOpenWaiting}
            onSelectFriend={onSelectFriend}
          />
        ) : (
          <MessagesPage
            nodes={nodes}
            sentFirstMessages={sentFirstMessages}
            simulations={simulations}
            onOpenChat={onOpenChat}
            onOpenDreamMap={onOpenDreamMap}
            onReviewNode={onReviewNode}
          />
        )}
      </div>
    </section>
  );
}
