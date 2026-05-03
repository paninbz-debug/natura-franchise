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
# тоже окажутся в /usr/share/nginx/html, но они не индексируемы (нет .html
# или not-served file ext'ы), безопасны.
COPY . /usr/share/nginx/html

# Railway инжектит $PORT env var (часто 8080). nginx нативно его не читает,
# поэтому подменяем `listen 80;` на `listen $PORT;` на старте контейнера.
# Default 80 если $PORT не задан (локальный docker run).
ENV PORT=80
EXPOSE 80
CMD sh -c 'sed -i "s/listen 80/listen ${PORT:-80}/" /etc/nginx/conf.d/default.conf && nginx -g "daemon off;"'
