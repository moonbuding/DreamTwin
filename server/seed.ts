import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";
import { getPool } from "./db.js";
import { createDefaultTwin } from "./defaults.js";
import { saveTwin, updateProfile } from "./storage.js";
import type { UserProfile } from "./types.js";

// Seeded demo persona — the person every dream scenario matches you with.
const XIAOMENG_PHONE = process.env.DEMO_XIAOMENG_PHONE ?? "13700137000";
const XIAOMENG_PASSWORD = process.env.DEMO_XIAOMENG_PASSWORD ?? "xiaomeng888";

const xiaomengProfile: Partial<UserProfile> = {
  nickname: "小梦",
  personalityKeywords: ["温柔", "慢热", "细腻", "爱做梦"],
  relationshipIntention: "想遇见一个能慢慢聊深的人",
  interests: ["星空摄影", "独立音乐", "深夜散步"],
  optionalSignals: ["偏好低压开场", "记得住对话里的小事"],
  mbti: "INFP",
  zodiac: "双鱼座",
  mysticTags: ["月亮感", "水象共情"],
  communicationStyle: "先观察，再用一个细节温柔地靠近",
  values: ["真实", "边界感", "细水长流"],
};

export async function ensureDemoAccount(): Promise<void> {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT id FROM users WHERE phone = ?", [XIAOMENG_PHONE]);
  if (rows.length > 0) return;

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(XIAOMENG_PASSWORD, 10);
  await pool.query("INSERT INTO users (id, phone, password_hash) VALUES (?, ?, ?)", [id, XIAOMENG_PHONE, passwordHash]);
  const profile = await updateProfile(id, xiaomengProfile);
  await saveTwin(id, createDefaultTwin(profile));
  console.log(`Seeded demo account 小梦 (phone ${XIAOMENG_PHONE}).`);
}
