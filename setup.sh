#!/bin/bash

# Setup script for TickTick Clone backend
# This script sets up the development environment

set -e

echo "================================================"
echo "TickTick Clone - Backend Setup"
echo "================================================"


# Create PostgreSQL database
echo "\n🗄️  Setting up PostgreSQL database..."
read -p "Enter PostgreSQL username (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Enter database name (default: ticktick_clone): " DB_NAME
DB_NAME=${DB_NAME:-ticktick_clone}

echo "Creating database..."
createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || echo "Database may already exist"

# Enable trigram extension for full-text search
echo "Enabling PostgreSQL extensions..."
psql -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true

# Run migrations
echo "\n📊 Running database migrations..."
python manage.py makemigrations
python manage.py migrate

# Create superuser
echo "\n👤 Creating superuser..."
echo "Please create an admin account:"
python manage.py createsuperuser

# Create test data
echo "\n📝 Creating test data..."
read -p "Would you like to create test data? (y/n): " CREATE_TEST
if [ "$CREATE_TEST" = "y" ]; then
    python manage.py shell < create_test_data.py
fi

echo "\n================================================"
echo "✅ Setup Complete!"
echo "================================================"
echo ""
echo "Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Run: python manage.py runserver"
echo "  3. Visit: http://localhost:8000/api/docs/"
echo "  4. Admin panel: http://localhost:8000/admin/"
echo ""
echo "API Endpoints:"
echo "  - Swagger Docs: http://localhost:8000/api/docs/"
echo "  - Login: POST /api/auth/login/"
echo "  - Sync: GET /api/sync/"
echo "  - Calendar: GET /api/calendar/?start_date=...&end_date=..."
echo ""
