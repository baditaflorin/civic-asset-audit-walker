#!/usr/bin/env bash
set -euo pipefail

npm run build
node scripts/check-pages-build.mjs

port="${SMOKE_PORT:-4173}"
while lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
  port=$((port + 1))
done

node scripts/static-pages-server.mjs "$port" > /tmp/civic-asset-audit-walker-smoke.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" >/dev/null 2>&1 || true' EXIT

for _ in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:${port}/civic-asset-audit-walker/" >/dev/null; then
    break
  fi
  sleep 0.5
done

SMOKE_PORT="$port" npx playwright test tests/e2e/smoke.spec.ts --config=playwright.config.ts
