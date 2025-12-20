# Email Templates Preview - VelocityMaid

**Date:** December 2024  
**Status:** Ready for Implementation

This document shows preview examples of all email templates with the new `serviceLocation` field included.

---

## 📧 Email Template Overview

All email templates have been updated to include the `serviceLocation` field in a professional format. The templates support both HTML and plain text versions.

### Location Formatting

The templates automatically format location values:
- `"new_jersey"` or `"New Jersey"` → **"New Jersey"**
- `"vermont"` or `"Vermont"` → **"Vermont"**

---

## 1. Customer Confirmation Email

### HTML Version Preview

**Subject:** `Booking Confirmation - VelocityMaid`

**Key Features:**
- ✅ Client Name
- ✅ Service Type
- ✅ Service Date (formatted)
- ✅ Service Time
- ✅ **Service Location** (NEW - prominently displayed)
- ✅ Total Price
- ✅ Clean Address
- ✅ Add-ons (if any)
- ✅ Special Instructions (if any)

**Location Display:**
```html
<p><strong>Service Location:</strong> New Jersey</p>
```

**Example Output:**
```
Hello John D,

Thank you for booking with VelocityMaid! Your cleaning service has been confirmed.

SERVICE DETAILS
---------------
Client Name: John D
Service Type: Basic Clean
Service Date: Monday, December 25, 2024
Service Time: 10:00 AM
Service Location: New Jersey
Address: 123 Main Street, Newark, NJ 07102
Total Price: $120.00
Add-ons: Laundry Service, Interior Windows Cleaning

Special Instructions: Please use eco-friendly products

WHAT'S NEXT?
-----------
- Our team will contact you within 24 hours to confirm your appointment
- If you have any questions, call us at (802) 733-5348
- You can also email us at hello@velocitymaid.com

We look forward to serving you!

Best regards,
The VelocityMaid Team
```

---

## 2. Cleaner Assignment Email

### HTML Version Preview

**Subject:** `New Cleaning Assignment - [Date]`

**Key Features:**
- ✅ Customer Name
- ✅ Phone Number
- ✅ Email Address
- ✅ **Assigned Location** (NEW - prominently displayed)
- ✅ Address
- ✅ Date & Time
- ✅ Service Type
- ✅ Total Price
- ✅ Add-ons (if any)
- ✅ Special Instructions (if any)

**Location Display:**
```html
<p><strong>Assigned Location:</strong> Vermont</p>
```

**Example Output:**
```
Hi Team,

You have a new cleaning assignment scheduled.

ASSIGNMENT DETAILS
------------------
Customer: Jane S
Phone: +1234567890
Email: jane@example.com
Assigned Location: Vermont
Address: 456 Oak Avenue, Ludlow, VT 05149
Date: Tuesday, December 26, 2024
Time: 2:00 PM
Service: Deep Clean
Total Price: $220.00
Add-ons: Inside Oven Cleaning

Special Instructions: Focus on kitchen and bathrooms

ACTION REQUIRED
--------------
Please confirm receipt of this assignment and prepare accordingly.

Thanks!

The VelocityMaid Team
```

---

## 3. Admin Alert Email

### HTML Version Preview

**Subject:** `New Booking Alert - [Location]`

**Key Features:**
- ✅ Customer Name
- ✅ Email Address
- ✅ Phone Number
- ✅ **Location** (NEW - prominently displayed)
- ✅ Service Type
- ✅ Date & Time
- ✅ Address
- ✅ Total Price
- ✅ Add-ons (if any)
- ✅ Special Instructions (if any)

**Location Display:**
```html
<p><strong>Location:</strong> New Jersey</p>
```

**Example Output:**
```
Admin Alert:

A new booking has been received and requires your attention.

BOOKING INFORMATION
-------------------
Customer: Mike T
Email: mike@example.com
Phone: +1987654321
Location: New Jersey
Service: Move In/Out Clean
Date: Wednesday, December 27, 2024
Time: 9:00 AM
Address: 789 Pine Street, Jersey City, NJ 07302
Total Price: $320.00
Add-ons: Laundry Service, Interior Windows Cleaning, Inside Refrigerator Cleaning

Special Instructions: First-time customer, please be extra thorough

NEXT STEPS
----------
- Review booking details in admin dashboard
- Assign cleaner if needed
- Verify customer contact information
- Confirm service location and availability

View full details in your admin dashboard or Google Sheets.
```

---

## 📋 Template Usage

### Import and Use

```typescript
import {
  getCustomerConfirmationEmailHTML,
  getCustomerConfirmationEmailText,
  getCleanerAssignmentEmailHTML,
  getCleanerAssignmentEmailText,
  getAdminAlertEmailHTML,
  getAdminAlertEmailText,
  type BookingData,
} from '@/lib/emailTemplates';

// Example booking data
const bookingData: BookingData = {
  firstName: 'John',
  lastInitial: 'D',
  phone: '+1234567890',
  email: 'john@example.com',
  address: '123 Main Street, Newark, NJ 07102',
  serviceType: 'basic',
  preferredDate: '2024-12-25',
  preferredTime: '10:00 AM',
  serviceLocation: 'New Jersey', // or 'new_jersey' - both work
  addOns: ['laundry', 'windows'],
  specialInstructions: 'Please use eco-friendly products',
  totalPrice: 120,
};

// Generate HTML email
const htmlEmail = getCustomerConfirmationEmailHTML(bookingData);

// Generate plain text email
const textEmail = getCustomerConfirmationEmailText(bookingData);
```

---

## ✅ Verification Checklist

### Customer Confirmation Email
- [x] Includes client name
- [x] Includes service type
- [x] Includes service date (formatted)
- [x] Includes service time
- [x] **Includes Service Location (NEW)**
- [x] Includes total price
- [x] Includes clean address
- [x] Includes add-ons (if any)
- [x] Includes special instructions (if any)
- [x] Professional formatting
- [x] Clear call-to-action

### Cleaner Assignment Email
- [x] Includes customer name
- [x] Includes phone number
- [x] Includes email address
- [x] **Includes Assigned Location (NEW)**
- [x] Includes address
- [x] Includes date & time
- [x] Includes service type
- [x] Includes total price
- [x] Includes add-ons (if any)
- [x] Includes special instructions (if any)
- [x] Professional formatting
- [x] Clear action required

### Admin Alert Email
- [x] Includes customer name
- [x] Includes email address
- [x] Includes phone number
- [x] **Includes Location (NEW)**
- [x] Includes service type
- [x] Includes date & time
- [x] Includes address
- [x] Includes total price
- [x] Includes add-ons (if any)
- [x] Includes special instructions (if any)
- [x] Professional formatting
- [x] Clear next steps

---

## 🎨 Design Features

### HTML Email Design
- **Responsive layout** - Works on desktop and mobile
- **Professional color scheme** - Brand colors (blue, orange, red)
- **Clear visual hierarchy** - Important information stands out
- **Accessible** - Proper HTML structure and alt text
- **Branded header** - Gradient background with VelocityMaid branding
- **Organized sections** - Color-coded information blocks
- **Call-to-action** - Clear next steps for recipients

### Plain Text Email Design
- **Structured format** - Easy to read and scan
- **Clear sections** - Separated with headers and dividers
- **Complete information** - All details included
- **Professional tone** - Friendly but business-appropriate

---

## 🔧 Integration Notes

### Current Implementation Status

**Note:** The VelocityMaid project currently uses **Zapier** for email sending. These templates are ready to use if you want to add direct email sending from the backend.

### To Use These Templates:

1. **Install an email service** (SendGrid, Resend, Nodemailer, etc.)
2. **Import the templates** in your API route
3. **Call the template functions** with booking data
4. **Send the emails** using your email service

### Example Integration:

```typescript
// In app/api/checkout/route.ts or app/api/webhooks/stripe/route.ts
import { getCustomerConfirmationEmailHTML } from '@/lib/emailTemplates';

// After successful booking
const emailHTML = getCustomerConfirmationEmailHTML({
  firstName,
  lastInitial,
  phone,
  email,
  address,
  serviceType,
  preferredDate,
  preferredTime,
  serviceLocation, // Already included in checkout route
  addOns,
  specialInstructions,
  totalPrice,
});

// Send email using your email service
await sendEmail({
  to: email,
  subject: 'Booking Confirmation - VelocityMaid',
  html: emailHTML,
});
```

---

## 📝 Field Requirements

All templates require the following fields in `BookingData`:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `firstName` | string | ✅ | Customer first name |
| `lastInitial` | string | ❌ | Customer last initial (optional) |
| `phone` | string | ✅ | Customer phone number |
| `email` | string | ✅ | Customer email address |
| `address` | string | ✅ | Service address |
| `serviceType` | string | ✅ | Service type: 'basic', 'deep', or 'moveInOut' |
| `preferredDate` | string | ✅ | Preferred date (YYYY-MM-DD format) |
| `preferredTime` | string | ✅ | Preferred time |
| `serviceLocation` | string | ❌ | Service location: 'new_jersey', 'vermont', 'New Jersey', or 'Vermont' |
| `addOns` | array/object | ❌ | Selected add-ons |
| `specialInstructions` | string | ❌ | Special instructions |
| `totalPrice` | number | ✅ | Total booking price |

---

## ✨ Key Improvements

1. **Service Location Field Added** ✅
   - Prominently displayed in all templates
   - Automatically formatted (handles both raw and display values)
   - Positioned logically in the information hierarchy

2. **Professional Formatting** ✅
   - Clean, modern HTML design
   - Responsive layout
   - Brand-consistent colors
   - Clear visual hierarchy

3. **Complete Information** ✅
   - All required fields included
   - Optional fields handled gracefully
   - Formatted dates and prices
   - Clear section organization

4. **Accessibility** ✅
   - Plain text versions available
   - Semantic HTML structure
   - Proper email client compatibility

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Implementation




