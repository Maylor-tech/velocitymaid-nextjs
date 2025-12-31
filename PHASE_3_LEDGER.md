# Phase 3C: Payout Ledger Schema

## Overview

This schema implements an **append-only ledger** system for tracking cleaner balances and payouts. The design prevents double payouts and provides a complete audit trail.

## Core Concepts

### Append-Only Ledger
- **CleanerBalanceLedger** entries are never deleted or modified
- All balance changes are recorded as immutable entries
- Status can change (PENDING → POSTED → REVERSED) but entries remain

### Unique Constraint: Double-Payout Prevention
- `@@unique([jobId, type], map: "unique_credit_per_job")`
- Ensures a job can only be credited **once** in the ledger
- Prevents accidental duplicate payouts for the same job
- Note: `jobId` can be nullable, but the constraint still applies to non-null values

### Batch Processing Model
- **PayoutBatch**: Groups multiple transfers for weekly/periodic processing
- **PayoutTransfer**: Individual transfer to a cleaner within a batch
- Enables batch approval, processing, and reconciliation

## Schema Models

### CleanerBalanceLedger
**Purpose**: Track all balance changes (credits and debits) for cleaners.

**Key Fields**:
- `type`: CREDIT (earnings) or DEBIT (payout)
- `status`: PENDING → POSTED → REVERSED
- `amountCents`: Amount in cents (avoids floating-point issues)
- `jobId`: Links credit to source job (nullable for manual adjustments)
- `payoutTransferId`: Links debit to payout transfer (nullable for credits)

**Relations**:
- `cleaner` → User (required)
- `branch` → Branch (optional, for branch-specific tracking)
- `job` → Job (optional, for job-based credits)
- `payoutTransfer` → PayoutTransfer (optional, for payout debits)

**Indexes**:
- `[cleanerId, createdAt]`: Fast queries for cleaner balance history

### PayoutBatch
**Purpose**: Group transfers for weekly/periodic processing.

**Key Fields**:
- `periodStart` / `periodEnd`: Time window for this batch
- `status`: DRAFT → APPROVED → PROCESSING → COMPLETED/FAILED
- `createdByAdminId`: Admin who created the batch (nullable)

**Relations**:
- `transfers` → PayoutTransfer[] (one-to-many)

**Indexes**:
- `[periodStart, periodEnd]`: Fast queries for batch periods

### PayoutTransfer
**Purpose**: Individual transfer to a cleaner within a batch.

**Key Fields**:
- `amountCents`: Transfer amount in cents
- `stripePayoutId`: Stripe payout ID (nullable until sent)
- `status`: PENDING → PROCESSING → PAID/FAILED
- `failureReason`: Error message if transfer fails (nullable)

**Relations**:
- `batch` → PayoutBatch (required)
- `cleaner` → User (required)
- `branch` → Branch (optional)
- `ledgerEntries` → CleanerBalanceLedger[] (debits linked to this transfer)

**Indexes**:
- `[cleanerId, status]`: Fast queries for cleaner payout status

## Enums

### LedgerEntryType
- `CREDIT`: Money added to cleaner balance (e.g., job completion)
- `DEBIT`: Money removed from cleaner balance (e.g., payout)

### LedgerEntryStatus
- `PENDING`: Entry created but not yet posted
- `POSTED`: Entry is active and affects balance
- `REVERSED`: Entry was reversed (e.g., refund, dispute)

### PayoutBatchStatus
- `DRAFT`: Batch created but not approved
- `APPROVED`: Batch approved for processing
- `PROCESSING`: Batch being sent to Stripe
- `COMPLETED`: All transfers in batch completed
- `FAILED`: Batch processing failed

### PayoutTransferStatus
- `PENDING`: Transfer created but not sent
- `PROCESSING`: Transfer sent to Stripe, awaiting confirmation
- `PAID`: Transfer confirmed by Stripe
- `FAILED`: Transfer failed (see `failureReason`)

## Data Flow Example

1. **Job Completed** → Create `CleanerBalanceLedger` entry:
   - `type: CREDIT`
   - `status: POSTED`
   - `jobId: <job.id>`
   - `amountCents: <job.totalPrice * 100>`

2. **Weekly Batch Created** → Create `PayoutBatch`:
   - `status: DRAFT`
   - `periodStart/End: <week range>`

3. **Transfer Created** → Create `PayoutTransfer`:
   - `batchId: <batch.id>`
   - `status: PENDING`
   - `amountCents: <cleaner balance>`

4. **Debit Recorded** → Create `CleanerBalanceLedger` entry:
   - `type: DEBIT`
   - `status: POSTED`
   - `payoutTransferId: <transfer.id>`
   - `amountCents: <transfer amount>`

5. **Stripe Payout Sent** → Update `PayoutTransfer`:
   - `stripePayoutId: <stripe_id>`
   - `status: PROCESSING`

6. **Webhook Confirms** → Update `PayoutTransfer`:
   - `status: PAID`

## Safety Features

1. **Unique Constraint**: Prevents double-crediting the same job
2. **Cascade Deletes**: Related entries cleaned up if cleaner/job/batch deleted
3. **SetNull on Transfer Delete**: Ledger entries remain if transfer deleted (audit trail)
4. **Append-Only**: No deletes on ledger entries (immutable history)

## Phase 3C Scope

✅ **What This Phase Includes**:
- Schema definitions
- Database migrations
- Enum types
- Relations to existing models (User, Job, Branch)

❌ **What This Phase Does NOT Include**:
- Payout execution logic
- Stripe Connect integration
- UI components
- API endpoints
- Balance calculation functions

These will be implemented in subsequent phases.


