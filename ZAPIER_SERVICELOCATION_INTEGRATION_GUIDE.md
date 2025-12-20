# Zapier Integration Guide: serviceLocation Field

**Date:** December 2024  
**Purpose:** Complete mapping and setup instructions for the new `serviceLocation` field in VelocityMaid Zapier workflows

---

## 📋 TABLE OF CONTENTS

1. [JSON Payload Example](#1-json-payload-example)
2. [Field Mapping Guide](#2-field-mapping-guide)
3. [Formatted Values Reference](#3-formatted-values-reference)
4. [Zapier Testing Checklist](#4-zapier-testing-checklist)
5. [Example Text Blocks](#5-example-text-blocks)
6. [Human Steps for Zapier Setup](#6-human-steps-for-zapier-setup)

---

## 1. JSON PAYLOAD EXAMPLE

### Complete Zapier Webhook Payload

When a booking is submitted through the VelocityMaid booking form, Zapier will receive the following JSON payload:

```json
{
  "name": "John D",
  "email": "customer@example.com",
  "phone": "+1234567890",
  "service": "basic",
  "date": "2024-12-25",
  "time": "10:00 AM",
  "address": "123 Main Street, Newark, NJ 07102",
  "serviceLocation": "New Jersey",
  "message": "Please use eco-friendly products",
  "totalPrice": 120,
  "addOns": ["laundry", "windows"]
}
```

### Field Details

| Field Name | Type | Example Value | Description |
|------------|------|---------------|-------------|
| `name` | string | "John D" | Customer full name (firstName + lastInitial) |
| `email` | string | "customer@example.com" | Customer email address |
| `phone` | string | "+1234567890" | Customer phone number |
| `service` | string | "basic" | Service type: "basic", "deep", or "moveInOut" |
| `date` | string | "2024-12-25" | Preferred service date (YYYY-MM-DD) |
| `time` | string | "10:00 AM" | Preferred service time |
| `address` | string | "123 Main Street..." | Full service address |
| **`serviceLocation`** | **string** | **"New Jersey"** or **"Vermont"** | **Service location (display name)** |
| `message` | string | "Please use..." | Special instructions (may be empty) |
| `totalPrice` | number | 120 | Total booking price in USD |
| `addOns` | array | ["laundry", "windows"] | Array of selected add-ons (may be empty) |

### Important Notes

- **`serviceLocation` is sent as a display name**: "New Jersey" or "Vermont" (not "new_jersey" or "vermont")
- The field is **always present** in the payload (defaults to "New Jersey" if not provided)
- The value is **case-sensitive** and uses proper capitalization

---

## 2. FIELD MAPPING GUIDE

### Where to Find `serviceLocation` in Zapier

1. **Trigger Step (Webhook by Zapier)**
   - Field appears as: `serviceLocation`
   - Data Type: Text/String
   - Location: In the webhook payload data

2. **Action Steps**
   - Available in all action steps that support dynamic data
   - Use the Zapier data picker to select: `serviceLocation`

---

### A) Google Sheets Row Mapping

**Step Type:** Google Sheets - Create Spreadsheet Row

**Mapping Instructions:**

1. In your Google Sheets action step, click on the **"Location"** column field
2. Click the **data picker icon** (or type `{{` to open the data picker)
3. Select: **`serviceLocation`** from the trigger data
4. The field will appear as: `{{serviceLocation}}`

**Example Column Setup:**

| Column Name | Mapped Field | Example Value |
|-------------|--------------|---------------|
| Name | `{{name}}` | John D |
| Email | `{{email}}` | customer@example.com |
| Phone | `{{phone}}` | +1234567890 |
| Service | `{{service}}` | basic |
| Date | `{{date}}` | 2024-12-25 |
| Time | `{{time}}` | 10:00 AM |
| Address | `{{address}}` | 123 Main Street... |
| **Location** | **`{{serviceLocation}}`** | **New Jersey** |
| Total Price | `{{totalPrice}}` | 120 |
| Add-ons | `{{addOns}}` | laundry, windows |
| Notes | `{{message}}` | Please use eco-friendly... |

**Google Sheets Setup Steps:**

1. Open your Google Sheet
2. Add a new column header: **"Location"** (or "Service Location")
3. In Zapier, map the `serviceLocation` field to this column
4. Test the action to verify data appears correctly

---

### B) Customer Confirmation Email

**Step Type:** Gmail - Send Email (or Email by Zapier)

**Mapping Instructions:**

1. In the email body field, add the following text:
   ```
   Service Location: {{serviceLocation}}
   ```

2. Or use in a formatted email template:
   ```
   Dear {{name}},
   
   Thank you for booking with VelocityMaid!
   
   Service Details:
   - Service Type: {{service}}
   - Date: {{date}}
   - Time: {{time}}
   - Service Location: {{serviceLocation}}
   - Address: {{address}}
   
   We look forward to serving you!
   ```

**Full Email Template Example:**

```
Subject: Booking Confirmation - VelocityMaid

Hello {{name}},

Your cleaning service has been confirmed!

📅 Date: {{date}}
⏰ Time: {{time}}
📍 Service Location: {{serviceLocation}}
🏠 Address: {{address}}
🧹 Service: {{service}}
💰 Total: ${{totalPrice}}

{{#if message}}
Special Instructions: {{message}}
{{/if}}

We'll see you soon!

Best regards,
VelocityMaid Team
```

---

### C) Cleaner Assignment Email

**Step Type:** Gmail - Send Email (or Email by Zapier)

**Mapping Instructions:**

1. In the email body, include:
   ```
   Assigned Location: {{serviceLocation}}
   ```

**Full Email Template Example:**

```
Subject: New Cleaning Assignment - {{date}}

Hi Team,

You have a new cleaning assignment:

👤 Customer: {{name}}
📞 Phone: {{phone}}
📧 Email: {{email}}
📍 Assigned Location: {{serviceLocation}}
🏠 Address: {{address}}
📅 Date: {{date}}
⏰ Time: {{time}}
🧹 Service: {{service}}

{{#if addOns}}
Add-ons: {{addOns}}
{{/if}}

{{#if message}}
Special Instructions: {{message}}
{{/if}}

Please confirm receipt.

Thanks!
```

---

### D) Admin Notification Email

**Step Type:** Gmail - Send Email (or Email by Zapier)

**Mapping Instructions:**

1. In the email body, include:
   ```
   Location: {{serviceLocation}}
   ```

**Full Email Template Example:**

```
Subject: New Booking Alert - {{serviceLocation}}

Admin Alert:

A new booking has been received:

Customer: {{name}}
Email: {{email}}
Phone: {{phone}}
Location: {{serviceLocation}}
Service: {{service}}
Date: {{date}}
Time: {{time}}
Address: {{address}}
Total: ${{totalPrice}}

{{#if addOns}}
Add-ons: {{addOns}}
{{/if}}

View full details in Google Sheets.
```

---

### E) WhatsApp Messages

**Step Type:** WhatsApp Cloud API (or HTTP Request)

#### E1) WhatsApp - Owner/Admin Message

**HTTP Request Configuration:**

- **Method:** POST
- **URL:** `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`
- **Headers:**
  ```
  Authorization: Bearer {ACCESS_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "messaging_product": "whatsapp",
    "to": "{OWNER_PHONE_NUMBER}",
    "type": "template",
    "template": {
      "name": "booking_notification",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": "{{name}}"
            },
            {
              "type": "text",
              "text": "{{service}}"
            },
            {
              "type": "text",
              "text": "{{date}}"
            },
            {
              "type": "text",
              "text": "{{time}}"
            },
            {
              "type": "text",
              "text": "{{address}}"
            },
            {
              "type": "text",
              "text": "{{serviceLocation}}"
            }
          ]
        }
      ]
    }
  }
  ```

**Template Parameter Mapping:**

| Parameter Number | Field | Example |
|-----------------|-------|---------|
| {{1}} | `{{name}}` | John D |
| {{2}} | `{{service}}` | basic |
| {{3}} | `{{date}}` | 2024-12-25 |
| {{4}} | `{{time}}` | 10:00 AM |
| {{5}} | `{{address}}` | 123 Main Street... |
| **{{6}}** | **`{{serviceLocation}}`** | **New Jersey** |

**WhatsApp Template Example:**

```
New Booking Alert!

Customer: {{1}}
Service: {{2}}
Date: {{3}}
Time: {{4}}
Address: {{5}}
Location: {{6}}

Please review in admin dashboard.
```

---

#### E2) WhatsApp - Cleaner Assignment Message

**HTTP Request Configuration:**

- **Method:** POST
- **URL:** `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`
- **Headers:**
  ```
  Authorization: Bearer {ACCESS_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "messaging_product": "whatsapp",
    "to": "{CLEANER_PHONE_NUMBER}",
    "type": "template",
    "template": {
      "name": "cleaner_assignment",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": "{{name}}"
            },
            {
              "type": "text",
              "text": "{{serviceLocation}}"
            },
            {
              "type": "text",
              "text": "{{address}}"
            },
            {
              "type": "text",
              "text": "{{date}}"
            },
            {
              "type": "text",
              "text": "{{time}}"
            }
          ]
        }
      ]
    }
  }
  ```

**Template Parameter Mapping:**

| Parameter Number | Field | Example |
|-----------------|-------|---------|
| {{1}} | `{{name}}` | John D |
| **{{2}}** | **`{{serviceLocation}}`** | **New Jersey** |
| {{3}} | `{{address}}` | 123 Main Street... |
| {{4}} | `{{date}}` | 2024-12-25 |
| {{5}} | `{{time}}` | 10:00 AM |

**WhatsApp Template Example:**

```
New Assignment

Customer: {{1}}
Location: {{2}}
Address: {{3}}
Date: {{4}}
Time: {{5}}

Please confirm receipt.
```

---

#### E3) WhatsApp - Customer Confirmation Message

**HTTP Request Configuration:**

- **Method:** POST
- **URL:** `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`
- **Headers:**
  ```
  Authorization: Bearer {ACCESS_TOKEN}
  Content-Type: application/json
  ```
- **Body (JSON):**
  ```json
  {
    "messaging_product": "whatsapp",
    "to": "{{phone}}",
    "type": "template",
    "template": {
      "name": "booking_confirmation",
      "language": {
        "code": "en"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": "{{name}}"
            },
            {
              "type": "text",
              "text": "{{service}}"
            },
            {
              "type": "text",
              "text": "{{date}}"
            },
            {
              "type": "text",
              "text": "{{time}}"
            },
            {
              "type": "text",
              "text": "{{serviceLocation}}"
            },
            {
              "type": "text",
              "text": "{{address}}"
            }
          ]
        }
      ]
    }
  }
  ```

**Template Parameter Mapping:**

| Parameter Number | Field | Example |
|-----------------|-------|---------|
| {{1}} | `{{name}}` | John D |
| {{2}} | `{{service}}` | basic |
| {{3}} | `{{date}}` | 2024-12-25 |
| {{4}} | `{{time}}` | 10:00 AM |
| **{{5}}** | **`{{serviceLocation}}`** | **New Jersey** |
| {{6}} | `{{address}}` | 123 Main Street... |

**WhatsApp Template Example:**

```
Hello {{1}},

Your booking is confirmed!

Service: {{2}}
Date: {{3}}
Time: {{4}}
Location: {{5}}
Address: {{6}}

We'll see you soon!
VelocityMaid
```

---

## 3. FORMATTED VALUES REFERENCE

### Value Formatting Rules

The `serviceLocation` field is sent to Zapier as a **display name** (already formatted):

| Raw Value (Internal) | Display Name (Zapier Receives) |
|---------------------|--------------------------------|
| `new_jersey` | `"New Jersey"` |
| `vermont` | `"Vermont"` |

### Important Notes

- **Zapier receives the formatted display name directly** ("New Jersey" or "Vermont")
- **No transformation needed** in most cases - use the field as-is
- If you need to convert back to raw values for filtering/conditions, use Zapier's Formatter or Filter steps

### Conditional Logic (If Needed)

If you need to perform conditional actions based on location:

**Option 1: Filter by Zapier**
- Create a Filter step
- Condition: `serviceLocation` equals "New Jersey" (or "Vermont")
- Route to different actions based on location

**Option 2: Paths by Zapier**
- Use Paths to create separate workflows for each location
- Condition: `serviceLocation` equals "New Jersey" or "Vermont"

---

## 4. ZAPIER TESTING CHECKLIST

### Pre-Testing Setup

- [ ] Ensure your Zap is in **"Draft"** mode (not published)
- [ ] Have access to a test booking form or ability to trigger the webhook
- [ ] Have your Google Sheet, email accounts, and WhatsApp templates ready

---

### Step 1: Test the Webhook Trigger

**Where to Click:**
1. Open your Zap in Zapier
2. Click on the **"Webhook by Zapier"** trigger step
3. Click the **"Test trigger"** button (or "Test" button)

**What to Look For:**
- The test should complete successfully
- You should see sample data appear in the trigger output

**Expected Output:**
```json
{
  "name": "John D",
  "email": "customer@example.com",
  "phone": "+1234567890",
  "service": "basic",
  "date": "2024-12-25",
  "time": "10:00 AM",
  "address": "123 Main Street, Newark, NJ 07102",
  "serviceLocation": "New Jersey",
  "message": "Please use eco-friendly products",
  "totalPrice": 120,
  "addOns": ["laundry", "windows"]
}
```

**Verification Checklist:**
- [ ] `serviceLocation` field appears in the trigger data
- [ ] Value is either `"New Jersey"` or `"Vermont"` (not "new_jersey" or "vermont")
- [ ] Field is accessible in the data picker for mapping

**If `serviceLocation` is NOT appearing:**
1. Check that the VelocityMaid API is sending the field (verify `/api/checkout` route)
2. Ensure the webhook URL is correct
3. Try submitting a new test booking through the booking form
4. Check Zapier webhook logs for incoming payloads
5. Verify the field name is exactly `serviceLocation` (case-sensitive)

---

### Step 2: Test Google Sheets Action

**Where to Click:**
1. Click on your **"Google Sheets"** action step
2. Click **"Test & Review"** or **"Test action"**

**What to Look For:**
- Action should complete successfully
- New row should appear in your Google Sheet

**Verification Checklist:**
- [ ] New row created in Google Sheet
- [ ] "Location" column contains the correct value ("New Jersey" or "Vermont")
- [ ] Value matches what was in the trigger data
- [ ] No errors in the action step

**If Location is NOT appearing in Google Sheets:**
1. Verify the column mapping: Click the "Location" field in Zapier
2. Ensure you selected `{{serviceLocation}}` from the data picker
3. Check that the Google Sheet has a "Location" column header
4. Re-test the action step

---

### Step 3: Test Email Actions

**Where to Click:**
1. Click on each **"Gmail"** or **"Email"** action step
2. Click **"Test & Review"** or **"Test action"**

**What to Look For:**
- Email should be sent successfully
- Email should contain the location information

**Verification Checklist:**
- [ ] Customer confirmation email received
- [ ] Email contains: "Service Location: New Jersey" (or Vermont)
- [ ] Cleaner assignment email received (if applicable)
- [ ] Admin notification email received (if applicable)
- [ ] All emails display the correct location value

**If Location is NOT appearing in emails:**
1. Check the email body template
2. Verify you used `{{serviceLocation}}` (with double curly braces)
3. Ensure the field is mapped correctly in the email body
4. Check for typos in the field name

---

### Step 4: Test WhatsApp Actions

**Where to Click:**
1. Click on your **"WhatsApp"** or **"HTTP Request"** action step
2. Click **"Test & Review"** or **"Test action"**

**What to Look For:**
- WhatsApp message should be sent successfully
- Message should contain the location information

**Verification Checklist:**
- [ ] Owner/Admin WhatsApp message received
- [ ] Message contains location in the correct parameter position ({{6}} or {{2}} or {{5}})
- [ ] Cleaner WhatsApp message received (if applicable)
- [ ] Customer WhatsApp message received (if applicable)
- [ ] All messages display the correct location value

**If Location is NOT appearing in WhatsApp:**
1. Verify the JSON body structure in the HTTP Request step
2. Check that `{{serviceLocation}}` is mapped to the correct parameter position
3. Ensure your WhatsApp template has the location parameter defined
4. Verify the template parameter numbers match your JSON body
5. Check WhatsApp Business API logs for errors

---

### Step 5: Full End-to-End Test

**Test Scenario:**
1. Submit a test booking through the VelocityMaid booking form
2. Select "New Jersey" as the service location
3. Complete the booking process
4. Monitor all Zapier actions

**Verification Checklist:**
- [ ] Webhook trigger fires successfully
- [ ] Google Sheets row created with "New Jersey" in Location column
- [ ] Customer email sent with "Service Location: New Jersey"
- [ ] Cleaner email sent with "Assigned Location: New Jersey"
- [ ] Admin email sent with "Location: New Jersey"
- [ ] All WhatsApp messages sent with correct location
- [ ] Repeat test with "Vermont" location
- [ ] All actions work correctly for both locations

---

## 5. EXAMPLE TEXT BLOCKS

### Customer Email Template

```
Subject: Booking Confirmation - VelocityMaid

Hello {{name}},

Your cleaning service has been confirmed!

Service Details:
- Service Type: {{service}}
- Date: {{date}}
- Time: {{time}}
- Service Location: {{serviceLocation}}
- Address: {{address}}
- Total: ${{totalPrice}}

{{#if message}}
Special Instructions: {{message}}
{{/if}}

We look forward to serving you!

Best regards,
VelocityMaid Team
```

---

### Cleaner Email Template

```
Subject: New Cleaning Assignment - {{date}}

Hi Team,

You have a new cleaning assignment:

Customer: {{name}}
Phone: {{phone}}
Email: {{email}}
Assigned Location: {{serviceLocation}}
Address: {{address}}
Date: {{date}}
Time: {{time}}
Service: {{service}}

{{#if addOns}}
Add-ons: {{addOns}}
{{/if}}

{{#if message}}
Special Instructions: {{message}}
{{/if}}

Please confirm receipt.

Thanks!
```

---

### Owner Admin Alert Template

```
Subject: New Booking Alert - {{serviceLocation}}

Admin Alert:

A new booking has been received:

Customer: {{name}}
Email: {{email}}
Phone: {{phone}}
Location: {{serviceLocation}}
Service: {{service}}
Date: {{date}}
Time: {{time}}
Address: {{address}}
Total: ${{totalPrice}}

{{#if addOns}}
Add-ons: {{addOns}}
{{/if}}

View full details in Google Sheets.
```

---

### Google Sheets Column Setup

**Column Headers (in order):**

1. Timestamp
2. Name
3. Email
4. Phone
5. Service
6. Date
7. Time
8. Address
9. **Location** ← New column for serviceLocation
10. Total Price
11. Add-ons
12. Special Instructions

**Zapier Mapping:**

| Column | Zapier Field |
|--------|--------------|
| Timestamp | (Auto-generated or `{{zap_meta_ts}}`) |
| Name | `{{name}}` |
| Email | `{{email}}` |
| Phone | `{{phone}}` |
| Service | `{{service}}` |
| Date | `{{date}}` |
| Time | `{{time}}` |
| Address | `{{address}}` |
| **Location** | **`{{serviceLocation}}`** |
| Total Price | `{{totalPrice}}` |
| Add-ons | `{{addOns}}` |
| Special Instructions | `{{message}}` |

---

### WhatsApp Template Examples

#### Owner/Admin WhatsApp Template

**Template Name:** `booking_notification`

**Template Body:**
```
New Booking Alert!

Customer: {{1}}
Service: {{2}}
Date: {{3}}
Time: {{4}}
Address: {{5}}
Location: {{6}}

Please review in admin dashboard.
```

**Parameter Mapping:**
- {{1}} = `{{name}}`
- {{2}} = `{{service}}`
- {{3}} = `{{date}}`
- {{4}} = `{{time}}`
- {{5}} = `{{address}}`
- **{{6}} = `{{serviceLocation}}`**

---

#### Cleaner Assignment WhatsApp Template

**Template Name:** `cleaner_assignment`

**Template Body:**
```
New Assignment

Customer: {{1}}
Location: {{2}}
Address: {{3}}
Date: {{4}}
Time: {{5}}

Please confirm receipt.
```

**Parameter Mapping:**
- {{1}} = `{{name}}`
- **{{2}} = `{{serviceLocation}}`**
- {{3}} = `{{address}}`
- {{4}} = `{{date}}`
- {{5}} = `{{time}}`

---

#### Customer Confirmation WhatsApp Template

**Template Name:** `booking_confirmation`

**Template Body:**
```
Hello {{1}},

Your booking is confirmed!

Service: {{2}}
Date: {{3}}
Time: {{4}}
Location: {{5}}
Address: {{6}}

We'll see you soon!
VelocityMaid
```

**Parameter Mapping:**
- {{1}} = `{{name}}`
- {{2}} = `{{service}}`
- {{3}} = `{{date}}`
- {{4}} = `{{time}}`
- **{{5}} = `{{serviceLocation}}`**
- {{6}} = `{{address}}`

---

## 6. HUMAN STEPS FOR ZAPIER SETUP

### Complete Setup Walkthrough

Follow these steps in order to configure your Zapier integration with the new `serviceLocation` field.

---

### **Step 1: Open Your Zap**

1. Log in to your Zapier account
2. Navigate to your VelocityMaid booking Zap
3. Click **"Edit Zap"** (or create a new Zap if starting fresh)
4. Ensure the Zap is in **"Draft"** mode (not published)

---

### **Step 2: Test the Webhook Trigger**

1. Click on the **"Webhook by Zapier"** trigger step
2. Click the **"Test trigger"** button (or "Test" button)
3. Wait for the test to complete
4. Review the sample data that appears

**What to Confirm:**
- ✅ The test completes successfully
- ✅ You can see sample booking data
- ✅ **The `serviceLocation` field appears in the data**
- ✅ The value is either `"New Jersey"` or `"Vermont"` (display name, not raw value)

**If `serviceLocation` is missing:**
- Check that your VelocityMaid API is updated and deployed
- Verify the webhook URL is correct
- Submit a test booking through the booking form
- Check Zapier webhook logs: Go to Zapier → Webhooks → Your webhook → View logs

---

### **Step 3: Map Field into Google Sheets**

1. Click on your **"Google Sheets - Create Spreadsheet Row"** action step
2. If you don't have a "Location" column yet:
   - Open your Google Sheet
   - Add a new column header: **"Location"** (or "Service Location")
   - Save the sheet
3. Back in Zapier, find the **"Location"** field in the action step
4. Click the field to open the data picker
5. Type `{{` or click the data picker icon
6. Select **`serviceLocation`** from the trigger data
7. The field should now show: `{{serviceLocation}}`
8. Click **"Continue"** or **"Test & Review"**

**Verification:**
- ✅ Click **"Test action"** to verify
- ✅ Check your Google Sheet - a new row should appear
- ✅ The "Location" column should contain "New Jersey" or "Vermont"

---

### **Step 4: Map Field into Gmail/Email Steps**

#### For Customer Confirmation Email:

1. Click on your **"Gmail - Send Email"** (or "Email by Zapier") action step for customer confirmation
2. In the **"Body"** field, add or update the text:
   ```
   Service Location: {{serviceLocation}}
   ```
3. Or use the full template from Section 5
4. Click **"Continue"** or **"Test & Review"**

#### For Cleaner Assignment Email:

1. Click on your **"Gmail - Send Email"** action step for cleaner assignment
2. In the **"Body"** field, add or update:
   ```
   Assigned Location: {{serviceLocation}}
   ```
3. Or use the full template from Section 5
4. Click **"Continue"** or **"Test & Review"**

#### For Admin Notification Email:

1. Click on your **"Gmail - Send Email"** action step for admin notifications
2. In the **"Body"** field, add or update:
   ```
   Location: {{serviceLocation}}
   ```
3. Or use the full template from Section 5
4. Click **"Continue"** or **"Test & Review"**

**Verification:**
- ✅ Click **"Test action"** for each email step
- ✅ Check your email inbox - you should receive test emails
- ✅ Verify the location appears correctly in each email

---

### **Step 5: Map Field into WhatsApp Cloud API JSON**

#### For Owner/Admin WhatsApp:

1. Click on your **"WhatsApp"** or **"HTTP Request"** action step for owner/admin
2. In the **"Data"** or **"Body"** field (JSON format), locate the parameters array
3. Find the parameter that should contain the location (typically parameter {{6}})
4. Replace the text value with: `{{serviceLocation}}`
5. The JSON should look like:
   ```json
   {
     "template": {
       "components": [
         {
           "type": "body",
           "parameters": [
             { "type": "text", "text": "{{name}}" },
             { "type": "text", "text": "{{service}}" },
             { "type": "text", "text": "{{date}}" },
             { "type": "text", "text": "{{time}}" },
             { "type": "text", "text": "{{address}}" },
             { "type": "text", "text": "{{serviceLocation}}" }
           ]
         }
       ]
     }
   }
   ```
6. Click **"Continue"** or **"Test & Review"**

#### For Cleaner WhatsApp:

1. Click on your **"WhatsApp"** or **"HTTP Request"** action step for cleaner
2. In the **"Data"** or **"Body"** field, locate the parameters array
3. Find the parameter that should contain the location (typically parameter {{2}})
4. Replace the text value with: `{{serviceLocation}}`
5. The JSON should look like:
   ```json
   {
     "template": {
       "components": [
         {
           "type": "body",
           "parameters": [
             { "type": "text", "text": "{{name}}" },
             { "type": "text", "text": "{{serviceLocation}}" },
             { "type": "text", "text": "{{address}}" },
             { "type": "text", "text": "{{date}}" },
             { "type": "text", "text": "{{time}}" }
           ]
         }
       ]
     }
   }
   ```
6. Click **"Continue"** or **"Test & Review"**

#### For Customer WhatsApp:

1. Click on your **"WhatsApp"** or **"HTTP Request"** action step for customer
2. In the **"Data"** or **"Body"** field, locate the parameters array
3. Find the parameter that should contain the location (typically parameter {{5}})
4. Replace the text value with: `{{serviceLocation}}`
5. The JSON should look like:
   ```json
   {
     "template": {
       "components": [
         {
           "type": "body",
           "parameters": [
             { "type": "text", "text": "{{name}}" },
             { "type": "text", "text": "{{service}}" },
             { "type": "text", "text": "{{date}}" },
             { "type": "text", "text": "{{time}}" },
             { "type": "text", "text": "{{serviceLocation}}" },
             { "type": "text", "text": "{{address}}" }
           ]
         }
       ]
     }
   }
   ```
6. Click **"Continue"** or **"Test & Review"`

**Important:** Ensure your WhatsApp Business API templates are approved and match the parameter positions you're using.

**Verification:**
- ✅ Click **"Test action"** for each WhatsApp step
- ✅ Check your WhatsApp - you should receive test messages
- ✅ Verify the location appears in the correct position in each message

---

### **Step 6: Test All Actions**

1. For each action step you've updated:
   - Click **"Test & Review"** or **"Test action"**
   - Verify the action completes successfully
   - Check the output (Google Sheet, emails, WhatsApp messages)
   - Confirm the location data appears correctly

2. If any action fails:
   - Review the error message
   - Check the field mapping
   - Verify the field name is exactly `{{serviceLocation}}` (case-sensitive)
   - Re-test the action

---

### **Step 7: Publish Your Zap**

1. Once all actions are tested and working:
   - Click **"Publish"** or **"Turn Zap On"** at the top of the Zap editor
   - Confirm the publication
2. Your Zap is now live and will process bookings with the `serviceLocation` field

---

### **Step 8: Final Verification (Live Test)**

1. Submit a real test booking through the VelocityMaid booking form
2. Select **"New Jersey"** as the service location
3. Complete the booking process
4. Monitor your Zapier dashboard for the Zap execution
5. Verify:
   - ✅ Google Sheet row created with "New Jersey" in Location column
   - ✅ Customer email received with "Service Location: New Jersey"
   - ✅ Cleaner email received with "Assigned Location: New Jersey"
   - ✅ Admin email received with "Location: New Jersey"
   - ✅ All WhatsApp messages sent with correct location
6. Repeat the test with **"Vermont"** location
7. Verify all actions work correctly for both locations

---

## 🎯 QUICK REFERENCE

### Field Name in Zapier
- **`serviceLocation`** (case-sensitive)

### Expected Values
- `"New Jersey"` (display name)
- `"Vermont"` (display name)

### Where to Use
- Google Sheets: `{{serviceLocation}}`
- Email Body: `{{serviceLocation}}`
- WhatsApp JSON: `{{serviceLocation}}` (in parameters array)

### Common Issues & Solutions

**Issue:** Field not appearing in trigger data
- **Solution:** Verify API is updated, check webhook logs, submit test booking

**Issue:** Location shows as "undefined" or empty
- **Solution:** Check field mapping, ensure `{{serviceLocation}}` is spelled correctly

**Issue:** WhatsApp message missing location
- **Solution:** Verify parameter position matches template, check JSON structure

**Issue:** Google Sheets location column empty
- **Solution:** Re-map the field, verify column header exists, test the action

---

## 📞 SUPPORT

If you encounter issues not covered in this guide:

1. Check Zapier webhook logs for incoming payloads
2. Verify the VelocityMaid API `/api/checkout` route is sending `serviceLocation`
3. Test the webhook trigger with a fresh booking submission
4. Review Zapier action error messages for specific field mapping issues

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Implementation




