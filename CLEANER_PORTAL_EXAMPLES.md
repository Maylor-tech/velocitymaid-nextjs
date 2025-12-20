# Cleaner Portal - Examples & Mock Data

## Example Cleaner Records

```typescript
// New Jersey Cleaner
{
  id: 'cleaner_1',
  name: 'John Cleaner',
  phone: '+19735556677',
  email: 'john.cleaner@velocitymaid.com',
  region: 'new_jersey',
  active: true,
}

// Vermont Cleaner
{
  id: 'cleaner_2',
  name: 'Jane Cleaner',
  phone: '+18025556677',
  email: 'jane.cleaner@velocitymaid.com',
  region: 'vermont',
  active: true,
}

// New Jersey Cleaner
{
  id: 'cleaner_3',
  name: 'Bob Cleaner',
  phone: '+19734445555',
  email: 'bob.cleaner@velocitymaid.com',
  region: 'new_jersey',
  active: true,
}
```

## Example Job Records

```typescript
// Assigned Job
{
  id: 'cs_test_abc123',
  sessionId: 'cs_test_abc123',
  customerName: 'John D',
  address: '123 Main St, Newark, NJ 07102',
  serviceType: 'Basic Clean',
  preferredDate: '2024-12-26',
  preferredTime: '10:00 AM',
  serviceLocation: 'new_jersey',
  status: 'confirmed',
  assignedCleanerId: 'cleaner_1',
  specialInstructions: 'Please use eco-friendly products',
  phone: '+19731234567',
  totalPrice: 120,
}

// On The Way Job
{
  id: 'cs_test_def456',
  sessionId: 'cs_test_def456',
  customerName: 'Jane S',
  address: '456 Oak Ave, Burlington, VT 05401',
  serviceType: 'Deep Clean',
  preferredDate: '2024-12-27',
  preferredTime: '2:00 PM',
  serviceLocation: 'vermont',
  status: 'on_the_way',
  assignedCleanerId: 'cleaner_2',
  phone: '+18021234567',
  totalPrice: 180,
}

// Completed Job
{
  id: 'cs_test_ghi789',
  sessionId: 'cs_test_ghi789',
  customerName: 'Bob T',
  address: '789 Pine St, Jersey City, NJ 07302',
  serviceType: 'Move In/Out Clean',
  preferredDate: '2024-12-25',
  preferredTime: '9:00 AM',
  serviceLocation: 'new_jersey',
  status: 'completed',
  assignedCleanerId: 'cleaner_1',
  phone: '+19739876543',
  totalPrice: 250,
}
```

## API Request/Response Examples

### Login Request

```bash
POST /api/cleaners/login
Content-Type: application/json

{
  "identifier": "+19735556677"
}
```

### Login Response (Success)

```json
{
  "success": true,
  "cleaner": {
    "id": "cleaner_1",
    "name": "John Cleaner",
    "phone": "+19735556677",
    "region": "new_jersey"
  }
}
```

### Login Response (Error)

```json
{
  "success": false,
  "error": "Cleaner not found"
}
```

### Get Jobs Request

```bash
GET /api/cleaners/jobs?todayOnly=true
Cookie: cleanerId=cleaner_1
```

### Get Jobs Response

```json
{
  "success": true,
  "jobs": [
    {
      "id": "cs_test_abc123",
      "sessionId": "cs_test_abc123",
      "customerName": "John D",
      "address": "123 Main St, Newark, NJ 07102",
      "serviceType": "Basic Clean",
      "preferredDate": "2024-12-26",
      "preferredTime": "10:00 AM",
      "serviceLocation": "new_jersey",
      "status": "confirmed",
      "assignedCleanerId": "cleaner_1",
      "specialInstructions": "Please use eco-friendly products",
      "phone": "+19731234567",
      "totalPrice": 120
    }
  ]
}
```

### Update Job Status Request

```bash
PATCH /api/cleaners/jobs
Content-Type: application/json
Cookie: cleanerId=cleaner_1

{
  "jobId": "cs_test_abc123",
  "status": "on_the_way"
}
```

### Update Job Status Response

```json
{
  "success": true,
  "job": {
    "id": "cs_test_abc123",
    "sessionId": "cs_test_abc123",
    "customerName": "John D",
    "address": "123 Main St, Newark, NJ 07102",
    "serviceType": "Basic Clean",
    "preferredDate": "2024-12-26",
    "preferredTime": "10:00 AM",
    "serviceLocation": "new_jersey",
    "status": "on_the_way",
    "assignedCleanerId": "cleaner_1",
    "phone": "+19731234567",
    "totalPrice": 120
  }
}
```

## UI Examples

### Login Page

```
┌─────────────────────────────────────┐
│         VelocityMaid                │
│        Cleaner Login                │
├─────────────────────────────────────┤
│                                     │
│  Phone Number or Email              │
│  ┌───────────────────────────────┐ │
│  │ +19731234567 or email@...     │ │
│  └───────────────────────────────┘ │
│                                     │
│  [        Login        ]            │
│                                     │
│  Test: +19735556677                │
└─────────────────────────────────────┘
```

### Dashboard - Today's Jobs

```
┌─────────────────────────────────────────────┐
│  Welcome, John Cleaner  [NJ]  [Logout]      │
├─────────────────────────────────────────────┤
│  [Today's Jobs] [Upcoming] [Completed]     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ John D  [NJ]  [Confirmed]            │ │
│  │ 123 Main St, Newark, NJ               │ │
│  │                                         │ │
│  │ Date & Time: Dec 26, 2024 • 10:00 AM  │ │
│  │ Service: Basic Clean                   │ │
│  │                                         │ │
│  │ Special Instructions:                 │ │
│  │ Please use eco-friendly products      │ │
│  │                                         │ │
│  │ Customer Phone: +19731234567          │ │
│  │ Total: $120.00                         │ │
│  │                                         │ │
│  │ [Mark as On The Way] [Mark Completed] │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### Dashboard - Completed Jobs

```
┌─────────────────────────────────────────────┐
│  Welcome, John Cleaner  [NJ]  [Logout]      │
├─────────────────────────────────────────────┤
│  [Today's Jobs] [Upcoming] [Completed]     │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Bob T  [NJ]  [Completed]             │ │
│  │ 789 Pine St, Jersey City, NJ          │ │
│  │                                         │ │
│  │ Date & Time: Dec 25, 2024 • 9:00 AM  │ │
│  │ Service: Move In/Out Clean            │ │
│  │                                         │ │
│  │ Customer Phone: +19739876543          │ │
│  │ Total: $250.00                         │ │
│  │                                         │ │
│  │ [✓ Completed]                         │ │
│  └───────────────────────────────────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

## Status Transitions

### Valid Transitions

```
confirmed → on_the_way → completed
assigned → on_the_way → completed
on_the_way → completed
```

### Invalid Transitions

```
completed → on_the_way (cannot revert)
cancelled → any (cancelled is final)
pending → completed (must go through confirmed/on_the_way)
```

## Testing Scenarios

### Scenario 1: Login and View Today's Jobs

1. Navigate to `/cleaners/login`
2. Enter phone: `+19735556677`
3. Click "Login"
4. Should redirect to dashboard
5. Should see "Today's Jobs" tab active
6. Should see jobs scheduled for today

### Scenario 2: Update Job Status

1. Login as cleaner
2. Find a job with status "confirmed"
3. Click "Mark as On The Way"
4. Status should update to "on_the_way"
5. Button should change to "Mark as Completed"
6. Click "Mark as Completed"
7. Status should update to "completed"
8. Job should move to "Completed" tab

### Scenario 3: View Upcoming Jobs

1. Login as cleaner
2. Click "Upcoming" tab
3. Should see all future jobs (not completed/cancelled)
4. Jobs should be sorted by date/time

### Scenario 4: View Completed Jobs

1. Login as cleaner
2. Click "Completed" tab
3. Should see all completed/cancelled jobs
4. Jobs should be sorted by date (newest first)

### Scenario 5: Unauthorized Access

1. Try to access `/cleaners/dashboard` without login
2. Should redirect to `/cleaners/login`
3. Try to update job that doesn't belong to cleaner
4. Should return 403 error

## WhatsApp Deep Link Example

```typescript
// In JobCard component, add button:
const whatsappLink = `https://wa.me/${job.phone}?text=${encodeURIComponent(
  `Hi ${job.customerName}, this is your VelocityMaid cleaner. I'm on my way to your location at ${job.address}.`
)}`;

<a href={whatsappLink} target="_blank" rel="noopener noreferrer">
  Message Customer
</a>
```

## Push Notification Example

```typescript
// When new job assigned
const notification = {
  title: 'New Job Assigned',
  body: `You have a new ${job.serviceType} at ${job.address} on ${job.preferredDate}`,
  data: {
    jobId: job.id,
    type: 'new_job',
  },
};

// Send via Firebase Cloud Messaging or similar
await sendNotification(cleaner.deviceToken, notification);
```




