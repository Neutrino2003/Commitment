# Commitment - Productivity App with Stakes

A full-stack productivity application that combines task management, habit tracking, and commitment-based accountability. Built with Django REST Framework backend and Next.js frontend.

## 🚀 Features

### Core Features
- **Task Management** - Create, edit, delete tasks with priority levels
- **Infinite Task Nesting** - Unlimited subtask depth using django-treebeard
- **Habit Tracking** - Daily/weekly habit logging with streak calculation
- **Commitments with Stakes** - Boost tasks with social, points, or monetary stakes
- **Smart Recurrence** - RFC 5545 RRULE support (e.g., "Every 3rd Friday")
- **Calendar View** - Date range queries with recurring task expansion

### Frontend Features
- **Neo-brutalist UI** - Bold, modern design with sharp shadows and vibrant colors
- **Dashboard** - Overview of tasks, habits, and commitments
- **Task Boost** - Convert any task to a commitment with stakes
- **Nested Task Display** - Visual tree structure for subtasks
- **Responsive Design** - Works on desktop and mobile

### Technical Highlights
- **PostgreSQL** - GinIndex for full-text search, composite indexes
- **Redis + Celery** - Background tasks and scheduled jobs
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **Docker Support** - Complete docker-compose setup
- **Service Layer** - Clean separation of business logic

## 📋 Requirements

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Redis (for Celery)

## ⚙️ Installation

### Docker Setup (Recommended)

```bash
# Clone repository
git clone <repo-url>
cd ticktick_clone

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### Manual Setup

#### Backend
```bash
cd ticktick_clone

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup database
createdb ticktick_clone
psql -d ticktick_clone -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run server
python manage.py runserver
```

#### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

## 🏃 Running

### With Docker
```bash
docker-compose up
```

### Without Docker
```bash
# Terminal 1 - Backend
cd ticktick_clone
source venv/bin/activate
python manage.py runserver

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Celery Worker (optional)
celery -A config worker -l info

# Terminal 4 - Celery Beat (optional)
celery -A config beat -l info
```

**URLs:**
- Frontend: http://localhost:3000
- API: http://localhost:8000/api/
- Admin: http://localhost:8000/admin/
- API Docs: http://localhost:8000/api/docs/

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login (get JWT) |
| POST | `/api/auth/token/refresh/` | Refresh token |
| GET | `/api/auth/profile/` | Get profile |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | List tasks |
| POST | `/api/tasks/` | Create task |
| GET | `/api/tasks/{id}/` | Get task |
| PATCH | `/api/tasks/{id}/` | Update task |
| DELETE | `/api/tasks/{id}/` | Delete task |
| GET | `/api/tasks/tree/` | Get tree structure |

### Habits
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/habits/` | List habits |
| POST | `/api/habits/` | Create habit |
| PATCH | `/api/habits/{id}/` | Update habit |
| DELETE | `/api/habits/{id}/` | Delete habit |

### Commitments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/commitments/` | List commitments |
| POST | `/api/commitments/` | Create commitment |
| PATCH | `/api/commitments/{id}/` | Update commitment |
| POST | `/api/commitments/{id}/activate/` | Activate commitment |
| POST | `/api/commitments/{id}/complete/` | Complete commitment |

### Special Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sync/` | Get all user data |
| GET | `/api/calendar/` | Calendar view with recurring expansion |

## 🏗️ Project Structure

```
ticktick_clone/
├── config/                 # Django configuration
│   ├── settings.py
│   ├── celery.py          # Celery configuration
│   └── urls.py
├── apps/
│   ├── users/             # User authentication
│   ├── tasks/             # Task, List, Tag, Habit
│   └── commitments/       # Commitments with stakes
├── frontend/              # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── hooks/             # Custom hooks
│   └── lib/               # Utilities & API
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## 🧩 Key Models

### Task
- `title`, `notes`, `status`, `priority`
- `due_date`, `start_date`, `duration_minutes`
- `recurrence` (RFC 5545 RRULE)
- `parent_id` (for nesting via treebeard)
- `list` (FK), `tags` (M2M)

### Commitment
- `task` (FK) - Linked task
- `title`, `due_date`, `status`
- `stake_type` (social/points/money)
- `stake_amount`, `currency`
- `leniency` (lenient/normal/hard)
- `evidence_type`, `evidence_file`

### Habit
- `name`, `description`, `color`, `icon`
- `frequency` (DAILY/WEEKLY/CUSTOM)
- `streak`, `completion_rate`

## 🔧 Environment Variables

```env
# Database
POSTGRES_DB=ticktick
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost

# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
```

## 🚀 Deployment

### Production Checklist
1. Set `DEBUG=False`
2. Configure `ALLOWED_HOSTS`
3. Use strong `SECRET_KEY`
4. Enable HTTPS
5. Configure CORS properly
6. Set up proper database credentials
7. Configure Redis for production
8. Set up Celery workers

## 📦 Key Dependencies

### Backend
- Django 4.2
- Django REST Framework
- django-treebeard (tree structures)
- django-recurrence (RRULE support)
- djangorestframework-simplejwt
- Celery + Redis

### Frontend
- Next.js 15
- React 18
- TanStack Query
- Tailwind CSS
- Lucide Icons
- React Hot Toast

## 📝 License

MIT License

## 🙏 Acknowledgments

- TickTick for inspiration
- Django and Next.js communities
