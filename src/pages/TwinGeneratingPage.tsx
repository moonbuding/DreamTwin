import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { TwinProjection } from "../components/TwinProjection";
import type { TwinProjection as TwinProjectionModel } from "../types/dreamtwin";

const generationSteps = ["读取靠近方式", "生成抽象投影", "投放梦境节点", "带回关系预演"];

export function TwinGeneratingPage({ twin, onComplete }: { twin: TwinProjectionModel; onComplete: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(generationSteps.length - 1, current + 1));
    }, 620);
    return () => window.clearInterval(timer);
  }, []);

  const isComplete = step === generationSteps.length - 1;
  const progress = ((step + 1) / generationSteps.length) * 100;

  return (
    <section className="page page-scroll">
      <div className="page-content">
        <p className="label">Step 02</p>
        <h1>分身已经醒来。</h1>
        <TwinProjection twin={twin} />
        <div className="generation-progress" aria-label="AI 分身生成进度">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="signal-list">
          {generationSteps.map((item, index) => (
            <span className={index <= step ? "signal-active" : ""} key={item}>
              {index < step ? "已完成" : index === step ? "进行中" : "等待"} · {item}
            </span>
          ))}
        </div>
      </div>
      <div className="bottom-action">
        <PrimaryButton disabled={!isComplete} icon={<ArrowRight size={18} />} onClick={onComplete}>
          查看昨夜梦境日志
        </PrimaryButton>
      </div>
    </section>
  );
}
