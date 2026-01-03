# VelocityMaid V1: Production Deployment & Launch Checklist

**Document Version:** 1.0  
**Date:** January 2, 2026  
**Status:** Final, For Founder Use  
**Audience:** Founder, Lead Engineer

---

## Overview

This checklist provides the final steps to safely deploy and launch the hardened VelocityMaid V1 build. It is designed to be executed sequentially by the founder or lead engineer to ensure a stable, secure, and production-ready launch for demos and pilot onboarding. **Do not proceed to the next phase until all items in the current phase are complete.**

---

## Phase 1: Pre-Deployment & Configuration Lock

This phase ensures that the environment is secure and the codebase is frozen before deployment.

| Status | Item | Description & Action |
| :--- | :--- | :--- |
| **[ ]** | **1.1. Lock `main` Branch** | **Action:** In your GitHub repository settings, protect the `main` branch. Require pull request reviews before merging and disallow force pushes. No new features or non-critical bug fixes are to be merged until after the V1 launch. |
| **[ ]** | **1.2. Finalize Environment Variables** | **Action:** In your Vercel project settings (for the Production environment), verify that all required environment variables are present and locked. Create a definitive list and double-check each one. |
| | `DATABASE_URL` | Should point to the **production** Supabase instance. |
| | `DIRECT_URL` | Should be the direct connection URL for Prisma migrations. |
| | `RESEND_API_KEY` | Must be a production key, not a test key. |
| | `NEXTAUTH_SECRET` | A securely generated secret for session encryption. |
| | `NEXTAUTH_URL` | The canonical production URL (e.g., `https://app.velocitymaid.com`). |
| **[ ]** | **1.3. Lock Database Schema** | **Action:** Confirm that no new database migrations are pending. The schema is now frozen for V1. Any required changes must go through a formal review process. Run `npx prisma migrate status` to confirm. |
| **[ ]** | **1.4. Backup Production Database** | **Action:** Before deploying, take a full manual backup of the production database. Although it may have minimal data, this establishes a critical pre-launch baseline. |

---

## Phase 2: Vercel Production Deployment

This phase covers the build and deployment process on Vercel.

| Status | Item | Description & Action |
| :--- | :--- | :--- |
| **[ ]** | **2.1. Trigger Production Deployment** | **Action:** From the locked `main` branch, trigger a new deployment to the Production environment in Vercel. Do not use a preview or branch deployment. |
| **[ ]** | **2.2. Monitor Build Logs** | **Action:** Watch the build logs in real-time. The build must complete successfully with no errors. Pay close attention to Prisma client generation and `runtime = 'nodejs'` warnings. |
| **[ ]** | **2.3. Assign Production Domain** | **Action:** Once the build is complete, ensure it is assigned to your production domain (e.g., `app.velocitymaid.com`). |
| **[ ]** | **2.4. Initial Smoke Test** | **Action:** Immediately after deployment, perform a quick 5-minute smoke test: <br> 1. Can you access the login page? <br> 2. Can you log in as the admin user? <br> 3. Does the Command Center load without errors? <br> 4. Do the public-facing pages (e.g., Contact, Investor) load correctly? |

---

## Phase 3: Production Readiness & Validation

This phase validates the core functionality of the live production system.

| Status | Item | Description & Action |
| :--- | :--- | :--- |
| **[ ]** | **3.1. Validate Email Sending** | **Action:** Use the live application to trigger a transactional email. <br> 1. Submit a message via the public contact form. <br> 2. As an admin, reply to that message. <br> 3. **Confirm:** The email is delivered to the recipient's inbox (check spam). <br> 4. **Confirm:** The email's "From" address and branding are correct. |
| **[ ]** | **3.2. Verify Cron Job Safety** | **Action:** If any cron jobs are configured in `vercel.json`, verify their schedule and purpose. For V1, it is recommended to have **no active cron jobs** unless absolutely essential. Disable any non-critical scheduled tasks to ensure stability. |
| **[ ]** | **3.3. Demo Data Handling Strategy** | **Action:** Decide on your data strategy. **Recommendation:** Use the live production environment for all demos and pilots. Do not create a separate "demo" environment. <br> 1. **For Demos:** Use a specific, identifiable demo user (e.g., `demo.user@velocitymaid.com`) to create records. Clean up these records manually after the demo. <br> 2. **For Pilots:** Onboard real pilot partners directly into the production system. Their data is real data. |
| **[ ]** | **3.4. Full End-to-End Test** | **Action:** Using the `TEST_COMMAND_CENTER.md` checklist, perform a full end-to-end test of the Admin Inbox and Command Center functionality on the live production system. Every single item on that checklist must pass. |

---

## Phase 4: Final Go/No-Go Checklist

This is the final decision gate before announcing the launch or beginning outreach. Answer each question honestly. If the answer to any question is "No," **do not proceed.**

| Go/No-Go | Question |
| :--- | :--- |
| **[ ] Go / [ ] No-Go** | **1. Stability:** Has the production deployment been stable for at least 24 hours with no errors reported in Vercel logs? |
| **[ ] Go / [ ] No-Go** | **2. Core Loop:** Does the primary user flow (Contact → Triage → Reply → Archive) work flawlessly and as documented? |
| **[ ] Go / [ ] No-Go** | **3. Email:** Are all transactional emails (replies, access grants) being delivered reliably and styled correctly? |
| **[ ] Go / [ ] No-Go** | **4. Security:** Are all environment variables locked, the `main` branch protected, and the database secured? |
| **[ ] Go / [ ] No-Go** | **5. Confidence:** As the founder, are you confident that the platform is ready to be shown to your most important investors and first pilot partners? |

---

### Decision

- If all five answers are **"Go,"** you are officially **cleared for V1 launch**. You can begin investor demos and pilot partner onboarding.
- If even one answer is **"No-Go,"** **halt the launch**. Identify the root cause, deploy a fix, and restart this entire checklist from Phase 1. Do not compromise on quality or stability at this stage.

**Signed:** _________________________ (Founder/Lead Engineer)

**Date:** _________________________

