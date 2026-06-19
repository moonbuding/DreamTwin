import { Component, lazy, Suspense, type ReactNode } from "react";
import type { AvatarStyleSpec } from "../types/dreamtwin";

export type SceneVariant =
  | "ambient"
  | "star-map"
  | "gate"
  | "projection"
  | "avatar"
  | "stage-rain"
  | "stage-ocean"
  | "stage-space"
  | "stage-social"
  | "stage-motion";

export interface ThreeDreamSceneProps {
  variant: SceneVariant;
  className?: string;
  avatarStyleSpec?: AvatarStyleSpec;
}

const ThreeDreamSceneRenderer = lazy(() =>
  import("./ThreeDreamSceneRenderer").then((module) => ({ default: module.ThreeDreamSceneRenderer })),
);

class ThreeSceneErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export function ThreeDreamScene({ variant, className = "", avatarStyleSpec }: ThreeDreamSceneProps) {
  const fallback = (
    <div className={`three-scene three-scene-fallback three-scene-fallback-${variant} ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
  );

  const boundaryKey = [
    variant,
    avatarStyleSpec?.auraColor,
    avatarStyleSpec?.secondaryColor,
    avatarStyleSpec?.accentColor,
    avatarStyleSpec?.posture,
  ]
    .filter(Boolean)
    .join("-");

  return (
    <ThreeSceneErrorBoundary key={boundaryKey} fallback={fallback}>
      <Suspense fallback={fallback}>
        <ThreeDreamSceneRenderer variant={variant} className={className} avatarStyleSpec={avatarStyleSpec} />
      </Suspense>
    </ThreeSceneErrorBoundary>
  );
}
