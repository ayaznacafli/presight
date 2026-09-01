#!/usr/bin/env bash
###############################################################################
# Frees the host ports the stack binds, then brings it up.
#
# Compose itself cannot do this: it has no pre-start hook, and its containers
# live in a VM with no view of host processes. So the "port busy -> kill the
# holder" step runs here, on the host, before `docker compose up` binds.
#
#   ./scripts/compose-up.sh            # same ports as compose defaults
#   WEB_PORT=3000 ./scripts/compose-up.sh --build
###############################################################################
set -euo pipefail

cd "$(dirname "$0")/.."

API_PORT="${API_PORT:-4000}"
WEB_PORT="${WEB_PORT:-8080}"

free_port() {
  local port="$1" label="$2" pids pid cmd
  pids="$(lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u || true)"
  [ -n "$pids" ] || return 0

  for pid in $pids; do
    cmd="$(ps -o command= -p "$pid" 2>/dev/null | head -1)"

    # A Docker listener means a container already holds the port. Compose
    # recreates its own containers, and killing the daemon or a docker-proxy
    # would take Docker Desktop down with it.
    case "$cmd" in
      *com.docker*|*Docker*Desktop*|*vpnkit*|*docker-proxy*)
        echo "==> :$port ($label) held by Docker — leaving it for compose to recreate"
        continue
        ;;
    esac

    echo "==> :$port ($label) busy — killing pid $pid"
    echo "    ${cmd:0:100}"
    kill "$pid" 2>/dev/null || true

    for _ in $(seq 1 10); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done

    if kill -0 "$pid" 2>/dev/null; then
      echo "    still alive after SIGTERM — sending SIGKILL"
      kill -9 "$pid" 2>/dev/null || true
      sleep 1
    fi
  done
}

free_port "$API_PORT" api
free_port "$WEB_PORT" web

exec docker compose up "$@"
