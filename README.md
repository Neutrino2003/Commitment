# Commitment - Anti-Procrastination Productivity App

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Django](https://img.shields.io/badge/Django-4.2-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

**Turn your goals into commitments with real stakes.**

</div>

---

## 🎯 Overview

Commitment is a full-stack productivity application that combines **task management**, **habit tracking**, and **accountability contracts with financial stakes**. It's designed to help you stop procrastinating by putting your money where your mouth is.

### Key Differentiators
- 💰 **Financial Stakes** - Bet money on your goals. Fail = lose money.
- ⏱️ **Time-Block Scheduling** - Schedule tasks for specific time windows
- 🔥 **Streak Tracking** - Visual heatmaps for habit consistency
- 🎯 **Kanban Board** - Drag-and-drop task organization
- ⌘K **Command Palette** - Quick navigation and search

---

## ✨ Features

### Task Management
| Feature | Status |
|---------|--------|
| Create/Edit/Delete Tasks | ✅ |
| Infinite Subtask Nesting | ✅ |
| Priority Levels (None/Low/Medium/High) | ✅ |
| Lists & Tags Organization | ✅ |
| Kanban Board View | ✅ |
| Task Detail Modal | ✅ |
| File Attachments | ✅ |
| Time-Block Scheduling | ✅ |
| Scheduled Timers | ✅ |
| Recurring Tasks (RRULE) | ✅ |

### Habit Tracking
| Feature | Status |
|---------|--------|
| Daily/Weekly Habits | ✅ |
| Streak Calculation | ✅ |
| Completion Rate | ✅ |
| GitHub-style Heatmap | ✅ |
| Analytics Dashboard | ✅ |
| Quick Log Widget | ✅ |

### Commitments (Accountability)
| Feature | Status |
|---------|--------|
| Create Commitments with Stakes | ✅ |
| Social/Points/Money Stake Types | ✅ |
| Evidence Upload (Photo/Video) | ✅ |
| Lifecycle Timeline | ✅ |
| Appeal System | ✅ |
| Leniency Levels | ✅ |

### Authentication & Security
| Feature | Status |
|---------|--------|
| Email/Password Login | ✅ |
| Google OAuth | ✅ |
| JWT with Refresh Tokens | ✅ |
| Protected Routes | ✅ |

---

## 🛠️ Tech Stack

### Backend
- **Framework:** Django 4.2 + Django REST Framework
- **Database:** PostgreSQL with GinIndex for search
- **Auth:** JWT (SimpleJWT) + django-allauth (OAuth)
- **Tree Structure:** django-treebeard (Materialized Path)
- **Recurrence:** django-recurrence (RFC 5545 RRULE)
- **Task Queue:** Celery + Redis
- **File Storage:** Local filesystem (configurable for S3)

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS (Neobrutalist Design)
- **State:** TanStack React Query
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Redis (optional, for Celery)

### 1. Clone & Setup Environment

```bash
git clone https://github.com/yourusername/commitment.git
cd commitment

# Create environment file
cp .env.example .env
# Edit .env with your database credentials
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
createdb commitment_db
python manage.py migrate
python manage.py createsuperuser

# Run backend
python manage.py runserver
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run frontend
npm run dev
```

### 4. Access the App

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend |
| http://localhost:8000/api/ | API |
| http://localhost:8000/admin/ | Django Admin |
| http://localhost:8000/api/docs/ | API Documentation |

---

## 📁 Project Structure

```
commitment/
├── config/                    # Django configuration
│   ├── settings.py
│   ├── urls.py
│   └── celery.py
├── apps/
│   ├── users/                 # Authentication
│   ├── tasks/                 # Tasks, Lists, Tags, Habits
│   └── commitments/           # Commitments & Stakes
├── frontend/
│   ├── app/                   # Next.js pages
│   │   ├── tasks/             # Task list & Kanban
│   │   ├── habits/            # Habits & Analytics
│   │   ├── commitments/       # Commitment management
│   │   └── auth/              # OAuth callbacks
│   ├── components/
│   │   ├── tasks/             # TaskCard, TaskDetailModal, etc.
│   │   ├── habits/            # HabitCalendar, QuickLogWidget
│   │   ├── commitments/       # CommitmentCard, Timeline
│   │   ├── ui/                # Buttons, Cards, FileUpload
│   │   └── layout/            # Navbar, CommandPalette
│   ├── contexts/              # TimerContext
│   ├── hooks/                 # useTasks, useHabits, etc.
│   └── lib/                   # API client, utilities
├── .env.example
├── requirements.txt
├── docker-compose.yml
└── README.md
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Django
SECRET_KEY=your-super-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=commitment_db
DB_USER=postgres
DB_PASSWORD=your-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/0

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

---

## 📡 API Endpoints

### Authentication
```
POST /api/auth/register/        # Register
POST /api/auth/login/           # Login (JWT)
POST /api/auth/token/refresh/   # Refresh token
GET  /api/auth/google/          # Google OAuth
```

### Tasks
```
GET    /api/tasks/              # List tasks
POST   /api/tasks/              # Create task
GET    /api/tasks/{id}/         # Get task
PATCH  /api/tasks/{id}/         # Update task
DELETE /api/tasks/{id}/         # Delete task
POST   /api/tasks/{id}/complete/# Complete task
```

### Habits
```
GET    /api/habits/             # List habits
POST   /api/habits/             # Create habit
POST   /api/habit-logs/         # Log completion
```

### Commitments
```
GET    /api/commitments/        # List commitments
POST   /api/commitments/        # Create commitment
POST   /api/commitments/{id}/activate/   # Activate
POST   /api/commitments/{id}/complete/   # Complete
```

### Attachments
```
POST   /api/task-attachments/           # Upload to task
POST   /api/commitment-attachments/     # Upload to commitment
```

---

## 🎨 Design System

The app uses a **Neobrutalist** design language:

- **Borders:** `border-3 border-ink-black`
- **Shadows:** `shadow-neo` (4px offset), `shadow-neo-lg` (8px)
- **Colors:**
  - Focus Yellow: `#FFD700`
  - Accent Pink: `#FF6B6B`
  - Paper White: `#FAFAFA`
  - Ink Black: `#1A1A1A`

---

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# Run migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

---

## 📝 Documentation

- [Frontend Documentation](frontend/FRONTEND_DOCUMENTATION.md) - Complete frontend feature list, components, and improvement areas

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- TickTick for inspiration
- Django & Next.js communities
- Neobrutalist design movement
