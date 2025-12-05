"use client";

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface BeforeAfterGalleryProps {
  images?: Array<{ before: string; after: string; label?: string }>;
}

export default function BeforeAfterGallery({ images }: BeforeAfterGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Default images if none provided
  const defaultImages = [
    { before: '/cleaning/clean-kitchen.jpg', after: '/cleaning/clean-kitchen.jpg', label: 'Kitchen' },
    { before: '/cleaning/clean-bathroom.jpg', after: '/cleaning/clean-bathroom.jpg', label: 'Bathroom' },
    { before: '/cleaning/clean-living.jpg', after: '/cleaning/clean-living.jpg', label: 'Living Room' },
  ];

  const galleryImages = images || defaultImages;

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        {galleryImages.map((item, index) => (
          <div key={index} className="relative">
            <div className="grid grid-cols-2 gap-2">
              <div className="relative aspect-square">
                <Image
                  src={item.before}
                  alt={`Before ${item.label || ''}`}
                  fill
                  className="object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                  onClick={() => setSelectedImage(item.before)}
                />
                <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  Before
                </div>
              </div>
              <div className="relative aspect-square">
                <Image
                  src={item.after}
                  alt={`After ${item.label || ''}`}
                  fill
                  className="object-cover rounded-lg cursor-pointer hover:opacity-90 transition"
                  onClick={() => setSelectedImage(item.after)}
                />
                <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                  After
                </div>
              </div>
            </div>
            {item.label && (
              <p className="text-center text-sm text-gray-600 mt-2">{item.label}</p>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            <Image
              src={selectedImage}
              alt="Selected image"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
