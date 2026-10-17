/**
 * Local-only FIN-001 permission and payment-path check.
 * Refuses any database that is not the throwaway server on 127.0.0.1.
 * Does not load production role passwords and does not call Stripe or email.
 */
const localUrl =
  'postgresql://postgres@127.0.0.1:55432/vm_restore_throwaway_20261017?sslmode=disable';

for (const key of [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_TIP_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'WHATSAPP_TOKEN',
  'WHATSAPP_ACCESS_TOKEN',
  'ADMIN_WEBHOOK_URL',
]) {
  delete process.env[key];
}
process.env.DATABASE_URL = localUrl;
process.env.DIRECT_URL = localUrl;

async function main() {
  const { prisma } = await import('../lib/prisma');
  const { recordInvoicePayment } = await import('../lib/invoices/invoiceService');

  const gate = await prisma.$queryRawUnsafe<
    Array<{ addr: string; port: string; listen: string; db: string; user: string; superuser: boolean }>
  >(
    `SELECT host(inet_server_addr()) AS addr,
            inet_server_port()::text AS port,
            current_setting('listen_addresses') AS listen,
            current_database() AS db,
            current_user AS user,
            (SELECT rolsuper FROM pg_roles WHERE rolname = current_user) AS superuser`
  );
  const session = gate[0];
  if (
    session.addr !== '127.0.0.1' ||
    session.port !== '55432' ||
    session.listen !== '127.0.0.1' ||
    session.db !== 'vm_restore_throwaway_20261017' ||
    session.user !== 'postgres'
  ) {
    throw new Error(`refusing session ${session.addr}:${session.port}/${session.db} as ${session.user}`);
  }

  const passwordState = await prisma.$queryRawUnsafe<
    Array<{ rolname: string; password_null: boolean; can_login: boolean }>
  >(
    `SELECT rolname, rolpassword IS NULL AS password_null, rolcanlogin AS can_login
     FROM pg_authid
     WHERE rolname IN ('anon','authenticated','authenticator','service_role')
     ORDER BY 1`
  );
  if (passwordState.some((role) => !role.password_null || role.can_login)) {
    throw new Error('a Supabase role has a password or can log in');
  }

  const policies = await prisma.$queryRawUnsafe<Array<{ policies: number }>>(
    `SELECT COUNT(*)::int AS policies FROM pg_policies WHERE schemaname = 'public'`
  );
  const paymentPolicies = await prisma.$queryRawUnsafe<
    Array<{ tablename: string; policyname: string; roles: string[] }>
  >(
    `SELECT tablename, policyname, roles
     FROM pg_policies
     WHERE schemaname = 'public' AND tablename IN ('Invoice', 'Job')
     ORDER BY 1, 2`
  );

  const anonVisible = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`GRANT SELECT ON "Invoice" TO anon`);
    await tx.$executeRawUnsafe(`SET LOCAL ROLE anon`);
    const rows = await tx.$queryRawUnsafe<Array<{ n: number }>>(
      `SELECT COUNT(*)::int AS n FROM "Invoice"`
    );
    return rows[0].n;
  });
  await prisma.$executeRawUnsafe(`REVOKE SELECT ON "Invoice" FROM anon`);

  const branch = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "Branch" LIMIT 1`
  );
  const admin = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `SELECT id FROM "User" WHERE role = 'ADMIN' LIMIT 1`
  );
  if (!branch[0]) throw new Error('no local branch to attach the fixture');

  const jobId = 'fin001-local-job';
  const invoiceId = 'fin001-local-inv';
  await prisma.$executeRawUnsafe(
    `DELETE FROM "AuditLog" WHERE "entityId" = $1`,
    invoiceId
  );
  await prisma.$executeRawUnsafe(`DELETE FROM "InvoicePayment" WHERE "invoiceId" = $1`, invoiceId);
  await prisma.$executeRawUnsafe(`DELETE FROM "Invoice" WHERE id = $1`, invoiceId);
  await prisma.$executeRawUnsafe(`DELETE FROM "Job" WHERE id = $1`, jobId);

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Job" (id, "branchId", status, "paymentStatus", "totalPrice", "quotedTotal", "amountPaid", "balanceDue")
     VALUES ($1, $2, 'RECEIVED', 'PENDING', 100, 100, 0, 100)`,
    jobId,
    branch[0].id
  );
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Invoice" (
       id, "invoiceNumber", "publicToken", "jobId", "clientName", "propertyAddress",
       "serviceType", subtotal, total, "amountPaid", "balanceDue", status, "updatedAt"
     ) VALUES (
       $1, 'VM-LOCAL-FIN001', 'fin001-local-token', $2, 'Local Validation', 'local',
       'validation', 100, 100, 0, 100, 'SENT', NOW()
     )`,
    invoiceId,
    jobId
  );

  const first = await recordInvoicePayment({
    invoiceId,
    amount: 40,
    paymentMethod: 'STRIPE',
    stripeSessionId: 'cs_fin001_local_only',
    actorId: admin[0]?.id ?? null,
    actorRole: 'ADMIN',
  });
  const retry = await recordInvoicePayment({
    invoiceId,
    amount: 40,
    paymentMethod: 'STRIPE',
    stripeSessionId: 'cs_fin001_local_only',
    actorId: admin[0]?.id ?? null,
    actorRole: 'ADMIN',
  });
  const finalPay = await recordInvoicePayment({
    invoiceId,
    amount: 60,
    paymentMethod: 'STRIPE',
    stripeSessionId: 'cs_fin001_local_only_2',
    actorId: admin[0]?.id ?? null,
    actorRole: 'ADMIN',
  });

  const invoice = await prisma.invoice.findUniqueOrThrow({ where: { id: invoiceId } });
  const job = await prisma.job.findUniqueOrThrow({ where: { id: jobId } });
  const payments = await prisma.invoicePayment.count({ where: { invoiceId } });
  const audits = await prisma.auditLog.findMany({
    where: { entityId: invoiceId },
    select: { action: true },
    orderBy: { createdAt: 'asc' },
  });

  const result = {
    session,
    policies: policies[0].policies,
    paymentPolicies,
    anonVisibleWithRls: anonVisible,
    firstDuplicate: first.duplicate,
    retryDuplicate: retry.duplicate,
    finalDuplicate: finalPay.duplicate,
    payments,
    invoiceStatus: invoice.status,
    invoicePaid: Number(invoice.amountPaid),
    invoiceDue: Number(invoice.balanceDue),
    jobStatus: job.status,
    jobPaymentStatus: job.paymentStatus,
    jobPaid: Number(job.amountPaid),
    jobDue: Number(job.balanceDue),
    jobPrice: Number(job.totalPrice),
    jobQuoted: Number(job.quotedTotal),
    audits: audits.map((row) => row.action),
  };

  const ok =
    result.policies === 154 &&
    result.anonVisibleWithRls === 0 &&
    result.firstDuplicate === false &&
    result.retryDuplicate === true &&
    result.finalDuplicate === false &&
    result.payments === 2 &&
    result.invoiceStatus === 'PAID' &&
    result.invoicePaid === 100 &&
    result.invoiceDue === 0 &&
    result.jobStatus === 'RECEIVED' &&
    result.jobPaymentStatus === 'PAID' &&
    result.jobPaid === 100 &&
    result.jobDue === 0 &&
    result.jobPrice === 100 &&
    result.jobQuoted === 100 &&
    result.audits.includes('INVOICE_PAYMENT_RECORDED') &&
    result.audits.includes('INVOICE_PAYMENT_IDEMPOTENT');

  await prisma.$executeRawUnsafe(`DELETE FROM "AuditLog" WHERE "entityId" = $1`, invoiceId);
  await prisma.$executeRawUnsafe(`DELETE FROM "InvoicePayment" WHERE "invoiceId" = $1`, invoiceId);
  await prisma.$executeRawUnsafe(`DELETE FROM "Invoice" WHERE id = $1`, invoiceId);
  await prisma.$executeRawUnsafe(`DELETE FROM "Job" WHERE id = $1`, jobId);
  await prisma.$disconnect();

  console.log(JSON.stringify({ ok, result }, null, 2));
  if (!ok) process.exit(4);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
