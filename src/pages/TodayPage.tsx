import { ArrowRight, Compass, DoorOpen, MessageCircle, Sparkles, Users } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamInviteStatus, DreamNode, FriendProfile, RelationshipSimulation, TwinProjection } from "../types/dreamtwin";
import { createRelationshipStates, relationshipStatusLabel } from "../utils/relationshipState";

interface TodayPageProps {
  dreamInviteStatus: DreamInviteStatus;
  friends: FriendProfile[];
  nodes: DreamNode[];
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
  simulations,
  twin,
  onContinueNode,
  onOpenDreamMap,
  onOpenFriends,
  onOpenMessages,
  onOpenTwin,
}: TodayPageProps) {
  const relationshipStates = createRelationshipStates(nodes, simulations);
  const waitingNodes = nodes.filter((node) => node.status === "waiting");
  const gateNodes = nodes.filter((node) => node.status === "opened");
  const chatNodes = nodes.filter((node) => node.status === "in_chat");
  const recommendedNode = nodes.find((node) => node.entryMode === "overnight_discovery" && node.status === "unviewed") ?? nodes[0];
  const recommendedSimulation = simulations.find((simulation) => simulation.id === recommendedNode?.simulationId) ?? simulations[0];
  const primaryFocus = gateNodes[0] ?? chatNodes[0] ?? waitingNodes[0] ?? recommendedNode;
  const primaryFocusState = relationshipStates.find((state) => state.nodeId === primaryFocus?.id);
  const selectedFriend = friends[0];
  const inviteText =
    dreamInviteStatus === "sent"
      ? "好友邀请等待中"
      : dreamInviteStatus === "accepted"
        ? "好友已入梦，去梦境地图选择场景"
        : "可以邀请好友一起入梦";

  return (
    <section className="page page-scroll scene-page today-page">
      <ThreeDreamScene variant="ambient" className="page-scene today-scene" />
      <div className="page-content today-content">
        <header className="today-hero">
          <p className="label">今日</p>
          <h1>今天先看关系动态。</h1>
          <p>
            {twin.nickname} 已保存。后续每天打开 App，会直接看到 AI 已预演、等待回应、梦境门和真实聊天。
          </p>
        </header>

        <section className="today-focus" aria-label="今日最重要关系状态">
          <div className="today-focus-copy">
            <span>{primaryFocusState ? relationshipStatusLabel(primaryFocusState.status) : "今日推荐"}</span>
            <strong>{primaryFocus ? primaryFocus.title : "梦境广场"}</strong>
            <p>
              {primaryFocus?.status === "waiting"
                ? "对方还没确认，真实聊天不会提前打开。"
                : primaryFocus?.status === "opened"
                  ? "双方都确认了，可以进入梦境门后的真实聊天。"
                  : primaryFocus?.status === "in_chat"
                    ? "这段关系已经进入真人聊天，可以继续回访。"
                    : recommendedSimulation?.rehearsalOutcome ?? "先从梦境地图里选择一段关系预演。"}
            </p>
          </div>
          {primaryFocus ? <StatusPill status={primaryFocus.status} /> : null}
          <PrimaryButton icon={<ArrowRight size={18} />} onClick={() => (primaryFocus ? onContinueNode(primaryFocus.id) : onOpenDreamMap())}>
            {primaryFocus?.status === "opened" || primaryFocus?.status === "in_chat" ? "继续这段关系" : "查看今日推荐"}
          </PrimaryButton>
        </section>

        <section className="relationship-state-strip" aria-label="关系状态概览">
          {relationshipStates.map((state) => (
            <button key={state.id} onClick={() => onContinueNode(state.nodeId)} type="button">
              <span>{relationshipStatusLabel(state.status)}</span>
              <strong>{state.label.split(" · ")[0]}</strong>
            </button>
          ))}
        </section>

        <section className="today-route-grid" aria-label="今日快捷入口">
          <button onClick={onOpenDreamMap} type="button">
            <Compass size={18} />
            <span>梦境地图</span>
            <strong>{nodes.filter((node) => node.entryMode === "overnight_discovery").length} 个 AI 预演入口</strong>
          </button>
          <button onClick={onOpenFriends} type="button">
            <Users size={18} />
            <span>好友入梦</span>
            <strong>{selectedFriend ? `${selectedFriend.name} · ${inviteText}` : inviteText}</strong>
          </button>
          <button onClick={onOpenMessages} type="button">
            <MessageCircle size={18} />
            <span>消息</span>
            <strong>{gateNodes.length + chatNodes.length > 0 ? "梦境门后的真人聊天" : "暂无开放私信"}</strong>
          </button>
          <button onClick={onOpenTwin} type="button">
            <Sparkles size={18} />
            <span>分身</span>
            <strong>管理人格画像，不做陪伴养成</strong>
          </button>
        </section>

        <section className="today-boundary" aria-label="产品边界">
          <DoorOpen size={16} />
          <p>消息只在梦境门打开后出现。AI 负责预演和建议，真实互动始终由你亲自开始。</p>
        </section>
      </div>
    </section>
  );
}
