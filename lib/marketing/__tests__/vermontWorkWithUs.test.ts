import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  HIRING_STATUS_LABELS,
  prismaStatusForHiring,
  validateVermontWorkApplication,
  vermontWorkApplicationFromBody,
} from '@/lib/marketing/vermontWorkWithUs';

const valid = {
  name: 'Avery Stone',
  phone: '(802) 555-0100',
  email: 'avery@example.test',
  town: 'Ludlow',
  area: 'OKEMO',
  daysAvailable: ['Monday', 'Friday'],
  ownTransport: 'yes',
  yearsExperience: '1–3 years',
  shortTermRentalExperience: 'no',
  problemStory: 'The hot water was out, so I called the host before I left the house.',
};

describe('Vermont work-with-us application', () => {
  it('accepts a complete application and starts it as new', () => {
    expect(validateVermontWorkApplication(valid)).toBeNull();
    expect(vermontWorkApplicationFromBody(valid).hiringStatus).toBe('NEW');
    expect(HIRING_STATUS_LABELS.NOT_A_FIT).toBe('Not a fit');
    expect(prismaStatusForHiring('HIRED')).toBe('REVIEWING');
    expect(prismaStatusForHiring('NOT_A_FIT')).toBe('REJECTED');
  });

  it('rejects a missing story and a pay-rate field is not part of the form', () => {
    expect(validateVermontWorkApplication({ ...valid, problemStory: 'too short' })).toMatch(/communicate a problem/);
    expect(validateVermontWorkApplication({ ...valid, area: 'Statewide' })).toMatch(/Okemo Valley/);
  });

  it('does not publish 1099 language, a rate, or a certification program', () => {
    const page = fs.readFileSync(path.join(process.cwd(), 'app/vermont/work-with-us/page.tsx'), 'utf8');
    const form = fs.readFileSync(
      path.join(process.cwd(), 'components/marketing/VermontWorkWithUsForm.tsx'),
      'utf8'
    );
    const copy = `${page}\n${form}`.toLowerCase();
    expect(copy).not.toMatch(/1099|w-9|independent contractor|certification program|you are responsible for your taxes/);
    expect(copy).not.toMatch(/\$\d|% of the job|hours per week/);
    expect(page).toContain('Pay and employment terms are confirmed at your interview, in writing, before your first job.');
    expect(page).toContain('a paid first job together');
    expect(page).toContain('Steady winter-season work (Dec–Apr).');
  });
});
