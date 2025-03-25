#!/bin/bash

# Script to build and run the Docker container for Hett CMS

echo "Building and starting Hett CMS backend..."

# Stop any running containers
echo "Stopping any existing containers..."
docker-compose down

# Build and start the containers
echo "Building and starting containers..."
docker-compose up -d

echo "Containers started successfully!"
echo "CMS is running at: http://localhost:3000"
echo "PostgreSQL is running at: localhost:5432"

# Show logs
echo "Showing logs (press Ctrl+C to exit logs):"
docker-compose logs -f 