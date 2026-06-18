import { ArrowLeft, Compass, RotateCcw, Sparkles } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusPill } from "../components/StatusPill";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { DreamNode, RelationshipSimulation } from "../types/dreamtwin";

interface WaitingPageProps {
  node: DreamNode;
  simulation: RelationshipSimulation;
  onBackToSimulation: (nodeId: string) => void;
  onConfirm: (nodeId: string) => void;
  onExplore: () => void;
  onWithdraw: (nodeId: string) => void;
}

export function WaitingPage({ node, simulation, onBackToSimulation, onConfirm, onExplore, onWithdraw }: WaitingPageProps) {
  return (
    <section className="page waiting-page scene-page">
      <ThreeDreamScene variant="ambient" className="page-scene waiting-scene" />
      <div className="page-content waiting-content">
        <p className="label">等待对方入梦</p>
        <h1>你已经把关系试探发给对方。</h1>
        <div className="waiting-orbit">
          <span />
          <span />
          <span />
        </div>
        <section className="waiting-copy">
          <StatusPill status={node.status} />
          <h2>{simulation.title}</h2>
          <p>{simulation.twinApproach}</p>
          <div className="waiting-signal-transfer" aria-label="入梦等待进度">
            <span>试探已送达</span>
            <span>对方分身解析中</span>
            <span>梦境门待确认</span>
          </div>
          <div className="waiting-state-grid">
            <span>你的分身已完成试探</span>
            <span>等待对方确认是否愿意继续</span>
            <span>{simulation.frictionSignal}</span>
          </div>
        </section>
      </div>
      <div className="bottom-action">
        <PrimaryButton icon={<Sparkles size={18} />} onClick={() => onConfirm(node.id)}>
          模拟对方同意入梦
        </PrimaryButton>
        <div className="action-row">
          <PrimaryButton variant="secondary" icon={<ArrowLeft size={17} />} onClick={() => onBackToSimulation(node.id)}>
            返回预演结果
          </PrimaryButton>
          <PrimaryButton variant="secondary" icon={<Compass size={17} />} onClick={onExplore}>
            回到星图
          </PrimaryButton>
        </div>
        <div className="single-action-row">
          <PrimaryButton variant="ghost" icon={<RotateCcw size={17} />} onClick={() => onWithdraw(node.id)}>
            撤回这次入梦
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
