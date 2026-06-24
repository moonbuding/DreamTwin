import type { AvatarStyleSpec, TwinProjection as TwinProjectionModel } from "../types/dreamtwin";
import { TwinAvatar } from "./TwinAvatar";

function deriveAvatarStyle(twin: TwinProjectionModel): AvatarStyleSpec {
  return {
    silhouette: "full_body_luminous",
    posture: twin.keywords.some((keyword) => keyword.includes("直接") || keyword.includes("行动")) ? "open" : "reserved",
    material: twin.keywords.some((keyword) => keyword.includes("夜") || keyword.includes("直觉")) ? "star-thread" : "mist-light",
    auraColor: twin.colorPalette[0] || "#6fd3ff",
    secondaryColor: twin.colorPalette[1] || "#a779ff",
    accentColor: twin.colorPalette[2] || "#ff72d2",
    motionSignature: twin.lightShape === "pulse" ? "soft_pulse" : twin.lightShape === "mist" ? "spark_drift" : "slow_orbit",
    keywords: twin.keywords.slice(0, 4),
  };
}

export function TwinProjection({ twin, compact = false }: { twin: TwinProjectionModel; compact?: boolean }) {
  const avatarStyleSpec = twin.avatarStyleSpec || deriveAvatarStyle(twin);

  return (
    <section className={`twin-projection ${compact ? "twin-projection-compact" : "twin-projection-avatar"}`}>
      {!compact ? (
        <TwinAvatar className="twin-projection-scene" avatarStyleSpec={avatarStyleSpec} />
      ) : null}
      <div className="projection-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="projection-copy">
        <p className="label">{compact ? "AI 分身抽象投影" : "3D AI 分身人格投影"}</p>
        <h2>{twin.nickname}</h2>
        <p>{twin.summary}</p>
        {!compact ? (
          <>
            <div className="avatar-spec-row" aria-label="3D 分身展示规格">
              <span>{avatarStyleSpec.posture === "open" ? "开放姿态" : avatarStyleSpec.posture === "curious" ? "好奇姿态" : avatarStyleSpec.posture === "grounded" ? "稳定姿态" : "慢热姿态"}</span>
              <span>{avatarStyleSpec.material === "star-thread" ? "星线材质" : avatarStyleSpec.material === "glass-light" ? "玻璃光感" : "雾光材质"}</span>
              <span>{avatarStyleSpec.motionSignature === "spark_drift" ? "粒子漂移" : avatarStyleSpec.motionSignature === "soft_pulse" ? "轻脉冲" : "慢轨道"}</span>
            </div>
            <div className="avatar-map-row" aria-label="3D 分身人格映射">
              <span>人格映射</span>
              {avatarStyleSpec.keywords.slice(0, 4).map((keyword) => (
                <b key={keyword}>{keyword}</b>
              ))}
            </div>
          </>
        ) : null}
        {compact ? (
          <div className="keyword-row">
            {twin.keywords.map((keyword) => (
              <span key={keyword}>{keyword}</span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
