# Hett CMS

This is the CMS backend for the Hett application.

## Деплой на сервер с использованием Docker и Portainer

### Требования
- Docker Engine 20.10+
- Portainer для управления контейнерами
- Внешняя база данных PostgreSQL
- Доступ к SMTP-серверу для отправки почты

### Деплой через Portainer

1. Склонируйте репозиторий на сервер:
```bash
git clone <repository-url>
cd hettautomotive-cms
```

2. Настройте переменные окружения в файле `stack.env`:
```bash
cp stack.env.example stack.env
nano stack.env  # или любой другой редактор
```

3. Отредактируйте параметры в файле `stack.env`:
   - `DATABASE_URI` - подключение к внешней базе данных PostgreSQL
   - `PAYLOAD_SECRET` - секретный ключ для шифрования
   - `PAYLOAD_PUBLIC_SERVER_URL` и `NEXT_PUBLIC_SERVER_URL` - URL вашего сервера
   - Настройки SMTP для отправки почты

4. В интерфейсе Portainer:
   - Создайте новый стек (Stack)
   - Загрузите содержимое `docker-compose.yml` и `stack.env` в соответствующие поля
   - Запустите стек

### Сохранение и восстановление медиа-файлов

При обновлении приложения в Portainer медиа-файлы могут быть потеряны. Для их сохранения:

1. **Перед обновлением** выполните скрипт резервного копирования:
```bash
chmod +x backup-media.sh
./backup-media.sh
```

2. После обновления и запуска нового контейнера выполните восстановление:
```bash
chmod +x restore-media.sh
./restore-media.sh
```

Эти скрипты копируют все медиа-файлы и загрузки из запущенного контейнера в локальные директории и затем восстанавливают их в новый контейнер.

### Автоматическое сохранение медиа-файлов

Новая версия Dockerfile включает стадию для автоматического сохранения и восстановления медиа-файлов. Если вы просто пересобираете образ через Portainer, медиа-файлы должны сохраняться автоматически, при условии что:

1. Вы используете именованные тома в Portainer для хранения медиа:
   - `hett_media_data:/app/media`
   - `hett_uploads_data:/app/.next/server/chunks/uploads`

2. Эти тома не удаляются при пересборке образа

### Управление через Portainer

- **Обновление образа**: Используйте кнопку "Recreate" в Portainer для пересборки контейнера
- **Просмотр логов**: Войдите в контейнер в Portainer и просмотрите вкладку "Logs"
- **Консоль**: Доступ к терминалу контейнера через вкладку "Console" в Portainer

## Development

For local development without Docker:

```bash
npm install
npm run dev
```

## Attributes

- **Database**: PostgreSQL
- **Storage Adapter**: localDisk
