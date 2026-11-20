'use client';

import { useState, type FormEvent } from 'react';
import {
  EXPERIENCE_YEARS,
  WEEKDAYS,
  WORK_AREAS,
  WORK_AREA_LABELS,
  type WorkArea,
} from '@/lib/marketing/vermontWorkWithUs';

const fieldClass =
  'mt-1 block min-h-11 w-full rounded-[10px] border border-vm-border bg-white px-3 font-body text-sm text-vm-text focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan';
const labelClass = 'font-body text-sm font-semibold text-vm-text';

export default function VermontWorkWithUsForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [town, setTown] = useState('');
  const [area, setArea] = useState<WorkArea | ''>('');
  const [days, setDays] = useState<string[]>([]);
  const [ownTransport, setOwnTransport] = useState<'yes' | 'no' | ''>('');
  const [years, setYears] = useState('');
  const [shortTerm, setShortTerm] = useState<'yes' | 'no' | ''>('');
  const [story, setStory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);

  const toggleDay = (day: string) => {
    setDays((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/marketing/vermont-work-with-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          town,
          area,
          daysAvailable: days,
          ownTransport,
          yearsExperience: years,
          shortTermRentalExperience: shortTerm,
          problemStory: story,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) throw new Error(json.error || 'We could not save your application.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not save your application.');
    } finally {
      setSaving(false);
    }
  };

  if (sent) {
    return (
      <p className="rounded-[14px] border border-vm-border bg-white px-4 py-4 font-body text-sm text-vm-text">
        Application received. We will reply by email.
      </p>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void submit(event)}>
      <label className={labelClass} htmlFor="applicant-name">
        Name
        <input id="applicant-name" required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} autoComplete="name" />
      </label>
      <label className={labelClass} htmlFor="applicant-phone">
        Phone
        <input id="applicant-phone" required type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className={fieldClass} autoComplete="tel" />
      </label>
      <label className={labelClass} htmlFor="applicant-email">
        Email
        <input id="applicant-email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} autoComplete="email" />
      </label>
      <label className={labelClass} htmlFor="applicant-town">
        Town
        <input id="applicant-town" required value={town} onChange={(event) => setTown(event.target.value)} className={fieldClass} autoComplete="address-level2" />
      </label>
      <label className={labelClass} htmlFor="applicant-area">
        Area
        <select id="applicant-area" required value={area} onChange={(event) => setArea(event.target.value as WorkArea)} className={fieldClass}>
          <option value="">Choose an area</option>
          {WORK_AREAS.map((value) => (
            <option key={value} value={value}>
              {WORK_AREA_LABELS[value]}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className={labelClass}>Days available</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {WEEKDAYS.map((day) => (
            <label key={day} className="flex min-h-11 items-center gap-3 rounded-[10px] border border-vm-border bg-white px-3 font-body text-sm text-vm-text">
              <input type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)} className="h-5 w-5" />
              {day}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={labelClass}>Own transport</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(['yes', 'no'] as const).map((value) => (
            <label key={value} className="flex min-h-11 items-center gap-3 rounded-[10px] border border-vm-border bg-white px-3 font-body text-sm text-vm-text">
              <input type="radio" name="own-transport" required checked={ownTransport === value} onChange={() => setOwnTransport(value)} className="h-5 w-5" />
              {value === 'yes' ? 'Yes' : 'No'}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={labelClass} htmlFor="applicant-years">
        Years of cleaning experience
        <select id="applicant-years" required value={years} onChange={(event) => setYears(event.target.value)} className={fieldClass}>
          <option value="">Choose one</option>
          {EXPERIENCE_YEARS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className={labelClass}>Short-term rental experience</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(['yes', 'no'] as const).map((value) => (
            <label key={value} className="flex min-h-11 items-center gap-3 rounded-[10px] border border-vm-border bg-white px-3 font-body text-sm text-vm-text">
              <input type="radio" name="str-experience" required checked={shortTerm === value} onChange={() => setShortTerm(value)} className="h-5 w-5" />
              {value === 'yes' ? 'Yes' : 'No'}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={labelClass} htmlFor="applicant-story">
        Tell us about a time you had to communicate a problem to a client.
        <textarea
          id="applicant-story"
          required
          minLength={20}
          value={story}
          onChange={(event) => setStory(event.target.value)}
          className={`${fieldClass} min-h-32 py-3`}
        />
      </label>
      {error ? <p className="font-body text-sm text-vm-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-semibold text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-60"
      >
        {saving ? 'Sending…' : 'Send application'}
      </button>
    </form>
  );
}
