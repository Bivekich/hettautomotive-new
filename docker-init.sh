#!/bin/bash

echo "Настройка CMS Payload для hettautomotive.ru"

# Создаем необходимые директории
mkdir -p nginx media

# Останавливаем существующие контейнеры
docker-compose down

# Запуск контейнеров
docker-compose up -d --build

echo "Процесс настройки завершен."
echo "CMS будет доступна по адресу: http://176.53.163.7:8080"
