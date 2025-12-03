/**
 * Customer Bookings Utilities
 * 
 * Fetch and manage customer bookings from Stripe
 */

import Stripe from 'stripe';

// Initialize Stripe
function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
}

export interface CustomerBooking {
  id: string;
  sessionId: string;
  customerEmail: string;
  customerName: string;
  preferredDate: string;
  preferredTime: string;
  serviceType: string;
  serviceLocation: 'new_jersey' | 'vermont';
  address: string;
  status: 'pending' | 'assigned' | 'confirmed' | 'on_the_way' | 'completed' | 'cancelled' | 'cancelled_by_customer';
  totalPrice: number;
  addOns?: string[];
  specialInstructions?: string;
  assignedCleanerName?: string;
  assignedCleanerId?: string;
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

/**
 * Get all bookings for a customer by email
 */
export async function getCustomerBookings(customerEmail: string): Promise<CustomerBooking[]> {
  const stripe = getStripe();
  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
  });

  const bookings: CustomerBooking[] = [];

  for (const session of sessions.data) {
    const metadata = session.metadata || {};
    const sessionEmail = session.customer_email || metadata.email || '';
    
    // Match by email (case-insensitive)
    if (sessionEmail.toLowerCase() !== customerEmail.toLowerCase()) {
      continue;
    }

    const firstName = metadata.firstName || '';
    const lastInitial = metadata.lastInitial || '';
    const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

    const booking: CustomerBooking = {
      id: session.id,
      sessionId: session.id,
      customerEmail: sessionEmail,
      customerName,
      preferredDate: metadata.preferredDate || '',
      preferredTime: metadata.preferredTime || '',
      serviceType: metadata.serviceType || 'basic',
      serviceLocation: (metadata.serviceLocation as 'new_jersey' | 'vermont') || 'new_jersey',
      address: metadata.address || '',
      status: (metadata.status as CustomerBooking['status']) || 
              (metadata.completed === 'true' ? 'completed' : 
               metadata.cancelled === 'true' ? 'cancelled' : 'pending'),
      totalPrice: session.amount_total ? session.amount_total / 100 : 0,
      addOns: metadata.addOns ? metadata.addOns.split(',') : [],
      specialInstructions: metadata.specialInstructions || undefined,
      assignedCleanerName: metadata.assignedCleanerName || undefined,
      createdAt: new Date(session.created * 1000).toISOString(),
      completedAt: metadata.completedAt || undefined,
      cancelledAt: metadata.cancelledAt || undefined,
    };

    bookings.push(booking);
  }

  return bookings.sort((a, b) => {
    // Sort by date (upcoming first, then by date descending)
    const dateA = new Date(a.preferredDate).getTime();
    const dateB = new Date(b.preferredDate).getTime();
    const now = Date.now();
    
    const aIsFuture = dateA > now;
    const bIsFuture = dateB > now;
    
    if (aIsFuture && !bIsFuture) return -1;
    if (!aIsFuture && bIsFuture) return 1;
    
    return dateB - dateA; // Most recent first
  });
}

/**
 * Get upcoming bookings (future dates)
 */
export async function getUpcomingBookings(customerEmail: string): Promise<CustomerBooking[]> {
  const allBookings = await getCustomerBookings(customerEmail);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  return allBookings.filter(booking => {
    const bookingDate = new Date(booking.preferredDate);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= now && 
           booking.status !== 'completed' && 
           booking.status !== 'cancelled' && 
           booking.status !== 'cancelled_by_customer';
  });
}

/**
 * Get booking history (completed or cancelled)
 */
export async function getBookingHistory(customerEmail: string): Promise<CustomerBooking[]> {
  const allBookings = await getCustomerBookings(customerEmail);
  
  return allBookings.filter(booking => 
    booking.status === 'completed' || 
    booking.status === 'cancelled' || 
    booking.status === 'cancelled_by_customer'
  );
}

/**
 * Get booking by ID
 */
export async function getBookingById(bookingId: string, customerEmail: string): Promise<CustomerBooking | null> {
  const stripe = getStripe();
  
  try {
    const session = await stripe.checkout.sessions.retrieve(bookingId);
    const metadata = session.metadata || {};
    const sessionEmail = session.customer_email || metadata.email || '';
    
    // Verify customer owns this booking
    if (sessionEmail.toLowerCase() !== customerEmail.toLowerCase()) {
      return null;
    }

    const firstName = metadata.firstName || '';
    const lastInitial = metadata.lastInitial || '';
    const customerName = `${firstName}${lastInitial ? ` ${lastInitial}` : ''}`.trim();

    return {
      id: session.id,
      sessionId: session.id,
      customerEmail: sessionEmail,
      customerName,
      preferredDate: metadata.preferredDate || '',
      preferredTime: metadata.preferredTime || '',
      serviceType: metadata.serviceType || 'basic',
      serviceLocation: (metadata.serviceLocation as 'new_jersey' | 'vermont') || 'new_jersey',
      address: metadata.address || '',
      status: (metadata.status as CustomerBooking['status']) || 
              (metadata.completed === 'true' ? 'completed' : 
               metadata.cancelled === 'true' ? 'cancelled' : 'pending'),
      totalPrice: session.amount_total ? session.amount_total / 100 : 0,
      addOns: metadata.addOns ? metadata.addOns.split(',') : [],
      specialInstructions: metadata.specialInstructions || undefined,
      assignedCleanerName: metadata.assignedCleanerName || undefined,
      createdAt: new Date(session.created * 1000).toISOString(),
      completedAt: metadata.completedAt || undefined,
      cancelledAt: metadata.cancelledAt || undefined,
    };
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}

/**
 * Check if booking can be rescheduled
 * Rule: Must be > 24 hours away
 */
export function canRescheduleBooking(booking: CustomerBooking): boolean {
  const bookingDate = new Date(booking.preferredDate);
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return hoursUntilBooking > 24 && 
         booking.status !== 'completed' && 
         booking.status !== 'cancelled' && 
         booking.status !== 'cancelled_by_customer';
}

/**
 * Check if booking can be cancelled
 * Rule: Must be > 24 hours away OR status is pending
 */
export function canCancelBooking(booking: CustomerBooking): boolean {
  const bookingDate = new Date(booking.preferredDate);
  const now = new Date();
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  return (hoursUntilBooking > 24 || booking.status === 'pending') &&
         booking.status !== 'completed' && 
         booking.status !== 'cancelled' && 
         booking.status !== 'cancelled_by_customer';
}

