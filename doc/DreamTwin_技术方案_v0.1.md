# DreamTwin 技术方案 v0.1

> 文档状态：移动端 Web MVP / Demo 技术方案基准版
> 技术路线：React + Vite + TypeScript
> 动效策略：CSS + Canvas 2D 保底；Three.js / WebGL Canvas 视觉验证
> 上游文档：`doc/DreamTwin_PRD_v0.1.md`、`doc/DreamTwin_需求池_v0.1.md`

## 1. 技术方案目标

本技术方案把 DreamTwin 需求池转成第一版移动端 Web MVP / Demo 的工程实现方案。

第一版目标是：

- 可开发。
- 可路演。
- 可录屏。
- 可继续长成真实 App。
- 视觉震撼优先，同时尽力跑通完整路径。

第一版不是临时报名材料，也不是完整商业产品。

第一版采用纯前端静态 Demo：

- 不接真实后端。
- 不接真实用户关系发现。
- 不接生产级 AI 实时生成；本地 Live AI adapter 可用于验证。
- 不做真实聊天服务。
- 不做账号系统。
- 不做审核后台。

默认运行前端时保持静态稳定模式，不主动探测本地后端，避免无后端时出现失败请求或控制台噪声。需要验证真实 AI 能力时，再通过 `VITE_DREAMTWIN_ENABLE_LIVE_AI=true` 或显式 `VITE_DREAMTWIN_API_URL` 开启 Live AI adapter。

技术方案要优先保证：

- 移动端 Web 体验像 App。
- 静态 Demo 数据稳定。
- 梦境星图可交互。
- AI 分身人格投影有存在感，并为 v0.2 风格化 3D 分身验证预留空间。
- 状态流转连续。
- 完整路径可以从头跑到真实聊天入口。
- Three.js 先作为 3D 视觉验证候选方案，不承担核心交互和状态逻辑。

### 1.1 v0.2 技术方向补充

在当前移动端 Web Demo 和 Live AI adapter 基础上，v0.2 技术验证方向升级为：

- 风格化全身 3D AI 分身：使用 Three.js / WebGL 展示人格分身，当前抽象投影作为 fallback。
- 引导式 3D 梦境场景：使用不可自由行走的 3D 场景舞台、镜头推进和热点事件承载关系预演。
- 双方画像驱动的 AI 模拟：前端提交双方分身画像、场景事件和关系目标，后端返回结构化模拟结果。

技术边界：

- 3D 分身不做写实数字人、换装系统、骨骼复杂战斗动作、等级或养成属性。
- 3D 场景不做自由漫游、地图拖拽、地图缩放、游戏关卡、副本或奖励系统。
- Three.js 继续异步加载，不进入首屏主包；CSS / 抽象投影 / 静态场景继续作为 fallback。

## 2. 技术栈

### 2.1 核心技术

第一版基础实现建议使用：

- React
- Vite
- TypeScript
- CSS Modules 或普通 CSS 分层文件
- Canvas 2D API

第一版视觉验证可单独试用：

- Three.js
- WebGL Canvas

不建议第一版引入：

- Next.js
- 复杂全局状态库
- 真实后端服务
- 真实数据库
- 复杂动画引擎
- 复杂游戏引擎
- 地图 SDK

### 2.2 技术选择理由

React + Vite + TypeScript 适合第一版 DreamTwin：

- 启动快。
- 适合单页 Demo。
- 组件拆分清晰。
- 类型能约束 Demo 数据。
- 后续可迁移到真实 App 或接入后端。

CSS + Canvas 2D 是第一版保底视觉方案：

- CSS 负责页面布局、转场、按钮反馈和基础光影。
- Canvas 2D 负责保底星尘、轻量粒子、渐变和光晕。
- React 仍然负责页面状态、路径推进、按钮交互和数据流。
- 不引入重型动画库，降低首版复杂度。

Three.js / WebGL Canvas 是视觉验证候选方案：

- Three.js 适合真实 3D 空间、景深、粒子场、节点光晕和光门效果。
- Three.js 不是 Canvas 2D 的效果，而是使用 WebGL canvas 在网页中渲染 3D。
- 只有当视觉效果明显优于 Canvas 2D，且移动端性能可接受，才纳入正式 MVP Demo。

## 3. 工程目录建议

后续初始化前端项目时，建议目录如下：

```text
prototype/
  visual-spikes/
    canvas-baseline/
    three-scene/
src/
  App.tsx
  main.tsx
  data/
    demoData.ts
  types/
    dreamtwin.ts
  state/
    demoFlow.ts
  pages/
    WelcomePage.tsx
    TwinCreatePage.tsx
    TwinGeneratingPage.tsx
    TwinHomePage.tsx
    DreamLogPage.tsx
    FriendInvitePage.tsx
    SimulationDetailPage.tsx
    WaitingPage.tsx
    DreamGatePage.tsx
    ChatEntryPage.tsx
  components/
    AppShell.tsx
    PrimaryButton.tsx
    TwinProjection.tsx
    DreamStarMap.tsx
    DreamNodeBadge.tsx
    SimulationCard.tsx
    StatusPill.tsx
    PageTransition.tsx
  canvas/
    drawStarMap.ts
    drawTwinProjection.ts
  styles/
    tokens.css
    global.css
    layout.css
    motion.css
```

目录原则：

- `pages` 只处理页面级布局和路径推进。
- `components` 处理可复用 UI。
- `canvas` 只放 Canvas 绘制逻辑。
- `prototype/visual-spikes` 只放视觉验证小样，不直接承载主 Demo 业务逻辑。
- `state` 只放 Demo 流程状态。
- `localStorage` 只用于模拟 Demo 分身保存，后端阶段再替换为账号级持久化。
- `data` 只放静态 Demo 数据。
- `types` 统一承接 PRD 数据结构。

## 4. 类型模型

### 4.1 DreamNodeStatus

```ts
export type DreamNodeStatus =
  | "unviewed"
  | "viewed"
  | "waiting"
  | "opened";
```

状态含义：

- `unviewed`：未查看。
- `viewed`：已查看预告片。
- `waiting`：等待对方入梦。
- `opened`：梦境门打开。

### 4.2 RelationshipEntryMode 与 DreamInviteStatus

```ts
export type RelationshipEntryMode =
  | "overnight_discovery"
  | "friend_invite";

export type DreamInviteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "withdrawn";
```

用途：

- 区分梦境广场的新关系发现路径和好友邀请梦境漫游路径。
- 支撑等待页在不同路径下显示“等待对方入梦”或“等待好友入梦”。
- 支撑 Demo 中的好友邀请状态变化。

边界：

- `friend_invite` 只表示静态 Demo 邀请闭环。
- 不接真实通讯录。
- 不生成真实邀请链接。
- 不发送真实消息。

### 4.3 UserProfile

```ts
export interface UserProfile {
  id: string;
  nickname: string;
  personalityKeywords: string[];
  relationshipIntention: string;
  interests: string[];
  optionalSignals: string[];
  mbti?: string;
  bloodType?: string;
  zodiac?: string;
  mysticTags?: string[];
  communicationStyle?: string[];
  values?: string[];
}
```

用途：

- 支撑 AI 分身创建页。
- 支撑静态 Demo 数据。
- 不用于真实账号系统。

### 4.4 TwinProjection

```ts
export interface TwinProjection {
  id: string;
  nickname: string;
  summary: string;
  colorPalette: string[];
  lightShape: "halo" | "mist" | "pulse" | "orbit";
  keywords: string[];
  avatarStyleSpec?: AvatarStyleSpec;
}
```

用途：

- 支撑 AI 分身生成页。
- 支撑分身 Tab 管理页。
- 支撑梦境广场 / 昨夜梦境日志页。
- 支撑抽象投影视觉。
- v0.2 支撑风格化全身 3D 分身候选。

边界：

- 不包含写实真人脸。
- 不包含可替换服装。
- 不包含换装。
- 不包含等级。
- 不包含养成属性。

### 4.4.1 AvatarStyleSpec

```ts
export interface AvatarStyleSpec {
  silhouette: "soft-human" | "crystal-human" | "shadow-human" | "light-human";
  materialTone: "mist" | "glass" | "stardust" | "neon";
  motionStyle: "calm-breath" | "curious-turn" | "warm-idle";
  auraColor: string[];
  boundaryTags: Array<"no-real-face" | "no-outfit-swap" | "no-leveling" | "no-companion-mode">;
}
```

用途：

- 将用户画像映射为风格化 3D 分身表现。
- 只服务人格表达和关系预演入口。
- 不承载换装、养成或虚拟伴侣能力。

### 4.5 DreamNode

```ts
export interface DreamNode {
  id: string;
  title: string;
  status: DreamNodeStatus;
  simulationId: string;
  entryMode: RelationshipEntryMode;
  x: number;
  y: number;
  intensity: number;
  sceneStageVariant?: SceneStageVariant;
}
```

用途：

- 支撑梦境星图。
- 支撑新关系发现和好友邀请两类入口。
- 支撑节点状态变化。
- `x` 和 `y` 是相对坐标，范围建议为 `0` 到 `1`。
- `intensity` 用于节点亮度和呼吸强度。

边界：

- 不表示真实地图位置。
- 不表示附近的人。
- 不表示可探索地图路径。

### 4.5.1 SceneStageVariant 与 GuidedSceneEvent

```ts
export type SceneStageVariant =
  | "rain_store"
  | "starlight"
  | "undersea"
  | "sushi"
  | "cinema"
  | "badminton";

export interface GuidedSceneEvent {
  id: string;
  label: string;
  prompt: string;
  hotspot: "foreground" | "midground" | "background" | "gate";
}
```

用途：

- 支撑引导式 3D 梦境场景。
- 将场景热点转换为关系模拟输入。
- 不表示可走地图路径、地图坐标或游戏关卡。

### 4.6 FriendProfile 与 DreamRoamingScene

```ts
export interface FriendProfile {
  id: string;
  name: string;
  relationLabel: string;
  presence: string;
  keywords: string[];
}

export interface DreamRoamingScene {
  id: string;
  label: string;
  premise: string;
  relationshipOutcome: string;
  likelyDialogue: string[];
  behaviorPreview: string[];
  romanceSignal: string;
  riskSignal: string;
  suggestedMove: string;
  possibleFirstLine: string;
}
```

用途：

- 支撑好友邀请梦境漫游。
- 支撑用户选择不同共同经历场景。
- 支撑好友接受后共同预演的静态内容切换。

边界：

- `FriendProfile` 是 Demo 静态好友，不是通讯录或真实好友系统。
- `DreamRoamingScene` 是关系预演场景，不是游戏地图或可走空间。

### 4.7 RelationshipSimulation

> 口径校准：前端类型、状态字段、页面名统一使用 `RelationshipSimulation` / `simulation`，即 AI 双人关系预演模拟。

```ts
export interface RelationshipSimulation {
  id: string;
  nodeId: string;
  entryMode: RelationshipEntryMode;
  friendProfile?: FriendProfile;
  title: string;
  counterpartName: string;
  counterpartProjection: string;
  scene: string;
  relationshipHypothesis: string;
  twinApproach: string;
  counterpartSimulatedReply: string;
  rehearsalOutcome: string;
  conversationPreview: string[];
  relationshipTrajectory: string[];
  romancePossibility: string;
  conflictRisk: string;
  badOutcomeScenario: string;
  recommendedMove: string;
  tension: string;
  possibleFirstLine: string;
  matchReasons: string[];
  roamingScenes?: DreamRoamingScene[];
  selfProfileSnapshot?: UserProfile;
  counterpartProfileSnapshot?: UserProfile;
  guidedSceneEvents?: GuidedSceneEvent[];
  relationshipGoal?: string;
}
```

用途：

- 支撑关系预演模拟详情页。
- 支撑“如果两个人相遇、聊天、靠近或走坏，关系可能如何发展”的内容表达。
- 为后续大模型生成预留字段。

边界：

- 不展示完整真实身份。
- 不承诺关系结果。
- 不把内容写成玄学预言。
- 不只生成正向结果，必须包含冲突风险和不好的走向。

### 4.8 DemoFlowState

```ts
export type DemoPage =
  | "welcome"
  | "twin-create"
  | "twin-generating"
  | "twin-home"
  | "dream-log"
  | "friend-invite"
  | "simulation-detail"
  | "waiting"
  | "dream-gate"
  | "chat-entry";

export interface DemoFlowState {
  currentPage: DemoPage;
  pageHistory: DemoPage[];
  hasCompletedTwinSetup: boolean;
  selectedNodeId: string | null;
  selectedFriendId: string | null;
  selectedRoamingSceneId: string | null;
  dreamInviteStatus: DreamInviteStatus;
  profile: UserProfile;
  twin: TwinProjection;
  friends: FriendProfile[];
  nodes: DreamNode[];
  simulations: RelationshipSimulation[];
}
```

用途：

- 支撑单页 App 内部页面状态。
- 支撑 `今日 / 梦境 / 消息 / 好友 / 分身` 五区 App 骨架。
- 支撑 Demo 分身保存与刷新恢复。
- 支撑好友邀请梦境漫游路径。
- 支撑节点状态流转。
- 支撑跨页面关系状态对象：AI 已预演、等待对方入梦、双方已入梦、梦境门打开、等待真人回应。
- 支撑完整演示路径。

第一版使用 `localStorage` 模拟 Demo 分身保存。当前实现中，如果 `hasCompletedTwinSetup` 为 `true`，刷新或后续打开默认进入 `今日`，并将原 AI 分身主页能力收敛为 `分身` Tab 内的管理页。Demo 控件通过 URL 参数显示，点击重新开始演示时清空本地 Demo 状态。正式后端阶段再替换为账号级持久化。

## 5. 状态与路由方案

### 5.1 单页状态路由

第一版不需要引入 React Router。

建议使用 `currentPage` 管理页面：

- `welcome`
- `twin-create`
- `twin-generating`
- `today`
- `twin-home`
- `dream-log`
- `messages`
- `friend-invite`
- `simulation-detail`
- `waiting`
- `dream-gate`
- `chat-entry`

这样做的原因：

- 第一版已从单流程演示切到五区 App 骨架，`今日` 是默认首页。
- 可以减少路由依赖。
- 演示状态更容易控制。
- 后续接真实 App 时再迁移到正式路由或路由库。

### 5.2 状态管理

第一版建议使用 React `useReducer`。

建议动作：

```ts
type DemoFlowAction =
  | { type: "START_TWIN_CREATE" }
  | { type: "SUBMIT_TWIN_PROFILE"; profile: UserProfile }
  | { type: "COMPLETE_TWIN_GENERATION" }
  | { type: "OPEN_TWIN_HOME" }
  | { type: "EDIT_TWIN" }
  | { type: "ENTER_DREAM_PLAZA" }
  | { type: "OPEN_DREAM_LOG" }
  | { type: "OPEN_FRIEND_INVITE" }
  | { type: "SELECT_FRIEND"; friendId: string }
  | { type: "SELECT_ROAMING_SCENE"; sceneId: string }
  | { type: "SEND_DREAM_INVITE"; friendId: string; sceneId: string }
  | { type: "SELECT_NODE"; nodeId: string }
  | { type: "ENTER_DREAM"; nodeId: string }
  | { type: "SIMULATE_COUNTERPART_CONFIRM"; nodeId: string }
  | { type: "SIMULATE_FRIEND_ACCEPT"; nodeId: string }
  | { type: "OPEN_CHAT_ENTRY"; nodeId: string }
  | { type: "RESET_DEMO" };
```

状态流转：

```text
welcome
  -> twin-create
  -> twin-generating
  -> today
  -> dream-log
  -> simulation-detail
  -> waiting
  -> dream-gate
  -> chat-entry
```

好友邀请路径：

```text
today / friends
  -> friend-invite
  -> waiting
  -> dream-log
  -> simulation-detail
  -> dream-gate
  -> chat-entry
```

> 说明：好友接受后应回到统一梦境地图，由双方在同一套场景库中选择共同梦境，再进入共同梦境漫游预演、梦境门与真实聊天入口。第一版可复用 `dream-log`、`simulation-detail`、`waiting`、`dream-gate` 和 `chat-entry` 页面，只通过 `entryMode` 区分文案和数据。

节点状态流转：

```text
unviewed
  -> viewed
  -> waiting
  -> opened
```

### 5.3 演示推进规则

第一版允许使用演示推进按钮或自动模拟：

- 用户点击梦境节点，节点进入 `viewed`。
- 用户点击“想进入这个梦境”，节点进入 `waiting`。
- 等待页可以提供一个路演用推进操作，模拟对方也确认。
- 好友邀请页可以提供一个路演用推进操作，模拟好友接受邀请。
- 对方确认后节点进入 `opened`。
- 梦境门打开页进入真实聊天入口。

路演推进操作只能用于 Demo，不应在文案中表现为真实产品机制。

## 6. 页面实现方案

### 6.1 WelcomePage

对应需求：

- `DT-P0-003`
- `DT-P1-007`

职责：

- 解释 DreamTwin 是 AI 关系预演社交。
- 建立梦境空间的第一印象。
- 引导用户开始创建 AI 分身。

主要组件：

- `AppShell`
- `TwinProjection`
- `PrimaryButton`

主操作：

- 点击“创建我的 AI 分身”触发 `START_TWIN_CREATE`。

验收重点：

- 30 秒内能理解产品不是普通社交，也不是 AI 陪伴。
- 首屏不能只是文字说明。

### 6.2 TwinCreatePage

对应需求：

- `DT-P0-004`

职责：

- 收集或展示 Demo 默认画像。
- 让用户感到关系偏好正在被理解。

主要字段：

- 昵称。
- 人格关键词。
- 关系倾向。
- 兴趣线索。
- 可选依据。

主操作：

- 点击“生成我的 AI 分身”触发 `SUBMIT_TWIN_PROFILE`。

实现建议：

- 第一版提供默认值，减少路演输入时间。
- 表单可以允许编辑，但不能阻塞演示。

### 6.3 TwinGeneratingPage

对应需求：

- `DT-P0-005`
- `DT-P1-002`

职责：

- 展示 AI 分身生成过程。
- 展示人格摘要、关键词和人格投影。

主要组件：

- `TwinProjection`
- `StatusPill`
- `PrimaryButton`

主操作：

- 点击“进入今日”触发 `COMPLETE_TWIN_GENERATION`。

实现建议：

- 生成过程使用静态 Demo 数据。
- 可以用 1 到 2 秒视觉过渡制造生成感。
- 抽象投影继续作为 CSS / Canvas 2D / Three.js fallback。
- v0.2 验证风格化全身 3D 分身，但只做人格表达，不做换装或养成。
- 默认使用静态分身摘要；Live AI adapter 需要显式开启，可用于生成分身摘要。生产级账号和分身持久化仍放到后端阶段。

### 6.4 TwinHomePage

对应需求：

- `DT-P0-014`
- `DT-P0-015`

职责：

- 展示已保存 AI 分身。
- 作为 `分身` Tab 内的管理页。
- 提供修改分身和分身边界说明。

主要组件：

- `TwinProjection`
- `PrimaryButton`
- `StatusPill`

主操作：

- 点击“修改分身”触发 `EDIT_TWIN`。

实现建议：

- 进入该页时应展示 `hasCompletedTwinSetup` 对应的已保存状态。
- 刷新时如果本地 Demo 状态显示分身已创建，应回到 `今日`，用户可从底部导航进入该页。
- 该页不是 AI 陪伴页，也不是角色养成页，不展示亲密度、等级或养成任务。

### 6.5 DreamLogPage

对应需求：

- `DT-P0-006`
- `DT-P0-007`
- `DT-P1-001`
- `DT-P1-004`

职责：

- 作为梦境广场 / 昨夜梦境日志首页。
- 展示 AI 分身摘要。
- 展示梦境星图和 3 个节点。

主要组件：

- `TwinProjection`
- `DreamStarMap`
- `DreamNodeBadge`
- `StatusPill`

主操作：

- 点击梦境节点触发 `SELECT_NODE`。
- 从页面内的好友入口可触发 `OPEN_FRIEND_INVITE`。

验收重点：

- 星图是关系入口，不是地图探索。
- 3 个节点状态可被理解。
- 背景、星图和光效可以先做 Canvas 2D 与 Three.js 对比小样，再决定正式版本。

### 6.6 FriendInvitePage

对应需求：

- `DT-P0-016`

职责：

- 支撑用户选择静态好友、发起入梦邀请和查看邀请状态。
- 展示邀请预览和产品边界。
- 发出 Demo 邀请后进入等待好友入梦状态。

主要组件：

- `PrimaryButton`
- 好友选择卡片
- 邀请状态说明
- 进入统一梦境地图的入口

主操作：

- 选择好友触发 `SELECT_FRIEND`。
- 点击“邀请好友入梦”触发 `SEND_DREAM_INVITE`。
- 好友接受后点击进入梦境地图，后续场景选择由统一梦境地图承接。

验收重点：

- 不能表现为偷偷分析好友。
- 不能在好友页直接用场景卡片选择梦境。
- 不能接真实通讯录、真实邀请链接或真实消息发送。
- 必须说明好友接受后才共同预演。

### 6.7 SimulationDetailPage

对应需求：

- `DT-P0-008`
- `DT-P1-005`

职责：

- 展示 AI 双人关系预演模拟。
- 让用户判断是否想进入这段被模拟过的关系。

主要内容：

- 梦境标题。
- 对方人格投影。
- 相遇场景。
- 关系张力。
- 可能的第一句话。
- 关系模拟依据。
- 当前节点状态。

主操作：

- 点击“想进入这个梦境”触发 `ENTER_DREAM`。

验收重点：

- 不能像普通资料卡。
- 不能像玄学预言。
- 必须有真实关系即将开始的感觉。

### 6.8 WaitingPage

对应需求：

- `DT-P0-010`
- `DT-P1-006`

职责：

- 展示等待对方入梦状态。
- 好友路径下展示等待好友入梦状态。
- 表达双方确认机制。
- 为路演提供稳定推进到梦境门打开的方式。

主要组件：

- `DreamNodeBadge`
- `StatusPill`
- `PrimaryButton`

主操作：

- 路演推进：触发 `SIMULATE_COUNTERPART_CONFIRM`。
- 好友路径路演推进：触发 `SIMULATE_FRIEND_ACCEPT`。

验收重点：

- 不展示真实聊天输入框。
- 不表达 AI 替用户聊天。

### 6.9 DreamGatePage

对应需求：

- `DT-P0-011`
- `DT-P1-004`

职责：

- 展示梦境门打开。
- 展示双方已确认。
- 引导进入真实聊天入口。
- 梦境门视觉先做 Canvas 2D 与 Three.js 对比小样，效果胜出后再纳入正式 Demo。

主操作：

- 点击“进入真实聊天”触发 `OPEN_CHAT_ENTRY`。

验收重点：

- 是真实关系入口，不是游戏关卡奖励。

### 6.10 ChatEntryPage

对应需求：

- `DT-P0-012`

职责：

- 作为完整演示路径终点。
- 告诉用户 AI 预演结束，现在由自己开始真实聊天。

主要内容：

- 对方简短投影。
- 建议开场白。
- 关系预演回顾。

边界：

- 不开发完整聊天后端。
- 不支持真实消息收发。
- 不提供 AI 自动代聊。

## 7. Canvas 2D 与 Three.js 视觉验证方案

### 7.1 技术边界说明

Canvas 本身是网页中的画布元素，不等于某一种具体渲染能力。

- Canvas 2D：使用 2D 绘图上下文，适合轻量星尘、粒子、渐变、光晕和保底视觉。
- WebGL Canvas：使用 WebGL 上下文，可以在网页画布中渲染真实 3D。
- Three.js：封装 WebGL 的 3D 渲染库，适合真实 3D 空间、景深、粒子场、光门和场景氛围。

因此：

- Canvas 2D 不能直接做真正 3D。
- Three.js 不是 Canvas 2D 的效果增强插件。
- Three.js 是通过 WebGL canvas 在网页中渲染 3D 效果。

### 7.2 视觉验证原则

第一版主 Demo 不直接默认采用 Three.js。

先单独做视觉验证小样：

- Canvas 2D baseline。
- Three.js scene。
- 输出截图或录屏。
- 对比加和不加 Three.js 的视觉差异。
- 由效果决定是否纳入正式 MVP Demo。

React 仍然负责：

- 页面状态。
- 路径推进。
- 节点状态。
- 按钮交互。
- Demo 数据流。

Three.js 只负责精美场景和氛围，不负责核心业务逻辑。

正式采用 Three.js 的条件：

- 视觉效果明显强于 Canvas 2D。
- 移动端演示不卡顿。
- 不破坏 P0 完整路径。
- 不让产品看起来像游戏地图、可走空间或角色养成。

### 7.3 视觉小样目录

后续正式开发前，先创建：

```text
prototype/
  visual-spikes/
    canvas-baseline/
      dream-background.html
      dream-star-map.html
      dream-gate.html
    three-scene/
      dream-background.html
      dream-star-map.html
      dream-gate.html
```

小样只验证视觉效果，不接入完整业务状态。

小样输出至少 3 组对比：

- Canvas 背景 vs Three.js 背景。
- Canvas 星图 vs Three.js 星图。
- Canvas 光门 vs Three.js 光门。

### 7.4 背景梦境空间

验证目标：

- 判断 Three.js 是否能明显提升 DreamTwin 的第一眼沉浸感。
- 比较 Canvas 2D 星尘背景与 Three.js 景深星场的差异。

Canvas 2D baseline：

- 渐变背景。
- 轻量星尘。
- 柔和光晕。
- 慢速漂浮粒子。

Three.js scene：

- 3D 星点。
- 景深层次。
- 漂浮光层。
- 轻微镜头移动或空间呼吸。

采用条件：

- Three.js 版本明显更有梦境空间感。
- 不抢走页面主内容。
- 手机端不明显卡顿。

### 7.5 DreamStarMap

对应需求：

- `DT-P0-007`
- `DT-P1-001`
- `DT-P1-004`

实现方式：

- Canvas 2D baseline 绘制星图背景、节点微光和轻量星尘。
- Three.js scene 验证 3D 星图空间、景深、节点光晕和星尘。
- 使用相对坐标绘制 3 个梦境节点。
- 节点交互层仍使用透明 HTML button 覆盖，不把点击命中放进 Three.js。

建议验证方式：

- 先实现 Canvas 2D 版本，保证 P0 路径能跑通。
- 再单独实现 Three.js 星图小样，比较空间感和节点质感。
- 如果 Three.js 效果明显更好，再纳入正式 Demo。

原因：

- 无障碍和点击反馈更稳。
- React 状态更新更清晰。
- 避免把星图做成复杂游戏系统。
- 避免后续误走成可探索 3D 地图。

节点视觉：

- `unviewed`：柔和微光。
- `viewed`：低亮度稳定光。
- `waiting`：缓慢脉冲。
- `opened`：高亮光门、环形扩散或空间展开。

边界：

- 不绘制道路。
- 不绘制真实地理元素。
- 不绘制可探索地图区域。
- 不支持拖拽地图。
- 不支持缩放地图。
- 不支持第一人称或第三人称移动。

### 7.6 DreamGate

对应需求：

- `DT-P0-011`
- `DT-P1-004`

实现方式：

- Canvas 2D baseline 验证光环、扩散和亮度变化。
- Three.js scene 验证光门、空间展开和开门高光。
- CSS 负责页面文案和按钮出现节奏。

视觉规则：

- 梦境门是双方确认后的关系入口。
- 梦境门不是游戏关卡。
- 梦境门不表现为闯关奖励。
- 梦境门打开后必须引导到真实聊天入口。

采用条件：

- Three.js 光门效果明显更有演示高潮。
- 视觉不会让用户误解为游戏关卡。
- 移动端性能稳定。

### 7.6.1 GuidedDreamStage

对应需求：

- `DT-P1-010`
- `DT-P1-011`

实现方式：

- 使用 Three.js 渲染不可自由行走的 3D 梦境舞台。
- 使用 `SceneStageVariant` 决定场景：雨夜便利店、星空、海底、日料店、电影院、羽毛球场。
- 使用 `GuidedSceneEvent` 定义热点事件，热点触发关系模拟内容更新。
- HTML / React 层继续承载结论、指标、CTA、返回和详情展开。

交互规则：

- 用户点击热点或问题，不控制角色移动。
- 场景可以有镜头推进、光效、人物站位暗示和事件焦点。
- 首屏仍然优先展示关系结论、三项指标、建议第一步和主 CTA。

边界：

- 不做第一人称或第三人称移动。
- 不做地图拖拽、缩放或路径导航。
- 不做任务、关卡、副本、奖励或战斗。
- 不把场景热点命名为任务。

### 7.7 TwinProjection

对应需求：

- `DT-P0-005`
- `DT-P1-002`
- `DT-P1-009`

实现方式：

- 当前抽象投影继续保留为 fallback。
- v0.2 新增风格化全身 3D AI 分身候选。
- 使用 `AvatarStyleSpec` 将用户画像映射为轮廓、材质、动作和人格色彩。
- Three.js 只负责分身展示，不承担画像计算和主流程状态。

视觉规则：

- 使用风格化全身人形、颜色、光影、轮廓和关键词表达分身。
- 不使用写实真人脸。
- 不使用可替换服装。
- 不使用换装。
- 不使用等级条。
- 不使用养成属性。
- 不使用复杂骨骼动画或游戏动作。

优先级：

- 先验证风格化全身 3D AI 分身。
- 再验证引导式 3D 梦境场景。
- 再验证梦境门打开。
- 最后回归移动端性能和内容可读性。

### 7.8 Canvas 与 Three.js 性能要求

视觉小样性能目标：

- 移动端演示时无明显卡顿。
- Canvas 2D 和 Three.js 动画只在当前页面运行。
- 离开页面后停止 `requestAnimationFrame`。
- 离开页面后释放 Three.js 的 `renderer`、`geometry`、`material` 和 `texture`。
- 控制粒子数量和模糊层级。

实现建议：

- 使用 `useEffect` 初始化和清理 Canvas / Three.js。
- 使用 `devicePixelRatio` 适配高清屏。
- 使用固定节点数量，不做复杂物理动画。
- Three.js 场景不承担点击命中和状态计算。

## 8. 样式与移动端适配

### 8.1 视觉方向

整体视觉应体现：

- 梦境空间。
- AI 分身存在感。
- 关系即将开始。
- 克制、现代、可信。

避免：

- 游戏化地图。
- 玄学占卜感。
- AI 陪伴感。
- 虚拟角色养成感。

### 8.2 移动端布局

第一版优先适配：

- 手机竖屏。
- 375px 到 430px 宽度。
- 桌面浏览器中以手机画布居中展示。

布局原则：

- 主体验区域保持 App 比例。
- 关键按钮固定在易触达区域。
- 长内容可滚动。
- 页面切换不刷新。
- 文本不能溢出或遮挡。

### 8.3 样式分层

建议样式文件职责：

- `tokens.css`：颜色、字体、间距、圆角、阴影。
- `global.css`：基础 reset、body、字体渲染。
- `layout.css`：App 壳层、页面布局、滚动区域。
- `motion.css`：页面转场、按钮反馈、呼吸动效。

## 9. Demo 数据方案

### 9.1 数据来源

第一版 Demo 数据来自 PRD 和 MVP 原型方案中已经确定的内容。

必须包含：

- 1 个用户画像。
- 1 个 AI 分身抽象投影。
- 3 个梦境节点。
- 3 条新关系预演模拟。
- 至少 1 个静态好友。
- 至少 6 个统一梦境地图场景，并可被好友共同入梦路径复用。

### 9.2 数据文件

建议创建：

```text
src/data/demoData.ts
```

导出：

```ts
export const demoProfile: UserProfile = { ... };
export const demoTwin: TwinProjection = { ... };
export const demoFriends: FriendProfile[] = [ ... ];
export const demoNodes: DreamNode[] = [ ... ];
export const demoSimulations: RelationshipSimulation[] = [ ... ];
```

数据原则：

- 稳定。
- 可复现。
- 不依赖网络。
- 不依赖用户真实输入。
- 内容质量足以路演。

### 9.3 Demo 重置

第一版需要支持重置演示。

建议方式：

- 提供隐藏或低优先级的“重新开始”操作。
- 使用 `localStorage` 模拟分身保存和 Demo 状态恢复。
- 当前实现中，刷新页面时如果已有已完成的分身状态，默认进入今日首页。
- 默认真实 App 模式隐藏顶部进度和重置；`?demo=1` / `?demo=true` / `?ux-profile-qa=...` 显示 Demo 控件。
- 点击“重新开始”清空本地 Demo 状态并回到欢迎页。
- 不持久化状态到后端，正式阶段再接账号级存储。

## 10. P0 需求映射

| 需求 ID | 技术落点 |
| --- | --- |
| `DT-P0-001` | `AppShell`、移动端布局、单页状态路由 |
| `DT-P0-002` | `demoData.ts`、`dreamtwin.ts` |
| `DT-P0-003` | `WelcomePage` |
| `DT-P0-004` | `TwinCreatePage` |
| `DT-P0-005` | `TwinGeneratingPage`、`TwinProjection` |
| `DT-P0-014` | `TwinHomePage`、`localStorage` Demo 保存、分身 Tab 管理 |
| `DT-P0-015` | `AppShell` 五区导航、`ENTER_DREAM_PLAZA`、`OPEN_FRIEND_INVITE` |
| `DT-P0-006` | `DreamLogPage` |
| `DT-P0-007` | `DreamStarMap`、`DreamNodeBadge` |
| `DT-P0-016` | `FriendInvitePage`、`SEND_DREAM_INVITE`、`SIMULATE_FRIEND_ACCEPT` |
| `DT-P0-008` | `SimulationDetailPage`、`SimulationCard` |
| `DT-P0-009` | `ENTER_DREAM` action |
| `DT-P0-010` | `WaitingPage` |
| `DT-P0-011` | `DreamGatePage` |
| `DT-P0-012` | `ChatEntryPage` |
| `DT-P0-013` | `demoFlow.ts` reducer |

P0 完成标准：

- 从欢迎页能跑到聊天入口页。
- 生成分身后能进入今日首页。
- 刷新后已创建分身的用户能回到今日首页。
- 今日 / 梦境 / 好友 / 消息 / 分身五区能切换并承接对应路径。
- 梦境节点状态能从 `unviewed` 到 `opened`。
- 关系状态能跨今日、梦境、消息、好友流转。
- 好友邀请路径能完成等待、接受、共同预演和聊天入口。
- Demo 不依赖真实接口。
- 视觉不能像静态文档。

## 11. P1 增强映射

| 需求 ID | 技术落点 |
| --- | --- |
| `DT-P1-001` | `DreamStarMap` 节点动效；Three.js 星图小样作为候选 |
| `DT-P1-002` | `TwinProjection` 光影动效；Three.js 分身小样作为候选 |
| `DT-P1-003` | `PageTransition`、`motion.css` |
| `DT-P1-004` | 节点状态视觉规则；Three.js 光门小样作为候选 |
| `DT-P1-005` | `SimulationDetailPage` 内容节奏 |
| `DT-P1-006` | 默认 Demo 数据、重置演示 |
| `DT-P1-007` | `WelcomePage` 首屏视觉 |
| `DT-P1-008` | 触控反馈、加载状态、移动端滚动 |
| `DT-P1-009` | `TwinProjection` 风格化全身 3D 分身候选；抽象投影 fallback |
| `DT-P1-010` | `GuidedDreamStage` 引导式 3D 场景舞台和热点事件 |
| `DT-P1-011` | 前端 API adapter + 后端 AI provider；双方画像和场景事件驱动模拟 |

P1 实现原则：

- 优先增强路演震撼感。
- 不引入真实后端。
- 不破坏 P0 路径稳定性。
- 不把梦境星图做成游戏地图。

## 12. 第一版不实现内容

以下内容不进入第一版技术实现：

- 登录注册。
- 真实用户关系发现系统。
- 真实好友系统。
- 通讯录导入。
- 真实邀请链接或真实消息触达。
- 后端分身持久化。
- 生产级 AI 实时生成。
- 聊天后端。
- 推送通知。
- 审核举报。
- 数据分析后台。
- Native App。
- 地图 SDK。
- 真实地理位置。
- 自由可走地图。
- 附近的人。
- 游戏关卡。
- 复杂自由 3D 世界。
- 写实数字人身体。
- 角色养成。
- 换装。
- AI 伴侣聊天。

这些内容保留在 P2，等 MVP 路径和视觉方向验证后再进入后续技术方案。

## 13. 开发顺序建议

建议按以下顺序开发：

1. 先做视觉验证小样：Canvas 2D baseline vs Three.js scene。
2. 输出背景、星图、光门三组截图或录屏。
3. 根据效果决定是否把 Three.js 纳入正式 MVP Demo。
4. 初始化 React + Vite + TypeScript 项目。
5. 建立 `dreamtwin.ts` 类型。
6. 建立 `demoData.ts` 静态数据。
7. 建立 `demoFlow.ts` reducer。
8. 搭建 `AppShell` 和移动端布局。
9. 实现欢迎页。
10. 实现 AI 分身创建页。
11. 实现 AI 分身生成页和抽象投影。
12. 实现今日首页和五区底部导航。
13. 实现分身 Tab 管理页和 `localStorage` Demo 保存。
14. 实现梦境广场 / 昨夜梦境日志页。
15. 实现梦境星图与节点点击。
16. 实现好友邀请梦境漫游页。
17. 实现消息页边界和真实聊天入口页。
18. 实现关系预演模拟详情页。
19. 实现等待对方入梦 / 等待好友入梦页。
20. 实现梦境门打开页。
21. 根据视觉验证结果补齐 Three.js 或 Canvas 2D 核心动效。
22. 做移动端浏览器验收。
23. 做路演路径录屏检查。

开发原则：

- 先跑通路径，再打磨震撼感。
- 但 P0 页面不能粗糙到像线框图。
- 每完成一个核心页面就检查移动端显示。
- Three.js 只有在视觉小样通过后才进入主 Demo。
- 不等待真实后端。

## 14. 验收与测试

### 14.1 本地命令

后续前端项目建立后，建议至少支持：

```bash
npm run dev
npm run build
npm run lint
```

如果第一版不配置 lint，也必须至少保证：

```bash
npm run build
```

如果 Three.js 小样进入验证阶段，需额外确认小样可以本地打开或通过 dev server 查看。

### 14.2 手动验收路径

必须完整跑通：

1. 打开欢迎页。
2. 进入 AI 分身创建页。
3. 使用默认 Demo 信息生成 AI 分身。
4. 进入今日首页。
5. 刷新页面后仍回到今日首页。
6. 从今日或梦境 Tab 进入梦境广场 / 昨夜梦境日志。
7. 点击梦境星图中的一个节点。
8. 查看关系预演模拟详情。
9. 点击想进入这个梦境。
10. 进入等待对方入梦页。
11. 模拟对方确认。
12. 进入梦境门打开页。
13. 进入真实聊天入口页。
14. 回到好友 Tab，进入邀请好友梦境漫游。
15. 选择好友并发送一起入梦邀请。
16. 发出 Demo 邀请并进入等待好友入梦页。
17. 模拟好友接受邀请。
18. 回到统一梦境地图选择共同场景。
19. 进入共同梦境漫游预演。
20. 进入梦境门和真实聊天入口。

### 14.3 视觉验收

必须检查：

- 手机宽度下无文本溢出。
- 关键按钮不被遮挡。
- 星图节点可点击。
- 星图状态变化可见。
- 抽象投影有存在感。
- Canvas 2D baseline 与 Three.js scene 至少有 3 组截图或录屏对比。
- Three.js 小样在背景、梦境星图、梦境门打开场景中非空白。
- 如果正式接入 Three.js，离开对应页面后动画停止并释放资源。
- 动效不卡顿。
- 页面不出现桌面网页感。

### 14.4 边界验收

必须检查：

- 没有真实地图表达。
- 没有附近的人表达。
- 没有可走地图表达。
- 没有复杂自由 3D 世界表达。
- 没有游戏关卡表达。
- 没有角色养成表达。
- 没有写实数字人身体、换装身体资产或养成身体资产表达。
- 没有换装表达。
- 没有 AI 代聊表达。
- 没有真实用户关系发现已完成的暗示。
- 没有偷偷推演好友的表达。
- 没有真实通讯录、真实邀请链接或真实消息发送。

## 15. 当前结论

DreamTwin 第一版技术实现应该是一个 React + Vite + TypeScript 的移动端 Web App-grade Demo，并在开发前通过 Three.js / WebGL Canvas 小样验证 3D 视觉是否值得正式采用。

它不是静态介绍页，而是一个可交互、可演示、可录屏、可继续开发成真实 App 的产品雏形。

技术重点不是后端复杂度，而是：

- 稳定的 Demo 数据。
- 清晰的状态流转。
- 可信的关系预演模拟。
- 有可保底的 Canvas 2D 视觉。
- 有经过对比验证后再采用的 Three.js 3D 场景增强。
- 有先看效果、再决定技术投入的视觉验证流程。
- 从 AI 关系预演走向真实聊天入口的完整闭环。
