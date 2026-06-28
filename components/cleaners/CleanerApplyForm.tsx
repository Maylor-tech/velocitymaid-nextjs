"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import Toast from "@/components/ui/toast";
import {
  APPLY_STATE_OPTIONS,
  EMPTY_CLEANER_APPLY,
  HOW_HEARD_OPTIONS,
  HOURS_PER_WEEK_OPTIONS,
  PROPERTY_TYPE_OPTIONS,
  WEEKDAY_OPTIONS,
  YEARS_EXPERIENCE_OPTIONS,
  type CleanerApplyPayload,
} from "@/lib/cleaners/cleanerApplyTypes";
import {
  INELIGIBLE_APPLICATION_MESSAGE,
  isCleanerApplyIneligible,
  validateCleanerApply,
} from "@/lib/cleaners/validateCleanerApply";
import { parseApplyMarket } from "@/lib/cleaners/applyMarket";

interface Branch {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  status: string;
  country?: string;
}

const inputClass =
  "w-full border border-vm-border rounded-lg px-4 py-3 font-body text-sm text-vm-text focus:outline-none focus:border-vm-cyan focus:ring-1 focus:ring-vm-cyan transition-colors";
const labelClass = "font-heading font-semibold text-vm-navy text-sm mb-1 block";
const helperClass = "font-body text-xs text-vm-muted mt-1";
const sectionDividerClass = "border-t border-vm-border pt-6 mt-6";
const sectionHeadingClass = "font-heading font-bold text-vm-navy text-lg mb-4";

const USA_SUBTITLE =
  "Join the VelocityMaid team and help us deliver professional cleaning and property care across Vermont and New Jersey.";

function isUsBranch(branch: Branch): boolean {
  const country = branch.country || "";
  return country === "USA" || country === "US" || country === "United States";
}

export default function CleanerApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const market = parseApplyMarket(
    searchParams.get("market"),
    searchParams.get("branch")
  );

  const [form, setForm] = useState<CleanerApplyPayload>(EMPTY_CLEANER_APPLY);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [ineligible, setIneligible] = useState(false);

  const usBranches = useMemo(
    () => branches.filter(isUsBranch),
    [branches]
  );

  const selectedBranch = usBranches.find((b) => b.id === form.personal.branchId);
  const isVermontBranch = selectedBranch?.slug === "vermont";

  useEffect(() => {
    fetch("/api/branches")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBranches(data.branches);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (usBranches.length === 0) return;
    const slug = market === "vermont" ? "vermont" : "new-jersey";
    const branch = usBranches.find((b) => b.slug === slug) ?? usBranches[0];
    if (!branch) return;

    setForm((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        branchId: prev.personal.branchId || branch.id,
        state:
          prev.personal.state ||
          (branch.slug === "vermont"
            ? "Vermont"
            : branch.slug === "new-jersey"
              ? "New Jersey"
              : prev.personal.state),
      },
    }));
  }, [market, usBranches]);

  useEffect(() => {
    if (!form.personal.state || usBranches.length === 0) return;
    const slug =
      form.personal.state === "Vermont"
        ? "vermont"
        : form.personal.state === "New Jersey"
          ? "new-jersey"
          : null;
    if (!slug) return;
    const branch = usBranches.find((b) => b.slug === slug);
    if (branch && branch.id !== form.personal.branchId) {
      setForm((prev) => ({
        ...prev,
        personal: { ...prev.personal, branchId: branch.id },
      }));
    }
  }, [form.personal.state, usBranches, form.personal.branchId]);

  function updatePersonal<K extends keyof CleanerApplyPayload["personal"]>(
    key: K,
    value: CleanerApplyPayload["personal"][K]
  ) {
    setForm((prev) => ({
      ...prev,
      personal: { ...prev.personal, [key]: value },
    }));
    setIneligible(false);
    setError(null);
  }

  function updateSection<K extends keyof Omit<CleanerApplyPayload, "portalVersion">>(
    key: K,
    value: CleanerApplyPayload[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIneligible(false);
    setError(null);
  }

  function toggleInArray(
    section: "availability" | "experience",
    field: "daysAvailable" | "propertyTypes",
    value: string
  ) {
    setForm((prev) => {
      const current = prev[section][field] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return {
        ...prev,
        [section]: { ...prev[section], [field]: next },
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIneligible(false);

    if (isCleanerApplyIneligible(form)) {
      setIneligible(true);
      setError(INELIGIBLE_APPLICATION_MESSAGE);
      setShowToast(true);
      return;
    }

    const validationError = validateCleanerApply(form, { isVermontBranch });
    if (validationError) {
      setError(validationError);
      setShowToast(true);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/cleaners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application: form }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setShowToast(true);
        setTimeout(() => router.push("/cleaners/apply/success"), 2000);
      } else {
        setError(data.error || "Failed to submit application");
        setShowToast(true);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-vm-surface flex flex-col">
      <header className="w-full bg-vm-navy py-5 px-6">
        <div className="max-w-xl mx-auto">
          <Link href="/">
            <BrandLogo theme="dark" size="header" showTagline={false} />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 py-10 sm:py-12">
        <div className="bg-white border border-vm-border rounded-2xl shadow-sm max-w-xl w-full mx-auto p-8 sm:p-10">
          <div className="text-center mb-8">
            <span className="inline-block bg-vm-cyan/10 text-vm-cyan text-xs font-semibold font-body px-3 py-1 rounded-full mb-4">
              Now hiring
            </span>
            <h1 className="font-heading font-bold text-vm-navy text-2xl">
              Apply to be a Cleaner
            </h1>
            <p className="font-body text-vm-muted text-base mt-2">{USA_SUBTITLE}</p>
          </div>

          <Toast
            message={
              success
                ? "Application submitted successfully!"
                : error || "Failed to submit application"
            }
            type={success ? "success" : "error"}
            visible={showToast}
            onClose={() => setShowToast(false)}
          />

          {ineligible && (
            <div className="mb-6 rounded-lg border border-vm-border bg-vm-surface px-4 py-3 font-body text-sm text-vm-navy">
              {INELIGIBLE_APPLICATION_MESSAGE}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Section 1 — Personal */}
            <div>
              <label htmlFor="fullName" className={labelClass}>
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                value={form.personal.fullName}
                onChange={(e) => updatePersonal("fullName", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={form.personal.email}
                onChange={(e) => updatePersonal("email", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                value={form.personal.phone}
                onChange={(e) => updatePersonal("phone", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="city" className={labelClass}>
                City / Town *
              </label>
              <input
                id="city"
                type="text"
                placeholder="e.g. Ludlow, Newark, Chester"
                value={form.personal.city}
                onChange={(e) => updatePersonal("city", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="state" className={labelClass}>
                State *
              </label>
              <select
                id="state"
                value={form.personal.state}
                onChange={(e) =>
                  updatePersonal(
                    "state",
                    e.target.value as CleanerApplyPayload["personal"]["state"]
                  )
                }
                className={inputClass}
                required
              >
                <option value="">Select state</option>
                {APPLY_STATE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="branchId" className={labelClass}>
                Preferred Branch *
              </label>
              <select
                id="branchId"
                value={form.personal.branchId}
                onChange={(e) => updatePersonal("branchId", e.target.value)}
                className={inputClass}
                required
              >
                <option value="">Select a branch</option>
                {usBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.city}, {branch.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="neighborhood" className={labelClass}>
                Neighborhood or nearest town *
              </label>
              <input
                id="neighborhood"
                type="text"
                placeholder="e.g. Okemo Valley, Ironbound, Chester village"
                value={form.personal.neighborhood}
                onChange={(e) => updatePersonal("neighborhood", e.target.value)}
                className={inputClass}
                required
              />
            </div>

            {/* Section 2 — Eligibility */}
            <div className={sectionDividerClass}>
              <h2 className={sectionHeadingClass}>Eligibility</h2>

              <RadioField
                label="Are you 18 or older?"
                name="age18OrOlder"
                required
                value={form.eligibility.age18OrOlder}
                options={["Yes", "No"]}
                onChange={(v) =>
                  updateSection("eligibility", {
                    ...form.eligibility,
                    age18OrOlder: v as "Yes" | "No",
                  })
                }
              />

              <RadioField
                label="Are you legally authorized to work in the United States?"
                name="authorizedToWork"
                required
                value={form.eligibility.authorizedToWork}
                options={["Yes", "No"]}
                onChange={(v) =>
                  updateSection("eligibility", {
                    ...form.eligibility,
                    authorizedToWork: v as "Yes" | "No",
                  })
                }
              />

              <RadioField
                label="Do you have a valid driver's license?"
                name="hasDriversLicense"
                required
                value={form.eligibility.hasDriversLicense}
                options={["Yes", "No"]}
                onChange={(v) =>
                  updateSection("eligibility", {
                    ...form.eligibility,
                    hasDriversLicense: v as "Yes" | "No",
                  })
                }
              />

              <RadioField
                label="Do you have reliable personal transportation?"
                name="reliableTransportation"
                required
                value={form.eligibility.reliableTransportation}
                options={["Yes", "No"]}
                onChange={(v) =>
                  updateSection("eligibility", {
                    ...form.eligibility,
                    reliableTransportation: v as "Yes" | "No",
                  })
                }
              />

              {isVermontBranch && (
                <RadioField
                  label="Are you comfortable driving 30–60 miles for a job? (Vermont properties can be spread across the region)"
                  name="comfortableDriving30to60Miles"
                  required
                  value={form.eligibility.comfortableDriving30to60Miles}
                  options={["Yes", "No", "Sometimes"]}
                  onChange={(v) =>
                    updateSection("eligibility", {
                      ...form.eligibility,
                      comfortableDriving30to60Miles: v as "Yes" | "No" | "Sometimes",
                    })
                  }
                />
              )}

              <label className="flex items-start gap-2 cursor-pointer mt-4">
                <input
                  type="checkbox"
                  checked={form.eligibility.backgroundCheckConsent}
                  onChange={(e) =>
                    updateSection("eligibility", {
                      ...form.eligibility,
                      backgroundCheckConsent: e.target.checked,
                    })
                  }
                  className="mt-0.5 w-5 h-5 text-vm-cyan focus:ring-vm-cyan border-vm-border rounded"
                />
                <span className="font-body text-sm text-vm-text">
                  I consent to a background check as part of the VelocityMaid
                  application process. *
                </span>
              </label>
            </div>

            {/* Section 3 — Availability */}
            <div className={sectionDividerClass}>
              <h2 className={sectionHeadingClass}>Your Availability</h2>

              <div>
                <p className={labelClass}>Days available *</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {WEEKDAY_OPTIONS.map((day) => (
                    <label
                      key={day}
                      className="flex items-center gap-2 font-body text-sm text-vm-text cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.availability.daysAvailable.includes(day)}
                        onChange={() =>
                          toggleInArray("availability", "daysAvailable", day)
                        }
                        className="rounded border-vm-border text-vm-cyan focus:ring-vm-cyan"
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="hoursPerWeek" className={labelClass}>
                  Hours available per week *
                </label>
                <select
                  id="hoursPerWeek"
                  value={form.availability.hoursPerWeek}
                  onChange={(e) =>
                    updateSection("availability", {
                      ...form.availability,
                      hoursPerWeek: e.target.value,
                    })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select hours</option>
                  {HOURS_PER_WEEK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <RadioField
                label="Are you available for same-day bookings when needed?"
                name="sameDayBookings"
                required
                helper="This is common during Vermont peak seasons and holiday weeks"
                value={form.availability.sameDayBookings}
                options={["Yes", "Sometimes", "No"]}
                onChange={(v) =>
                  updateSection("availability", {
                    ...form.availability,
                    sameDayBookings: v as "Yes" | "Sometimes" | "No",
                  })
                }
              />

              {isVermontBranch && (
                <RadioField
                  label="Are you available during ski season (December through March)?"
                  name="skiSeasonAvailable"
                  required
                  helper="Winter is VelocityMaid's busiest season in Vermont"
                  value={form.availability.skiSeasonAvailable}
                  options={["Yes", "No", "Unsure"]}
                  onChange={(v) =>
                    updateSection("availability", {
                      ...form.availability,
                      skiSeasonAvailable: v as "Yes" | "No" | "Unsure",
                    })
                  }
                />
              )}

              <RadioField
                label="Do you currently have other employment?"
                name="otherEmployment"
                required
                value={form.availability.otherEmployment}
                options={["Yes", "No"]}
                onChange={(v) =>
                  updateSection("availability", {
                    ...form.availability,
                    otherEmployment: v as "Yes" | "No",
                  })
                }
              />
            </div>

            {/* Section 4 — Experience */}
            <div className={sectionDividerClass}>
              <h2 className={sectionHeadingClass}>Your Experience</h2>

              <RadioField
                label="Do you have previous cleaning experience?"
                name="hasCleaningExperience"
                required
                value={form.experience.hasCleaningExperience}
                options={["Yes", "No"]}
                onChange={(v) =>
                  updateSection("experience", {
                    ...form.experience,
                    hasCleaningExperience: v as "Yes" | "No",
                  })
                }
              />

              <div>
                <label htmlFor="yearsExperience" className={labelClass}>
                  Years of cleaning experience *
                </label>
                <select
                  id="yearsExperience"
                  value={form.experience.yearsExperience}
                  onChange={(e) =>
                    updateSection("experience", {
                      ...form.experience,
                      yearsExperience: e.target.value,
                    })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select experience</option>
                  {YEARS_EXPERIENCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className={labelClass}>Types of properties you have cleaned *</p>
                <div className="space-y-2">
                  {PROPERTY_TYPE_OPTIONS.map((type) => (
                    <label
                      key={type}
                      className="flex items-start gap-2 font-body text-sm text-vm-text cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.experience.propertyTypes.includes(type)}
                        onChange={() =>
                          toggleInArray("experience", "propertyTypes", type)
                        }
                        className="mt-0.5 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

              <RadioField
                label="Have you done vacation rental turnovers before?"
                name="vacationRentalTurnovers"
                required
                value={form.experience.vacationRentalTurnovers}
                options={["Yes", "No"]}
                onChange={(v) =>
                  updateSection("experience", {
                    ...form.experience,
                    vacationRentalTurnovers: v as "Yes" | "No",
                  })
                }
              />

              <RadioField
                label="Are you comfortable handling laundry on site (washing, drying, folding linens)?"
                name="comfortableWithLaundry"
                required
                value={form.experience.comfortableWithLaundry}
                options={["Yes", "No"]}
                onChange={(v) =>
                  updateSection("experience", {
                    ...form.experience,
                    comfortableWithLaundry: v as "Yes" | "No",
                  })
                }
              />

              <RadioField
                label="Are you comfortable with basic hot tub wipe-down and water testing?"
                name="hotTubComfort"
                helper="Some Vermont properties include this as an add-on service"
                value={form.experience.hotTubComfort}
                options={["Yes", "No", "Willing to learn"]}
                onChange={(v) =>
                  updateSection("experience", {
                    ...form.experience,
                    hotTubComfort: v as "Yes" | "No" | "Willing to learn",
                  })
                }
              />

              <RadioField
                label="Do you currently have your own cleaning supplies?"
                name="cleaningSupplies"
                required
                value={form.experience.cleaningSupplies}
                options={["Yes, full kit", "Some basics", "No — I would need guidance"]}
                onChange={(v) =>
                  updateSection("experience", {
                    ...form.experience,
                    cleaningSupplies: v as CleanerApplyPayload["experience"]["cleaningSupplies"],
                  })
                }
              />
            </div>

            {/* Section 5 — Professional fit */}
            <div className={sectionDividerClass}>
              <h2 className={sectionHeadingClass}>A Little About You</h2>

              <RadioField
                label="Are you currently working as an independent cleaner?"
                name="independentCleaner"
                required
                value={form.professionalFit.independentCleaner}
                options={["Yes", "No", "I was previously"]}
                onChange={(v) =>
                  updateSection("professionalFit", {
                    ...form.professionalFit,
                    independentCleaner: v as "Yes" | "No" | "I was previously",
                  })
                }
              />

              <div>
                <label htmlFor="whyVelocityMaid" className={labelClass}>
                  Why do you want to work with VelocityMaid? *
                </label>
                <textarea
                  id="whyVelocityMaid"
                  rows={4}
                  maxLength={300}
                  placeholder="Tell us what draws you to professional cleaning work and why VelocityMaid stands out."
                  value={form.professionalFit.whyVelocityMaid}
                  onChange={(e) =>
                    updateSection("professionalFit", {
                      ...form.professionalFit,
                      whyVelocityMaid: e.target.value,
                    })
                  }
                  className={`${inputClass} resize-y min-h-[100px]`}
                  required
                />
                <p className={helperClass}>
                  {form.professionalFit.whyVelocityMaid.length}/300 characters
                </p>
              </div>

              <div>
                <label htmlFor="howHeardAboutUs" className={labelClass}>
                  How did you hear about us? *
                </label>
                <select
                  id="howHeardAboutUs"
                  value={form.professionalFit.howHeardAboutUs}
                  onChange={(e) =>
                    updateSection("professionalFit", {
                      ...form.professionalFit,
                      howHeardAboutUs: e.target.value,
                    })
                  }
                  className={inputClass}
                  required
                >
                  <option value="">Select one</option>
                  {HOW_HEARD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="anythingElse" className={labelClass}>
                  Anything else we should know?
                </label>
                <textarea
                  id="anythingElse"
                  rows={3}
                  maxLength={300}
                  value={form.professionalFit.anythingElse}
                  onChange={(e) =>
                    updateSection("professionalFit", {
                      ...form.professionalFit,
                      anythingElse: e.target.value,
                    })
                  }
                  className={`${inputClass} resize-y min-h-[80px]`}
                />
                <p className={helperClass}>
                  {form.professionalFit.anythingElse.length}/300 characters
                </p>
              </div>
            </div>

            {/* Section 6 — Agreements */}
            <div className={sectionDividerClass}>
              <h2 className={sectionHeadingClass}>Before You Apply</h2>

              <AgreementCheckbox
                checked={form.agreements.independentContractor}
                onChange={(checked) =>
                  updateSection("agreements", {
                    ...form.agreements,
                    independentContractor: checked,
                  })
                }
                label="I understand this is an independent contractor position. I am responsible for my own taxes and transportation."
              />
              <AgreementCheckbox
                checked={form.agreements.professionalConduct}
                onChange={(checked) =>
                  updateSection("agreements", {
                    ...form.agreements,
                    professionalConduct: checked,
                  })
                }
                label="I understand VelocityMaid requires professional conduct, reliable attendance, and photo documentation on every job."
              />
              <AgreementCheckbox
                checked={form.agreements.hospitalityStandard}
                onChange={(checked) =>
                  updateSection("agreements", {
                    ...form.agreements,
                    hospitalityStandard: checked,
                  })
                }
                label="I have read and understand that VelocityMaid operates to a hospitality standard. I agree to represent the brand professionally."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-vm-cyan text-vm-navy font-heading font-semibold py-4 rounded-lg hover:bg-vm-cyan-dark transition-colors duration-200 mt-2 inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                </>
              ) : (
                <>
                  Submit Application <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-vm-muted text-xs text-center py-6 font-body max-w-xl">
          VelocityMaid · Professional Cleaning &amp; Property Readiness · Vermont
          &amp; New Jersey
        </p>
      </div>
    </div>
  );
}

function RadioField({
  label,
  name,
  options,
  value,
  onChange,
  required,
  helper,
}: {
  label: string;
  name: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
}) {
  return (
    <fieldset className="mt-4">
      <legend className={labelClass}>
        {label}
        {required ? " *" : ""}
      </legend>
      <div className="flex flex-wrap gap-4 mt-2">
        {options.map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 font-body text-sm text-vm-text cursor-pointer"
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="border-vm-border text-vm-cyan focus:ring-vm-cyan"
              required={required && !value}
            />
            {opt}
          </label>
        ))}
      </div>
      {helper && <p className={helperClass}>{helper}</p>}
    </fieldset>
  );
}

function AgreementCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer mt-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 text-vm-cyan focus:ring-vm-cyan border-vm-border rounded"
      />
      <span className="font-body text-sm text-vm-text">{label} *</span>
    </label>
  );
}
