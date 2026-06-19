import { Pencil, ShieldCheck, Sparkles } from "lucide-react";
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

  return (
    <section className="page page-scroll scene-page twin-home-page">
      <ThreeDreamScene variant="ambient" className="page-scene twin-home-scene" />
      <div className="page-content twin-home-content">
        <header className="twin-home-hero">
          <p className="label">分身</p>
          <h1>你的关系画像已经保存。</h1>
          <p>
            {twin.nickname} 会记录你的靠近方式、价值观和表达习惯，用来生成更贴近你的关系预演。
          </p>
        </header>

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
      </div>
    </section>
  );
}
