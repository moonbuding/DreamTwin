import { ArrowRight, Sparkles } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { ThreeDreamScene } from "../components/ThreeDreamScene";

export function WelcomePage({ onStart }: { onStart: () => void }) {
  return (
    <section className="page welcome-page">
      <ThreeDreamScene variant="ambient" className="hero-scene" />
      <div className="page-content page-content-bottom">
        <p className="label">AI 双人关系预演社交</p>
        <h1>先梦见一种可能，再决定是否亲自进入。</h1>
        <p className="lead">
          DreamTwin 会先模拟你和对方如果相遇、聊天、靠近或产生误解，关系可能怎样发展。你选择想进入的那一个，只有双方都愿意，梦境门才会打开。
        </p>
        <PrimaryButton icon={<ArrowRight size={18} />} onClick={onStart}>
          首次创建我的 AI 分身
        </PrimaryButton>
        <div className="quiet-proof">
          <Sparkles size={16} />
          <span>不是 AI 陪聊，也不是滑卡匹配。</span>
        </div>
      </div>
    </section>
  );
}
