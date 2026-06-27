"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Download, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SOPSection {
  id: string;
  title: string;
  content: string[];
}

const sopSections: SOPSection[] = [
  {
    id: 'house-cleaning',
    title: 'House Cleaning',
    content: [
      'Start with high surfaces and work downward (dust ceiling fans, then counters, then floors)',
      'Use appropriate cleaning products for each surface type',
      'Clean all rooms systematically: bedrooms, bathrooms, kitchen, living areas',
      'Empty trash bins and replace liners',
      'Wipe down all surfaces including countertops, tables, and shelves',
      'Clean mirrors and windows in each room',
      'Vacuum carpets and mop hard floors',
      'Ensure all cleaning supplies are properly stored after use',
      'Check for any missed areas before completing',
      'Report any damages or issues to supervisor immediately',
    ],
  },
  {
    id: 'deep-clean',
    title: 'Deep Clean',
    content: [
      'Move furniture to clean underneath (with customer permission)',
      'Clean baseboards and trim throughout the property',
      'Deep clean inside ovens, refrigerators, and microwaves',
      'Scrub grout lines in bathrooms and kitchens',
      'Clean inside cabinets and drawers',
      'Wash window sills and tracks',
      'Clean light fixtures and ceiling fans thoroughly',
      'Deep clean carpets with appropriate equipment',
      'Sanitize all high-touch surfaces',
      'Clean behind and under appliances',
      'Polish fixtures and hardware',
      'Complete detailed inspection checklist',
    ],
  },
  {
    id: 'airbnb-turnover',
    title: 'Airbnb Turnover',
    content: [
      'Arrive on time - turnover windows are critical',
      'Strip all bed linens and replace with fresh sets',
      'Check inventory of towels, toilet paper, and amenities',
      'Clean and sanitize all bathrooms thoroughly',
      'Wipe down all surfaces in kitchen and living areas',
      'Vacuum and mop all floors',
      'Check and restock welcome basket if applicable',
      'Ensure all appliances are clean and functional',
      'Check for any guest items left behind',
      'Verify all lights and electronics are working',
      'Take photos of completed work if required',
      'Lock up and secure property properly',
      'Report completion to supervisor immediately',
    ],
  },
  {
    id: 'laundry',
    title: 'Laundry',
    content: [
      'Sort laundry by color and fabric type',
      'Check all pockets before washing',
      'Use appropriate water temperature for each load',
      'Use correct amount of detergent and fabric softener',
      'Follow care labels on all garments',
      'Dry items according to fabric requirements',
      'Fold or hang items immediately after drying',
      'Iron items that require pressing',
      'Return clean items to designated areas',
      'Handle delicate items with extra care',
      'Report any damaged or stained items',
      'Maintain cleanliness of laundry area',
    ],
  },
  {
    id: 'safety',
    title: 'Safety',
    content: [
      'Always wear appropriate personal protective equipment (PPE)',
      'Use cleaning chemicals according to manufacturer instructions',
      'Never mix cleaning chemicals',
      'Ensure proper ventilation when using strong chemicals',
      'Report any safety hazards immediately',
      'Use ladders safely and with proper support',
      'Keep cleaning supplies out of reach of children and pets',
      'Wash hands frequently, especially after handling chemicals',
      'Store chemicals in original containers with labels',
      'Know location of first aid kit and emergency contacts',
      'Follow proper lifting techniques to avoid injury',
      'Report any injuries, no matter how minor',
      'Stay hydrated and take breaks as needed',
    ],
  },
  {
    id: 'conduct',
    title: 'Conduct',
    content: [
      'Arrive on time and in proper uniform',
      'Maintain professional appearance at all times',
      'Respect customer property and privacy',
      'Communicate clearly and professionally with customers',
      'Follow all instructions from supervisors',
      'Complete all assigned tasks thoroughly',
      'Report any issues or concerns promptly',
      'Maintain confidentiality about customer information',
      'Do not use customer facilities (bathroom, phone) without permission',
      'Do not take photos or videos without authorization',
      'Do not accept tips directly - report to supervisor',
      'Treat all customers and colleagues with respect',
      'Follow company policies and procedures at all times',
    ],
  },
];

export default function SOPLibraryPage() {
  const router = useRouter();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/training/handbook/pdf');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'VelocityMaid-Jamaica-Cleaner-Handbook.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to generate handbook');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to download handbook');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cleaners/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-vm-text mb-2">Standard Operating Procedures</h1>
              <p className="text-vm-muted">Jamaica Cleaner Handbook</p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Handbook
                </>
              )}
            </button>
          </div>
        </div>

        {/* SOP Sections */}
        <div className="space-y-4">
          {sopSections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            return (
              <div
                key={section.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-xl font-semibold text-vm-text">{section.title}</h2>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-vm-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-vm-muted" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <ol className="space-y-2 list-decimal list-inside">
                      {section.content.map((item, index) => (
                        <li key={index} className="text-vm-text leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> These procedures are guidelines. Always follow specific instructions
            from your supervisor and respect customer preferences.
          </p>
        </div>
      </div>
    </div>
  );
}

