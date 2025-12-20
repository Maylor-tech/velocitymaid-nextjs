/**
 * WhatsApp Multi-Branch Routing Module
 * 
 * Routes WhatsApp notifications to the correct state (New Jersey or Vermont)
 * based on booking serviceLocation field.
 */

/**
 * Get admin phone number for the specified service location
 * 
 * @param serviceLocation - Service location: "new_jersey" or "vermont"
 * @returns Admin phone number for the location, or undefined if not configured
 */
export function getAdminNumber(serviceLocation: string | undefined | null): string | undefined {
  if (!serviceLocation) {
    return process.env.ADMIN_WHATSAPP_NJ || process.env.ADMIN_WHATSAPP; // Default to NJ or fallback
  }

  const location = serviceLocation.toLowerCase().trim();

  if (location === 'new_jersey' || location === 'new jersey') {
    return process.env.ADMIN_WHATSAPP_NJ || process.env.ADMIN_WHATSAPP;
  } else if (location === 'vermont') {
    return process.env.ADMIN_WHATSAPP_VT;
  }

  // Default to NJ if location not recognized
  return process.env.ADMIN_WHATSAPP_NJ || process.env.ADMIN_WHATSAPP;
}

/**
 * Get cleaner list for the specified service location
 * 
 * @param serviceLocation - Service location: "new_jersey" or "vermont"
 * @returns Array of cleaner phone numbers for the location
 */
export function getCleanerList(serviceLocation: string | undefined | null): string[] {
  if (!serviceLocation) {
    // Default to NJ cleaners
    return parseCleanerList(process.env.CLEANER_TEAM_NJ || '');
  }

  const location = serviceLocation.toLowerCase().trim();

  if (location === 'new_jersey' || location === 'new jersey') {
    return parseCleanerList(process.env.CLEANER_TEAM_NJ || '');
  } else if (location === 'vermont') {
    return parseCleanerList(process.env.CLEANER_TEAM_VT || '');
  }

  // Default to NJ cleaners if location not recognized
  return parseCleanerList(process.env.CLEANER_TEAM_NJ || '');
}

/**
 * Parse comma-separated cleaner phone numbers into array
 * 
 * @param cleanerList - Comma-separated string of phone numbers
 * @returns Array of cleaned phone numbers
 */
function parseCleanerList(cleanerList: string): string[] {
  if (!cleanerList || cleanerList.trim() === '') {
    return [];
  }

  return cleanerList
    .split(',')
    .map(phone => phone.trim())
    .filter(phone => phone.length > 0);
}

/**
 * Format service location for display
 * 
 * @param serviceLocation - Service location: "new_jersey" or "vermont"
 * @returns Formatted location name: "New Jersey" or "Vermont"
 */
export function formatLocation(serviceLocation: string | undefined | null): string {
  if (!serviceLocation) {
    return 'New Jersey'; // Default
  }

  const location = serviceLocation.toLowerCase().trim();

  if (location === 'new_jersey' || location === 'new jersey') {
    return 'New Jersey';
  } else if (location === 'vermont') {
    return 'Vermont';
  }

  // Default to New Jersey if location not recognized
  return 'New Jersey';
}

/**
 * Validate if a cleaner belongs to the specified service region
 * 
 * @param cleanerPhone - Cleaner phone number to validate
 * @param serviceLocation - Service location: "new_jersey" or "vermont"
 * @returns true if cleaner is in the correct region, false otherwise
 */
export function isCleanerInRegion(cleanerPhone: string, serviceLocation: string | undefined | null): boolean {
  if (!serviceLocation || !cleanerPhone) {
    return false;
  }

  const cleaners = getCleanerList(serviceLocation);
  const normalizedCleanerPhone = cleanerPhone.trim();

  return cleaners.some(phone => phone.trim() === normalizedCleanerPhone);
}

/**
 * Get service region label for logging
 * 
 * @param serviceLocation - Service location: "new_jersey" or "vermont"
 * @returns Region label for logs
 */
export function getRegionLabel(serviceLocation: string | undefined | null): string {
  return formatLocation(serviceLocation);
}




