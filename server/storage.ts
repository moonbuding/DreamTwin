import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { DreamTwinDb, TwinProjection, UserProfile } from "./types.js";
import { defaultDb } from "./defaults.js";

const dbPath = resolve(process.cwd(), ".dreamtwin-local", "db.json");

async function ensureDbDir() {
  await mkdir(dirname(dbPath), { recursive: true });
}

export async function readDb(): Promise<DreamTwinDb> {
  try {
    const raw = await readFile(dbPath, "utf8");
    return { ...defaultDb, ...JSON.parse(raw) } as DreamTwinDb;
  } catch {
    await writeDb(defaultDb);
    return defaultDb;
  }
}

export async function writeDb(db: DreamTwinDb): Promise<DreamTwinDb> {
  await ensureDbDir();
  await writeFile(dbPath, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  return db;
}

export async function updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
  const db = await readDb();
  const nextProfile = { ...db.profile, ...profile, id: db.profile.id };
  await writeDb({ ...db, profile: nextProfile });
  return nextProfile;
}

export async function saveTwin(twin: TwinProjection): Promise<TwinProjection> {
  const db = await readDb();
  await writeDb({ ...db, twin });
  return twin;
}
