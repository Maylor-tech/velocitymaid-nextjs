import { Metadata } from 'next';
import { Download, FileText, Printer } from 'lucide-react';

export const metadata: Metadata = {
  title: 'VelocityMaid New Jersey - Print Pack',
  description: 'Download print materials including door hangers, flyers, referral cards, and move-out sheets for VelocityMaid New Jersey.',
};

const printMaterials = [
  {
    name: 'Door Hanger (Front)',
    description: '4.25" x 11" - Front side with pricing and promo',
    route: '/api/brand/nj/print/door-hanger?side=front',
    size: '4.25" x 11"',
  },
  {
    name: 'Door Hanger (Back)',
    description: '4.25" x 11" - Back side with checklist',
    route: '/api/brand/nj/print/door-hanger?side=back',
    size: '4.25" x 11"',
  },
  {
    name: 'Lobby Flyer',
    description: '8.5" x 11" - Weekly & biweekly cleaning flyer',
    route: '/api/brand/nj/print/lobby-flyer',
    size: '8.5" x 11"',
  },
  {
    name: 'Mailbox Flyer',
    description: '5.5" x 8.5" - Half-page promo flyer with code NJ15',
    route: '/api/brand/nj/print/mailbox-flyer',
    size: '5.5" x 8.5"',
  },
  {
    name: 'Move-Out Sheet',
    description: '8.5" x 11" - Complete move-out cleaning checklist',
    route: '/api/brand/nj/print/moveout-sheet',
    size: '8.5" x 11"',
  },
  {
    name: 'Referral Card (Front)',
    description: '3.5" x 2" - Brand logo and tagline',
    route: '/api/brand/nj/print/referral-card?side=front',
    size: '3.5" x 2"',
  },
  {
    name: 'Referral Card (Back)',
    description: '3.5" x 2" - "Give $20, Get $20" referral promo',
    route: '/api/brand/nj/print/referral-card?side=back',
    size: '3.5" x 2"',
  },
];

export default function PrintPackPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Printer className="w-20 h-20 text-[#F8C548] mx-auto mb-6" />
          <h1 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            New Jersey Print Pack
          </h1>
          <p className="text-xl md:text-2xl text-[#F3F1EB] mb-8">
            Professional print materials for marketing and distribution
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
              <li>Click on any print material below to view it</li>
              <li>Open in browser (HTML format)</li>
              <li>Press Ctrl+P (or Cmd+P on Mac)</li>
              <li>Select "Save as PDF" for PDF export</li>
              <li>For CMYK: Open PDF in design software and convert</li>
              <li>For PNG: Use browser screenshot or print to image</li>
            </ol>
            <div className="mt-6 p-4 bg-white rounded-lg border-2 border-[#F8C548]">
              <p className="text-sm text-vm-text">
                <strong>Print Tips:</strong> All materials are sized for standard print dimensions. For best results, 
                use "Actual Size" when printing. Door hangers should be printed on cardstock (4.25" x 11"). 
                Referral cards can be printed on business card stock (3.5" x 2").
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Print Materials Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Print Materials
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printMaterials.map((material, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-[#F8C548]">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="w-8 h-8 text-[#0A3D2F]" />
                  <span className="text-sm text-vm-muted bg-gray-100 px-2 py-1 rounded">{material.size}</span>
                </div>
                <h3 className="text-xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
                  {material.name}
                </h3>
                <p className="text-vm-muted mb-4 text-sm">{material.description}</p>
                <a
                  href={material.route}
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

      {/* QR Code Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#0A3D2F] mb-8 text-center" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            QR Code
          </h2>
          <div className="bg-[#F3F1EB] rounded-xl p-8 text-center">
            <p className="text-vm-text mb-4">
              QR codes are included as placeholders in the print materials. To generate actual QR codes:
            </p>
            <ol className="text-left space-y-2 text-vm-text mb-6">
              <li>1. Visit a QR code generator (qr-code-generator.com, qrcode.tec-it.com)</li>
              <li>2. Enter URL: <code className="bg-white px-2 py-1 rounded">https://velocitymaid.com/new-jersey</code></li>
              <li>3. Download QR code image</li>
              <li>4. Replace placeholder in print material</li>
            </ol>
            <div className="bg-white p-4 rounded-lg border-2 border-[#F8C548] inline-block">
              <p className="text-sm text-vm-text mb-2"><strong>Target URL:</strong></p>
              <code className="text-[#0A3D2F] font-semibold">velocitymaid.com/new-jersey</code>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


