import type { TwinProjection as TwinProjectionModel } from "../types/dreamtwin";

export function TwinProjection({ twin, compact = false }: { twin: TwinProjectionModel; compact?: boolean }) {
  return (
    <section className={`twin-projection ${compact ? "twin-projection-compact" : ""}`}>
      <div className="projection-orbit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="projection-copy">
        <p className="label">AI 分身抽象投影</p>
        <h2>{twin.nickname}</h2>
        <p>{twin.summary}</p>
        <div className="keyword-row">
          {twin.keywords.map((keyword) => (
            <span key={keyword}>{keyword}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
