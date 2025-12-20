import { Metadata } from 'next';
import { Download, Image, FileText, Palette, Type, Camera } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VelocityMaid New Jersey - Brand Kit',
  description: 'Download VelocityMaid New Jersey brand assets including logos, social media templates, flyers, and brand style guide.',
};

export default function BrandKitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Palette className="w-20 h-20 text-[#F8C548] mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            VelocityMaid New Jersey
          </h1>
          <p className="text-xl md:text-2xl text-[#F3F1EB] mb-8">
            Complete Brand Kit & Marketing Assets
          </p>
        </div>
      </section>

      {/* Logos Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Logo Variations
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { type: 'main', name: 'Main Logo', desc: 'Full VelocityMaid New Jersey logo' },
              { type: 'horizontal', name: 'Horizontal Logo', desc: 'Wide format logo' },
              { type: 'badge', name: 'Badge Logo', desc: 'Circular VM badge' },
              { type: 'minimal', name: 'Minimal Logo', desc: 'VM initials only' },
              { type: 'service-badge', name: 'Service Badge', desc: 'Service badge format' },
            ].map((logo) => (
              <div key={logo.type} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#F8C548]">
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">{logo.name}</h3>
                <p className="text-gray-600 mb-4">{logo.desc}</p>
                <div className="bg-[#F3F1EB] p-4 rounded-lg mb-4 flex items-center justify-center min-h-[120px]">
                  <img 
                    src={`/api/brand/nj/logos?type=${logo.type}`}
                    alt={logo.name}
                    className="max-w-full max-h-24"
                  />
                </div>
                <a
                  href={`/api/brand/nj/logos?type=${logo.type}`}
                  download={`velocitymaid-nj-${logo.type}.svg`}
                  className="btn-jamaica inline-flex items-center gap-2 w-full justify-center"
                >
                  <Download className="w-4 h-4" />
                  Download SVG
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Media Templates */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Social Media Templates
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { type: 'before-after', name: 'Before/After Post', format: 'square' },
              { type: 'deep-clean', name: 'Deep Clean Promo', format: 'square' },
              { type: 'pricing', name: 'Pricing Post', format: 'square' },
              { type: 'announcement', name: 'Now Open Announcement', format: 'square' },
              { type: 'testimonial', name: 'Review Template', format: 'square' },
              { type: 'recruitment', name: 'Recruitment Template', format: 'square' },
              { type: 'openings', name: 'Weekly Openings', format: 'square' },
            ].map((template) => (
              <div key={template.type} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#2B70C9]">
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">{template.name}</h3>
                <p className="text-gray-600 mb-4">1080x1080 (Square)</p>
                <div className="flex gap-2">
                  <a
                    href={`/api/brand/nj/social?type=${template.type}&format=square`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-jamaica inline-flex items-center gap-2 flex-1 justify-center text-sm"
                  >
                    <Image className="w-4 h-4" />
                    View Template
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flyers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Flyers & Door Hangers
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { type: 'flyer', name: 'Neighborhood Flyer', desc: '8.5x11 PDF/PNG' },
              { type: 'door-hanger-front', name: 'Door Hanger (Front)', desc: '4x6 PDF/PNG' },
              { type: 'door-hanger-back', name: 'Door Hanger (Back)', desc: '4x6 PDF/PNG' },
            ].map((item) => (
              <div key={item.type} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#F8C548]">
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-3">{item.name}</h3>
                <p className="text-gray-600 mb-4">{item.desc}</p>
                <a
                  href={`/api/brand/nj/flyers?type=${item.type}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-jamaica inline-flex items-center gap-2 w-full justify-center"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Guide Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white p-12 rounded-2xl shadow-xl">
            <FileText className="w-16 h-16 text-[#F8C548] mb-6" />
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              Brand Style Guide
            </h2>
            <p className="text-xl text-[#F3F1EB] mb-8">
              Complete guide to colors, fonts, logos, voice, and photo style for VelocityMaid New Jersey
            </p>
            <a
              href="/api/brand/nj/guide"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-jamaica inline-flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Brand Guide (PDF)
            </a>
          </div>
        </div>
      </section>

      {/* Instructions */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            How to Use These Assets
          </h2>
          <div className="bg-[#F3F1EB] rounded-xl p-8">
            <ol className="space-y-4 text-gray-700 list-decimal list-inside">
              <li className="text-lg">
                <strong>Logos:</strong> Download SVG files for scalable use. Convert to PNG for specific sizes as needed.
              </li>
              <li className="text-lg">
                <strong>Social Templates:</strong> Open HTML files, customize text/images, then print to PNG using browser (Ctrl+P → Save as PNG).
              </li>
              <li className="text-lg">
                <strong>Flyers:</strong> Open HTML files, print to PDF using browser (Ctrl+P → Save as PDF) for best quality.
              </li>
              <li className="text-lg">
                <strong>Brand Guide:</strong> Reference for all brand standards, colors, fonts, and usage guidelines.
              </li>
            </ol>
            <div className="mt-8 p-4 bg-white rounded-lg border-2 border-[#F8C548]">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> All assets are generated dynamically. For production use, consider saving optimized versions 
                to your asset management system. SVG logos can be converted to PNG using any image editor.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


