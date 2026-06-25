"use client";

import { useState, useEffect } from 'react';
import { Gift, Share2, Copy, MessageCircle, QrCode, DollarSign, Users, CheckCircle2 } from 'lucide-react';

interface ReferralData {
  balance: {
    total: number;
    pending: number;
    applied: number;
  };
  referralLink: {
    code: string;
    url: string;
  } | null;
  stats: {
    totalReferrals: number;
    pendingReferrals: number;
    totalCredits: number;
  };
  credits: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  }>;
  referredFriends: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
}

export default function ReferralsPage() {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const meRes = await fetch('/api/customer/me');
      const meData = await meRes.json();

      if (!meRes.ok || !meData.success || !meData.customer?.id) {
        setAuthError('Please log in to view your referral program.');
        return;
      }

      const id = meData.customer.id as string;
      setCustomerId(id);

      const balanceRes = await fetch(`/api/referrals/get-balance?customerId=${id}`);
      const balanceData = await balanceRes.json();

      if (balanceData.success) {
        setReferralData({
          ...balanceData,
          referredFriends: [],
        });
      } else {
        setAuthError(balanceData.error || 'Unable to load referral information.');
      }
    } catch (error) {
      console.error('Fetch referral data error:', error);
      setAuthError('Unable to load referral information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (method: 'whatsapp' | 'sms' | 'copy') => {
    if (!referralData?.referralLink || !customerId) return;

    if (method === 'copy') {
      await navigator.clipboard.writeText(referralData.referralLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const shareRes = await fetch(`/api/referrals/share?customerId=${customerId}&method=${method}`);
    const shareData = await shareRes.json();

    if (shareData.success && shareData.share.url) {
      if (method === 'whatsapp' || method === 'sms') {
        window.open(shareData.share.url, '_blank');
      }
    }
  };

  const generateQRCode = async () => {
    if (!referralData?.referralLink) return;

    // Generate QR code as PNG
    const qrRes = await fetch(`/api/referrals/qr-code?code=${referralData.referralLink.code}&format=png`);
    if (qrRes.ok) {
      const blob = await qrRes.blob();
      const url = URL.createObjectURL(blob);
      setQrCodeUrl(url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0A3D2F] mx-auto mb-4"></div>
          <p className="text-vm-muted">Loading referral information...</p>
        </div>
      </div>
    );
  }

  if (authError || !referralData) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-vm-muted mb-4">{authError || 'Unable to load referral information.'}</p>
        {authError && (
          <a
            href="/customer/login?redirect=/customer/referrals"
            className="text-[#0A3D2F] font-semibold hover:underline"
          >
            Log in to continue
          </a>
        )}
      </div>
    );
  }

  return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Gift className="w-16 h-16 text-[#F8C548] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Referral Program
          </h1>
          <p className="text-lg text-vm-muted">
            Refer friends and earn $20 for each booking
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white rounded-xl p-8 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                Your Referral Balance
              </h2>
              <p className="text-vm-muted">Available credits to use</p>
            </div>
            <DollarSign className="w-12 h-12 text-[#F8C548]" />
          </div>
          <div className="text-5xl font-bold text-[#F8C548] mb-2">
            ${referralData.balance.total.toFixed(2)}
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-vm-muted">Pending:</span>{' '}
              <span className="font-semibold">${referralData.balance.pending.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-vm-muted">Applied:</span>{' '}
              <span className="font-semibold">${referralData.balance.applied.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Referral Link Card */}
        {referralData.referralLink && (
          <div className="bg-white rounded-xl p-8 shadow-md mb-8 border-l-4 border-[#F8C548]">
            <h2 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Your Referral Link
            </h2>
            <div className="bg-[#F3F1EB] rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4">
                <code className="flex-1 text-[#0A3D2F] font-mono text-sm break-all">
                  {referralData.referralLink.url}
                </code>
                <button
                  onClick={() => handleShare('copy')}
                  className="bg-[#0A3D2F] text-white px-4 py-2 rounded-lg hover:bg-[#083025] transition flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => handleShare('whatsapp')}
                className="bg-vm-success text-white px-4 py-3 rounded-lg hover:bg-vm-success transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                WhatsApp
              </button>
              <button
                onClick={() => handleShare('sms')}
                className="bg-vm-navy text-white px-4 py-3 rounded-lg hover:bg-vm-navy transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                SMS
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="bg-gray-500 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Copy Link
              </button>
              <button
                onClick={generateQRCode}
                className="bg-[#0A3D2F] text-white px-4 py-3 rounded-lg hover:bg-[#083025] transition flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                QR Code
              </button>
            </div>

            {/* QR Code Display */}
            {qrCodeUrl && (
              <div className="mt-6 text-center">
                <img src={qrCodeUrl} alt="Referral QR Code" className="mx-auto border-4 border-[#F8C548] rounded-lg" />
                <p className="text-sm text-vm-muted mt-2">Scan to share your referral link</p>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <Users className="w-8 h-8 text-[#0A3D2F] mx-auto mb-2" />
            <div className="text-3xl font-bold text-[#0A3D2F] mb-1">
              {referralData.stats.totalReferrals}
            </div>
            <p className="text-vm-muted">Total Referrals</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <CheckCircle2 className="w-8 h-8 text-[#F8C548] mx-auto mb-2" />
            <div className="text-3xl font-bold text-[#0A3D2F] mb-1">
              {referralData.stats.pendingReferrals}
            </div>
            <p className="text-vm-muted">Pending</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md text-center">
            <Gift className="w-8 h-8 text-[#2B70C9] mx-auto mb-2" />
            <div className="text-3xl font-bold text-[#0A3D2F] mb-1">
              {referralData.stats.totalCredits}
            </div>
            <p className="text-vm-muted">Credits Earned</p>
          </div>
        </div>

        {/* Referred Friends List */}
        <div className="bg-white rounded-xl p-8 shadow-md">
          <h2 className="text-2xl font-bold text-[#0A3D2F] mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Referred Friends
          </h2>
          {referralData.referredFriends.length > 0 ? (
            <div className="space-y-4">
              {referralData.referredFriends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-4 bg-[#F3F1EB] rounded-lg">
                  <div>
                    <p className="font-semibold text-[#0A3D2F]">{friend.name}</p>
                    <p className="text-sm text-vm-muted">
                      {new Date(friend.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    friend.status === 'COMPLETED' 
                      ? 'bg-vm-success-bg text-green-800' 
                      : 'bg-vm-warning-bg text-yellow-800'
                  }`}>
                    {friend.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-vm-muted">
              <Users className="w-12 h-12 mx-auto mb-4 text-vm-muted" />
              <p>No referrals yet. Start sharing your link to earn credits!</p>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-[#F3F1EB] rounded-xl p-8 mt-8">
          <h2 className="text-2xl font-bold text-[#0A3D2F] mb-6" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#0A3D2F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-[#0A3D2F] mb-1">Share Your Link</h3>
                <p className="text-vm-text">Share your referral link with friends via WhatsApp, SMS, or copy</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#0A3D2F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-[#0A3D2F] mb-1">Friend Books</h3>
                <p className="text-vm-text">Your friend books a cleaning using your referral link</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-[#0A3D2F] text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-[#0A3D2F] mb-1">You Both Get $20</h3>
                <p className="text-vm-text">Your friend gets $20 off, and you get $20 credit after their cleaning is completed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

