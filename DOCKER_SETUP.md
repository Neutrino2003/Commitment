# Docker Setup Guide

This document explains how to run the Commitment application using Docker.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose installed (version 2.0+)

## Quick Start

### 1. Build and Run All Services

```bash
# From the project root directory
docker-compose up --build
```

This will start:
- **PostgreSQL** database on port `5433` (mapped from container 5432)
- **Redis** on port `6379`
- **Django backend** on port `8000`
- **Celery worker** for async tasks
- **Next.js frontend** on port `3000`

### 2. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **Django Admin**: http://localhost:8000/admin/

**Default Admin Credentials** (created automatically in DEBUG mode):
- Username: `admin`
- Password: `admin123`

### 3. Stop Services

```bash
docker-compose down
```

To also remove volumes (database data):
```bash
docker-compose down -v
```

## Environment Configuration

### Backend Environment Variables

Set these in `docker-compose.yml` or create a `.env` file:

```env
DEBUG=1
SECRET_KEY=your-secret-key-here
DB_ENGINE=django.db.backends.postgresql
DB_NAME=habitapp_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

### Frontend Environment Variables

```env
NEXT_PUBLIC_API_URL=http://backend:8000/api/v1
NEXT_PUBLIC_AUTH_URL=http://backend:8000/api/auth
```

**Note**: When running containers, the frontend uses `http://backend:8000` (Docker service name). For local development without Docker, use `http://localhost:8000`.

## Development vs Production

### Development Mode (Current Setup)

The current `docker-compose.yml` runs in **development mode**:
- Hot reloading enabled (if volumes are uncommented)
- DEBUG=1
- Django runserver (not production-ready)
- Next.js dev server

### For Production

1. **Backend**: Use gunicorn instead of runserver
2. **Frontend**: Build and serve static files
3. **Environment**: Set DEBUG=0, use strong SECRET_KEY
4. **HTTPS**: Configure SSL certificates
5. **Static Files**: Use nginx to serve static/media files

## Network Architecture

### Service Communication

```
Frontend (port 3000)
    ↓ API calls to http://backend:8000
Backend (port 8000)
    ↓ Database queries
PostgreSQL (port 5432, exposed as 5433)
    
Backend
    ↓ Task queue
Redis (port 6379)
    ↓ Processes tasks
Celery Worker
```

### Port Mapping

| Service | Container Port | Host Port |
|---------|---------------|-----------|
| Frontend | 3000 | 3000 |
| Backend | 8000 | 8000 |
| PostgreSQL | 5432 | 5433 |
| Redis | 6379 | 6379 |

## Troubleshooting

### Frontend Can't Connect to Backend

**Issue**: CORS errors or "Network Error"

**Solution**:
1. Check that `NEXT_PUBLIC_API_URL` uses `backend` hostname (not `localhost`)
2. Verify CORS settings in `backend/config/settings.py` include `http://frontend:3000`
3. Ensure all services are running: `docker-compose ps`

### Database Connection Failed

**Issue**: Backend can't connect to database

**Solution**:
1. Ensure PostgreSQL is ready before backend starts (entrypoint script handles this)
2. Check database credentials in docker-compose.yml
3. Verify `DB_HOST=db` (Docker service name)

### Port Already in Use

**Issue**: "Port 3000/8000 is already allocated"

**Solution**:
```bash
# Find and stop processes using the port on Linux
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:8000 | xargs kill -9

# Or change ports in docker-compose.yml
ports:
  - "3001:3000"  # Host:Container
```

### Frontend Shows "localhost refused to connect"

**Issue**: Hardcoded `localhost` URLs in frontend

**Solution**: All auth endpoints now use `AUTH_URL` environment variable. Rebuild:
```bash
docker-compose build frontend
docker-compose up frontend
```

## Useful Commands

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Run Django management commands
docker-compose exec backend python manage.py createsuperuser
docker-compose exec backend python manage.py shell

# Access database
docker-compose exec db psql -U postgres -d habitapp_db

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend

# Reset everything (CAUTION: deletes data)
docker-compose down -v
docker-compose up --build
```

## Next Steps

1. Visit http://localhost:3000
2. Register a new account
3. Create your first commitment
4. Explore Tasks, Habits, and other features!
