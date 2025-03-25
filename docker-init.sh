#!/bin/bash

echo "Настройка CMS Payload для hettautomotive.ru"

# Подготовка файлов конфигурации SSL
./certbot/ssl-init.sh

# Запуск контейнеров
docker-compose up -d --build

echo "Процесс настройки завершен."
echo "Для полной настройки SSL выполните: docker-compose up certbot"
echo "После успешного выполнения перезапустите Nginx: docker-compose restart nginx"
echo "CMS будет доступна по адресу: https://cms.hettautomotive.ru"
