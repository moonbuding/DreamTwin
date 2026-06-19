import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

const ignoredDirs = new Set([".git", ".qa-build", ".dreamtwin-local", ".playwright-cli", "dist", "dist-server", "node_modules", "output"]);
const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".ts", ".tsx"]);
const runtimeRoots = ["src/pages", "src/components", "src/data", "src/api", "src/utils"];
const secretPattern = new RegExp("sk-" + "[A-Za-z0-9]{20,}");
const secretAssignmentPattern = new RegExp("DEEPSEEK_API_KEY\\s*=\\s*" + "sk-" + "[A-Za-z0-9]+");

const checks = [];

function fail(message) {
  checks.push(message);
}

function extensionOf(path) {
  const lastDot = path.lastIndexOf(".");
  return lastDot === -1 ? "" : path.slice(lastDot);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (ignoredDirs.has(name)) return [];
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) return walk(path);
    if (!stat.isFile()) return [];
    if (!textExtensions.has(extensionOf(path))) return [];
    return [path];
  });
}

function lineMatches(file, matcher, shouldIgnore = () => false) {
  const content = readFileSync(file, "utf8");
  return content
    .split(/\r?\n/)
    .map((line, index) => ({ line, index: index + 1 }))
    .filter(({ line, index }) => matcher.test(line) && !shouldIgnore(line, index));
}

function isRuntimeFile(file) {
  const path = relative(rootDir, file);
  return runtimeRoots.some((root) => path === root || path.startsWith(`${root}/`));
}

function isRelationshipNormalizerLine(line) {
  return line.includes(".replace(") || line.includes("looksLikeInventedSharedMemory") || line.includes("sceneAnchor");
}

const allFiles = walk(rootDir);
const runtimeFiles = allFiles.filter(isRuntimeFile);
const apiAdapter = readFileSync(join(rootDir, "src/api/dreamTwinApi.ts"), "utf8");
const twinGeneratingPage = readFileSync(join(rootDir, "src/pages/TwinGeneratingPage.tsx"), "utf8");
const simulationDetailPage = readFileSync(join(rootDir, "src/pages/SimulationDetailPage.tsx"), "utf8");

for (const file of allFiles) {
  const rel = relative(rootDir, file);
  if (rel === "scripts/product-safety-qa.mjs") continue;
  for (const { line, index } of lineMatches(file, secretPattern)) {
    fail(`Secret-like key found in ${rel}:${index}: ${line.trim()}`);
  }
  for (const { line, index } of lineMatches(file, secretAssignmentPattern)) {
    fail(`DeepSeek key assignment found in ${rel}:${index}: ${line.trim()}`);
  }
}

for (const file of runtimeFiles) {
  const rel = relative(rootDir, file);
  for (const { line, index } of lineMatches(file, /路演|演示|Demo|验证/)) {
    fail(`Internal demo wording leaked to runtime UI in ${rel}:${index}: ${line.trim()}`);
  }
}

const runtimeInfraLeakPattern = /DeepSeek|API key|本地后端|DreamTwin API|STATIC|FALLBACK|LIVE AI|\bLive\b|静态演示内容/;
for (const file of runtimeFiles) {
  const rel = relative(rootDir, file);
  for (const { line, index } of lineMatches(file, runtimeInfraLeakPattern)) {
    fail(`Internal AI/provider wording leaked to runtime UI in ${rel}:${index}: ${line.trim()}`);
  }
}

const aiProxyChatPattern = /我也看到了刚才的关系预演|chat-bubble-counterpart|AI 替你发送|AI 帮你发送|自动替你回复/;
for (const file of runtimeFiles) {
  const rel = relative(rootDir, file);
  for (const { line, index } of lineMatches(file, aiProxyChatPattern)) {
    fail(`Potential AI-proxy chat behavior found in runtime UI in ${rel}:${index}: ${line.trim()}`);
  }
}

const leakedPrototypeControlPattern = /模拟对方同意入梦|模拟好友接受邀请|模拟对方同意|模拟好友接受/;
for (const file of runtimeFiles) {
  const rel = relative(rootDir, file);
  for (const { line, index } of lineMatches(file, leakedPrototypeControlPattern)) {
    fail(`Prototype-only control wording leaked to runtime UI in ${rel}:${index}: ${line.trim()}`);
  }
}

const forbiddenRelationshipTerms = /匹配度|天生一对|注定相遇|最适合的人|灵魂伴侣|命中注定|一定|必然|注定|肯定/;
for (const file of runtimeFiles) {
  const rel = relative(rootDir, file);
  for (const { line, index } of lineMatches(file, forbiddenRelationshipTerms, isRelationshipNormalizerLine)) {
    fail(`Relationship-prediction wording found in runtime UI in ${rel}:${index}: ${line.trim()}`);
  }
}

if (!apiAdapter.includes("export function isDreamTwinApiEnabled")) {
  fail("Frontend API adapter must expose an explicit Live AI opt-in guard.");
}
if (!apiAdapter.includes('liveFlag === "true"') || !apiAdapter.includes("VITE_DREAMTWIN_API_URL?.trim()")) {
  fail("Live AI must require VITE_DREAMTWIN_ENABLE_LIVE_AI=true or an explicit VITE_DREAMTWIN_API_URL.");
}
if (!twinGeneratingPage.includes("if (!isDreamTwinApiEnabled())")) {
  fail("Twin generation page must not call the backend unless Live AI is explicitly enabled.");
}
if (!simulationDetailPage.includes("if (!isDreamTwinApiEnabled())")) {
  fail("Simulation detail page must not call the backend unless Live AI is explicitly enabled.");
}

if (checks.length) {
  console.error(checks.join("\n"));
  process.exit(1);
}

console.log("DreamTwin product safety QA passed.");
