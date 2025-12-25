# Cleaner Dashboard for Miami Branch — Analysis

**Purpose:** Analysis of current cleaner dashboard implementation for Miami branch  
**Date:** 2025-01-13

---

## 1️⃣ Current Dashboard File Path

**Main Dashboard Component:**
- **Path:** `app/cleaners/dashboard/page.tsx`
- **Type:** Client Component (`"use client"`)
- **Route:** `/cleaners/dashboard`

**Related Components:**
- `app/cleaners/components/CleanerHeader.tsx` - Header component
- `app/cleaners/components/Tabs.tsx` - Tab navigation
- `app/cleaners/components/JobList.tsx` - Job list display
- `app/cleaners/components/JobCard.tsx` - Individual job card

---

## 2️⃣ How Cleaners Are Identified

### Current Implementation (Using Mock Data)

**Authentication Method:**
- Uses cookie-based authentication: `cleanerId` cookie
- Cookie set in: `app/api/cleaners/login/route.ts`
- Cookie name: `"cleanerId"`

**Current Data Source:**
```typescript
// app/api/cleaners/me/route.ts (CURRENT - uses mock data)
const cleaner = findCleanerById(cleanerId); // From @/utils/cleanerData
```

**Cleaner Info Interface:**
```typescript
interface CleanerInfo {
  id: string;
  name: string;
  phone: string;
  region: 'new_jersey' | 'vermont'; // ❌ Hardcoded regions, not branch-based
}
```

### Branch Association (Database Schema)

**How Cleaners Are Associated with Branches:**

1. **Primary Branch:**
   - Field: `User.primaryBranchId` (String?)
   - Direct relationship to `Branch` table

2. **Multiple Branch Assignments:**
   - Table: `UserBranch`
   - Fields: `userId`, `branchId`
   - Many-to-many relationship

**Database Query Pattern:**
```typescript
// From app/api/admin/cleaners/by-branch/route.ts
const cleaners = await prisma.user.findMany({
  where: {
    role: UserRole.CLEANER,
    isActive: true,
    OR: [
      { primaryBranchId: branchId },        // Primary branch
      {
        UserBranch: {
          some: {
            branchId: branchId,            // Assigned via UserBranch
          },
        },
      },
    ],
  },
});
```

**For Miami Branch Specifically:**
```typescript
// Get Miami branch ID
const miamiBranch = await prisma.branch.findUnique({
  where: { slug: "miami" },
  select: { id: true },
});

// Find cleaners assigned to Miami
const miamiCleaners = await prisma.user.findMany({
  where: {
    role: UserRole.CLEANER,
    isActive: true,
    OR: [
      { primaryBranchId: miamiBranch.id },
      {
        UserBranch: {
          some: {
            branchId: miamiBranch.id,
          },
        },
      },
    ],
  },
});
```

---

## 3️⃣ Existing Data Fetching Logic

### A. Cleaner Info Fetching

**Current Endpoint:** `GET /api/cleaners/me`

**Current Implementation:**
```typescript
// app/api/cleaners/me/route.ts
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const cleanerId = cookieStore.get('cleanerId')?.value;
  
  // ❌ Uses mock data
  const cleaner = findCleanerById(cleanerId);
  
  return NextResponse.json({
    success: true,
    cleaner: {
      id: cleaner.id,
      name: cleaner.name,
      phone: cleaner.phone,
      region: cleaner.region, // ❌ Hardcoded region
    },
  });
}
```

**What It Should Return (For Miami):**
```typescript
{
  success: true,
  cleaner: {
    id: string,
    name: string,
    email: string,
    phone: string,
    branchId: string,        // ✅ Miami branch ID
    branchName: string,      // ✅ "Miami"
    branchSlug: string,      // ✅ "miami"
    primaryBranchId: string | null,
    assignedBranches: string[], // All branch IDs
  }
}
```

### B. Jobs Fetching

**Current Endpoint:** `GET /api/cleaners/jobs`

**Current Implementation:**
```typescript
// app/api/cleaners/jobs/route.ts
// ❌ Fetches from Stripe sessions, not database
const allJobs = await getCleanerJobsFromStripe(cleaner.id, cleaner.phone);

// ❌ Filters by phone match only
if (metadata.assignedCleanerPhone === cleanerPhone) {
  // Add job
}

// TODO comment says:
// TODO: Filter jobs by branch access
// When moving to database:
// 1. Get cleaner's assigned branches via getUserBranchIds(cleaner.id)
// 2. Filter jobs where job.branchId is in cleaner's branch list
```

**What It Should Do (For Miami):**
```typescript
// ✅ Fetch from database
const jobs = await prisma.job.findMany({
  where: {
    assignedCleanerId: cleanerId,
    branchId: miamiBranchId, // ✅ Filter by Miami branch
    // ... other filters
  },
  include: {
    Customer: { select: { name: true, email: true } },
    Branch: { select: { name: true, slug: true } },
  },
});
```

### C. Payment Method Status

**Current:** ❌ Not checked in dashboard

**What's Needed:**
```typescript
// Check if cleaner has verified payment method
const paymentMethod = await prisma.cleanerPaymentMethod.findFirst({
  where: {
    cleanerId: cleanerId,
    isActive: true,
    verifiedAt: { not: null },
  },
});

const paymentMethodVerified = !!paymentMethod;
```

---

## 4️⃣ Layout Structure

### Current Dashboard Layout

```tsx
// app/cleaners/dashboard/page.tsx
<div className="min-h-screen bg-gray-50 p-6">
  <div className="max-w-4xl mx-auto">
    {/* 1. Header */}
    <CleanerHeader
      name={cleaner.name}
      region={cleaner.region}  // ❌ Hardcoded region
      onLogout={handleLogout}
    />

    {/* 2. Certification Badge (if certified) */}
    {trainingProgress?.isCertified && <CertificationBadge />}

    {/* 3. Training Required Banner */}
    {trainingProgress?.showTraining && <TrainingBanner />}

    {/* 4. Training Progress Card */}
    {trainingProgress?.showTraining && <TrainingProgressCard />}

    {/* 5. Action Buttons */}
    <div className="mb-6 flex justify-end gap-3">
      <button>SOP Library</button>
      <button>View Scorecard</button>
      <button>My Incentives</button>
      <button>My Earnings</button>
    </div>

    {/* 6. Tabs */}
    <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

    {/* 7. Job List */}
    <JobList jobs={jobs} onStatusUpdate={handleStatusUpdate} />
  </div>
</div>
```

### Missing for Miami Branch

**What Needs to Be Added:**

1. **Payment Method Banner** (Week 2 requirement)
   ```tsx
   {!paymentMethodVerified && (
     <Alert variant="warning">
       <AlertTitle>Payment Method Needed</AlertTitle>
       <AlertDescription>
         Add a payment method to receive payouts. Completed jobs will be released once verified.
       </AlertDescription>
       <Button asChild>
         <Link href="/cleaner/payments">Add Payment Method</Link>
       </Button>
     </Alert>
   )}
   ```

2. **Branch Information Display**
   ```tsx
   <div className="mb-4">
     <Badge>{cleaner.branchName}</Badge>
   </div>
   ```

---

## 5️⃣ Data Flow Summary

### Current Flow (Mock Data)

```
User visits /cleaners/dashboard
  ↓
useEffect calls fetchCleanerInfo()
  ↓
GET /api/cleaners/me
  ↓
findCleanerById() from mock data
  ↓
Returns: { id, name, phone, region }
  ↓
useEffect calls fetchJobs()
  ↓
GET /api/cleaners/jobs
  ↓
getCleanerJobsFromStripe() (Stripe sessions)
  ↓
Filters by phone match
  ↓
Returns: CleanerJob[]
```

### Required Flow (Database + Miami Branch)

```
User visits /cleaners/dashboard
  ↓
useEffect calls fetchCleanerInfo()
  ↓
GET /api/cleaners/me
  ↓
prisma.user.findUnique() with branch info
  ↓
Returns: { id, name, email, branchId, branchName, branchSlug, ... }
  ↓
useEffect calls fetchPaymentMethodStatus()
  ↓
GET /api/cleaners/payment-method/status
  ↓
prisma.cleanerPaymentMethod.findFirst()
  ↓
Returns: { verified: boolean }
  ↓
useEffect calls fetchJobs()
  ↓
GET /api/cleaners/jobs?branchId=miami
  ↓
prisma.job.findMany() filtered by branchId
  ↓
Returns: Job[] (from database)
```

---

## 6️⃣ Required Updates for Miami Branch

### Priority 1: Update `/api/cleaners/me` Endpoint

**File:** `app/api/cleaners/me/route.ts`

**Changes Needed:**
1. ✅ Use `getAuthenticatedCleaner()` from `lib/cleanerAuth.ts`
2. ✅ Fetch from database instead of mock data
3. ✅ Include branch information
4. ✅ Return branch ID, name, and slug

**Implementation:**
```typescript
import { getAuthenticatedCleaner } from "@/lib/cleanerAuth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedCleaner(request);
  
  if (!authResult.success || !authResult.cleanerId) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const cleaner = await prisma.user.findUnique({
    where: { id: authResult.cleanerId },
    include: {
      Branch_User_primaryBranchIdToBranch: {
        select: { id: true, name: true, slug: true },
      },
      UserBranch: {
        include: {
          Branch: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
    },
  });

  // Determine primary branch (Miami for Miami cleaners)
  const primaryBranch = cleaner?.Branch_User_primaryBranchIdToBranch;
  const assignedBranches = cleaner?.UserBranch.map(ub => ub.Branch);

  return NextResponse.json({
    success: true,
    cleaner: {
      id: cleaner.id,
      name: cleaner.name,
      email: cleaner.email,
      branchId: primaryBranch?.id,
      branchName: primaryBranch?.name,
      branchSlug: primaryBranch?.slug,
      primaryBranchId: cleaner.primaryBranchId,
      assignedBranches: assignedBranches?.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
      })),
    },
  });
}
```

### Priority 2: Update Dashboard to Use Branch Info

**File:** `app/cleaners/dashboard/page.tsx`

**Changes Needed:**
1. ✅ Update `CleanerInfo` interface to include branch info
2. ✅ Update `fetchCleanerInfo()` to handle new response
3. ✅ Replace `region` with `branchName` or `branchSlug`
4. ✅ Add payment method status check

**Updated Interface:**
```typescript
interface CleanerInfo {
  id: string;
  name: string;
  email: string;
  branchId: string | null;
  branchName: string | null;
  branchSlug: string | null;
  primaryBranchId: string | null;
  assignedBranches: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}
```

### Priority 3: Add Payment Method Banner

**File:** `app/cleaners/dashboard/page.tsx`

**Changes Needed:**
1. ✅ Add payment method status state
2. ✅ Fetch payment method status on mount
3. ✅ Display banner when payment method missing
4. ✅ Link to `/cleaner/payments` page

**Implementation:**
```typescript
const [paymentMethodVerified, setPaymentMethodVerified] = useState<boolean | null>(null);

useEffect(() => {
  fetchPaymentMethodStatus();
}, []);

const fetchPaymentMethodStatus = async () => {
  try {
    const response = await fetch('/api/cleaners/payment-method/status');
    const data = await response.json();
    if (data.success) {
      setPaymentMethodVerified(data.verified);
    }
  } catch (err) {
    console.error('Error fetching payment method status:', err);
  }
};
```

### Priority 4: Update Jobs API to Filter by Branch

**File:** `app/api/cleaners/jobs/route.ts`

**Changes Needed:**
1. ✅ Fetch jobs from database instead of Stripe
2. ✅ Filter by `branchId` (Miami)
3. ✅ Use `assignedCleanerId` instead of phone match
4. ✅ Return proper Job objects

**Implementation:**
```typescript
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedCleaner(request);
  
  if (!authResult.success || !authResult.cleanerId) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const cleaner = await prisma.user.findUnique({
    where: { id: authResult.cleanerId },
    include: {
      Branch_User_primaryBranchIdToBranch: true,
      UserBranch: { include: { Branch: true } },
    },
  });

  // Get cleaner's branch IDs (Miami + any others)
  const branchIds = [
    cleaner?.primaryBranchId,
    ...(cleaner?.UserBranch.map(ub => ub.branchId) || []),
  ].filter(Boolean) as string[];

  // Fetch jobs from database
  const jobs = await prisma.job.findMany({
    where: {
      assignedCleanerId: authResult.cleanerId,
      branchId: { in: branchIds }, // Filter by cleaner's branches
    },
    include: {
      Customer: { select: { name: true, email: true } },
      Branch: { select: { name: true, slug: true } },
    },
    orderBy: {
      preferredDate: "asc",
    },
  });

  return NextResponse.json({
    success: true,
    jobs: jobs.map(job => ({
      id: job.id,
      customerName: job.Customer?.name || "Unknown",
      address: job.address || "",
      serviceType: job.serviceType || "",
      preferredDate: job.preferredDate.toISOString().split('T')[0],
      preferredTime: job.preferredTime || "Morning",
      status: job.status,
      totalPrice: job.totalPrice,
      // ... other fields
    })),
  });
}
```

---

## 7️⃣ Summary

### Current State

- ✅ Dashboard exists at `app/cleaners/dashboard/page.tsx`
- ❌ Uses mock data (`findCleanerById` from utils)
- ❌ No branch filtering
- ❌ No payment method status check
- ❌ Jobs fetched from Stripe, not database
- ❌ Hardcoded regions instead of branches

### Required Changes for Miami Branch

1. **Update `/api/cleaners/me`** - Fetch from database with branch info
2. **Update dashboard component** - Use branch info instead of region
3. **Add payment method banner** - Week 2 requirement
4. **Update `/api/cleaners/jobs`** - Fetch from database, filter by branch
5. **Create `/api/cleaners/payment-method/status`** - Check payment method status

### Files to Modify

1. `app/api/cleaners/me/route.ts` - Update to use database
2. `app/cleaners/dashboard/page.tsx` - Update interface and add banner
3. `app/api/cleaners/jobs/route.ts` - Update to use database with branch filter
4. `app/api/cleaners/payment-method/status/route.ts` - Create new endpoint

---

**Status:** 📋 Analysis Complete  
**Next:** Implement required changes for Miami branch support












