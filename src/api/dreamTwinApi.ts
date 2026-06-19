import type {
  GuidedSceneEvent,
  RelationshipCounterpartProfile,
  RelationshipSimulationResult,
  SceneStageSpec,
  TwinProjection,
  UserProfile,
} from "../types/dreamtwin";

const DEFAULT_API_URL = "http://127.0.0.1:8787";
const REQUEST_TIMEOUT_MS = 12_000;

export type DreamTwinApiMode = "static" | "live" | "fallback";

export interface GenerationJob {
  id: string;
  type: "twin_summary" | "relationship_simulation";
  status: "queued" | "running" | "succeeded" | "failed" | "blocked";
  createdAt: string;
  completedAt?: string;
  errorCode?: string;
}

export interface DreamTwinHealth {
  ok: boolean;
  service: string;
  timestamp: string;
  aiProviderConfigured: boolean;
}

type GenerationResponse<T> = {
  job: GenerationJob;
  error?: {
    code?: string;
    message?: string;
  };
} & T;

export class DreamTwinApiError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "DreamTwinApiError";
    this.code = code;
    this.status = status;
  }
}

function apiBaseUrl(): string {
  return import.meta.env.VITE_DREAMTWIN_API_URL?.trim() || DEFAULT_API_URL;
}

export function isDreamTwinApiEnabled(): boolean {
  const liveFlag = import.meta.env.VITE_DREAMTWIN_ENABLE_LIVE_AI?.trim().toLowerCase();
  if (liveFlag === "false") return false;
  return liveFlag === "true" || Boolean(import.meta.env.VITE_DREAMTWIN_API_URL?.trim());
}

function normalizeApiUrl(path: string): string {
  return `${apiBaseUrl().replace(/\/$/, "")}${path}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  if (!isDreamTwinApiEnabled()) {
    throw new DreamTwinApiError("api_disabled", "DreamTwin live API is disabled for this frontend session.");
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(normalizeApiUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      const error =
        body && typeof body === "object" && "error" in body
          ? (body.error as { code?: string; message?: string } | undefined)
          : undefined;
      throw new DreamTwinApiError(
        error?.code || "api_error",
        error?.message || "AI 生成服务暂时不可用。",
        response.status,
      );
    }

    return body as T;
  } catch (error) {
    if (error instanceof DreamTwinApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DreamTwinApiError("request_timeout", "AI 生成等待时间较长。");
    }
    throw new DreamTwinApiError("network_error", "AI 生成服务暂时不可用。");
  } finally {
    window.clearTimeout(timeout);
  }
}

async function patchProfile(profile: UserProfile): Promise<void> {
  await requestJson<{ profile: UserProfile }>("/api/me/profile", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}

function assertGenerationSucceeded<T>(body: GenerationResponse<T>): { job: GenerationJob } & T {
  if (body.job.status === "succeeded") return body;

  throw new DreamTwinApiError(
    body.error?.code || body.job.errorCode || "generation_unavailable",
    body.error?.message || "AI generation is unavailable.",
  );
}

const twinSummaryRequests = new Map<string, Promise<{ job: GenerationJob; twin: TwinProjection }>>();
const relationshipRequests = new Map<string, Promise<{ job: GenerationJob; simulation: RelationshipSimulationResult }>>();

function cachedRequest<T>(cache: Map<string, Promise<T>>, key: string, factory: () => Promise<T>): Promise<T> {
  const existing = cache.get(key);
  if (existing) return existing;

  const request = factory().finally(() => {
    cache.delete(key);
  });
  cache.set(key, request);
  return request;
}

export function getHealth(): Promise<DreamTwinHealth> {
  return requestJson<DreamTwinHealth>("/api/health");
}

export function generateTwinSummary(profile: UserProfile): Promise<{ job: GenerationJob; twin: TwinProjection }> {
  const key = JSON.stringify(profile);
  return cachedRequest(twinSummaryRequests, key, async () => {
    await patchProfile(profile);
    const response = await requestJson<GenerationResponse<{ twin: TwinProjection }>>("/api/ai/twin-summary", {
      method: "POST",
      body: JSON.stringify({}),
    });
    return assertGenerationSucceeded(response);
  });
}

export function generateRelationshipSimulation(input: {
  profile: UserProfile;
  counterpartName: string;
  counterpartProfile?: RelationshipCounterpartProfile;
  scene: string;
  sceneStageSpec?: SceneStageSpec;
  sceneEvent?: GuidedSceneEvent;
  guidedSceneEvents?: GuidedSceneEvent[];
  relationshipGoal?: string;
}): Promise<{ job: GenerationJob; simulation: RelationshipSimulationResult }> {
  const key = JSON.stringify(input);
  return cachedRequest(relationshipRequests, key, async () => {
    await patchProfile(input.profile);
    const response = await requestJson<GenerationResponse<{ simulation: RelationshipSimulationResult }>>(
      "/api/ai/relationship-simulation",
      {
        method: "POST",
        body: JSON.stringify({
          counterpartName: input.counterpartName,
          counterpartProfile: input.counterpartProfile,
          scene: input.scene,
          sceneStageSpec: input.sceneStageSpec,
          sceneEvent: input.sceneEvent,
          guidedSceneEvents: input.guidedSceneEvents,
          relationshipGoal: input.relationshipGoal,
        }),
      },
    );
    return assertGenerationSucceeded(response);
  });
}

export function describeDreamTwinApiError(error: unknown): string {
  if (!(error instanceof DreamTwinApiError)) return "AI 生成暂时不可用，已切回本地保底内容。";

  if (error.code === "api_disabled") {
    return "当前使用本地保底内容。开启 AI 生成后可返回实时结果。";
  }
  if (error.code === "missing_api_key") {
    return "AI 生成服务暂未完成配置，已使用本地保底内容。";
  }
  if (error.code === "network_error") {
    return "AI 生成服务暂时不可用，当前使用本地保底内容。";
  }
  if (error.code === "request_timeout") {
    return "AI 生成等待时间较长，先使用本地保底内容。";
  }
  if (error.code === "scene_unanchored") {
    return error.message;
  }

  return `${error.message} 已使用本地保底内容。`;
}
