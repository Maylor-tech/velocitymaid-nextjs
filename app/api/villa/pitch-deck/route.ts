export const dynamic = 'force-dynamic'

/**
 * VelocityMaid Jamaica Villa Sales Pitch Deck PDF Generator
 * GET /api/villa/pitch-deck
 * 
 * Generates a comprehensive multi-page PDF pitch deck for villa partnerships
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Generate comprehensive HTML for multi-page PDF pitch deck
    const html = generatePitchDeckHTML();

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': 'inline; filename="velocitymaid-jamaica-villa-pitch-deck.html"',
      },
    });
  } catch (error: any) {
    console.error('Generate pitch deck error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate pitch deck' },
      { status: 500 }
    );
  }
}

function generatePitchDeckHTML(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VelocityMaid Jamaica - Villa Partnership Pitch Deck</title>
  <style>
    @page {
      size: letter landscape;
      margin: 0.5in;
    }
    body {
      font-family: 'Inter', 'Arial', sans-serif;
      color: #333;
      line-height: 1.6;
      margin: 0;
      padding: 0;
      background: white;
    }
    .slide {
      page-break-after: always;
      min-height: 7.5in;
      width: 10in;
      padding: 40px 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .slide:last-child {
      page-break-after: auto;
    }
    .slide-cover {
      background: linear-gradient(135deg, #0A3D2F 0%, #083025 100%);
      color: white;
      text-align: center;
      justify-content: center;
      align-items: center;
    }
    .slide-white {
      background: white;
      border: 3px solid #F8C548;
    }
    .logo-large {
      font-size: 64px;
      font-weight: bold;
      color: #F8C548;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      margin-bottom: 20px;
    }
    .logo-box-large {
      width: 120px;
      height: 120px;
      background-color: #F8C548;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0A3D2F;
      font-size: 36px;
      font-weight: bold;
      margin: 0 auto 30px;
    }
    .slide-title {
      font-size: 48px;
      font-weight: bold;
      color: #0A3D2F;
      margin: 0 0 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    .slide-subtitle {
      font-size: 28px;
      color: #F8C548;
      margin: 0 0 40px 0;
      font-weight: 600;
    }
    .slide-cover .slide-title {
      color: white;
      font-size: 56px;
    }
    .slide-cover .slide-subtitle {
      color: #F8C548;
      font-size: 32px;
    }
    .slide-number {
      position: absolute;
      bottom: 20px;
      right: 30px;
      font-size: 14px;
      color: #6B7280;
    }
    h1 {
      font-size: 36px;
      font-weight: bold;
      color: #0A3D2F;
      margin: 0 0 20px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    h2 {
      font-size: 28px;
      font-weight: bold;
      color: #0A3D2F;
      margin: 25px 0 15px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      border-bottom: 3px solid #F8C548;
      padding-bottom: 8px;
    }
    h3 {
      font-size: 22px;
      font-weight: bold;
      color: #0A3D2F;
      margin: 20px 0 10px 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
    }
    p {
      font-size: 16px;
      line-height: 1.8;
      margin: 12px 0;
      color: #333;
    }
    ul, ol {
      font-size: 16px;
      line-height: 1.8;
      margin: 15px 0;
      padding-left: 30px;
    }
    li {
      margin: 10px 0;
      color: #333;
    }
    .value-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .value-card {
      background: #F3F1EB;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #F8C548;
      text-align: center;
    }
    .value-card h3 {
      color: #0A3D2F;
      margin: 0 0 10px 0;
      font-size: 20px;
    }
    .value-card p {
      font-size: 14px;
      margin: 0;
      color: #666;
    }
    .step-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .step-item {
      background: #F3F1EB;
      padding: 20px;
      border-radius: 8px;
      border-top: 4px solid #2B70C9;
    }
    .step-number {
      display: inline-block;
      width: 40px;
      height: 40px;
      background: #2B70C9;
      color: white;
      border-radius: 50%;
      text-align: center;
      line-height: 40px;
      font-weight: bold;
      font-size: 20px;
      margin-right: 15px;
      vertical-align: middle;
    }
    .step-item h3 {
      display: inline-block;
      margin: 0;
      vertical-align: middle;
    }
    .step-item p {
      margin: 10px 0 0 0;
      font-size: 14px;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 30px 0;
    }
    .pricing-card {
      background: #0A3D2F;
      color: white;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      border: 3px solid #F8C548;
    }
    .pricing-card h3 {
      color: #F8C548;
      margin: 0 0 15px 0;
      font-size: 22px;
    }
    .pricing-amount {
      font-size: 36px;
      font-weight: bold;
      color: white;
      margin: 15px 0;
    }
    .pricing-card ul {
      text-align: left;
      margin-top: 20px;
      font-size: 14px;
    }
    .pricing-card li {
      color: rgba(255,255,255,0.9);
      margin: 8px 0;
    }
    .benefit-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .benefit-item {
      background: #F3F1EB;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #F8C548;
    }
    .benefit-item h3 {
      color: #0A3D2F;
      margin: 0 0 10px 0;
      font-size: 20px;
    }
    .benefit-item p {
      font-size: 14px;
      margin: 0;
      color: #666;
    }
    .testimonial-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .testimonial {
      background: #F3F1EB;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2B70C9;
    }
    .testimonial-text {
      font-style: italic;
      font-size: 14px;
      color: #333;
      margin: 0 0 15px 0;
    }
    .testimonial-author {
      font-weight: bold;
      color: #0A3D2F;
      font-size: 14px;
    }
    .testimonial-property {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    .stars {
      color: #F8C548;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .areas-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .area-item {
      background: #0A3D2F;
      color: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      font-weight: 600;
    }
    .cta-box {
      background: linear-gradient(135deg, #F8C548 0%, #F5B835 100%);
      color: #0A3D2F;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      margin: 30px 0;
    }
    .cta-box h2 {
      color: #0A3D2F;
      border: none;
      margin: 0 0 15px 0;
      font-size: 32px;
    }
    .cta-box p {
      font-size: 18px;
      margin: 10px 0;
      font-weight: 600;
    }
    .qr-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 30px;
      margin: 30px 0;
      text-align: center;
    }
    .qr-box {
      padding: 20px;
      border: 3px solid #F8C548;
      border-radius: 10px;
      background: white;
    }
    .qr-placeholder {
      width: 180px;
      height: 180px;
      background: #F3F1EB;
      border: 3px dashed #0A3D2F;
      margin: 0 auto 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0A3D2F;
      font-size: 12px;
      text-align: center;
      padding: 10px;
      border-radius: 8px;
    }
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .contact-item {
      background: #F3F1EB;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2B70C9;
    }
    .contact-item strong {
      color: #0A3D2F;
      display: block;
      font-size: 18px;
      margin-bottom: 10px;
    }
    .contact-item p {
      font-size: 16px;
      margin: 5px 0;
      color: #333;
    }
    .divider {
      height: 4px;
      background: #F8C548;
      margin: 20px 0;
      border-radius: 2px;
    }
  </style>
</head>
<body>
  <!-- Slide 1: Cover -->
  <div class="slide slide-cover">
    <div class="logo-box-large">VM</div>
    <h1 class="slide-title">VelocityMaid Jamaica</h1>
    <p class="slide-subtitle">Villa Partnership Program</p>
    <p style="font-size: 24px; margin-top: 40px; color: rgba(255,255,255,0.9);">
      Professional Turnover Cleaning<br>
      For Vacation Rentals & Villas
    </p>
    <p style="font-size: 18px; margin-top: 60px; color: rgba(255,255,255,0.8);">
      Port Antonio, Jamaica
    </p>
    <div class="slide-number" style="color: rgba(255,255,255,0.6);">1</div>
  </div>

  <!-- Slide 2: Who We Are -->
  <div class="slide slide-white">
    <div>
      <h1>Who We Are</h1>
      <p style="font-size: 18px; line-height: 2;">
        VelocityMaid Jamaica is Port Antonio's premier professional cleaning service, specializing in 
        villa turnover cleaning for vacation rentals, Airbnbs, and property management companies.
      </p>
      <p style="font-size: 18px; line-height: 2;">
        Our team of <strong>Jamaica Certified Cleaners</strong> undergoes rigorous training to ensure 
        consistent, 5-star quality on every job.
      </p>
      <div class="value-grid">
        <div class="value-card">
          <h3>Quality</h3>
          <p>5-star standards on every clean</p>
        </div>
        <div class="value-card">
          <h3>Reliability</h3>
          <p>Consistent, dependable service</p>
        </div>
        <div class="value-card">
          <h3>Professionalism</h3>
          <p>Trained, certified cleaners</p>
        </div>
      </div>
    </div>
    <div class="slide-number">2</div>
  </div>

  <!-- Slide 3: Why Villas Need Professional Turnovers -->
  <div class="slide slide-white">
    <div>
      <h1>Why Villas Need Professional Turnovers</h1>
      <div class="benefit-grid">
        <div class="benefit-item">
          <h3>Guest Satisfaction</h3>
          <p>First impressions matter. A spotless villa leads to 5-star reviews and repeat bookings.</p>
        </div>
        <div class="benefit-item">
          <h3>Time Savings</h3>
          <p>Free up your time to focus on marketing, guest communication, and property management.</p>
        </div>
        <div class="benefit-item">
          <h3>Consistency</h3>
          <p>Every turnover meets the same high standards, regardless of who's cleaning.</p>
        </div>
        <div class="benefit-item">
          <h3>Damage Protection</h3>
          <p>Early detection and documentation of damage protects your property and revenue.</p>
        </div>
        <div class="benefit-item">
          <h3>Inventory Management</h3>
          <p>Regular inventory checks prevent missing items and ensure guest satisfaction.</p>
        </div>
        <div class="benefit-item">
          <h3>Professional Image</h3>
          <p>Maintain a luxury brand image that justifies premium pricing.</p>
        </div>
      </div>
    </div>
    <div class="slide-number">3</div>
  </div>

  <!-- Slide 4: Our Villa Turnover System -->
  <div class="slide slide-white">
    <div>
      <h1>Our Villa Turnover System</h1>
      <p style="font-size: 18px; margin-bottom: 30px;">
        A proven 6-step protocol ensuring every villa is guest-ready:
      </p>
      <div class="step-grid">
        <div class="step-item">
          <span class="step-number">1</span>
          <h3>Linen Reset</h3>
          <p>Professional bed makeover with fresh linens, proper pillow arrangement, and towel setup</p>
        </div>
        <div class="step-item">
          <span class="step-number">2</span>
          <h3>Bedroom Styling</h3>
          <p>Complete bedroom cleaning, dusting, vacuuming, and styling to hotel standards</p>
        </div>
        <div class="step-item">
          <span class="step-number">3</span>
          <h3>Bathroom Reset</h3>
          <p>Deep sanitization, mirror cleaning, fresh towels, and amenity restocking</p>
        </div>
        <div class="step-item">
          <span class="step-number">4</span>
          <h3>Kitchen Reset</h3>
          <p>Appliance cleaning, countertop sanitization, inventory check, and dish verification</p>
        </div>
        <div class="step-item">
          <span class="step-number">5</span>
          <h3>Photo Documentation</h3>
          <p>Before/after photos of all rooms, organized by area for easy review</p>
        </div>
        <div class="step-item">
          <span class="step-number">6</span>
          <h3>Damage Reporting</h3>
          <p>Detailed damage reports with photos, submitted within 2 hours of completion</p>
        </div>
      </div>
    </div>
    <div class="slide-number">4</div>
  </div>

  <!-- Slide 5: Standards & Quality -->
  <div class="slide slide-white">
    <div>
      <h1>Standards & Quality</h1>
      <h2>Jamaica Certified Cleaners</h2>
      <p style="font-size: 18px;">
        Every cleaner completes comprehensive training and earns their <strong>Jamaica Certified Cleaner</strong> 
        certification before being eligible for villa assignments.
      </p>
      <h2>Job Quality Score (JQS)</h2>
      <p style="font-size: 18px;">Every job is evaluated on:</p>
      <ul style="font-size: 16px;">
        <li><strong>On-Time Arrival</strong> (10 points)</li>
        <li><strong>Checklist Completion</strong> (10 points)</li>
        <li><strong>Photo Documentation</strong> (10 points)</li>
        <li><strong>Customer Rating</strong> (up to 40 points)</li>
        <li><strong>No Complaints</strong> (30 points)</li>
      </ul>
      <p style="font-size: 18px; margin-top: 20px;">
        <strong>Total: 100 points.</strong> High scores qualify for performance bonuses, ensuring consistent quality.
      </p>
    </div>
    <div class="slide-number">5</div>
  </div>

  <!-- Slide 6: Pricing Overview -->
  <div class="slide slide-white">
    <div>
      <h1>Pricing Overview (JMD)</h1>
      <p style="font-size: 18px; text-align: center; margin-bottom: 30px;">
        Transparent pricing with no hidden fees. All prices in Jamaican Dollars.
      </p>
      <div class="pricing-grid">
        <div class="pricing-card">
          <h3>Standard Turnover</h3>
          <div class="pricing-amount">JMD $7,500</div>
          <ul>
            <li>Full villa clean</li>
            <li>Bathroom reset</li>
            <li>Kitchen reset</li>
            <li>Photo documentation</li>
          </ul>
        </div>
        <div class="pricing-card" style="border-color: #F8C548; border-width: 4px;">
          <h3>Turnover + Linen</h3>
          <div class="pricing-amount">JMD $9,500</div>
          <ul>
            <li>Everything in Standard</li>
            <li>Bed makeover & linen reset</li>
            <li>Photo documentation</li>
            <li>Priority scheduling</li>
          </ul>
        </div>
        <div class="pricing-card">
          <h3>Full Service</h3>
          <div class="pricing-amount">JMD $12,000</div>
          <ul>
            <li>Everything in Turnover + Linen</li>
            <li>Inventory check & report</li>
            <li>Damage reporting</li>
            <li>Dedicated account manager</li>
          </ul>
        </div>
      </div>
      <p style="text-align: center; font-size: 16px; margin-top: 20px; color: #666;">
        <strong>Custom pricing available</strong> for weekly/monthly contracts
      </p>
    </div>
    <div class="slide-number">6</div>
  </div>

  <!-- Slide 7: What You Receive as a Partner -->
  <div class="slide slide-white">
    <div>
      <h1>What You Receive as a Partner</h1>
      <div class="benefit-grid">
        <div class="benefit-item">
          <h3>✅ Priority Scheduling</h3>
          <p>Your villa receives priority booking over standard residential clients</p>
        </div>
        <div class="benefit-item">
          <h3>✅ Dedicated Account Manager</h3>
          <p>Single point of contact for all your villa cleaning needs</p>
        </div>
        <div class="benefit-item">
          <h3>✅ Regular Quality Checks</h3>
          <p>Ongoing monitoring and feedback to ensure consistent quality</p>
        </div>
        <div class="benefit-item">
          <h3>✅ 24/7 WhatsApp Support</h3>
          <p>Direct communication channel for urgent needs and questions</p>
        </div>
        <div class="benefit-item">
          <h3>✅ Flexible Scheduling</h3>
          <p>Accommodate last-minute turnovers and schedule changes</p>
        </div>
        <div class="benefit-item">
          <h3>✅ Detailed Reporting</h3>
          <p>Photo documentation, damage reports, and inventory checks</p>
        </div>
        <div class="benefit-item">
          <h3>✅ Performance Tracking</h3>
          <p>Access to job quality scores and performance metrics</p>
        </div>
        <div class="benefit-item">
          <h3>✅ Volume Discounts</h3>
          <p>Reduced rates for weekly and monthly contracts</p>
        </div>
      </div>
    </div>
    <div class="slide-number">7</div>
  </div>

  <!-- Slide 8: Testimonials -->
  <div class="slide slide-white">
    <div>
      <h1>What Villa Owners Say</h1>
      <div class="testimonial-grid">
        <div class="testimonial">
          <div class="stars">★★★★★</div>
          <p class="testimonial-text">
            "VelocityMaid transformed our turnover process. Our guests consistently comment on how spotless 
            the villa is. The inventory checks have saved us countless times."
          </p>
          <p class="testimonial-author">Sarah Mitchell</p>
          <p class="testimonial-property">Oceanview Villa, Port Antonio</p>
        </div>
        <div class="testimonial">
          <div class="stars">★★★★★</div>
          <p class="testimonial-text">
            "The linen reset service is a game-changer. Our beds look like a luxury hotel every time. 
            The team is professional, reliable, and detail-oriented."
          </p>
          <p class="testimonial-author">James Thompson</p>
          <p class="testimonial-property">Mountain Retreat Villa</p>
        </div>
        <div class="testimonial">
          <div class="stars">★★★★★</div>
          <p class="testimonial-text">
            "The damage reporting feature gives us peace of mind. We know exactly what condition the villa 
            is in after each guest. Highly recommend!"
          </p>
          <p class="testimonial-author">Maria Rodriguez</p>
          <p class="testimonial-property">Beachfront Paradise</p>
        </div>
        <div class="testimonial">
          <div class="stars">★★★★★</div>
          <p class="testimonial-text">
            "Professional, reliable, and worth every dollar. Our turnover time has decreased significantly, 
            and guest satisfaction has improved."
          </p>
          <p class="testimonial-author">David Chen</p>
          <p class="testimonial-property">Port Antonio Villa Collection</p>
        </div>
      </div>
    </div>
    <div class="slide-number">8</div>
  </div>

  <!-- Slide 9: Coverage Areas -->
  <div class="slide slide-white">
    <div>
      <h1>Coverage Areas</h1>
      <p style="font-size: 18px; text-align: center; margin-bottom: 30px;">
        Currently serving Port Antonio and surrounding areas in Portland, Jamaica
      </p>
      <div class="areas-grid">
        <div class="area-item">Port Antonio</div>
        <div class="area-item">Boston Bay</div>
        <div class="area-item">Fairy Hill</div>
        <div class="area-item">Long Bay</div>
        <div class="area-item">Winnifred</div>
        <div class="area-item">San San</div>
        <div class="area-item">Frenchman's Cove</div>
        <div class="area-item">Blue Lagoon</div>
        <div class="area-item">Reach Falls</div>
      </div>
      <div style="margin-top: 40px; padding: 20px; background: #F3F1EB; border-radius: 8px; text-align: center;">
        <p style="font-size: 16px; margin: 0;">
          <strong>Expanding Soon:</strong> Kingston, Montego Bay, Ocho Rios, Negril
        </p>
      </div>
    </div>
    <div class="slide-number">9</div>
  </div>

  <!-- Slide 10: Call to Action -->
  <div class="slide slide-white">
    <div>
      <h1 style="text-align: center;">Ready to Get Started?</h1>
      <div class="cta-box">
        <h2>Book Your Trial Clean Today</h2>
        <p>Experience the VelocityMaid difference</p>
        <p style="font-size: 20px; margin-top: 20px;">
          First-time villa partners receive a <strong>10% discount</strong> on their first cleaning
        </p>
        <div style="margin-top: 30px;">
          <p style="font-size: 18px; margin: 10px 0;">
            📱 WhatsApp: +1 (876) 555-1985
          </p>
          <p style="font-size: 18px; margin: 10px 0;">
            🌐 velocitymaid.com/villa-partnership
          </p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 30px;">
        <p style="font-size: 18px; color: #666;">
          No commitment required for trial clean. See the quality for yourself.
        </p>
      </div>
    </div>
    <div class="slide-number">10</div>
  </div>

  <!-- Slide 11: Contact Information -->
  <div class="slide slide-white">
    <div>
      <h1>Contact Information</h1>
      <div class="contact-grid">
        <div class="contact-item">
          <strong>WhatsApp</strong>
          <p>+1 (876) 555-1985</p>
          <p style="font-size: 14px; color: #666;">24/7 Support</p>
        </div>
        <div class="contact-item">
          <strong>Website</strong>
          <p>velocitymaid.com</p>
          <p style="font-size: 14px; color: #666;">Book online</p>
        </div>
        <div class="contact-item">
          <strong>Villa Partnership</strong>
          <p>velocitymaid.com/villa-partnership</p>
          <p style="font-size: 14px; color: #666;">Apply for partnership</p>
        </div>
        <div class="contact-item">
          <strong>Location</strong>
          <p>Port Antonio, Portland</p>
          <p style="font-size: 14px; color: #666;">Jamaica</p>
        </div>
      </div>
      <div class="divider"></div>
      <div class="qr-section">
        <div class="qr-box">
          <div class="qr-placeholder">
            QR Code<br><br>Villa Partnership<br><br>velocitymaid.com/villa-partnership
          </div>
          <p style="font-size: 14px; margin: 0;"><strong>Apply Online</strong></p>
          <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Scan to apply</p>
        </div>
        <div class="qr-box">
          <div class="qr-placeholder">
            QR Code<br><br>WhatsApp Direct<br><br>wa.me/18765551985
          </div>
          <p style="font-size: 14px; margin: 0;"><strong>WhatsApp Us</strong></p>
          <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Scan to message</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 30px; padding: 20px; background: #0A3D2F; color: white; border-radius: 8px;">
        <p style="font-size: 16px; margin: 0;">
          <strong>A Bornfidis Ecosystem Service</strong><br>
          Port Antonio, Jamaica • © 2025
        </p>
      </div>
    </div>
    <div class="slide-number">11</div>
  </div>
</body>
</html>
  `;
}


