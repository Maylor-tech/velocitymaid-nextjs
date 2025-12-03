/**
 * After-Hours Detection Utility
 * 
 * Determines if current time is within after-hours window (8pm - 8am EST)
 */

/**
 * Check if current time is after-hours
 * After-hours window: 8:00 PM - 8:00 AM EST
 * 
 * @returns true if current time is after-hours
 */
export function isAfterHours(): boolean {
  const now = new Date();
  
  // Convert to EST (UTC-5) or EDT (UTC-4) depending on DST
  const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hours = estTime.getHours();
  
  // After-hours: 8:00 PM (20:00) to 8:00 AM (08:00)
  // This means hours >= 20 OR hours < 8
  return hours >= 20 || hours < 8;
}

/**
 * Get current time in EST
 * 
 * @returns Date object in EST timezone
 */
export function getCurrentESTTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

/**
 * Get hours until morning (8:00 AM EST)
 * 
 * @returns number of hours until 8:00 AM EST
 */
export function getHoursUntilMorning(): number {
  const now = getCurrentESTTime();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // If it's before 8 AM, calculate hours until 8 AM today
  if (hours < 8) {
    const currentMinutes = hours * 60 + minutes;
    const morningMinutes = 8 * 60; // 8:00 AM = 480 minutes
    return (morningMinutes - currentMinutes) / 60;
  }
  
  // If it's after 8 AM, calculate hours until 8 AM tomorrow
  const currentMinutes = hours * 60 + minutes;
  const morningMinutes = 8 * 60 + 24 * 60; // 8:00 AM tomorrow = 1440 + 480 minutes
  return (morningMinutes - currentMinutes) / 60;
}

/**
 * Format time until morning for display
 * 
 * @returns formatted string like "5 hours" or "30 minutes"
 */
export function getTimeUntilMorningFormatted(): string {
  const hours = getHoursUntilMorning();
  
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  
  const wholeHours = Math.floor(hours);
  const remainingMinutes = Math.round((hours - wholeHours) * 60);
  
  if (remainingMinutes === 0) {
    return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''}`;
  }
  
  return `${wholeHours} hour${wholeHours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
}

