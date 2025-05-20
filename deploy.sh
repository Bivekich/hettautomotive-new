#!/bin/bash

# Устанавливаем права на выполнение
chmod +x deploy.sh
chmod +x update.sh

echo "Начинаю деплой приложения..."

# Проверка наличия stack.env
if [ ! -f stack.env ]; then
  echo "Файл stack.env не найден. Создаю из примера..."
  cp -n stack.env.example stack.env || echo "Ошибка создания файла stack.env"
  echo "Пожалуйста, отредактируйте файл stack.env с правильными параметрами подключения."
  exit 1
fi

# Создание и запуск контейнеров
echo "Сборка и запуск контейнеров..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Проверка статуса
echo "Проверка статуса контейнеров..."
docker-compose ps

echo "Деплой завершен!"
echo "CMS доступна по адресу, указанному в NEXT_PUBLIC_SERVER_URL"
echo "Для последующих обновлений используйте скрипт: ./update.sh"
echo "Логи доступны командой: docker-compose logs -f" 