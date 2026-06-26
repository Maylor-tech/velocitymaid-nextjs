"use client";

/**
 * W-9 Tax Onboarding: Cleaner Tax Form
 * 
 * Allows cleaners to fill out and submit W-9 tax information
 * Supports draft saving and final submission
 */

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";

type TaxProfileStatus = "DRAFT" | "SUBMITTED" | "VERIFIED" | "REJECTED";
type TaxIdentificationType = "SSN" | "EIN";
type TaxClassification =
  | "INDIVIDUAL"
  | "C_CORPORATION"
  | "S_CORPORATION"
  | "PARTNERSHIP"
  | "TRUST_ESTATE"
  | "LLC_SINGLE_MEMBER"
  | "LLC_MULTI_MEMBER"
  | "OTHER";

interface TaxProfile {
  id: string;
  status: TaxProfileStatus;
  tinType: TaxIdentificationType | null;
  tinLast4: string | null;
  businessName: string | null;
  classification: TaxClassification | null;
  firstName: string | null;
  lastName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  exemptPayeeCode: string | null;
  exemptFatcaCode: string | null;
  signatureName: string | null;
  signatureDate: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export default function CleanerTaxFormPage() {
  const [profile, setProfile] = useState<TaxProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [tinType, setTinType] = useState<TaxIdentificationType | "">("");
  const [tin, setTin] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [classification, setClassification] = useState<TaxClassification | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [country, setCountry] = useState("US");
  const [exemptPayeeCode, setExemptPayeeCode] = useState("");
  const [exemptFatcaCode, setExemptFatcaCode] = useState("");
  const [signatureName, setSignatureName] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cleaner/tax-profile");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch tax profile");
      }

      if (data.profile) {
        setProfile(data.profile);
        // Populate form with existing data (except TIN - never show full TIN)
        setTinType(data.profile.tinType || "");
        setBusinessName(data.profile.businessName || "");
        setClassification(data.profile.classification || "");
        setFirstName(data.profile.firstName || "");
        setLastName(data.profile.lastName || "");
        setAddressLine1(data.profile.addressLine1 || "");
        setAddressLine2(data.profile.addressLine2 || "");
        setCity(data.profile.city || "");
        setState(data.profile.state || "");
        setZipCode(data.profile.zipCode || "");
        setCountry(data.profile.country || "US");
        setExemptPayeeCode(data.profile.exemptPayeeCode || "");
        setExemptFatcaCode(data.profile.exemptFatcaCode || "");
        setSignatureName(data.profile.signatureName || "");
      }
    } catch (err: any) {
      console.error("Failed to fetch tax profile:", err);
      setError(err.message || "Failed to load tax profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/cleaner/tax-profile/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tinType: tinType || undefined,
          // Do NOT send TIN in draft
          businessName: businessName || undefined,
          classification: classification || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          addressLine1: addressLine1 || undefined,
          addressLine2: addressLine2 || undefined,
          city: city || undefined,
          state: state || undefined,
          zipCode: zipCode || undefined,
          country: country || "US",
          exemptPayeeCode: exemptPayeeCode || undefined,
          exemptFatcaCode: exemptFatcaCode || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save draft");
      }

      setSuccess("Draft saved successfully");
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    if (!tinType) {
      setError("Please select TIN type (SSN or EIN)");
      return;
    }

    if (!tin) {
      setError("TIN is required");
      return;
    }

    if (!firstName || !lastName) {
      setError("First name and last name are required");
      return;
    }

    if (!addressLine1 || !city || !state || !zipCode) {
      setError("Complete address is required");
      return;
    }

    if (!signatureName) {
      setError("Signature name is required");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to submit this tax form? You will not be able to edit it after submission."
      )
    ) {
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/cleaner/tax-profile/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tinType,
          tin, // Send TIN for encryption
          businessName: businessName || undefined,
          classification: classification || undefined,
          firstName,
          lastName,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          city,
          state,
          zipCode,
          country: country || "US",
          exemptPayeeCode: exemptPayeeCode || undefined,
          exemptFatcaCode: exemptFatcaCode || undefined,
          signatureName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit tax profile");
      }

      setSuccess("Tax profile submitted successfully! It will be reviewed by our team.");
      setTin(""); // Clear TIN from form after submission
      await fetchProfile();
    } catch (err: any) {
      setError(err.message || "Failed to submit tax profile");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-vm-cyan-dark" />
        </div>
      </div>
    );
  }

  const isSubmitted = profile?.status === "SUBMITTED" || profile?.status === "VERIFIED";
  const isRejected = profile?.status === "REJECTED";
  const canEdit = !isSubmitted && !profile?.verifiedAt;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-vm-cyan-dark" />
        <h1 className="text-3xl font-bold">W-9 Tax Form</h1>
      </div>

      {/* Status Display */}
      {profile && (
        <div
          className={`rounded-lg p-4 border-2 ${
            profile.status === "VERIFIED"
              ? "bg-vm-success-bg border-vm-success/30"
              : profile.status === "SUBMITTED"
              ? "bg-blue-50 border-blue-200"
              : profile.status === "REJECTED"
              ? "bg-red-50 border-red-200"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {profile.status === "VERIFIED" ? (
              <CheckCircle className="w-5 h-5 text-vm-success" />
            ) : profile.status === "REJECTED" ? (
              <XCircle className="w-5 h-5 text-red-600" />
            ) : profile.status === "SUBMITTED" ? (
              <AlertCircle className="w-5 h-5 text-blue-600" />
            ) : null}
            <div>
              <p className="font-semibold">
                Status: {profile.status.charAt(0) + profile.status.slice(1).toLowerCase()}
              </p>
              {profile.submittedAt && (
                <p className="text-sm text-vm-muted">
                  Submitted: {new Date(profile.submittedAt).toLocaleDateString()}
                </p>
              )}
              {profile.rejectionReason && (
                <p className="text-sm text-red-600 mt-1">
                  Rejection reason: {profile.rejectionReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-vm-success-bg border border-vm-success/30 rounded-lg p-4">
          <p className="text-sm text-vm-success">{success}</p>
        </div>
      )}

      {isRejected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            Your tax profile was rejected. Please review the rejection reason above and resubmit
            after making corrections.
          </p>
        </div>
      )}

      <form onSubmit={canEdit ? handleSubmit : handleSaveDraft} className="space-y-6">
        {/* TIN Section */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Tax Identification Number (TIN)</h2>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-2">
              TIN Type <span className="text-red-500">*</span>
            </label>
            <select
              value={tinType}
              onChange={(e) => setTinType(e.target.value as TaxIdentificationType)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={!canEdit}
              required
            >
              <option value="">Select TIN Type</option>
              <option value="SSN">SSN (Social Security Number)</option>
              <option value="EIN">EIN (Employer Identification Number)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-2">
              {tinType === "SSN" ? "SSN" : tinType === "EIN" ? "EIN" : "TIN"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={tin}
              onChange={(e) => {
                // Allow only digits and dashes
                const value = e.target.value.replace(/[^\d-]/g, "");
                setTin(value);
              }}
              placeholder={tinType === "SSN" ? "XXX-XX-XXXX" : "XX-XXXXXXX"}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={!canEdit || isSubmitted}
              required={canEdit}
              maxLength={11}
            />
            {profile?.tinLast4 && (
              <p className="text-sm text-vm-muted mt-1">
                Current: {profile.tinLast4}
              </p>
            )}
          </div>
        </div>

        {/* Business Information */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Business Information</h2>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-2">
              Business Name (if applicable)
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-2">
              Tax Classification
            </label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as TaxClassification)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={!canEdit}
            >
              <option value="">Select Classification</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="C_CORPORATION">C Corporation</option>
              <option value="S_CORPORATION">S Corporation</option>
              <option value="PARTNERSHIP">Partnership</option>
              <option value="TRUST_ESTATE">Trust/Estate</option>
              <option value="LLC_SINGLE_MEMBER">LLC (Single Member)</option>
              <option value="LLC_MULTI_MEMBER">LLC (Multi-Member)</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!canEdit}
                required={canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!canEdit}
                required={canEdit}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Address</h2>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-2">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={!canEdit}
              required={canEdit}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-2">
              Address Line 2
            </label>
            <input
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!canEdit}
                required={canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!canEdit}
                required={canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                ZIP Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!canEdit}
                required={canEdit}
              />
            </div>
          </div>
        </div>

        {/* Exemptions */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Exemptions (if applicable)</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                Exempt Payee Code
              </label>
              <input
                type="text"
                value={exemptPayeeCode}
                onChange={(e) => setExemptPayeeCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!canEdit}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                Exempt FATCA Code
              </label>
              <input
                type="text"
                value={exemptFatcaCode}
                onChange={(e) => setExemptFatcaCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold">Signature</h2>

          <div>
            <label className="block text-sm font-medium text-vm-text mb-2">
              Signature Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Type your full name to sign"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              disabled={!canEdit}
              required={canEdit}
            />
            <p className="text-sm text-vm-muted mt-1">
              By typing your name, you certify that the information provided is correct.
            </p>
          </div>
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || submitting}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Draft"
              )}
            </button>

            <button
              type="submit"
              disabled={saving || submitting}
              className="px-6 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 inline animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Tax Form"
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}


