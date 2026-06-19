import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";
import { DreamStarMap } from "../components/DreamStarMap";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import { PrimaryButton } from "../components/PrimaryButton";
import { ArrowRight, Send } from "lucide-react";
import { StatusPill } from "../components/StatusPill";

interface DreamLogPageProps {
  nodes: DreamNode[];
  simulations: RelationshipSimulation[];
  selectedRoamingSceneId: string | null;
  onOpenFriendInvite: () => void;
  onOpenFriendScene: (sceneId: string, nodeId: string) => void;
  onSelectRoamingScene: (sceneId: string) => void;
  onSelectNode: (nodeId: string) => void;
}

export function DreamLogPage({
  nodes,
  simulations,
  selectedRoamingSceneId,
  onOpenFriendInvite,
  onOpenFriendScene,
  onSelectRoamingScene,
  onSelectNode,
}: DreamLogPageProps) {
  const overnightNodes = nodes.filter((node) => node.entryMode === "overnight_discovery");
  const friendNode = nodes.find((node) => node.entryMode === "friend_invite");
  const friendSimulation = simulations.find((simulation) => simulation.entryMode === "friend_invite");
  const friendRoamingScenes = friendSimulation?.roamingScenes ?? [];
  const friendCounterpartName = friendSimulation?.counterpartName ?? "好友";
  const viewedCount = overnightNodes.filter((node) => node.status !== "unviewed").length;
  const waitingCount = overnightNodes.filter((node) => node.status === "waiting").length;
  const openedCount = overnightNodes.filter((node) => node.status === "opened" || node.status === "in_chat").length;
  const waitingTotalCount = nodes.filter((node) => node.status === "waiting").length;
  const gateTotalCount = nodes.filter((node) => node.status === "opened" || node.status === "in_chat").length;
  const hasFriendMapEntry = Boolean(
    friendNode && (friendNode.status === "both_entered" || friendNode.status === "opened" || friendNode.status === "in_chat"),
  );
  const friendMapCount = hasFriendMapEntry ? 1 : 0;
  const friendStateText =
    friendNode?.status === "in_chat"
      ? "等待真人回应"
      : friendNode?.status === "opened"
        ? "梦境门打开"
        : friendNode?.status === "both_entered"
          ? "好友已入梦"
          : friendNode?.status === "waiting"
            ? "邀请等待中"
            : "可邀请";
  const friendActionLabel =
    friendNode?.status === "both_entered"
      ? "共同选梦"
      : friendNode?.status === "opened"
        ? "查看梦境门"
        : friendNode?.status === "in_chat"
          ? "查看等待回应"
      : friendNode?.status === "waiting"
        ? "查看邀请"
        : "邀请好友";
  const mapNodes = hasFriendMapEntry && friendNode ? [...overnightNodes, friendNode] : overnightNodes;
  const recommendedMapNode =
    (hasFriendMapEntry && friendNode?.status === "both_entered" ? friendNode : null) ??
    mapNodes.find((node) => node.status === "unviewed") ??
    mapNodes.find((node) => node.status === "viewed") ??
    mapNodes[0];
  const recommendedSimulation = simulations.find((simulation) => simulation.id === recommendedMapNode?.simulationId);
  const routeTipLabel = hasFriendMapEntry ? "好友节点已点亮" : "推荐入口";
  const routeTipTitle = hasFriendMapEntry ? "点「和 Mika 的梦境漫游」" : "先点「雨夜便利店」";
  const mapCaption = hasFriendMapEntry
    ? "好友接受后也回到同一张地图。现在可以选择共同梦境节点，查看你们在这个场景里的关系预演。"
    : "点击任意节点，查看 AI 双人关系预演；好友节点也回到同一张地图。";
  const showSharedScenePicker = Boolean(friendNode?.status === "both_entered" && friendRoamingScenes.length > 0);
  const activeSharedScene =
    friendRoamingScenes.find((scene) => scene.id === selectedRoamingSceneId) ?? friendRoamingScenes[0];
  const openRecommendedMapNode = () => {
    if (recommendedMapNode?.status === "both_entered" && activeSharedScene) {
      onOpenFriendScene(activeSharedScene.id, recommendedMapNode.id);
      return;
    }
    if (recommendedMapNode) {
      onSelectNode(recommendedMapNode.id);
    }
  };
  const selectMapNode = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (node?.entryMode === "friend_invite" && node.status === "both_entered" && activeSharedScene) {
      onOpenFriendScene(activeSharedScene.id, nodeId);
      return;
    }
    onSelectNode(nodeId);
  };
  const openFriendMapAction = () => {
    if (!friendNode) {
      onOpenFriendInvite();
      return;
    }

    if (friendNode.status === "both_entered" && activeSharedScene) {
      onOpenFriendScene(activeSharedScene.id, friendNode.id);
      return;
    }

    if (friendNode.status === "opened" || friendNode.status === "in_chat") {
      onSelectNode(friendNode.id);
      return;
    }

    onOpenFriendInvite();
  };
  const mapControlItems = [
    {
      label: "新关系",
      value: overnightNodes.length,
      helper: "AI 已带回",
    },
    {
      label: "等待",
      value: waitingTotalCount,
      helper: waitingTotalCount ? "等确认" : "暂无",
    },
    {
      label: "好友",
      value: friendMapCount,
      helper: friendMapCount ? "已点亮" : "先邀请",
    },
    {
      label: "门",
      value: gateTotalCount,
      helper: gateTotalCount ? "去消息" : "未打开",
    },
  ];

  return (
    <section className="page page-scroll scene-page dream-log-page">
      <ThreeDreamScene variant="ambient" className="page-scene dream-log-scene" />
      <div className="page-content dream-log-content">
        <div className="dream-log-hero">
          <p className="label">梦境地图</p>
          <h1>新关系和好友入梦，都从这张地图开始。</h1>
          <div className="dream-log-stats" aria-label="梦境星图状态">
            <span>{viewedCount}/{overnightNodes.length} 已查看</span>
            <span>{waitingCount} 等待回应</span>
            <span>{openedCount} 门已打开</span>
          </div>
        </div>
        <section className="dream-log-guidance" aria-label="统一梦境地图说明">
          <span>同一张地图，两种关系入口。</span>
          <p>AI 带回的新关系会先点亮；好友接受入梦后，也会回到这里共同选择场景。</p>
        </section>
        <div className="star-map-stage">
          {recommendedMapNode ? (
            <section className="map-stage-action" aria-label="当前地图行动">
              <div>
                <span>{hasFriendMapEntry && recommendedMapNode.entryMode === "friend_invite" ? "共同梦境已准备好" : "地图推荐入口"}</span>
                <strong>{recommendedMapNode.title}</strong>
                <p>{recommendedSimulation?.rehearsalOutcome ?? "先看 AI 关系结论，再决定要不要进入。"}</p>
              </div>
              <StatusPill entryMode={recommendedMapNode.entryMode} status={recommendedMapNode.status} />
              <PrimaryButton icon={<ArrowRight size={17} />} onClick={openRecommendedMapNode}>
                {recommendedMapNode.status === "both_entered" ? "进入选定场景" : "查看预演"}
              </PrimaryButton>
            </section>
          ) : null}
          <div className="star-map-mode-strip" aria-label="统一梦境地图模式">
            <span>新关系发现</span>
            <strong>同一张地图</strong>
            <span>好友共同入梦</span>
          </div>
          <div className="star-map-control-deck" aria-label="梦境地图关系状态">
            {mapControlItems.map((item) => (
              <span key={item.label}>
                <b>{item.value}</b>
                <small>{item.label}</small>
                <em>{item.helper}</em>
              </span>
            ))}
          </div>
          <div className="star-map-lanes" aria-hidden="true">
            <span>AI 已带回的关系入口</span>
            <span>好友接受后点亮</span>
          </div>
          <DreamStarMap nodes={mapNodes} onSelectNode={selectMapNode} />
          <div className="star-map-legend" aria-label="节点状态图例">
            <span>未查看</span>
            <span>已查看</span>
            <span>等待 / 已入梦</span>
            <span>门已打开</span>
          </div>
          <div className="star-map-route-tip" aria-label="推荐节点">
            <span>{routeTipLabel}</span>
            <strong>{routeTipTitle}</strong>
          </div>
          <div className="star-map-caption">
            <span>Dream Star Map</span>
            <p>{mapCaption} 梦境门打开后，聊天会进入消息区。</p>
          </div>
        </div>
        {showSharedScenePicker && friendNode ? (
          <section className="shared-map-scene-picker" aria-label="共同选择梦境场景">
            <div className="shared-map-scene-heading">
              <span>共同选择梦境场景</span>
              <strong>{activeSharedScene?.label ?? "选择一个场景"}</strong>
            </div>
            <div className="shared-map-presence" aria-label="共同入梦在场状态">
              <span>你已入梦</span>
              <strong>同一张梦境地图</strong>
              <span>{friendCounterpartName} 已入梦</span>
            </div>
            <div className="shared-map-current" aria-label="当前共同梦境坐标">
              <span>当前坐标</span>
              <strong>{activeSharedScene?.label ?? "未选择"}</strong>
              <p>{activeSharedScene?.premise ?? "选择一个共同梦境后，AI 会基于双方分身画像和场景事件生成关系预演。"}</p>
            </div>
            <div className="shared-map-scene-row">
              {friendRoamingScenes.map((scene) => (
                <button
                  aria-pressed={scene.id === activeSharedScene?.id}
                  className={scene.id === activeSharedScene?.id ? "shared-map-scene-active" : ""}
                  key={scene.id}
                  onClick={() => onSelectRoamingScene(scene.id)}
                  type="button"
                >
                  <span>{scene.label}</span>
                  <strong>{scene.verdict}</strong>
                </button>
              ))}
            </div>
            <p>这些是梦境地图里的共同坐标，不是好友页里的独立选项。双方入梦后，才会一起选择场景并进入关系预演。</p>
            <PrimaryButton icon={<ArrowRight size={17} />} onClick={() => onOpenFriendScene(activeSharedScene.id, friendNode.id)}>
              进入这个场景预演
            </PrimaryButton>
          </section>
        ) : null}
        <section className="dream-map-invite-strip" aria-label="好友共同入梦入口">
          <div>
            <span>好友共同入梦 · {friendStateText}</span>
            <strong>
              {hasFriendMapEntry
                ? "好友已回到同一张梦境地图，从这里继续共同选择。"
                : "先邀请好友，接受后同一张地图会点亮共同梦境。"}
            </strong>
          </div>
          <PrimaryButton icon={<Send size={16} />} onClick={openFriendMapAction}>
            {friendActionLabel}
          </PrimaryButton>
        </section>
      </div>
    </section>
  );
}
