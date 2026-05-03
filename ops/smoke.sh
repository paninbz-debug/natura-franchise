#!/usr/bin/env bash
# natura-franchise — Sprint 15 smoke test
# Static-site: HTML/CSS/JS, нет vitest/playwright. 5 критичных curl+grep проверок.
# Запуск:
#   ./ops/smoke.sh                                  # против prod (CNAME из ниже)
#   NATURA_HOST=https://staging.example.com ops/smoke.sh
# Exit 0 — все 5 ✅. Exit 1 — хоть одна ❌.
#
# Создан watcher'ом 2026-05-03 (preemptive baseline для Sprint 15 sub-agent).
# Sub-agent может расширять/уточнять критерии (например после добавления Sentry CDN —
# отдельная проверка что `<script src="https://browser.sentry-cdn.com/..."` присутствует).

set -u
set -o pipefail

# CNAME = xn----7sbaba2bg3bexixnd7d.xn--p1ai (punycode «натура-франшиза.рф»)
HOST="${NATURA_HOST:-https://xn----7sbaba2bg3bexixnd7d.xn--p1ai}"
TIMEOUT="${TIMEOUT:-15}"

PASS=0
FAIL=0

check() {
  local name="$1"; shift
  local url="$1"; shift
  local expect_status="$1"; shift
  local expect_body="${1-}"

  local code body http_body http_code
  http_body="$(mktemp)"
  http_code=$(curl -fsS -o "$http_body" -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>/dev/null || echo "000")
  body="$(cat "$http_body" 2>/dev/null || true)"
  rm -f "$http_body"

  if [ "$http_code" != "$expect_status" ]; then
    echo "❌ $name — expected HTTP $expect_status, got $http_code ($url)"
    FAIL=$((FAIL+1))
    return 1
  fi

  if [ -n "$expect_body" ]; then
    if ! printf '%s' "$body" | grep -qF "$expect_body"; then
      echo "❌ $name — body missing «$expect_body» ($url)"
      FAIL=$((FAIL+1))
      return 1
    fi
  fi

  echo "✅ $name — $http_code ($url)"
  PASS=$((PASS+1))
}

echo "==================================================================="
echo "natura-franchise smoke test — host: $HOST"
echo "==================================================================="

# 1. Homepage 200 + содержит «Натура» (стабильный бренд-маркер)
check "01-homepage"      "$HOST/"           "200" "Натура"

# 2. /b.html (A/B-вариант — 50% трафика)
check "02-b-variant"     "$HOST/b.html"     "200" "Natura"

# 3. /event.html (event-страница)
check "03-event-page"    "$HOST/event.html" "200"

# 4. /ab.js (A/B-split script — критичен для cookie-persistent сплита)
check "04-ab-script"     "$HOST/ab.js"      "200"

# 5. /styles.css (главный bundle стилей)
check "05-styles"        "$HOST/styles.css" "200"

# 6. ?_probe=true heartbeat — проверяем что probe-URL отвечает 200 (Sentry heartbeat
#    включится только когда DSN заменен; проверка что страница не падает на query param)
check "06-probe-heartbeat" "$HOST/?_probe=true" "200" "Натура"

echo "==================================================================="
echo "Result: $PASS pass / $FAIL fail"
echo "==================================================================="

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
