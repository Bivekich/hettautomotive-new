FROM node:20-alpine AS base

# Установка зависимостей для сборки
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

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

# Копируем файлы для блокировки индексации
COPY --from=builder /app/public/robots.txt ./public/
COPY --from=builder /app/public/.htaccess ./public/
COPY --from=builder /app/public/sitemap.xml ./public/

# Монтируем тома для хранения данных
VOLUME ["/app/media", "/app/.next/server/chunks/uploads"]

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"] 