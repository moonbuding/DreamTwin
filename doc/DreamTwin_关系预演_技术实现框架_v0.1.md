# DreamTwin 关系预演:技术实现框架 v0.1

> 配套设计:`DreamTwin_关系预演_AI分身与心理学方案_v0.1.md`。
> 本文给出**可落地的技术框架**:类型扩展、模块划分、编排管线、提示词结构、渐进式接入计划,以及"本次已接入 / 后续阶段"的边界。

---

## 1. 现状基线(已核对代码)

| 关注点 | 现状 | 文件 |
|---|---|---|
| 生成方式 | 单次 Claude 调用,固定 7 帧骨架,结构化输出 + 兜底 | [`story.service.ts`](../apps/api/src/modules/content/story.service.ts) |
| 人格输入 | **仅登录用户一方**(`loadPersona`),梦中人靠模型虚构 | `story.service.ts:66` |
| 人格模型 | 自由标签(`UserProfile`),JSONB 存储,免迁移 | [`api-types/index.ts`](../packages/api-types/src/index.ts) / [`schema.prisma`](../apps/api/prisma/schema.prisma) |
| 对手卡片 | `RelationshipCounterpartProfile` 类型已存在但**未被生成链路使用** | `api-types/index.ts:100` |
| 故事契约 | `DreamStory` / `StoryFrame`(7 帧:scene/you/ta/prop/turn/freeze/reading) | `api-types/index.ts:248` |
| 预演分析 | `/simulation/:nodeId` 返回**硬编码**结果 | [`content.controller.ts`](../apps/api/src/modules/content/content.controller.ts) |

---

## 2. 类型扩展(`packages/api-types`)

### 2.1 心理学派生层(加到 `UserProfile`,全部可选,JSONB 免迁移)
```ts
export type AttachmentStyle = "secure" | "anxious" | "avoidant" | "fearful";

export interface IfThenSignal {
  situation: string;   // 触发情境
  tendency: string;    // 倾向行为
}

export interface PersonaPsychology {
  bigFive?: {          // OCEAN,各 0–100
    openness?: number; conscientiousness?: number; extraversion?: number;
    agreeableness?: number; neuroticism?: number;
  };
  attachmentStyle?: AttachmentStyle;     // 依恋类型
  dealbreakers?: string[];               // 红线
  loveLanguages?: string[];              // 爱的语言(优先在前)
  conflictStyle?: string;                // 竞争/合作/妥协/回避/迁就
  emotionRegulation?: string;            // 重评/抑制/宣泄/回避
  ifThenSignals?: IfThenSignal[];        // CAPS 情境签名
  voiceSamples?: string[];               // 语气/口头禅样本(few-shot)
}

// UserProfile 末尾新增:
//   psychology?: PersonaPsychology;
```
> 设计要点:**加法**——不动现有字段;`psychology` 缺省即退化为现状行为。`source/confidence` 在 v0.1 先省略(后续派生器引入时再加 `PersonaField<T>` 包装)。

### 2.2 渲染产物(可选,便于调试/缓存)
渲染后的 persona 文本不入库,运行时拼接即可;无需新类型。

---

## 3. 模块划分(`apps/api/src/modules/content`)

```
content/
├─ story.service.ts          # 编排入口(改造:双卡片 + 渲染器 + 可选监管)
├─ persona-card.ts           # 【新】卡片渲染器:Profile/Counterpart → persona 文本
├─ dream-stories.data.ts     # 不变:场景模板 + 固定脚本(few-shot/兜底)
└─ (后续) rehearsal/         # 阶段 2+:director / actor / critic 拆分
```

### 3.1 `persona-card.ts`(本次新增,卡片渲染器)
职责:把结构化卡片渲染成**情境化、带语气样本**的 persona 文本(对应方案的"卡片渲染器")。
```ts
export function renderPersonaCard(p: UserProfile): string;
export function renderCounterpartCard(c: RelationshipCounterpartProfile): string;
```
渲染规则(把 Part A 的杠杆落进文本):
- 基础标签:性格 / 沟通 / 价值观 / 兴趣 / 叙事信号。
- 派生层:OCEAN 高低维 → 自然语言;依恋类型 → 亲密情境倾向;conflictStyle/loveLanguages/emotionRegulation。
- **if-then 签名**逐条列为"情境→倾向"。
- **语气样本**作为 few-shot:"这个人会这样说话:…"。
- 缺失维度**不编造**,留白。

### 3.2 `story.service.ts` 改造(本次)
- `loadPersona` → 调 `renderPersonaCard`,产出更丰富的「你的分身」。
- 新增 `loadCounterpartCard(...)` 接缝:当可解析到对手卡片(`RelationshipCounterpartProfile`)时渲染「梦中人」;否则按现有铁律保持 TA 轻描淡写、不虚构事实。
- `generate(scene, you, ta?)`:userPrompt 注入**两方人格**;`SYSTEM_PROMPT` 升级为"双卡片驱动:you 帧由你的卡片驱动、ta 帧由梦中人卡片驱动"。
- 兜底、`sanitizeFrames`、7 帧骨架、结构化输出**全部保持不变**。

> ⚠️ 对手卡片的**数据来源**(DreamNode→对手身份→Profile/Plaza/Friend)目前未在 schema 打通(`DreamNode` 无对手字段,`/simulation` 仍硬编码)。因此 v0.1 先建好**渲染器 + 入参接缝**,真实对手取数随匹配/预演数据层一起落地(见 §6 阶段 3)。

---

## 4. 编排管线(目标态,阶段 2+)

```
getStory(nodeId, userId, counterpart?)
  → 场景模板(SceneTemplate)
  → renderPersonaCard(you)  /  renderCounterpartCard(ta)
  → [导演] 选张力点(可先用固定 beats)
  → [对戏] 单次结构化生成 7 帧(you/ta 各由各自卡片驱动)
  → [监管/校验] 按两卡片判 OOC/红线/理想化 → 不过则带理由重生成 1 次   # 阶段 2,可灰度
  → sanitizeFrames(7 帧顺序校验)
  → 成稿 DreamStory(source:'ai')   |  任一步失败 → getFixedStory 兜底
```

**监管校验(阶段 2)接口草案**:
```ts
interface CritiqueResult {
  ok: boolean;
  issues: Array<{ frame: number; type: 'ooc'|'violation'|'idealized'; who: 'you'|'ta'; reason: string }>;
}
// critique(frames, youCard, taCard): Promise<CritiqueResult>
// ok=false → 把 issues 作为反馈拼进 userPrompt,重生成一次(max 1 retry,控成本/延迟)
```
- 成本/延迟控制:监管仅在生成成功后跑一次;重试上限 1;用 `effort:'low'`;可由 `REHEARSAL_CRITIC=on` 灰度。

---

## 5. 提示词结构(双卡片驱动,升级现有 SYSTEM_PROMPT)

在现有 6 条铁律基础上增改:
- 「you 帧/turn 帧的『你的分身』台词与动作,严格由**「你的分身」卡片**驱动;ta 帧/turn 帧的『TA』由**「梦中人」卡片**驱动。」
- 「**两人都不是完人**:允许出现迟疑、防御、误读、不够体面的小瞬间——比"句句得体"更真实。」(反理想化)
- 「卡片没写的,**不要编造**为既定事实;可表现为不确定/留白。」(延续铁律 5,强化校准)
- 保留:7 帧骨架/字数/低风险/非判决/不取真名/只输出 schema JSON。

userPrompt 注入顺序:`场景 → 节拍骨架 → 「你的分身」卡片 → 「梦中人」卡片 → 同场景固定脚本(风格参考)`。

---

## 6. 渐进式接入计划

| 阶段 | 内容 | 风险 | 状态 |
|---|---|---|---|
| 0 | 单 prompt + 一方人格 + 兜底 | — | 已存在 |
| **1** | 心理学派生层类型 + `persona-card.ts` 渲染器 + `story.service` 用渲染器 + 双卡片入参接缝 + SYSTEM_PROMPT 升级 | 低(加法、可兜底、typecheck 可验) | **本次接入** |
| 2 | 监管/校验一次重生成(灰度开关) | 中(+1 次调用,延迟/成本) | 待排期 |
| 3 | 打通对手取数(DreamNode↔对手身份)+ `/simulation` 接真实预演分析(契合/摩擦评分,复用 `RelationshipSimulationResult`) | 中高(依赖匹配数据层) | 待排期 |
| 4 | 派生器:标签/聊天/问卷 → `psychology`(带 confidence)+ 版本化 | 中 | 待排期 |

---

## 7. 验证

- **静态**:`pnpm --filter @dreamtwin/api typecheck` + `pnpm --filter @dreamtwin/api-types build`(类型扩展 + 渲染器编译通过)。
- **运行**:本地起 api(`pnpm api:dev`,需 `DATABASE_URL`;`ANTHROPIC_API_KEY` 可选——无 key 自动兜底固定脚本,链路仍通)。`GET /story/:nodeId` 返回 `source:'ai'|'fixed'`。
- **质量**:对 seed 用户(小梦)补 `psychology` 字段后对比生成,人工核对语气样本是否进戏、是否更贴人设。

---

## 8. 兼容性与边界

- **零迁移**:`psychology` 走 JSONB,老 `Profile.data` 无该字段时渲染器自动跳过。
- **兜底不退化**:任何新逻辑失败都回落现有固定脚本,前端 `useDreamStory` 无感。
- **不引入新依赖**:复用 `@anthropic-ai/sdk`、NestJS、现有结构化输出。
- **安全**:延续"低风险、观察非判决、不取真名、不编造现实事实"铁律;`dealbreakers` 进入监管红线。
