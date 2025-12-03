# WhatsApp Integration - Quick Reference

**Quick lookup guide for WhatsApp location-based messaging setup in Zapier**

---

## 📱 Template Parameter Positions

### Cleaner Assignment
| Param | Field | Zapier Source |
|-------|-------|---------------|
| `{{1}}` | Client Name | `{{name}}` |
| `{{2}}` | Service Type | `{{service}}` (formatted) |
| `{{3}}` | Service Date | `{{date}}` (formatted) |
| `{{4}}` | Service Time | `{{time}}` |
| `{{5}}` | Address | `{{address}}` |
| `{{6}}` | **Location** | **`{{serviceLocation}}`** |
| `{{7}}` | Notes | `{{message}}` or "None" |

### Customer Confirmation
| Param | Field | Zapier Source |
|-------|-------|---------------|
| `{{1}}` | First Name | `{{firstName}}` or extract from `{{name}}` |
| `{{2}}` | Service Type | `{{service}}` (formatted) |
| `{{3}}` | Service Date | `{{date}}` (formatted) |
| `{{4}}` | Service Time | `{{time}}` |
| `{{5}}` | **Location** | **`{{serviceLocation}}`** |

### Admin Alert
| Param | Field | Zapier Source |
|-------|-------|---------------|
| `{{1}}` | Client Name | `{{name}}` |
| `{{2}}` | Service Type | `{{service}}` (formatted) |
| `{{3}}` | Total Price | `{{totalPrice}}` (formatted as "$XXX.XX") |
| `{{4}}` | **Location** | **`{{serviceLocation}}`** |
| `{{5}}` | Address | `{{address}}` |

---

## 🔄 Location Formatting

**Input → Output:**
- `"new_jersey"` → `"New Jersey"`
- `"vermont"` → `"Vermont"`
- `"New Jersey"` → `"New Jersey"` (already formatted)
- `"Vermont"` → `"Vermont"` (already formatted)

**Note:** VelocityMaid API sends formatted values, so direct mapping usually works.

---

## 📝 WhatsApp Template Text

### Cleaner Assignment
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

### Customer Confirmation
```
Hi {{1}}, your VelocityMaid booking is confirmed! 🎉 

Service: {{2}} 

Date: {{3}} 

Time: {{4}} 

Location: {{5}}
```

### Admin Alert
```
New booking alert! 

Client: {{1}} 

Service: {{2}} 

Total: ${{3}} 

Location: {{4}} 

Address: {{5}}
```

---

## ⚙️ Zapier Setup Steps

1. **Open WhatsApp Action Step**
2. **Select Template:** `cleaner_assignment`, `customer_confirmation`, or `admin_alert`
3. **Map Parameters:** Use table above
4. **Location Parameter:** Map `{{serviceLocation}}` to location param ({{6}}, {{5}}, or {{4}})
5. **Test:** Verify both "New Jersey" and "Vermont" work
6. **Publish:** Turn Zap on

---

## 🔧 Common Formatting Needs

### Service Type Formatting
- `basic` → "Basic Clean"
- `deep` → "Deep Clean"
- `moveInOut` → "Move In/Out Clean"

### Date Formatting
- `2024-12-25` → "Monday, December 25, 2024"

### Price Formatting
- `120` → "$120.00"

### Location Formatting
- `new_jersey` → "New Jersey"
- `vermont` → "Vermont"

---

## ✅ Testing Checklist

- [ ] New Jersey location displays correctly
- [ ] Vermont location displays correctly
- [ ] All parameters mapped correctly
- [ ] Message format matches template
- [ ] No errors in Zapier logs

---

**For detailed instructions, see:** `WHATSAPP_LOCATION_INTEGRATION_GUIDE.md`
