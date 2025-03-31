#!/bin/bash

# Копирование .env.docker в .env для использования Docker Compose
cp .env.docker .env

# Запуск приложения через Docker Compose
docker-compose up -d

echo "Приложение запущено на порту 8080"
echo "Доступ: http://localhost:8080"
