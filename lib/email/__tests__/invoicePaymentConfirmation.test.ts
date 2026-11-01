import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
const { send } = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('../resendClient', () => ({ resend: { emails: { send } }, getResendFromEmail: () => 'test@example.com' }));
vi.mock('@/lib/google/integrationLog', () => ({ logIntegrationEvent: vi.fn().mockResolvedValue(undefined) }));
import { sendPaymentConfirmationEmail } from '../invoiceEmails';
const base = { clientEmail: 'internal@example.com', clientName: 'Test Client', propertyAddress: 'DEMO-P001', serviceType: 'Cleaning', invoiceNumber: 'TEST-001', balanceDue: 25 } as SerializedInvoice;
describe('payment confirmation does not overstate settlement', () => {
  beforeEach(() => { vi.clearAllMocks(); send.mockResolvedValue({ data: { id: 'test-message' }, error: null }); });
  it('states remaining balance after a partial payment', async () => {
    await sendPaymentConfirmationEmail({ invoice: base, amount: 75 });
    const payload = send.mock.calls[0][0];
    expect(payload.text).toContain('remaining invoice balance is $25.00');
    expect(payload.html).not.toContain('paid in full');
    expect(payload.text).not.toContain('all squared up');
  });
  it('limits settled wording to the paid invoice, not the whole account', async () => {
    await sendPaymentConfirmationEmail({ invoice: { ...base, balanceDue: 0 }, amount: 25 });
    expect(send.mock.calls[0][0].text).toContain('This invoice is paid in full');
  });
  it('escapes customer-controlled values in payment confirmation HTML', async () => {
    await sendPaymentConfirmationEmail({
      invoice: { ...base, clientName: '<img>', serviceType: '<b>Cleaning</b>',
        propertyAddress: '<a>DEMO-P001</a>', invoiceNumber: '<em>TEST-001</em>' },
      amount: 75, nextJobDate: '<strong>fictional date</strong>',
    });
    const payload = send.mock.calls[0][0];
    expect(payload.html).toContain('&lt;img&gt;');
    expect(payload.html).toContain('&lt;b&gt;Cleaning&lt;/b&gt;');
    expect(payload.html).toContain('&lt;a&gt;DEMO-P001&lt;/a&gt;');
    expect(payload.html).toContain('&lt;em&gt;TEST-001&lt;/em&gt;');
    expect(payload.html).toContain('&lt;strong&gt;fictional date&lt;/strong&gt;');
    expect(payload.html).not.toContain('<img>');
  });
});
