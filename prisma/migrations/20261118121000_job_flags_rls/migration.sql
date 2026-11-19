-- Server-only flag ledger. No public, anon, or authenticated policies.
ALTER TABLE "job_flags" ENABLE ROW LEVEL SECURITY;
