'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand';
import Toast from '@/components/ui/toast';
import {
  EMPTY_TALENT_APPLICATION,
  EQUIPMENT_ITEMS,
  EXPERIENCE_TYPES,
  SKILL_RATING_KEYS,
  SKILL_RATING_LABELS,
  WEEKDAYS,
  SERVICE_AREAS,
  type TalentApplicationPayload,
} from '@/lib/cleaners/talentApplicationTypes';
import { validateTalentApplication } from '@/lib/cleaners/validateTalentApplication';
import { trackEvent } from '@/lib/analytics/trackEvent';
import {
  CheckboxGroup,
  FieldGrid,
  RatingRow,
  SectionCard,
  YesNoField,
  helperClass,
  inputClass,
  labelClass,
} from './FormUi';

const SECTIONS = [
  { id: 'personal', label: 'Personal' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'availability', label: 'Availability' },
  { id: 'areas', label: 'Areas' },
  { id: 'experience', label: 'Experience' },
  { id: 'skills', label: 'Skills' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'hospitality', label: 'Mindset' },
  { id: 'references', label: 'References' },
  { id: 'confirm', label: 'Submit' },
];

export default function TalentApplyPortal() {
  const router = useRouter();
  const [data, setData] = useState<TalentApplicationPayload>(EMPTY_TALENT_APPLICATION);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const update = <K extends keyof TalentApplicationPayload>(
    key: K,
    value: TalentApplicationPayload[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleDay = (day: string) => {
    const days = data.availability.daysAvailable;
    update('availability', {
      ...data.availability,
      daysAvailable: days.includes(day)
        ? days.filter((d) => d !== day)
        : [...days, day],
    });
  };

  const toggleArea = (area: string) => {
    const areas = data.serviceAreas.areas;
    update('serviceAreas', {
      ...data.serviceAreas,
      areas: areas.includes(area) ? areas.filter((a) => a !== area) : [...areas, area],
    });
  };

  const toggleEquipment = (item: string) => {
    const eq = data.equipment;
    update('equipment', eq.includes(item) ? eq.filter((e) => e !== item) : [...eq, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTalentApplication(data);
    if (validationError) {
      setError(validationError);
      setShowToast(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/cleaners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application: data }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit application');
      }
      trackEvent('cleaner_applied', {
        market: data.serviceAreas.join(',') || 'unknown',
      });
      router.push('/cleaners/apply/success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-vm-surface">
      {/* Hero */}
      <header className="relative overflow-hidden bg-vm-navy text-vm-white">
        <div className="absolute inset-0 bg-gradient-to-br from-vm-navy via-[#13243b] to-vm-navy opacity-95" />
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-vm-cyan/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 pb-16 pt-8 sm:pb-20 sm:pt-10">
          <Link href="/" className="inline-block">
            <BrandLogo theme="dark" size="header" showTagline={false} />
          </Link>
          <div className="mt-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-vm-cyan/15 px-3 py-1 font-body text-xs font-semibold text-vm-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              Talent Portal
            </span>
            <h1 className="mt-4 font-heading text-3xl font-bold leading-tight sm:text-4xl">
              Become a Certified VelocityMaid Cleaning Professional
            </h1>
            <p className="mt-4 font-body text-base leading-relaxed text-vm-white/80 sm:text-lg">
              Join a trusted home services company delivering reliable residential cleaning,
              vacation rental turnovers, and five-star property care.
            </p>
            <p className="mt-4 font-body text-sm leading-relaxed text-vm-white/65">
              VelocityMaid professionals are held to hospitality-grade standards — punctual,
              detail-obsessed, and trusted in guests&apos; homes. We invest in training,
              certification, and ongoing support so every clean reflects our brand promise:
              come home to clean.
            </p>
            <button
              type="button"
              onClick={() => scrollTo('personal')}
              className="btn-tactile mt-8 inline-flex items-center gap-2 rounded-lg bg-vm-cyan px-6 py-3.5 font-heading text-sm font-bold uppercase tracking-wider text-vm-navy shadow-md transition-colors hover:bg-vm-cyan-dark"
            >
              Start Application
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Trust strip */}
      <div className="border-b border-vm-border bg-vm-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-6 py-4 text-center sm:justify-start sm:text-left">
          {[
            { icon: ShieldCheck, text: 'Background-checked professionals' },
            { icon: Award, text: 'Certification training program' },
            { icon: CheckCircle2, text: 'Vermont & New Jersey markets' },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-2 font-body text-xs text-vm-muted"
            >
              <Icon className="h-4 w-4 text-vm-cyan-dark" />
              {text}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Section nav — desktop */}
        <nav className="sticky top-0 z-20 mb-8 hidden overflow-x-auto rounded-xl border border-vm-border bg-vm-white/95 py-2 backdrop-blur sm:flex">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => scrollTo(s.id)}
              className="whitespace-nowrap px-3 py-1.5 font-body text-xs font-medium text-vm-muted transition-colors hover:text-vm-navy"
            >
              {s.label}
            </button>
          ))}
        </nav>

        <Toast
          message={error || ''}
          type="error"
          visible={showToast && !!error}
          onClose={() => setShowToast(false)}
        />

        <form onSubmit={handleSubmit} className="space-y-8">
          <SectionCard
            id="personal"
            title="Personal Information"
            description="Tell us how to reach you and where you're based."
          >
            <FieldGrid>
              <div>
                <label htmlFor="firstName" className={labelClass}>First name *</label>
                <input id="firstName" required className={inputClass} value={data.personal.firstName}
                  onChange={(e) => update('personal', { ...data.personal, firstName: e.target.value })} />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClass}>Last name *</label>
                <input id="lastName" required className={inputClass} value={data.personal.lastName}
                  onChange={(e) => update('personal', { ...data.personal, lastName: e.target.value })} />
              </div>
              <div>
                <label htmlFor="preferredName" className={labelClass}>Preferred name</label>
                <input id="preferredName" className={inputClass} value={data.personal.preferredName}
                  onChange={(e) => update('personal', { ...data.personal, preferredName: e.target.value })} />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>Phone *</label>
                <input id="phone" type="tel" required className={inputClass} value={data.personal.phone}
                  onChange={(e) => update('personal', { ...data.personal, phone: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="email" className={labelClass}>Email *</label>
                <input id="email" type="email" required className={inputClass} value={data.personal.email}
                  onChange={(e) => update('personal', { ...data.personal, email: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="street" className={labelClass}>Street address *</label>
                <input id="street" required className={inputClass} value={data.personal.streetAddress}
                  onChange={(e) => update('personal', { ...data.personal, streetAddress: e.target.value })} />
              </div>
              <div>
                <label htmlFor="city" className={labelClass}>City *</label>
                <input id="city" required className={inputClass} value={data.personal.city}
                  onChange={(e) => update('personal', { ...data.personal, city: e.target.value })} />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>State *</label>
                <input id="state" required className={inputClass} value={data.personal.state}
                  onChange={(e) => update('personal', { ...data.personal, state: e.target.value })} />
              </div>
              <div>
                <label htmlFor="zip" className={labelClass}>ZIP code *</label>
                <input id="zip" required className={inputClass} value={data.personal.zipCode}
                  onChange={(e) => update('personal', { ...data.personal, zipCode: e.target.value })} />
              </div>
            </FieldGrid>
          </SectionCard>

          <SectionCard id="eligibility" title="Work Eligibility">
            <YesNoField label="Are you legally authorized to work in the United States?" required
              value={data.eligibility.authorizedToWork}
              onChange={(v) => update('eligibility', { ...data.eligibility, authorizedToWork: v })} />
            <YesNoField label="Do you have reliable transportation?" required
              value={data.eligibility.reliableTransportation}
              onChange={(v) => update('eligibility', { ...data.eligibility, reliableTransportation: v })} />
            <YesNoField label="Do you own a vehicle?"
              value={data.eligibility.ownsVehicle}
              onChange={(v) => update('eligibility', { ...data.eligibility, ownsVehicle: v })} />
            <YesNoField label="Do you have auto insurance?"
              value={data.eligibility.hasAutoInsurance}
              onChange={(v) => update('eligibility', { ...data.eligibility, hasAutoInsurance: v })} />
            <YesNoField label="Do you have a valid driver's license?"
              value={data.eligibility.hasDriversLicense}
              onChange={(v) => update('eligibility', { ...data.eligibility, hasDriversLicense: v })} />
          </SectionCard>

          <SectionCard id="availability" title="Availability">
            <div>
              <p className={`${labelClass} mb-2`}>Days available *</p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => (
                  <button key={day} type="button" onClick={() => toggleDay(day)}
                    className={`rounded-lg border px-3 py-2 font-body text-sm transition-colors ${
                      data.availability.daysAvailable.includes(day)
                        ? 'border-vm-navy bg-vm-navy text-vm-white'
                        : 'border-vm-border bg-vm-white text-vm-text hover:border-vm-cyan'
                    }`}>{day.slice(0, 3)}</button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="preferredTime" className={labelClass}>Preferred time *</label>
              <select id="preferredTime" required className={inputClass} value={data.availability.preferredTime}
                onChange={(e) => update('availability', {
                  ...data.availability,
                  preferredTime: e.target.value as TalentApplicationPayload['availability']['preferredTime'],
                })}>
                <option value="">Select a time block</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <div>
              <label htmlFor="maxHours" className={labelClass}>Maximum hours per week *</label>
              <input id="maxHours" required className={inputClass} placeholder="e.g. 25"
                value={data.availability.maxHoursPerWeek}
                onChange={(e) => update('availability', { ...data.availability, maxHoursPerWeek: e.target.value })} />
            </div>
            <YesNoField label="Are you available for weekend turnovers?"
              value={data.availability.weekendTurnovers}
              onChange={(v) => update('availability', { ...data.availability, weekendTurnovers: v })} />
          </SectionCard>

          <SectionCard id="areas" title="Service Areas" description="Select all markets where you can reliably serve clients.">
            <CheckboxGroup label="Service areas *" options={SERVICE_AREAS} selected={data.serviceAreas.areas} onToggle={toggleArea} />
            {data.serviceAreas.areas.includes('Other') && (
              <div>
                <label htmlFor="otherArea" className={labelClass}>Describe other area *</label>
                <input id="otherArea" className={inputClass} value={data.serviceAreas.otherArea}
                  onChange={(e) => update('serviceAreas', { ...data.serviceAreas, otherArea: e.target.value })} />
              </div>
            )}
            <div>
              <label htmlFor="maxTravel" className={labelClass}>Maximum travel distance *</label>
              <input id="maxTravel" required className={inputClass} placeholder="e.g. 30 miles"
                value={data.serviceAreas.maxTravelDistance}
                onChange={(e) => update('serviceAreas', { ...data.serviceAreas, maxTravelDistance: e.target.value })} />
            </div>
          </SectionCard>

          <SectionCard id="experience" title="Experience">
            <YesNoField label="Have you worked professionally as a cleaner?"
              value={data.experience.workedProfessionally}
              onChange={(v) => update('experience', { ...data.experience, workedProfessionally: v })} />
            <div>
              <label htmlFor="years" className={labelClass}>Years of cleaning experience *</label>
              <select id="years" required className={inputClass} value={data.experience.yearsExperience}
                onChange={(e) => update('experience', { ...data.experience, yearsExperience: e.target.value })}>
                <option value="">Select</option>
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1–2 years">1–2 years</option>
                <option value="3–5 years">3–5 years</option>
                <option value="5+ years">5+ years</option>
              </select>
            </div>
            <CheckboxGroup label="Experience types" options={EXPERIENCE_TYPES}
              selected={data.experience.experienceTypes}
              onToggle={(item) => {
                const types = data.experience.experienceTypes;
                update('experience', {
                  ...data.experience,
                  experienceTypes: types.includes(item) ? types.filter((t) => t !== item) : [...types, item],
                });
              }} />
          </SectionCard>

          <SectionCard id="skills" title="Skills Self-Rating" description="Rate your confidence from 1 (developing) to 5 (expert).">
            {SKILL_RATING_KEYS.map((key) => (
              <RatingRow key={key} label={SKILL_RATING_LABELS[key]} value={data.skills[key]}
                onChange={(n) => update('skills', { ...data.skills, [key]: n })} />
            ))}
          </SectionCard>

          <SectionCard id="equipment" title="Equipment & Technology">
            <CheckboxGroup label="What do you have reliable access to?" options={EQUIPMENT_ITEMS}
              selected={data.equipment} onToggle={toggleEquipment} />
          </SectionCard>

          <SectionCard id="hospitality" title="Hospitality Mindset" description="We care about judgment, integrity, and guest-ready standards.">
            {(
              [
                ['meaningOfClean', 'What does “clean” mean to you?'],
                ['exceededExpectations', 'Describe a time you exceeded someone’s expectations.'],
                ['foundWeddingRing', 'If you found a guest’s wedding ring after checkout, what would you do?'],
                ['noticedDamage', 'If you noticed damage before guests arrived, what would you do?'],
                ['finishedEarly', 'If you finished early, what would you do?'],
                ['meaningOfExcellence', 'What does excellence mean to you?'],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label htmlFor={key} className={labelClass}>{label} *</label>
                <textarea id={key} required rows={3} className={inputClass}
                  value={data.hospitality[key]}
                  onChange={(e) => update('hospitality', { ...data.hospitality, [key]: e.target.value })} />
              </div>
            ))}
          </SectionCard>

          <SectionCard id="references" title="References" description="Provide up to three professional references. At least one is required.">
            {data.references.map((ref, i) => (
              <div key={i} className="rounded-xl border border-vm-border bg-vm-surface/50 p-4">
                <p className="mb-3 font-heading text-sm font-semibold text-vm-navy">Reference {i + 1}</p>
                <FieldGrid>
                  <div>
                    <label className={labelClass}>Name</label>
                    <input className={inputClass} value={ref.name}
                      onChange={(e) => {
                        const refs = [...data.references];
                        refs[i] = { ...refs[i], name: e.target.value };
                        update('references', refs);
                      }} />
                  </div>
                  <div>
                    <label className={labelClass}>Phone</label>
                    <input type="tel" className={inputClass} value={ref.phone}
                      onChange={(e) => {
                        const refs = [...data.references];
                        refs[i] = { ...refs[i], phone: e.target.value };
                        update('references', refs);
                      }} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Relationship</label>
                    <input className={inputClass} value={ref.relationship}
                      onChange={(e) => {
                        const refs = [...data.references];
                        refs[i] = { ...refs[i], relationship: e.target.value };
                        update('references', refs);
                      }} />
                  </div>
                </FieldGrid>
              </div>
            ))}
          </SectionCard>

          <SectionCard id="confirm" title="Final Confirmation">
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-vm-border p-4">
              <input type="checkbox" required checked={data.consents.backgroundCheck}
                onChange={(e) => update('consents', { ...data.consents, backgroundCheck: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan" />
              <span className="font-body text-sm text-vm-text">
                I consent to VelocityMaid conducting reference checks and, if selected, a background check according to applicable law. *
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-vm-border p-4">
              <input type="checkbox" required checked={data.consents.certificationTraining}
                onChange={(e) => update('consents', { ...data.consents, certificationTraining: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan" />
              <span className="font-body text-sm text-vm-text">
                I understand that all accepted cleaners must complete VelocityMaid Certification training. *
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-vm-border p-4">
              <input type="checkbox" required checked={data.consents.informationAccurate}
                onChange={(e) => update('consents', { ...data.consents, informationAccurate: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan" />
              <span className="font-body text-sm text-vm-text">
                I confirm that the information provided is accurate. *
              </span>
            </label>

            <button type="submit" disabled={submitting}
              className="btn-tactile mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-vm-navy py-4 font-heading text-sm font-bold uppercase tracking-wider text-vm-white shadow-md transition-opacity hover:bg-vm-navy/90 disabled:opacity-60">
              {submitting ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</>
              ) : (
                <>Submit Application <ArrowRight className="h-5 w-5" /></>
              )}
            </button>
            <p className={helperClass}>Typical review time: 2–3 business days.</p>
          </SectionCard>
        </form>

        <p className="py-8 text-center font-body text-xs text-vm-muted">
          VelocityMaid · Certified Cleaning Professionals · Vermont &amp; New Jersey
        </p>
      </div>
    </div>
  );
}
