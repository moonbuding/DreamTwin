import { lazy, Suspense } from "react";

export type SceneVariant = "ambient" | "star-map" | "gate";

export interface ThreeDreamSceneProps {
  variant: SceneVariant;
  className?: string;
}

const ThreeDreamSceneRenderer = lazy(() =>
  import("./ThreeDreamSceneRenderer").then((module) => ({ default: module.ThreeDreamSceneRenderer })),
);

export function ThreeDreamScene({ variant, className = "" }: ThreeDreamSceneProps) {
  const fallback = (
    <div className={`three-scene three-scene-fallback three-scene-fallback-${variant} ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );

  return (
    <Suspense fallback={fallback}>
      <ThreeDreamSceneRenderer variant={variant} className={className} />
    </Suspense>
  );
}
