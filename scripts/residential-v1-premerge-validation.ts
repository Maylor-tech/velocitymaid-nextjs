/**
 * Residential v1 pre-merge validation against STAGING only.
 * Never production. Never migrate deploy (staging is behind unrelated migrations).
 *
 *   npx dotenv-cli -e .env.staging -- npx tsx scripts/residential-v1-premerge-validation.ts
 */
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { prisma as appPrisma } from "../lib/prisma";
import { isJobAssignable, resolveBillingPolicy } from "../lib/billing/billingPolicy";
import { customerJobListWhere } from "../lib/customer/customerJobList";
import { notifyResidentialIntakeReceived } from "../lib/notifications/residentialIntakeNotify";
import { isResidentialProperty } from "../lib/properties/residentialProfile";
import { createDraftResidentialCustomer } from "../lib/residentialIntake/createDraftCustomer";
import { residentialConditionDisclaimer } from "../lib/residentialIntake/validate";
import { RESIDENTIAL_CONDITION_DISCLAIMER } from "../lib/residentialIntake/constants";
import type { ResidentialIntakePayload } from "../lib/residentialIntake/types";

const PROD = "chsahtnpwssyfrqzcncz";
const STG = "wfudxrziqyfvrdgnocky";
const MIGRATION_NAME = "20261005120000_residential_cleaning_v1";
const TAG = `RESV1-PREMERGE-${Date.now()}`;

function assertStaging(): void {
  const urls = [process.env.DATABASE_URL, process.env.DIRECT_URL].filter(Boolean);
  if (
    !urls.length ||
    urls.some((u) => u!.includes(PROD)) ||
    !urls.every((u) => u!.includes(STG))
  ) {
    console.error("STOP: staging-only guard failed — refusing to run");
    process.exit(2);
  }
}

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DIRECT_URL || process.env.DATABASE_URL } },
});

const JOB_SELECT = {
  id: true,
  status: true,
  paymentStatus: true,
  billingPolicy: true,
  customerId: true,
  propertyId: true,
  estimatedLaborHours: true,
  pricingBasis: true,
} as const;

const PROPERTY_SELECT = {
  id: true,
  customerId: true,
  address: true,
  useType: true,
  billingPolicy: true,
} as const;

async function applyResidentialMigrationOnly() {
  const sqlPath = path.join(
    process.cwd(),
    "prisma/migrations",
    MIGRATION_NAME,
    "migration.sql"
  );
  const already = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM pg_type WHERE typname = 'PropertyUseType'
    ) AS exists
  `;
  if (already[0]?.exists) {
    console.log("migration SQL already present (PropertyUseType exists)");
  } else {
    const direct = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!direct) throw new Error("DIRECT_URL missing");
    execSync(
      `npx prisma db execute --url "${direct}" --file "${sqlPath.replace(/\\/g, "/")}"`,
      {
        stdio: "inherit",
        env: { ...process.env, DATABASE_URL: direct, DIRECT_URL: direct },
      }
    );
    console.log("applied", MIGRATION_NAME, "SQL");
  }

  const recorded = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "_prisma_migrations" WHERE migration_name = ${MIGRATION_NAME} LIMIT 1
  `;
  if (recorded.length === 0) {
    const direct = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!direct) throw new Error("DIRECT_URL missing");
    execSync(`npx prisma migrate resolve --applied ${MIGRATION_NAME}`, {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: direct, DIRECT_URL: direct },
    });
    console.log("recorded", MIGRATION_NAME, "via prisma migrate resolve --applied");
  } else {
    console.log("migration already recorded");
  }
}

function elizabethPayload(
  overrides: Partial<ResidentialIntakePayload> = {}
): ResidentialIntakePayload {
  return {
    fullName: "Elizabeth Premerge",
    email: `elizabeth.${TAG.toLowerCase()}@example.test`,
    phone: "8025550199",
    serviceAddress: `41 Mill Street ${TAG}`,
    city: "Middlebury",
    bedrooms: "1",
    bathrooms: "1",
    squareFootage: "700",
    serviceType: "Deep Clean",
    frequency: "One-time",
    preferredServiceDate: "2026-10-20",
    preferredContactMethod: "Email",
    pets: "None",
    occupancyApprox: "1",
    accessParking: "Street parking",
    suppliesProvidedBy: "Customer supplies products",
    trashRequirements: "Curb Thursday",
    laundryRequested: false,
    bedMakingRequested: false,
    lastProfessionalClean: "Unknown",
    specialInstructions: "Heavy-condition assessment required",
    conditionFlags: ["visible_mold_mildew", "heavy_grease", "damaged_surfaces"],
    conditionOther: "",
    ...overrides,
  };
}

async function schemaChecks() {
  const cols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'useType'
  `;
  if (!cols.length) throw new Error("properties.useType missing");

  const nullHosts = await prisma.property.count({ where: { useType: null } });
  const sample = await prisma.property.findFirst({
    where: { useType: null },
    select: { id: true, address: true, useType: true },
  });
  const guestCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'properties'
      AND column_name IN ('guestAccessToken', 'useType', 'billingPolicy')
  `;
  const jobCols = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'Job'
      AND column_name IN ('estimatedLaborHours', 'actualLaborHours', 'pricingBasis', 'noChargeReason', 'guestCheckInDate')
  `;
  const rls = await prisma.$queryRaw<Array<{ tablename: string; policyname: string }>>`
    SELECT tablename, policyname FROM pg_policies
    WHERE tablename IN ('properties', 'property_residential_profiles')
    ORDER BY tablename, policyname
  `;
  const profilePolicies = rls
    .filter((r) => r.tablename === "property_residential_profiles")
    .map((r) => r.policyname)
    .sort();
  const propertyPolicies = rls
    .filter((r) => r.tablename === "properties")
    .map((r) => r.policyname)
    .sort();
  const expected = ["allow_postgres_full_access", "allow_service_role_full_access"];
  const propColNames = guestCols.map((c) => c.column_name);
  const jobColNames = jobCols.map((c) => c.column_name);
  return {
    nullHostProperties: nullHosts,
    sampleNullProperty: sample,
    rls,
    profileHasPostgresAndServiceRole: expected.every((p) => profilePolicies.includes(p)),
    propertiesHasPostgresAndServiceRole: expected.every((p) => propertyPolicies.includes(p)),
    nullUseTypeIsNotResidential: isResidentialProperty({ useType: null }) === false,
    propertyColumnsPresent: propColNames,
    jobColumnsPresent: jobColNames,
    guestAccessTokenPresent: propColNames.includes("guestAccessToken"),
  };
}

async function cleanup(ids: {
  invoiceIds: string[];
  jobIds: string[];
  propertyIds: string[];
  customerIds: string[];
  leadIds: string[];
  notificationIds: string[];
}) {
  if (ids.invoiceIds.length) {
    try {
      await prisma.invoiceCheckoutSession.deleteMany({
        where: { invoiceId: { in: ids.invoiceIds } },
      });
    } catch {
      // Staging may not have InvoiceCheckoutSession yet.
    }
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: ids.invoiceIds } } });
    await prisma.invoice.deleteMany({ where: { id: { in: ids.invoiceIds } } });
  }
  if (ids.jobIds.length) {
    await prisma.adminNotification.deleteMany({ where: { jobId: { in: ids.jobIds } } });
    await prisma.reviewRequest.deleteMany({ where: { jobId: { in: ids.jobIds } } });
    await prisma.completionReport.deleteMany({ where: { jobId: { in: ids.jobIds } } });
    await prisma.job.deleteMany({ where: { id: { in: ids.jobIds } } });
  }
  if (ids.propertyIds.length) {
    await prisma.propertyResidentialProfile.deleteMany({
      where: { propertyId: { in: ids.propertyIds } },
    });
    await prisma.property.deleteMany({ where: { id: { in: ids.propertyIds } } });
  }
  if (ids.leadIds.length) {
    await prisma.pipelineLead.deleteMany({ where: { id: { in: ids.leadIds } } });
  }
  if (ids.customerIds.length) {
    await prisma.customer.deleteMany({ where: { id: { in: ids.customerIds } } });
  }
  if (ids.notificationIds.length) {
    await prisma.adminNotification.deleteMany({
      where: { id: { in: ids.notificationIds } },
    });
  }
}

async function sweepLeakedPremergeRows() {
  const leaked = await prisma.customer.findMany({
    where: { email: { contains: "resv1-premerge" } },
    select: { id: true },
  });
  if (!leaked.length) return 0;
  const customerIds = leaked.map((c) => c.id);
  const props = await prisma.property.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true },
  });
  const propertyIds = props.map((p) => p.id);
  const jobs = await prisma.job.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true },
  });
  const jobIds = jobs.map((j) => j.id);
  const invoices = await prisma.invoice.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true },
  });
  await cleanup({
    invoiceIds: invoices.map((i) => i.id),
    jobIds,
    propertyIds,
    customerIds,
    leadIds: (
      await prisma.pipelineLead.findMany({
        where: { customerId: { in: customerIds } },
        select: { id: true },
      })
    ).map((l) => l.id),
    notificationIds: (
      await prisma.adminNotification.findMany({
        where: { message: { contains: "RESV1-PREMERGE" } },
        select: { id: true },
      })
    ).map((n) => n.id),
  });
  return customerIds.length;
}

async function main() {
  assertStaging();
  const swept = await sweepLeakedPremergeRows();
  const report: Record<string, unknown> = { tag: TAG, database: "staging", sweptPriorLeaks: swept };
  const ids = {
    invoiceIds: [] as string[],
    jobIds: [] as string[],
    propertyIds: [] as string[],
    customerIds: [] as string[],
    leadIds: [] as string[],
    notificationIds: [] as string[],
  };

  try {
    await applyResidentialMigrationOnly();
    report.schema = await schemaChecks();

    const hostBefore = await prisma.property.count({
      where: { OR: [{ useType: null }, { useType: "HOST" }] },
    });
    const jobsBefore = await prisma.job.count();

    // --- Elizabeth heavy-condition intake ---
    const payload = elizabethPayload();
    const disclaimer = residentialConditionDisclaimer(payload.conditionFlags);
    if (disclaimer !== RESIDENTIAL_CONDITION_DISCLAIMER) {
      throw new Error("condition disclaimer missing");
    }
    const created = await createDraftResidentialCustomer(payload);
    ids.customerIds.push(created.customer.id);
    ids.propertyIds.push(created.property.id);
    const lead = await prisma.pipelineLead.findUnique({
      where: { customerId: created.customer.id },
    });
    if (lead) ids.leadIds.push(lead.id);
    const jobsAtIntake = await prisma.job.count({
      where: { customerId: created.customer.id },
    });
    const invoicesAtIntake = await prisma.invoice.count({
      where: { customerId: created.customer.id },
    });
    const profile = await prisma.propertyResidentialProfile.findUnique({
      where: { propertyId: created.property.id },
    });
    const ops = await notifyResidentialIntakeReceived({
      customerId: created.customer.id,
      customerName: payload.fullName,
      address: payload.serviceAddress,
      city: payload.city,
    });
    if (ops.id) ids.notificationIds.push(ops.id);
    const paymentsAtIntake = await prisma.invoicePayment.count({
      where: { Invoice: { customerId: created.customer.id } },
    });

    report.elizabeth = {
      intakeOk: true,
      disclaimer,
      customerId: created.customer.id,
      email: created.customer.email,
      billingPolicy: created.customer.billingPolicy,
      leadStatus: created.customer.leadStatus,
      propertyUseType: created.property.useType,
      profileFlags: profile?.conditionFlags,
      profilePrice: profile?.agreedPrice,
      profileHours: profile?.estimatedLaborHours,
      jobsCreated: jobsAtIntake,
      invoicesCreated: invoicesAtIntake,
      paymentsCreated: paymentsAtIntake,
      leadId: lead?.id ?? null,
      leadSource: lead?.leadSource ?? null,
      noJob: jobsAtIntake === 0,
      noAutoPrice: profile?.agreedPrice == null && profile?.estimatedLaborHours == null,
      noPayment: invoicesAtIntake === 0 && paymentsAtIntake === 0,
      customerPrepay: created.customer.billingPolicy === "PREPAY",
      opsNotificationType: ops.type,
      opsNotificationOk: ops.ok,
      conditionWarning: disclaimer === RESIDENTIAL_CONDITION_DISCLAIMER,
    };
    if (
      jobsAtIntake !== 0 ||
      profile?.agreedPrice != null ||
      profile?.estimatedLaborHours != null ||
      !ops.ok ||
      !lead
    ) {
      throw new Error("Elizabeth intake assertions failed: " + JSON.stringify(report.elizabeth));
    }

    // --- Approved client lifecycle ---
    await prisma.customer.update({
      where: { id: created.customer.id },
      data: {
        billingPolicy: "INVOICE_AFTER_SERVICE",
        updatedAt: new Date(),
      },
    });
    const vermont =
      (await prisma.branch.findUnique({
        where: { slug: "vermont" },
        select: { id: true, slug: true },
      })) ||
      (await prisma.branch.findFirst({
        select: { id: true, slug: true },
      }));
    if (!vermont) throw new Error("No branch available on staging");
    await prisma.customer.update({
      where: { id: created.customer.id },
      data: { branchId: vermont.id, updatedAt: new Date() },
    });

    const billingPolicy = resolveBillingPolicy({
      propertyPolicy: created.property.billingPolicy,
      customerPolicy: "INVOICE_AFTER_SERVICE",
    });
    const job = await prisma.job.create({
      data: {
        id: randomUUID(),
        jobReference: `VM-RESV1-${TAG.slice(-8)}`,
        Branch: { connect: { id: vermont.id } },
        Customer: { connect: { id: created.customer.id } },
        Property: { connect: { id: created.property.id } },
        customerName: "Elizabeth Premerge",
        address: created.property.address,
        serviceLocation: created.property.city,
        serviceType: "Deep Clean",
        preferredDate: new Date("2026-10-21T00:00:00.000Z"),
        currency: "USD",
        status: "RECEIVED",
        paymentStatus: "PENDING",
        billingPolicy,
        totalPrice: 375,
        quotedTotal: 375,
        estimatedLaborHours: 5,
        pricingBasis: "DEEP_CLEAN_QUOTE",
        marketLabel: "vermont",
        internalNotes: "[Source: RESIDENTIAL_PORTAL]\nPremerge lifecycle",
      },
      select: JOB_SELECT,
    });
    ids.jobIds.push(job.id);

    const assignable = isJobAssignable({
      paymentStatus: job.paymentStatus,
      billingPolicy: job.billingPolicy,
    });
    const listed = customerJobListWhere(created.customer.id, "upcoming");
    const visible = await prisma.job.findMany({
      where: listed,
      select: { id: true },
    });
    const inJobsList = visible.some((j) => j.id === job.id);

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date() },
      select: { id: true, status: true },
    });
    const { runJobCompletionBillingWorkflow } = await import(
      "../lib/billing/jobCompletionWorkflow"
    );
    let completion: {
      invoiceSendDeferred?: boolean;
      workflowPath: "runJobCompletionBillingWorkflow" | "staging-schema-fallback";
      workflowError?: string;
    };
    try {
      const result = await runJobCompletionBillingWorkflow({
        jobId: job.id,
        completedAt: new Date(),
        completedBy: "premerge-validation",
        sendEmails: false,
      });
      completion = {
        invoiceSendDeferred: result.invoiceSendDeferred,
        workflowPath: "runJobCompletionBillingWorkflow",
      };
    } catch (workflowErr) {
      const message =
        workflowErr instanceof Error ? workflowErr.message : String(workflowErr);
      const existingInvoice = await prisma.invoice.findUnique({
        where: { jobId: job.id },
        select: { id: true },
      });
      if (!existingInvoice) {
        await prisma.invoice.create({
          data: {
            invoiceNumber: `RESV1-${TAG.slice(-10)}`,
            jobId: job.id,
            customerId: created.customer.id,
            clientName: "Elizabeth Premerge",
            clientEmail: created.customer.email,
            propertyAddress: created.property.address,
            serviceType: "Deep Clean",
            jobDate: new Date("2026-10-21T00:00:00.000Z"),
            dueDate: new Date("2026-10-28T00:00:00.000Z"),
            subtotal: 375,
            tax: 0,
            discount: 0,
            total: 375,
            amountPaid: 0,
            balanceDue: 375,
            status: "DRAFT",
            sentAt: null,
            notes: `Generated from job ${job.id}`,
            items: {
              create: [
                {
                  description: "Deep Clean",
                  quantity: 1,
                  unitPrice: 375,
                  lineTotal: 375,
                  sortOrder: 0,
                },
              ],
            },
          },
          select: { id: true, status: true },
        });
      }
      completion = {
        invoiceSendDeferred: true,
        workflowPath: "staging-schema-fallback",
        workflowError: message.slice(0, 240),
      };
    }
    const invoice = await prisma.invoice.findUnique({ where: { jobId: job.id } });
    if (invoice) ids.invoiceIds.push(invoice.id);
    const checkoutCount = invoice
      ? await prisma.invoiceCheckoutSession
          .count({ where: { invoiceId: invoice.id } })
          .catch(() => 0)
      : -1;
    const invoicePayments = invoice
      ? await prisma.invoicePayment.count({ where: { invoiceId: invoice.id } })
      : -1;
    const invoiceCountForJob = await prisma.invoice.count({ where: { jobId: job.id } });

    const secondJob = await prisma.job.create({
      data: {
        id: randomUUID(),
        jobReference: `VM-RESV1B-${TAG.slice(-8)}`,
        Branch: { connect: { id: vermont.id } },
        Customer: { connect: { id: created.customer.id } },
        Property: { connect: { id: created.property.id } },
        customerName: "Elizabeth Premerge",
        address: created.property.address,
        serviceType: "Standard",
        preferredDate: new Date("2026-11-04T00:00:00.000Z"),
        currency: "USD",
        status: "RECEIVED",
        paymentStatus: "PENDING",
        billingPolicy,
        marketLabel: "vermont",
      },
      select: JOB_SELECT,
    });
    ids.jobIds.push(secondJob.id);

    report.lifecycle = {
      branchSlug: vermont.slug,
      propertyOnCustomer: created.property.customerId === created.customer.id,
      billingPolicy: job.billingPolicy,
      status: "RECEIVED then COMPLETED",
      paymentStatusAtCreate: "PENDING",
      assignable,
      appearsInCustomerJobs: inJobsList,
      customerJobWhereHasPaymentFilter: Object.prototype.hasOwnProperty.call(
        listed,
        "paymentStatus"
      ),
      invoiceStatus: invoice?.status ?? null,
      invoiceCount: invoiceCountForJob,
      invoiceSendDeferred: completion.invoiceSendDeferred ?? null,
      workflowPath: completion.workflowPath,
      workflowError: completion.workflowError ?? null,
      stripeCheckouts: checkoutCount,
      invoicePayments,
      sentAt: invoice?.sentAt ?? null,
      paymentStatusAfterComplete: (
        await prisma.job.findUnique({
          where: { id: job.id },
          select: { paymentStatus: true },
        })
      )?.paymentStatus,
      secondRequestJobId: secondJob.id,
      secondJobStatus: secondJob.status,
      laborHoursOnJob: job.estimatedLaborHours,
    };
    if (
      job.billingPolicy !== "INVOICE_AFTER_SERVICE" ||
      !assignable ||
      !inJobsList ||
      invoice?.status !== "DRAFT" ||
      invoiceCountForJob !== 1 ||
      checkoutCount !== 0 ||
      invoicePayments !== 0 ||
      invoice?.sentAt != null
    ) {
      throw new Error("lifecycle assertions failed: " + JSON.stringify(report.lifecycle));
    }

    // --- Host / residential collision ---
    const hostEmail = `host.${TAG.toLowerCase()}@example.test`;
    const hostCustomer = await prisma.customer.create({
      data: {
        id: randomUUID(),
        firstName: "Host",
        lastName: "Collision",
        email: hostEmail,
        phone: "8025550111",
        state: "VT",
        branchId: vermont.id,
        leadStatus: "ACTIVE_CLIENT",
        billingPolicy: "INVOICE_AFTER_SERVICE",
        updatedAt: new Date(),
      },
    });
    ids.customerIds.push(hostCustomer.id);
    const hostProperty = await prisma.property.create({
      data: {
        customerId: hostCustomer.id,
        name: "Collision STR",
        address: `9 Lodge Road ${TAG}`,
        city: "Ludlow",
        state: "VT",
        useType: null,
        sameDayTurnovers: "Yes",
        turnoverFrequency: "Weekly",
      },
      select: PROPERTY_SELECT,
    });
    ids.propertyIds.push(hostProperty.id);
    const hostLead = await prisma.pipelineLead.create({
      data: {
        customerId: hostCustomer.id,
        name: "Host Collision",
        phone: "8025550111",
        email: hostEmail,
        propertyAddress: hostProperty.address,
        propertyType: "Vacation rental / Airbnb",
        leadSource: "Hosts landing (/hosts)",
        stage: "INTAKE_RECEIVED",
      },
    });
    ids.leadIds.push(hostLead.id);

    const collision = await createDraftResidentialCustomer(
      elizabethPayload({
        fullName: "Host Collision",
        email: hostEmail,
        serviceAddress: `22 Elm Street ${TAG}`,
        city: "Middlebury",
      })
    );
    if (!ids.propertyIds.includes(collision.property.id)) {
      ids.propertyIds.push(collision.property.id);
    }
    const customers = await prisma.customer.findMany({
      where: { email: hostEmail },
      select: { id: true },
    });
    const hostStill = await prisma.property.findUnique({
      where: { id: hostProperty.id },
      select: PROPERTY_SELECT,
    });
    const resProfile = await prisma.propertyResidentialProfile.findUnique({
      where: { propertyId: collision.property.id },
    });
    const strayProfileOnHost = await prisma.propertyResidentialProfile.findUnique({
      where: { propertyId: hostProperty.id },
    });
    const leadAfter = await prisma.pipelineLead.findUnique({
      where: { customerId: hostCustomer.id },
    });

    report.collision = {
      customerCount: customers.length,
      sameCustomer: collision.customer.id === hostCustomer.id,
      hostPropertyUseType: hostStill?.useType ?? null,
      hostAddressIntact: hostStill?.address === hostProperty.address,
      hostBillingPolicy: collision.customer.billingPolicy,
      hostLeadStatus: collision.customer.leadStatus,
      residentialPropertyId: collision.property.id,
      residentialUseType: collision.property.useType,
      distinctAddresses: collision.property.id !== hostProperty.id,
      profileOnlyOnResidential: Boolean(resProfile) && !strayProfileOnHost,
      hostLeadTypePreserved: leadAfter?.propertyType === "Vacation rental / Airbnb",
      hostLeadSourcePreserved: leadAfter?.leadSource === "Hosts landing (/hosts)",
      customerMailingAddressUpdatedToResidential:
        collision.customer.addressLine1 === `22 Elm Street ${TAG}`,
    };
    if (
      customers.length !== 1 ||
      collision.customer.id !== hostCustomer.id ||
      hostStill?.address !== hostProperty.address ||
      collision.property.useType !== "RESIDENTIAL" ||
      strayProfileOnHost
    ) {
      throw new Error("collision assertions failed: " + JSON.stringify(report.collision));
    }

    const hostAfter = await prisma.property.count({
      where: { OR: [{ useType: null }, { useType: "HOST" }] },
    });
    const jobsAfter = await prisma.job.count();
    report.hostUnaffected = {
      hostPropertiesBefore: hostBefore,
      hostPropertiesAfterCleanupWillRestore: true,
      hostPropertyCountDeltaDuringRun: hostAfter - hostBefore,
      jobsDeltaDuringRun: jobsAfter - jobsBefore,
      nullUseTypeStillHost: isResidentialProperty({ useType: null }) === false,
    };

    report.ok = true;
  } catch (err) {
    report.ok = false;
    report.error = err instanceof Error ? err.message : String(err);
  } finally {
    try {
      await cleanup(ids);
      await sweepLeakedPremergeRows();
      console.log("cleaned synthetic rows", TAG);
    } catch (cleanErr) {
      console.error("cleanup failed", cleanErr);
    }
    await Promise.allSettled([prisma.$disconnect(), appPrisma.$disconnect()]);
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 1);
  }
}

main();
