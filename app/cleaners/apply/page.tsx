"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, CheckCircle, Loader2, ArrowRight } from 'lucide-react';
import Toast from '@/components/ui/toast';

interface Branch {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  status: string;
}

function CleanerApplyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedBranchSlug = searchParams.get('branch');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    branchId: '',
    experienceLevel: '',
    areaOfResidence: '',
    daysAvailable: [] as string[],
    weekendAbility: false,
    canTravelToVillas: false,
    notes: '',
  });
  
  const [idFile, setIdFile] = useState<File | null>(null);
  const [referencesFile, setReferencesFile] = useState<File | null>(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (preSelectedBranchSlug && branches.length > 0) {
      const branch = branches.find(b => b.slug === preSelectedBranchSlug);
      if (branch) {
        setFormData(prev => ({ ...prev, branchId: branch.id }));
      }
    }
  }, [preSelectedBranchSlug, branches]);

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches');
      const data = await response.json();
      if (data.success) {
        setBranches(data.branches.filter((b: Branch) => b.status === 'ACTIVE' || b.status === 'COMING_SOON'));
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields with specific error messages
    if (!formData.name) {
      setError('Please enter your full name');
      setShowToast(true);
      return;
    }
    if (!formData.email) {
      setError('Please enter your email address');
      setShowToast(true);
      return;
    }
    if (!formData.phone) {
      setError('Please enter your phone number');
      setShowToast(true);
      return;
    }
    if (!formData.branchId) {
      setError('Please select a branch');
      setShowToast(true);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload files if provided
      let idUploadUrl = null;
      let referencesUploadUrl = null;

      if (idFile) {
        const idFormData = new FormData();
        idFormData.append('file', idFile);
        idFormData.append('type', 'id');
        const idResponse = await fetch('/api/cleaners/apply/upload', {
          method: 'POST',
          body: idFormData,
        });
        const idData = await idResponse.json();
        if (idData.success) {
          idUploadUrl = idData.url;
        }
      }

      if (referencesFile) {
        const refFormData = new FormData();
        refFormData.append('file', referencesFile);
        refFormData.append('type', 'references');
        const refResponse = await fetch('/api/cleaners/apply/upload', {
          method: 'POST',
          body: refFormData,
        });
        const refData = await refResponse.json();
        if (refData.success) {
          referencesUploadUrl = refData.url;
        }
      }

      const response = await fetch('/api/cleaners/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          router.push('/cleaners/apply/success');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit application');
        setShowToast(true);
      }
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      daysAvailable: prev.daysAvailable.includes(day)
        ? prev.daysAvailable.filter(d => d !== day)
        : [...prev.daysAvailable, day],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <User className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900">Apply to be a Cleaner</h1>
          <p className="text-lg text-gray-600 mt-2">Join the VelocityMaid team and help us bring clean homes to your community.</p>
        </div>

        <Toast
          message={success ? 'Application submitted successfully!' : (error || 'Failed to submit application')}
          type={success ? 'success' : 'error'}
          visible={showToast}
          onClose={() => setShowToast(false)}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-1">
              WhatsApp Number (876-xxx-xxxx)
            </label>
            <input
              type="tel"
              id="whatsappNumber"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              placeholder="876-123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (876) for Jamaica</p>
          </div>

          <div>
            <label htmlFor="branchId" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Branch *
            </label>
            <select
              id="branchId"
              value={formData.branchId}
              onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none ${
                !formData.branchId ? 'border-gray-300' : 'border-gray-300'
              }`}
              required
              aria-required="true"
            >
              <option value="">Select a branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.city}, {branch.state})
                </option>
              ))}
            </select>
            {!formData.branchId && (
              <p className="text-xs text-gray-500 mt-1">You must select a branch to apply</p>
            )}
          </div>

          <div>
            <label htmlFor="experienceLevel" className="block text-sm font-medium text-gray-700 mb-1">
              Experience Level
            </label>
            <select
              id="experienceLevel"
              value={formData.experienceLevel}
              onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">Select experience level</option>
              <option value="None">None</option>
              <option value="Moderate">Moderate (1-2 years)</option>
              <option value="Experienced">Experienced (3+ years)</option>
            </select>
          </div>

          <div>
            <label htmlFor="areaOfResidence" className="block text-sm font-medium text-gray-700 mb-1">
              Area of Residence
            </label>
            <input
              type="text"
              id="areaOfResidence"
              value={formData.areaOfResidence}
              onChange={(e) => setFormData({ ...formData, areaOfResidence: e.target.value })}
              placeholder="e.g., Port Antonio, Portland"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Days Available
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.daysAvailable.includes(day)
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {day.substring(0, 3)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weekend Availability
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.weekendAbility}
                onChange={(e) => setFormData({ ...formData, weekendAbility: e.target.checked })}
                className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">I can work on weekends (Saturday & Sunday)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Villa Travel
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.canTravelToVillas}
                onChange={(e) => setFormData({ ...formData, canTravelToVillas: e.target.checked })}
                className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">I can travel to villa areas for cleaning jobs</span>
            </label>
          </div>

          <div>
            <label htmlFor="idUpload" className="block text-sm font-medium text-gray-700 mb-1">
              ID Document (Optional)
            </label>
            <input
              type="file"
              id="idUpload"
              accept="image/*,.pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Upload a photo or scan of your government ID</p>
          </div>

          <div>
            <label htmlFor="referencesUpload" className="block text-sm font-medium text-gray-700 mb-1">
              References (Optional)
            </label>
            <input
              type="file"
              id="referencesUpload"
              accept="image/*,.pdf"
              onChange={(e) => setReferencesFile(e.target.files?.[0] || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Upload reference letters or contact information</p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Tell us about yourself, your availability, or any questions..."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary inline-flex items-center justify-center gap-2"
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
    </div>
  );
}

export default function CleanerApplyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    }>
      <CleanerApplyContent />
    </Suspense>
  );
}



