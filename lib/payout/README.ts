/**
 * PHASE 3 — CLEANER PAYOUT ENGINE
 * ------------------------------
 * 
 * PRINCIPLE: Money moves only after work is verified, paid, and cleared.
 * 
 * ============================================================================
 * 1️⃣ PAYOUT ELIGIBILITY (NON-NEGOTIABLE)
 * ============================================================================
 * 
 * A job is eligible for payout only if ALL conditions are met:
 * 
 * ✅ Job-level requirements:
 *   - job.status === "COMPLETED"
 *   - job.paymentStatus === "PAID"
 *   - job.assignedCleanerId !== null
 *   - job.completedAt IS NOT NULL
 * 
 * ✅ Cleaner-level requirements:
 *   - Cleaner is APPROVED
 *   - Cleaner is ACTIVE
 *   - Cleaner has Stripe Connect account created
 *   - Stripe account charges_enabled === true
 *   - Stripe account payouts_enabled === true
 * 
 * 🚫 If any condition fails → NO PAYOUT
 * 
 * ============================================================================
 * 2️⃣ PAYOUT CALCULATION MODEL
 * ============================================================================
 * 
 * 💰 Base Formula:
 *   cleanerGross = job.totalPrice
 *   platformFee = cleanerGross × PLATFORM_FEE_PERCENT
 *   cleanerNet = cleanerGross − platformFee
 * 
 * 🔧 Defaults (configurable):
 *   - PLATFORM_FEE_PERCENT = 0.25 (25%)
 *   - Stored in env or config, not hardcoded
 * 
 * ⚠️ Taxes, tips, bonuses → Phase 4 (not now)
 * 
 * ============================================================================
 * 3️⃣ PAYOUT SCHEDULE (SAFE + SCALABLE)
 * ============================================================================
 * 
 * 🗓️ Default cadence: WEEKLY
 *   - Cutoff: Sunday 11:59 PM
 *   - Processing: Monday 6:00 AM
 *   - Payout arrival: 1–3 business days (Stripe)
 * 
 * 🧮 Minimum threshold:
 *   - $50 USD minimum
 *   - If balance < $50 → roll over to next week
 * 
 * 🛑 Safety hold:
 *   - 48-hour hold after job completion
 *   - Prevents disputes, refunds, chargebacks
 * 
 * ============================================================================
 * 4️⃣ PAYOUT STATES (LEDGER MODEL)
 * ============================================================================
 * 
 * Each payout record has a lifecycle:
 * 
 * PayoutStatus =
 *   | "PENDING"     // Eligible but not batched
 *   | "SCHEDULED"   // Included in payout batch
 *   | "PROCESSING"  // Sent to Stripe
 *   | "PAID"        // Confirmed by Stripe
 *   | "FAILED"      // Stripe error
 * 
 * 🔒 Once PAID, it is immutable
 * 
 * ============================================================================
 * 5️⃣ SOURCE OF TRUTH (VERY IMPORTANT)
 * ============================================================================
 * 
 * Item                  | Source
 * ----------------------|------------------
 * Job completion        | Job table
 * Earnings              | Derived from Jobs
 * Payout eligibility    | Phase 3 logic
 * Payout execution      | Stripe
 * Audit history         | AuditLog
 * 
 * 🚫 Never calculate payouts from UI totals
 * 
 * ============================================================================
 * 6️⃣ DISPUTES & FAILURES (EDGE SAFETY)
 * ============================================================================
 * 
 * ❌ If payment is refunded:
 *   - Job becomes ineligible
 *   - If payout not sent → removed
 *   - If payout already sent → flagged for recovery
 * 
 * ❌ If Stripe payout fails:
 *   - Status → FAILED
 *   - Retry manually (admin-only)
 *   - Cleaner notified
 * 
 * ============================================================================
 * 7️⃣ WHAT PHASE 3 WILL NOT DO
 * ============================================================================
 * 
 * ❌ No instant payouts
 * ❌ No partial payouts
 * ❌ No tips
 * ❌ No bonuses
 * ❌ No earnings edits
 * ❌ No cleaner self-withdrawals
 * 
 * This keeps the system stable, legal, and predictable.
 * 
 * ============================================================================
 * 8️⃣ FILES THAT WILL ENFORCE THIS
 * ============================================================================
 * 
 * lib/payout/eligibility.ts    - Eligibility checks
 * lib/payout/calculation.ts    - Payout calculations
 * lib/payout/scheduler.ts      - Weekly batch processing
 * app/api/admin/payouts/run    - Admin payout execution
 * app/api/cleaner/payouts      - Cleaner payout history
 * 
 * All guarded by: assertPhaseUnlocked("PHASE_3_PAYOUT_ENGINE")
 * 
 * ============================================================================
 * PHASE 3B — STRIPE CONNECT (CLEANER PAYOUT ONBOARDING)
 * ============================================================================
 * 
 * Goal: Allow cleaners to receive payouts only after they are verified,
 * approved, and compliant — without risking your Stripe account.
 * 
 * 1️⃣ STRIPE CONNECT MODEL
 * ✅ REQUIRED: Stripe Connect — Express Accounts
 * 
 * Why Express (not Standard / Custom):
 *   - Stripe handles: KYC (ID verification), Bank details, Tax forms (W-9 / W-8)
 *   - You control: When payouts are allowed, When jobs become payable
 *   - Lowest compliance risk for VelocityMaid
 * 
 * 🚫 Do NOT use: Custom (too much liability), Standard (too little control)
 * 
 * 2️⃣ CLEANER STRIPE LIFECYCLE (AUTHORITATIVE)
 * 
 * State Flow (no skipping, no shortcuts):
 *   APPLIED
 *   → APPROVED
 *   → STRIPE_ACCOUNT_CREATED
 *   → STRIPE_ONBOARDING_REQUIRED
 *   → STRIPE_VERIFIED
 *   → PAYOUTS_ENABLED
 * 
 * 3️⃣ REQUIRED STRIPE FIELDS (MUST EXIST)
 * 
 * Stored on User (Cleaner):
 *   - stripeAccountId: string | null
 *   - stripeChargesEnabled: boolean
 *   - stripePayoutsEnabled: boolean
 *   - stripeDetailsSubmitted: boolean
 * 
 * ⚠️ These are READ-ONLY reflections of Stripe state
 *    Stripe is the source of truth
 * 
 * 4️⃣ ONBOARDING FLOW
 * 
 * Cleaner Experience:
 *   1. Cleaner logs in
 *   2. Sees banner: "Complete payout setup to receive earnings"
 *   3. Clicks "Set up payouts"
 *   4. Redirected to Stripe-hosted onboarding
 *   5. Completes: Identity, Bank account, Tax info
 *   6. Returns to VelocityMaid
 * 
 * System Behavior:
 *   1. Stripe sends webhook
 *   2. System updates: stripeChargesEnabled, stripePayoutsEnabled, stripeDetailsSubmitted
 *   3. Cleaner status becomes PAYOUT_READY
 * 
 * 5️⃣ HARD PAYOUT GATES (VERY IMPORTANT)
 * 
 * Even if a cleaner has completed jobs:
 * ❌ NO PAYOUT unless:
 *   - stripeAccountId !== null
 *   - stripeChargesEnabled === true
 *   - stripePayoutsEnabled === true
 * 
 * This protects: You, Your Stripe account, The platform
 * 
 * 6️⃣ WHAT PHASE 3B WILL NOT DO
 * 
 * ❌ No payouts yet
 * ❌ No earnings edits
 * ❌ No manual bank entry
 * ❌ No Stripe dashboard embedding
 * ❌ No instant verification
 * 
 * This phase is only onboarding + verification
 * 
 * 7️⃣ FILES THAT WILL BE CREATED
 * 
 * lib/stripe/connect.ts              - Stripe Connect utilities
 * app/api/cleaner/stripe/onboard      - Onboarding initiation
 * app/api/webhooks/stripe             - Webhook handler for Stripe events
 * 
 * ============================================================================
 * LOCKED PHASES (DO NOT MODIFY)
 * ============================================================================
 * 
 * - Phase 1: Assignment logic
 * - Phase 2A: Payment gating
 * - Phase 2B: Audit logging
 * - Phase 2C: Earnings calculations (read-only)
 */
export const PHASE_3_PAYOUT_SCOPE = true;

