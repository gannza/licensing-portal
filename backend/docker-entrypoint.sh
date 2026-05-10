#!/bin/sh
set -e

echo "Running database migrations..."
npm run migrate

echo "Seeding database..."
npm run seed

echo "Starting server..."
exec node src/server.js
