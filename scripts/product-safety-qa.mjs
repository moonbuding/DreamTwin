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

function isAllowedDemoModeLine(rel, line) {
  if (rel === "src/components/AppShell.tsx") {
    return /showDemoChrome|phone-shell-demo-mode|app-topbar-demo/.test(line);
  }
  if (rel === "src/pages/WaitingPage.tsx") {
    return /showDemoControls|responsePreviewLabel|systemReminder|对方收到的系统提醒|真实 App 会等待/.test(line);
  }
  return false;
}

const allFiles = walk(rootDir);
const runtimeFiles = allFiles.filter(isRuntimeFile);
const apiAdapter = readFileSync(join(rootDir, "src/api/dreamTwinApi.ts"), "utf8");
const twinGeneratingPage = readFileSync(join(rootDir, "src/pages/TwinGeneratingPage.tsx"), "utf8");
const simulationDetailPage = readFileSync(join(rootDir, "src/pages/SimulationDetailPage.tsx"), "utf8");
const todayPage = readFileSync(join(rootDir, "src/pages/TodayPage.tsx"), "utf8");
const messagesPage = readFileSync(join(rootDir, "src/pages/MessagesPage.tsx"), "utf8");
const friendInvitePage = readFileSync(join(rootDir, "src/pages/FriendInvitePage.tsx"), "utf8");
const dreamLogPage = readFileSync(join(rootDir, "src/pages/DreamLogPage.tsx"), "utf8");
const waitingPage = readFileSync(join(rootDir, "src/pages/WaitingPage.tsx"), "utf8");
const dreamGatePage = readFileSync(join(rootDir, "src/pages/DreamGatePage.tsx"), "utf8");
const chatEntryPage = readFileSync(join(rootDir, "src/pages/ChatEntryPage.tsx"), "utf8");

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
  for (const { line, index } of lineMatches(file, /路演|演示|Demo|验证/, (line) => isAllowedDemoModeLine(rel, line))) {
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

const prematureChatLabelPattern = /已进入聊天/;
for (const file of runtimeFiles) {
  const rel = relative(rootDir, file);
  for (const { line, index } of lineMatches(file, prematureChatLabelPattern)) {
    fail(`Premature chat wording found in runtime UI in ${rel}:${index}: ${line.trim()}`);
  }
}

const oldDreamMapReturnPattern = /回到(?:梦境)?星图/;
for (const file of runtimeFiles) {
  const rel = relative(rootDir, file);
  for (const { line, index } of lineMatches(file, oldDreamMapReturnPattern)) {
    fail(`Old dream map return wording found in runtime UI in ${rel}:${index}: ${line.trim()}`);
  }
}

const leakedPrototypeControlPattern = /模拟对方同意入梦|模拟好友接受邀请|模拟对方同意|模拟好友接受/;
for (const file of runtimeFiles) {
  const rel = relative(rootDir, file);
  for (const { line, index } of lineMatches(file, leakedPrototypeControlPattern, (line) => isAllowedDemoModeLine(rel, line))) {
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
for (const requiredMessageState of ["待写第一句", "等真人回应", "待入梦"]) {
  if (!messagesPage.includes(requiredMessageState)) {
    fail(`Messages page must preserve the DreamTwin message state: ${requiredMessageState}.`);
  }
}
if (!messagesPage.includes("AI 只带入预演摘要")) {
  fail("Messages page must clearly state that AI only carries preview context into chat.");
}
for (const requiredMessageAction of ["当前行动", "等对方入梦", "进入正常聊天", "去梦境地图开启关系"]) {
  if (!messagesPage.includes(requiredMessageAction)) {
    fail(`Messages page must lead with the next relationship action: ${requiredMessageAction}.`);
  }
}
if (!todayPage.includes("sentFirstMessages") || !todayPage.includes("你发出的第一句话")) {
  fail("Today page must preserve the sent first-line context while waiting for a real reply.");
}
for (const requiredTodayFriendHandoff of ["好友已入梦", "同一张梦境地图", "共同坐标"]) {
  if (!todayPage.includes(requiredTodayFriendHandoff)) {
    fail(`Today page must clearly route accepted friends back to the shared dream map: ${requiredTodayFriendHandoff}.`);
  }
}
for (const requiredWaitingBoundary of ["对方确认前不打开聊天", "不会替你发送真实消息", "不会替你表达关系意图", "可以随时撤回"]) {
  if (!waitingPage.includes(requiredWaitingBoundary)) {
    fail(`Waiting page must preserve low-pressure relationship boundaries: ${requiredWaitingBoundary}.`);
  }
}
for (const requiredFriendBoundary of ["先邀请，不先分析", "不单方面分析好友", "好友接受后", "进入同一张梦境地图"]) {
  if (!friendInvitePage.includes(requiredFriendBoundary)) {
    fail(`Friend page must preserve the consent-first invite boundary: ${requiredFriendBoundary}.`);
  }
}
if (friendInvitePage.includes("possibleFirstLine") || friendInvitePage.includes("simulation.")) {
  fail("Friend page must not show simulation outputs before the friend accepts the invite.");
}
for (const directSceneLabel of ["海底探险", "星际漫游", "吃日料", "看电影", "看星空", "打羽毛球"]) {
  if (friendInvitePage.includes(directSceneLabel)) {
    fail(`Friend page must not directly present scene cards before map selection: ${directSceneLabel}.`);
  }
}
for (const requiredSharedMapCopy of ["共同选择梦境场景", "同一张梦境地图", "共同坐标", "进入这个场景预演"]) {
  if (!dreamLogPage.includes(requiredSharedMapCopy)) {
    fail(`Dream map must own accepted friend scene selection: ${requiredSharedMapCopy}.`);
  }
}
if (!dreamLogPage.includes("onOpenFriendScene(activeSharedScene.id, nodeId)")) {
  fail("Clicking the accepted friend map node must enter the selected shared scene preview.");
}
for (const requiredSharedSimulationCopy of ["共同梦境确认", "共同梦境来源", "进入正常聊天"]) {
  if (
    !simulationDetailPage.includes(requiredSharedSimulationCopy) &&
    !dreamGatePage.includes(requiredSharedSimulationCopy) &&
    !chatEntryPage.includes(requiredSharedSimulationCopy)
  ) {
    fail(`Friend shared simulation handoff must preserve the shared-dream source: ${requiredSharedSimulationCopy}.`);
  }
}
if (!dreamGatePage.includes("activeRoamingScene?.possibleFirstLine")) {
  fail("Friend dream gate must use the selected shared scene first-line preview.");
}
if (!chatEntryPage.includes("这不是普通好友私信")) {
  fail("Friend chat entry must state that shared-dream chat is not ordinary friend DM.");
}

if (checks.length) {
  console.error(checks.join("\n"));
  process.exit(1);
}

console.log("DreamTwin product safety QA passed.");
