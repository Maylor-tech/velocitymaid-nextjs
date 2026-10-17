# Vault restore limitation

This is a disaster-recovery note. It is not a FIN-001 release requirement, and it does not change payment behavior.

The 2026-10-17 logical dump includes the `vault` schema and the `supabase_vault` extension. A vanilla PostgreSQL 17.6 server cannot create that extension. On the localhost restore, three statements failed:

- `CREATE EXTENSION supabase_vault` because the extension files are not installed
- `COMMENT ON EXTENSION supabase_vault` because the extension does not exist
- `COPY vault.secrets` because the extension never created the table

`vault.secrets` had 0 rows in the snapshot, so no vault secret values were available to restore. FIN-001 does not read or write that table.

A complete disaster recovery still needs a Supabase Vault-capable target, or a decision that Vault is unused. Storage object bytes, role passwords, ownership, and grants are separate recovery gaps and are also outside the FIN-001 release.
