# Multi-Branch Routing - Example Payloads and Logs

## Example 1: New Jersey Booking

### Booking Data
```json
{
  "serviceLocation": "new_jersey",
  "customerName": "John D",
  "customerPhone": "+19731234567",
  "serviceType": "basic",
  "preferredDate": "2024-12-26",
  "preferredTime": "10:00 AM",
  "address": "123 Main Street, Newark, NJ 07102",
  "totalPrice": 120
}
```

### Admin Notification
**Target Admin:** `ADMIN_WHATSAPP_NJ` (e.g., `+19739876543`)

**WhatsApp Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "+19739876543",
  "type": "template",
  "template": {
    "name": "admin_notify_v3",
    "language": { "code": "en_US" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "John D" },
        { "type": "text", "text": "Basic Clean" },
        { "type": "text", "text": "$120.00" },
        { "type": "text", "text": "123 Main Street, Newark, NJ 07102" },
        { "type": "text", "text": "2024-12-26" }
      ]
    }]
  }
}
```

**Expected Logs:**
```
Admin notification sent successfully [New Jersey]: {
  messageId: "wamid.ABC123",
  customerName: "John D",
  serviceType: "Basic Clean",
  paymentAmount: "$120.00",
  region: "New Jersey",
  adminPhone: "+19739876543"
}
```

### Cleaner Assignment
**Assigned Cleaner:** `+19735556677` (must be in `CLEANER_TEAM_NJ`)

**WhatsApp Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "+19735556677",
  "type": "template",
  "template": {
    "name": "cleaner_job_v3",
    "language": { "code": "en_US" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "John D" },
        { "type": "text", "text": "Basic Clean" },
        { "type": "text", "text": "2024-12-26" },
        { "type": "text", "text": "Morning" },
        { "type": "text", "text": "123 Main Street, Newark, NJ 07102" }
      ]
    }]
  }
}
```

**Expected Logs:**
```
Region validation passed: Cleaner +19735556677 is valid for New Jersey
Cleaner notified [New Jersey]: John Cleaner +19735556677
Cleaner assignment sent successfully: {
  messageId: "wamid.XYZ789",
  cleanerName: "John Cleaner",
  cleanerPhone: "+19735556677",
  customerName: "John D",
  serviceType: "Basic Clean",
  scheduledDate: "2024-12-26",
  region: "New Jersey"
}
```

**API Response:**
```json
{
  "success": true,
  "message": "Cleaner assigned successfully",
  "cleanerAlertSent": true,
  "messageId": "wamid.XYZ789",
  "booking": {
    "customerName": "John D",
    "serviceType": "Basic Clean",
    "scheduledDate": "2024-12-26",
    "timeSlot": "Morning",
    "address": "123 Main Street, Newark, NJ 07102",
    "serviceLocation": "new_jersey",
    "region": "New Jersey"
  }
}
```

---

## Example 2: Vermont Booking

### Booking Data
```json
{
  "serviceLocation": "vermont",
  "customerName": "Jane S",
  "customerPhone": "+18021234567",
  "serviceType": "deep",
  "preferredDate": "2024-12-27",
  "preferredTime": "2:00 PM",
  "address": "456 Oak Avenue, Burlington, VT 05401",
  "totalPrice": 180
}
```

### Admin Notification
**Target Admin:** `ADMIN_WHATSAPP_VT` (e.g., `+18029876543`)

**WhatsApp Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "+18029876543",
  "type": "template",
  "template": {
    "name": "admin_notify_v3",
    "language": { "code": "en_US" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "Jane S" },
        { "type": "text", "text": "Deep Clean" },
        { "type": "text", "text": "$180.00" },
        { "type": "text", "text": "456 Oak Avenue, Burlington, VT 05401" },
        { "type": "text", "text": "2024-12-27" }
      ]
    }]
  }
}
```

**Expected Logs:**
```
Admin notification sent successfully [Vermont]: {
  messageId: "wamid.DEF456",
  customerName: "Jane S",
  serviceType: "Deep Clean",
  paymentAmount: "$180.00",
  region: "Vermont",
  adminPhone: "+18029876543"
}
```

### Cleaner Assignment
**Assigned Cleaner:** `+18025556677` (must be in `CLEANER_TEAM_VT`)

**WhatsApp Payload:**
```json
{
  "messaging_product": "whatsapp",
  "to": "+18025556677",
  "type": "template",
  "template": {
    "name": "cleaner_job_v3",
    "language": { "code": "en_US" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "Jane S" },
        { "type": "text", "text": "Deep Clean" },
        { "type": "text", "text": "2024-12-27" },
        { "type": "text", "text": "Afternoon" },
        { "type": "text", "text": "456 Oak Avenue, Burlington, VT 05401" }
      ]
    }]
  }
}
```

**Expected Logs:**
```
Region validation passed: Cleaner +18025556677 is valid for Vermont
Cleaner notified [Vermont]: Jane Cleaner +18025556677
Cleaner assignment sent successfully: {
  messageId: "wamid.UVW012",
  cleanerName: "Jane Cleaner",
  cleanerPhone: "+18025556677",
  customerName: "Jane S",
  serviceType: "Deep Clean",
  scheduledDate: "2024-12-27",
  region: "Vermont"
}
```

**API Response:**
```json
{
  "success": true,
  "message": "Cleaner assigned successfully",
  "cleanerAlertSent": true,
  "messageId": "wamid.UVW012",
  "booking": {
    "customerName": "Jane S",
    "serviceType": "Deep Clean",
    "scheduledDate": "2024-12-27",
    "timeSlot": "Afternoon",
    "address": "456 Oak Avenue, Burlington, VT 05401",
    "serviceLocation": "vermont",
    "region": "Vermont"
  }
}
```

---

## Example 3: Region Validation Error

### Attempted Assignment (VT Cleaner to NJ Booking)
```json
{
  "sessionId": "cs_test_abc123",
  "cleaner": {
    "phone": "+18025556677",
    "name": "Vermont Cleaner"
  }
}
```

**Booking Metadata:**
- `serviceLocation: "new_jersey"`
- `customerName: "John D"`

**API Response (Error):**
```json
{
  "success": false,
  "error": "Cleaner is not part of this service region (New Jersey). Please assign a cleaner from the New Jersey team.",
  "serviceLocation": "new_jersey",
  "region": "New Jersey"
}
```

**Expected Logs:**
```
REGION VALIDATION FAILED: Cleaner is not part of this service region (New Jersey). Please assign a cleaner from the New Jersey team.
```

---

## Example 4: Bulk Cleaner Notification

### Sending to All Cleaners in Region
```typescript
import { sendCleanerAssignmentToRegion } from '@/lib/sendCleanerAssignment';

const booking = {
  customerName: "John D",
  serviceType: "basic",
  preferredDate: "2024-12-26",
  preferredTime: "10:00 AM",
  address: "123 Main St",
  serviceLocation: "new_jersey"
};

const result = await sendCleanerAssignmentToRegion(
  whatsappPhoneNumberId,
  whatsappToken,
  booking
);
```

**Expected Result:**
```json
{
  "success": true,
  "totalSent": 3,
  "totalFailed": 0,
  "results": [
    {
      "cleanerPhone": "+19731111111",
      "success": true,
      "messageId": "wamid.001"
    },
    {
      "cleanerPhone": "+19732222222",
      "success": true,
      "messageId": "wamid.002"
    },
    {
      "cleanerPhone": "+19733333333",
      "success": true,
      "messageId": "wamid.003"
    }
  ]
}
```

**Expected Logs:**
```
Sending assignment to 3 cleaner(s) in New Jersey
Cleaner notified [New Jersey]: Cleaner +19731111111
Cleaner notified [New Jersey]: Cleaner +19732222222
Cleaner notified [New Jersey]: Cleaner +19733333333
Bulk assignment completed [New Jersey]: 3 sent, 0 failed
```

---

## Testing Commands

### Test Admin Notification (NJ)
```bash
curl -X POST http://localhost:3000/api/test/send-admin-notification \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John D",
    "serviceType": "basic",
    "totalPrice": 120,
    "address": "123 Main St",
    "preferredDate": "2024-12-26",
    "serviceLocation": "new_jersey"
  }'
```

### Test Admin Notification (VT)
```bash
curl -X POST http://localhost:3000/api/test/send-admin-notification \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Jane S",
    "serviceType": "deep",
    "totalPrice": 180,
    "address": "456 Oak Ave",
    "preferredDate": "2024-12-27",
    "serviceLocation": "vermont"
  }'
```

### Test Cleaner Assignment (with Region Validation)
```bash
curl -X POST http://localhost:3000/api/bookings/assign-cleaner \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "cs_test_abc123",
    "cleaner": {
      "phone": "+19735556677",
      "name": "John Cleaner"
    }
  }'
```

Note: The `sessionId` must exist in Stripe and have `serviceLocation` in metadata.




