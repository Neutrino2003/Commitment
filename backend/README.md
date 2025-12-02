# Commitment Platform - Backend API

Django REST Framework backend for the Commitment accountability platform with productivity features.

## Overview

This backend provides a comprehensive API for:
- **Tasks Management**: TickTick-like productivity features with lists, tags, and subtasks
- **Habits Tracking**: Streak-based habit monitoring with automatic calculations
- **Commitments**: Accountability system with social, points, or financial stakes
- **Boost Feature**: Convert any task into a high-stakes commitment

## Technology Stack

- **Framework**: Django 5.x + Django REST Framework
- **Database**: PostgreSQL 16+
- **Caching & Queue**: Redis + Celery
- **Authentication**: JWT (Simple JWT)
- **Python**: 3.12+

## Quick Start

### Prerequisites

```bash
# Python 3.12+
python --version

# PostgreSQL
psql --version

#Redis
redis-cli --version
```

### Installation

1. **Clone and navigate**:
```bash
cd backend
```

2. **Create virtual environment**:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate  # Windows
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. **Run migrations**:
```bash
python manage.py migrate
```

6. **Create superuser**:
```bash
python manage.py createsuperuser
```

7. **Run development server**:
```bash
python manage.py runserver
```

Server will start at `http://127.0.0.1:8000/`

## Environment Configuration

Create a `.env` file with the following variables:

```env
# Django Core
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=commitment_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

# Redis & Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Security (Production)
SECURE_SSL_REDIRECT=False
SESSION_COOKIE_SECURE=False
CSRF_COOKIE_SECURE=False
```

## API Documentation

### Base URL

All API endpoints are prefixed with `/api/v1/`

### Authentication

The API uses JWT authentication:

```bash
# Register
POST /api/auth/register/
{
  "username": "john",
  "email": "john@example.com",
  "password": "securepass123"
}

# Login
POST /api/auth/token/
{
  "username": "john",
  "password": "securepass123"
}
# Returns: {"access": "...", "refresh": "..."}

# Refresh token
POST /api/auth/token/refresh/
{
  "refresh": "your-refresh-token"
}
```

Include access token in headers:
```
Authorization: Bearer <access_token>
```

### Tasks API

#### Endpoints

```bash
# List tasks
GET /api/v1/tasks/
# Filters: ?is_completed=false&task_list=1&tags=2,3&overdue=true

# Create task
POST /api/v1/tasks/
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "task_list": 1,
  "priority": 5,
  "due_date": "2025-12-15T17:00:00Z",
  "tag_ids": [1, 2]
}

# Update task
PATCH /api/v1/tasks/123/
{
  "is_completed": true
}

# Complete/Uncomplete task
POST /api/v1/tasks/123/complete/
{
  "is_completed": true
}

# Boost task to commitment
POST /api/v1/tasks/123/boost/
{
  "stake_type": "money",
  "stake_amount": 100.00,
  "evidence_required": true,
  "referee_id": 456
}

# Task Lists
GET /api/v1/lists/
POST /api/v1/lists/
{
  "name": "Work Projects",
  "color": "#FF5733"
}

# Tags
GET /api/v1/tags/
POST /api/v1/tags/
{
  "name": "urgent"
}
```

### Habits API

#### Endpoints

```bash
# List habits
GET /api/v1/habits/

# Create habit
POST /api/v1/habits/
{
  "title": "Morning Exercise",
  "description": "30 minutes workout",
  "days_of_week": "1111100"  # Mon-Fri (binary string)
}

# Log completion
POST /api/v1/habits/42/log/
{
  "date": "2025-12-02",
  "completed": true,
  "notes": "Great workout!"
}

# Get statistics
GET /api/v1/habits/42/stats/
# Returns:
{
  "current_streak": 7,
  "best_streak": 14,
  "total_completions": 85,
  "completion_rate_7_days": 100.0,
  "completion_rate_30_days": 89.7,
  "last_completed": "2025-12-02"
}

# Get logs (with filtering)
GET /api/v1/habits/42/logs/?date_from=2025-11-01&date_to=2025-12-01
```

### Commitments API

#### Standard Endpoints

```bash
# List commitments
GET /api/v1/contracts/

# Create commitment
POST /api/v1/contracts/
{
  "title": "Daily coding practice",
  "description": "Code for 1 hour daily",
  "stake_type": "social",
  "start_time": "2025-12-01T09:00:00Z",
  "end_time": "2025-12-31T23:59:59Z",
  "frequency": "daily"
}

# Submit evidence
POST /api/v1/contracts/123/submit_evidence/
{
  "evidence_file": <file>,
  "evidence_text": "Completed today's session"
}
```

#### Paid Commitments API

Dedicated endpoints for financial stakes:

```bash
# List all paid commitments
GET /api/v1/paid-commitments/

# Get active paid commitments (sorted by stake)
GET /api/v1/paid-commitments/active/

# Get paid commitments history
GET /api/v1/paid-commitments/history/

# Get financial statistics
GET /api/v1/paid-commitments/stats/
# Returns:
{
  "total_staked": 1500.00,
  "total_completed": 900.00,
  "total_forfeited": 300.00,
  "active_stakes_count": 3,
  "active_stakes_amount": 300.00,
  "completed_count": 9,
  "failed_count": 3,
  "success_rate": 75.0
}
```

## Database Schema

### Core Models

#### Users
- CustomUser (extends Django User)
- UserProfile (statistics, preferences)

#### Productivity Domain
- **Task**: Atomic unit of work with due dates, priorities, tags
- **TaskList**: Organizes tasks into projects/categories
- **Tag**: Flexible labeling system
- **Habit**: Recurring behavior with streak tracking
- **HabitLog**: Daily completion records

#### Accountability Domain
- **Commitment**: Core commitment with stakes (social/points/money)
- **Evidence**: Proof of completion (photos, videos, etc.)
- **Complaint**: Appeal system for failed commitments

### Key Relationships

```
User ──┬── Tasks ── TaskList
       ├── Habits ── HabitLogs
       └── Commitments ←── Task (OneToOne, optional boost link)
```

## Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test tasks
python manage.py test habits
python manage.py test commitments

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

## Celery Background Tasks

Start Celery worker:

```bash
celery -A config worker -l info
```

Start Celery beat (for scheduled tasks):

```bash
celery -A config beat -l info
```

## Admin Interface

Access Django admin at `http://127.0.0.1:8000/admin/`

Available models:
- Users & Profiles
- Tasks, Lists, Tags
- Habits & Logs
- Commitments & Evidence
- Complaints

## Production Deployment

### Security Checklist

1. Set `DEBUG=False`
2. Configure `ALLOWED_HOSTS`
3. Use strong `SECRET_KEY`
4. Enable HTTPS settings:
   ```env
   SECURE_SSL_REDIRECT=True
   SESSION_COOKIE_SECURE=True
   CSRF_COOKIE_SECURE=True
   ```
5. Set up proper CORS origins
6. Configure rate limiting
7. Use environment-specific settings

### Database Optimization

```sql
-- Essential indexes are auto-created by migrations
-- Monitor slow queries:
SELECT * FROM pg_stat_statements ORDER BY total_time DESC;
```

### Caching Strategy

- Session storage: Redis
- API responses: Cache frequently accessed endpoints
- Habit stats: 10-minute cache
- Paid commitment stats: 10-minute cache

## Project Structure

```
backend/
├── config/              # Project settings
├── users/               # User management
├── tasks/               # Productivity: Tasks, Lists, Tags
├── habits/              # Habit tracking with streaks
├── commitments/         # Accountability with stakes
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── paid_views.py        # Dedicated paid commitments
│   └── paid_serializers.py  # Financial stats
├── manage.py
└── requirements.txt
```

## Key Features

### The "Boost" Feature ⚡

Convert any task into a commitment with stakes:

1. Create a regular task
2. Call `/api/v1/tasks/{id}/boost/`
3. Specify stake type (social/points/money)
4. Task is now linked to a commitment
5. Track via tasks OR commitments API

### Streak Calculation

Habits automatically calculate:
- Current streak (consecutive completions)
- Best streak (all-time record)
- Completion rates (7-day, 30-day)
- Respects `days_of_week` configuration

### Paid Commitments Dashboard

Dedicated API for financial accountability:
- Separate endpoints from social commitments
- Real-time statistics aggregation
- Success rate tracking
- Active vs. historical view

## API Rate Limiting

- Anonymous: 100 requests/hour
- Authenticated: 1000 requests/hour
- Auth endpoints: 5 requests/minute

## Support

For issues or questions:
1. Check API documentation
2. Review error messages
3. Check Django logs: `python manage.py runserver --verbosity 2`

## License

[Your License Here]

## Version

Current: v1.0.0
API Version: v1
