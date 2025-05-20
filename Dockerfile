FROM node:20-alpine AS base

# Установка зависимостей для сборки
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Стадия для сохранения медиа-файлов (если они существуют)
FROM alpine:latest AS media-backup
WORKDIR /backup
# Копируем медиа-файлы, если они существуют в предыдущей сборке
COPY media /backup/media || true
COPY .next/server/chunks/uploads /backup/uploads || true
# Создаем директории, если их не было
RUN mkdir -p /backup/media /backup/uploads

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Финальный образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Создаем пользователя для запуска приложения
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Создаем директории для медиа файлов
RUN mkdir -p media .next/server/chunks/uploads && \
    chown -R nextjs:nodejs media .next/server/chunks/uploads

# Копируем необходимые файлы
COPY --from=builder /app/next.config.mjs .
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Копируем сохраненные медиа-файлы из резервной копии
COPY --from=media-backup --chown=nextjs:nodejs /backup/media/ ./media/
COPY --from=media-backup --chown=nextjs:nodejs /backup/uploads/ ./.next/server/chunks/uploads/

# Копируем файлы для блокировки индексации (если не были скопированы ранее)
COPY --from=builder /app/public/robots.txt ./public/robots.txt
COPY --from=builder /app/public/.htaccess ./public/.htaccess
COPY --from=builder /app/public/sitemap.xml ./public/sitemap.xml

# Монтируем тома для хранения данных
VOLUME ["/app/media", "/app/.next/server/chunks/uploads"]

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"] 