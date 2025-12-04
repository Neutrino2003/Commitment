#!/bin/bash

# Quick fix script for database configuration
echo "TickTick Clone - Database Quick Fix"
echo "===================================="

# Get PostgreSQL username
echo ""
echo "What is your PostgreSQL username?"
echo "Common options: postgres, your-system-username, or a custom user"
read -p "Enter PostgreSQL username: " PG_USER

# Database name
read -p "Enter database name (press Enter for 'ticktick_clone'): " DB_NAME
DB_NAME=${DB_NAME:-ticktick_clone}

# Password
read -sp "Enter PostgreSQL password (press Enter if no password): " PG_PASSWORD
echo ""

# Update .env file
cat > .env << EOF
# Django Settings
SECRET_KEY=your-secret-key-here-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=${DB_NAME}
DB_USER=${PG_USER}
DB_PASSWORD=${PG_PASSWORD}
DB_HOST=localhost
DB_PORT=5432

# CORS (Frontend URL)
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
EOF

echo ""
echo "✓ Updated .env file"

# Test connection
echo ""
echo "Testing PostgreSQL connection..."
if psql -U "${PG_USER}" -d postgres -c "SELECT version();" > /dev/null 2>&1; then
    echo "✓ PostgreSQL connection successful"
else
    echo "⚠️  Could not connect to PostgreSQL. Please check your credentials."
    exit 1
fi

# Create database if it doesn't exist
echo ""
echo "Creating database..."
psql -U "${PG_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || echo "Database already exists"

# Enable trigram extension
echo "Enabling pg_trgm extension..."
psql -U "${PG_USER}" -d "${DB_NAME}" -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" || true

echo ""
echo "✓ Database setup complete!"
echo ""
echo "Now run:"
echo "  python manage.py makemigrations"
echo "  python manage.py migrate"
echo "  python manage.py createsuperuser"
echo "  python manage.py runserver"
