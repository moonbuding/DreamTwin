import { Check, Info } from "lucide-react";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";
import { DreamStarMap } from "../components/DreamStarMap";
import { PrimaryButton } from "../components/PrimaryButton";

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
  onOpenFriendScene,
  onSelectRoamingScene,
  onSelectNode,
}: DreamLogPageProps) {
  const overnightNodes = nodes.filter((node) => node.entryMode === "overnight_discovery");
  const friendNode = nodes.find((node) => node.entryMode === "friend_invite");
  const friendSimulation = simulations.find((simulation) => simulation.entryMode === "friend_invite");
  const friendRoamingScenes = friendSimulation?.roamingScenes ?? [];
  const hasFriendMapEntry = Boolean(
    friendNode && (friendNode.status === "both_entered" || friendNode.status === "opened" || friendNode.status === "in_chat"),
  );
  const mapNodes = hasFriendMapEntry && friendNode ? [...overnightNodes, friendNode] : overnightNodes;
  const activeSharedScene =
    friendRoamingScenes.find((scene) => scene.id === selectedRoamingSceneId) ?? friendRoamingScenes[0];
  const showSharedScenePicker = Boolean(friendNode?.status === "both_entered" && friendRoamingScenes.length > 0);

  const selectMapNode = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId);
    if (node?.entryMode === "friend_invite" && node.status === "both_entered" && activeSharedScene) {
      onOpenFriendScene(activeSharedScene.id, nodeId);
      return;
    }
    onSelectNode(nodeId);
  };

  return (
    <section className="page page-scroll dt-page dt-light dream-log-page">
      <div className="page-content dt-content dream-log-content">
        <header className="dt-head">
          <div className="dt-head-left" />
          <span className="dt-head-title">梦境广场</span>
          <div className="dt-head-right">
            <button className="dt-chip-btn" type="button">
              <Info size={15} />
              说明
            </button>
          </div>
        </header>

        <div className="dt-plaza-intro">
          <h2>AI 为你预演的关系入口</h2>
          <p>基于你的分身画像生成</p>
        </div>

        <div className="dt-starfield dt-zone-dark">
          <DreamStarMap nodes={mapNodes} onSelectNode={selectMapNode} />
        </div>

        {showSharedScenePicker && friendNode ? (
          <section className="dt-shared-picker" aria-label="共同选择梦境场景">
            <p className="dt-col-title">共同选择梦境场景</p>
            <div className="dt-scene-grid">
              {friendRoamingScenes.map((scene) => {
                const selected = scene.id === activeSharedScene?.id;

                return (
                  <button
                    className={selected ? "dt-scene-tile is-selected" : "dt-scene-tile"}
                    key={scene.id}
                    onClick={() => onSelectRoamingScene(scene.id)}
                    type="button"
                  >
                    {selected ? (
                      <span className="dt-scene-check">
                        <Check size={13} />
                      </span>
                    ) : null}
                    <span>{scene.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="dt-status-line">你和好友在同一张梦境地图，确认共同坐标后查看关系预演。</p>
            <PrimaryButton
              onClick={() => activeSharedScene && onOpenFriendScene(activeSharedScene.id, friendNode.id)}
            >
              进入这个场景预演
            </PrimaryButton>
          </section>
        ) : null}
      </div>
    </section>
  );
}
