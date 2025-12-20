/**
 * 🚨 REDIRECT: Legacy Booking Routes → Canonical Route
 * 
 * This route redirects /booking and /booking/* to /book (canonical booking flow).
 * The [[...path]]] syntax handles both:
 * - /booking → /book
 * - /booking/success → /book
 * - /booking/failed → /book
 * - /booking?branch=miami → /book?branch=miami
 * 
 * DO NOT add booking logic here - this is ONLY a redirect.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  const { searchParams } = new URL(request.url);
  
  // Preserve all query parameters (branch, ref, promo, etc.)
  const queryString = searchParams.toString();
  const redirectUrl = `/book${queryString ? `?${queryString}` : ''}`;
  
  return NextResponse.redirect(new URL(redirectUrl, request.url), 301);
}

