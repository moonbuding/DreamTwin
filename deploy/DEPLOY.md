# DreamTwins ECS Deploy

This follows the hipa ECS pattern: build linux/amd64 images on the Mac, ship
them to ECS, run with Docker Compose, and expose through host Caddy.

## Runtime

- ECS: `root@8.138.160.49`
- SSH key: `~/.ssh/hipa_deploy`
- Service root: `/srv/dreamtwin/prod`
- Data root: `/data/dreamtwin/prod`
- Host port: `3100`
- Caddy site: `/etc/caddy/sites/dreamtwin.caddy`
- Public domain: `dreamtwin.hipaql.cn`

## First-time ECS env

Create `/srv/dreamtwin/prod/.env` on ECS with:

```env
HOST_PORT=3100
DATA_ROOT=/data/dreamtwin/prod
MYSQL_ROOT_PASSWORD=replace-me
MYSQL_DATABASE=dreamtwin
MYSQL_USER=dreamtwin
MYSQL_PASSWORD=replace-me
JWT_SECRET=replace-me
JWT_EXPIRES_IN=30d
DEEPSEEK_API_KEY=replace-me
DEEPSEEK_MODEL=deepseek-v4-flash
```

Keep it `0600` and outside the Git repo.

## Deploy

Strict mode, for normal releases:

```bash
git status
git push -u origin "$(git branch --show-current)"
bash deploy/scripts/build-and-ship.sh prod
```

One-off deploy from a dirty working tree:

```bash
SKIP_GIT_CHECK=1 bash deploy/scripts/build-and-ship.sh prod
```

## Verify

```bash
ssh -i ~/.ssh/hipa_deploy root@8.138.160.49 \
  'curl -fsS http://127.0.0.1:3100/api/health'
```

When DNS points `dreamtwin.hipaql.cn` to `8.138.160.49`, verify:

```bash
curl -I https://dreamtwin.hipaql.cn
```
