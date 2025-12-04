"use client";

import { useState } from 'react';
import { 
  Download, 
  Copy, 
  Image, 
  FileText, 
  MessageCircle,
  Share2,
  CheckCircle,
  X
} from 'lucide-react';
import { jamaicaMarketingContent } from '@/app/marketing/jamaica/content';

const marketingAssets = [
  { name: 'Launching', filename: 'launching.png', category: 'launch' },
  { name: 'Villa Turnover', filename: 'villa_turnover.png', category: 'villa' },
  { name: 'Pricing JMD', filename: 'pricing_jmd.png', category: 'pricing' },
  { name: 'Standard Clean', filename: 'standard_clean.png', category: 'services' },
  { name: 'Deep Clean', filename: 'deep_clean.png', category: 'services' },
  { name: 'Move Out Clean', filename: 'moveout_clean.png', category: 'services' },
  { name: 'Hiring Cleaners', filename: 'hiring_cleaners.png', category: 'recruitment' },
  { name: 'Certified Cleaner Badge', filename: 'certified_cleaner_badge.png', category: 'recruitment' },
  { name: 'Jamaica Areas Map', filename: 'jamaica_areas_map.png', category: 'launch' },
  { name: 'WhatsApp QR', filename: 'whatsapp_qr.png', category: 'launch' },
];

const flyers = [
  { name: 'Launch Flyer', type: 'launch', filename: 'jamaica_launch_flyer.pdf' },
  { name: 'Villa Partner Flyer', type: 'villa', filename: 'villa_partner_flyer.pdf' },
  { name: 'Hiring Flyer', type: 'hiring', filename: 'hiring_flyer.pdf' },
];

export default function AdminMarketingPage() {
  const [activeTab, setActiveTab] = useState<'assets' | 'content' | 'flyers'>('assets');
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const filteredAssets = selectedCategory === 'all' 
    ? marketingAssets 
    : marketingAssets.filter(asset => asset.category === selectedCategory);

  const categories = ['all', 'launch', 'villa', 'pricing', 'services', 'recruitment'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Jamaica Marketing Kit</h1>
          <p className="text-gray-600">Manage marketing assets, content, and flyers for VelocityMaid Jamaica</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'assets'
                  ? 'text-[#0A3D2F] border-b-2 border-[#0A3D2F]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Image className="w-5 h-5 inline mr-2" />
              Assets
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'content'
                  ? 'text-[#0A3D2F] border-b-2 border-[#0A3D2F]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Content
            </button>
            <button
              onClick={() => setActiveTab('flyers')}
              className={`px-6 py-4 font-semibold transition-colors ${
                activeTab === 'flyers'
                  ? 'text-[#0A3D2F] border-b-2 border-[#0A3D2F]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-5 h-5 inline mr-2" />
              Flyers
            </button>
          </div>
        </div>

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div>
            {/* Category Filter */}
            <div className="mb-6 flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    selectedCategory === category
                      ? 'bg-[#0A3D2F] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Assets Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.filename}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <Image className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{asset.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{asset.filename}</p>
                  <div className="flex gap-2">
                    <a
                      href={`/marketing/jamaica/${asset.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-[#F8C548] text-[#0A3D2F] rounded-lg font-semibold hover:bg-[#F5B835] transition-colors text-center text-sm flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Social Media Captions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Social Media Captions</h2>
              <div className="space-y-4">
                {Object.entries(jamaicaMarketingContent.social).map(([key, content]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{content.title}</h3>
                      <button
                        onClick={() => copyToClipboard(content.caption, `social-${key}`)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                      >
                        {copied === `social-${key}` ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{content.caption}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp Broadcasts */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">WhatsApp Broadcast Messages</h2>
              <div className="space-y-4">
                {Object.entries(jamaicaMarketingContent.whatsapp).map(([key, message]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                      <button
                        onClick={() => copyToClipboard(message, `whatsapp-${key}`)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                      >
                        {copied === `whatsapp-${key}` ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Villa Outreach */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Villa Outreach Templates</h2>
              <div className="space-y-4">
                {Object.entries(jamaicaMarketingContent.villa).map(([key, template]) => (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                      <button
                        onClick={() => copyToClipboard(template, `villa-${key}`)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
                      >
                        {copied === `villa-${key}` ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{template}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Flyers Tab */}
        {activeTab === 'flyers' && (
          <div className="grid md:grid-cols-3 gap-6">
            {flyers.map((flyer) => (
              <div
                key={flyer.type}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="aspect-[4/3] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{flyer.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{flyer.filename}</p>
                <a
                  href={`/api/marketing/jamaica/flyers?type=${flyer.type}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 bg-[#F8C548] text-[#0A3D2F] rounded-lg font-semibold hover:bg-[#F5B835] transition-colors text-center text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Generate PDF
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

