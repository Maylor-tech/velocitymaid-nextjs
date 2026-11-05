'use client';

import { useCallback, useEffect, useState } from 'react';

type ReminderInfo = {
  remindersPaused: boolean;
  reminderSentAt: string | null;
  reminderDeliveries: { stage: string; status: string; updatedAt: string; providerMessageId: string | null }[];
};

export function InvoiceReminderControls({ invoiceId }: { invoiceId: string }) {
  const [info, setInfo] = useState<ReminderInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [reference, setReference] = useState('');
  const [message, setMessage] = useState('');
  const endpoint = `/api/admin/invoices/${invoiceId}/reminders`;
  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Unable to load reminders');
      setInfo(data.invoice);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to load reminders'); }
  }, [endpoint]);
  useEffect(() => { void load(); }, [load]);

  async function update(method: 'PATCH' | 'POST', body: object) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Reminder update failed');
      setReference('');
      await load();
      setMessage(method === 'POST' ? 'External reminder recorded. No email sent.' : 'Reminder preference updated.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Reminder update failed'); }
    finally { setBusy(false); }
  }

  return <section className="my-6 rounded-xl border border-vm-border bg-white p-6 print:hidden" aria-labelledby="reminder-controls-heading">
    <h2 id="reminder-controls-heading" className="font-heading text-lg font-semibold text-vm-navy">Payment reminders</h2>
    {info && <>
      <p className="my-2 text-sm text-vm-muted">Reminders {info.remindersPaused ? 'paused' : 'available'} · Last recorded: {info.reminderSentAt ? new Date(info.reminderSentAt).toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET' : 'none'}</p>
      <button type="button" disabled={busy} onClick={() => update('PATCH', { paused: !info.remindersPaused })} className="rounded border border-vm-border px-3 py-2 text-sm text-vm-navy disabled:opacity-50">
        {info.remindersPaused ? 'Resume reminders' : 'Pause reminders for a dispute or pending transfer'}
      </button>
      <form className="mt-4" onSubmit={(event) => { event.preventDefault(); void update('POST', { reference }); }}>
        <label htmlFor="external-reminder-reference" className="block text-sm text-vm-navy">Already sent a reminder by Gmail or text? Record its message reference here.</label>
        <input id="external-reminder-reference" value={reference} onChange={(event) => setReference(event.target.value)} required minLength={3} maxLength={200} className="my-2 w-full rounded border border-vm-border px-3 py-2" />
        <button disabled={busy} type="submit" className="rounded bg-vm-navy px-3 py-2 text-sm text-white disabled:opacity-50">Record already-sent reminder</button>
      </form>
      <p className="mt-2 text-xs text-vm-muted">This records contact now and applies a cooldown; it does not send a message. Customer reminders are limited across invoices for the same email address. Pausing reminders does not cancel service.</p>
      {info.reminderDeliveries.some((entry) => entry.status === 'UNKNOWN' || entry.status === 'PENDING') && <p className="mt-3 text-sm text-vm-navy">A send needs reconciliation. Check the email provider record before retrying; automatic reminders remain held for this recipient.</p>}
      {info.reminderDeliveries.length > 0 && <ul className="mt-3 text-sm">{info.reminderDeliveries.map((entry) => <li key={entry.stage} className="border-t border-vm-border py-2">{entry.stage} · {entry.status} · {new Date(entry.updatedAt).toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</li>)}</ul>}
    </>}
    <p role="status" className="mt-2 text-sm text-vm-navy">{message}</p>
  </section>;
}
