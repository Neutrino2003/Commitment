# Commitment App - Frontend Documentation

> **Last Updated:** December 30, 2024  
> **Tech Stack:** Next.js 14, TypeScript, TailwindCSS, React Query, Framer Motion

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Features - COMPLETED ✅](#features---completed-)
3. [Features - TODO 📋](#features---todo-)
4. [Features - NEEDS IMPROVEMENT 🔧](#features---needs-improvement-)
5. [Component Reference](#component-reference)
6. [File Structure](#file-structure)

---

## Project Overview

Commitment is an anti-procrastination productivity app that combines:
- **Task Management** (TickTick-style with lists, tags, kanban)
- **Habit Tracking** (Streaks, heatmaps, analytics)
- **Accountability Contracts** (Financial stakes, evidence submission)

### Design System
- **Style:** Neobrutalist UI (bold borders, shadows, high contrast)
- **Colors:** Focus Yellow (#FFD700), Paper White, Ink Black
- **Borders:** `border-3 border-ink-black`
- **Shadows:** `shadow-neo` (4px offset), `shadow-neo-lg` (8px)

---

## Features - COMPLETED ✅

### 1. Authentication
| Feature | Status | Files |
|---------|--------|-------|
| Login/Register forms | ✅ | `app/login/page.tsx`, `app/register/page.tsx` |
| Google OAuth Sign-in | ✅ | `components/auth/GoogleSignInButton.tsx` |
| OAuth Callback handling | ✅ | `app/auth/callback/page.tsx` |
| JWT token management | ✅ | `lib/api.ts` (interceptors) |
| Auth check wrapper | ✅ | `components/layout/auth-check.tsx` |

### 2. Task Management
| Feature | Status | Files |
|---------|--------|-------|
| Task list view | ✅ | `app/tasks/page.tsx` |
| Task card display | ✅ | `components/tasks/TaskCard.tsx` |
| Task detail modal | ✅ | `components/tasks/TaskDetailModal.tsx` |
| Create/Edit/Delete tasks | ✅ | `hooks/useTasks.ts` |
| Subtask support | ✅ | `TaskCard.tsx` (nested rendering) |
| Kanban board view | ✅ | `app/tasks/kanban/page.tsx` |
| Drag-and-drop columns | ✅ | Native DnD in kanban page |
| List management | ✅ | `ListSidebar.tsx`, `ListForm.tsx` |
| Tag management | ✅ | `TagPicker.tsx`, `hooks/useTags.ts` |
| Filter by status/priority/list/tag | ✅ | `app/tasks/page.tsx` |
| Sorting (priority/date/created) | ✅ | `app/tasks/page.tsx` |

### 3. Scheduling System (NEW)
| Feature | Status | Files |
|---------|--------|-------|
| Schedule utilities | ✅ | `lib/scheduleUtils.ts` |
| Countdown timer component | ✅ | `components/ui/CountdownTimer.tsx` |
| Schedule display (auto-detect type) | ✅ | `components/tasks/ScheduleDisplay.tsx` |
| Live timer widget | ✅ | `components/tasks/LiveTimer.tsx` |
| Timer context (global state) | ✅ | `contexts/TimerContext.tsx` |
| Schedule form (type selector) | ✅ | `components/tasks/TaskScheduleForm.tsx` |
| localStorage persistence | ✅ | `TimerContext.tsx` |
| Browser notifications | ✅ | `TimerContext.tsx` |

### 4. Habit Tracking
| Feature | Status | Files |
|---------|--------|-------|
| Habit list view | ✅ | `app/habits/page.tsx` |
| Habit card with streak/rate | ✅ | Inline in page |
| Create/Edit/Delete habits | ✅ | `hooks/useHabits.ts` |
| Log completion (today) | ✅ | `useHabitMutations.logCompletion` |
| Mini heatmap (7 days) | ✅ | Inline in habit cards |
| Full calendar heatmap | ✅ | `components/habits/HabitCalendar.tsx` |
| Quick log widget | ✅ | `components/habits/QuickLogWidget.tsx` |
| Analytics page | ✅ | `app/habits/analytics/page.tsx` |
| Weekly pattern chart | ✅ | In analytics page |

### 5. Commitment System
| Feature | Status | Files |
|---------|--------|-------|
| Commitment list view | ✅ | `app/commitments/page.tsx` |
| Commitment card | ✅ | `components/commitments/CommitmentCard.tsx` |
| Commitment detail modal | ✅ | `components/commitments/CommitmentDetailModal.tsx` |
| Create new commitment | ✅ | `app/commitments/new/page.tsx` |
| Dashboard stats | ✅ | `components/commitments/CommitmentStats.tsx` |
| Lifecycle timeline | ✅ | `components/commitments/CommitmentTimeline.tsx` |
| Evidence upload | ✅ | `components/commitments/EvidenceUpload.tsx` |
| Filter by status | ✅ | Tab filters in page |

### 6. File Management
| Feature | Status | Files |
|---------|--------|-------|
| File upload component | ✅ | `components/ui/FileUpload.tsx` |
| Attachment list display | ✅ | `components/ui/AttachmentList.tsx` |
| Drag-and-drop upload | ✅ | `FileUpload.tsx` |
| Image preview | ✅ | `AttachmentList.tsx` |
| Download attachments | ✅ | `AttachmentList.tsx` |
| Delete attachments | ✅ | With confirmation |

### 7. Navigation & Layout
| Feature | Status | Files |
|---------|--------|-------|
| Top navbar (desktop) | ✅ | `components/layout/navbar.tsx` |
| Mobile hamburger menu | ✅ | `navbar.tsx` (framer motion) |
| Command palette (⌘K) | ✅ | `components/layout/CommandPalette.tsx` |
| Global search | ✅ | CommandPalette (tasks, habits, commitments) |
| Layout wrapper | ✅ | `components/layout/layout.tsx` |

### 8. Dashboard
| Feature | Status | Files |
|---------|--------|-------|
| Overview page | ✅ | `app/page.tsx` |
| Task summary widget | ✅ | `components/dashboard/TaskSummary.tsx` |
| Habit summary widget | ✅ | `components/dashboard/HabitSummary.tsx` |
| Commitment summary | ✅ | `components/dashboard/CommitmentSummary.tsx` |

---

## Features - TODO 📋

### High Priority
| Feature | Description | Effort |
|---------|-------------|--------|
| **Integrate ScheduleDisplay into TaskCard** | Show time/timer/deadline on cards | 1 hour |
| **Integrate TaskScheduleForm into task creation** | Add schedule selector to new task form | 2 hours |
| **Notification settings page** | User preferences for alerts | 2 hours |
| **User profile page** | Avatar, name, email, preferences | 3 hours |
| **Settings page enhancements** | Theme toggle, timezone, export data | 2 hours |

### Medium Priority
| Feature | Description | Effort |
|---------|-------------|--------|
| **Calendar view for tasks** | Full calendar with time blocks | 4 hours |
| **Recurring task UI** | Visual RRULE picker | 3 hours |
| **Task templates** | Save/load task presets | 2 hours |
| **Habit reminders** | Push notifications at scheduled times | 3 hours |
| **Commitment sharing** | Share with accountability partner | 4 hours |
| **Progressive Web App (PWA)** | Offline support, install prompt | 3 hours |

### Low Priority
| Feature | Description | Effort |
|---------|-------------|--------|
| **Dark mode** | Theme switcher | 2 hours |
| **Keyboard shortcuts** | Beyond ⌘K (navigation, actions) | 2 hours |
| **Onboarding tutorial** | First-time user guide | 2 hours |
| **Widget customization** | Drag/reorder dashboard widgets | 3 hours |
| **Data export** | CSV/JSON export of all data | 1 hour |

---

## Features - NEEDS IMPROVEMENT 🔧

### UX/Performance Issues

| Issue | Current State | Improvement Needed |
|-------|---------------|-------------------|
| **Task page reload on activate** | Uses `window.location.reload()` | Convert to React Query mutation |
| **Kanban drag-drop** | Native implementation | Consider `@hello-pangea/dnd` for smoother UX |
| **Loading states** | Basic "LOADING..." text | Add skeleton loaders |
| **Error handling** | Console logs + toasts | Add error boundary, retry logic |
| **Form validation** | Minimal validation | Add Zod/Yup schema validation |
| **Empty states** | Basic "No items" text | Add illustrations, call-to-action |

### Code Quality Issues

| Issue | Location | Fix Needed |
|-------|----------|------------|
| **TypeScript `any` usage** | Multiple files | Add proper types |
| **Duplicate toast imports** | Was in habits page | Fixed ✅ |
| **Missing error boundaries** | App-wide | Add global error boundary |
| **Inconsistent date handling** | Various | Centralize with date-fns |
| **Large component files** | `app/tasks/page.tsx` (450+ lines) | Split into smaller components |

### Visual/Design Issues

| Issue | Location | Fix Needed |
|-------|----------|------------|
| **Mobile responsiveness** | Some modals | Test and fix overflow |
| **Touch targets** | Small buttons | Increase tap area on mobile |
| **Color contrast** | Some gray text | Check WCAG accessibility |
| **Animation jank** | Fast interactions | Add `will-change` hints |
| **Consistent spacing** | Various pages | Standardize padding/margins |

### Missing Backend Integration

| Feature | Frontend Ready | Backend Status |
|---------|---------------|----------------|
| `start_date` field | ✅ Types added | ⚠️ Need to verify API returns it |
| `duration_minutes` field | ✅ Types added | ⚠️ Need to verify API returns it |
| Timer state persistence | ✅ localStorage | ❌ Could add backend sync |
| Notification preferences | ❌ | ❌ Need backend model |

---

## Component Reference

### UI Components (`components/ui/`)
| Component | Props | Purpose |
|-----------|-------|---------|
| `NeoButton` | `size`, `variant`, `onClick` | Neobrutalist button |
| `NeoCard` | `className`, `style`, `onClick` | Bordered card container |
| `FileUpload` | `onUpload`, `maxSize`, `accept` | Drag-drop file input |
| `AttachmentList` | `attachments`, `onDelete` | Display uploaded files |
| `CountdownTimer` | `targetDate`, `onComplete`, `size` | Live countdown |

### Task Components (`components/tasks/`)
| Component | Props | Purpose |
|-----------|-------|---------|
| `TaskCard` | `task`, `onComplete`, `onClick`, etc. | Task display card |
| `TaskDetailModal` | `task`, `onClose`, `onUpdate` | Full task view with editing |
| `ScheduleDisplay` | `task`, `onStartTimer` | Shows schedule type |
| `LiveTimer` | (uses context) | Floating timer widget |
| `TaskScheduleForm` | `scheduleType`, `onChange` | Schedule input form |
| `ListSidebar` | `selectedList`, `onSelect` | List management |
| `TagPicker` | `selectedTags`, `onTagsChange` | Multi-tag selector |

### Commitment Components (`components/commitments/`)
| Component | Props | Purpose |
|-----------|-------|---------|
| `CommitmentCard` | `commitment`, `onClick`, etc. | Commitment display |
| `CommitmentDetailModal` | `commitment`, `onClose` | 3-tab detail view |
| `CommitmentTimeline` | `commitment` | Lifecycle visualization |
| `EvidenceUpload` | `commitmentId`, `attachments` | Upload evidence files |

### Hooks (`hooks/`)
| Hook | Returns | Purpose |
|------|---------|---------|
| `useTasks` | `{ data, isLoading }` | Fetch tasks |
| `useTaskMutations` | `{ createTask, updateTask, ... }` | Task CRUD |
| `useHabits` | `{ data, isLoading }` | Fetch habits |
| `useHabitMutations` | `{ logCompletion, ... }` | Habit actions |
| `useLists` | `{ data }` | Fetch lists |
| `useTags` | `{ data }` | Fetch tags |
| `useCommitments` | `{ data }` | Fetch commitments |
| `useTimer` | `{ activeTimer, startTimer, ... }` | Timer state |

---

## File Structure

```
frontend/
├── app/
│   ├── auth/callback/         # OAuth callback handler
│   ├── calendar/              # Calendar view (basic)
│   ├── commitments/
│   │   ├── new/               # Create commitment
│   │   ├── edit/[id]/         # Edit commitment
│   │   └── page.tsx           # List commitments
│   ├── habits/
│   │   ├── analytics/         # Habit analytics
│   │   └── page.tsx           # List habits
│   ├── login/                 # Login page
│   ├── register/              # Register page
│   ├── settings/              # Settings page
│   ├── tasks/
│   │   ├── kanban/            # Kanban board
│   │   └── page.tsx           # List tasks
│   ├── layout.tsx             # Root layout
│   ├── providers.tsx          # Context providers
│   └── page.tsx               # Dashboard
├── components/
│   ├── auth/                  # Auth components
│   ├── commitments/           # Commitment components
│   ├── dashboard/             # Dashboard widgets
│   ├── habits/                # Habit components
│   ├── layout/                # Navbar, CommandPalette
│   ├── tasks/                 # Task components
│   └── ui/                    # Reusable UI components
├── contexts/
│   └── TimerContext.tsx       # Global timer state
├── hooks/
│   ├── useCommitments.ts
│   ├── useHabits.ts
│   ├── useLists.ts
│   ├── useTags.ts
│   └── useTasks.ts
└── lib/
    ├── api.ts                 # API client + endpoints
    ├── scheduleUtils.ts       # Schedule helpers
    ├── types.ts               # TypeScript types
    └── utils.ts               # General utilities
```

---

## Next Steps (Recommended Order)

1. **Immediate:** Integrate ScheduleDisplay into TaskCard
2. **Immediate:** Add TaskScheduleForm to task creation modal
3. **This Week:** Add skeleton loaders for loading states
4. **This Week:** Split large page files into components
5. **Next Week:** Calendar view with time blocks
6. **Next Week:** User profile and settings pages
