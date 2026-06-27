"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Loader2, CheckCircle, X, Home } from 'lucide-react';

export default function VillaSignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    propertyName: '',
    businessName: '',
    agreed: false,
  });

  const [signature, setSignature] = useState<string | null>(null);
  const signatureRef = useRef<HTMLCanvasElement>(null);

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
    ctx.strokeStyle = '#0A3D2F';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const draw = (moveEvent: MouseEvent) => {
      const moveX = moveEvent.clientX - rect.left;
      const moveY = moveEvent.clientY - rect.top;
      ctx.lineTo(moveX, moveY);
      ctx.stroke();
    };

    const stopDrawing = () => {
      setSignature(canvas.toDataURL());
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
    };

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
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

    if (!formData.name || !formData.phone || !formData.propertyName) {
      setError('Name, phone, and property name are required');
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
      const response = await fetch('/api/contracts/villa/generate', {
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
        setTimeout(() => {
          router.push(`/contracts/villa-sign/success?contractId=${data.contractId}`);
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
          <Home className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Villa Partnership Agreement
          </h1>
          <p className="text-lg text-vm-muted">
            Please fill out the form below to sign your partnership agreement
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <X className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-vm-success-bg border border-vm-success/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-vm-success" />
            <div>
              <p className="font-semibold text-vm-success">Contract generated successfully!</p>
              <p className="text-sm text-vm-success">Redirecting to confirmation page...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-vm-text mb-1">
              Manager/Owner Name *
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
            <label htmlFor="propertyName" className="block text-sm font-medium text-vm-text mb-1">
              Property Name *
            </label>
            <input
              type="text"
              id="propertyName"
              value={formData.propertyName}
              onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F] focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-vm-text mb-1">
              Business Name (if applicable)
            </label>
            <input
              type="text"
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0A3D2F] focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-vm-text mb-1">
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
            <label htmlFor="email" className="block text-sm font-medium text-vm-text mb-1">
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
            <label className="block text-sm font-medium text-vm-text mb-2">
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
                className="mt-2 px-4 py-2 bg-gray-200 text-vm-text rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Clear Signature
              </button>
            </div>
            {signature && (
              <p className="text-sm text-vm-success mt-2">✓ Signature captured</p>
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
              <span className="text-sm text-vm-text">
                I have read, understood, and agree to be bound by all terms and conditions of this Villa Partnership Agreement. *
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

