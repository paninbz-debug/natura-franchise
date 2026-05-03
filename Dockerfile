# Static-site nginx server для Railway-deploy.
# Sprint 15.1 (миграция с GitHub Pages → Railway, 2026-05-03):
# репозиторий стал private после security-sweep, GitHub Pages free-tier
# не работает с private repos. Перенос на Railway сохраняет private-репо
# и даёт стабильный uptime.
FROM nginx:alpine

# nginx-конфиг (gzip, security headers, /healthcheck endpoint).
# Используется отдельный файл вместо heredoc — не все Docker builders
# (Railway nixpacks/buildkit-без-frontend) поддерживают inline COPY <<EOF.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем статику в корень nginx. Dockerfile + nginx.conf + railway.json
# просочатся как файлы внутри html, но они не индексируемы (нет .html).
COPY . /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
