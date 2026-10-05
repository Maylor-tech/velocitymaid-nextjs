'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { TravelZone } from '@prisma/client';
import { TRAVEL_ZONE_OPTIONS } from '@/lib/vermont/travelZone';
import { PortalInviteButton } from '@/components/admin/PortalInviteButton';
import { CustomerActionsMenu } from '@/components/admin/CustomerActionsMenu';

const inputClass =
  'w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan';
const labelClass = 'mb-1 block font-heading text-xs font-semibold uppercase tracking-wide text-vm-muted';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  defaultAddress: string | null;
  travelZone: TravelZone | null;
  archivedAt: string | null;
  archivedBy: string | null;
  recordKind: 'STANDARD' | 'SYSTEM' | 'TEST';
  billingPolicy?: 'PREPAY' | 'INVOICE_AFTER_SERVICE';
  jobCount?: number;
  invoiceCount?: number;
  Branch: { name: string; slug: string } | null;
  Property?: Array<{
    id: string;
    name: string;
    address: string;
    city: string | null;
    useType: 'HOST' | 'RESIDENTIAL' | null;
    ResidentialProfile: {
      id: string;
      estimatedLaborHours: string | number | null;
      agreedPrice: string | number | null;
      pricingBasis: string | null;
      includedScope: string | null;
      exclusions: string | null;
      preExistingConditionNotes: string | null;
      conditionFlags: string[];
      frequency: string | null;
      serviceType: string | null;
    } | null;
  }>;
  portal?: {
    portalInviteSent: boolean;
    inviteAccepted: boolean;
    loginCount: number;
    lastPortalLoginAt: string | null;
    invitedAt: string | null;
  };
}

export default function AdminCustomerProfilePage() {
  const params = useParams<{ customerId: string }>();
  const router = useRouter();
  const customerId = params.customerId;
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [travelZone, setTravelZone] = useState<TravelZone | ''>('');
  const [billingPolicy, setBillingPolicy] = useState<'PREPAY' | 'INVOICE_AFTER_SERVICE'>('PREPAY');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingProfileId, setSavingProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profileDrafts, setProfileDrafts] = useState<
    Record<string, { estimatedLaborHours: string; agreedPrice: string; pricingBasis: string; includedScope: string; exclusions: string; preExistingConditionNotes: string }>
  >({});

  const load = () =>
    fetch(`/api/admin/customers/${customerId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCustomer(d.customer);
          setTravelZone(d.customer.travelZone || '');
          setBillingPolicy(d.customer.billingPolicy || 'PREPAY');
          const drafts: Record<string, { estimatedLaborHours: string; agreedPrice: string; pricingBasis: string; includedScope: string; exclusions: string; preExistingConditionNotes: string }> = {};
          for (const property of d.customer.Property ?? []) {
            if (property.useType !== 'RESIDENTIAL') continue;
            drafts[property.id] = {
              estimatedLaborHours: property.ResidentialProfile?.estimatedLaborHours?.toString() ?? '',
              agreedPrice: property.ResidentialProfile?.agreedPrice?.toString() ?? '',
              pricingBasis: property.ResidentialProfile?.pricingBasis ?? '',
              includedScope: property.ResidentialProfile?.includedScope ?? '',
              exclusions: property.ResidentialProfile?.exclusions ?? '',
              preExistingConditionNotes: property.ResidentialProfile?.preExistingConditionNotes ?? '',
            };
          }
          setProfileDrafts(drafts);
        }
      });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [customerId]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          travelZone: travelZone || null,
          billingPolicy,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCustomer((c) =>
        c
          ? {
              ...c,
              travelZone: data.customer.travelZone,
              billingPolicy: data.customer.billingPolicy,
            }
          : c
      );
      setMessage('Customer saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 font-body text-sm text-vm-danger">Customer not found.</div>
    );
  }

  const propertyAddress =
    customer.defaultAddress ||
    [customer.addressLine1, customer.city, customer.state].filter(Boolean).join(', ');
  const displayName =
    `${customer.firstName} ${customer.lastName}`.trim() || customer.email;

  return (
    <div className="min-h-screen bg-vm-surface p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/customers"
          className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to customers
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-vm-navy">Property Profile</h1>
            <p className="mt-1 font-body text-sm text-vm-muted">
              {displayName} · {customer.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {customer.recordKind === 'SYSTEM' && (
                <span className="rounded-full bg-vm-surface px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-vm-muted">
                  System account
                </span>
              )}
              {customer.archivedAt && (
                <span className="rounded-full bg-vm-warning-bg px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-vm-warning">
                  Archived
                </span>
              )}
            </div>
          </div>
          <CustomerActionsMenu
            customerId={customer.id}
            customerName={displayName}
            isArchived={Boolean(customer.archivedAt)}
            recordKind={customer.recordKind}
            jobCount={customer.jobCount ?? 0}
            invoiceCount={customer.invoiceCount ?? 0}
            onChanged={(action) => {
              if (action === 'delete') {
                router.push('/admin/customers');
                return;
              }
              setMessage(
                action === 'archive'
                  ? 'Customer archived. Hidden from Active list.'
                  : 'Customer restored to Active list.'
              );
              void load();
            }}
          />
        </div>

        <div className="mt-6 space-y-6 rounded-xl border border-vm-border bg-vm-white p-6">
          {customer.portal && (
            <div className="rounded-lg bg-vm-surface/80 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className={labelClass}>Customer portal</p>
                {!customer.portal.inviteAccepted && customer.recordKind !== 'SYSTEM' && (
                  <PortalInviteButton
                    customerId={customer.id}
                    alreadyInvited={customer.portal.portalInviteSent}
                    size="md"
                    onInvited={({ invitedAt }) => {
                      setCustomer((c) =>
                        c?.portal
                          ? {
                              ...c,
                              portal: {
                                ...c.portal,
                                portalInviteSent: true,
                                invitedAt,
                              },
                            }
                          : c
                      );
                      setMessage(`Portal invite sent to ${customer.email}.`);
                    }}
                  />
                )}
              </div>
              <dl className="mt-2 grid grid-cols-1 gap-2 font-body text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-vm-muted">Account status</dt>
                  <dd className="font-medium text-vm-text">
                    {customer.portal.inviteAccepted
                      ? 'Active — has logged in'
                      : customer.portal.portalInviteSent
                        ? 'Invited — not yet logged in'
                        : 'No portal invite sent'}
                  </dd>
                </div>
                <div>
                  <dt className="text-vm-muted">Last portal login</dt>
                  <dd className="font-medium text-vm-text">
                    {customer.portal.lastPortalLoginAt
                      ? new Date(customer.portal.lastPortalLoginAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Never'}
                  </dd>
                </div>
                <div>
                  <dt className="text-vm-muted">Total logins</dt>
                  <dd className="font-medium text-vm-text">{customer.portal.loginCount}</dd>
                </div>
                {customer.portal.invitedAt && (
                  <div>
                    <dt className="text-vm-muted">Invite sent</dt>
                    <dd className="font-medium text-vm-text">
                      {new Date(customer.portal.invitedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          <div>
            <p className={labelClass}>Property address</p>
            <p className="font-body text-sm text-vm-text">{propertyAddress || '—'}</p>
          </div>
          {customer.Branch && (
            <div>
              <p className={labelClass}>Branch</p>
              <p className="font-body text-sm text-vm-text">{customer.Branch.name}</p>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="travelZone">
              Travel Zone
            </label>
            <select
              id="travelZone"
              className={inputClass}
              value={travelZone}
              onChange={(e) => setTravelZone(e.target.value as TravelZone | '')}
            >
              <option value="">Not set</option>
              {TRAVEL_ZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-2 font-body text-xs text-vm-muted">
              Set once per property. Used to suggest travel fees on standalone Vermont visits.
            </p>
          </div>

          <div>
            <label className={labelClass} htmlFor="billingPolicy">
              Billing policy
            </label>
            <select
              id="billingPolicy"
              className={inputClass}
              value={billingPolicy}
              onChange={(e) =>
                setBillingPolicy(e.target.value as 'PREPAY' | 'INVOICE_AFTER_SERVICE')
              }
            >
              <option value="PREPAY">PREPAY — payment before assignment</option>
              <option value="INVOICE_AFTER_SERVICE">
                INVOICE_AFTER_SERVICE — assign while payment pending
              </option>
            </select>
            <p className="mt-2 font-body text-xs text-vm-muted">
              Approve residential clients here, then send a portal invite. Public
              intake does not set invoice-after-service automatically.
            </p>
          </div>

          {(customer.Property ?? []).filter((p) => p.useType === 'RESIDENTIAL').map((property) => {
            const draft = profileDrafts[property.id];
            if (!draft) return null;
            return (
              <div key={property.id} className="rounded-lg border border-vm-border p-4">
                <p className={labelClass}>Residential scope — {property.name}</p>
                <p className="mb-3 font-body text-xs text-vm-muted">
                  {property.address}
                  {property.ResidentialProfile?.conditionFlags?.length
                    ? ` · Conditions: ${property.ResidentialProfile.conditionFlags.join(', ')}`
                    : ''}
                </p>
                <p className="mb-3 font-body text-xs text-vm-muted">
                  Do not price deep cleans from bedroom count or square footage alone.
                  A small one-bedroom can still need five or more hours when condition is severe.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="font-body text-xs text-vm-muted">
                    Estimated labor hours
                    <input
                      className={`${inputClass} mt-1`}
                      value={draft.estimatedLaborHours}
                      onChange={(e) =>
                        setProfileDrafts((prev) => ({
                          ...prev,
                          [property.id]: { ...draft, estimatedLaborHours: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="font-body text-xs text-vm-muted">
                    Agreed price
                    <input
                      className={`${inputClass} mt-1`}
                      value={draft.agreedPrice}
                      onChange={(e) =>
                        setProfileDrafts((prev) => ({
                          ...prev,
                          [property.id]: { ...draft, agreedPrice: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="font-body text-xs text-vm-muted">
                    Pricing basis
                    <select
                      className={`${inputClass} mt-1`}
                      value={draft.pricingBasis}
                      onChange={(e) =>
                        setProfileDrafts((prev) => ({
                          ...prev,
                          [property.id]: { ...draft, pricingBasis: e.target.value },
                        }))
                      }
                    >
                      <option value="">Not set</option>
                      <option value="RECURRING_FLAT">Recurring flat rate</option>
                      <option value="DEEP_CLEAN_QUOTE">Deep-clean quote</option>
                      <option value="HOURLY">Hourly</option>
                      <option value="MIXED">Mixed</option>
                    </select>
                  </label>
                </div>
                <label className="mt-3 block font-body text-xs text-vm-muted">
                  Included scope
                  <textarea
                    className={`${inputClass} mt-1`}
                    rows={2}
                    value={draft.includedScope}
                    onChange={(e) =>
                      setProfileDrafts((prev) => ({
                        ...prev,
                        [property.id]: { ...draft, includedScope: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="mt-3 block font-body text-xs text-vm-muted">
                  Exclusions
                  <textarea
                    className={`${inputClass} mt-1`}
                    rows={2}
                    value={draft.exclusions}
                    onChange={(e) =>
                      setProfileDrafts((prev) => ({
                        ...prev,
                        [property.id]: { ...draft, exclusions: e.target.value },
                      }))
                    }
                  />
                </label>
                <label className="mt-3 block font-body text-xs text-vm-muted">
                  Pre-existing property-condition notes
                  <textarea
                    className={`${inputClass} mt-1`}
                    rows={2}
                    value={draft.preExistingConditionNotes}
                    onChange={(e) =>
                      setProfileDrafts((prev) => ({
                        ...prev,
                        [property.id]: { ...draft, preExistingConditionNotes: e.target.value },
                      }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-vm-navy/15 px-4 py-2 font-heading text-xs font-semibold uppercase tracking-wider text-vm-navy"
                  disabled={savingProfileId === property.id}
                  onClick={async () => {
                    setSavingProfileId(property.id);
                    setMessage(null);
                    try {
                      const res = await fetch(
                        `/api/admin/properties/${property.id}/residential-profile`,
                        {
                          method: 'PATCH',
                          credentials: 'include',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            estimatedLaborHours: draft.estimatedLaborHours
                              ? Number(draft.estimatedLaborHours)
                              : null,
                            agreedPrice: draft.agreedPrice ? Number(draft.agreedPrice) : null,
                            pricingBasis: draft.pricingBasis || null,
                            includedScope: draft.includedScope,
                            exclusions: draft.exclusions,
                            preExistingConditionNotes: draft.preExistingConditionNotes,
                          }),
                        }
                      );
                      const data = await res.json();
                      if (!data.success) throw new Error(data.error);
                      setMessage('Residential scope saved.');
                    } catch (err) {
                      setMessage(err instanceof Error ? err.message : 'Save failed');
                    } finally {
                      setSavingProfileId(null);
                    }
                  }}
                >
                  {savingProfileId === property.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save residential scope
                </button>
              </div>
            );
          })}

          {message && <p className="font-body text-sm text-vm-muted">{message}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-vm-cyan px-5 py-2.5 font-heading text-sm font-semibold text-vm-navy hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save customer
          </button>
        </div>
      </div>
    </div>
  );
}
