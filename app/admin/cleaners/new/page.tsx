"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewCleanerPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    publicDisplayName: "",
    jobTitle: "",
    branchId: "",
    serviceAreas: "",
    memberStatus: "ACTIVE",
    certificationLabel: "Certified / Internal",
    internalNotes: "",
    trainingPassed: true,
    isInternalTeam: true,
  });

  useEffect(() => {
    fetch("/api/admin/branches")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setBranches(d.branches.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
          const vt = d.branches.find((b: { slug: string }) => b.slug === "vermont");
          if (vt) setForm((f) => ({ ...f, branchId: vt.id }));
        }
      });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cleaners/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          serviceAreas: form.serviceAreas.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create cleaner");
      router.push("/admin/cleaners");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create cleaner");
    } finally {
      setBusy(false);
    }
  };

  const inputClass = "w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none";

  return (
    <div className="p-7">
      <Link href="/admin/cleaners" className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline">
        <ArrowLeft className="h-4 w-4" /> Cleaners
      </Link>
      <h1 className="mb-6 font-heading text-2xl font-bold text-vm-navy">Add team member</h1>

      <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-xl border border-vm-border bg-vm-white p-6">
        {error && <p className="rounded-lg bg-vm-danger-bg px-3 py-2 font-body text-sm text-vm-danger">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name"><input required className={inputClass} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
          <Field label="Last name"><input required className={inputClass} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
          <Field label="Email"><input required type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Phone"><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Public display name"><input className={inputClass} value={form.publicDisplayName} onChange={(e) => setForm({ ...form, publicDisplayName: e.target.value })} /></Field>
          <Field label="Role / title"><input className={inputClass} value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} /></Field>
          <Field label="Branch">
            <select required className={inputClass} value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })}>
              <option value="">Select branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputClass} value={form.memberStatus} onChange={(e) => setForm({ ...form, memberStatus: e.target.value })}>
              {["ACTIVE", "INACTIVE", "TRAINING", "PENDING"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Service areas (comma-separated)">
          <input className={inputClass} value={form.serviceAreas} onChange={(e) => setForm({ ...form, serviceAreas: e.target.value })} placeholder="Middlebury, Killington, Ludlow" />
        </Field>
        <Field label="Certification status">
          <input className={inputClass} value={form.certificationLabel} onChange={(e) => setForm({ ...form, certificationLabel: e.target.value })} />
        </Field>
        <Field label="Internal notes">
          <textarea rows={3} className={inputClass} value={form.internalNotes} onChange={(e) => setForm({ ...form, internalNotes: e.target.value })} />
        </Field>

        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-5 py-2.5 font-heading text-sm font-bold text-white disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Create cleaner profile
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-body text-xs font-semibold uppercase text-vm-muted">{label}</label>
      {children}
    </div>
  );
}
