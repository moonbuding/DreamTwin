import { ArrowRight, Pencil, Send, Sparkles } from "lucide-react";
import { PrimaryButton } from "../components/PrimaryButton";
import { ThreeDreamScene } from "../components/ThreeDreamScene";
import { TwinProjection } from "../components/TwinProjection";
import type { DreamNode, TwinProjection as TwinProjectionModel, UserProfile } from "../types/dreamtwin";

interface TwinHomePageProps {
  profile: UserProfile;
  twin: TwinProjectionModel;
  nodes: DreamNode[];
  onEditTwin: () => void;
  onEnterDreamPlaza: () => void;
  onInviteFriend: () => void;
}

export function TwinHomePage({
  profile,
  twin,
  nodes,
  onEditTwin,
  onEnterDreamPlaza,
  onInviteFriend,
}: TwinHomePageProps) {
  const overnightCount = nodes.filter((node) => node.entryMode === "overnight_discovery").length;
  const openedCount = nodes.filter((node) => node.status === "opened").length;
  const waitingCount = nodes.filter((node) => node.status === "waiting").length;

  return (
    <section className="page page-scroll scene-page twin-home-page">
      <ThreeDreamScene variant="ambient" className="page-scene twin-home-scene" />
      <div className="page-content twin-home-content">
        <header className="twin-home-hero">
          <p className="label">AI 分身主页</p>
          <h1>{twin.nickname} 已经保存。</h1>
          <p>
            后续打开 App，会先回到这里。你可以带着它进入梦境广场，也可以邀请好友一起梦境漫游。
          </p>
        </header>

        <TwinProjection twin={twin} />

        <section className="twin-home-status" aria-label="分身状态">
          <div>
            <span>分身状态</span>
            <strong>已保存</strong>
          </div>
          <div>
            <span>昨夜入口</span>
            <strong>{overnightCount} 个梦境</strong>
          </div>
          <div>
            <span>关系进度</span>
            <strong>{openedCount > 0 ? `${openedCount} 个已打开` : waitingCount > 0 ? `${waitingCount} 个等待中` : "可开始"}</strong>
          </div>
        </section>

        <section className="twin-home-actions" aria-label="下一步玩法">
          <PrimaryButton icon={<ArrowRight size={18} />} onClick={onEnterDreamPlaza}>
            进入梦境广场
          </PrimaryButton>
          <PrimaryButton icon={<Send size={18} />} variant="secondary" onClick={onInviteFriend}>
            邀请好友梦境漫游
          </PrimaryButton>
          <button className="text-button twin-edit-button" onClick={onEditTwin} type="button">
            <Pencil size={15} />
            修改分身
          </button>
        </section>

        <section className="twin-home-guidance" aria-label="当前 Demo 状态说明">
          <div>
            <Sparkles size={16} />
            <span>分身会作为你的关系预演入口，不是陪伴角色。</span>
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
