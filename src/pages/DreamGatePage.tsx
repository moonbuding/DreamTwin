import { ArrowLeft, Compass, MessageCircle } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";

interface DreamGatePageProps {
  node: DreamNode;
  simulation: RelationshipSimulation;
  onBackToSimulation: (nodeId: string) => void;
  onBackToLog: () => void;
  onOpenChat: (nodeId: string) => void;
}

export function DreamGatePage({ node, simulation, onBackToSimulation, onBackToLog, onOpenChat }: DreamGatePageProps) {
  return (
    <section className="page gate-page">
      <ThreeDreamScene variant="gate" className="gate-scene" />
      <div className="page-content page-content-bottom">
        <p className="label">梦境门打开</p>
        <h1>{simulation.counterpartName} 也选择进入。</h1>
        <div className="gate-status">
          <StatusPill status={node.status} />
          <span>{simulation.title}</span>
        </div>
        <p className="lead">双方分身都验证了继续意愿。预演结束，真实关系现在交还给你。</p>
        <div className="gate-confirmation" aria-label="双方确认状态">
          <span>你的分身已进入</span>
          <span>{simulation.counterpartName} 已回应</span>
        </div>
        <PrimaryButton icon={<MessageCircle size={18} />} onClick={() => onOpenChat(node.id)}>
          进入真实聊天入口
        </PrimaryButton>
        <div className="action-row">
          <PrimaryButton variant="secondary" icon={<ArrowLeft size={17} />} onClick={() => onBackToSimulation(node.id)}>
            回看预演结果
          </PrimaryButton>
          <PrimaryButton variant="ghost" icon={<Compass size={17} />} onClick={onBackToLog}>
            回到星图
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
