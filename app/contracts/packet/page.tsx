import { Metadata } from 'next';
import { Download, FileText } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'VelocityMaid Jamaica - Official Contract Packet',
  description: 'Download the complete VelocityMaid Jamaica contract packet including all legal agreements, service standards, and pricing information.',
};

export default function ContractPacketPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3F1EB] to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-[#0A3D2F] mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-[#0A3D2F] mb-2" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Official Contract Packet
          </h1>
          <p className="text-lg text-vm-muted">
            Complete legal agreements and service documentation for VelocityMaid Jamaica
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            What's Included
          </h2>
          <ul className="space-y-3 text-vm-text">
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Cover page and introduction letter</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Company profile and service overview</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Villa turnover standards and procedures</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Complete pricing overview (JMD)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Cleaner standards and expectations</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Cleaner Agreement (full legal text)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Customer Terms of Service (full legal text)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Villa Partnership Agreement (full legal text)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Signature pages</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>QR codes for quick access</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#F8C548] font-bold">•</span>
              <span>Complete contact information</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#0A3D2F] rounded-2xl shadow-xl p-8 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Professional & Comprehensive
          </h2>
          <p className="text-lg mb-6">
            This packet contains everything you need to understand VelocityMaid Jamaica's services, standards, 
            and legal agreements. All documents are professionally formatted and ready for printing or digital use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/api/contracts/packet"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-jamaica inline-flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download Contract Packet
            </a>
            <Link
              href="/contracts/cleaner-sign"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#2B70C9] text-white rounded-xl font-semibold hover:bg-[#1e5aa8] transition-colors text-lg"
            >
              <FileText className="w-5 h-5" />
              Sign Cleaner Agreement
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[#0A3D2F] mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Instructions
          </h2>
          <ol className="space-y-3 text-vm-text list-decimal list-inside">
            <li>Download the contract packet using the button above</li>
            <li>Review all documents carefully</li>
            <li>Print or save for your records</li>
            <li>Use the signature pages to sign agreements as needed</li>
            <li>Contact us via WhatsApp if you have any questions</li>
          </ol>
          <div className="mt-6 p-4 bg-[#F3F1EB] rounded-lg">
            <p className="text-sm text-vm-text">
              <strong>Note:</strong> The downloaded file is an HTML document that can be printed to PDF using your browser's 
              print function (Ctrl+P or Cmd+P). For best results, select "Save as PDF" as the destination.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


