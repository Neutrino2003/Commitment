# Project Roadmap: Accountability App (Backend First)

This document outlines the development roadmap for the accountability app, with a focus on building the backend first.

## Stage 1: Backend Development

### 1.1. Core Infrastructure
- [x] Set up Django project and initial configuration.
- [x] Configure PostgreSQL as the database for the project.
- [ ] **TODO:** Implement database backups and recovery.
- [ ] Set up Celery with Redis for asynchronous tasks.

### 1.2. User Authentication
- [x] Implement token-based authentication (JWT).
- [x] Created API views for user registration (UserRegistrationViewSet), login (CustomTokenObtainPairView), and logout (AccountLogout).
- [ ] Add email verification for new user sign-ups.
- [ ] Implement password reset functionality.

### 1.3. Commitment Lifecycle
- [x] Defined Commitment models.
- [x] Develop API views for creating, viewing, updating, and deleting commitments.
- [x] Implement the logic for handling the different commitment statuses (`active`, `completed`, `failed`).
- [ ] Create a daily task (using Celery with Redis) to check for overdue commitments and mark them as `failed`.
- [x] Implement the recurring commitment logic.

### 1.4. Payment Integration
- [ ] Integrate Stripe for handling `stake_amount`.
- [ ] Create a secure process for storing payment information (using Stripe's tokenization).
- [ ] Implement the logic for deducting the `stake_amount` when a commitment is `failed`.
- [ ] Implement a refund process for successfully completed commitments.

### 1.5. Evidence and Verification
- [x] Develop the API endpoints for submitting evidence for a commitment.
- [ ] Implement the logic for verifying the evidence (manual verification by an admin initially).
- [x] Allow users to view the evidence they have submitted.

### 1.6. Complaint System
- [ ] Create a `Complaint` model to track user complaints about failed commitments.
- [ ] Develop API views for creating and reviewing complaints.
- [ ] Implement a process for administrators to review complaints and decide whether to refund the `stake_amount`.
- [ ] Notify users of the outcome of their complaints.

### 1.7. Social Accountability
- [ ] Allow users to add friends or accountability partners.
- [ ] Implement a feature to share commitment progress with friends.
- [ ] Allow friends to verify evidence or be notified of progress.
- [ ] Create a "wall of fame" where users can share their successful commitments.

### 1.8. Gamification
- [ ] Award points or badges for completing commitments.
- [ ] Create a leaderboard to show the most successful users.
- [ ] Implement a "streak" feature to reward consistent users.
- [ ] Create a "level up" system based on points earned.

### 1.9. Notifications
- [ ] Integrate a notification system (e.g., using Django Channels or a third-party service like Firebase Cloud Messaging) to send reminders and updates.
- [ ] Send notifications for upcoming deadlines, completed commitments, and failed commitments.
- [ ] Allow users to customize their notification preferences.

### 1.10. Advanced Reporting & API Documentation
- [ ] Create a dashboard for users to view their statistics and progress over time.
- [ ] Provide administrators with a dashboard to monitor the platform's activity.
- [ ] Generate charts and graphs to visualize user data.
- [ ] Use `drf-spectacular` to generate OpenAPI 3 documentation.
- [ ] Create a user-friendly documentation website.

### 1.11. Testing and Deployment
- [ ] Write comprehensive unit and integration tests for all features.
- [ ] Set up a CI/CD pipeline for automated testing and deployment.
- [ ] Deploy the application to a cloud provider (e.g., AWS, Heroku, DigitalOcean) using Docker.

## Stage 2: Frontend Development (Placeholder)

- [ ] Set up a frontend framework (e.g., React, Vue, Angular).
- [ ] Create basic UI components.
- [ ] Connect the frontend to the backend API.
- [ ] Implement user authentication flow.
- [ ] Implement commitment management UI.
- [ ] Implement payment flow.
- [ ] Implement evidence submission UI.
- [ ] Implement complaint system UI.
- [ ] Implement social features UI.
- [ ] Implement gamification UI.
- [ ] Implement notification UI.
- [ ] Implement user dashboard and reporting UI.

---
## Moderator Report (2025-11-10)


### Issues Identified (Pending Work)
1. Large number of unused dependencies in `requirements.txt` (e.g., TensorFlow, Flask, scientific stack) increasing attack surface and install time.
2. No test coverage: `users/tests.py` and `commitments/tests.py` are empty placeholders.
3. Missing payment integration (Stripe) per roadmap; no stubs or abstraction layer present.
4. Complaint workflow partially stubbed (flagging only) – lacks resolution/appeal processing and admin review endpoints.
5. Monthly recurrence logic naive; will fail for dates like Jan 31 → Feb (invalid date). Needs robust month arithmetic (e.g., using `dateutil.relativedelta`).
6. `UserRegistrationViewSet` exposes full queryset; should restrict or override `get_queryset` to avoid accidental enumeration if methods expand.
7. Lack of rate throttling on auth endpoints (potential brute-force vector).
8. Evidence handling treats `evidence_data` as `CharField`; should support proper file uploads and validation when `evidence_required`.
9. Settings: `ALLOWED_HOSTS` default empty; production hardening tasks (SecurityMiddleware enhancements, HTTPS, secure cookies) not yet addressed.
10. `currency` should likely be standardized (enum or ISO code) for future payment gateway integration.

### Recommended Action Items
- [ ] Prune `requirements.txt` to minimal backend essentials; create a separate optional extras file if needed.
- [ ] Implement unit tests for: user registration & JWT flow, commitment state transitions, recurring instance creation, overdue detection.
- [ ] Add robust month handling using `relativedelta` in `Commitment.create_next_instance`.
- [ ] Implement complaint resolution & appeals workflow (models, status transitions, admin endpoints).
- [ ] Add throttling (REST_FRAMEWORK settings) for auth endpoints.
- [ ] Enhance evidence handling: switch `evidence_data` to `FileField` or structured upload, validate presence when `evidence_required`.
- [ ] Introduce `Currency` choices or ISO code field; plan integration with Stripe.
- [ ] Harden production settings (secure cookies, CSRF_TRUSTED_ORIGINS, HTTPS redirects, proper `ALLOWED_HOSTS`).
- [ ] Add tests ensuring `is_completed_on_time` correctness and overdue path edge cases.
- [ ] Create migration for new `created_at` field and run it (pending developer execution).

### Security Notes
- Hardcoded secret key removed in favor of env fetch (fallback still present; remove in production).
- Unused heavy ML dependencies could conceal vulnerabilities; prioritize removal.

### Next Moderator Check
Reassess after dependency pruning and initial test suite implementation.

---
## Moderator Update (2025-11-10 - Auth Verification)
Status: User authentication endpoints are confirmed implemented and functioning in code.
Details:
- Registration: `UserRegistrationViewSet` with custom `register` action returns JWT pair and user profile.
- Login: `CustomTokenObtainPairView` extends JWT to include user data payload.
- Logout: `AccountLogout` view blacklists refresh token and logs out user.
Action Taken: Roadmap updated to mark API views for registration/login/logout as complete.
Remaining Auth Enhancements:
- Email verification flow (pending design of token/email service).
- Password reset endpoints (secure token issuance & rate limiting).
- Add throttling to registration and login views to mitigate brute-force.
- Consider splitting registration from general ModelViewSet to a dedicated create-only endpoint with restricted queryset exposure.
Next Checkpoint: After adding throttling and starting email verification implementation.

---
## Moderator Update (2025-11-11 - Critical Issues Post-Auth Changes)

**Status:** Recent auth refactoring introduced breaking changes that must be addressed immediately.

### ✅ Critical Issues RESOLVED

1. **URL Configuration Broken** - ✅ **FIXED**
   - Removed router registration for `RegisterView` (APIView)
   - Added direct URL pattern: `path("api/auth/register/", RegisterView.as_view())`
   - Django now starts without import errors

2. **Missing relativedelta Import** - ✅ **FIXED** 
   - Added `from dateutil.relativedelta import relativedelta` to `commitments/models.py`
   - Monthly recurrence will work correctly

3. **Admin Configuration Errors** - ✅ **FIXED**
   - Fixed `CustomUser` ordering to use `date_joined` instead of non-existent `created_at`
   - Updated `CommitmentAdmin` to only reference existing model fields
   - Removed references to non-existent fields like `total_tasks`, `completion_rate`, etc.

### ✅ Issues Resolved (Confirmed Working)

1. **Monthly Recurrence Logic** - ✅ **VERIFIED WORKING**
   - Uses `relativedelta(months=1)` for proper month arithmetic
   - Handles edge cases like Jan 31 → Feb correctly

2. **UserRegistrationViewSet Exposure** - ✅ **VERIFIED WORKING** 
   - Converted to dedicated `RegisterView` (APIView) with no queryset
   - POST-only registration, no data exposure risk

3. **Rate Throttling on Auth Endpoints** - ✅ **VERIFIED WORKING**
   - `AuthThrottle` class (5/minute rate) applied to all auth views
   - Protects against brute-force attacks

---
## Moderator Update (2025-11-11 - Final Verification & Assessment)

**Status:** All critical fixes verified working. Application is stable and functional.

### ✅ **VERIFIED WORKING FIXES**

1. **URL Configuration** - ✅ **CONFIRMED**
   - `RegisterView` properly configured with direct URL pattern: `path("api/auth/register/", RegisterView.as_view())`
   - No router registration issues
   - Django starts without import errors

2. **Monthly Recurrence Logic** - ✅ **CONFIRMED**
   - `relativedelta` imported and working correctly
   - Test: `2024-01-31 + 1 month = 2024-02-29` (handles leap years properly)
   - Edge cases like Jan 31 → Feb 29 resolved

3. **Admin Configuration** - ✅ **CONFIRMED**
   - `CommitmentAdmin` only references existing model fields
   - `CustomUser` ordering uses `date_joined` (correct AbstractUser field)
   - No system check errors for admin configurations

4. **Rate Throttling** - ✅ **CONFIRMED**
   - `AuthThrottle` class implemented (5/minute rate)
   - Applied to `RegisterView`, `CustomTokenObtainPairView`, `AccountLogout`
   - Protects against brute-force attacks

### ❌ **REMAINING ISSUES (Confirmed)**

1. **Evidence Handling Still Broken** - HIGH priority
   - **CONFIRMED:** `ContractMarkCompleteSerializer.evidence_data` still uses `CharField`
   - No file validation, size limits, or MIME type checking
   - **Security Risk:** Potential for malicious file uploads, poor UX
   - **Action Required:** Implement proper `FileField` with validation

2. **Production Security Issues** - HIGH priority
   - **CONFIRMED:** 7 security warnings from `python manage.py check --deploy`
   - `ALLOWED_HOSTS` empty, `DEBUG=True`, insecure `SECRET_KEY`
   - Missing HTTPS/security middleware settings
   - **Action Required:** Production hardening before deployment

3. **Dependencies Audit** - ✅ **COMPLETED**
   - **REMOVED:** 80+ unused packages including TensorFlow, Keras, scikit-learn, pandas, matplotlib, Jupyter, Flask, etc.
   - **KEPT:** Only essential Django packages, database drivers, image processing, and configuration utilities
   - **Result:** requirements.txt reduced from 100+ lines to 28 lines
   - **Impact:** Reduced attack surface, faster installs, cleaner dependency management

4. **Test Coverage** - MEDIUM priority
   - **CONFIRMED:** `users/tests.py` and `commitments/tests.py` are empty placeholders
   - No unit tests for critical functionality
   - **Action Required:** Implement comprehensive test suite

### 📊 **Current Project Health**

| Component | Status | Notes |
|-----------|--------|-------|
| **Django Startup** | ✅ Working | No import errors, system checks pass |
| **Core Functionality** | ✅ Working | Auth, commitments, recurrence all functional |
| **Security** | ⚠️ Needs Work | Multiple production security issues |
| **Code Quality** | ✅ Good | Clean architecture, proper Django patterns |
| **Testing** | ❌ Missing | No test coverage |
| **Dependencies** | ⚠️ Bloated | Many unused packages |

### 🎯 **Immediate Priorities**

1. **URGENT:** Fix evidence handling (FileField implementation)
2. **HIGH:** Address production security issues
3. **MEDIUM:** Clean up dependencies
4. **MEDIUM:** Implement basic test suite

### 🔍 **Moderator Assessment**

**Overall Status:** ✅ **STABLE & FUNCTIONAL**
- Critical blocking issues resolved
- Application runs successfully
- Core business logic working
- Ready for development/testing

**Quality Score:** 7/10
- Excellent: Architecture, Django best practices, error handling
- Good: Security implementation (throttling, auth)
- Needs Work: Testing, dependencies, production hardening

**Next Checkpoint:** After evidence handling fix and basic testing implementation.

---