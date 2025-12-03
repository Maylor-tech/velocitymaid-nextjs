'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, CheckCircle, X } from 'lucide-react';

export default function CleanerSignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [contractUrl, setContractUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
    agreed: false,
  });

  const [signature, setSignature] = useState<string | null>(null);
  const signatureRef = useRef<HTMLCanvasElement>(null);

  const handleSignatureDraw = () => {
    if (signatureRef.current) {
      const canvas = signatureRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0A3D2F';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!signatureRef.current) return;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
  };

  const draw = (e: MouseEvent) => {
    if (!signatureRef.current) return;
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!signatureRef.current) return;
    const canvas = signatureRef.current;
    setSignature(canvas.toDataURL());
    canvas.removeEventListener('mousemove', draw);
    canvas.removeEventListener('mouseup', stopDrawing);
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      const ctx = signatureRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, signatureRef.current.width, signatureRef.current.height);
        setSignature(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      setError('Name and phone are required');
      return;
    }

    if (!formData.agreed) {
      setError('You must agree to the terms');
      return;
    }

    if (!signature) {
      setError('Please provide your signature');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contracts/cleaner/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          signature,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setContractUrl(data.url);
        // Redirect to confirmation after 2 seconds
        setTimeout(() => {
          router.push(`/contracts/cleaner-sign/success?contractId=${data.contractId}`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to generate contract');
      }
    } catch (err: any) {
      console.error('Error submitting contract:', err);
      setError(err.message || 'Failed to submit contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Cleaner Agreement
          </h1>
          <p className="text-lg text-gray-600">
            Please fill out the form below to sign your agreement
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <X className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Contract generated successfully!</p>
              <p className="text-sm text-green-700">Redirecting to confirmation page...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number (876-xxx-xxxx) *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="876-123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-1">
              ID Number / TRN
            </label>
            <input
              type="text"
              id="idNumber"
              value={formData.idNumber}
              onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature *
            </label>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <canvas
                ref={signatureRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                className="border border-gray-200 rounded cursor-crosshair w-full"
                style={{ touchAction: 'none' }}
              />
              <button
                type="button"
                onClick={clearSignature}
                className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Clear Signature
              </button>
            </div>
            {signature && (
              <p className="text-sm text-green-600 mt-2">✓ Signature captured</p>
            )}
          </div>

          <div>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreed}
                onChange={(e) => setFormData({ ...formData, agreed: e.target.checked })}
                className="mt-1 w-5 h-5 text-[#0A3D2F] focus:ring-[#0A3D2F] border-gray-300 rounded"
                required
              />
              <span className="text-sm text-gray-700">
                I have read, understood, and agree to be bound by all terms and conditions of this Cleaner Agreement. *
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-jamaica inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Contract...
              </>
            ) : (
              <>
                Sign & Submit
                <FileText className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

