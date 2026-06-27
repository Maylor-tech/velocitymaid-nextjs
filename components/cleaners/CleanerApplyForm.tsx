"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/brand";
import Toast from "@/components/ui/toast";
import {
  APPLY_MARKET_CONFIG,
  parseApplyMarket,
  type ApplyMarket,
} from "@/lib/cleaners/applyMarket";

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
const labelClass =
  "font-heading font-semibold text-vm-navy text-sm mb-1 block";
const helperClass = "font-body text-xs text-vm-muted mt-1";
const sectionDividerClass = "border-t border-vm-border pt-6 mt-6";

const USA_SUBTITLE =
  "Join the VelocityMaid team and help us deliver professional cleaning and property care across Vermont and New Jersey.";

export default function CleanerApplyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const market: ApplyMarket = parseApplyMarket(
    searchParams.get("market"),
    searchParams.get("branch")
  );
  const marketConfig = APPLY_MARKET_CONFIG[market];
  const pageSubtitle =
    market === "jamaica" ? marketConfig.subtitle : USA_SUBTITLE;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    country: "",
    branchId: "",
    experienceLevel: "",
    areaOfResidence: "",
    daysAvailable: [] as string[],
    weekendAbility: false,
    canTravelToVillas: false,
    notes: "",
  });

  const [idFile, setIdFile] = useState<File | null>(null);
  const [referencesFile, setReferencesFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (branches.length === 0) return;
    const branch = branches.find((b) => b.slug === marketConfig.branchSlug);
    setFormData((prev) => ({
      ...prev,
      country: marketConfig.country === "USA" ? "USA" : "Jamaica",
      branchId: branch?.id ?? prev.branchId,
    }));
  }, [market, branches, marketConfig.branchSlug, marketConfig.country]);

  const availableBranches = formData.country
    ? branches.filter((b) => {
        const branchCountry = b.country || "";
        if (formData.country === "Jamaica") {
          return branchCountry === "Jamaica" || branchCountry === "JM";
        }
        if (formData.country === "USA") {
          return (
            branchCountry === "USA" ||
            branchCountry === "US" ||
            branchCountry === "United States"
          );
        }
        return false;
      })
    : branches;

  useEffect(() => {
    if (formData.country && formData.branchId) {
      const selectedBranch = branches.find((b) => b.id === formData.branchId);
      if (selectedBranch) {
        const branchCountry = selectedBranch.country || "";
        const countryMatch =
          (formData.country === "Jamaica" &&
            (branchCountry === "Jamaica" || branchCountry === "JM")) ||
          (formData.country === "USA" &&
            (branchCountry === "USA" ||
              branchCountry === "US" ||
              branchCountry === "United States"));
        if (!countryMatch) {
          setFormData((prev) => ({ ...prev, branchId: "" }));
        }
      }
    }
  }, [formData.country, branches, formData.branchId]);

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/branches");
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches);
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      setError("Please enter your full name");
      setShowToast(true);
      return;
    }
    if (!formData.email) {
      setError("Please enter your email address");
      setShowToast(true);
      return;
    }
    if (!formData.phone) {
      setError("Please enter your phone number");
      setShowToast(true);
      return;
    }
    if (!formData.country) {
      setError("Please select a country");
      setShowToast(true);
      return;
    }
    if (!formData.branchId) {
      setError("Please select a branch");
      setShowToast(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let idUploadUrl = null;
      let referencesUploadUrl = null;

      if (idFile) {
        const idFormData = new FormData();
        idFormData.append("file", idFile);
        idFormData.append("type", "id");
        const idResponse = await fetch("/api/cleaners/apply/upload", {
          method: "POST",
          body: idFormData,
        });
        const idData = await idResponse.json();
        if (idData.success) {
          idUploadUrl = idData.url;
        }
      }

      if (referencesFile) {
        const refFormData = new FormData();
        refFormData.append("file", referencesFile);
        refFormData.append("type", "references");
        const refResponse = await fetch("/api/cleaners/apply/upload", {
          method: "POST",
          body: refFormData,
        });
        const refData = await refResponse.json();
        if (refData.success) {
          referencesUploadUrl = refData.url;
        }
      }

      const response = await fetch("/api/cleaners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          daysAvailable: formData.daysAvailable,
          idUploadUrl,
          referencesUploadUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setShowToast(true);
        setTimeout(() => {
          router.push("/cleaners/apply/success");
        }, 2000);
      } else {
        setError(data.error || "Failed to submit application");
        setShowToast(true);
      }
    } catch (err: unknown) {
      console.error("Error submitting application:", err);
      setError(
        err instanceof Error ? err.message : "Failed to submit application"
      );
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData((prev) => ({
      ...prev,
      daysAvailable: prev.daysAvailable.includes(day)
        ? prev.daysAvailable.filter((d) => d !== day)
        : [...prev.daysAvailable, day],
    }));
  };

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
              {marketConfig.badge}
            </span>
            <h1 className="font-heading font-bold text-vm-navy text-2xl">
              Apply to be a Cleaner
            </h1>
            <p className="font-body text-vm-muted text-base mt-2">
              {pageSubtitle}
            </p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Personal info */}
          <div>
            <label htmlFor="name" className={labelClass}>
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="whatsappNumber" className={labelClass}>
              {marketConfig.whatsappLabel}
            </label>
            <input
              type="tel"
              id="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={(e) =>
                setFormData({ ...formData, whatsappNumber: e.target.value })
              }
              placeholder={marketConfig.whatsappPlaceholder}
              className={inputClass}
            />
            <p className={helperClass}>{marketConfig.whatsappHelper}</p>
          </div>

          {/* Section 2: Location + branch */}
          <div className={sectionDividerClass}>
            <div>
              <label htmlFor="country" className={labelClass}>
                Country *
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    country: e.target.value,
                    branchId: "",
                  })
                }
                className={inputClass}
                required
                aria-required="true"
              >
                <option value="">Select a country</option>
                <option value="Jamaica">Jamaica</option>
                <option value="USA">United States</option>
              </select>
              {!formData.country && (
                <p className={helperClass}>You must select a country to apply</p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="branchId" className={labelClass}>
                Preferred Branch *
              </label>
              <select
                id="branchId"
                value={formData.branchId}
                onChange={(e) =>
                  setFormData({ ...formData, branchId: e.target.value })
                }
                disabled={!formData.country}
                className={`${inputClass} ${
                  !formData.country ? "opacity-50 cursor-not-allowed bg-vm-surface" : ""
                }`}
                required
                aria-required="true"
              >
                <option value="">
                  {!formData.country ? "Select a country first" : "Select a branch"}
                </option>
                {availableBranches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name} ({branch.city}, {branch.state})
                  </option>
                ))}
              </select>
              {!formData.country && (
                <p className={helperClass}>
                  Select a country first to see available branches
                </p>
              )}
              {formData.country && !formData.branchId && (
                <p className={helperClass}>You must select a branch to apply</p>
              )}
            </div>

            <div className="mt-4">
              <label htmlFor="areaOfResidence" className={labelClass}>
                Area of Residence
              </label>
              <input
                type="text"
                id="areaOfResidence"
                value={formData.areaOfResidence}
                onChange={(e) =>
                  setFormData({ ...formData, areaOfResidence: e.target.value })
                }
                placeholder={marketConfig.areaPlaceholder}
                className={inputClass}
              />
            </div>
          </div>

          {/* Section 3: Experience */}
          <div className={sectionDividerClass}>
            <div>
              <label htmlFor="experienceLevel" className={labelClass}>
                Experience Level
              </label>
              <select
                id="experienceLevel"
                value={formData.experienceLevel}
                onChange={(e) =>
                  setFormData({ ...formData, experienceLevel: e.target.value })
                }
                className={inputClass}
              >
                <option value="">Select experience level</option>
                <option value="None">None</option>
                <option value="Moderate">Moderate (1-2 years)</option>
                <option value="Experienced">Experienced (3+ years)</option>
              </select>
            </div>

            <div className="mt-4">
              <label className={`${labelClass} mb-2`}>Days Available</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg border font-body text-sm transition-colors ${
                      formData.daysAvailable.includes(day)
                        ? "bg-vm-navy text-white border-vm-navy"
                        : "bg-white text-vm-text border-vm-border hover:border-vm-cyan"
                    }`}
                  >
                    {day.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className={`${labelClass} mb-2`}>Weekend Availability</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.weekendAbility}
                  onChange={(e) =>
                    setFormData({ ...formData, weekendAbility: e.target.checked })
                  }
                  className="w-5 h-5 text-vm-cyan focus:ring-vm-cyan border-vm-border rounded"
                />
                <span className="font-body text-sm text-vm-text">
                  I can work on weekends (Saturday & Sunday)
                </span>
              </label>
            </div>

            <div className="mt-4">
              <label className={`${labelClass} mb-2`}>Villa Travel</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.canTravelToVillas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      canTravelToVillas: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-vm-cyan focus:ring-vm-cyan border-vm-border rounded"
                />
                <span className="font-body text-sm text-vm-text">
                  I can travel to villa areas for cleaning jobs
                </span>
              </label>
            </div>

            <div className="mt-4">
              <label htmlFor="idUpload" className={labelClass}>
                ID Document (Optional)
              </label>
              <input
                type="file"
                id="idUpload"
                accept="image/*,.pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                className={inputClass}
              />
              <p className={helperClass}>
                Upload a photo or scan of your government ID
              </p>
            </div>

            <div className="mt-4">
              <label htmlFor="referencesUpload" className={labelClass}>
                References (Optional)
              </label>
              <input
                type="file"
                id="referencesUpload"
                accept="image/*,.pdf"
                onChange={(e) => setReferencesFile(e.target.files?.[0] || null)}
                className={inputClass}
              />
              <p className={helperClass}>
                Upload reference letters or contact information
              </p>
            </div>

            <div className="mt-4">
              <label htmlFor="notes" className={labelClass}>
                Additional Notes
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={inputClass}
                placeholder="Tell us about yourself, your availability, or any questions..."
              />
            </div>
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
