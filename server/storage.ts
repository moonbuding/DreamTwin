import type { RowDataPacket } from "mysql2";
import { getPool, parseJsonColumn } from "./db.js";
import { createDefaultTwin, defaultProfile } from "./defaults.js";
import type { TwinProjection, UserProfile } from "./types.js";

function seedProfile(userId: string): UserProfile {
  // A fresh account starts from the default shape but owns its own id; the
  // real values are written when the user submits the twin-create form.
  return { ...defaultProfile, id: userId };
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT data FROM profiles WHERE user_id = ?", [userId]);
  const row = rows[0];
  if (row) return parseJsonColumn<UserProfile>(row.data);

  const profile = seedProfile(userId);
  await getPool().query("INSERT INTO profiles (user_id, data) VALUES (?, ?)", [userId, JSON.stringify(profile)]);
  return profile;
}

export async function updateProfile(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
  const current = await getProfile(userId);
  const next: UserProfile = { ...current, ...patch, id: userId };
  await getPool().query(
    "INSERT INTO profiles (user_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)",
    [userId, JSON.stringify(next)],
  );
  return next;
}

export async function getTwin(userId: string): Promise<TwinProjection | null> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT data FROM twins WHERE user_id = ?", [userId]);
  const row = rows[0];
  return row ? parseJsonColumn<TwinProjection>(row.data) : null;
}

export async function saveTwin(userId: string, twin: TwinProjection): Promise<TwinProjection> {
  await getPool().query(
    "INSERT INTO twins (user_id, data) VALUES (?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data)",
    [userId, JSON.stringify(twin)],
  );
  return twin;
}

export async function createDefaultTwinForUser(userId: string): Promise<TwinProjection> {
  const profile = await getProfile(userId);
  return saveTwin(userId, createDefaultTwin(profile));
}
