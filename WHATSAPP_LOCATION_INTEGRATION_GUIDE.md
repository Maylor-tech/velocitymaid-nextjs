# WhatsApp Cloud API Integration Guide - Location Support

**Date:** December 2024  
**Purpose:** Complete documentation for upgrading VelocityMaid WhatsApp integration to support location-based messaging (New Jersey and Vermont)

---

## 📋 TABLE OF CONTENTS

1. [WhatsApp Payload (Updated)](#task-1---whatsapp-payload-updated)
2. [Location Formatting](#task-2---location-formatting)
3. [Template Parameter Order](#task-3---template-parameter-order)
4. [Template Text (Updated)](#task-4---template-text-updated)
5. [Zapier Field Mapping Chart](#task-5---zapier-field-mapping-chart)
6. [Zapier Setup Checklist](#task-6---zapier-setup-checklist)

---

## TASK 1 — WHATSAPP PAYLOAD (Updated)

### Complete JSON Payload Examples for WhatsApp Cloud API

All payloads must be sent to: `https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`

---

### (1) Cleaner Assignment WhatsApp Payload

**Endpoint:** `POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`

**Headers:**
```json
{
  "Authorization": "Bearer {YOUR_ACCESS_TOKEN}",
  "Content-Type": "application/json"
}
```

**Request Body:**
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
            "text": "{{1}}"
          },
          {
            "type": "text",
            "text": "{{2}}"
          },
          {
            "type": "text",
            "text": "{{3}}"
          },
          {
            "type": "text",
            "text": "{{4}}"
          },
          {
            "type": "text",
            "text": "{{5}}"
          },
          {
            "type": "text",
            "text": "{{6}}"
          },
          {
            "type": "text",
            "text": "{{7}}"
          }
        ]
      }
    ]
  }
}
```

**Parameter Mapping:**
- `{{1}}` = Client Name (e.g., "John D")
- `{{2}}` = Service Type (e.g., "Basic Clean")
- `{{3}}` = Service Date (e.g., "Monday, December 25, 2024")
- `{{4}}` = Service Time (e.g., "10:00 AM")
- `{{5}}` = Address (e.g., "123 Main Street, Newark, NJ 07102")
- `{{6}}` = Service Location (e.g., "New Jersey" or "Vermont")
- `{{7}}` = Special Instructions (e.g., "Please use eco-friendly products" or "None")

---

### (2) Customer Confirmation WhatsApp Payload

**Endpoint:** `POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`

**Headers:**
```json
{
  "Authorization": "Bearer {YOUR_ACCESS_TOKEN}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "messaging_product": "whatsapp",
  "to": "{{phone}}",
  "type": "template",
  "template": {
    "name": "customer_confirmation",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "{{1}}"
          },
          {
            "type": "text",
            "text": "{{2}}"
          },
          {
            "type": "text",
            "text": "{{3}}"
          },
          {
            "type": "text",
            "text": "{{4}}"
          },
          {
            "type": "text",
            "text": "{{5}}"
          }
        ]
      }
    ]
  }
}
```

**Parameter Mapping:**
- `{{1}}` = Customer First Name (e.g., "John")
- `{{2}}` = Service Type (e.g., "Basic Clean")
- `{{3}}` = Service Date (e.g., "Monday, December 25, 2024")
- `{{4}}` = Service Time (e.g., "10:00 AM")
- `{{5}}` = Service Location (e.g., "New Jersey" or "Vermont")

---

### (3) Admin Alert / Owner Notification WhatsApp Payload

**Endpoint:** `POST https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages`

**Headers:**
```json
{
  "Authorization": "Bearer {YOUR_ACCESS_TOKEN}",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "messaging_product": "whatsapp",
  "to": "{OWNER_ADMIN_PHONE_NUMBER}",
  "type": "template",
  "template": {
    "name": "admin_alert",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "{{1}}"
          },
          {
            "type": "text",
            "text": "{{2}}"
          },
          {
            "type": "text",
            "text": "{{3}}"
          },
          {
            "type": "text",
            "text": "{{4}}"
          },
          {
            "type": "text",
            "text": "{{5}}"
          }
        ]
      }
    ]
  }
}
```

**Parameter Mapping:**
- `{{1}}` = Client Name (e.g., "John D")
- `{{2}}` = Service Type (e.g., "Basic Clean")
- `{{3}}` = Total Price (e.g., "$120.00")
- `{{4}}` = Service Location (e.g., "New Jersey" or "Vermont")
- `{{5}}` = Address (e.g., "123 Main Street, Newark, NJ 07102")

---

## TASK 2 — LOCATION FORMATTING

### Location Conversion Helper

**Rule:** Convert raw location values to readable display names before inserting into WhatsApp templates.

**Conversion Logic:**

| Input Value | Output Value |
|-------------|--------------|
| `"new_jersey"` | `"New Jersey"` |
| `"New Jersey"` | `"New Jersey"` (already formatted) |
| `"vermont"` | `"Vermont"` |
| `"Vermont"` | `"Vermont"` (already formatted) |
| `null` or `undefined` | `"New Jersey"` (default) |

**Implementation in Zapier:**

Since Zapier receives `serviceLocation` as a display name ("New Jersey" or "Vermont") from the VelocityMaid API, you typically don't need conversion. However, if you receive raw values, use Zapier's **Formatter** step:

**Option 1: Using Zapier Formatter (If Needed)**

1. Add a **Formatter by Zapier** step before WhatsApp action
2. Choose **"Text"** → **"Replace"**
3. Find: `new_jersey`
4. Replace with: `New Jersey`
5. Add another replace:
   - Find: `vermont`
   - Replace with: `Vermont`

**Option 2: Using Zapier Code (Advanced)**

If you need conditional logic:

```javascript
// In Zapier Code step
const location = inputData.serviceLocation;

if (location === 'new_jersey' || location === 'New Jersey') {
  return { formattedLocation: 'New Jersey' };
} else if (location === 'vermont' || location === 'Vermont') {
  return { formattedLocation: 'Vermont' };
} else {
  return { formattedLocation: 'New Jersey' }; // Default
}
```

**Option 3: Direct Mapping (Recommended)**

Since the VelocityMaid API already sends formatted values ("New Jersey" or "Vermont"), you can map directly:

```
{{serviceLocation}}
```

**Note:** The VelocityMaid `/api/checkout` route sends `serviceLocation` as a display name, so conversion is typically not needed. Use the value directly from the webhook trigger.

---

## TASK 3 — TEMPLATE PARAMETER ORDER

### Exact Sequence of Template Variables

---

### CLEANER ASSIGNMENT TEMPLATE

**Template Name:** `cleaner_assignment`

**Parameter Order:**

| Position | Variable | Example Value | Description |
|----------|----------|---------------|-------------|
| `{{1}}` | Client Name | "John D" | Full customer name (firstName + lastInitial) |
| `{{2}}` | Service Type | "Basic Clean" | Formatted service type |
| `{{3}}` | Service Date | "Monday, December 25, 2024" | Formatted date |
| `{{4}}` | Service Time | "10:00 AM" | Preferred time |
| `{{5}}` | Address | "123 Main Street, Newark, NJ 07102" | Full service address |
| `{{6}}` | **Service Location** | **"New Jersey"** | **Location (NEW - formatted)** |
| `{{7}}` | Special Instructions | "Please use eco-friendly products" | Special instructions or "None" |

**Zapier Field Mapping:**
- `{{1}}` ← `{{name}}`
- `{{2}}` ← `{{service}}` (formatted)
- `{{3}}` ← `{{date}}` (formatted)
- `{{4}}` ← `{{time}}`
- `{{5}}` ← `{{address}}`
- `{{6}}` ← `{{serviceLocation}}` (formatted to "New Jersey" or "Vermont")
- `{{7}}` ← `{{message}}` (or "None" if empty)

---

### CUSTOMER CONFIRMATION TEMPLATE

**Template Name:** `customer_confirmation`

**Parameter Order:**

| Position | Variable | Example Value | Description |
|----------|----------|---------------|-------------|
| `{{1}}` | Customer First Name | "John" | Customer's first name only |
| `{{2}}` | Service Type | "Basic Clean" | Formatted service type |
| `{{3}}` | Service Date | "Monday, December 25, 2024" | Formatted date |
| `{{4}}` | Service Time | "10:00 AM" | Preferred time |
| `{{5}}` | **Service Location** | **"New Jersey"** | **Location (NEW - formatted)** |

**Zapier Field Mapping:**
- `{{1}}` ← `{{firstName}}` (extract from `{{name}}` or use separate field)
- `{{2}}` ← `{{service}}` (formatted)
- `{{3}}` ← `{{date}}` (formatted)
- `{{4}}` ← `{{time}}`
- `{{5}}` ← `{{serviceLocation}}` (formatted to "New Jersey" or "Vermont")

**Note:** If `firstName` is not available separately, use Zapier Formatter to extract first name from `{{name}}`.

---

### ADMIN ALERT TEMPLATE

**Template Name:** `admin_alert`

**Parameter Order:**

| Position | Variable | Example Value | Description |
|----------|----------|---------------|-------------|
| `{{1}}` | Client Name | "John D" | Full customer name |
| `{{2}}` | Service Type | "Basic Clean" | Formatted service type |
| `{{3}}` | Total Price | "$120.00" | Formatted total price |
| `{{4}}` | **Service Location** | **"New Jersey"** | **Location (NEW - formatted)** |
| `{{5}}` | Address | "123 Main Street, Newark, NJ 07102" | Full service address |

**Zapier Field Mapping:**
- `{{1}}` ← `{{name}}`
- `{{2}}` ← `{{service}}` (formatted)
- `{{3}}` ← `{{totalPrice}}` (formatted as "$XXX.XX")
- `{{4}}` ← `{{serviceLocation}}` (formatted to "New Jersey" or "Vermont")
- `{{5}}` ← `{{address}}`

---

## TASK 4 — TEMPLATE TEXT (UPDATED)

### WhatsApp Business Template Body Text

**Important:** These templates must be approved in your WhatsApp Business Account before use.

---

### Cleaner Assignment Template

**Template Name:** `cleaner_assignment`

**Category:** `UTILITY`

**Language:** `en` (English)

**Template Body:**
```
New cleaning assignment received! 

Client: {{1}} 

Service: {{2}} 

Date: {{3}} 

Time: {{4}} 

Address: {{5}} 

Location: {{6}} 

Notes: {{7}}
```

**Character Count:** 118 characters (within WhatsApp's 1024 character limit)

**Example Output:**
```
New cleaning assignment received! 

Client: John D 

Service: Basic Clean 

Date: Monday, December 25, 2024 

Time: 10:00 AM 

Address: 123 Main Street, Newark, NJ 07102 

Location: New Jersey 

Notes: Please use eco-friendly products
```

---

### Customer Confirmation Template

**Template Name:** `customer_confirmation`

**Category:** `UTILITY`

**Language:** `en` (English)

**Template Body:**
```
Hi {{1}}, your VelocityMaid booking is confirmed! 🎉 

Service: {{2}} 

Date: {{3}} 

Time: {{4}} 

Location: {{5}}
```

**Character Count:** 97 characters (within WhatsApp's 1024 character limit)

**Example Output:**
```
Hi John, your VelocityMaid booking is confirmed! 🎉 

Service: Basic Clean 

Date: Monday, December 25, 2024 

Time: 10:00 AM 

Location: New Jersey
```

---

### Admin Alert Template

**Template Name:** `admin_alert`

**Category:** `UTILITY`

**Language:** `en` (English)

**Template Body:**
```
New booking alert! 

Client: {{1}} 

Service: {{2}} 

Total: ${{3}} 

Location: {{4}} 

Address: {{5}}
```

**Character Count:** 87 characters (within WhatsApp's 1024 character limit)

**Example Output:**
```
New booking alert! 

Client: John D 

Service: Basic Clean 

Total: $120.00 

Location: New Jersey 

Address: 123 Main Street, Newark, NJ 07102
```

---

## TASK 5 — ZAPIER FIELD MAPPING CHART

### Complete Field Mapping Reference

---

### Cleaner Assignment WhatsApp Mapping

| Zapier Field (From Webhook) | Format/Transform | WhatsApp Template Parameter | Example Value |
|------------------------------|-----------------|----------------------------|---------------|
| `{{name}}` | Direct mapping | `{{1}}` | "John D" |
| `{{service}}` | Format to readable | `{{2}}` | "Basic Clean" |
| `{{date}}` | Format date | `{{3}}` | "Monday, December 25, 2024" |
| `{{time}}` | Direct mapping | `{{4}}` | "10:00 AM" |
| `{{address}}` | Direct mapping | `{{5}}` | "123 Main Street, Newark, NJ 07102" |
| `{{serviceLocation}}` | Format location | `{{6}}` | "New Jersey" or "Vermont" |
| `{{message}}` | Use "None" if empty | `{{7}}` | "Please use eco-friendly products" or "None" |

**Formatting Notes:**
- **Service Type:** Use Formatter to convert: `basic` → "Basic Clean", `deep` → "Deep Clean", `moveInOut` → "Move In/Out Clean"
- **Date:** Use Formatter to format: `2024-12-25` → "Monday, December 25, 2024"
- **Location:** Already formatted by API, but verify: `new_jersey` → "New Jersey", `vermont` → "Vermont"
- **Special Instructions:** Use Formatter: If empty → "None", else use value

---

### Customer Confirmation WhatsApp Mapping

| Zapier Field (From Webhook) | Format/Transform | WhatsApp Template Parameter | Example Value |
|------------------------------|-----------------|----------------------------|---------------|
| `{{name}}` | Extract first name | `{{1}}` | "John" |
| `{{service}}` | Format to readable | `{{2}}` | "Basic Clean" |
| `{{date}}` | Format date | `{{3}}` | "Monday, December 25, 2024" |
| `{{time}}` | Direct mapping | `{{4}}` | "10:00 AM" |
| `{{serviceLocation}}` | Format location | `{{5}}` | "New Jersey" or "Vermont" |

**Formatting Notes:**
- **First Name:** Use Formatter "Text" → "Extract" to get first word from `{{name}}`
- **Service Type:** Format as above
- **Date:** Format as above
- **Location:** Format as above

---

### Admin Alert WhatsApp Mapping

| Zapier Field (From Webhook) | Format/Transform | WhatsApp Template Parameter | Example Value |
|------------------------------|-----------------|----------------------------|---------------|
| `{{name}}` | Direct mapping | `{{1}}` | "John D" |
| `{{service}}` | Format to readable | `{{2}}` | "Basic Clean" |
| `{{totalPrice}}` | Format as currency | `{{3}}` | "$120.00" |
| `{{serviceLocation}}` | Format location | `{{4}}` | "New Jersey" or "Vermont" |
| `{{address}}` | Direct mapping | `{{5}}` | "123 Main Street, Newark, NJ 07102" |

**Formatting Notes:**
- **Service Type:** Format as above
- **Total Price:** Use Formatter "Numbers" → "Format Currency": `120` → "$120.00"
- **Location:** Format as above

---

### Quick Reference: All Mappings

| WhatsApp Template | Parameter | Zapier Source Field | Required Format |
|-------------------|-----------|---------------------|-----------------|
| All Templates | `{{1}}` | `{{name}}` or `{{firstName}}` | Text |
| All Templates | `{{2}}` | `{{service}}` | Formatted service type |
| Cleaner/Customer | `{{3}}` | `{{date}}` | Formatted date |
| Cleaner/Customer | `{{4}}` | `{{time}}` | Time string |
| Cleaner/Admin | `{{5}}` | `{{address}}` | Full address |
| **All Templates** | **Location Param** | **`{{serviceLocation}}`** | **"New Jersey" or "Vermont"** |
| Cleaner | `{{7}}` | `{{message}}` | Instructions or "None" |
| Admin | `{{3}}` | `{{totalPrice}}` | "$XXX.XX" format |

---

## TASK 6 — ZAPIER SETUP CHECKLIST

### Step-by-Step Setup Instructions

---

### Prerequisites

- [ ] WhatsApp Business API account set up
- [ ] WhatsApp Business templates approved in Meta Business Manager
- [ ] Zapier account with WhatsApp Cloud API integration
- [ ] VelocityMaid webhook trigger configured in Zapier

---

### STEP 1: Open Zapier → Go to WhatsApp Action Step

1. Log in to your Zapier account
2. Navigate to your VelocityMaid booking Zap
3. Click **"Edit Zap"** (ensure Zap is in Draft mode)
4. Locate or add the **WhatsApp Cloud API** action step
5. If adding new step, click **"+ Add Step"** → Search **"WhatsApp"** → Select **"WhatsApp Cloud API"**

---

### STEP 2: Select the Correct Approved WhatsApp Template

1. In the WhatsApp action step, click **"Set up action"**
2. **Action Event:** Select **"Send Template Message"**
3. **Account:** Connect or select your WhatsApp Business API account
4. **Phone Number ID:** Select your WhatsApp Business phone number
5. **Template:** Select the appropriate template:
   - For Cleaner Assignment: `cleaner_assignment`
   - For Customer Confirmation: `customer_confirmation`
   - For Admin Alert: `admin_alert`
6. **Language:** Select `en` (English)

---

### STEP 3: Map Each Parameter EXACTLY Using the Chart Above

#### For Cleaner Assignment Template:

1. **Parameter 1 (Client Name):**
   - Click on parameter field `{{1}}`
   - Select: `{{name}}` from trigger data
   - Verify: Shows "John D" format

2. **Parameter 2 (Service Type):**
   - Click on parameter field `{{2}}`
   - **If needed:** Add Formatter step before WhatsApp to format service type
   - Map: `{{service}}` (formatted to "Basic Clean", "Deep Clean", or "Move In/Out Clean")

3. **Parameter 3 (Service Date):**
   - Click on parameter field `{{3}}`
   - **If needed:** Add Formatter step to format date
   - Map: `{{date}}` (formatted to "Monday, December 25, 2024")

4. **Parameter 4 (Service Time):**
   - Click on parameter field `{{4}}`
   - Map: `{{time}}` directly

5. **Parameter 5 (Address):**
   - Click on parameter field `{{5}}`
   - Map: `{{address}}` directly

6. **Parameter 6 (Service Location) - NEW:**
   - Click on parameter field `{{6}}`
   - Map: `{{serviceLocation}}` from trigger data
   - **Verify:** Value is "New Jersey" or "Vermont" (not "new_jersey" or "vermont")
   - **If raw value received:** Use Formatter to convert (see Step 4)

7. **Parameter 7 (Special Instructions):**
   - Click on parameter field `{{7}}`
   - Map: `{{message}}` from trigger data
   - **If empty:** Use Formatter to set default "None"

#### For Customer Confirmation Template:

1. **Parameter 1 (Customer First Name):**
   - Click on parameter field `{{1}}`
   - **Option A:** If `{{firstName}}` exists, map directly
   - **Option B:** Use Formatter to extract first word from `{{name}}`
   - Verify: Shows "John" (not "John D")

2. **Parameter 2 (Service Type):**
   - Click on parameter field `{{2}}`
   - Map: `{{service}}` (formatted)

3. **Parameter 3 (Service Date):**
   - Click on parameter field `{{3}}`
   - Map: `{{date}}` (formatted)

4. **Parameter 4 (Service Time):**
   - Click on parameter field `{{4}}`
   - Map: `{{time}}` directly

5. **Parameter 5 (Service Location) - NEW:**
   - Click on parameter field `{{5}}`
   - Map: `{{serviceLocation}}` from trigger data
   - **Verify:** Value is "New Jersey" or "Vermont"

#### For Admin Alert Template:

1. **Parameter 1 (Client Name):**
   - Click on parameter field `{{1}}`
   - Map: `{{name}}` directly

2. **Parameter 2 (Service Type):**
   - Click on parameter field `{{2}}`
   - Map: `{{service}}` (formatted)

3. **Parameter 3 (Total Price):**
   - Click on parameter field `{{3}}`
   - **Add Formatter step:** Format `{{totalPrice}}` as currency
   - Map: Formatted value (e.g., "$120.00")

4. **Parameter 4 (Service Location) - NEW:**
   - Click on parameter field `{{4}}`
   - Map: `{{serviceLocation}}` from trigger data
   - **Verify:** Value is "New Jersey" or "Vermont"

5. **Parameter 5 (Address):**
   - Click on parameter field `{{5}}`
   - Map: `{{address}}` directly

---

### STEP 4: Insert "New Jersey" or "Vermont" Using Location Conversion

**If `serviceLocation` is already formatted** (recommended - VelocityMaid API sends formatted values):

1. Map `{{serviceLocation}}` directly to the location parameter
2. No conversion needed

**If `serviceLocation` is a raw value** (`new_jersey` or `vermont`):

#### Option A: Using Zapier Formatter (Recommended)

1. **Add Formatter step** before WhatsApp action:
   - Click **"+ Add Step"** → Search **"Formatter by Zapier"**
   - **Transform:** Select **"Text"** → **"Replace"**
   - **Input:** `{{serviceLocation}}`
   - **Find:** `new_jersey`
   - **Replace with:** `New Jersey`
   - **Add another replace:**
     - **Find:** `vermont`
     - **Replace with:** `Vermont`
2. **In WhatsApp step:** Map location parameter to the formatted output from Formatter step

#### Option B: Using Zapier Code (Advanced)

1. **Add Code step** before WhatsApp action:
   - Click **"+ Add Step"** → Search **"Code by Zapier"**
   - **Input Data:** `serviceLocation` (from trigger)
   - **Code:**
     ```javascript
     const location = inputData.serviceLocation;
     
     let formattedLocation = 'New Jersey'; // Default
     
     if (location === 'new_jersey' || location === 'New Jersey') {
       formattedLocation = 'New Jersey';
     } else if (location === 'vermont' || location === 'Vermont') {
       formattedLocation = 'Vermont';
     }
     
     return { formattedLocation };
     ```
2. **In WhatsApp step:** Map location parameter to `{{formattedLocation}}` from Code step

---

### STEP 5: Test Step with Both Locations

1. **Test with New Jersey Location:**
   - Click **"Test & Review"** or **"Test action"** in WhatsApp step
   - **Verify trigger data includes:** `serviceLocation: "New Jersey"` or `serviceLocation: "new_jersey"`
   - **Check WhatsApp message received:**
     - Location shows as "New Jersey" (not "new_jersey")
     - All parameters mapped correctly
     - Message format is correct

2. **Test with Vermont Location:**
   - **Option A:** Submit a test booking with Vermont location
   - **Option B:** Manually edit trigger test data to set `serviceLocation: "Vermont"` or `"vermont"`
   - **Verify WhatsApp message received:**
     - Location shows as "Vermont" (not "vermont")
     - All parameters mapped correctly
     - Message format is correct

3. **Test Edge Cases:**
   - Test with empty `serviceLocation` (should default to "New Jersey")
   - Test with null/undefined `serviceLocation` (should default to "New Jersey")
   - Test with both raw and formatted values

**Verification Checklist:**
- [ ] New Jersey location displays as "New Jersey" in WhatsApp
- [ ] Vermont location displays as "Vermont" in WhatsApp
- [ ] All other parameters display correctly
- [ ] Message format matches template exactly
- [ ] No errors in Zapier action logs

---

### STEP 6: Publish Zap

1. **Review all steps:**
   - Verify all three WhatsApp templates are configured (if using all three)
   - Check all parameter mappings
   - Confirm location formatting works for both locations

2. **Publish Zap:**
   - Click **"Publish"** or **"Turn Zap On"** at the top of the Zap editor
   - Confirm publication

3. **Final Verification:**
   - Submit a real test booking through VelocityMaid booking form
   - Select "New Jersey" location
   - Verify WhatsApp messages are sent correctly
   - Submit another test booking with "Vermont" location
   - Verify WhatsApp messages are sent correctly

---

## 📋 Quick Reference: Location Parameter Positions

| Template Type | Location Parameter | Position |
|---------------|-------------------|----------|
| Cleaner Assignment | `{{6}}` | 6th parameter |
| Customer Confirmation | `{{5}}` | 5th parameter |
| Admin Alert | `{{4}}` | 4th parameter |

---

## 🔧 Troubleshooting

### Issue: Location shows as "new_jersey" instead of "New Jersey"

**Solution:**
1. Check if VelocityMaid API is sending formatted values
2. Add Formatter step to convert raw values
3. Verify mapping in WhatsApp step

### Issue: Location parameter is empty

**Solution:**
1. Check trigger data - verify `serviceLocation` field exists
2. Check field name spelling (case-sensitive)
3. Add default value using Formatter: If empty → "New Jersey"

### Issue: WhatsApp template not found

**Solution:**
1. Verify template is approved in Meta Business Manager
2. Check template name spelling (exact match required)
3. Verify template language code matches (`en`)

### Issue: Parameter count mismatch

**Solution:**
1. Count parameters in WhatsApp template
2. Count parameters in Zapier mapping
3. Ensure all parameters are mapped (even if empty, use "None")

---

## ✅ Final Checklist

Before going live:

- [ ] All three WhatsApp templates approved in Meta Business Manager
- [ ] Cleaner Assignment template configured with 7 parameters
- [ ] Customer Confirmation template configured with 5 parameters
- [ ] Admin Alert template configured with 5 parameters
- [ ] Location parameter mapped correctly in all templates
- [ ] Location formatting tested for both "New Jersey" and "Vermont"
- [ ] All other parameters mapped and formatted correctly
- [ ] Test messages received successfully for both locations
- [ ] Zap published and active
- [ ] End-to-end test completed with real booking

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Ready for Implementation



