import { useEffect, useRef, useState } from "react";
import { ChevronLeft, LogOut, MoonStar, Pencil, Settings, Sun } from "lucide-react";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { AvatarStyleSpec, DreamNode, ThemeMode, TwinProjection as TwinProjectionModel, UserProfile } from "../types/dreamtwin";

type MeTab = "personal" | "twin";

interface TwinHomePageProps {
  profile: UserProfile;
  twin: TwinProjectionModel;
  nodes: DreamNode[];
  themeMode: ThemeMode;
  onSetTheme: (mode: ThemeMode) => void;
  onSaveProfile: (profile: UserProfile) => void;
  onSaveTwin: (twin: TwinProjectionModel) => void;
  onLogout: () => void;
  onBack: () => void;
}

function resolveAvatarStyle(twin: TwinProjectionModel): AvatarStyleSpec {
  if (twin.avatarStyleSpec) return twin.avatarStyleSpec;
  return {
    silhouette: "full_body_luminous",
    posture: "reserved",
    material: "mist-light",
    auraColor: twin.colorPalette[0] || "#6fd3ff",
    secondaryColor: twin.colorPalette[1] || "#a779ff",
    accentColor: twin.colorPalette[2] || "#ff72d2",
    motionSignature: "slow_orbit",
    keywords: twin.keywords.slice(0, 4),
  };
}

const splitList = (value: string): string[] => value.split(/[、,，\n]/).map((item) => item.trim()).filter(Boolean);
const joinList = (items: string[]): string => items.join("、");

export function TwinHomePage({ profile, twin, themeMode, onSetTheme, onSaveProfile, onSaveTwin, onLogout, onBack }: TwinHomePageProps) {
  const [tab, setTab] = useState<MeTab>("personal");
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    nickname: "",
    keywords: "",
    communication: "",
    values: "",
    interests: "",
    twinNickname: "",
    twinKeywords: "",
    twinSummary: "",
  });

  const personalityKeywords = profile.personalityKeywords.length ? profile.personalityKeywords : twin.keywords;
  const valuesText = profile.values?.join("、") || twin.summary;
  const communicationText = profile.communicationStyle || "用温和、真实的方式靠近一段关系。";

  // Close the settings popover when clicking outside of it.
  useEffect(() => {
    if (!settingsOpen) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [settingsOpen]);

  const switchTab = (next: MeTab) => {
    setEditing(false);
    setTab(next);
  };

  const setField = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const startEditPersonal = () => {
    setForm((current) => ({
      ...current,
      nickname: profile.nickname,
      keywords: joinList(personalityKeywords),
      communication: profile.communicationStyle ?? "",
      values: joinList(profile.values ?? []),
      interests: joinList(profile.interests),
    }));
    setEditing(true);
  };

  const savePersonal = () => {
    onSaveProfile({
      ...profile,
      nickname: form.nickname.trim() || profile.nickname,
      personalityKeywords: splitList(form.keywords),
      communicationStyle: form.communication.trim() || undefined,
      values: splitList(form.values),
      interests: splitList(form.interests),
    });
    setEditing(false);
  };

  const startEditTwin = () => {
    setForm((current) => ({
      ...current,
      twinNickname: twin.nickname,
      twinKeywords: joinList(twin.keywords),
      twinSummary: twin.summary,
    }));
    setEditing(true);
  };

  const saveTwinEdits = () => {
    onSaveTwin({
      ...twin,
      nickname: form.twinNickname.trim() || twin.nickname,
      keywords: splitList(form.twinKeywords),
      summary: form.twinSummary.trim() || twin.summary,
    });
    setEditing(false);
  };

  return (
    <section className="page page-scroll dt-page twin-home-page">
      <div className="page-content dt-content twin-home-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <button className="dt-icon-btn" onClick={onBack} type="button" aria-label="返回">
              <ChevronLeft size={18} />
            </button>
          </div>
          <span className="dt-head-title">我的</span>
          <div className="dt-head-right">
            <div className="dt-settings" ref={settingsRef}>
              <button
                className="dt-icon-btn"
                onClick={() => setSettingsOpen((open) => !open)}
                type="button"
                aria-label="设置"
                aria-haspopup="true"
                aria-expanded={settingsOpen}
              >
                <Settings size={18} />
              </button>
              {settingsOpen ? (
                <div className="dt-settings-menu" role="menu">
                  <div className="dt-settings-block">
                    <span className="dt-settings-label">界面模式</span>
                    <div className="dt-theme-toggle" role="group" aria-label="白天与黑夜模式">
                      <button
                        aria-pressed={themeMode === "day"}
                        className={themeMode === "day" ? "is-active" : ""}
                        onClick={() => onSetTheme("day")}
                        type="button"
                      >
                        <Sun size={16} />
                        白天
                      </button>
                      <button
                        aria-pressed={themeMode === "night"}
                        className={themeMode === "night" ? "is-active" : ""}
                        onClick={() => onSetTheme("night")}
                        type="button"
                      >
                        <MoonStar size={16} />
                        黑夜
                      </button>
                    </div>
                  </div>
                  <button className="dt-logout" onClick={onLogout} type="button" role="menuitem">
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div className="dt-subtabs">
          <button
            className={tab === "personal" ? "dt-subtab dt-subtab-active" : "dt-subtab"}
            onClick={() => switchTab("personal")}
            type="button"
          >
            个人
          </button>
          <button
            className={tab === "twin" ? "dt-subtab dt-subtab-active" : "dt-subtab"}
            onClick={() => switchTab("twin")}
            type="button"
          >
            分身
          </button>
        </div>

        {tab === "personal" ? (
          editing ? (
            <>
              <div className="form-panel">
                <label>
                  昵称
                  <input value={form.nickname} onChange={(event) => setField("nickname", event.target.value)} aria-label="昵称" />
                </label>
                <label>
                  性格关键词
                  <input
                    value={form.keywords}
                    onChange={(event) => setField("keywords", event.target.value)}
                    aria-label="性格关键词"
                    placeholder="用、分隔，如：温柔、慢热"
                  />
                </label>
                <label>
                  沟通风格
                  <textarea
                    className="compact-textarea"
                    value={form.communication}
                    onChange={(event) => setField("communication", event.target.value)}
                    aria-label="沟通风格"
                  />
                </label>
                <label>
                  价值观
                  <input
                    value={form.values}
                    onChange={(event) => setField("values", event.target.value)}
                    aria-label="价值观"
                    placeholder="用、分隔，如：真实、边界感"
                  />
                </label>
                <label>
                  兴趣标签
                  <input
                    value={form.interests}
                    onChange={(event) => setField("interests", event.target.value)}
                    aria-label="兴趣标签"
                    placeholder="用、分隔，如：星空摄影、独立音乐"
                  />
                </label>
              </div>
              <div className="dt-edit-row">
                <button className="dt-chip-btn dt-chip-btn-accent" onClick={savePersonal} type="button">
                  保存个人资料
                </button>
                <button className="dt-chip-btn" onClick={() => setEditing(false)} type="button">
                  取消
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="dt-twin-name">
                <h2>{profile.nickname}</h2>
                <span>本人资料</span>
              </div>

              <div className="dt-twin-section">
                <span className="dt-sec-label">性格关键词</span>
                <div className="keyword-row">
                  {personalityKeywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
              </div>

              <div className="dt-twin-section">
                <span className="dt-sec-label">沟通风格</span>
                <p>{communicationText}</p>
              </div>

              <div className="dt-twin-section">
                <span className="dt-sec-label">价值观</span>
                <p>{valuesText}</p>
              </div>

              <div className="dt-twin-section">
                <span className="dt-sec-label">兴趣标签</span>
                <div className="keyword-row">
                  {profile.interests.map((interest) => (
                    <span key={interest}>{interest}</span>
                  ))}
                </div>
              </div>

              <div className="dt-edit-row">
                <button className="dt-chip-btn" onClick={startEditPersonal} type="button">
                  <Pencil size={14} />
                  编辑个人资料
                </button>
              </div>
            </>
          )
        ) : editing ? (
          <>
            <div className="form-panel">
              <label>
                分身昵称
                <input
                  value={form.twinNickname}
                  onChange={(event) => setField("twinNickname", event.target.value)}
                  aria-label="分身昵称"
                />
              </label>
              <label>
                分身关键词
                <input
                  value={form.twinKeywords}
                  onChange={(event) => setField("twinKeywords", event.target.value)}
                  aria-label="分身关键词"
                  placeholder="用、分隔，如：温柔、夜行"
                />
              </label>
              <label>
                分身摘要
                <textarea
                  value={form.twinSummary}
                  onChange={(event) => setField("twinSummary", event.target.value)}
                  aria-label="分身摘要"
                />
              </label>
            </div>
            <div className="dt-edit-row">
              <button className="dt-chip-btn dt-chip-btn-accent" onClick={saveTwinEdits} type="button">
                保存分身资料
              </button>
              <button className="dt-chip-btn" onClick={() => setEditing(false)} type="button">
                取消
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="dt-twin-stage dt-zone-dark">
              <ThreeDreamScene variant="avatar" avatarStyleSpec={resolveAvatarStyle(twin)} />
              <span className="dt-twin-base" aria-hidden="true" />
            </div>

            <div className="dt-twin-name">
              <h2>{twin.nickname || profile.nickname}</h2>
              <span>网络世界里的你</span>
            </div>

            <div className="dt-twin-section">
              <span className="dt-sec-label">分身关键词</span>
              <div className="keyword-row">
                {twin.keywords.map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            </div>

            <div className="dt-twin-section">
              <span className="dt-sec-label">分身摘要</span>
              <p>{twin.summary}</p>
            </div>

            <div className="dt-edit-row">
              <button className="dt-chip-btn" onClick={startEditTwin} type="button">
                <Pencil size={14} />
                编辑分身资料
              </button>
            </div>

            <div className="dt-note">
              <span>AI 会基于你的画像进行关系预演与建议</span>
              <span>不会代替你聊天或做决定</span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
