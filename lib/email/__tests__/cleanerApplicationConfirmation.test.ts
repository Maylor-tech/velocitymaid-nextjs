import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

describe('cleaner application confirmation copy', () => {
  it('sets terms at the interview and does not name a certification program or a rate', () => {
    const email = fs.readFileSync(
      path.join(process.cwd(), 'lib/email/sendCleanerApplicationEmails.ts'),
      'utf8'
    );
    const page = fs.readFileSync(
      path.join(process.cwd(), 'app/new-jersey/work-with-us/page.tsx'),
      'utf8'
    );
    const confirmation = email.slice(
      email.indexOf('export async function sendCleanerApplicationConfirmationEmail'),
      email.indexOf('export async function sendCleanerApplicationInternalNotification')
    );

    expect(confirmation).toContain('a short interview, then a paid first job together');
    expect(confirmation).toContain(
      'Pay and employment terms are confirmed at your interview, in writing, before your first job.'
    );
    expect(confirmation.toLowerCase()).not.toMatch(/certification program|1099|w-9|independent contractor/);
    expect(confirmation).not.toMatch(/\$\d|\d+%/);

    expect(page).toContain('You see the payout before you accept');
    expect(page).toContain('Paid on a weekly cycle');
    expect(page.toLowerCase()).not.toMatch(/1099|w-9|independent contractor|certification program/);
    expect(page).not.toMatch(/\$\d|\d+%/);
  });
});
