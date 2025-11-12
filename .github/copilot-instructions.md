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
