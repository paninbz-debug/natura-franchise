# Natura Franchise · Operations configs (Sprint 15 — adapted for static site)

> Создано watcher'ом 2026-05-01 21:34 MSK; код-инструментация добавлена 2026-05-03
> в Sprint 15 sub-agent сессии (тег `v0.1.0-sprint15-natura-testing`).
> Шаблоны JSON — для копи-паста в Sentry/cron-job.org UI.

## ✅ Code-side готово (тег v0.1.0-sprint15-natura-testing)

- `index.html`, `b.html`, `event.html` — Sentry CDN + init с placeholder DSN, image-error listener, `?_probe=true` heartbeat.
- `script.js` — submit-handler в try/catch, `sendToTelegram` / `sendToEmail` репортят ошибки в Sentry с тегом `lead_stage`, CTA-click без modal-open детектится как `cta-click-no-modal`.
- `event.html` — inline submit handler логирует tg/formsubmit-фейлы в Sentry.
- `sentry-test.html` — страница self-test с 5 кнопками (throw, captureMessage, promise reject, broken img, SDK status).
- `ops/smoke.sh` — расширен `?_probe=true` проверкой (6 чеков).

## 🚦 Что осталось ручного для Данила (apply-side)

1. **Sentry project setup**
   - Создать проект `natura-franchise` (Browser SDK, без server-side).
   - Скопировать DSN.
   - В корне репо запустить:
     ```bash
     # Замена placeholder DSN во всех 4 файлах одной командой:
     DSN='https://YOUR_REAL_DSN@oXXXXXX.ingest.sentry.io/YYYYY'
     for f in index.html b.html event.html sentry-test.html; do
       sed -i '' "s|__SENTRY_DSN__|$DSN|" "$f"
     done
     git diff   # проверить
     git add index.html b.html event.html sentry-test.html
     git commit -m "ops(sentry): set production DSN"
     git push
     ```

2. **Apply Sentry alerts (≥30 мин UI-кликания)**
   - Открыть Sentry UI → Alerts → Create Alert Rule.
   - Скопировать 8 JSON-конфигов из `ops/sentry-alerts/*.json` (по одному alert-у).
   - Webhook target → `TELEGRAM_DPA_ALERTS_WEBHOOK` (тот же, что у Lumo/ofislab).

3. **Apply cron-job.org synthetic monitors (≥15 мин)**
   - Зарегаться/залогиниться на cron-job.org.
   - Создать 5 GET-jobs из `ops/synthetic-monitors/*.json`. Заменить `<NATURA_PROD_HOST>` на актуальный.
     - CNAME: `xn----7sbaba2bg3bexixnd7d.xn--p1ai` (= натура-франшиза.рф). Подтвердить в `/CNAME` перед apply.
   - Notification → Telegram bot.

4. **Smoke-test cron (опц.)**
   - Добавить GitHub Action (workflow `.github/workflows/smoke.yml`) с расписанием каждые 30 мин:
     ```yaml
     - run: bash ops/smoke.sh
     ```
   - Или запускать `ops/smoke.sh` локально для быстрой проверки.

5. **Sentry self-test verification**
   - Открыть `https://<host>/sentry-test.html` после деплоя.
   - Кликнуть «5. Show Sentry SDK status» — должно показать DSN host (не warning).
   - Кликнуть «1. throw new Error» — через ~30 сек проверить Issues в Sentry UI.

6. **TG_BOT_TOKEN audit (повторно)**
   - После `9254bf0` (revoke) — токен в `script.js` пустой, `sendToTelegram` no-op.
   - Долгосрочный fix: server-side relay (Cloudflare Worker / YC Function). Вне scope Sprint 15.

## ⚠️ Static-site adaptation (важно)

Sprint 15 для natura-franchise **отличается** от Sprint 15 для остальных DPA SaaS:

| Аспект | Lumo / ofislab / avito-log / marketolog | Natura |
|---|---|---|
| Stack | Next.js 15 + React | Plain HTML + vanilla JS |
| Tests | vitest + Playwright @critical | Нет JS тестов; smoke-grep + Playwright (опц.) |
| Sentry SDK | `@sentry/nextjs` (server + client + edge) | `@sentry/browser` через `<script>` CDN tag |
| Lead-form path | `/api/lead` (Next route) | client-side fetch к `formsubmit.co` + Telegram bot |
| Build | `next build` standalone | static files served as-is |
| Deploy | Railway | (TBD — GitHub Pages / Netlify / custom) |

→ Шаблоны в этой папке — **не калька с Lumo/ofislab**, а перерисованы под static-site реальность.

## Структура

```
ops/
├── synthetic-monitors/        # 5 cron-job.org probe configs
│   ├── 01-uptime.json                · 60s · / · bodyContains "Франшиза Natura"
│   ├── 02-b-variant.json             · 5m · /b.html (A/B variant)
│   ├── 03-event-page.json            · 10m · /event.html
│   ├── 04-ab-script.json             · 6h · /ab.js (A/B-split script)
│   └── 05-styles-bundle.json         · 12h · /styles.css (critical asset)
└── sentry-alerts/             # 8 Sentry alert rule configs (browser-side)
    ├── 01-frontend-vitals-lcp-cls.json   · medium · RUM (LCP/CLS p75)
    ├── 02-lead-form-failures.json        · CRITICAL · money-path (любая ошибка submit)
    ├── 03-broken-images.json             · medium · img/* 404
    ├── 04-js-errors.json                 · high · catch-all unhandled exceptions
    ├── 05-cta-broken.json                · high · CTA-click без modal-open
    ├── 06-formsubmit-error.json          · medium · external email-relay fail
    ├── 07-telegram-error.json            · CRITICAL · primary lead-channel fail
    └── 08-sentry-self-test.json          · medium · 12h heartbeat absence
```

## SLO targets (по образцу остальных DPA SaaS, скорректированы под premium франшиза-лендинг)

- Uptime: ≥ 99.5% / 30d.
- LCP p75: ≤ 2500ms / day (premium-brand spec).
- CLS p75: ≤ 0.1.
- INP p75: ≤ 200ms.
- Lead-form success: 100% / 24h (любая ошибка submit → instant page).
- Broken-image rate: ≤ 5/h.
- Telegram bot delivery: 100% (это primary канал; formsubmit — вторичный).

## Связь с предыдущими спринтами

- `9254bf0` (security: revoke leaked Telegram bot token) — Sprint 15 alerts помогут раннему обнаружению повторных утечек.
- `64ef2bf` (новые цены пауш + скидки до конца года) — content-update, не code-change. Вне scope Sprint 15.
- `11eda56` (chore(hooks): Stop-hook for sprint queue auto-continuation) — Sprint 9 артефакт, отдельная тема.

## Что осталось вне scope Sprint 15

- Server-side relay для Telegram-нотификаций (Cloudflare Worker / YC Function) — отдельный архитектурный спринт.
- Playwright @critical specs — пока заменяет `ops/smoke.sh`. Если понадобится UI-уровень, добавлять отдельно.
- НЕ создавал Playwright/vitest setup — Данил может выбрать: (a) использовать GitHub Actions + curl-grep вместо них, (b) полноценно поднять Node + Playwright, (c) вообще skip — natura малый scope, JS-тесты могут быть оверкиллом.
- НЕ выбирал между Cloudflare Workers / Yandex Cloud Functions для server-side proxy лида (TG token leak долгосрочный fix). Это архитектурное решение Данила.
