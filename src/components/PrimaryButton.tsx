import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}

export function PrimaryButton({ children, icon, variant = "primary", className = "", ...props }: PrimaryButtonProps) {
  return (
    <button className={`primary-button primary-button-${variant} ${className}`.trim()} {...props}>
      <span>{children}</span>
      {icon ? <span className="button-icon">{icon}</span> : null}
    </button>
  );
}
