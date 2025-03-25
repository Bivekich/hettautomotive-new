# Hett CMS

This is the CMS backend for the Hett application.

## Деплой на сервер с помощью Docker

Для развертывания CMS на сервере выполните следующие шаги:

1. Склонируйте репозиторий на сервер:
```bash
git clone <repository-url>
cd hettautomotive-cms
```

2. Настройте подключение к базе данных PostgreSQL в файле `.env`:
```
DATABASE_URI=postgres://username:password@your-postgres-host:5432/your-database-name
PAYLOAD_SECRET=your-secret-key-change-this
PAYLOAD_PUBLIC_SERVER_URL=https://cms.hettautomotive.ru
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://cms.hettautomotive.ru
```

3. Запустите скрипт инициализации для автоматической настройки и запуска контейнеров:
```bash
./docker-init.sh
```

4. Настройте SSL сертификаты с помощью Certbot:
```bash
docker-compose up certbot
docker-compose restart nginx
```

После выполнения этих шагов CMS будет доступна по адресу https://cms.hettautomotive.ru

### Требования
- Docker и Docker Compose
- Настроенная запись DNS для домена cms.hettautomotive.ru, указывающая на IP-адрес сервера

## Environment Variables

Configure the following environment variables in your `.env` file:

- `DATABASE_URI`: PostgreSQL connection string
- `PAYLOAD_SECRET`: Secret key for Payload CMS
- `NEXT_PUBLIC_SERVER_URL`: URL for the server

## Development

For local development without Docker:

```bash
pnpm install
pnpm dev
```

## Attributes

- **Database**: mongodb
- **Storage Adapter**: localDisk
