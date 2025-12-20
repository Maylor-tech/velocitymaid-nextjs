/**
 * Email Templates for VelocityMaid
 * 
 * Professional email templates for customer confirmation, cleaner assignment, and admin alerts.
 * All templates include the serviceLocation field.
 */

// Helper function to format service location
export function formatServiceLocation(location: string | undefined | null): string {
  if (!location) return 'New Jersey';
  
  // Handle display names (already formatted)
  if (location === 'New Jersey' || location === 'Vermont') {
    return location;
  }
  
  // Handle raw values
  if (location === 'new_jersey' || location.toLowerCase() === 'new_jersey') {
    return 'New Jersey';
  }
  
  if (location === 'vermont' || location.toLowerCase() === 'vermont') {
    return 'Vermont';
  }
  
  // Default fallback
  return 'New Jersey';
}

// Helper function to format service type
export function formatServiceType(serviceType: string): string {
  const serviceNames: Record<string, string> = {
    basic: 'Basic Clean',
    deep: 'Deep Clean',
    moveInOut: 'Move In/Out Clean',
  };
  return serviceNames[serviceType] || serviceType;
}

// Helper function to format add-ons
export function formatAddOns(addOns: string[] | Record<string, boolean> | undefined): string {
  if (!addOns) return 'None';
  
  // Handle array format
  if (Array.isArray(addOns)) {
    if (addOns.length === 0) return 'None';
    return addOns
      .map(addon => {
        const formatted: Record<string, string> = {
          laundry: 'Laundry Service',
          windows: 'Interior Windows Cleaning',
          oven: 'Inside Oven Cleaning',
          refrigerator: 'Inside Refrigerator Cleaning',
        };
        return formatted[addon] || addon;
      })
      .join(', ');
  }
  
  // Handle object format
  const selectedAddOns = Object.entries(addOns)
    .filter(([_, value]) => value)
    .map(([key]) => {
      const formatted: Record<string, string> = {
        laundry: 'Laundry Service',
        windows: 'Interior Windows Cleaning',
        oven: 'Inside Oven Cleaning',
        refrigerator: 'Inside Refrigerator Cleaning',
      };
      return formatted[key] || key;
    });
  
  return selectedAddOns.length > 0 ? selectedAddOns.join(', ') : 'None';
}

// Interface for booking data
export interface BookingData {
  firstName: string;
  lastInitial?: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  serviceLocation?: string;
  addOns?: string[] | Record<string, boolean>;
  specialInstructions?: string;
  totalPrice: number;
}

/**
 * Customer Confirmation Email Template (HTML)
 */
export function getCustomerConfirmationEmailHTML(data: BookingData): string {
  const customerName = `${data.firstName}${data.lastInitial ? ` ${data.lastInitial}` : ''}`;
  const serviceLocation = formatServiceLocation(data.serviceLocation);
  const serviceType = formatServiceType(data.serviceType);
  const addOns = formatAddOns(data.addOns);
  const formattedDate = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - VelocityMaid</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Booking Confirmed! ✅</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello ${customerName},</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">Thank you for booking with VelocityMaid! Your cleaning service has been confirmed.</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #0ea5e9; padding: 20px; margin: 25px 0; border-radius: 5px;">
      <h2 style="color: #0ea5e9; margin-top: 0; margin-bottom: 15px; font-size: 20px;">Service Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%;">Client Name:</td>
          <td style="padding: 8px 0;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Service Type:</td>
          <td style="padding: 8px 0;">${serviceType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Service Date:</td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Service Time:</td>
          <td style="padding: 8px 0;">${data.preferredTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Service Location:</td>
          <td style="padding: 8px 0;"><strong>${serviceLocation}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Address:</td>
          <td style="padding: 8px 0;">${data.address}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Total Price:</td>
          <td style="padding: 8px 0; font-size: 18px; color: #0ea5e9; font-weight: bold;">$${data.totalPrice.toFixed(2)}</td>
        </tr>
        ${addOns !== 'None' ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Add-ons:</td>
          <td style="padding: 8px 0;">${addOns}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${data.specialInstructions ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-weight: bold; color: #92400e;">Special Instructions:</p>
      <p style="margin: 5px 0 0 0; color: #78350f;">${data.specialInstructions}</p>
    </div>
    ` : ''}
    
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 5px;">
      <p style="margin: 0; font-weight: bold; color: #065f46;">What's Next?</p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #047857;">
        <li>Our team will contact you within 24 hours to confirm your appointment</li>
        <li>If you have any questions, call us at <a href="tel:+18027335348" style="color: #0ea5e9;">(802) 733-5348</a></li>
        <li>You can also email us at <a href="mailto:hello@velocitymaid.com" style="color: #0ea5e9;">hello@velocitymaid.com</a></li>
      </ul>
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">We look forward to serving you!</p>
    
    <p style="font-size: 16px; margin-top: 20px;">
      Best regards,<br>
      <strong>The VelocityMaid Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p>VelocityMaid | Professional Cleaning Services</p>
    <p><a href="https://velocitymaid.com" style="color: #0ea5e9;">www.velocitymaid.com</a> | <a href="tel:+18027335348" style="color: #0ea5e9;">(802) 733-5348</a></p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Customer Confirmation Email Template (Plain Text)
 */
export function getCustomerConfirmationEmailText(data: BookingData): string {
  const customerName = `${data.firstName}${data.lastInitial ? ` ${data.lastInitial}` : ''}`;
  const serviceLocation = formatServiceLocation(data.serviceLocation);
  const serviceType = formatServiceType(data.serviceType);
  const addOns = formatAddOns(data.addOns);
  const formattedDate = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
Booking Confirmation - VelocityMaid

Hello ${customerName},

Thank you for booking with VelocityMaid! Your cleaning service has been confirmed.

SERVICE DETAILS
---------------
Client Name: ${customerName}
Service Type: ${serviceType}
Service Date: ${formattedDate}
Service Time: ${data.preferredTime}
Service Location: ${serviceLocation}
Address: ${data.address}
Total Price: $${data.totalPrice.toFixed(2)}
${addOns !== 'None' ? `Add-ons: ${addOns}` : ''}

${data.specialInstructions ? `Special Instructions: ${data.specialInstructions}\n` : ''}
WHAT'S NEXT?
-----------
- Our team will contact you within 24 hours to confirm your appointment
- If you have any questions, call us at (802) 733-5348
- You can also email us at hello@velocitymaid.com

We look forward to serving you!

Best regards,
The VelocityMaid Team

---
VelocityMaid | Professional Cleaning Services
www.velocitymaid.com | (802) 733-5348
  `.trim();
}

/**
 * Cleaner Assignment Email Template (HTML)
 */
export function getCleanerAssignmentEmailHTML(data: BookingData): string {
  const customerName = `${data.firstName}${data.lastInitial ? ` ${data.lastInitial}` : ''}`;
  const serviceLocation = formatServiceLocation(data.serviceLocation);
  const serviceType = formatServiceType(data.serviceType);
  const addOns = formatAddOns(data.addOns);
  const formattedDate = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Cleaning Assignment - VelocityMaid</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">New Cleaning Assignment</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hi Team,</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">You have a new cleaning assignment scheduled.</p>
    
    <div style="background: #f8fafc; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 5px;">
      <h2 style="color: #f59e0b; margin-top: 0; margin-bottom: 15px; font-size: 20px;">Assignment Details</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%;">Customer:</td>
          <td style="padding: 8px 0;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
          <td style="padding: 8px 0;"><a href="tel:${data.phone}" style="color: #0ea5e9;">${data.phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #0ea5e9;">${data.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Assigned Location:</td>
          <td style="padding: 8px 0;"><strong>${serviceLocation}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Address:</td>
          <td style="padding: 8px 0;">${data.address}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Date:</td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Time:</td>
          <td style="padding: 8px 0;">${data.preferredTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Service:</td>
          <td style="padding: 8px 0;">${serviceType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Total Price:</td>
          <td style="padding: 8px 0; font-size: 18px; color: #0ea5e9; font-weight: bold;">$${data.totalPrice.toFixed(2)}</td>
        </tr>
        ${addOns !== 'None' ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Add-ons:</td>
          <td style="padding: 8px 0;">${addOns}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${data.specialInstructions ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-weight: bold; color: #92400e;">Special Instructions:</p>
      <p style="margin: 5px 0 0 0; color: #78350f;">${data.specialInstructions}</p>
    </div>
    ` : ''}
    
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 5px;">
      <p style="margin: 0; font-weight: bold; color: #065f46;">Action Required:</p>
      <p style="margin: 10px 0 0 0; color: #047857;">Please confirm receipt of this assignment and prepare accordingly.</p>
    </div>
    
    <p style="font-size: 16px; margin-top: 30px;">Thanks!</p>
    
    <p style="font-size: 16px; margin-top: 20px;">
      <strong>The VelocityMaid Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p>VelocityMaid | Professional Cleaning Services</p>
    <p><a href="https://velocitymaid.com" style="color: #0ea5e9;">www.velocitymaid.com</a> | <a href="tel:+18027335348" style="color: #0ea5e9;">(802) 733-5348</a></p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Cleaner Assignment Email Template (Plain Text)
 */
export function getCleanerAssignmentEmailText(data: BookingData): string {
  const customerName = `${data.firstName}${data.lastInitial ? ` ${data.lastInitial}` : ''}`;
  const serviceLocation = formatServiceLocation(data.serviceLocation);
  const serviceType = formatServiceType(data.serviceType);
  const addOns = formatAddOns(data.addOns);
  const formattedDate = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
New Cleaning Assignment - VelocityMaid

Hi Team,

You have a new cleaning assignment scheduled.

ASSIGNMENT DETAILS
------------------
Customer: ${customerName}
Phone: ${data.phone}
Email: ${data.email}
Assigned Location: ${serviceLocation}
Address: ${data.address}
Date: ${formattedDate}
Time: ${data.preferredTime}
Service: ${serviceType}
Total Price: $${data.totalPrice.toFixed(2)}
${addOns !== 'None' ? `Add-ons: ${addOns}` : ''}

${data.specialInstructions ? `Special Instructions: ${data.specialInstructions}\n` : ''}
ACTION REQUIRED
--------------
Please confirm receipt of this assignment and prepare accordingly.

Thanks!

The VelocityMaid Team

---
VelocityMaid | Professional Cleaning Services
www.velocitymaid.com | (802) 733-5348
  `.trim();
}

/**
 * Admin Alert Email Template (HTML)
 */
export function getAdminAlertEmailHTML(data: BookingData): string {
  const customerName = `${data.firstName}${data.lastInitial ? ` ${data.lastInitial}` : ''}`;
  const serviceLocation = formatServiceLocation(data.serviceLocation);
  const serviceType = formatServiceType(data.serviceType);
  const addOns = formatAddOns(data.addOns);
  const formattedDate = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Booking Alert - VelocityMaid</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🚨 New Booking Alert</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px; font-weight: bold;">Admin Alert:</p>
    
    <p style="font-size: 16px; margin-bottom: 25px;">A new booking has been received and requires your attention.</p>
    
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 5px;">
      <h2 style="color: #ef4444; margin-top: 0; margin-bottom: 15px; font-size: 20px;">Booking Information</h2>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%;">Customer:</td>
          <td style="padding: 8px 0;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Email:</td>
          <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #0ea5e9;">${data.email}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Phone:</td>
          <td style="padding: 8px 0;"><a href="tel:${data.phone}" style="color: #0ea5e9;">${data.phone}</a></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Location:</td>
          <td style="padding: 8px 0;"><strong>${serviceLocation}</strong></td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Service:</td>
          <td style="padding: 8px 0;">${serviceType}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Date:</td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Time:</td>
          <td style="padding: 8px 0;">${data.preferredTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Address:</td>
          <td style="padding: 8px 0;">${data.address}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Total Price:</td>
          <td style="padding: 8px 0; font-size: 18px; color: #0ea5e9; font-weight: bold;">$${data.totalPrice.toFixed(2)}</td>
        </tr>
        ${addOns !== 'None' ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Add-ons:</td>
          <td style="padding: 8px 0;">${addOns}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    ${data.specialInstructions ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-weight: bold; color: #92400e;">Special Instructions:</p>
      <p style="margin: 5px 0 0 0; color: #78350f;">${data.specialInstructions}</p>
    </div>
    ` : ''}
    
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 5px;">
      <p style="margin: 0; font-weight: bold; color: #1e40af;">Next Steps:</p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #1e3a8a;">
        <li>Review booking details in admin dashboard</li>
        <li>Assign cleaner if needed</li>
        <li>Verify customer contact information</li>
        <li>Confirm service location and availability</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; margin-top: 30px; color: #6b7280;">View full details in your admin dashboard or Google Sheets.</p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px;">
    <p>VelocityMaid | Professional Cleaning Services</p>
    <p><a href="https://velocitymaid.com" style="color: #0ea5e9;">www.velocitymaid.com</a> | <a href="tel:+18027335348" style="color: #0ea5e9;">(802) 733-5348</a></p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Admin Alert Email Template (Plain Text)
 */
export function getAdminAlertEmailText(data: BookingData): string {
  const customerName = `${data.firstName}${data.lastInitial ? ` ${data.lastInitial}` : ''}`;
  const serviceLocation = formatServiceLocation(data.serviceLocation);
  const serviceType = formatServiceType(data.serviceType);
  const addOns = formatAddOns(data.addOns);
  const formattedDate = new Date(data.preferredDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
New Booking Alert - VelocityMaid

Admin Alert:

A new booking has been received and requires your attention.

BOOKING INFORMATION
-------------------
Customer: ${customerName}
Email: ${data.email}
Phone: ${data.phone}
Location: ${serviceLocation}
Service: ${serviceType}
Date: ${formattedDate}
Time: ${data.preferredTime}
Address: ${data.address}
Total Price: $${data.totalPrice.toFixed(2)}
${addOns !== 'None' ? `Add-ons: ${addOns}` : ''}

${data.specialInstructions ? `Special Instructions: ${data.specialInstructions}\n` : ''}
NEXT STEPS
----------
- Review booking details in admin dashboard
- Assign cleaner if needed
- Verify customer contact information
- Confirm service location and availability

View full details in your admin dashboard or Google Sheets.

---
VelocityMaid | Professional Cleaning Services
www.velocitymaid.com | (802) 733-5348
  `.trim();
}




