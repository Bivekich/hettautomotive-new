# Деплой приложения через Docker Compose

## Требования

- Docker и Docker Compose
- Доступ к базе данных PostgreSQL (уже настроена)

## Инструкции по деплою

1. Убедитесь, что Docker и Docker Compose установлены на вашем сервере

2. Клонируйте репозиторий на сервер:

```bash
git clone <repository-url>
cd hettautomotive-new
```

3. Запустите скрипт для деплоя:

```bash
chmod +x docker-start.sh
./docker-start.sh
```

4. Приложение будет доступно по адресу `http://your-server-ip:8080`

## Настройка переменных окружения

При необходимости вы можете изменить настройки в файле `.env.docker`:

- `NEXT_PUBLIC_APP_URL` - URL вашего основного сайта
- `DATABASE_URI` - строка подключения к базе данных PostgreSQL
- `PAYLOAD_SECRET` - секретный ключ для Payload CMS
- `PAYLOAD_PUBLIC_SERVER_URL` - публичный URL для Payload CMS
- `NEXT_PUBLIC_SERVER_URL` - публичный URL для Next.js

## Управление контейнерами

- Остановка контейнеров: `docker-compose down`
- Просмотр логов: `docker-compose logs -f`
- Перезапуск: `docker-compose restart`
