#!/bin/bash

# Устанавливаем права на выполнение
chmod +x restore-media.sh

CONTAINER_NAME="hett-cms"
MEDIA_BACKUP_DIR="./media-backup"
UPLOADS_BACKUP_DIR="./uploads-backup"

echo "Начинаю восстановление медиа-файлов..."

# Проверяем наличие директорий с бэкапами
if [ ! -d "$MEDIA_BACKUP_DIR" ] || [ ! -d "$UPLOADS_BACKUP_DIR" ]; then
    echo "Ошибка: Директории с резервными копиями не найдены."
    echo "Убедитесь, что вы сначала выполнили резервное копирование: ./backup-media.sh"
    exit 1
fi

# Проверяем, запущен ли контейнер
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Контейнер запущен, восстанавливаю файлы в контейнер..."
    
    # Восстанавливаем файлы в контейнер
    docker cp "$MEDIA_BACKUP_DIR/." "$CONTAINER_NAME:/app/media/"
    docker cp "$UPLOADS_BACKUP_DIR/." "$CONTAINER_NAME:/app/.next/server/chunks/uploads/"
    
    # Устанавливаем правильные права
    docker exec "$CONTAINER_NAME" chown -R nextjs:nodejs /app/media
    docker exec "$CONTAINER_NAME" chown -R nextjs:nodejs /app/.next/server/chunks/uploads
    
    echo "Восстановление завершено!"
    echo "Файлы восстановлены из:"
    echo " - $MEDIA_BACKUP_DIR"
    echo " - $UPLOADS_BACKUP_DIR"
else
    echo "Контейнер $CONTAINER_NAME не запущен или не существует."
    echo "Запустите контейнер перед восстановлением файлов."
    exit 1
fi 