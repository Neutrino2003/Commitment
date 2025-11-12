# 🚀 Running the Commitment App

## Quick Start Guide

### Backend (Django + PostgreSQL)

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Make sure PostgreSQL is running** and create database:
```sql
CREATE DATABASE habitapp_db;
```

3. **Create `.env` file** in the backend directory:
```env
DB_ENGINE=django.db.backends.postgresql
DB_NAME=habitapp_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

4. **Run migrations:**
```bash
python manage.py migrate
```

5. **Create superuser (optional):**
```bash
python manage.py createsuperuser
```

6. **Start Django server:**
```bash
python manage.py runserver
```

Backend should now be running at: **http://localhost:8000**

---

### Frontend (Next.js + Tailwind CSS)

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install dependencies (if not done):**
```bash
pnpm install
```

3. **Verify `.env.local` file exists** with:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

4. **Start Next.js dev server:**
```bash
pnpm dev
```

Frontend should now be running at: **http://localhost:3000**

---

## 🎯 Test the App

### 1. **Open Browser**
Navigate to: http://localhost:3000

### 2. **Register a New Account**
- Click "Sign Up"
- Fill in username, email, password
- Submit registration

### 3. **Create Your First Commitment**
- After login, you'll be on the dashboard
- Click "New Commitment"
- Fill in:
  - Title: "Morning Workout"
  - Description: "Exercise for 30 minutes every morning"
  - Start/End time
  - Stake amount: 100
  - Choose frequency (one_time, daily, weekly, monthly)
- Click "Create & Activate Commitment"

### 4. **Manage Your Commitment**
- View commitment details
- Mark as completed (submit evidence)
- Mark as failed
- Pause/Resume
- Track statistics

---

## 📊 Features You Can Test

### ✅ User Authentication
- [x] Register new account
- [x] Login with JWT tokens
- [x] Automatic token refresh
- [x] Logout

### ✅ Commitment Management
- [x] Create commitments with financial stakes
- [x] Set deadlines and frequencies
- [x] Activate/Pause/Resume/Cancel
- [x] Mark as completed with evidence
- [x] Mark as failed with reason
- [x] View all commitments
- [x] Filter by status (active, completed, failed, overdue)

### ✅ Statistics & Tracking
- [x] Total contracts count
- [x] Active contracts
- [x] Completed contracts
- [x] Total stake amount
- [x] Overdue detection

### ✅ Recurring Contracts
- [x] Daily commitments
- [x] Weekly commitments
- [x] Monthly commitments
- [x] Custom day selection
- [x] Auto-create next instance

---

## 🌐 API Endpoints

### Authentication
- POST `/api/auth/register/` - Register
- POST `/api/token/` - Login (JWT)
- POST `/api/logout/` - Logout
- POST `/api/token/refresh/` - Refresh token

### Profile
- GET `/api/profile/` - Get profile
- PATCH `/api/profile/update_profile/` - Update profile
- POST `/api/profile/change_password/` - Change password

### Contracts
- GET `/api/contracts/` - List all
- POST `/api/contracts/` - Create new
- GET `/api/contracts/{id}/` - Get details
- POST `/api/contracts/{id}/activate/` - Activate
- POST `/api/contracts/{id}/mark_completed/` - Complete
- POST `/api/contracts/{id}/mark_failed/` - Mark failed
- GET `/api/contracts/active/` - Get active
- GET `/api/contracts/statistics/` - Get stats

---

## 🛠️ Troubleshooting

### Backend Issues

**Port 8000 in use:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Database connection error:**
- Make sure PostgreSQL is running
- Check `.env` credentials
- Verify database exists

**Migrations error:**
```bash
python manage.py makemigrations
python manage.py migrate
```

### Frontend Issues

**Port 3000 in use:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Lock file error:**
```bash
rm -rf .next
pnpm dev
```

**Module not found:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**CORS error:**
- Make sure Django backend has `corsheaders` in INSTALLED_APPS
- Check CORS_ALLOWED_ORIGINS includes http://localhost:3000

---

## 📝 Default Credentials

After running migrations, you can create a superuser:

```bash
python manage.py createsuperuser
```

Then access Django admin at: http://localhost:8000/admin/

---

## 🎨 Tech Stack

### Backend
- Django 5.2.7
- Django REST Framework
- PostgreSQL
- JWT Authentication
- django-cors-headers

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Axios
- React Hot Toast
- date-fns

---

## 📦 What's Included

### Pages
1. **Landing Page** (/) - Marketing page with features
2. **Register** (/register) - User registration
3. **Login** (/login) - User authentication
4. **Dashboard** (/dashboard) - Contract overview with stats
5. **Create Contract** (/contracts/create) - New commitment form
6. **Contract Detail** (/contracts/[id]) - Detailed view with actions

### API Integration
- Complete REST API client with axios
- JWT token management with auto-refresh
- Error handling with toast notifications
- TypeScript types for all data models

### UI Components
- Responsive design (mobile-friendly)
- Toast notifications for feedback
- Status badges with color coding
- Modal dialogs for actions
- Loading states
- Form validation

---

## 🚀 Next Steps

1. **Test the complete flow:**
   - Register → Create commitment → Activate → Complete/Fail

2. **Try recurring contracts:**
   - Create daily/weekly/monthly commitments
   - See how next instances are auto-created

3. **Explore statistics:**
   - Track your success rate
   - Monitor stake amounts
   - View completion trends

4. **Test edge cases:**
   - Overdue contracts
   - Evidence submission
   - Contract cancellation

---

## 🎉 You're All Set!

Both backend and frontend are now running. You can:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

Enjoy using the Commitment App! 💪
