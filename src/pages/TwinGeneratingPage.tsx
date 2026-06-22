import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  describeDreamTwinApiError,
  generateTwinSummary,
  isDreamTwinApiEnabled,
  type DreamTwinApiMode,
} from "../api/dreamTwinApi";
import { PrimaryButton } from "../components/PrimaryButton";
import { TwinProjection } from "../components/TwinProjection";
import type { TwinProjection as TwinProjectionModel, UserProfile } from "../types/dreamtwin";

const generationSteps = ["读取靠近方式", "生成抽象投影", "保存为长期分身", "带回关系动态"];

export function TwinGeneratingPage({
  profile,
  twin,
  onComplete,
}: {
  profile: UserProfile;
  twin: TwinProjectionModel;
  onComplete: (twin?: TwinProjectionModel) => void;
}) {
  const [step, setStep] = useState(0);
  const [liveTwin, setLiveTwin] = useState<TwinProjectionModel | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [apiMode, setApiMode] = useState<DreamTwinApiMode>("static");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStep((current) => Math.min(generationSteps.length - 1, current + 1));
    }, 620);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    setIsGenerating(true);
    setGenerationError(null);
    setApiMode("static");

    if (!isDreamTwinApiEnabled()) {
      setIsGenerating(false);
      return () => {
        isCurrent = false;
      };
    }

    generateTwinSummary(profile)
      .then((result) => {
        if (!isCurrent) return;
        setLiveTwin(result.twin);
        setApiMode("live");
      })
      .catch((error) => {
        if (!isCurrent) return;
        setGenerationError(describeDreamTwinApiError(error));
        setApiMode("fallback");
      })
      .finally(() => {
        if (!isCurrent) return;
        setIsGenerating(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [profile]);

  const isComplete = step === generationSteps.length - 1;
  const progress = ((step + 1) / generationSteps.length) * 100;
  const displayTwin = liveTwin ?? twin;
  const apiStatusLabel =
    apiMode === "live"
      ? "已生成分身摘要"
      : apiMode === "fallback"
        ? generationError
        : isGenerating
          ? "正在生成分身摘要"
          : "当前使用本地保底分身摘要";

  return (
    <section className="page page-scroll dt-page dt-light">
      <div className="page-content">
        <p className="label">首次生成</p>
        <h1>你的 DreamTwin 已保存。</h1>
        <TwinProjection twin={displayTwin} />
        <div className="generation-progress" aria-label="AI 分身生成进度">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className={`api-status api-status-${apiMode}`} role="status">
          <span>{apiMode === "live" ? "AI 生成" : apiMode === "fallback" ? "保底内容" : "本地内容"}</span>
          <p>{apiStatusLabel}</p>
        </div>
        <div className="signal-list">
          {generationSteps.map((item, index) => {
            const statusLabel = isComplete || index < step ? "已完成" : index === step ? "进行中" : "等待";
            return (
              <span className={index <= step ? "signal-active" : ""} key={item}>
                {statusLabel} · {item}
              </span>
            );
          })}
        </div>
      </div>
      <div className="bottom-action">
        <PrimaryButton disabled={!isComplete} icon={<ArrowRight size={18} />} onClick={() => onComplete(displayTwin)}>
          {isGenerating ? "先用当前分身进入今日" : "进入今日"}
        </PrimaryButton>
      </div>
    </section>
  );
}
