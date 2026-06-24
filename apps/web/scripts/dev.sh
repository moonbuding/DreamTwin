#!/usr/bin/env bash
# DreamTwins · 本地开发一键启动脚本
#
# 用法:
#   bash scripts/dev.sh             # 全栈: MySQL(Docker) + 后端 API + 前端(Live AI)
#   bash scripts/dev.sh --web-only  # 仅前端(静态模式, 不需要 Docker/后端)
#   bash scripts/dev.sh --no-db     # 跳过 Docker MySQL(假定本机已运行 MySQL)
#   bash scripts/dev.sh -h          # 帮助
#
# Ctrl+C 退出: 自动停止后端进程; MySQL 容器保留以便下次秒启(停止: npm run db:down)。

set -euo pipefail

# ---------- 日志 ----------
log()  { echo -e "\033[1;34m[dev]\033[0m  $*"; }
ok()   { echo -e "\033[1;32m[ ok ]\033[0m $*"; }
warn() { echo -e "\033[1;33m[warn]\033[0m $*"; }
err()  { echo -e "\033[1;31m[err]\033[0m $*" >&2; }

usage() {
  cat <<'EOF'
DreamTwins 本地开发启动脚本

  bash scripts/dev.sh             全栈: MySQL(Docker) + 后端 API + 前端(Live AI)
  bash scripts/dev.sh --web-only  仅前端(静态模式, 不需要 Docker/后端)
  bash scripts/dev.sh --no-db     跳过 Docker MySQL(假定本机已运行 MySQL)
  bash scripts/dev.sh -h          显示此帮助

退出: 在前台按 Ctrl+C, 后端进程会自动停止; MySQL 容器保留(停止用 npm run db:down)。
EOF
}

# ---------- 路径 ----------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

# ---------- 参数 ----------
WEB_ONLY=0
NO_DB=0
for arg in "$@"; do
  case "$arg" in
    --web-only) WEB_ONLY=1 ;;
    --no-db)    NO_DB=1 ;;
    -h|--help)  usage; exit 0 ;;
    *) err "未知参数: $arg"; usage; exit 1 ;;
  esac
done

# ---------- 读取 .env 端口(不 source, 避免执行任意内容) ----------
read_env() { [ -f .env ] && grep -E "^$1=" .env | tail -n1 | cut -d= -f2- | tr -d '\r' || true; }

# ---------- 前置检查 ----------
command -v node >/dev/null 2>&1 || { err "未找到 node，请先安装 Node.js(建议 ≥ 20)。"; exit 1; }
command -v npm  >/dev/null 2>&1 || { err "未找到 npm。"; exit 1; }
log "node $(node -v) · npm v$(npm -v)"

# .env: 不存在则从 .env.example 复制
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    warn ".env 不存在，已从 .env.example 生成。如需 Live AI 请在 .env 填入 DEEPSEEK_API_KEY。"
  else
    warn "未找到 .env / .env.example，使用内置默认端口。"
  fi
fi

PORT="$(read_env PORT)";             PORT="${PORT:-8787}"
HOST="$(read_env HOST)";             HOST="${HOST:-127.0.0.1}"
MYSQL_PORT="$(read_env MYSQL_PORT)"; MYSQL_PORT="${MYSQL_PORT:-3306}"
DEEPSEEK_API_KEY="$(read_env DEEPSEEK_API_KEY)"
WEB_PORT=5173

# ---------- 依赖: node_modules 缺失则安装 ----------
if [ ! -d node_modules ]; then
  log "未发现 node_modules，安装依赖(npm install)…"
  npm install
  ok "依赖安装完成。"
fi

# ---------- Docker/MySQL 检测(全栈模式) ----------
if [ "$WEB_ONLY" -eq 0 ] && [ "$NO_DB" -eq 0 ]; then
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    :
  else
    warn "Docker 未运行或未安装 → 无法启动 MySQL，后端无法连库。"
    warn "自动降级为「仅前端静态模式」。(启动 Docker Desktop 后重跑可获得完整全栈)"
    WEB_ONLY=1
  fi
fi

# ========== 仅前端(静态模式) ==========
if [ "$WEB_ONLY" -eq 1 ]; then
  echo
  ok "启动前端(静态模式) → http://127.0.0.1:${WEB_PORT}"
  log "静态模式使用本地保底内容，无需后端。"
  echo
  exec env VITE_DREAMTWIN_ENABLE_LIVE_AI=false npm run dev
fi

# ========== 全栈 ==========
SERVER_PID=""
TAIL_PID=""
cleanup() {
  trap - INT TERM EXIT
  echo
  [ -n "$TAIL_PID" ]   && kill "$TAIL_PID"   2>/dev/null || true
  [ -n "$SERVER_PID" ] && kill "$SERVER_PID" 2>/dev/null || true
  log "已停止后端进程。MySQL 容器仍在运行(停止: npm run db:down)。"
}
trap cleanup INT TERM EXIT

# 1) MySQL
if [ "$NO_DB" -eq 0 ]; then
  log "启动 MySQL(docker compose)…"
  docker compose up -d mysql >/dev/null
  printf '%s' "[dev]  等待 MySQL 健康检查"
  status=""
  for _ in $(seq 1 60); do
    status="$(docker inspect -f '{{.State.Health.Status}}' dreamtwin-mysql 2>/dev/null || echo '')"
    [ "$status" = "healthy" ] && break
    printf '.'
    sleep 1
  done
  echo
  if [ "$status" != "healthy" ]; then
    err "MySQL 未在 60s 内就绪。排查: docker logs dreamtwin-mysql"
    exit 1
  fi
  ok "MySQL 就绪(127.0.0.1:${MYSQL_PORT})。"
else
  warn "--no-db: 跳过 Docker MySQL，假定 ${HOST}:${MYSQL_PORT} 已有可用 MySQL。"
fi

# 2) 后端 API
if [ -z "$DEEPSEEK_API_KEY" ]; then
  warn "DEEPSEEK_API_KEY 为空 → AI 路由返回 missing_api_key(登录/资料正常, AI 用本地保底)。"
fi
log "编译后端(npm run server:build)…"
npm run server:build >/dev/null
mkdir -p .dreamtwin-local
API_LOG="$ROOT_DIR/.dreamtwin-local/api.log"
log "启动后端 API → http://${HOST}:${PORT}"
node dist-server/server/index.js >"$API_LOG" 2>&1 &
SERVER_PID=$!

printf '%s' "[dev]  等待后端 /api/health"
HEALTHY=0
for _ in $(seq 1 40); do
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo; err "后端进程已退出。最近日志:"; tail -n 30 "$API_LOG" >&2; exit 1
  fi
  if curl -sf "http://${HOST}:${PORT}/api/health" >/dev/null 2>&1; then HEALTHY=1; break; fi
  printf '.'
  sleep 0.5
done
echo
if [ "$HEALTHY" -ne 1 ]; then
  err "后端 20s 内未通过健康检查。最近日志:"; tail -n 30 "$API_LOG" >&2; exit 1
fi
ok "后端就绪。日志: $API_LOG"

# 后端日志转发到前台(可干净 kill)
tail -n0 -f "$API_LOG" &
TAIL_PID=$!

# 3) 前端(前台; Ctrl+C 触发 cleanup)
echo
ok "全栈已就绪:"
echo "       前端       http://127.0.0.1:${WEB_PORT}"
echo "       后端       http://${HOST}:${PORT}/api/health"
echo "       演示账号   手机号 13700137000 / 密码 xiaomeng888"
echo "       退出       Ctrl+C(后端自动停止; MySQL 保留, 停止用 npm run db:down)"
echo
export VITE_DREAMTWIN_API_URL="http://${HOST}:${PORT}"
npm run dev
