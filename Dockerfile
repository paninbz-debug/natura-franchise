# Static-site nginx server для Railway-deploy.
# Sprint 15.1 (миграция с GitHub Pages → Railway, 2026-05-03):
# репозиторий стал private после security-sweep, GitHub Pages free-tier
# не работает с private repos. Перенос на Railway сохраняет private-репо
# и даёт стабильный uptime.
FROM nginx:alpine

# Копируем весь корень репо — index.html, b.html, event.html,
# privacy.html, sentry-test.html, ab.js, script.js, sentry-init.js,
# styles.css, img/, assets/, favicon.svg, CNAME, etc.
COPY . /usr/share/nginx/html

# Минимальный nginx-конфиг: SPA-friendly, gzip, security headers.
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
  listen 80 default_server;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Cache HTML коротко (актуальность контента важнее), assets — длинно.
  location ~* \.(html|htm)$ {
    add_header Cache-Control "no-cache, must-revalidate, max-age=0" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    add_header Cache-Control "public, max-age=86400" always;
  }

  # Healthcheck endpoint (Railway / Sentry monitor 06)
  location = /healthcheck {
    access_log off;
    return 200 "ok\n";
    add_header Content-Type text/plain;
  }

  # Default: try file → 404
  location / {
    try_files $uri $uri/ =404;
  }

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;
  gzip_min_length 256;
}
EOF

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
