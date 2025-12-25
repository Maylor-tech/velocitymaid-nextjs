# Payment Security Setup Guide

## Phase 21B - Encryption & Data Protection

This guide covers the security measures implemented for payment method data.

## 🔐 Encryption Key Setup

### Step 1: Generate Encryption Key

Run this command to generate a secure 64-character hex key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Add to Environment Variables

Add the generated key to your `.env.local` file:

```env
PAYMENT_ENCRYPTION_KEY=your_generated_64_character_hex_key_here
```

⚠️ **IMPORTANT**: 
- Never commit this key to version control
- Store it securely (use environment variable management)
- Rotate only with a re-encryption plan

## 🛡️ Security Features

### Data Encryption
- **At Rest**: All sensitive payment data (account numbers, routing numbers, handles) is encrypted using AES-256-GCM
- **In Transit**: Data is encrypted before being stored in the database
- **Decryption**: Only happens in secure server contexts (payout execution)

### Data Masking
- **UI Display**: All payment data is masked before being sent to clients
- **API Responses**: Never expose full encrypted or decrypted values
- **Admin Access**: Admins can only see masked values, never full data

### Access Control
- **Cleaners**: Can see their own masked payment method
- **Admins**: Can see masked values for verification, cannot decrypt
- **Payout Engine**: Only system can decrypt when executing payouts

## 📋 What Gets Encrypted

### Bank Transfer
- ✅ Account Number (encrypted)
- ✅ Routing Number (encrypted)
- ✅ Bank Name (plaintext - safe to show)

### Other Methods (Zelle, Venmo, Cash App, PayPal)
- ✅ Handle/Email/Phone (encrypted)
- ✅ Username (encrypted)

## 🔒 What Never Gets Logged

The following data is **NEVER** logged:
- ❌ Account numbers (encrypted or decrypted)
- ❌ Routing numbers (encrypted or decrypted)
- ❌ Decrypted payment payloads
- ❌ Full handles/emails/phones

**Safe to log:**
- ✅ Cleaner ID
- ✅ Method ID
- ✅ Method Type
- ✅ Admin ID (for verification actions)
- ✅ Timestamps

## 🧪 Testing

### Verify Encryption is Working

1. Create a payment method as a cleaner
2. Check database - `details` should contain encrypted values (format: `iv.tag.encrypted`)
3. Check API response - should show masked values only
4. Check admin UI - should show masked values only

### Verify Decryption Works (Payout Context)

The payout engine will automatically decrypt when needed. No manual testing required in production.

## 🚨 Security Checklist

- [x] Encryption key generated and stored securely
- [x] All sensitive fields encrypted on save
- [x] All API responses return masked data
- [x] Admin UI shows masked values only
- [x] Cleaner UI shows masked values only
- [x] Logging excludes sensitive data
- [x] Payout engine can decrypt when needed

## 📝 Migration Notes

If you have existing payment methods with plaintext data:

1. They will continue to work (masking handles both)
2. New payment methods will be encrypted
3. Consider a migration script to encrypt existing data (optional)

## 🔄 Key Rotation

If you need to rotate the encryption key:

1. **DO NOT** just change the key - this will break decryption
2. Create a migration script that:
   - Reads all encrypted payment methods
   - Decrypts with old key
   - Re-encrypts with new key
   - Updates database
3. Test thoroughly before deploying
4. Keep old key available during migration window














