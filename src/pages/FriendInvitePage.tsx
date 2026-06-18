import { Compass, Send, Users } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamInviteStatus, FriendProfile, RelationshipSimulation } from "../types/dreamtwin";

interface FriendInvitePageProps {
  friends: FriendProfile[];
  inviteStatus: DreamInviteStatus;
  selectedFriendId: string | null;
  selectedSceneId: string | null;
  simulation: RelationshipSimulation;
  onInvite: (friendId: string, sceneId: string) => void;
  onSelectFriend: (friendId: string) => void;
  onSelectScene: (sceneId: string) => void;
}

export function FriendInvitePage({
  friends,
  inviteStatus,
  selectedFriendId,
  selectedSceneId,
  simulation,
  onInvite,
  onSelectFriend,
  onSelectScene,
}: FriendInvitePageProps) {
  const selectedFriend = friends.find((friend) => friend.id === selectedFriendId) ?? friends[0];
  const scenes = simulation.roamingScenes ?? [];
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];
  const inviteCopy =
    inviteStatus === "withdrawn"
      ? "上一次邀请已撤回，可以换一个梦境重新发起。"
      : "好友接受后，你们才会一起看到 AI 梦境漫游预演。";

  const canInvite = Boolean(selectedFriend && selectedScene);

  return (
    <section className="page page-scroll scene-page friend-invite-page">
      <ThreeDreamScene variant="ambient" className="page-scene friend-invite-scene" />
      <div className="page-content friend-invite-content">
        <div className="friend-invite-hero">
          <p className="label">邀请好友梦境漫游</p>
          <h1>先邀请，再一起看关系会怎么变化。</h1>
          <p>
            这不是偷偷分析好友，也不是 AI 替你表白。你只发出一次低压邀请，好友同意入梦后，双方一起进入关系实验场。
          </p>
        </div>

        <section className="friend-picker" aria-label="选择好友">
          <div className="section-heading-inline">
            <span>选择好友</span>
            <strong>Demo 使用静态好友</strong>
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

        <section className="roaming-scene-picker" aria-label="选择梦境漫游场景">
          <div className="section-heading-inline">
            <span>选择梦境场景</span>
            <strong>让共同经历驱动关系预演</strong>
          </div>
          <div className="roaming-scene-grid" role="list">
            {scenes.map((scene) => (
              <button
                aria-pressed={scene.id === selectedScene?.id}
                className={scene.id === selectedScene?.id ? "roaming-scene-card roaming-scene-active" : "roaming-scene-card"}
                key={scene.id}
                onClick={() => onSelectScene(scene.id)}
                type="button"
              >
                <span>{scene.label}</span>
                <strong>{scene.verdict}</strong>
                <p>{scene.premise}</p>
              </button>
            ))}
          </div>
        </section>

        {selectedScene ? (
          <section className="invite-preview" aria-label="邀请预览">
            <div>
              <Compass size={16} />
              <span>邀请预览</span>
            </div>
            <strong>
              邀请 {selectedFriend?.name ?? "好友"} 一起进入「{selectedScene.label}」
            </strong>
            <p>{inviteCopy}</p>
            <blockquote>{selectedScene.suggestedMove}</blockquote>
          </section>
        ) : null}
      </div>

      <div className="bottom-action">
        <PrimaryButton
          disabled={!canInvite}
          icon={<Send size={18} />}
          onClick={() => {
            if (!selectedFriend || !selectedScene) return;
            onInvite(selectedFriend.id, selectedScene.id);
          }}
        >
          邀请好友入梦
        </PrimaryButton>
      </div>
    </section>
  );
}
