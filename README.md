# Hett CMS

This is the CMS backend for the Hett application.

## Running with Docker

The CMS backend can be run using Docker Compose:

1. Make sure you have Docker and Docker Compose installed
2. Configure your environment variables in `.env` file
3. Build and start the containers:

```bash
docker-compose up -d
```

This will start:
- The CMS backend on http://localhost:3000
- PostgreSQL database

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
