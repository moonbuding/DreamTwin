import { ChevronLeft } from "lucide-react";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import type { AvatarStyleSpec, DreamNode, TwinProjection as TwinProjectionModel, UserProfile } from "../types/dreamtwin";

interface TwinHomePageProps {
  profile: UserProfile;
  twin: TwinProjectionModel;
  nodes: DreamNode[];
  onEditTwin: () => void;
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

export function TwinHomePage({ profile, twin, onEditTwin, onBack }: TwinHomePageProps) {
  const personalityKeywords = profile.personalityKeywords.length ? profile.personalityKeywords : twin.keywords;
  const valuesText = profile.values?.join("、") || twin.summary;
  const communicationText = profile.communicationStyle || "用温和、真实的方式靠近一段关系。";

  return (
    <section className="page page-scroll scene-page dt-page twin-home-page">
      <ThreeDreamScene variant="ambient" className="page-scene twin-home-scene" />
      <div className="page-content dt-content twin-home-content">
        <header className="dt-head">
          <div className="dt-head-left">
            <button className="dt-icon-btn" onClick={onBack} type="button" aria-label="返回">
              <ChevronLeft size={18} />
            </button>
          </div>
          <span className="dt-head-title">我的分身</span>
          <div className="dt-head-right">
            <button className="dt-chip-btn" onClick={onEditTwin} type="button">编辑资料</button>
          </div>
        </header>

        <div className="dt-twin-stage">
          <ThreeDreamScene variant="avatar" avatarStyleSpec={resolveAvatarStyle(twin)} />
          <span className="dt-twin-base" aria-hidden="true" />
        </div>

        <div className="dt-twin-name">
          <h2>{profile.nickname}</h2>
          <span>网络世界里的你</span>
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

        <div className="dt-note">
          <span>AI 会基于你的画像进行关系预演与建议</span>
          <span>不会代替你聊天或做决定</span>
        </div>
      </div>
    </section>
  );
}
