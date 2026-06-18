import { createDefaultTwin, defaultRelationshipSimulation } from "./defaults.js";
import type { GenerationJob, RelationshipSimulationResult, TwinProjection, UserProfile } from "./types.js";

const deepSeekEndpoint = "https://api.deepseek.com/chat/completions";
const deepSeekModel = "deepseek-chat";

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

export async function generateTwinSummary(profile: UserProfile): Promise<{ job: GenerationJob; twin: TwinProjection }> {
  const fallback = createDefaultTwin(profile);
  const systemPrompt = [
    "You generate DreamTwin AI twin projections for a C-side relationship rehearsal app.",
    "Return strict JSON only.",
    "The twin is an abstract personality projection, not a companion, avatar body, roleplay character, or agent that sends messages.",
  ].join("\n");
  const userPrompt = JSON.stringify({
    task: "Create an AI twin projection from this user profile.",
    profile,
    requiredJsonShape: {
      summary: "one concise Chinese sentence",
      keywords: ["3-5 Chinese tags"],
      colorPalette: ["3 hex colors"],
      lightShape: "halo | mist | pulse | orbit",
    },
  });

  const raw = (await requestDeepSeekJson(systemPrompt, userPrompt)) as Partial<TwinProjection>;
  const lightShapes = ["halo", "mist", "pulse", "orbit"] as const;
  const requestedLightShape = raw.lightShape as (typeof lightShapes)[number] | undefined;
  const lightShape = requestedLightShape && lightShapes.includes(requestedLightShape) ? requestedLightShape : fallback.lightShape;

  return {
    job: createJob("twin_summary", "succeeded"),
    twin: {
      ...fallback,
      summary: typeof raw.summary === "string" ? raw.summary : fallback.summary,
      keywords: asStringArray(raw.keywords, fallback.keywords),
      colorPalette: asStringArray(raw.colorPalette, fallback.colorPalette).slice(0, 3),
      lightShape,
      version: fallback.version + 1,
    },
  };
}

export async function generateRelationshipSimulation(input: {
  profile: UserProfile;
  counterpartName?: string;
  scene?: string;
}): Promise<{ job: GenerationJob; simulation: RelationshipSimulationResult }> {
  const systemPrompt = [
    "You generate DreamTwin relationship simulation results in Chinese.",
    "Return strict JSON only.",
    "Do not make absolute predictions, do not impersonate the other person, and do not send messages for the user.",
    "Focus on how two real people might start, develop, risk conflict, and choose a safe first action.",
  ].join("\n");
  const userPrompt = JSON.stringify({
    task: "Generate a structured relationship rehearsal result.",
    profile: input.profile,
    counterpartName: input.counterpartName ?? "对方",
    scene: input.scene ?? "梦境广场中的一次低压相遇",
    constraints: [
      "Use the provided counterpartName and scene in the generated content.",
      "Do not copy placeholder text from the schema.",
      "Keep the tone warm, specific, C-side, and action-oriented.",
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
