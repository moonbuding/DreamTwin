import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db.js";
import type { AuthUser } from "./types.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "30d";

export class AuthError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

function normalizePhone(phone: unknown): string {
  return String(phone ?? "").trim();
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export async function registerUser(phone: unknown, password: unknown): Promise<{ user: AuthUser; token: string }> {
  const normalizedPhone = normalizePhone(phone);
  if (!/^\d{6,20}$/.test(normalizedPhone)) {
    throw new AuthError("invalid_phone", "请输入有效的手机号。", 400);
  }
  if (typeof password !== "string" || password.length < 6) {
    throw new AuthError("weak_password", "密码至少需要 6 位。", 400);
  }

  const db = getPool();
  const [existing] = await db.query<RowDataPacket[]>("SELECT id FROM users WHERE phone = ?", [normalizedPhone]);
  if (existing.length > 0) {
    throw new AuthError("phone_taken", "该手机号已注册，请直接登录。", 409);
  }

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  await db.query("INSERT INTO users (id, phone, password_hash) VALUES (?, ?, ?)", [id, normalizedPhone, passwordHash]);

  return { user: { id, phone: normalizedPhone }, token: signToken(id) };
}

export async function loginUser(phone: unknown, password: unknown): Promise<{ user: AuthUser; token: string }> {
  const normalizedPhone = normalizePhone(phone);
  const db = getPool();
  const [rows] = await db.query<RowDataPacket[]>(
    "SELECT id, phone, password_hash FROM users WHERE phone = ?",
    [normalizedPhone],
  );
  const row = rows[0];
  if (!row) {
    throw new AuthError("invalid_credentials", "手机号或密码不正确。", 401);
  }
  const matches = await bcrypt.compare(String(password ?? ""), String(row.password_hash));
  if (!matches) {
    throw new AuthError("invalid_credentials", "手机号或密码不正确。", 401);
  }
  return { user: { id: String(row.id), phone: String(row.phone) }, token: signToken(String(row.id)) };
}

export function getUserIdFromRequest(request: IncomingMessage): string | null {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET) as { sub?: string };
    return typeof decoded.sub === "string" ? decoded.sub : null;
  } catch {
    return null;
  }
}

export async function getUserById(userId: string): Promise<AuthUser | null> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT id, phone FROM users WHERE id = ?", [userId]);
  const row = rows[0];
  return row ? { id: String(row.id), phone: String(row.phone) } : null;
}
