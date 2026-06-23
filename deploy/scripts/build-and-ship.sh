#!/usr/bin/env bash
# DreamTwins · Mac local build + ship to ECS.
#
# Usage:
#   bash deploy/scripts/build-and-ship.sh [prod]
#
# Optional env:
#   ECS_HOST        default root@8.138.160.49
#   SSH_KEY         default ~/.ssh/hipa_deploy
#   SKIP_GIT_CHECK  set to 1 for one-off dirty-worktree deploys

set -euo pipefail

log() { echo -e "\033[1;34m[ship]\033[0m $*"; }
ok()  { echo -e "\033[1;32m[ ok ]\033[0m $*"; }
err() { echo -e "\033[1;31m[err]\033[0m $*" >&2; }

ENV_NAME="${1:-prod}"
SERVICE="dreamtwin"
ECS_HOST="${ECS_HOST:-root@8.138.160.49}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/hipa_deploy}"
SKIP_GIT_CHECK="${SKIP_GIT_CHECK:-0}"

if [[ "$ENV_NAME" != "prod" ]]; then
  err "Only prod is configured for DreamTwins right now."
  exit 1
fi

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_DIR=$(cd "$SCRIPT_DIR/../.." && pwd)
REMOTE_ROOT="/srv/${SERVICE}/${ENV_NAME}"
REMOTE_SRC_DIR="${REMOTE_ROOT}/src"
REMOTE_ENV_FILE="${REMOTE_ROOT}/.env"
COMPOSE_PROJECT="${SERVICE}-${ENV_NAME}"
TAR_PATH="/tmp/${SERVICE}-images.tar.gz"
DEPLOY_TAR_PATH="/tmp/${SERVICE}-deploy.tar.gz"

log "repo: ${REPO_DIR}"
log "env: ${ENV_NAME}"
log "ecs: ${ECS_HOST}"

if ! docker info >/dev/null 2>&1; then
  err "Docker daemon is not running. Open Docker Desktop first."
  exit 1
fi

if [[ ! -f "$SSH_KEY" ]]; then
  err "SSH key not found: ${SSH_KEY}"
  exit 1
fi

cd "$REPO_DIR"

LOCAL_SHA=$(git rev-parse HEAD)
if [[ "$SKIP_GIT_CHECK" != "1" ]]; then
  if ! git diff --quiet || ! git diff --cached --quiet; then
    err "Working tree has uncommitted changes. Commit + push first, or set SKIP_GIT_CHECK=1 for a one-off deploy."
    exit 1
  fi

  REMOTE_SHA=$(git rev-parse @{u} 2>/dev/null || echo "")
  if [[ -z "$REMOTE_SHA" ]]; then
    err "Current branch has no upstream. Push with: git push -u origin $(git branch --show-current)"
    exit 1
  fi
  if [[ "$LOCAL_SHA" != "$REMOTE_SHA" ]]; then
    err "Local commit is not pushed. local=${LOCAL_SHA} remote=${REMOTE_SHA}"
    exit 1
  fi
  ok "git clean and pushed: ${LOCAL_SHA}"
else
  log "SKIP_GIT_CHECK=1, deploying current working tree image. Remote deploy files will be uploaded directly."
fi

log "build linux/amd64 images..."
docker buildx build \
  --platform linux/amd64 \
  --target api-runner \
  --build-arg VITE_DREAMTWIN_API_URL=/ \
  -t dreamtwin-api:local \
  --load \
  .
docker buildx build \
  --platform linux/amd64 \
  --target web-runner \
  --build-arg VITE_DREAMTWIN_API_URL=/ \
  -t dreamtwin-web:local \
  --load \
  .
ok "images built"

BASE_IMAGES=("public.ecr.aws/docker/library/mysql:8.0")
IMAGES_TO_SHIP=("dreamtwin-api:local" "dreamtwin-web:local")
REMOTE_HAS=$(ssh -i "$SSH_KEY" "$ECS_HOST" "docker images --format '{{.Repository}}:{{.Tag}}' | grep -E '^public.ecr.aws/docker/library/mysql:8.0$' || true")
for img in "${BASE_IMAGES[@]}"; do
  if echo "$REMOTE_HAS" | grep -qx "$img"; then
    ok "ECS already has ${img}, skip ship"
  else
    log "ECS missing ${img}; pulling linux/amd64 locally"
    docker pull --platform linux/amd64 "$img"
    IMAGES_TO_SHIP+=("$img")
  fi
done

log "save + gzip images -> ${TAR_PATH}"
docker save "${IMAGES_TO_SHIP[@]}" | gzip > "$TAR_PATH"
ok "image tar: $(ls -lh "$TAR_PATH" | awk '{print $5}')"

log "package deploy files -> ${DEPLOY_TAR_PATH}"
tar -czf "$DEPLOY_TAR_PATH" deploy package.json package-lock.json Dockerfile .dockerignore

log "scp to ECS..."
scp -i "$SSH_KEY" "$TAR_PATH" "$DEPLOY_TAR_PATH" "$ECS_HOST:/tmp/"
ok "uploaded"

log "ECS load + up..."
ssh -i "$SSH_KEY" "$ECS_HOST" "
  set -euo pipefail
  mkdir -p ${REMOTE_ROOT} ${REMOTE_SRC_DIR} /data/${SERVICE}/${ENV_NAME}

  if [[ ! -f ${REMOTE_ENV_FILE} ]]; then
    echo 'Missing ${REMOTE_ENV_FILE}. Create it before deploy.' >&2
    exit 2
  fi
  chmod 600 ${REMOTE_ENV_FILE}

  if [[ '${SKIP_GIT_CHECK}' != '1' ]]; then
    if [[ ! -d ${REMOTE_SRC_DIR}/.git ]]; then
      rm -rf ${REMOTE_SRC_DIR}
      git clone git@github.com:moonbuding/DreamTwin.git ${REMOTE_SRC_DIR}
    fi
    cd ${REMOTE_SRC_DIR}
    git fetch --quiet
    git reset --hard ${LOCAL_SHA}
  else
    tar -xzf /tmp/${SERVICE}-deploy.tar.gz -C ${REMOTE_SRC_DIR}
  fi

  cd ${REMOTE_SRC_DIR}
  ln -sf ${REMOTE_SRC_DIR}/deploy/caddy/dreamtwin.caddy /etc/caddy/sites/dreamtwin.caddy

  gunzip -c /tmp/${SERVICE}-images.tar.gz | docker load
  rm -f /tmp/${SERVICE}-images.tar.gz /tmp/${SERVICE}-deploy.tar.gz

  docker compose -p ${COMPOSE_PROJECT} -f deploy/docker-compose.prebuilt.yml --env-file ${REMOTE_ENV_FILE} up -d
  caddy validate --config /etc/caddy/Caddyfile
  chown -R caddy:caddy /var/log/caddy || true
  systemctl reload caddy

  docker compose -p ${COMPOSE_PROJECT} -f deploy/docker-compose.prebuilt.yml --env-file ${REMOTE_ENV_FILE} ps
"

rm -f "$TAR_PATH" "$DEPLOY_TAR_PATH"
ok "deploy complete"

echo "Local ECS check:"
echo "  ssh -i ${SSH_KEY} ${ECS_HOST} 'curl -fsS http://127.0.0.1:3100/ >/dev/null && curl -fsS http://127.0.0.1:3100/api/health'"
echo
echo "Public URL once DNS points to 8.138.160.49:"
echo "  https://dreamtwin.hipaql.cn"
