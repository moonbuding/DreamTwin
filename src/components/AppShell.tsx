import type { ReactNode } from "react";
import { ChevronLeft, RotateCcw } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
  canGoBack: boolean;
  progressLabel: string;
  progressValue: number;
  stepLabel: string;
  onBack: () => void;
  onReset: () => void;
}

export function AppShell({
  children,
  canGoBack,
  progressLabel,
  progressValue,
  stepLabel,
  onBack,
  onReset,
}: AppShellProps) {
  return (
    <main className="app-stage">
      <div className="phone-shell">
        <header className="app-topbar">
          <div className="topbar-left">
            {canGoBack ? (
              <button className="icon-button icon-button-back" onClick={onBack} type="button" aria-label="返回上一步">
                <ChevronLeft size={18} />
                <span>返回</span>
              </button>
            ) : null}
            <span className="brand-mark" />
            <span>DreamTwin</span>
          </div>
          <button className="icon-button icon-button-reset" onClick={onReset} type="button" aria-label="重新开始演示">
            <RotateCcw size={17} />
            <span>重置</span>
          </button>
          <div className="demo-progress" aria-label="演示进度">
            <span>{stepLabel}</span>
            <strong>{progressLabel}</strong>
            <div className="demo-progress-track">
              <i style={{ width: `${progressValue}%` }} />
            </div>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
