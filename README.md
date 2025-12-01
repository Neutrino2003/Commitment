# Commitment — Accountability App

A Django + Next.js application that lets users create time-bound commitments with financial stakes, submit evidence, and track statistics.

## Tech stack
- Backend: Django 5.2.7 + Django REST Framework  
  Key files:
  - Project settings: [backend/backend/settings.py](backend/backend/settings.py)  
  - CLI entry: [backend/manage.py](backend/manage.py)  
  - URLs / router: [backend/backend/urls.py](backend/backend/urls.py)  
- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind CSS  
  Key files:
  - Frontend API client: [frontend/lib/api.ts](frontend/lib/api.ts) (`contractsAPI`)  
  - Next app entry: [frontend/app/layout.tsx](frontend/app/layout.tsx)  
  - Dashboard: [frontend/app/dashboard/page.tsx](frontend/app/dashboard/page.tsx)  
  - Contract pages: [frontend/app/contracts/create/page.tsx](frontend/app/contracts/create/page.tsx), [frontend/app/contracts/[id]/page.tsx](frontend/app/contracts/[id]/page.tsx)  
- Authentication: JWT (rest_framework_simplejwt)

## Quick start (development)
1. Backend
   - cd into backend:
     ```bash
     cd backend
     ```
   - Install dependencies and run migrations:
     ```bash
     pip install -r requirements.txt
     python manage.py migrate
     ```
   - Run server:
     ```bash
     python manage.py runserver
     ```
   - See: API root at `http://localhost:8000/api` (router in backend/backend/urls.py)

2. Frontend
   - cd into frontend:
     ```bash
     cd frontend
     ```
   - Install & run:
     ```bash
     pnpm install
     pnpm dev
     ```
   - Visit: `http://localhost:3000`

(See detailed instructions in  and frontend docs at frontend/README.md.)

## Important backend endpoints & implementation points
- Registration / Auth
  - Registration: `POST /api/auth/register/` implemented by  — route defined in .
  - Login: `POST /api/token/` implemented by .
  - Logout: `POST /api/logout/` implemented by .

- Contracts API (commitments)
  - CRUD + actions under `/api/contracts/` — viewset implemented by .
  - Serializers include action serializers such as  and .
  - Model:  (migration snapshot: backend/commitments/migrations/0001_initial.py).
  - Key recurring logic:  uses `dateutil.relativedelta` for monthly arithmetic (see models).

- Frontend API client
  -  exposes  (activate, pause, resume, cancel, markCompleted, markFailed, flagComplaint, filters, statistics). The client is used across pages like  and [frontend/app/contracts/[id]/page.tsx](frontend/app/contracts/[id]/page.tsx).

## Project structure (high-level)
- backend/ — Django project & apps
  - backend/backend/ — Django project settings & urls
  - backend/users/ — custom user model, serializers, views, statistics
  - backend/commitments/ — core Commitment model, serializers, viewset, migrations
- frontend/ — Next.js app (App Router)
  -  — axios wrapper & API client
  - frontend/app/... — pages (dashboard, contract create/detail, auth)
  -  — TypeScript types
- Docs: , , 

## Known issues / immediate priorities
- Evidence uploads currently text-only; serializer  must accept `FileField` and validate uploads. (See roadmap notes in roadmap.md.)
- Production hardening required: update  (SECRET_KEY, DEBUG, ALLOWED_HOSTS), address `python  check --deploy` warnings.
- Tests are missing:  and  are placeholders. Add unit tests for registration/JWT flows and commitment state transitions.

## How to contribute
1. Create a branch for your change.
2. Run linters and tests locally.
3. Open a PR describing the change and include related issue/roadmap reference.

## Useful links (quick)
- Router & API entrypoints:   
- Commitments viewset:  —   
- Commitments serializers:  (, )  
- Frontend API client:  ()  
- Dashboard page:   
- Contract detail: [frontend/app/contracts/[id]/page.tsx](frontend/app/contracts/[id]/page.tsx)  
- Create contract page:   
- Project roadmap:   
- Run & troubleshooting: 

---

This README is a compact entrypoint — for development steps, API details, and design notes consult the files linked above (settings, urls, viewsets, and frontend pages).
