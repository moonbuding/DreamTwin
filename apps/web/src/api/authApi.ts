import type { TwinProjection, UserProfile } from "../types/dreamtwin";
import { apiBaseUrl } from "./dreamTwinApi";

export interface AuthUser {
  id: string;
  phone: string;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
  hasTwin: boolean;
}

export interface MeResult {
  user: AuthUser;
  profile: UserProfile;
  twin: TwinProjection | null;
  hasTwin: boolean;
}

export class AuthApiError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
  }
}

function url(path: string): string {
  return `${apiBaseUrl().replace(/\/$/, "")}${path}`;
}

async function parseOrThrow(response: Response): Promise<unknown> {
  const data = (await response.json().catch(() => ({}))) as
    | { error?: { code?: string; message?: string } }
    | Record<string, unknown>;
  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string } }).error;
    throw new AuthApiError(error?.code || "auth_error", error?.message || "操作失败，请稍后再试。", response.status);
  }
  return data;
}

async function postAuth(path: string, body: { phone: string; password: string }): Promise<AuthResult> {
  let response: Response;
  try {
    response = await fetch(url(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError("network_error", "无法连接服务器，请确认后端已启动。");
  }
  return (await parseOrThrow(response)) as AuthResult;
}

export function registerAccount(phone: string, password: string): Promise<AuthResult> {
  return postAuth("/api/auth/register", { phone, password });
}

export function loginAccount(phone: string, password: string): Promise<AuthResult> {
  return postAuth("/api/auth/login", { phone, password });
}

export async function fetchMe(token: string): Promise<MeResult> {
  let response: Response;
  try {
    response = await fetch(url("/api/me"), { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new AuthApiError("network_error", "无法连接服务器。");
  }
  return (await parseOrThrow(response)) as MeResult;
}
