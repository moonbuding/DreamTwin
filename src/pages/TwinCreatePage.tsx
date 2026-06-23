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
const valueOptions = ["真实感", "边界感", "长期信任", "精神共鸣", "行动一致", "轻松相处"];
const mysticSignalOptions = ["月亮感", "深夜直觉", "火象能量", "水象共情", "风象好奇", "土象稳定"];

export function TwinCreatePage({ profile, onSubmit }: TwinCreatePageProps) {
  const [nickname, setNickname] = useState(profile.nickname);
  const [relationshipIntention, setRelationshipIntention] = useState(profile.relationshipIntention);
  const [personalityKeywords, setPersonalityKeywords] = useState(profile.personalityKeywords);
  const [interests, setInterests] = useState(profile.interests);
  const [mbti, setMbti] = useState(profile.mbti ?? "");
  const [zodiac, setZodiac] = useState(profile.zodiac ?? "");
  const [communicationStyle, setCommunicationStyle] = useState(profile.communicationStyle ?? "");
  const [values, setValues] = useState(profile.values ?? []);
  const [mysticTags, setMysticTags] = useState(profile.mysticTags ?? []);

  const canSubmit = nickname.trim().length > 0 && relationshipIntention.trim().length > 3 && personalityKeywords.length > 0;
  const currentProfile = useMemo<UserProfile>(
    () => {
      const baseSignals = profile.optionalSignals.filter(
        (signal) => !signal.startsWith("沟通方式：") && !signal.startsWith("重视："),
      );

      return {
        ...profile,
        nickname: nickname.trim(),
        relationshipIntention: relationshipIntention.trim(),
        personalityKeywords,
        interests,
        mbti: mbti.trim() || undefined,
        zodiac: zodiac.trim() || undefined,
        communicationStyle: communicationStyle.trim() || undefined,
        values,
        mysticTags,
        optionalSignals: [
          ...baseSignals,
          ...(communicationStyle.trim() ? [`沟通方式：${communicationStyle.trim()}`] : []),
          ...(values.length ? [`重视：${values.join("、")}`] : []),
        ],
      };
    },
    [communicationStyle, interests, mbti, mysticTags, nickname, personalityKeywords, profile, relationshipIntention, values, zodiac],
  );

  const toggleValue = (value: string, values: string[], setter: (next: string[]) => void) => {
    if (values.includes(value)) {
      setter(values.filter((item) => item !== value));
      return;
    }
    setter([...values, value]);
  };

  return (
    <section className="page page-scroll dt-page dt-light">
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
          <section className="profile-signal-panel" aria-label="可选画像信号">
            <div>
              <p className="field-label">让 AI 更懂你的可选信号</p>
              <p>这些只作为关系预演的叙事参考，不会被当成科学预测。</p>
            </div>
            <div className="profile-signal-grid">
              <label>
                MBTI
                <input
                  value={mbti}
                  onChange={(event) => setMbti(event.target.value.toUpperCase())}
                  aria-label="MBTI"
                  placeholder="例如 INFJ"
                />
              </label>
              <label>
                星座
                <input
                  value={zodiac}
                  onChange={(event) => setZodiac(event.target.value)}
                  aria-label="星座"
                  placeholder="例如 双鱼"
                />
              </label>
            </div>
            <label>
              沟通方式
              <textarea
                className="compact-textarea"
                value={communicationStyle}
                onChange={(event) => setCommunicationStyle(event.target.value)}
                aria-label="沟通方式"
                placeholder="例如：先观察，再用具体细节靠近"
              />
            </label>
            <div>
              <p className="field-label">价值观标签</p>
              <div className="keyword-row choice-row">
                {valueOptions.map((value) => (
                  <button
                    className={`choice-chip ${values.includes(value) ? "choice-chip-active" : ""}`}
                    key={value}
                    onClick={() => toggleValue(value, values, setValues)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="field-label">叙事信号</p>
              <div className="keyword-row choice-row">
                {mysticSignalOptions.map((signal) => (
                  <button
                    className={`choice-chip ${mysticTags.includes(signal) ? "choice-chip-active" : ""}`}
                    key={signal}
                    onClick={() => toggleValue(signal, mysticTags, setMysticTags)}
                    type="button"
                  >
                    {signal}
                  </button>
                ))}
              </div>
            </div>
          </section>
          <div className="projection-preview">
            <span>即将生成</span>
            <strong>{nickname || "你"} 的 DreamTwins</strong>
            <p>
              {[...personalityKeywords.slice(0, 2), ...values.slice(0, 1), mbti.trim()].filter(Boolean).join(" / ") ||
                "等待人格线索"}
            </p>
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
