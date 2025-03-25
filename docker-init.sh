#!/bin/bash

echo "Настройка CMS Payload для hettautomotive.ru"

# Создаем необходимые директории
mkdir -p nginx media

# Останавливаем существующие контейнеры
docker-compose down

# Запуск контейнеров
docker-compose up -d --build

echo "Процесс настройки завершен."
echo "CMS доступна внутри сервера по адресу: http://localhost:8080"
echo ""
echo "Для настройки домена cms.hettautomotive.ru:"
echo "1. Скопируйте nginx-proxy.conf в /etc/nginx/sites-available/"
echo "2. Создайте симлинк: ln -s /etc/nginx/sites-available/nginx-proxy.conf /etc/nginx/sites-enabled/"
echo "3. Проверьте конфигурацию: nginx -t"
echo "4. Перезапустите Nginx: systemctl restart nginx"
echo ""
echo "После этого CMS будет доступна по адресу: https://cms.hettautomotive.ru"
