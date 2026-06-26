"use client";

import { useState } from 'react';
import { 
  Bed, 
  Bath, 
  Utensils, 
  Camera, 
  FileText, 
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

const sopSections = [
  {
    id: 'linen',
    icon: Bed,
    title: 'Linen Reset Procedure',
    content: [
      'Remove all used linens from beds',
      'Inspect mattresses for stains or damage',
      'Place fresh fitted sheet on mattress, ensuring tight fit',
      'Add flat sheet with hospital corners',
      'Arrange pillows: 2 standard pillows per bed, 1 decorative pillow',
      'Place fresh duvet/comforter, ensuring even distribution',
      'Fold top sheet and duvet at foot of bed (if applicable)',
      'Place fresh towels in bathroom: 2 bath towels, 2 hand towels, 2 washcloths per bathroom',
      'Ensure all linens are clean, pressed, and free of stains',
      'Document any damaged or missing linens in report',
    ],
  },
  {
    id: 'bedroom',
    icon: Bed,
    title: 'Bedroom Styling',
    content: [
      'Dust all surfaces: nightstands, dressers, headboards, picture frames',
      'Vacuum or mop floors (depending on floor type)',
      'Clean windows and mirrors',
      'Empty trash bins and replace liners',
      'Check and restock amenities (if applicable)',
      'Ensure all lights are working',
      'Check air conditioning/ventilation',
      'Verify closet is empty and clean',
      'Take before/after photos',
      'Document any damage or maintenance issues',
    ],
  },
  {
    id: 'bathroom',
    icon: Bath,
    title: 'Bathroom Reset',
    content: [
      'Remove all used towels and linens',
      'Clean and sanitize toilet (inside and out)',
      'Clean and sanitize shower/tub',
      'Clean mirrors and glass surfaces',
      'Clean and sanitize sink and countertops',
      'Clean floor and baseboards',
      'Restock toilet paper (minimum 2 rolls)',
      'Restock hand soap',
      'Place fresh towels: 2 bath, 2 hand, 2 washcloths',
      'Check and restock toiletries (if applicable)',
      'Verify all fixtures are working',
      'Take before/after photos',
      'Document any damage or maintenance issues',
    ],
  },
  {
    id: 'kitchen',
    icon: Utensils,
    title: 'Kitchen Reset',
    content: [
      'Clean and sanitize all countertops',
      'Clean and sanitize sink',
      'Clean stovetop and oven (if applicable)',
      'Clean microwave (inside and out)',
      'Clean refrigerator (inside and out)',
      'Clean dishwasher (inside and out)',
      'Check and restock dish soap',
      'Check and restock paper towels',
      'Verify all appliances are working',
      'Check inventory: dishes, utensils, cookware',
      'Document any missing or damaged items',
      'Take before/after photos',
    ],
  },
  {
    id: 'photos',
    icon: Camera,
    title: 'Photo Documentation',
    content: [
      'Take before photos of each room (if applicable)',
      'Take after photos of each room',
      'Focus on: beds, bathrooms, kitchen, living areas',
      'Capture any damage or maintenance issues',
      'Ensure photos are clear and well-lit',
      'Include timestamp in photo metadata',
      'Upload photos to job report within 2 hours',
      'Organize photos by room for easy review',
    ],
  },
  {
    id: 'damage',
    icon: FileText,
    title: 'Damage Reporting Process',
    content: [
      'Inspect entire villa for damage during cleaning',
      'Document any damage with clear photos',
      'Note location of damage (room, specific area)',
      'Describe damage in detail (size, type, severity)',
      'Check for missing items or inventory discrepancies',
      'Complete damage report form',
      'Submit report within 2 hours of completion',
      'Include photos and detailed descriptions',
      'Notify villa manager via WhatsApp if urgent',
      'Keep copy of report for records',
    ],
  },
];

export default function VillaSOPPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['linen']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/villa-partnership"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Villa Partnership
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-vm-text">Villa Turnover SOP</h1>
              <p className="text-vm-muted mt-1">
                Standard Operating Procedures for Villa Turnover Cleaning
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors"
              >
                <Download className="w-5 h-5" />
                Print / Export PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-vm-text mb-4">Overview</h2>
          <p className="text-vm-text mb-4">
            This Standard Operating Procedure (SOP) outlines the complete process for villa turnover cleaning. 
            All cleaners must follow these procedures to ensure consistent quality and guest satisfaction.
          </p>
          <p className="text-vm-text">
            Each section below details the specific steps required for that area of the villa. 
            Click on any section to expand and view the detailed checklist.
          </p>
        </div>

        {/* SOP Sections */}
        <div className="space-y-4">
          {sopSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const Icon = section.icon;

            return (
              <div
                key={section.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-bold text-vm-text">{section.title}</h3>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-vm-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-vm-muted" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <ul className="space-y-3">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-vm-success mt-0.5 flex-shrink-0" />
                          <span className="text-vm-text">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-vm-text mb-2">Important Notes</h3>
          <ul className="space-y-2 text-vm-text">
            <li>• All cleaning must be completed to 5-star standards</li>
            <li>• Photo documentation is required for every turnover</li>
            <li>• Damage reports must be submitted within 2 hours of completion</li>
            <li>• Contact villa manager immediately for urgent issues</li>
            <li>• Follow all safety protocols and use appropriate cleaning products</li>
          </ul>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none;
          }
          .bg-gray-50 {
            background: white;
          }
          .shadow-sm,
          .border {
            border: 1px solid #e5e7eb;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
}

