import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  evaluateFinishPhotos,
  finishPhotoBlockMessage,
  resolvePropertyPhotoSlots,
} from "@/lib/photos/propertyPhotoSlots";
import { loadJobPhotoChecklist } from "@/lib/photos/jobPhotoChecklist";

const envPath = path.join(process.cwd(), ".env.local");
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!m) continue;
  let val = m[2];
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }
  process.env[m[1]] = val;
}

const prisma = new PrismaClient();
const slots = resolvePropertyPhotoSlots([], 1, 1);
const afterAll = slots
  .filter((s) => s.required)
  .map((s) => ({ slotKey: s.key, category: "AFTER" }));

async function main() {
  const cases = [
    {
      name: "null-arrival-blocks",
      block: evaluateFinishPhotos({
        arrivalCondition: null,
        slots,
        photos: [],
      }),
    },
    {
      name: "normal-missing-after",
      block: evaluateFinishPhotos({
        arrivalCondition: "NORMAL",
        slots,
        photos: [],
      }),
    },
    {
      name: "normal-complete",
      block: evaluateFinishPhotos({
        arrivalCondition: "NORMAL",
        slots,
        photos: afterAll,
      }),
    },
    {
      name: "issues-needs-before",
      block: evaluateFinishPhotos({
        arrivalCondition: "ISSUES",
        slots,
        photos: afterAll,
      }),
    },
    {
      name: "issues-complete",
      block: evaluateFinishPhotos({
        arrivalCondition: "ISSUES",
        slots,
        photos: [{ slotKey: null, category: "BEFORE" }, ...afterAll],
      }),
    },
  ];

  const job = await prisma.job.findFirst({
    where: { customerName: "WR2 Host" },
    select: { id: true, status: true, arrivalCondition: true },
  });

  let liveChecklist: Awaited<ReturnType<typeof loadJobPhotoChecklist>> = null;
  if (job) {
    await prisma.job.update({
      where: { id: job.id },
      data: {
        status: "IN_PROGRESS",
        arrivalCondition: null,
        submittedForQcAt: null,
        startedAt: new Date(),
      },
    });
    liveChecklist = await loadJobPhotoChecklist(job.id);
  }

  const out = {
    at: new Date().toISOString(),
    db: {
      host: new URL(process.env.DATABASE_URL || "").hostname,
      port: new URL(process.env.DATABASE_URL || "").port,
      database: new URL(process.env.DATABASE_URL || "").pathname
        .replace(/^\//, "")
        .split("?")[0],
    },
    pure: cases.map((c) => ({
      name: c.name,
      ok: c.block.ok,
      needsArrival: c.block.needsArrival,
      missingAfter: c.block.missingAfter.length,
      issuesNeedBefore: c.block.issuesNeedBefore,
      message: finishPhotoBlockMessage(c.block),
    })),
    liveJob: job
      ? {
          id: job.id,
          finishOk: liveChecklist?.finish.ok ?? null,
          needsArrival: liveChecklist?.finish.needsArrival ?? null,
          missingAfter: liveChecklist?.finish.missingAfter.length ?? null,
          message: liveChecklist
            ? finishPhotoBlockMessage(liveChecklist.finish)
            : null,
        }
      : null,
    pass:
      cases[0].block.ok === false &&
      cases[0].block.needsArrival === true &&
      cases[2].block.ok === true &&
      (!liveChecklist ||
        (liveChecklist.finish.ok === false &&
          liveChecklist.finish.needsArrival === true)),
  };

  fs.mkdirSync("C:\\dev\\velocitymaid-backups\\wr2-evidence", { recursive: true });
  fs.writeFileSync(
    "C:\\dev\\velocitymaid-backups\\wr2-evidence\\wr2h-finish-contract.json",
    JSON.stringify(out, null, 2)
  );
  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();
  if (!out.pass) process.exit(2);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
