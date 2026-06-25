import Anthropic from '@anthropic-ai/sdk';

// 轻量 LLM provider 抽象:让生成/监管统一调 generateJson,按 LLM_PROVIDER 切换。
// - anthropic:走 @anthropic-ai/sdk(adaptive 思考 + json_schema 结构化输出),项目默认。
// - deepseek :走 OpenAI 兼容接口(response_format: json_object),用 DEEPSEEK_API_KEY。
// 任一路径失败/拒答返回 null(调用方据此回落固定脚本/保底)。

type JsonSchema = Record<string, unknown>;

export interface GenerateJsonParams {
  system: string;
  user: string;
  schema: JsonSchema; // anthropic 用其强约束;deepseek 仅靠 prompt 描述形状(此参在 deepseek 路径忽略)
  maxTokens: number;
  temperature?: number; // 主要供 deepseek;anthropic 路径忽略(用 thinking/effort)
}

const PROVIDER = (
  process.env.LLM_PROVIDER ??
  (process.env.DEEPSEEK_API_KEY ? 'deepseek' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'none')
).toLowerCase();

const ANTHROPIC_MODEL = process.env.STORY_MODEL ?? 'claude-opus-4-8';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat';
const DEEPSEEK_BASE = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  anthropic ??= new Anthropic();
  return anthropic;
}

// 当前 provider 是否具备可用凭据;否则调用方直接走兜底(不发请求)。
export function llmEnabled(): boolean {
  if (PROVIDER === 'deepseek') return !!process.env.DEEPSEEK_API_KEY;
  if (PROVIDER === 'anthropic') return !!process.env.ANTHROPIC_API_KEY;
  return false;
}

export function llmProvider(): string {
  return PROVIDER;
}

// 返回原始 JSON 文本;拒答/无凭据返回 null;网络/HTTP 错误抛出由调用方 try/catch 兜底。
export async function generateJson(params: GenerateJsonParams): Promise<string | null> {
  if (PROVIDER === 'deepseek') return deepseekJson(params);
  if (PROVIDER === 'anthropic') return anthropicJson(params);
  return null;
}

async function anthropicJson({ system, user, schema, maxTokens }: GenerateJsonParams): Promise<string | null> {
  const client = getAnthropic();
  if (!client) return null;
  // output_config / adaptive 是较新的 API 字段,当前 SDK 类型未覆盖,故以运行时形态传入。
  const req = {
    model: ANTHROPIC_MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: user }],
  } as unknown as Anthropic.MessageCreateParamsNonStreaming;

  const response = await client.messages.create(req);
  if ((response.stop_reason as string) === 'refusal') return null;
  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text : null;
}

async function deepseekJson({ system, user, maxTokens, temperature }: GenerateJsonParams): Promise<string | null> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
      temperature: temperature ?? 0.8,
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? null;
}
