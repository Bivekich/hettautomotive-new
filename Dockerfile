FROM node:20-alpine AS base

# Установка зависимостей для sharp (обработка изображений)
RUN apk add --no-cache vips-dev python3 make g++

# Установка рабочей директории
WORKDIR /app

# Копирование файлов package.json и yarn.lock
COPY package*.json ./
COPY .yarnrc ./

# Установка зависимостей
RUN npm ci

# Копирование исходного кода
COPY . .

# Генерация типов Payload
RUN npm run generate:types

# Сборка приложения
RUN npm run build

# Запуск приложения
CMD ["npm", "run", "start"]
