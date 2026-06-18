import { useMemo, useState } from "react";
import { WandSparkles } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import type { UserProfile } from "../types/dreamtwin";

interface TwinCreatePageProps {
  profile: UserProfile;
  onSubmit: (profile: UserProfile) => void;
}

const keywordOptions = ["慢热", "高共情", "夜间思考者", "重视真实感", "好奇心强", "直接表达"];
const interestOptions = ["城市夜行", "独立音乐", "心理学", "影像叙事", "咖啡馆", "旅行观察"];

export function TwinCreatePage({ profile, onSubmit }: TwinCreatePageProps) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [relationshipIntention, setRelationshipIntention] = useState(profile.relationshipIntention);
  const [personalityKeywords, setPersonalityKeywords] = useState(profile.personalityKeywords);
  const [interests, setInterests] = useState(profile.interests);

  const canSubmit = nickname.trim().length > 0 && relationshipIntention.trim().length > 3 && personalityKeywords.length > 0;
  const currentProfile = useMemo<UserProfile>(
    () => ({
      ...profile,
      nickname: nickname.trim(),
      relationshipIntention: relationshipIntention.trim(),
      personalityKeywords,
      interests,
    }),
    [interests, nickname, personalityKeywords, profile, relationshipIntention],
  );

  const toggleValue = (value: string, values: string[], setter: (next: string[]) => void) => {
    if (values.includes(value)) {
      setter(values.filter((item) => item !== value));
      return;
    }
    setter([...values, value]);
  };

  return (
    <section className="page page-scroll">
      <div className="page-content">
        <p className="label">Step 01</p>
        <h1>让分身理解你如何靠近一段关系。</h1>
        <div className="form-panel">
          <label>
            昵称
            <input value={nickname} onChange={(event) => setNickname(event.target.value)} aria-label="昵称" />
          </label>
          <label>
            关系倾向
            <textarea
              value={relationshipIntention}
              onChange={(event) => setRelationshipIntention(event.target.value)}
              aria-label="关系倾向"
            />
          </label>
          <div>
            <p className="field-label">人格关键词</p>
            <div className="keyword-row choice-row">
              {keywordOptions.map((keyword) => (
                <button
                  className={`choice-chip ${personalityKeywords.includes(keyword) ? "choice-chip-active" : ""}`}
                  key={keyword}
                  onClick={() => toggleValue(keyword, personalityKeywords, setPersonalityKeywords)}
                  type="button"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="field-label">兴趣线索</p>
            <div className="keyword-row choice-row">
              {interestOptions.map((interest) => (
                <button
                  className={`choice-chip ${interests.includes(interest) ? "choice-chip-active" : ""}`}
                  key={interest}
                  onClick={() => toggleValue(interest, interests, setInterests)}
                  type="button"
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
          <div className="projection-preview">
            <span>即将生成</span>
            <strong>{nickname || "你"} 的 DreamTwin</strong>
            <p>{personalityKeywords.slice(0, 3).join(" / ") || "等待人格线索"}</p>
          </div>
        </div>
      </div>
      <div className="bottom-action">
        <PrimaryButton disabled={!canSubmit} icon={<WandSparkles size={18} />} onClick={() => onSubmit(currentProfile)}>
          生成我的 AI 分身
        </PrimaryButton>
      </div>
    </section>
  );
}
