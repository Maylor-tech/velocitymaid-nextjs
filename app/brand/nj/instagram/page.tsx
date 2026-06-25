import { Metadata } from 'next';
import { Download, Instagram, Image as ImageIcon, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'VelocityMaid New Jersey - Instagram Content Pack',
  description: '30 ready-to-use Instagram graphics for VelocityMaid New Jersey. Feed and story formats with captions.',
};

const graphics = [
  { num: 1, title: 'NJ Launch Announcement' },
  { num: 2, title: 'Pricing Chart' },
  { num: 3, title: 'Cleaning Checklist' },
  { num: 4, title: 'Satisfaction Guarantee' },
  { num: 5, title: 'Meet Your Cleaners' },
  { num: 6, title: 'Before/After Template' },
  { num: 7, title: 'Booking Steps' },
  { num: 8, title: 'Deep Cleaning Breakdown' },
  { num: 9, title: 'Move-In/Out Cleaning' },
  { num: 10, title: 'Weekly Cleaning Plan' },
  { num: 11, title: 'Apartment Cleaning' },
  { num: 12, title: 'Pet-Friendly Cleaning' },
  { num: 13, title: 'Supplies We Use' },
  { num: 14, title: 'Testimonial Template' },
  { num: 15, title: 'Service Areas Map' },
  { num: 16, title: 'Weekly Openings' },
  { num: 17, title: 'Move-Out Promo' },
  { num: 18, title: 'Cleaning Tip – Bathroom' },
  { num: 19, title: 'Cleaning Tip – Kitchen' },
  { num: 20, title: 'Seasonal Clean Promo' },
  { num: 21, title: 'Referral Bonus' },
  { num: 22, title: 'Book Now CTA' },
  { num: 23, title: 'Cleaner Spotlight' },
  { num: 24, title: 'Google Review Template' },
  { num: 25, title: "What's Included – Kitchen" },
  { num: 26, title: "What's Included – Bathrooms" },
  { num: 27, title: "What's Included – Bedrooms" },
  { num: 28, title: "What's Included – Living Room" },
  { num: 29, title: 'Flash Sale' },
  { num: 30, title: 'Monthly Summary' },
];

export default function InstagramContentPackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Instagram className="w-20 h-20 text-[#F8C548] mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            30-Graphic Instagram Pack
          </h1>
          <p className="text-xl md:text-2xl text-[#F3F1EB] mb-8">
            Ready-to-use graphics for feed and stories
          </p>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#F3F1EB] rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              How to Use
            </h2>
            <ol className="space-y-3 text-vm-text list-decimal list-inside">
              <li>Click on any graphic below to view it</li>
              <li>Open in browser (HTML format)</li>
              <li>Press Ctrl+P (or Cmd+P on Mac)</li>
              <li>Select "Save as PDF" or use a screenshot tool</li>
              <li>For PNG: Use browser DevTools or a screenshot extension</li>
              <li>Download captions from the caption files</li>
            </ol>
            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-[#F8C548]">
              <p className="text-sm text-vm-text">
                <strong>Pro Tip:</strong> For best quality PNG export, use a browser extension like "Full Page Screen Capture" 
                or use Chrome DevTools to capture the element at exact dimensions (1080x1080 for feed, 1080x1920 for stories).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Graphics Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            All 30 Graphics
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {graphics.map((graphic) => (
              <div key={graphic.num} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#F8C548]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-[#0A3D2F]">#{graphic.num}</span>
                  <span className="text-sm text-vm-muted">1080x1080</span>
                </div>
                <h3 className="text-lg font-bold text-[#0A3D2F] mb-4">{graphic.title}</h3>
                <div className="flex gap-2">
                  <a
                    href={`/api/brand/nj/instagram?graphic=${graphic.num}&format=feed`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 btn-jamaica inline-flex items-center justify-center gap-2 text-sm"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Feed
                  </a>
                  <a
                    href={`/api/brand/nj/instagram?graphic=${graphic.num}&format=story`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#2B70C9] text-white rounded-lg font-semibold hover:bg-[#1e5aa8] transition-colors text-sm"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Story
                  </a>
                </div>
                <a
                  href={`/api/brand/nj/instagram/caption?day=${graphic.num}`}
                  download={`day${graphic.num}.txt`}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#F3F1EB] text-[#0A3D2F] rounded-lg font-semibold hover:bg-[#E8E5DF] transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Caption
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bulk Download */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Need Help Exporting?
          </h2>
          <div className="bg-[#F3F1EB] rounded-xl p-8">
            <p className="text-lg text-vm-text mb-6">
              All graphics are generated as HTML that can be converted to PNG. For automated conversion, 
              consider using a headless browser like Puppeteer or a screenshot service.
            </p>
            <p className="text-sm text-vm-muted">
              The HTML files are optimized for 1080x1080 (feed) and 1080x1920 (story) dimensions. 
              Use browser DevTools or screenshot tools to capture at exact dimensions for best quality.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}


