import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  markReimbursementRepaid,
  openReimbursement,
  resolveAssignmentAgreement,
  soloPercentageAllowed,
} from '@/lib/cleanerComp/pay';

const terms = {
  soloMethod: 'PERCENTAGE' as const,
  soloRate: 65,
  assistedMethod: 'HOURLY' as const,
  assistedRate: 30,
  effectiveFrom: '2026-10-09',
};

describe('reimbursements and tax paperwork', () => {
  it('opens a personal-funds reimbursement as owed', () => {
    expect(openReimbursement()).toEqual({
      status: 'OWED',
      repaidOn: null,
      repaidMethod: null,
      repaidMemo: null,
      repaidBy: null,
    });
  });

  it('marks a reimbursement repaid once and keeps the amount off cleaner pay', () => {
    const owed = openReimbursement();
    const repaid = markReimbursementRepaid(owed, {
      repaidOn: '2026-11-20',
      repaidMethod: 'ZELLE',
      repaidMemo: 'Paid Caryll back',
      repaidBy: 'admin',
    });
    expect(repaid).toMatchObject({
      status: 'REPAID',
      repaidOn: '2026-11-20',
      repaidMethod: 'ZELLE',
      repaidMemo: 'Paid Caryll back',
      repaidBy: 'admin',
    });
    expect(() => markReimbursementRepaid(repaid, {
      repaidOn: '2026-11-21',
      repaidMethod: 'CASH',
      repaidBy: 'admin',
    })).toThrow(/already repaid/);
    expect(() => markReimbursementRepaid(owed, { repaidOn: '', repaidMethod: 'ZELLE', repaidBy: 'admin' })).toThrow(/date/);
  });

  it('allows solo percentage when either tax form is on file', () => {
    expect(soloPercentageAllowed({ type: 'W9', status: 'ON_FILE' })).toBe(true);
    expect(soloPercentageAllowed({ type: 'W4_I9', status: 'ON_FILE' })).toBe(true);
    expect(soloPercentageAllowed({ type: 'W9', status: 'MISSING' })).toBe(false);
    expect(soloPercentageAllowed({ type: 'NONE', status: 'ON_FILE' })).toBe(false);
    expect(soloPercentageAllowed(null)).toBe(false);
    const agreed = resolveAssignmentAgreement({
      choice: 'solo',
      storedTerms: terms,
      paperwork: { type: 'W4_I9', status: 'ON_FILE', on: '2026-11-01' },
      eligibleBase: 390,
    });
    expect(agreed.compensationAmount).toBe(253.5);
  });

  it('restricts applied-job and cleaner-terms deletes in the staging migration', () => {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'prisma/migrations/20261119210000_cleaner_compensation/migration.sql'),
      'utf8'
    );
    expect(sql).toContain(
      'FOREIGN KEY ("appliedJobId") REFERENCES "Job"("id") ON DELETE RESTRICT'
    );
    expect(sql).toContain(
      'FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT'
    );
    expect(sql).not.toContain('ON DELETE CASCADE ON UPDATE CASCADE;\n\nALTER TABLE "compensation_agreements"');
    expect(sql).toContain('"status" "ReimbursementStatus" NOT NULL DEFAULT \'OWED\'');
  });
});
