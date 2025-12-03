# Multi-Branch Expansion Engine - Setup Guide

## Overview

The Multi-Branch Expansion Engine allows VelocityMaid to launch new locations (branches) with one admin action. It includes branch management, ZIP code routing, profitability tracking, and branch-specific landing pages.

## Features

- **Branch Creation**: Admin interface to create new branches
- **ZIP Code Routing**: Automatic branch assignment based on ZIP code
- **Branch Profitability**: Per-branch financial metrics and reporting
- **Branch Landing Pages**: Dynamic location-specific pages
- **Multi-Branch Dispatch**: Branch-aware queries for cleaners and managers
- **Franchise Support**: Configuration models for franchise operations

## Data Models

### Core Branch Models

**Branch**
- Basic branch information (name, location, contact)
- Manager assignment
- Pricing model reference
- Status (ACTIVE, COMING_SOON, PAUSED)

**BranchServiceArea**
- ZIP codes served by branch
- Priority ordering for overlapping areas
- City/state information

**PricingModel**
- Billing type (HOURLY, FLAT, TIERED)
- Base rates and pricing structure

**BranchServicePackage**
- Service packages specific to branch
- Local pricing and duration

**BranchConfig**
- Operational settings
- Email addresses
- WhatsApp/Zapier configurations

**BranchAutomationConfig**
- Webhook URLs
- WhatsApp template IDs

**BranchLandingContent**
- SEO content
- Hero sections
- Testimonials and FAQs

### Franchise Support Models

**BranchPayoutRules**
- Cleaner payout structure
- Tip handling rules
- Franchise fee percentages

**BranchSops**
- Standard operating procedures
- Document links

**BranchOnboardingResources**
- Training materials
- Resource links

## Database Migration

### Prisma Schema

The complete Prisma schema is in `/prisma/schema.prisma`. To apply:

```bash
npx prisma migrate dev --name add_multi_branch_support
```

### Key Changes to Existing Models

**User**
- Added `primaryBranchId` (nullable FK to Branch)
- Added `UserBranch` relation for multi-branch assignment

**Customer**
- Added `homeZipCode` (nullable)
- Added `branchId` (nullable FK to Branch)

**Job/Booking**
- Added `branchId` (NOT NULL for new bookings)
- TODO: Backfill historical jobs with branchId

**Payout, Incentive, Bonus**
- Should include `branchId` (via jobId join or explicit field)

## Routes

### Admin Routes

- `/admin/branches` - List all branches
- `/admin/branches/new` - Create new branch
- `/admin/branches/[slug]` - View branch details
- `/admin/branches/[slug]/profitability` - Branch profitability dashboard

### Public Routes

- `/locations/[slug]` - Branch landing page
- `/locations/[slug]/book` - Branch-specific booking page

### API Routes

- `GET /api/admin/branches` - List branches
- `POST /api/admin/branches` - Create branch
- `GET /api/resolve-zip?zip=XXXXX` - Resolve branch by ZIP
- `GET /api/admin/branches/[slug]/metrics` - Branch metrics (TODO)

## Branch Creation Flow

1. **Admin fills form** at `/admin/branches/new`
2. **System validates** and creates Branch record
3. **Creates related records**:
   - BranchConfig
   - BranchAutomationConfig
   - BranchServiceArea (for each ZIP)
   - BranchServicePackage (if cloning)
4. **Links manager** (sets primaryBranchId, creates UserBranch)
5. **Associates customers** (background task - matches ZIP codes)
6. **Generates landing page** (if requested)

## ZIP Code Routing

### Resolution Logic

1. Normalize ZIP code (trim spaces)
2. Query BranchServiceArea where zipCode matches
3. Filter to branches with status = ACTIVE
4. Order by:
   - Priority ASC (lower number = higher priority)
   - Branch createdAt ASC (older branches first)
5. Return first match

### Integration Points

**Home Page**
- ZIP input → `/api/resolve-zip`
- If found → redirect to `/locations/[slug]/book?zip=XXXX`
- If not found → show waitlist form

**Booking API**
- If branchId not provided → resolve from ZIP
- Set job.branchId before creating Stripe session
- Store branchId in Stripe metadata

## Branch-Aware Queries

### For Cleaners

```typescript
// Only show jobs from cleaner's assigned branches
const userBranches = getUserBranches(cleanerId);
const branchIds = userBranches.map(ub => ub.branchId);

// Filter jobs
jobs.filter(job => branchIds.includes(job.branchId));
```

### For Managers

```typescript
// Only show jobs from manager's assigned branches
const userBranches = getUserBranches(managerId);
const branchIds = userBranches.map(ub => ub.branchId);

// Filter jobs
jobs.filter(job => branchIds.includes(job.branchId));
```

### For Admins

```typescript
// Admins see all jobs (no filtering)
// Optionally filter by branchId if selected
```

## Branch Profitability Metrics

### Calculations

- **Revenue**: Sum of `job.totalAmount` for completed jobs
- **Labour Cost**: Sum of cleaner payouts for those jobs
- **Incentives**: Sum of incentive payouts
- **Bonuses**: Sum of bonus payments
- **Profit**: Revenue - (Labour Cost + Incentives + Bonuses)
- **Margin**: (Profit / Revenue) × 100
- **Job Volume**: Count of completed jobs
- **Retention Rate**: % of customers with ≥2 jobs

### Data Sources

- Jobs table (filtered by branchId and date range)
- Payouts table (joined via jobId)
- Incentives table (joined via jobId)
- Customers table (for retention calculation)

## Branch Landing Pages

### Coming Soon Page

- Shows waitlist form
- Collects email/phone
- TODO: Submit to waitlist API

### Active Branch Page

- Hero section with branch name
- Service areas (ZIP codes/cities)
- Service packages with local pricing
- Testimonials (if available)
- FAQs (if available)
- LocalBusiness JSON-LD for SEO

## Franchise Support

### Template Cloning

When creating a branch, admin can:
- Select "Base from template branch"
- System clones:
  - BranchServicePackage records
  - BranchPayoutRules
  - BranchAutomationConfig
  - BranchLandingContent (optional)

### Payout Rules

- **Base Rate Type**: PER_HOUR, PER_JOB, PERCENTAGE
- **Tip Handling**: PASS_THROUGH, SPLIT, POOL
- **Franchise Fee**: Optional percentage

## Testing

### Test Branch Creation

1. Navigate to `/admin/branches/new`
2. Fill form with test data
3. Submit
4. Verify branch created
5. Check service areas created
6. Verify packages cloned (if selected)

### Test ZIP Routing

1. Create branch with ZIP codes
2. Go to home page
3. Enter ZIP code
4. Should redirect to branch landing page
5. Test with non-served ZIP → should show waitlist

### Test Branch Profitability

1. Create test jobs for branch
2. Navigate to `/admin/branches/[slug]/profitability`
3. Verify metrics display correctly
4. Test date range filters

## Environment Variables

No new environment variables required. Uses existing:
- `DATABASE_URL` (for Prisma)
- `STRIPE_SECRET_KEY` (for checkout)

## Future Enhancements

1. **RLS Policies** (if using Supabase)
   - Row-level security for branch data
   - Automatic filtering by UserBranch

2. **Background Jobs**
   - Customer association task
   - Metrics calculation task
   - Landing page generation

3. **Branch Analytics**
   - Growth metrics
   - Customer acquisition
   - Cleaner performance by branch

4. **Multi-Branch Operations**
   - Cross-branch reporting
   - Branch comparison tools
   - Regional dashboards



