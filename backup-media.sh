#!/bin/bash

# Устанавливаем права на выполнение
chmod +x backup-media.sh

CONTAINER_NAME="hett-cms"
MEDIA_BACKUP_DIR="./media-backup"
UPLOADS_BACKUP_DIR="./uploads-backup"

echo "Начинаю резервное копирование медиа-файлов..."

# Создаем директории для бэкапа
mkdir -p "$MEDIA_BACKUP_DIR"
mkdir -p "$UPLOADS_BACKUP_DIR"

# Проверяем, запущен ли контейнер
if [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "Контейнер запущен, копирую файлы из контейнера..."
    
    # Копируем файлы из контейнера
    docker cp "$CONTAINER_NAME:/app/media/." "$MEDIA_BACKUP_DIR/"
    docker cp "$CONTAINER_NAME:/app/.next/server/chunks/uploads/." "$UPLOADS_BACKUP_DIR/"
    
    echo "Резервное копирование завершено!"
    echo "Файлы сохранены в:"
    echo " - $MEDIA_BACKUP_DIR"
    echo " - $UPLOADS_BACKUP_DIR"
    
    echo "Для восстановления файлов запустите: ./restore-media.sh"
else
    echo "Контейнер $CONTAINER_NAME не запущен или не существует."
    echo "Невозможно выполнить резервное копирование."
    exit 1
fi 