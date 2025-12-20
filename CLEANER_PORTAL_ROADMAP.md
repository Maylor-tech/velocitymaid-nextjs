# Cleaner Portal Roadmap

**Status:** Planning Phase  
**Last Updated:** December 2024

---

## Overview

The Cleaner Portal will provide cleaners with a self-service interface to:
- View and manage their assigned jobs
- Set and update their availability
- Track earnings and payouts
- View performance metrics (JQS, ratings)
- Manage their profile

---

## Phase 1: Core Job Management (Priority 1)

### Pages & Components

#### 1. Cleaner Dashboard (`/cleaners/dashboard`)
**Purpose:** Main landing page showing overview

**Components:**
- **Upcoming Jobs Card**
  - Next 7 days of assigned jobs
  - Quick status indicators (pending, in_progress, completed)
  - Count badges
  
- **Today's Jobs**
  - Jobs scheduled for today
  - Time slots
  - Quick actions (mark on the way, start, complete)

- **Stats Summary**
  - Jobs this week/month
  - Average JQS
  - Earnings this period
  - On-time rate

- **Quick Actions**
  - Update availability
  - View earnings
  - Contact support

**API Endpoints Needed:**
- `GET /api/cleaners/dashboard` - Aggregate stats and upcoming jobs
- `GET /api/cleaners/jobs?filter=upcoming` - Upcoming jobs list

---

#### 2. Jobs List (`/cleaners/jobs`)
**Purpose:** Full list of all jobs (past, present, future)

**Features:**
- Filter by:
  - Status (pending, assigned, in_progress, completed, cancelled)
  - Date range
  - Service type
  
- Sort by:
  - Date (ascending/descending)
  - Status
  - Price

- Job Card Display:
  - Customer name
  - Address with map link
  - Date & time
  - Service type
  - Price
  - Status badge
  - Actions (view details, mark status)

**API Endpoints Needed:**
- `GET /api/cleaners/jobs` - List all cleaner's jobs with filters
- `GET /api/cleaners/jobs/[id]` - Job details
- `PATCH /api/cleaners/jobs/[id]/status` - Update job status

---

#### 3. Job Details (`/cleaners/jobs/[id]`)
**Purpose:** Detailed view of a single job

**Components:**
- **Job Information**
  - Customer details (name, phone, address)
  - Service type and add-ons
  - Date, time, duration estimate
  - Special instructions (if any)
  - Price breakdown

- **Location**
  - Address
  - Embedded map (Google Maps)
  - Directions link

- **Status Actions**
  - Mark "On the Way" (updates `onTheWayAt`)
  - Mark "In Progress" (updates status)
  - Mark "Completed" (updates status + `completedAt`)
  - Add notes/comments

- **Related Information**
  - Previous jobs with this customer (if any)
  - Customer preferences
  - Job quality score (after completion)

**API Endpoints Needed:**
- `GET /api/cleaners/jobs/[id]` - Full job details
- `PATCH /api/cleaners/jobs/[id]/status` - Update status
- `POST /api/cleaners/jobs/[id]/notes` - Add job notes

---

### Phase 1 API Endpoints Summary

```
GET  /api/cleaners/dashboard
GET  /api/cleaners/jobs
GET  /api/cleaners/jobs/[id]
PATCH /api/cleaners/jobs/[id]/status
POST /api/cleaners/jobs/[id]/notes
```

---

## Phase 2: Availability Management (Priority 2)

### Pages & Components

#### 4. Availability Settings (`/cleaners/availability`)
**Purpose:** Manage working schedule

**Components:**
- **Working Days Selector**
  - Checkboxes for Mon-Sun
  - Visual calendar view

- **Time Ranges**
  - Add multiple time slots per day
  - Start/end time pickers
  - Remove time slots

- **Max Daily Jobs**
  - Slider or input (1-10)
  - Shows current setting

- **Blackout Dates**
  - Calendar picker for unavailable dates
  - List of blackout dates with remove option
  - Bulk add (e.g., holidays)

- **Save Button**
  - Validates at least one working day
  - Validates at least one time range
  - Shows success/error message

**API Endpoints Needed:**
- `GET /api/cleaners/availability` - Get current availability (already exists)
- `PUT /api/cleaners/availability` - Update availability (already exists)

**Note:** These endpoints already exist at `/api/cleaners/availability` and `/api/cleaners/availability/update`

---

## Phase 3: Earnings & Performance (Priority 3)

### Pages & Components

#### 5. Earnings Dashboard (`/cleaners/earnings`)
**Purpose:** View earnings history and upcoming payouts

**Components:**
- **Current Period Summary**
  - Total earnings (this week/month)
  - Breakdown by job
  - Pending payouts

- **Earnings History**
  - Table of past payouts
  - Date, amount, status
  - Download receipt/invoice

- **Upcoming Payouts**
  - Scheduled payout dates
  - Estimated amounts
  - Payment method

**API Endpoints Needed:**
- `GET /api/cleaners/earnings` - Earnings summary and history
- `GET /api/cleaners/earnings/payouts` - Payout history
- `GET /api/cleaners/earnings/upcoming` - Upcoming payouts

**Note:** `/api/cleaners/earnings` may already exist - verify

---

#### 6. Performance Metrics (`/cleaners/performance`)
**Purpose:** View job quality scores, ratings, and stats

**Components:**
- **Job Quality Score (JQS)**
  - Average JQS
  - Trend chart (last 6 months)
  - Breakdown by job

- **Customer Ratings**
  - Average rating (1-5 stars)
  - Recent reviews
  - Rating distribution

- **Performance Stats**
  - On-time rate
  - Completion rate
  - Jobs completed
  - Reclean requests (if any)

**API Endpoints Needed:**
- `GET /api/cleaners/performance` - Performance metrics
- `GET /api/cleaners/performance/jqs` - JQS history
- `GET /api/cleaners/performance/reviews` - Customer reviews

---

## Phase 4: Profile & Settings (Priority 4)

### Pages & Components

#### 7. Profile Settings (`/cleaners/profile`)
**Purpose:** Manage cleaner profile information

**Components:**
- **Personal Information**
  - Name (read-only or editable)
  - Email (read-only)
  - Phone number
  - Profile photo upload

- **Branch Assignment**
  - Current branch(es)
  - Primary branch indicator
  - Read-only (admin manages)

- **Training Status** (Jamaica only)
  - Current training status
  - Link to training modules
  - Certificate download

- **Preferences**
  - Preferred cities (NJ only)
  - Notification preferences
  - Language

**API Endpoints Needed:**
- `GET /api/cleaners/profile` - Get profile
- `PATCH /api/cleaners/profile` - Update profile
- `POST /api/cleaners/profile/photo` - Upload profile photo

---

## Authentication & Authorization

### Current State
- Cleaners authenticate via cookie (`cleanerId`)
- Endpoints check for `cleanerId` cookie

### Recommended Enhancements
- Add proper session management
- Add role-based access control
- Add password reset flow
- Add email verification

---

## Database Schema Considerations

### Existing Tables (No Changes Needed)
- `User` - Cleaner user accounts
- `Job` - Jobs with `assignedCleanerId`
- `CleanerAvailability` - Availability settings
- `TrainingStatus` - Training progress (Jamaica)
- `JamaicaPayout` - Payout records (Jamaica)

### Potential Additions
- `JobNote` - Cleaner notes on jobs
- `CleanerNotification` - Notification preferences
- `CleanerEarnings` - Earnings tracking (if not using existing payout tables)

---

## UI/UX Guidelines

### Design System
- Use existing Tailwind CSS setup
- Follow AdminLayout pattern for consistency
- Mobile-responsive design (cleaners may use phones)

### Key Patterns
- **Status Badges:** Color-coded (pending=yellow, assigned=blue, completed=green)
- **Action Buttons:** Primary actions in blue, secondary in gray
- **Loading States:** Spinner with descriptive text
- **Error Handling:** Clear error messages with retry options
- **Empty States:** Helpful messages when no data

### Navigation Structure
```
/cleaners
  ├── /dashboard (home)
  ├── /jobs
  │   ├── / (list)
  │   └── /[id] (details)
  ├── /availability
  ├── /earnings
  ├── /performance
  └── /profile
```

---

## Implementation Priority

### Sprint 1 (Week 1-2)
1. ✅ Cleaner authentication check utility
2. ✅ Dashboard page with upcoming jobs
3. ✅ Jobs list page with filters
4. ✅ Job details page with status actions

### Sprint 2 (Week 3-4)
5. ✅ Availability management page (reuse existing API)
6. ✅ Earnings dashboard
7. ✅ Performance metrics page

### Sprint 3 (Week 5-6)
8. ✅ Profile settings page
9. ✅ Notification preferences
10. ✅ Mobile optimization
11. ✅ Testing & bug fixes

---

## Technical Notes

### API Authentication
All cleaner endpoints should:
1. Check for `cleanerId` cookie
2. Verify cleaner exists and is active
3. Filter results to only that cleaner's data

### Data Filtering
- Jobs: `WHERE assignedCleanerId = :cleanerId`
- Earnings: Filter by cleaner ID
- Performance: Aggregate by cleaner ID

### Real-time Updates
Consider adding:
- WebSocket for real-time job assignments
- Push notifications for new jobs
- Email/SMS notifications (optional)

---

## Future Enhancements (Post-MVP)

1. **Mobile App**
   - React Native or PWA
   - Offline job viewing
   - GPS tracking for "on the way" status

2. **Advanced Features**
   - Job swapping with other cleaners
   - Availability templates (save common schedules)
   - Earnings forecasting
   - Tax document generation

3. **Communication**
   - In-app messaging with customers
   - Photo uploads for completed jobs
   - Customer feedback collection

4. **Gamification**
   - Achievement badges
   - Leaderboards (optional)
   - Streak tracking

---

## Success Metrics

- **Adoption:** % of cleaners using portal weekly
- **Engagement:** Average sessions per cleaner per week
- **Efficiency:** Time to mark job status updates
- **Satisfaction:** Cleaner feedback scores

---

## Next Steps

1. Review and approve roadmap
2. Create detailed component specs
3. Set up cleaner authentication middleware
4. Begin Sprint 1 implementation

