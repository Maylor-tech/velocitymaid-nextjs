-- Lock public tables that were created after the July 2026 catch-all.
-- Idempotent: a missing table is skipped, and an existing policy is left alone.
-- Does not force row-level security. No policies for anon, authenticated, or public.
-- postgres and service_role keep full access, matching the package-table lock.

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'WorkerAgreement',
    'WorkerDocument',
    '_prisma_migrations',
    'api_rate_limit_buckets',
    'guest_tip_authorizations',
    'invoice_checkout_sessions',
    'property_photo_slots',
    'service_feedback',
    'tip_allocations',
    'tip_webhook_events'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = tbl
          AND policyname = 'allow_postgres_full_access'
      ) THEN
        EXECUTE format(
          'CREATE POLICY "allow_postgres_full_access" ON public.%I FOR ALL TO postgres USING (true) WITH CHECK (true)',
          tbl
        );
      END IF;
      IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = tbl
          AND policyname = 'allow_service_role_full_access'
      ) THEN
        EXECUTE format(
          'CREATE POLICY "allow_service_role_full_access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
          tbl
        );
      END IF;
    END IF;
  END LOOP;
END $$;
