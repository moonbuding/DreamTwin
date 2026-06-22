import { Search, Sparkles } from "lucide-react";
import { demoPlazaProfiles } from "../data/demoData";

interface PlazaPageProps {
  onInviteCoDream: (profileId: string) => void;
}

export function PlazaPage({ onInviteCoDream }: PlazaPageProps) {
  return (
    <section className="page page-scroll dt-page dt-light plaza-page">
      <div className="page-content dt-content plaza-content">
        <header className="dt-head">
          <div className="dt-head-left" />
          <span className="dt-head-title">广场</span>
          <div className="dt-head-right">
            <button className="dt-icon-btn" type="button" aria-label="搜索">
              <Search size={17} />
            </button>
          </div>
        </header>

        <div className="dt-plaza-intro">
          <h2>看看正在做梦的人</h2>
          <p>浏览别人的 AI 分身，想靠近就邀请一起入梦</p>
        </div>

        <div className="dt-search" aria-hidden="true">
          <Search size={16} />
          搜索分身、关键词
        </div>

        <div className="dt-plaza-grid">
          {demoPlazaProfiles.map((profile) => (
            <article className="dt-plaza-card" key={profile.id}>
              <span
                className="dt-plaza-orb"
                style={{
                  background: `linear-gradient(140deg, ${profile.colorPalette[0]}, ${profile.colorPalette[1]} 55%, ${profile.colorPalette[2]})`,
                }}
              />
              <strong>{profile.name}</strong>
              <span className="dt-plaza-presence">
                <i />
                {profile.presence}
              </span>
              <p className="dt-plaza-tag">{profile.tagline}</p>
              <button className="dt-plaza-invite" onClick={() => onInviteCoDream(profile.id)} type="button">
                <Sparkles size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
                邀请共同入梦
              </button>
            </article>
          ))}
        </div>

        <div className="dt-note">
          <span>广场只展示 AI 分身，不是动态信息流</span>
          <span>只有双方都愿意，梦境门才会打开</span>
        </div>
      </div>
    </section>
  );
}
