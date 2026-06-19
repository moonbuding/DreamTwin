# DreamTwin App 后端与 AI 架构 v0.1

> 文档状态：真实 App 后端与 AI 架构基准版
> 当前定位：静态移动端 Web Demo 之后的 App 落地方案
> 上游文档：`doc/DreamTwin_产品说明书_v0.1.md`、`doc/DreamTwin_PRD_v0.1.md`、`doc/DreamTwin_需求池_v0.1.md`、`doc/DreamTwin_技术方案_v0.1.md`

## 1. 架构目标

本方案把 DreamTwin 从“纯前端静态 Demo”推进到“真实 App 可落地架构”。

下一阶段不急着部署公开 Demo，也不直接接大模型 API，而是先设计真实 App 需要的后端、数据、AI 生成和关系边界。

真实 App 的核心闭环是：

1. 用户注册 / 登录。
2. 创建并保存 AI 分身。
3. 进入梦境广场，获取 AI 生成的关系预演入口。
4. 邀请好友进入梦境漫游。
5. 双方确认后打开梦境门。
6. 进入真实聊天，AI 不代替用户聊天。

核心原则：

- API key 不放前端，必须走后端服务或 serverless proxy。
- AI 只生成关系预演、风险提示和第一句话建议，不替用户发送真实消息。
- 好友关系必须先邀请、再共同预演，不支持用户单方面偷偷分析好友。
- 梦境门是双向确认边界，未确认前不能打开真实聊天。
- 当前前端 Demo 保留为体验基准，后续逐步替换静态数据。

### 1.1 v0.2 架构补充

下一阶段后端与 AI 架构需要支持 **风格化全身 3D AI 分身、引导式 3D 梦境场景、双方画像驱动的关系模拟**。

关键变化：

- AI 分身不仅保存摘要和关键词，也保存可渲染的 `AvatarStyleSpec`，用于前端生成风格化 3D 分身。
- 用户画像允许包含 MBTI、血型、星座、玄学标签等自愿填写的叙事信号，但不作为科学预测或命运判断。
- 关系预演生成必须读取双方分身画像、当前梦境场景事件和关系目标。
- 3D 梦境场景只保存场景类型与引导事件，不保存可走地图、关卡或任务系统。

## 2. 后端模块

### 2.1 账号与用户资料

负责真实用户身份、基础资料和授权信息。

需要支持：

- 注册 / 登录 / 退出。
- 获取当前用户。
- 保存昵称、兴趣、关系意图、表达风格、社交节奏等画像信息。
- 记录用户是否完成 AI 分身创建。

边界：

- 账号系统只负责身份和权限。
- 不把 AI 分身当作账号本身。
- 不在前端保存长期敏感身份凭证。

### 2.2 AI 分身与版本

负责保存用户 AI 分身的人格投影。

需要支持：

- 创建 AI 分身。
- 获取当前分身。
- 更新分身资料。
- 保存分身版本，用于后续比较生成质量和恢复历史。

AI 分身应包含：

- 昵称。
- 人格摘要。
- 关键词。
- 表达风格。
- 关系偏好。
- 可视化投影参数。
- 风格化 3D 分身展示参数。
- 生成版本。

边界：

- AI 分身不是 AI 伴侣。
- AI 分身不主动聊天。
- AI 分身不代表用户向真人发送消息。
- AI 分身不是换装或养成资产。

### 2.3 关系预演生成任务

负责调用大模型，生成梦境节点和关系预演内容。

建议采用异步任务：

1. 前端提交生成请求。
2. 后端创建 `GenerationJob`。
3. 后端调用 AI provider。
4. 生成结果经过结构化校验和安全检查。
5. 前端轮询或订阅任务状态。

生成内容包括：

- 关系假设。
- 梦境场景。
- 引导式场景事件。
- 双方分身画像快照。
- 关系目标。
- 可能对话。
- 可能行为。
- 关系走势。
- 恋爱可能。
- 风险与不好走向。
- 建议第一步。
- 可编辑第一句话建议。

边界：

- 不生成承诺性结论，例如“你们一定会恋爱”。
- 不生成操控、PUA、骚扰、越界表达。
- 不替用户写成已发送消息。
- 不把关系预演包装成心理诊断或命运判断。
- 不把 MBTI、血型、星座或玄学标签包装成确定性结论。

### 2.4 梦境广场与梦境节点

负责新关系发现路径。

梦境广场展示 AI 生成的关系预演入口，每个入口对应一个 `DreamNode` 和一个 `RelationshipSimulation`。

需要支持：

- 获取用户可见的梦境节点列表。
- 获取单个节点的关系预演结果。
- 标记节点已查看。
- 标记用户想进入这个梦境。

边界：

- 梦境广场不是真实地图。
- 不做附近的人。
- 不做自由可走地图、地图拖拽、地图缩放或游戏关卡。
- 梦境节点服务关系预演入口，不服务玩法探索。

### 2.5 好友邀请与共同梦境漫游

负责已有好友关系推进路径。

真实流程必须是：

1. 用户选择好友。
2. 用户选择共同梦境场景。
3. 后端创建邀请。
4. 好友接受后，后端才生成或开放共同预演。
5. 双方都能看到同一份共同梦境漫游结果。

需要支持：

- 创建邀请。
- 查看邀请状态。
- 接受 / 拒绝 / 撤回邀请。
- 基于已接受邀请创建共同预演任务。

边界：

- 不支持用户手动输入一个人的资料并偷偷预演。
- 好友未接受前，不展示双方关系结论。
- 邀请文案不能替用户表达暧昧或关系意图。

### 2.6 梦境门与双向确认

负责真实聊天入口的开启条件。

梦境门打开条件：

- 梦境节点或邀请存在。
- 双方都完成确认。
- 关系预演已生成并可查看。
- 内容安全检查通过。

状态建议：

- `locked`：未满足打开条件。
- `waiting`：一方已确认，等待另一方。
- `opened`：双方已确认，可以进入聊天。
- `closed`：任一方撤回、拒绝或过期。

边界：

- 只要梦境门未打开，就不能创建真实聊天会话。
- 梦境门打开不代表恋爱成立，只代表双方愿意进入真实互动。

### 2.7 聊天会话边界

负责双方确认后的真实聊天。

需要支持：

- 创建聊天会话。
- 收发用户消息。
- 读取历史消息。
- 标记已读。

AI 可以提供：

- 第一句话建议。
- 风险提醒。
- 语气建议。

AI 不可以：

- 自动替用户发送消息。
- 扮演对方。
- 假装对方已回应。
- 在聊天中诱导用户越界。

### 2.8 内容安全与生成约束

所有 AI 生成结果必须经过内容边界检查。

需要检查：

- 个人隐私泄露。
- 未经同意的关系推断。
- 操控式恋爱建议。
- 骚扰、胁迫、跟踪、越界。
- 心理诊断、命运判断、绝对化承诺。
- 对未成年或高风险关系的处理。

安全策略：

- 高风险内容不生成具体行动建议。
- 中风险内容给出克制建议和边界提醒。
- 生成失败时展示可解释的安全 fallback，不展示模型错误。

## 3. 数据模型方向

### 3.1 User

```ts
interface User {
  id: string;
  authProvider: "phone" | "email" | "oauth";
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 UserProfile

```ts
interface UserProfile {
  id: string;
  userId: string;
  nickname: string;
  personalityKeywords: string[];
  relationshipIntention: string;
  interests: string[];
  expressionStyle: string;
  socialPace: string;
  optionalSignals: string[];
  mbti?: string;
  bloodType?: string;
  zodiac?: string;
  mysticTags?: string[];
  communicationStyle?: string[];
  values?: string[];
  updatedAt: string;
}
```

### 3.3 TwinProjection

```ts
interface TwinProjection {
  id: string;
  userId: string;
  profileId: string;
  version: number;
  nickname: string;
  summary: string;
  keywords: string[];
  colorPalette: string[];
  lightShape: "halo" | "mist" | "pulse" | "orbit";
  avatarStyleSpec?: AvatarStyleSpec;
  generatedBy: string;
  createdAt: string;
}
```

### 3.3.1 AvatarStyleSpec

```ts
interface AvatarStyleSpec {
  silhouette: "soft-human" | "crystal-human" | "shadow-human" | "light-human";
  materialTone: "mist" | "glass" | "stardust" | "neon";
  motionStyle: "calm-breath" | "curious-turn" | "warm-idle";
  auraColor: string[];
  boundaryTags: Array<"no-real-face" | "no-outfit-swap" | "no-leveling" | "no-companion-mode">;
}
```

### 3.4 DreamNode

```ts
interface DreamNode {
  id: string;
  ownerUserId: string;
  simulationId: string;
  entryMode: "overnight_discovery" | "friend_invite";
  title: string;
  status: "unviewed" | "viewed" | "waiting" | "opened" | "closed";
  visualTone: string;
  sceneStageVariant?: SceneStageVariant;
  createdAt: string;
}
```

### 3.4.1 GuidedSceneEvent

```ts
type SceneStageVariant =
  | "rain_store"
  | "starlight"
  | "undersea"
  | "sushi"
  | "cinema"
  | "badminton";

interface GuidedSceneEvent {
  id: string;
  label: string;
  prompt: string;
  hotspot: "foreground" | "midground" | "background" | "gate";
}
```

### 3.5 RelationshipSimulation

```ts
interface RelationshipSimulation {
  id: string;
  entryMode: "overnight_discovery" | "friend_invite";
  initiatorUserId: string;
  counterpartUserId?: string;
  inviteId?: string;
  scene: string;
  conclusion: string;
  attractionScore: number;
  paceScore: number;
  riskScore: number;
  likelyDialogue: string[];
  behaviorPreview: string[];
  relationshipTrajectory: string[];
  romancePossibility: string;
  conflictRisk: string;
  badOutcomeScenario: string;
  suggestedMove: string;
  possibleFirstLine: string;
  selfProfileSnapshot?: UserProfile;
  counterpartProfileSnapshot?: UserProfile;
  guidedSceneEvents?: GuidedSceneEvent[];
  relationshipGoal?: string;
  safetyStatus: "passed" | "limited" | "blocked";
  createdAt: string;
}
```

### 3.6 DreamInvite

```ts
interface DreamInvite {
  id: string;
  inviterUserId: string;
  inviteeUserId: string;
  sceneId: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "withdrawn" | "expired";
  messagePreview: string;
  createdAt: string;
  respondedAt?: string;
}
```

### 3.7 DreamGate

```ts
interface DreamGate {
  id: string;
  simulationId: string;
  initiatorConfirmedAt?: string;
  counterpartConfirmedAt?: string;
  status: "locked" | "waiting" | "opened" | "closed";
  openedAt?: string;
}
```

### 3.8 ChatSession

```ts
interface ChatSession {
  id: string;
  dreamGateId: string;
  participantUserIds: string[];
  status: "active" | "archived" | "blocked";
  createdAt: string;
}
```

## 4. 第一批接口方向

接口命名可在正式后端技术选型后调整。第一版方向如下：

### 4.1 分身与资料

- `GET /api/me`
- `GET /api/me/profile`
- `PATCH /api/me/profile`
- `POST /api/twins`
- `GET /api/me/twin`
- `PATCH /api/twins/:twinId`

### 4.2 梦境广场与关系预演

- `GET /api/dream-plaza/nodes`
- `POST /api/dream-plaza/generate`
- `GET /api/dream-nodes/:nodeId`
- `POST /api/dream-nodes/:nodeId/view`
- `POST /api/simulations`
- `GET /api/simulations/:simulationId`
- `GET /api/generation-jobs/:jobId`

### 4.3 好友邀请

- `GET /api/friends`
- `POST /api/dream-invites`
- `GET /api/dream-invites/:inviteId`
- `POST /api/dream-invites/:inviteId/accept`
- `POST /api/dream-invites/:inviteId/reject`
- `POST /api/dream-invites/:inviteId/withdraw`

### 4.4 梦境门与聊天

- `POST /api/dream-gates/:gateId/confirm`
- `GET /api/dream-gates/:gateId`
- `POST /api/chat-sessions`
- `GET /api/chat-sessions/:sessionId`
- `POST /api/chat-sessions/:sessionId/messages`
- `GET /api/chat-sessions/:sessionId/messages`

接口边界：

- `POST /api/chat-sessions` 必须校验梦境门状态为 `opened`。
- 消息发送接口只接受用户提交的消息，不接受 AI 自动发送。
- AI 生成接口只返回预演内容和建议，不直接创建聊天消息。

## 5. AI 生成架构

### 5.1 生成入口

AI 生成只允许从后端触发：

- 创建 AI 分身摘要。
- 生成梦境广场节点。
- 生成关系预演结果。
- 生成共同梦境漫游结果。
- 生成第一句话建议。

前端只能提交业务请求，不能直接调用 AI provider。

### 5.2 AI provider 与密钥管理

第一版真实生成可先接 DeepSeek 作为 AI provider，但必须通过后端封装。

密钥管理规则：

- 使用服务端环境变量 `DEEPSEEK_API_KEY`。
- 不把 API key 写入前端代码。
- 不把 API key 写入仓库、文档、提交记录或构建产物。
- 不通过浏览器请求直接调用 DeepSeek。
- 后端对外只暴露 DreamTwin 业务接口，不暴露 provider 原始接口。

后续如需切换模型，应通过 provider adapter 完成，不影响前端页面和核心数据结构。

### 5.3 生成任务状态

```ts
type GenerationJobStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "blocked";
```

状态含义：

- `queued`：任务已创建，等待执行。
- `running`：正在调用模型。
- `succeeded`：生成成功且安全检查通过。
- `failed`：系统错误或模型输出不可用。
- `blocked`：内容安全策略阻断。

### 5.4 生成输出约束

模型输出必须结构化，至少包含：

- 一句话结论。
- 三个指标：吸引、推进、风险。
- 可能会聊什么。
- 可能会做什么。
- 关系走势。
- 恋爱可能。
- 冲突风险。
- 不好走向。
- 建议第一步。
- 第一句话建议。
- 安全提示。

输出不允许：

- 绝对化预测。
- 伪造对方真实想法。
- 替用户表达关系意图。
- 生成越界行动建议。

## 6. 前端迁移策略

当前前端 Demo 不需要一次性重写。

建议迁移顺序：

1. 保留现有 `demoData` 作为 fallback。
2. 新增 API adapter，把静态数据读取封装成可替换的数据层。
3. 先替换 AI 分身保存：`localStorage` -> 后端用户分身。
4. 再替换梦境广场节点：静态节点 -> 后端生成节点。
5. 再替换好友邀请：静态状态 -> 真实邀请状态。
6. 最后替换聊天入口：静态回执 -> 真实聊天会话。

迁移原则：

- 页面路径不大改。
- 组件继续复用。
- 先让真实数据长得像当前静态数据。
- 不为了接后端牺牲当前 C 端体验。

## 7. 开发阶段建议

### 阶段 A：后端基础

- 选定后端运行方式。
- 建立数据库 schema。
- 完成账号与用户资料。
- 完成 AI 分身 CRUD。

### 阶段 B：AI 生成骨架

- 建立 server-side AI provider 调用层。
- 建立生成任务表和任务状态。
- 完成分身摘要生成。
- 完成关系预演生成的结构化输出校验。

### 阶段 C：关系闭环

- 完成梦境广场节点生成。
- 完成好友邀请状态。
- 完成梦境门双向确认。
- 完成聊天会话创建。

### 阶段 D：前端接入

- 将静态 Demo 数据逐步替换成 API adapter。
- 保留 Demo fallback。
- 做端到端路径测试。

## 8. 验收标准

架构设计完成后必须能回答：

- 用户分身保存在哪里。
- API key 如何保护。
- AI 生成如何异步完成。
- 梦境广场节点如何从真实数据生成。
- 好友邀请如何避免单方面偷偷推演。
- 梦境门如何保证双向确认。
- 聊天入口如何保证 AI 不代替用户聊天。
- 当前前端 Demo 如何逐步迁移到真实数据。

第一版后端实现完成后必须跑通：

1. 用户登录后创建并保存 AI 分身。
2. 用户刷新后仍能看到自己的 AI 分身主页。
3. 用户获取至少一条 AI 生成的梦境节点。
4. 用户查看一条关系预演模拟。
5. 用户创建好友梦境漫游邀请。
6. 好友接受后共同预演可见。
7. 双方确认后梦境门打开。
8. 梦境门打开后才能创建聊天会话。

## 9. 结论

DreamTwin 下一阶段不应急着部署，也不应直接把 API key 接进前端。

正确路线是：先把真实 App 的后端、AI 生成、邀请确认和聊天边界设计清楚，再把当前静态 Demo 逐步迁移为真实数据驱动的 App。

这一阶段的重点不是路演速度，而是避免把静态 Demo 的临时结构固化成错误的长期架构。
