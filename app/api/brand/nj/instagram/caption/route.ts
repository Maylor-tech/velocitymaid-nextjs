/**
 * VelocityMaid New Jersey Instagram Caption Generator
 * GET /api/brand/nj/instagram/caption?day={dayNumber}
 * 
 * Returns caption text for each Instagram graphic
 */

import { NextRequest, NextResponse } from 'next/server';

const captions: Record<number, string> = {
  1: `🎉 BIG NEWS! VelocityMaid is now open in New Jersey! 🎉

We're bringing professional cleaning services to your neighborhood. 

✨ What makes us different?
• Trained & certified cleaners
• Insured & bonded
• Satisfaction guaranteed
• Flexible scheduling

Book your first clean and get 15% OFF! 

Link in bio to book now 👆

#VelocityMaid #NewJersey #ProfessionalCleaning #HouseCleaning #CleaningService #NJCleaning #Spotless #CleanHome #HomeCleaning #DeepClean`,

  2: `💰 Transparent Pricing - No Hidden Fees! 💰

We believe in honest, upfront pricing. Here's what you can expect:

🏠 1 Bedroom: $120
🏠 2 Bedroom: $150
🏠 3 Bedroom: $180

All prices include our standard cleaning service. Deep cleaning and move-in/out services available at additional rates.

Book now and save 15% on your first clean! 

Link in bio 👆

#VelocityMaid #NewJersey #CleaningPricing #TransparentPricing #AffordableCleaning #NJCleaning #HouseCleaning`,

  3: `✅ Our Complete Cleaning Checklist ✅

Every VelocityMaid cleaning includes:

✓ Dust all surfaces
✓ Vacuum & mop floors
✓ Clean & sanitize bathrooms
✓ Kitchen deep clean
✓ Trash removal
✓ Final inspection

We don't cut corners - we clean them! 😉

Book your cleaning today and experience the difference!

Link in bio 👆

#VelocityMaid #CleaningChecklist #ProfessionalCleaning #DeepClean #HouseCleaning #NewJersey #NJCleaning #Spotless`,

  4: `✅ Satisfaction Guaranteed - Or We Come Back FREE! ✅

We stand behind our work. If you're not 100% satisfied with your cleaning, we'll come back and fix it - no questions asked, completely FREE.

That's our promise to you.

Book with confidence today!

Link in bio 👆

#VelocityMaid #SatisfactionGuaranteed #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #TrustedCleaning`,

  5: `👥 Meet Your Cleaners 👥

Our team is the heart of VelocityMaid:

✨ Professional & Trained
✨ Insured & Bonded
✨ Background Checked
✨ Friendly & Respectful

We're not just cleaners - we're your neighbors, committed to making your home spotless.

Book today and meet the team!

Link in bio 👆

#VelocityMaid #MeetTheTeam #ProfessionalCleaners #NewJersey #NJCleaning #HouseCleaning #TrustedTeam`,

  6: `📸 Before & After - See the Difference! 📸

The transformation speaks for itself. From cluttered to clean, from dusty to dazzling.

Our professional team brings years of experience to every job.

Ready to see your home transformed?

Book your cleaning today!

Link in bio 👆

#VelocityMaid #BeforeAndAfter #Transformation #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #DeepClean`,

  7: `📱 Book in 3 Easy Steps 📱

1️⃣ Choose Your Service
   Standard, deep clean, or move-in/out

2️⃣ Pick Date & Time
   Schedule at your convenience

3️⃣ Relax & Enjoy
   We handle the rest!

It's that simple. Book now and get 15% OFF your first clean!

Link in bio 👆

#VelocityMaid #EasyBooking #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #BookNow`,

  8: `🧹 Deep Cleaning Breakdown 🧹

Our deep cleaning service includes:

✓ Inside appliances (oven, fridge, microwave)
✓ Baseboards & window sills
✓ Light fixtures & ceiling fans
✓ Cabinet interiors
✓ Detailed bathroom scrubbing
✓ Interior window cleaning

Perfect for spring cleaning or move-in/out!

Book your deep clean today!

Link in bio 👆

#VelocityMaid #DeepCleaning #SpringCleaning #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  9: `🚚 Move-In/Out Cleaning Special 🚚

Moving? We've got you covered!

Our move-in/out service includes:
• Complete deep clean
• Inside all cabinets
• Appliance deep clean
• Window cleaning
• Wall spot cleaning
• Final inspection

Get 20% OFF move-in/out cleaning this month!

Book now!

Link in bio 👆

#VelocityMaid #MoveInOut #MovingCleaning #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  10: `📅 Weekly Cleaning Plan 📅

Save 10% with our weekly cleaning service!

Benefits:
✓ Consistent schedule
✓ Priority booking
✓ Customized plan
✓ Lower cost per clean

Perfect for busy families and professionals.

Set up your weekly plan today!

Link in bio 👆

#VelocityMaid #WeeklyCleaning #RecurringService #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  11: `🏢 Apartment Cleaning Special 🏢

Perfect for apartment living!

✓ Flexible scheduling
✓ Affordable pricing
✓ Quick & efficient
✓ Satisfaction guaranteed

We understand apartment living - we make it easy!

Book your apartment cleaning today!

Link in bio 👆

#VelocityMaid #ApartmentCleaning #ApartmentLife #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  12: `🐾 Pet-Friendly Cleaning 🐾

We love your pets as much as you do!

Our pet-friendly service includes:
✓ Safe cleaning products
✓ Pet hair removal
✓ Odor elimination
✓ Pet-safe sanitization

Your pets' safety is our priority!

Book today!

Link in bio 👆

#VelocityMaid #PetFriendly #PetSafeCleaning #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  13: `🧴 Supplies We Use 🧴

Quality matters! We use:

✓ Eco-friendly products
✓ Professional grade
✓ Safe for families
✓ Pet-friendly options

We bring all supplies - you don't need to provide anything!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #EcoFriendly #ProfessionalSupplies #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  14: `⭐ What Our Customers Say ⭐

"VelocityMaid transformed my home! Professional, reliable, and spotless every time." - Sarah M.

Join hundreds of satisfied customers!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #CustomerReview #Testimonial #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #SatisfiedCustomers`,

  15: `📍 Service Areas 📍

We're proud to serve:
• Newark
• Jersey City
• Paterson
• Elizabeth
• Edison
• Woodbridge
• And more!

Check if we service your area!

Link in bio 👆

#VelocityMaid #ServiceAreas #NewJersey #NJCleaning #HouseCleaning #ProfessionalCleaning #LocalCleaning`,

  16: `📅 Weekly Openings Available 📅

We have openings this week:

✓ Monday - Friday
✓ Saturday - Sunday
✓ Flexible scheduling
✓ Part-time & Full-time

Book your preferred time slot!

Link in bio 👆

#VelocityMaid #WeeklyOpenings #BookNow #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #AvailableNow`,

  17: `🚚 Move-Out Special - 20% OFF! 🚚

Moving out? Get 20% OFF our complete move-out cleaning service!

Includes:
• Full deep clean
• Cabinet interiors
• Appliance cleaning
• Window cleaning
• Final inspection

Limited time offer - book now!

Link in bio 👆

#VelocityMaid #MoveOutSpecial #MovingCleaning #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #Sale`,

  18: `💡 Cleaning Tip of the Day 💡

Bathroom Tip: Use a squeegee after every shower to prevent soap scum buildup!

This simple habit keeps your shower cleaner longer and makes deep cleaning easier.

Need help with your bathroom? We've got you covered!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #CleaningTips #BathroomCleaning #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #Tips`,

  19: `💡 Cleaning Tip of the Day 💡

Kitchen Tip: Clean your microwave by heating a bowl of water for 2 minutes - the steam makes it easy to wipe clean!

Quick tip for a sparkling kitchen!

Need help with your kitchen? We're here for you!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #CleaningTips #KitchenCleaning #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #Tips`,

  20: `🌸 Seasonal Deep Clean Special 🌸

Spring cleaning? We've got you covered!

Get 20% OFF our seasonal deep clean:
• Complete home refresh
• Deep cleaning all rooms
• Appliance deep clean
• Window cleaning

Perfect time for a fresh start!

Book now!

Link in bio 👆

#VelocityMaid #SeasonalCleaning #SpringCleaning #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #DeepClean`,

  21: `🎁 Referral Bonus - $25 OFF! 🎁

Refer a friend and you BOTH get $25 OFF your next cleaning!

It's that simple:
1. Share our service with a friend
2. They book their first clean
3. You both get $25 OFF!

Spread the word and save!

Link in bio 👆

#VelocityMaid #ReferralBonus #ReferAFriend #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #SaveMoney`,

  22: `✨ Ready for a Spotless Home? ✨

Book now and experience the VelocityMaid difference!

• Professional cleaners
• Satisfaction guaranteed
• Flexible scheduling
• Transparent pricing

Get 15% OFF your first clean!

Link in bio 👆

#VelocityMaid #BookNow #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #Spotless #CleanHome`,

  23: `⭐ Cleaner Spotlight ⭐

Meet our professional team! Trained, certified, and ready to serve you.

We're not just cleaners - we're your neighbors, committed to making your home spotless.

Book today and meet the team!

Link in bio 👆

#VelocityMaid #CleanerSpotlight #MeetTheTeam #ProfessionalCleaners #NewJersey #NJCleaning #HouseCleaning #Team`,

  24: `⭐ Love Our Service? ⭐

Leave us a Google review! Your feedback helps us serve you better and helps others find quality cleaning services.

We appreciate every review!

Review us on Google today!

Link in bio 👆

#VelocityMaid #GoogleReview #ReviewUs #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #Reviews`,

  25: `🍳 What's Included - Kitchen 🍳

Our kitchen cleaning includes:
• Countertops
• Appliances
• Sink & faucet
• Cabinets
• Microwave
• Stovetop

We make your kitchen sparkle!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #KitchenCleaning #WhatIncluded #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  26: `🚿 What's Included - Bathrooms 🚿

Our bathroom cleaning includes:
• Toilet
• Shower/Tub
• Mirrors
• Sink & counter
• Floors
• Fixtures

We sanitize and shine!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #BathroomCleaning #WhatIncluded #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  27: `🛏️ What's Included - Bedrooms 🛏️

Our bedroom cleaning includes:
• Dusting
• Vacuuming
• Bed making
• Mirrors
• Trash removal
• Baseboards

We make your bedroom a sanctuary!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #BedroomCleaning #WhatIncluded #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  28: `🛋️ What's Included - Living Room 🛋️

Our living room cleaning includes:
• Dusting
• Vacuuming
• Furniture polish
• Mirrors
• Trash removal
• Baseboards

We make your living space shine!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #LivingRoomCleaning #WhatIncluded #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning`,

  29: `⚡ FLASH SALE - 30% OFF! ⚡

Limited time only! Get 30% OFF your next cleaning!

Don't miss out - this offer won't last long!

Book now!

Link in bio 👆

#VelocityMaid #FlashSale #Sale #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #LimitedTime`,

  30: `📊 This Month at VelocityMaid 📊

We're proud to share:
• 150+ Homes Cleaned
• 98% Satisfaction Rate
• 4.9★ Average Rating
• 50+ Happy Customers

Thank you for trusting us with your homes!

Book your cleaning today!

Link in bio 👆

#VelocityMaid #MonthlySummary #Stats #ProfessionalCleaning #NewJersey #NJCleaning #HouseCleaning #ThankYou`,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const day = parseInt(searchParams.get('day') || '1');

    const caption = captions[day] || captions[1];

    return new NextResponse(caption, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="day${day}-caption.txt"`,
      },
    });
  } catch (error: any) {
    console.error('Generate caption error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate caption' },
      { status: 500 }
    );
  }
}

