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
          <p className="label">分身</p>
          <h1>{twin.nickname} 已经保存。</h1>
          <p>
            这里用来管理你的 AI 人格画像。每天打开 App 先看今日关系动态，分身只负责帮助关系预演更像你。
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

        <section className="twin-home-route" aria-label="推荐进入路径">
          <span>分身边界</span>
          <strong>它代表你参与预演，不替你聊天。</strong>
          <p>DreamTwin 会用分身画像生成关系可能性，但真实确认和第一句话始终交给你。</p>
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

        <section className="twin-home-guidance" aria-label="当前分身状态说明">
          <div>
            <Sparkles size={16} />
            <span>分身负责预演关系，不替你聊天，也不是陪伴角色。</span>
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
