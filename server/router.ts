import type { IncomingMessage, ServerResponse } from "node:http";
import { createDefaultTwin } from "./defaults.js";
import {
  AiOutputParseError,
  generateRelationshipSimulation,
  generateTwinSummary,
  MissingApiKeyError,
  missingApiKeyJob,
} from "./deepseek.js";
import { readDb, saveTwin, updateProfile } from "./storage.js";
import type { ApiErrorBody, UserProfile } from "./types.js";

type HttpMethod = "GET" | "PATCH" | "POST" | "OPTIONS";

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,PATCH,POST,OPTIONS",
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

    if (method === "GET" && path === "/api/me/profile") {
      const db = await readDb();
      sendJson(response, 200, { profile: db.profile });
      return;
    }

    if (method === "PATCH" && path === "/api/me/profile") {
      const body = await readJsonBody(request);
      if (!isProfilePatch(body)) {
        sendError(response, 400, "invalid_profile", "Profile payload must be a JSON object.");
        return;
      }
      const profile = await updateProfile(body);
      sendJson(response, 200, { profile });
      return;
    }

    if (method === "GET" && path === "/api/me/twin") {
      const db = await readDb();
      sendJson(response, 200, { twin: db.twin });
      return;
    }

    if (method === "POST" && path === "/api/twins") {
      const db = await readDb();
      const twin = await saveTwin(createDefaultTwin(db.profile));
      sendJson(response, 201, { twin });
      return;
    }

    if (method === "POST" && path === "/api/ai/twin-summary") {
      const db = await readDb();
      const result = await generateTwinSummary(db.profile);
      await saveTwin(result.twin);
      sendJson(response, 200, result);
      return;
    }

    if (method === "POST" && path === "/api/ai/relationship-simulation") {
      const body = (await readJsonBody(request)) as { counterpartName?: string; scene?: string };
      const db = await readDb();
      const result = await generateRelationshipSimulation({
        profile: db.profile,
        counterpartName: body.counterpartName,
        scene: body.scene,
      });
      sendJson(response, 200, result);
      return;
    }

    sendError(response, 404, "not_found", `No route for ${method} ${path}.`);
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      const type = path.includes("relationship") ? "relationship_simulation" : "twin_summary";
      sendJson(response, 503, {
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
