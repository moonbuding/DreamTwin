import type { ReactNode } from "react";
import { ChevronLeft, Compass, Home, MessageCircle, RotateCcw, UserRound, Users } from "lucide-react";

export type AppTab = "today" | "dream" | "messages" | "friends" | "twin";

interface AppShellProps {
  children: ReactNode;
  activeTab?: AppTab;
  canGoBack: boolean;
  showTabs?: boolean;
  progressLabel: string;
  progressValue: number;
  stepLabel: string;
  onBack: () => void;
  onNavigateTab?: (tab: AppTab) => void;
  onReset: () => void;
}

const tabItems: Array<{ id: AppTab; label: string; icon: ReactNode }> = [
  { id: "today", label: "今日", icon: <Home size={19} /> },
  { id: "dream", label: "梦境", icon: <Compass size={19} /> },
  { id: "messages", label: "消息", icon: <MessageCircle size={19} /> },
  { id: "friends", label: "好友", icon: <Users size={19} /> },
  { id: "twin", label: "分身", icon: <UserRound size={19} /> },
];

export function AppShell({
  children,
  activeTab,
  canGoBack,
  showTabs = false,
  progressLabel,
  progressValue,
  stepLabel,
  onBack,
  onNavigateTab,
  onReset,
}: AppShellProps) {
  return (
    <main className="app-stage">
      <div className={showTabs ? "phone-shell phone-shell-with-tabs" : "phone-shell"}>
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
          <button className="icon-button icon-button-reset" onClick={onReset} type="button" aria-label="重新开始体验">
            <RotateCcw size={17} />
            <span>重置体验</span>
          </button>
          <div className="demo-progress" aria-label="体验进度">
            <span>预演路径 · {stepLabel}</span>
            <strong>{progressLabel}</strong>
            <div className="demo-progress-track">
              <i style={{ width: `${progressValue}%` }} />
            </div>
          </div>
        </header>
        {children}
        {showTabs && onNavigateTab ? (
          <nav className="app-tabbar" aria-label="DreamTwin 主导航">
            {tabItems.map((item) => (
              <button
                aria-current={activeTab === item.id ? "page" : undefined}
                className={activeTab === item.id ? "app-tab app-tab-active" : "app-tab"}
                key={item.id}
                onClick={() => onNavigateTab(item.id)}
                type="button"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
