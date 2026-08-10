'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Loader2,
  Plus,
  Save,
} from 'lucide-react';

interface HostProperty {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  bedConfiguration: string | null;
  amenities: string[];
  restrictedAreas: string | null;
  accessType: string | null;
  supplyStorageLocation: string | null;
  trashInstructions: string | null;
  linenInstructions: string | null;
  standardCheckoutTime: string | null;
  standardCheckinTime: string | null;
  turnoverFrequency: string | null;
  sameDayTurnovers: string | null;
  standingInstructions: string | null;
}

interface UpcomingJob {
  id: string;
  jobReference: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  status: string;
}

const inputClass =
  'mt-1 w-full rounded-lg border border-vm-navy/15 px-3 py-2 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan';

export default function CustomerPropertyDetailPage() {
  const params = useParams();
  const propertyId = params.propertyId as string;

  const [property, setProperty] = useState<HostProperty | null>(null);
  const [form, setForm] = useState<HostProperty | null>(null);
  const [upcomingJobs, setUpcomingJobs] = useState<UpcomingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customer/properties/${propertyId}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load property');
      }
      setProperty(data.property);
      setForm(data.property);
      setUpcomingJobs(data.upcomingJobs || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load property');
      setProperty(null);
      setForm(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const update = <K extends keyof HostProperty>(key: K, value: HostProperty[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/customer/properties/${propertyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          city: form.city,
          state: form.state,
          postalCode: form.postalCode,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          bedConfiguration: form.bedConfiguration,
          amenities: form.amenities,
          restrictedAreas: form.restrictedAreas,
          accessType: form.accessType,
          supplyStorageLocation: form.supplyStorageLocation,
          trashInstructions: form.trashInstructions,
          linenInstructions: form.linenInstructions,
          standardCheckoutTime: form.standardCheckoutTime,
          standardCheckinTime: form.standardCheckinTime,
          turnoverFrequency: form.turnoverFrequency,
          sameDayTurnovers: form.sameDayTurnovers,
          standingInstructions: form.standingInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save');
      }
      setProperty(data.property);
      setForm(data.property);
      setSaveMessage('Property profile saved.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/customer/properties"
          className="inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
        <div className="rounded-xl border border-vm-danger/20 bg-vm-danger-bg px-4 py-3 text-sm text-vm-danger">
          {error}
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/customer/properties"
            className="inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Properties
          </Link>
          <h1 className="mt-2 font-heading text-2xl font-bold text-vm-navy">
            {property?.name || form.name}
          </h1>
          <p className="mt-1 font-body text-sm text-vm-muted">
            Standing instructions apply to every future cleaning unless you add
            job-specific notes.
          </p>
        </div>
        <Link
          href={`/customer/properties/${propertyId}/add-cleaning`}
          className="inline-flex items-center gap-2 rounded-lg bg-vm-cyan px-4 py-2.5 font-heading text-sm font-semibold text-vm-navy"
        >
          <Plus className="h-4 w-4" />
          Add Cleaning
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-vm-danger/20 bg-vm-danger-bg px-4 py-3 text-sm text-vm-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {saveMessage && (
        <div className="rounded-xl border border-vm-success/30 bg-vm-success-bg px-4 py-3 text-sm text-vm-success">
          {saveMessage}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-6 rounded-xl border border-vm-navy/10 bg-vm-white p-6 shadow-sm"
      >
        <h2 className="font-heading text-lg font-semibold text-vm-navy">
          Property profile
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 font-body text-sm text-vm-muted">
            Property name
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
          </label>
          <label className="sm:col-span-2 font-body text-sm text-vm-muted">
            Address
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              required
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            City
            <input
              className={inputClass}
              value={form.city || ''}
              onChange={(e) => update('city', e.target.value || null)}
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            State
            <input
              className={inputClass}
              value={form.state || ''}
              onChange={(e) => update('state', e.target.value || null)}
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            Bedrooms
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.bedrooms ?? ''}
              onChange={(e) =>
                update(
                  'bedrooms',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            Bathrooms
            <input
              type="number"
              min={0}
              step="0.5"
              className={inputClass}
              value={form.bathrooms ?? ''}
              onChange={(e) =>
                update(
                  'bathrooms',
                  e.target.value === '' ? null : Number(e.target.value)
                )
              }
            />
          </label>
          <label className="sm:col-span-2 font-body text-sm text-vm-muted">
            Bed configuration
            <input
              className={inputClass}
              value={form.bedConfiguration || ''}
              onChange={(e) => update('bedConfiguration', e.target.value || null)}
            />
          </label>
          <label className="sm:col-span-2 font-body text-sm text-vm-muted">
            Amenities (comma-separated)
            <input
              className={inputClass}
              value={(form.amenities || []).join(', ')}
              onChange={(e) =>
                update(
                  'amenities',
                  e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </label>
          <label className="sm:col-span-2 font-body text-sm text-vm-muted">
            Restricted areas
            <textarea
              className={inputClass}
              rows={2}
              value={form.restrictedAreas || ''}
              onChange={(e) => update('restrictedAreas', e.target.value || null)}
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            Access type
            <input
              className={inputClass}
              value={form.accessType || ''}
              onChange={(e) => update('accessType', e.target.value || null)}
              placeholder="Lockbox, keypad, key on site…"
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            Supply storage
            <input
              className={inputClass}
              value={form.supplyStorageLocation || ''}
              onChange={(e) =>
                update('supplyStorageLocation', e.target.value || null)
              }
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            Trash instructions
            <input
              className={inputClass}
              value={form.trashInstructions || ''}
              onChange={(e) =>
                update('trashInstructions', e.target.value || null)
              }
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            Linen instructions
            <input
              className={inputClass}
              value={form.linenInstructions || ''}
              onChange={(e) =>
                update('linenInstructions', e.target.value || null)
              }
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            Standard checkout time
            <input
              className={inputClass}
              value={form.standardCheckoutTime || ''}
              onChange={(e) =>
                update('standardCheckoutTime', e.target.value || null)
              }
            />
          </label>
          <label className="font-body text-sm text-vm-muted">
            Standard check-in time
            <input
              className={inputClass}
              value={form.standardCheckinTime || ''}
              onChange={(e) =>
                update('standardCheckinTime', e.target.value || null)
              }
            />
          </label>
          <label className="sm:col-span-2 font-body text-sm text-vm-muted">
            Standing cleaning instructions
            <textarea
              className={inputClass}
              rows={4}
              value={form.standingInstructions || ''}
              onChange={(e) =>
                update('standingInstructions', e.target.value || null)
              }
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-4 py-2.5 font-heading text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save property profile
        </button>
      </form>

      <section className="rounded-xl border border-vm-navy/10 bg-vm-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-vm-navy">
            Upcoming cleans
          </h2>
          <Link
            href={`/customer/properties/${propertyId}/add-cleaning`}
            className="font-body text-sm font-semibold text-vm-cyan-dark"
          >
            Add Cleaning
          </Link>
        </div>
        {upcomingJobs.length === 0 ? (
          <p className="font-body text-sm text-vm-muted">
            No upcoming cleans scheduled for this property.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcomingJobs.map((job) => (
              <li
                key={job.id}
                className="flex items-start gap-3 rounded-lg border border-vm-navy/10 px-3 py-3"
              >
                <Calendar className="mt-0.5 h-4 w-4 text-vm-muted" />
                <div>
                  <p className="font-heading text-sm font-semibold text-vm-navy">
                    {job.serviceType || 'Cleaning'}
                  </p>
                  <p className="font-body text-sm text-vm-muted">
                    {job.preferredDate
                      ? new Date(job.preferredDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Date TBD'}
                    {job.preferredTime ? ` · ${job.preferredTime}` : ''}
                  </p>
                  <p className="mt-0.5 font-body text-xs text-vm-muted">
                    {job.jobReference || job.id.slice(0, 8)} · {job.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
