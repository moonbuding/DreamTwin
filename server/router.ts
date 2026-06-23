import type { IncomingMessage, ServerResponse } from "node:http";
import { AuthError, getUserById, getUserIdFromRequest, loginUser, registerUser } from "./auth.js";
import { createDefaultTwin } from "./defaults.js";
import {
  AiOutputParseError,
  generateRelationshipSimulation,
  generateTwinSummary,
  MissingApiKeyError,
  missingApiKeyJob,
} from "./deepseek.js";
import { getProfile, getTwin, saveTwin, updateProfile } from "./storage.js";
import type { ApiErrorBody, RelationshipSimulationInput, TwinProjection, UserProfile } from "./types.js";

type HttpMethod = "GET" | "PATCH" | "POST" | "PUT" | "OPTIONS";

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,PATCH,POST,PUT,OPTIONS",
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body, null, 2));
}

function sendError(response: ServerResponse, statusCode: number, code: string, message: string): void {
  const body: ApiErrorBody = { error: { code, message } };
  sendJson(response, statusCode, body);
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function methodOf(request: IncomingMessage): HttpMethod {
  return (request.method ?? "GET").toUpperCase() as HttpMethod;
}

function pathOf(request: IncomingMessage): string {
  const url = new URL(request.url ?? "/", "http://localhost");
  return url.pathname;
}

function isProfilePatch(value: unknown): value is Partial<UserProfile> {
  return Boolean(value && typeof value === "object");
}

function isTwinPayload(value: unknown): value is TwinProjection {
  return Boolean(value && typeof value === "object" && "summary" in (value as object) && "keywords" in (value as object));
}

/** Resolve the authenticated user id, or send 401 and return null. */
function requireUserId(request: IncomingMessage, response: ServerResponse): string | null {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    sendError(response, 401, "unauthorized", "请先登录。");
    return null;
  }
  return userId;
}

export async function routeRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = methodOf(request);
  const path = pathOf(request);

  if (method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  try {
    if (method === "GET" && path === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "dreamtwin-api",
        timestamp: new Date().toISOString(),
        aiProviderConfigured: Boolean(process.env.DEEPSEEK_API_KEY),
      });
      return;
    }

    // ---- Auth (public) ----
    if (method === "POST" && path === "/api/auth/register") {
      const body = (await readJsonBody(request)) as { phone?: unknown; password?: unknown };
      const { user, token } = await registerUser(body.phone, body.password);
      sendJson(response, 201, { token, user, hasTwin: false });
      return;
    }

    if (method === "POST" && path === "/api/auth/login") {
      const body = (await readJsonBody(request)) as { phone?: unknown; password?: unknown };
      const { user, token } = await loginUser(body.phone, body.password);
      const twin = await getTwin(user.id);
      sendJson(response, 200, { token, user, hasTwin: Boolean(twin) });
      return;
    }

    // ---- Authenticated (per-user) ----
    if (method === "GET" && path === "/api/me") {
      const userId = requireUserId(request, response);
      if (!userId) return;
      const [user, profile, twin] = await Promise.all([getUserById(userId), getProfile(userId), getTwin(userId)]);
      if (!user) {
        sendError(response, 401, "unauthorized", "登录已失效,请重新登录。");
        return;
      }
      sendJson(response, 200, { user, profile, twin, hasTwin: Boolean(twin) });
      return;
    }

    if (method === "GET" && path === "/api/me/profile") {
      const userId = requireUserId(request, response);
      if (!userId) return;
      sendJson(response, 200, { profile: await getProfile(userId) });
      return;
    }

    if (method === "PATCH" && path === "/api/me/profile") {
      const userId = requireUserId(request, response);
      if (!userId) return;
      const body = await readJsonBody(request);
      if (!isProfilePatch(body)) {
        sendError(response, 400, "invalid_profile", "Profile payload must be a JSON object.");
        return;
      }
      sendJson(response, 200, { profile: await updateProfile(userId, body) });
      return;
    }

    if (method === "GET" && path === "/api/me/twin") {
      const userId = requireUserId(request, response);
      if (!userId) return;
      sendJson(response, 200, { twin: await getTwin(userId) });
      return;
    }

    if (method === "PUT" && path === "/api/me/twin") {
      const userId = requireUserId(request, response);
      if (!userId) return;
      const body = await readJsonBody(request);
      if (!isTwinPayload(body)) {
        sendError(response, 400, "invalid_twin", "Twin payload must include summary and keywords.");
        return;
      }
      sendJson(response, 200, { twin: await saveTwin(userId, body) });
      return;
    }

    if (method === "POST" && path === "/api/twins") {
      const userId = requireUserId(request, response);
      if (!userId) return;
      const profile = await getProfile(userId);
      const twin = await saveTwin(userId, createDefaultTwin(profile));
      sendJson(response, 201, { twin });
      return;
    }

    if (method === "POST" && path === "/api/ai/twin-summary") {
      const userId = requireUserId(request, response);
      if (!userId) return;
      const profile = await getProfile(userId);
      const result = await generateTwinSummary(profile);
      await saveTwin(userId, result.twin);
      sendJson(response, 200, result);
      return;
    }

    if (method === "POST" && path === "/api/ai/relationship-simulation") {
      const userId = requireUserId(request, response);
      if (!userId) return;
      const body = (await readJsonBody(request)) as Partial<RelationshipSimulationInput>;
      const profile = await getProfile(userId);
      const result = await generateRelationshipSimulation({
        profile,
        counterpartName: body.counterpartName,
        counterpartProfile: body.counterpartProfile,
        scene: body.scene,
        sceneStageSpec: body.sceneStageSpec,
        sceneEvent: body.sceneEvent,
        guidedSceneEvents: body.guidedSceneEvents,
        relationshipGoal: body.relationshipGoal,
      });
      sendJson(response, 200, result);
      return;
    }

    sendError(response, 404, "not_found", `No route for ${method} ${path}.`);
  } catch (error) {
    if (error instanceof AuthError) {
      sendError(response, error.status, error.code, error.message);
      return;
    }

    if (error instanceof MissingApiKeyError) {
      const type = path.includes("relationship") ? "relationship_simulation" : "twin_summary";
      sendJson(response, 200, {
        job: missingApiKeyJob(type),
        error: {
          code: "missing_api_key",
          message: error.message,
        },
      });
      return;
    }

    if (error instanceof AiOutputParseError) {
      sendError(response, 502, "ai_output_parse_error", error.message);
      return;
    }

    if (error instanceof SyntaxError) {
      sendError(response, 400, "invalid_json", "Request body must be valid JSON.");
      return;
    }

    const message = error instanceof Error ? error.message : "Unexpected server error.";
    sendError(response, 500, "server_error", message);
  }
}
