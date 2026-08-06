-- Enable Row-Level Security on all public tables and grant full access to
-- the "postgres" role (used by Prisma / service_role connections).
-- This blocks the Supabase anon key from reading or writing any table.

-- Catch-all: enable RLS on ALL public tables
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
  END LOOP;
END;
$$;

-- Allow the postgres role (Prisma server connections) unrestricted access.
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma_%'
  LOOP
    -- Drop if exists, then create (PG has no CREATE POLICY IF NOT EXISTS)
    BEGIN
      EXECUTE format('DROP POLICY "allow_postgres_full_access" ON public.%I;', tbl.tablename);
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    EXECUTE format(
      'CREATE POLICY "allow_postgres_full_access" ON public.%I FOR ALL TO postgres USING (true) WITH CHECK (true);',
      tbl.tablename
    );
  END LOOP;
END;
$$;

-- Also allow the service_role (Supabase service key) full access
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma_%'
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY "allow_service_role_full_access" ON public.%I;', tbl.tablename);
    EXCEPTION WHEN undefined_object THEN NULL;
    END;
    EXECUTE format(
      'CREATE POLICY "allow_service_role_full_access" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);',
      tbl.tablename
    );
  END LOOP;
END;
$$;
