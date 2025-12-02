# Copilot Instructions for Commitment App

## Project Overview
**Commitment** is a Django REST Framework application for managing personal commitment contracts with financial stakes. Users create time-bound commitments (habits, goals) with deadlines, provide evidence of completion, and face consequences (stake loss) for failure. The app supports recurring contracts, complaint workflows, and user statistics tracking.

## Architecture

### Tech Stack
- **Backend**: Django 5.2.7, DRF (Django REST Framework)
- **Auth**: JWT (rest_framework_simplejwt) with custom token serializer
- **Database**: PostgreSQL (configurable via `.env`)
- **Key Dependencies**: django-filters, python-dotenv, Pillow (image uploads)

### Core Components

#### 1. Users App (`/backend/users/`)
- **CustomUser Model**: Extends AbstractUser with fields: `phone_number`, `bio`, `profile_image`, `leniency` (lenient/normal/hard)
- **UserStatistics Model**: Tracks stats per user with date tracking (contracts completed/failed, total stakes, complaints)
- **Key ViewSets**:
  - `RegisterView`: POST-only registration with automatic UserStatistics creation
  - `UserProfileViewSet`: User profile CRUD with custom actions (update_profile, change_password)
  - `UserStatisticsViewSet`: Read-only stats retrieval
  - `AccountLogout`: JWT token blacklisting (requires refresh_token in POST body)
- **Auth Pattern**: JWT tokens returned on registration/login with user data included in token response

#### 2. Commitments App (`/backend/commitments/`)
- **Commitment Model**: Core contract entity with rich state machine (draft → active → completed/failed/cancelled/appealed/under_review/paused)
- **Key Fields**:
  - Timestamps: `start_time`, `end_time`, `activated_at`, `completed_at` (with `created_at`, `updated_at`)
  - Evidence: `evidence_required`, `evidence_type` (photo/timelapse_video/self_verification/manual), `evidence_file`, `evidence_text`
  - Stakes: `stake_amount`, `currency` (default: 'Ruppees')
  - Frequency: `frequency` (daily/weekly/monthly/one_time/custom), `custom_days` (comma-separated MON,TUE format)
  - Complaint System: `complaints_flagged`, `complaint` (text field)
- **State Management**: Action methods throw `ValueError` if state transition invalid (e.g., can't mark completed contract as failed)
- **Recurring Logic**: `create_next_instance()` generates next contract after completion/failure using `relativedelta` for proper month arithmetic
- **ViewSet Pattern**: Dynamic serializer selection per action (list/retrieve/create/mark_completed/mark_failed/etc.)
- **Key Actions**:
  - POST `/mark_completed/`: Evidence submission, creates next instance if recurring
  - POST `/mark_failed/`: Failure reason, creates next instance if recurring
  - POST `/activate/`, `/pause/`, `/resume/`, `/cancel/`: State transitions
  - POST `/flag_complaint/`: User complaint submission
  - GET `/active/`, `/overdue/`, `/completed/`, `/failed/`: Filtered views
  - GET `/statistics/`: Aggregated user stats (total stake, on-time completions, etc.)

### Database Design
- **Indexes**:
  - `Commitment`: (user, status) for fast filtering by user and state
  - `Commitment`: (start_time, end_time) for deadline queries
- **Relationships**:
  - ForeignKey: Commitment → CustomUser (CASCADE, related_name='commitments')
  - ForeignKey: UserStatistics → CustomUser (CASCADE, related_name='statistics')

## Development Patterns

### Authentication & Authorization
1. **Custom User Model**: `AUTH_USER_MODEL = 'users.CustomUser'` configured in settings
2. **JWT Flow**:
   - Registration returns `{access, refresh, user, profile_complete}`
   - Token refresh uses `TokenRefreshView` at `/api/auth/token/refresh/`
   - Logout requires `refresh_token` in POST body and performs blacklisting
3. **Permissions**: All viewsets require `IsAuthenticated` except registration/login
4. **Queryset Filtering**: Every viewset implements `get_queryset()` filtering by `request.user`
5. **Rate Limiting**: Auth endpoints throttled at 5/minute using `AuthThrottle` class

### Serializer Patterns
- **Multiple Serializers Per ViewSet**: Use `get_serializer_class()` with action-specific serializers
  - List = simplified fields, retrieve = full details, create/update = editable fields only
- **Read-Only Properties**: Properties from model (e.g., `time_remaining`, `is_overdue`) exposed via `serializers.ReadOnlyField()`
- **Validation**:
  - Field-level: `validate_fieldname()` methods
  - Object-level: `validate()` method for cross-field checks
- **User Field Handling**: Always set user on create via `perform_create(serializer)` to enforce user isolation

### API Response Patterns
- **Success**: Return serialized object with 200/201 status
- **Recurring Contracts**: Return both current and next instance on completion/failure
- **Errors**: Return `{detail: str}` or `{error: str}` with appropriate HTTP status (400/404/409)

### Model Property Patterns
- **Computed Fields**: Use `@property` decorators for non-persistent calculations (e.g., `is_overdue`, `time_remaining`)
- **State Validation**: Action methods validate state before persistence, raise `ValueError` on invalid transitions
- **Manager Methods**: `create_next_instance()` handles frequency-based instance creation using `relativedelta`

### File Upload Patterns
- **Evidence Files**: Use `FileField` with `upload_to='contract_evidence/%Y/%m/%d/'` for organized storage
- **Profile Images**: Use `ImageField` with `upload_to='profile_images/'`
- **Media Serving**: Static files served via `MEDIA_URL`/`MEDIA_ROOT` in development only

### Recurring Contract Logic
- **Frequency Handling**: `daily`/`weekly` use timedelta, `monthly` uses `relativedelta` for proper date arithmetic
- **Custom Days**: Comma-separated format "MON,TUE,WED" for flexible scheduling
- **Instance Creation**: Automatic next instance creation on completion/failure for non-one_time contracts

## Critical Implementation Details

### Current Issues (Active Work)
1. **Evidence Handling**: `ContractMarkCompleteSerializer.evidence_data` still uses `CharField` instead of `FileField` - needs proper file upload validation
2. **Production Security**: 7 security warnings from `python manage.py check --deploy` (DEBUG=True, empty ALLOWED_HOSTS, insecure SECRET_KEY)
3. **Test Coverage**: `users/tests.py` and `commitments/tests.py` are empty placeholders

### Fixed Issues (Completed)
1. **Dependencies Cleanup**: Removed 80+ unused packages (TensorFlow, Flask, scientific stack) - reduced from 100+ to 28 essential packages
2. **Monthly Recurrence**: Fixed to use `relativedelta` for proper month arithmetic (handles Jan 31 → Feb 29 correctly)
3. **URL Configuration**: Fixed router registration issues for auth endpoints
4. **Rate Throttling**: Added 5/minute throttling to all auth endpoints
5. **Admin Configuration**: Fixed CustomUser and CommitmentAdmin to reference only existing fields

### Common Pitfalls to Avoid
1. **User Isolation**: Always filter by `request.user` in querysets to prevent cross-user data leaks
2. **State Machine Validation**: Call action methods, not direct `save()`, to enforce state transition rules
3. **Recurring Logic**: Check `frequency != 'one_time'` before attempting to create next instance
4. **Evidence Files**: Currently broken - `evidence_data` should be `FileField` with validation, not `CharField`
5. **Timezone Handling**: Use `timezone.now()` for timestamp comparisons, not `datetime.now()`
6. **File Uploads**: Never store uploaded files as text - use proper `FileField`/`ImageField` with validation

## Running the Project

```bash
# Setup
cd backend
python manage.py migrate
python manage.py runserver

# Create superuser
python manage.py createsuperuser

# Access admin at /admin/
```

### Environment Variables (`.env`)
```
DB_ENGINE=django.db.backends.postgresql
DB_NAME=habitapp_db
DB_USER=postgres
DB_PASSWORD=<your_password>
DB_HOST=localhost
DB_PORT=5432
```

### Development Commands
```bash
# Run system checks
python manage.py check

# Run with deployment checks
python manage.py check --deploy

# Create new app
python manage.py startapp <app_name>

# Make migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

## API Endpoints Structure
```
/api/auth/
  POST   register/           # User registration (RegisterView)
  POST   token/              # Obtain JWT (CustomTokenObtainPairView)
  POST   logout/             # Logout with token blacklisting
  POST   token/refresh/      # Refresh token (built-in)

/api/profile/                # UserProfileViewSet (ModelViewSet)
  GET    (list - current user)
  GET    {id}/ (retrieve - public)
  PATCH  update_profile/ (update current user)
  POST   change_password/

/api/statistics/             # UserStatisticsViewSet (ViewSet)
  GET    (list - current user stats)
  GET    {id}/ (retrieve - public user stats)

/api/contracts/              # CommitmentViewSet (ModelViewSet)
  GET, POST
  GET    {id}/
  PATCH  {id}/
  POST   {id}/mark_completed/
  POST   {id}/mark_failed/
  POST   {id}/activate/, /pause/, /resume/, /cancel/
  POST   {id}/flag_complaint/
  GET    active/, overdue/, completed/, failed/
  GET    statistics/ (aggregated user stats)
```

## Testing Strategy
- **Test Files**: `users/tests.py`, `commitments/tests.py` (currently empty placeholders)
- **Recommended Focus**: State transitions, recurring contract creation, user isolation, JWT flows
- **No Current Test Coverage**: Write tests for new features using Django TestCase
- **Test Runner**: `python manage.py test`

## Next Steps for Enhancement
1. **URGENT**: Fix evidence handling to use `FileField` with proper validation
2. **HIGH**: Address production security issues (7 deployment warnings)
3. **MEDIUM**: Implement comprehensive unit tests
4. **MEDIUM**: Add payment integration (Stripe) per roadmap
5. **MEDIUM**: Implement complaint resolution workflow and appeals system
6. **LOW**: Add pagination globally (currently set to `None`)
7. **LOW**: Build frontend (currently placeholder at `/frontend/filler.txt`)

## AI Agent Productivity Guide

### Essential Patterns for Immediate Productivity

#### 1. **State Machine Pattern** (`commitments/models.py`)
```python
# Always use action methods, never direct save() for state changes
commitment.activate()  # ✅ Correct - validates transitions
commitment.status = 'active'; commitment.save()  # ❌ Wrong - bypasses validation

# Action methods raise ValueError for invalid transitions
try:
    commitment.mark_completed()
except ValueError as e:
    # Handle invalid state transition
```

#### 2. **Dynamic Serializer Selection** (`commitments/views.py`)
```python
def get_serializer_class(self):
    """Return different serializers based on action"""
    if self.action == 'list':
        return CommitmentListSerializer  # Simplified fields
    elif self.action == 'retrieve':
        return CommitmentDetailSerializer  # Full details
    elif self.action in ['create', 'update']:
        return CommitmentCreateUpdateSerializer  # Editable fields only
```

#### 3. **User Isolation Pattern** (All ViewSets)
```python
def get_queryset(self):
    """Always filter by request.user to prevent cross-user data leaks"""
    return Commitment.objects.filter(user=self.request.user)

def perform_create(self, serializer):
    """Always set user field on creation"""
    serializer.save(user=self.request.user)
```

#### 4. **Background Task Integration** (`commitments/tasks.py`)
```python
# Tasks automatically handle notifications and recurring logic
@shared_task
def auto_activate_commitments():
    """Runs every 15 minutes to activate commitments when start_time arrives"""
    # Implementation handles draft → active transitions automatically
```

#### 5. **Computed Properties Pattern** (`commitments/models.py`)
```python
@property
def time_remaining(self):
    """Calculate remaining time until deadline"""
    if self.status not in ['active', 'under_review']:
        return None
    time_diff = self.end_time - timezone.now()
    return max(time_diff, timedelta(0))

@property
def is_overdue(self):
    """Check if commitment is past deadline"""
    return timezone.now() > self.end_time and self.status in ['active', 'under_review']
```

#### 6. **Relativedelta for Date Arithmetic** (`commitments/models.py`)
```python
# ✅ Correct - handles month boundaries properly
from dateutil.relativedelta import relativedelta
next_date = current_date + relativedelta(months=1)  # Jan 31 → Feb 28/29

# ❌ Wrong - naive addition causes issues
next_date = current_date + timedelta(days=30)  # Jan 31 → Feb 30 (invalid)
```

### Critical Developer Workflows

#### **Testing State Transitions**
```bash
# After model changes, test all commitment states manually
python manage.py shell
>>> from commitments.models import Commitment
>>> c = Commitment.objects.create(user=user, title="Test", ...)
>>> c.activate()  # Should work
>>> c.mark_completed()  # Should work
>>> c.mark_failed()  # Should raise ValueError (already completed)
```

#### **Testing Background Tasks**
```bash
# Start Celery worker for task testing
celery -A backend worker --loglevel=info

# In another terminal, test task execution
python manage.py shell
>>> from commitments.tasks import auto_activate_commitments
>>> auto_activate_commitments.delay()  # Check Celery logs
```

#### **File Upload Testing**
```bash
# Test evidence uploads with different file types
curl -X POST -F "evidence_file=@photo.jpg" \
  -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/contracts/1/mark_completed/
```

#### **Migration + Task Testing**
```bash
# Always run migrations and restart Celery after model changes
python manage.py makemigrations
python manage.py migrate
# Restart Celery worker
# Test all affected endpoints
```

### Cross-Component Communication Patterns

#### **Task-Triggered Notifications**
```python
# Tasks automatically send emails for user-facing events
from .tasks import send_commitment_notification
send_commitment_notification.delay(commitment.id, 'completed')
```

#### **Auto-Recurring Contract Creation**
```python
# Completion automatically creates next instance for recurring contracts
if contract.frequency != 'one_time':
    next_instance = contract.create_next_instance()
    # Returns new Commitment instance with status='active'
```

#### **JWT Token Lifecycle**
```python
# Registration/Login: Returns access + refresh tokens
# Refresh: Generates new access token, blacklists old refresh token
# Logout: Blacklists current refresh token
# Auto-activation: Background tasks check and activate draft commitments
```

### Key Files for Understanding Architecture

- **`backend/commitments/models.py`**: State machine, business logic, computed properties
- **`backend/commitments/views.py`**: API patterns, serializer selection, action endpoints
- **`backend/commitments/tasks.py`**: Background automation, notifications, recurring logic
- **`backend/backend/celery.py`**: Task scheduling configuration
- **`backend/users/views.py`**: Auth patterns, custom JWT serializer
- **`frontend/lib/api.ts`**: Frontend API integration patterns

### Common Gotchas

1. **Never call `commitment.save()` directly** - use action methods (`activate()`, `mark_completed()`, etc.)
2. **Always filter querysets by `request.user`** - security critical
3. **Use `relativedelta` for months** - `timedelta` breaks on month boundaries
4. **Test with Celery running** - many features depend on background tasks
5. **Check email console output** - notifications are sent asynchronously
6. **File uploads need proper validation** - current evidence handling is broken
7. **State transitions are validated** - expect `ValueError` for invalid changes

This guide focuses on the project's specific patterns that differ from generic Django/DRF practices. Master these patterns for immediate productivity.
