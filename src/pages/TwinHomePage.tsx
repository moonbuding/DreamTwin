import { ArrowUpDown, Pencil, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import { TwinProjection } from "../components/TwinProjection";
import type { DreamNode, TwinProjection as TwinProjectionModel, UserProfile } from "../types/dreamtwin";

interface TwinHomePageProps {
  profile: UserProfile;
  twin: TwinProjectionModel;
  nodes: DreamNode[];
  onEditTwin: () => void;
}

export function TwinHomePage({
  profile,
  twin,
  nodes,
  onEditTwin,
}: TwinHomePageProps) {
  const overnightCount = nodes.filter((node) => node.entryMode === "overnight_discovery").length;
  const openedCount = nodes.filter((node) => node.status === "opened").length;
  const waitingCount = nodes.filter((node) => node.status === "waiting").length;
  const [viewMode, setViewMode] = useState<"twin" | "profile">("twin");
  const profileSignals = [
    {
      label: "靠近方式",
      value: profile.communicationStyle ?? profile.relationshipIntention,
    },
    {
      label: "价值观",
      value: profile.values?.slice(0, 3).join(" / ") || profile.personalityKeywords.slice(0, 3).join(" / "),
    },
    {
      label: "兴趣线索",
      value: profile.interests.slice(0, 3).join(" / "),
    },
    {
      label: "叙事信号",
      value: [profile.mbti, profile.zodiac, ...(profile.mysticTags ?? [])].filter(Boolean).slice(0, 3).join(" / ") || "可选补充",
    },
  ];
  const profileKeywords = Array.from(new Set([
    ...twin.keywords,
    ...profile.personalityKeywords,
  ].filter(Boolean))).slice(0, 4);
  const dreamFitTags = [
    profile.interests[0] ? `${profile.interests[0]}里的慢热开场` : "低压开场",
    profile.interests[1] ? `围绕${profile.interests[1]}交换感受` : "共同观察",
    profile.values?.[0] ? `尊重${profile.values[0]}` : "慢速确认",
  ];
  const icebreakerHint =
    profile.communicationStyle ??
    `可以先从「${profile.interests[0] ?? profile.personalityKeywords[0] ?? "今天的一个瞬间"}」聊起。`;

  return (
    <section className="page page-scroll scene-page twin-home-page">
      <ThreeDreamScene variant="ambient" className="page-scene twin-home-scene" />
      <div className="page-content twin-home-content">
        <header className="twin-home-hero">
          <div className="twin-home-hero-top">
            <div>
              <p className="label">{viewMode === "twin" ? "分身" : "个人主页"}</p>
              <h1>{viewMode === "twin" ? "你的关系画像已经保存。" : "别人可以这样认识你。"}</h1>
            </div>
            <button
              className="twin-mode-toggle"
              onClick={() => setViewMode((mode) => (mode === "twin" ? "profile" : "twin"))}
              type="button"
              aria-label={viewMode === "twin" ? "切换到个人主页" : "切换到分身管理"}
            >
              <ArrowUpDown size={17} />
              <span>{viewMode === "twin" ? "个人主页" : "分身管理"}</span>
            </button>
          </div>
          <p>
            {viewMode === "twin"
              ? `${twin.nickname} 会记录你的靠近方式、价值观和表达习惯，用来生成更贴近你的关系预演。`
              : "这里不是动态流，而是让别人理解你适合如何被认识、适合一起进入什么梦境。"}
          </p>
        </header>

        {viewMode === "twin" ? (
          <>
            <section className="twin-home-status" aria-label="分身状态">
              <div>
                <span>画像用途</span>
                <strong>关系预演</strong>
              </div>
              <div>
                <span>梦境入口</span>
                <strong>{overnightCount} 个梦境</strong>
              </div>
              <div>
                <span>当前进度</span>
                <strong>{openedCount > 0 ? `${openedCount} 个已打开` : waitingCount > 0 ? `${waitingCount} 个等待中` : "可开始"}</strong>
              </div>
            </section>

            <section className="twin-home-route" aria-label="关系画像使用方式">
              <span>它会怎么使用</span>
              <strong>画像进入 AI 预演，真实决定留给你。</strong>
              <div className="twin-use-flow">
                <b>画像</b>
                <b>预演</b>
                <b>你决定</b>
              </div>
            </section>

            <TwinProjection twin={twin} />

            <section className="twin-profile-panel" aria-label="关系画像管理">
              <div className="section-heading-inline">
                <span>关系画像</span>
                <strong>用于预演，不用于养成</strong>
              </div>
              <div className="twin-profile-grid">
                {profileSignals.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="twin-boundary-strip" aria-label="AI 分身边界">
              <ShieldCheck size={17} />
              <div>
                <strong>分身只用于关系预演。</strong>
                <p>它不会替你聊天、不会陪伴养成，也不会把星座或 MBTI 当成科学结论。</p>
              </div>
            </section>

            <section className="twin-home-actions twin-home-actions-management" aria-label="分身管理">
              <button className="text-button twin-edit-button" onClick={onEditTwin} type="button">
                <Pencil size={15} />
                修改分身
              </button>
              <p>想继续一段关系时，可以去今日看动态、去梦境看地图，或去好友发起共同入梦。</p>
            </section>

            <section className="twin-home-guidance" aria-label="当前分身状态说明">
              <div>
                <Sparkles size={16} />
                <span>这些标签只是关系预演信号，不是性格判定。</span>
              </div>
              <p>{profile.relationshipIntention}</p>
              <div className="keyword-row">
                {profile.personalityKeywords.slice(0, 4).map((keyword) => (
                  <span key={keyword}>{keyword}</span>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="twin-profile-home" aria-label="个人主页预览">
            <div className="twin-profile-hero-card">
              <div className="twin-profile-orbit" aria-hidden="true">
                <span />
              </div>
              <div className="twin-profile-copy">
                <span>DreamTwin 个人主页</span>
                <h2>{profile.nickname}</h2>
                <p>{twin.summary}</p>
                <div className="keyword-row twin-profile-keywords">
                  {profileKeywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="twin-profile-section">
              <div className="section-heading-inline">
                <span>如何认识我</span>
                <strong>先从关系语境开始</strong>
              </div>
              <p className="twin-profile-intro">
                {profile.relationshipIntention}。如果想靠近，可以先邀请我一起入梦，让 AI 基于双方分身和共同场景预演一次关系可能性。
              </p>
            </div>

            <div className="twin-profile-section">
              <div className="section-heading-inline">
                <span>适合一起入梦</span>
                <strong>不是刷人，是选择共同场景</strong>
              </div>
              <div className="twin-profile-fit-list">
                {dreamFitTags.map((tag) => (
                  <div key={tag}>
                    <Sparkles size={14} />
                    <strong>{tag}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="twin-profile-section">
              <div className="section-heading-inline">
                <span>破冰提示</span>
                <strong>先共同入梦，再开始聊天</strong>
              </div>
              <p className="twin-profile-icebreaker">{icebreakerHint}</p>
            </div>

            <div className="twin-profile-cta-preview" aria-label="个人主页主行动预览">
              <button className="primary-button" type="button">
                邀请一起入梦
              </button>
              <p>这是个人主页的主行动，不是普通私信。真正上线时，对方需要先确认入梦。</p>
            </div>

            <section className="twin-boundary-strip twin-profile-boundary" aria-label="个人主页边界">
              <ShieldCheck size={17} />
              <div>
                <strong>个人主页可以像社交资料页一样清楚，但核心不是动态流。</strong>
                <p>DreamTwin 的主页服务一起入梦、关系预演和双方确认，不开放无门槛私信。</p>
              </div>
            </section>
          </section>
        )}
      </div>
    </section>
  );
}
