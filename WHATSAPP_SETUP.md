# WhatsApp Automation Setup Guide

This guide explains how to set up WhatsApp automation for VelocityMaid using Meta WhatsApp Cloud API.

## Environment Variables

Add the following variables to your `.env.local` file:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_TOKEN=your_whatsapp_access_token_here
WHATSAPP_PHONE_ID=your_whatsapp_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=velocitymaid-webhook
WHATSAPP_API_VERSION=v19.0
```

### Getting Your Credentials

1. **WHATSAPP_TOKEN**: 
   - Go to [Meta for Developers](https://developers.facebook.com/)
   - Create or select your WhatsApp Business App
   - Navigate to WhatsApp > API Setup
   - Copy the "Temporary access token" or generate a permanent token

2. **WHATSAPP_PHONE_ID**:
   - In the same API Setup page
   - Find "Phone number ID" (starts with a number)
   - Copy this value

3. **WHATSAPP_VERIFY_TOKEN**:
   - This is a custom token you create for webhook verification
   - Default: `velocitymaid-webhook`
   - Must match what you enter in Meta's webhook configuration

## Webhook Setup

### 1. Configure Webhook URL in Meta

1. Go to your WhatsApp Business App in Meta for Developers
2. Navigate to WhatsApp > Configuration
3. Under "Webhook", click "Edit"
4. Enter your webhook URL: `https://yourdomain.com/api/webhooks/whatsapp`
5. Enter Verify Token: `velocitymaid-webhook` (or your custom token)
6. Subscribe to `messages` event
7. Click "Verify and Save"

### 2. Test Webhook

The webhook endpoint supports:
- **GET**: Webhook verification (Meta will call this during setup)
- **POST**: Inbound message handling

## Features

### Auto-Replies

The system automatically responds to inbound messages:

- **"book" or "clean"** → Sends booking link
- **"apply" or "job"** → Sends cleaner application link
- **"help" or "hi"** → Sends general help message
- **Default** → Sends general help message

### Outbound Messages

#### Jamaica Booking Confirmation

Automatically sent when a Jamaica (Port Antonio) booking is created:

```
Your booking is confirmed! 🎉

Branch: Port Antonio
Service: {service}
Date: {date}
Total: JMD ${price}

We'll reach out shortly to finalize details.
```

#### Cleaner Onboarding

Automatically sent when a cleaner applies to Port Antonio:

```
Thanks for applying to VelocityMaid Port Antonio! 👷

Our team will review your information and contact you shortly.

In the meantime, please prepare:
• Government ID
• 2 references

We look forward to working with you!
```

## Testing

### Admin Test Page

Visit `/admin/tools/whatsapp-test` to test:

1. **Send Test Message**: Basic WhatsApp message test
2. **Send Jamaica Confirmation**: Test booking confirmation format
3. **Send Cleaner Onboarding**: Test onboarding message format

### Manual Testing

You can also test by sending WhatsApp messages to your business number:

- Send "book" → Should receive booking link
- Send "apply" → Should receive application link
- Send "help" → Should receive help message

## Phone Number Format

Phone numbers should be formatted with country code:
- US: `+18765551985` or `18765551985`
- Jamaica: `+18765551985` or `18765551985`

The system automatically formats numbers if country code is missing.

## Troubleshooting

### Messages Not Sending

1. Check environment variables are set correctly
2. Verify WhatsApp token is valid and not expired
3. Check phone number format includes country code
4. Review server logs for error messages

### Webhook Not Receiving Messages

1. Verify webhook URL is accessible (not localhost)
2. Check verify token matches in Meta configuration
3. Ensure webhook is subscribed to `messages` event
4. Check server logs for webhook errors

### Common Errors

- **"WhatsApp credentials not configured"**: Missing `WHATSAPP_TOKEN` or `WHATSAPP_PHONE_ID`
- **"Invalid phone number format"**: Phone number missing or incorrectly formatted
- **"Failed to send WhatsApp message"**: Check token validity and API permissions

## Integration Points

### Booking Flow (`/app/api/checkout/route.ts`)

Jamaica bookings automatically trigger WhatsApp confirmation:
- Only for `currency === 'JMD'` and `branchSlug === 'port-antonio'`
- U.S. bookings remain unchanged (Stripe handled separately)

### Cleaner Application (`/app/api/cleaners/apply/route.ts`)

Port Antonio cleaner applications automatically trigger onboarding message:
- Only for `branchSlug === 'port-antonio'`
- Other branches unchanged

## Security Notes

- Never commit `.env.local` to version control
- Rotate WhatsApp tokens regularly
- Use permanent tokens in production (not temporary)
- Monitor webhook logs for suspicious activity

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Review Meta WhatsApp Cloud API documentation
3. Test using admin test page first
4. Verify webhook configuration in Meta dashboard
