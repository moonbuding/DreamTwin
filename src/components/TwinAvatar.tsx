import type { CSSProperties } from "react";
import type { AvatarStyleSpec } from "../types/dreamtwin";
import twinAvatarImage from "../assets/twin-avatar.png";

interface TwinAvatarProps {
  className?: string;
  avatarStyleSpec?: AvatarStyleSpec;
}

const defaultColors = {
  aura: "#6fd3ff",
  secondary: "#a779ff",
  accent: "#ff72d2",
};

/**
 * Image-based AI 分身 avatar. Renders the rendered character art inside a lit
 * "stage" frame: a top key light, a personality-tinted rim glow on the figure,
 * a soft floor light pool, and a gentle float — a lightweight 3D 打光 effect
 * that replaces the previous procedural three.js silhouette.
 */
export function TwinAvatar({ className = "", avatarStyleSpec }: TwinAvatarProps) {
  const colors = {
    aura: avatarStyleSpec?.auraColor || defaultColors.aura,
    secondary: avatarStyleSpec?.secondaryColor || defaultColors.secondary,
    accent: avatarStyleSpec?.accentColor || defaultColors.accent,
  };

  const lightStyle = {
    "--twin-aura": colors.aura,
    "--twin-secondary": colors.secondary,
    "--twin-accent": colors.accent,
  } as CSSProperties;

  return (
    <div className={`twin-avatar ${className}`} style={lightStyle} aria-hidden="true">
      <span className="twin-avatar-keylight" />
      <span className="twin-avatar-glow" />
      <img className="twin-avatar-img" src={twinAvatarImage} alt="" draggable={false} />
      <span className="twin-avatar-floor" />
    </div>
  );
}
