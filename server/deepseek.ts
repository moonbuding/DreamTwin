import { createDefaultTwin, defaultRelationshipSimulation } from "./defaults.js";
import type {
  AvatarStyleSpec,
  GenerationJob,
  RelationshipSimulationInput,
  RelationshipSimulationResult,
  TwinProjection,
  UserProfile,
} from "./types.js";

const deepSeekEndpoint = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/chat/completions";
const deepSeekModel = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

export class MissingApiKeyError extends Error {
  constructor() {
    super("Set DEEPSEEK_API_KEY on the server to enable AI generation.");
    this.name = "MissingApiKeyError";
  }
}

export class AiOutputParseError extends Error {
  constructor() {
    super("AI provider returned output that could not be parsed as JSON.");
    this.name = "AiOutputParseError";
  }
}

function createJob(type: GenerationJob["type"], status: GenerationJob["status"], errorCode?: string): GenerationJob {
  const now = new Date().toISOString();
  return {
    id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    status,
    createdAt: now,
    completedAt: status === "succeeded" || status === "blocked" || status === "failed" ? now : undefined,
    errorCode,
  };
}

function getApiKey(): string {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();
  return apiKey;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(jsonText);
  } catch {
    const firstBrace = jsonText.indexOf("{");
    const lastBrace = jsonText.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(jsonText.slice(firstBrace, lastBrace + 1));
      } catch {
        throw new AiOutputParseError();
      }
    }
    throw new AiOutputParseError();
  }
}

async function requestDeepSeekJson(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const response = await fetch(deepSeekEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: deepSeekModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`DeepSeek request failed: ${response.status} ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek returned an empty response.");
  return extractJson(content);
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length ? items : fallback;
}

function asScore(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function asEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function asHexColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  return /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim() : fallback;
}

function sanitizeAvatarStyleSpec(value: unknown, fallback: AvatarStyleSpec): AvatarStyleSpec {
  const raw = value && typeof value === "object" ? (value as Partial<AvatarStyleSpec>) : {};
  return {
    silhouette: asEnum(raw.silhouette, ["full_body_luminous", "abstract_projection"], fallback.silhouette),
    posture: asEnum(raw.posture, ["reserved", "open", "curious", "grounded"], fallback.posture),
    material: asEnum(raw.material, ["glass-light", "mist-light", "star-thread"], fallback.material),
    auraColor: asHexColor(raw.auraColor, fallback.auraColor),
    secondaryColor: asHexColor(raw.secondaryColor, fallback.secondaryColor),
    accentColor: asHexColor(raw.accentColor, fallback.accentColor),
    motionSignature: asEnum(raw.motionSignature, ["slow_orbit", "soft_pulse", "spark_drift"], fallback.motionSignature),
    keywords: asStringArray(raw.keywords, fallback.keywords).slice(0, 5),
  };
}

function asHexColorPalette(value: unknown, fallback: string[]): string[] {
  const raw = asStringArray(value, fallback);
  return [0, 1, 2].map((index) => asHexColor(raw[index], fallback[index] ?? "#f4f7ff"));
}

export async function generateTwinSummary(profile: UserProfile): Promise<{ job: GenerationJob; twin: TwinProjection }> {
  const fallback = createDefaultTwin(profile);
  const fallbackAvatarStyle = fallback.avatarStyleSpec as AvatarStyleSpec;
  const systemPrompt = [
    "You generate DreamTwin AI twin projections for a C-side relationship rehearsal app.",
    "Return strict JSON only.",
    "The twin can include a stylized full-body luminous personality silhouette for visual rendering.",
    "It must not be a realistic human, face, clothing, dress-up item, companion, roleplay character, or agent that sends messages.",
    "Avatar style fields are rendering hints only; they describe personality projection, not identity certainty or a game character.",
  ].join("\n");
  const userPrompt = JSON.stringify({
    task: "Create an AI twin projection from this user profile.",
    profile,
    requiredJsonShape: {
      summary: "one concise Chinese sentence",
      keywords: ["3-5 Chinese tags"],
      colorPalette: ["3 hex colors"],
      lightShape: "halo | mist | pulse | orbit",
      avatarStyleSpec: {
        silhouette: "full_body_luminous | abstract_projection",
        posture: "reserved | open | curious | grounded",
        material: "glass-light | mist-light | star-thread",
        auraColor: "#hex color",
        secondaryColor: "#hex color",
        accentColor: "#hex color",
        motionSignature: "slow_orbit | soft_pulse | spark_drift",
        keywords: ["3-5 short Chinese visual/personality tags"],
      },
    },
  });

  const raw = (await requestDeepSeekJson(systemPrompt, userPrompt)) as Partial<TwinProjection>;
  const lightShapes = ["halo", "mist", "pulse", "orbit"] as const;
  const requestedLightShape = raw.lightShape as (typeof lightShapes)[number] | undefined;
  const lightShape = requestedLightShape && lightShapes.includes(requestedLightShape) ? requestedLightShape : fallback.lightShape;
  const colorPalette = asHexColorPalette(raw.colorPalette, fallback.colorPalette);

  return {
    job: createJob("twin_summary", "succeeded"),
    twin: {
      ...fallback,
      summary: typeof raw.summary === "string" ? raw.summary : fallback.summary,
      keywords: asStringArray(raw.keywords, fallback.keywords),
      colorPalette,
      lightShape,
      avatarStyleSpec: sanitizeAvatarStyleSpec(raw.avatarStyleSpec, {
        ...fallbackAvatarStyle,
        auraColor: colorPalette[0] ?? fallbackAvatarStyle.auraColor,
        secondaryColor: colorPalette[1] ?? fallbackAvatarStyle.secondaryColor,
        accentColor: colorPalette[2] ?? fallbackAvatarStyle.accentColor,
      }),
      version: fallback.version + 1,
    },
  };
}

export async function generateRelationshipSimulation(input: RelationshipSimulationInput): Promise<{
  job: GenerationJob;
  simulation: RelationshipSimulationResult;
}> {
  const systemPrompt = [
    "You generate DreamTwin relationship simulation results in Chinese.",
    "Return strict JSON only.",
    "Do not make absolute predictions, do not impersonate the other person, and do not send messages for the user.",
    "DreamTwin is Relationship Preview, not matching. Never output or imply: 匹配度, 天生一对, 注定相遇, 最适合的人, 灵魂伴侣, 命中注定.",
    "Use uncertainty language for every relationship conclusion: 可能, 或许, 倾向于, 有机会. Avoid absolute Chinese words such as 一定, 必然, 注定, 肯定.",
    "Use both people's profile snapshots, the guided scene event, and the relationship goal as the simulation basis.",
    "Only use explicit fields supplied in the two profiles, including personalityKeywords, appearanceTags, education, interests, communicationStyle, values, and optionalSignals.",
    "If appearanceTags, education, or other profile fields are missing, say the basis is limited; never invent missing labels, education, appearance, identity, private history, or verified facts.",
    "Use sceneStageSpec as a fixed guided stage: visual tone, spatial metaphor, and relationship trigger only.",
    "Do not turn the scene into a walkable map, quest, game level, or fictional roleplay plot.",
    "Treat MBTI, zodiac, blood type, and mystic tags only as narrative signals, never as scientific prediction.",
    "Focus on possible resonance, possible conflict, possible development direction, safe topics, and a low-pressure first action.",
    "If the basis is insufficient, say the basis is limited instead of inventing psychology, relationship results, or private memories.",
  ].join("\n");
  const sceneEvent = input.sceneEvent ?? input.guidedSceneEvents?.[0];
  const userPrompt = JSON.stringify({
    task: "Generate a structured relationship rehearsal result.",
    selfProfile: input.profile,
    counterpartName: input.counterpartName ?? "对方",
    counterpartProfile: input.counterpartProfile ?? {
      name: input.counterpartName ?? "对方",
      personalityKeywords: [],
      interests: [],
    },
    scene: input.scene ?? "梦境广场中的一次低压相遇",
    sceneStageSpec: input.sceneStageSpec,
    selectedSceneEvent: sceneEvent,
    guidedSceneEvents: input.guidedSceneEvents ?? [],
    relationshipGoal: input.relationshipGoal ?? input.profile.relationshipIntention,
    constraints: [
      "Use the provided counterpartName and scene in the generated content.",
      "Base every preview on the provided selfProfile and counterpartProfile fields. Missing fields must be treated as unknown, not guessed.",
      "Reflect sceneStageSpec.visualTone, sceneStageSpec.spatialMetaphor, and sceneStageSpec.relationTrigger without describing free movement.",
      "Reflect the selectedSceneEvent and relationshipGoal in conclusion, dialogue, behavior, and suggestedMove.",
      "Use counterpartProfile only as a hypothetical profile snapshot supplied by the product, not as verified truth.",
      "Do not copy placeholder text from the schema.",
      "Keep the tone warm, specific, C-side, and action-oriented.",
      "Do not present any score as matching quality, destiny, or relationship certainty.",
      "possibleFirstLine must be editable, low-pressure, and sent by the user personally; it must not pretend a real shared memory already happened.",
      "suggestedMove must reduce social pressure and leave the other person an easy exit.",
      "Use Chinese for all user-visible fields.",
    ],
    requiredJsonShape: {
      conclusion: "one concrete sentence about how this relationship may start",
      attractionScore: "number 0-100",
      paceScore: "number 0-100",
      riskScore: "number 0-100",
      likelyDialogue: ["2-4 possible dialogue beats"],
      behaviorPreview: ["2-4 possible behavior beats"],
      relationshipTrajectory: ["3 short phases"],
      romancePossibility: "one grounded romance possibility, no absolute prediction",
      conflictRisk: "one concrete conflict risk",
      badOutcomeScenario: "one plausible bad path if the interaction goes wrong",
      suggestedMove: "one safe next action the user can take",
      possibleFirstLine: "one editable first message suggestion",
      safetyHint: "one boundary reminder that AI does not represent the other person's real promise",
    },
  });

  const raw = (await requestDeepSeekJson(systemPrompt, userPrompt)) as Partial<RelationshipSimulationResult>;

  return {
    job: createJob("relationship_simulation", "succeeded"),
    simulation: {
      conclusion: typeof raw.conclusion === "string" ? raw.conclusion : defaultRelationshipSimulation.conclusion,
      attractionScore: asScore(raw.attractionScore, defaultRelationshipSimulation.attractionScore),
      paceScore: asScore(raw.paceScore, defaultRelationshipSimulation.paceScore),
      riskScore: asScore(raw.riskScore, defaultRelationshipSimulation.riskScore),
      likelyDialogue: asStringArray(raw.likelyDialogue, defaultRelationshipSimulation.likelyDialogue),
      behaviorPreview: asStringArray(raw.behaviorPreview, defaultRelationshipSimulation.behaviorPreview),
      relationshipTrajectory: asStringArray(raw.relationshipTrajectory, defaultRelationshipSimulation.relationshipTrajectory),
      romancePossibility:
        typeof raw.romancePossibility === "string"
          ? raw.romancePossibility
          : defaultRelationshipSimulation.romancePossibility,
      conflictRisk: typeof raw.conflictRisk === "string" ? raw.conflictRisk : defaultRelationshipSimulation.conflictRisk,
      badOutcomeScenario:
        typeof raw.badOutcomeScenario === "string"
          ? raw.badOutcomeScenario
          : defaultRelationshipSimulation.badOutcomeScenario,
      suggestedMove: typeof raw.suggestedMove === "string" ? raw.suggestedMove : defaultRelationshipSimulation.suggestedMove,
      possibleFirstLine:
        typeof raw.possibleFirstLine === "string" ? raw.possibleFirstLine : defaultRelationshipSimulation.possibleFirstLine,
      safetyHint: typeof raw.safetyHint === "string" ? raw.safetyHint : defaultRelationshipSimulation.safetyHint,
    },
  };
}

export function missingApiKeyJob(type: GenerationJob["type"]): GenerationJob {
  return createJob(type, "blocked", "missing_api_key");
}
