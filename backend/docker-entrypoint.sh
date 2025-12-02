#!/bin/bash
set -e

# Wait for database to be ready
echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."

# Use timeout to prevent infinite loop  
TIMEOUT=60
COUNTER=0

while ! nc -z ${DB_HOST} ${DB_PORT}; do
  sleep 1
  COUNTER=$((COUNTER+1))
  if [ $((COUNTER % 10)) -eq 0 ]; then
    echo "Still waiting for PostgreSQL... ($COUNTER seconds)"
  fi
  if [ $COUNTER -gt $TIMEOUT ]; then
    echo "ERROR: PostgreSQL did not become ready in $TIMEOUT seconds"
    echo "Tried to connect to ${DB_HOST}:${DB_PORT}"
    exit 1
  fi
done

echo "PostgreSQL started"

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Create superuser if doesn't exist (for development)
if [ "${DEBUG:-0}" = "1" ]; then
  echo "Creating superuser if it doesn't exist..."
  python manage.py shell << END
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
    print('Superuser created: admin/admin123')
else:
    print('Superuser already exists')
END
fi

# Execute the main command
exec "$@"
