import { describe, expect, it } from 'vitest';
import {
  isDashboardSmokeRecord,
  isInNext7Days,
  opsCalendar,
  opsDeskAction,
  opsRowAction,
  opsUrgency,
} from '@/lib/admin/opsDesk';

/** Friday 6 Nov 2026, 9:43pm ET = Saturday 02:43 UTC. Eastern today stays Nov 6. */
const FRIDAY_NIGHT = new Date('2026-11-07T02:43:00.000Z');

describe('opsCalendar', () => {
  it('uses America/New_York even when the UTC date has rolled', () => {
    const calendar = opsCalendar(FRIDAY_NIGHT);
    expect(calendar.timeZone).toBe('America/New_York');
    expect(calendar.today).toBe('2026-11-06');
    expect(calendar.tomorrow).toBe('2026-11-07');
    expect(calendar.next7End).toBe('2026-11-12');
    expect(calendar.weekStart).toBe('2026-11-01');
    expect(calendar.weekEnd).toBe('2026-11-07');
  });
});

describe('opsUrgency', () => {
  const calendar = opsCalendar(FRIDAY_NIGHT);

  it('puts today and tomorrow in the next 48 hours, including a tomorrow that starts the next week', () => {
    expect(opsUrgency('2026-11-06', calendar)).toBe('next48');
    expect(opsUrgency('2026-11-07', calendar)).toBe('next48');
    const saturday = opsCalendar(new Date('2026-11-07T18:00:00.000Z'));
    expect(saturday.today).toBe('2026-11-07');
    expect(opsUrgency('2026-11-08', saturday)).toBe('next48');
  });

  it('keeps the rest of this Eastern week separate from later', () => {
    expect(opsUrgency('2026-11-05', calendar)).toBe('past');
    expect(opsUrgency('2026-11-08', calendar)).toBe('later');
    const monday = opsCalendar(new Date('2026-11-02T15:00:00.000Z'));
    expect(opsUrgency('2026-11-04', monday)).toBe('thisWeek');
    expect(opsUrgency('2026-11-09', monday)).toBe('later');
  });

  it('counts a seven-day Eastern window from today', () => {
    expect(isInNext7Days('2026-11-06', calendar)).toBe(true);
    expect(isInNext7Days('2026-11-12', calendar)).toBe(true);
    expect(isInNext7Days('2026-11-13', calendar)).toBe(false);
  });
});

describe('isDashboardSmokeRecord', () => {
  it('matches smoke jobs, SMK invoices, and the QA host lead', () => {
    expect(isDashboardSmokeRecord({ customerName: 'P0E1-SMOKE-1790453250945' })).toBe(true);
    expect(isDashboardSmokeRecord({ invoiceNumber: 'SMK-reuse-253636' })).toBe(true);
    expect(isDashboardSmokeRecord({ invoiceNumber: 'SMK-recon-296711' })).toBe(true);
    expect(isDashboardSmokeRecord({ firstName: 'VM', lastName: 'Hosts Prod QA' })).toBe(true);
  });

  it('leaves real host jobs in the desk', () => {
    expect(isDashboardSmokeRecord({
      jobReference: 'VM-2026-0049',
      customerName: 'Tiffany Pimpinella',
    })).toBe(false);
    expect(isDashboardSmokeRecord({ invoiceNumber: 'VM-2026-0070', clientName: 'Chris Ray Hautchamp' })).toBe(false);
  });
});

describe('opsDeskAction', () => {
  it('counts an assignable unassigned job as needing a cleaner', () => {
    expect(opsDeskAction({
      status: 'CONFIRMED',
      paymentStatus: 'PENDING',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
    })).toBe('needsCleaner');
  });

  it('counts a PREPAY pending job as waiting on payment without changing assignability', () => {
    expect(opsDeskAction({
      status: 'RECEIVED',
      paymentStatus: 'PENDING',
      billingPolicy: 'PREPAY',
      reviewStatus: 'PENDING',
    })).toBe('waitingOnPayment');
  });

  it('does not count an assigned or completed job', () => {
    expect(opsDeskAction({
      assignedCleanerId: 'cleaner-1',
      status: 'ASSIGNED',
      paymentStatus: 'PENDING',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
    })).toBeNull();
    expect(opsDeskAction({
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      billingPolicy: 'PREPAY',
    })).toBeNull();
  });
});

describe('opsRowAction', () => {
  const calendar = opsCalendar(FRIDAY_NIGHT);

  it('sends the next 48 hours to assign and later jobs to send offer', () => {
    expect(opsRowAction({
      jobId: 'job-today',
      action: 'needsCleaner',
      serviceDate: '2026-11-06',
      calendar,
      hasOpenOffer: false,
      branchScoped: false,
    }).label).toBe('Assign cleaner');
    expect(opsRowAction({
      jobId: 'job-later',
      action: 'needsCleaner',
      serviceDate: '2026-11-15',
      calendar,
      hasOpenOffer: false,
      branchScoped: false,
    })).toEqual({ label: 'Send offer', href: '/admin/jobs/job-later' });
  });

  it('opens the invoice for an owner payment wait and the job for a branch admin', () => {
    expect(opsRowAction({
      jobId: 'job-pay',
      action: 'waitingOnPayment',
      serviceDate: '2026-12-27',
      calendar,
      hasOpenOffer: false,
      invoiceId: 'inv-1',
      branchScoped: false,
    })).toEqual({ label: 'Open', href: '/admin/invoices/inv-1' });
    expect(opsRowAction({
      jobId: 'job-pay',
      action: 'waitingOnPayment',
      serviceDate: '2026-12-27',
      calendar,
      hasOpenOffer: false,
      invoiceId: 'inv-1',
      branchScoped: true,
    }).href).toBe('/admin/jobs/job-pay');
  });
});
