'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, X, ArrowLeft } from 'lucide-react';

// Gallery images - only using photos that actually exist
const galleryImages = [
  {
    src: '/images/gallery/velocitymaid-kitchen-before-newark-nj.jpg',
    alt: 'Kitchen before cleaning - Newark, NJ',
    category: 'Kitchen',
    location: 'Newark, NJ',
    badge: 'Before'
  },
  {
    src: '/images/gallery/velocitymaid-kitchen-after-newark-nj.jpg',
    alt: 'Kitchen after cleaning - Newark, NJ',
    category: 'Kitchen',
    location: 'Newark, NJ',
    badge: 'After'
  },
  {
    src: '/images/gallery/velocitymaid-luxury-bathroom-deep-clean-nj.jpg',
    alt: 'Luxury bathroom deep cleaning',
    category: 'Bathroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/velocitymaid-cozy-bedroom-cleaning-nj.jpg',
    alt: 'Cozy bedroom cleaning',
    category: 'Bedroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/velocitymaid-bathroom-standard-cleaning-nj.jpg',
    alt: 'Standard bathroom cleaning',
    category: 'Bathroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/velocitymaid-bedroom-accent-wall-cleaning-jersey-city.jpg',
    alt: 'Bedroom accent wall cleaning - Jersey City',
    category: 'Bedroom',
    location: 'Jersey City, NJ'
  },
  {
    src: '/images/gallery/velocitymaid-bedroom-cleaning-newark-nj.jpg',
    alt: 'Bedroom cleaning - Newark, NJ',
    category: 'Bedroom',
    location: 'Newark, NJ'
  },
  {
    src: '/images/gallery/velocitymaid-bedroom-move-out-cleaning-nj.jpg',
    alt: 'Move-out bedroom cleaning',
    category: 'Bedroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/velocitymaid-detail-cleaning-kitchen-drawer-nj.jpg',
    alt: 'Detail cleaning kitchen drawer',
    category: 'Kitchen',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/velocitymaid-living-room-cleaning-newark-nj.jpg',
    alt: 'Living room cleaning - Newark, NJ',
    category: 'Living Room',
    location: 'Newark, NJ'
  },
];

const categories = ['All', 'Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Closet'];

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredImages, setFilteredImages] = useState(galleryImages);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredImages(galleryImages);
    } else {
      setFilteredImages(galleryImages.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
      }
    };
    if (selectedImage) {
      window.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
              <ArrowLeft className="w-5 h-5" />
              <Sparkles className="w-6 h-6" />
              <span className="text-xl font-bold">VelocityMaid</span>
            </Link>
            <Link 
              href="/"
              className="text-gray-600 hover:text-primary-600 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Gallery Header */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Work Gallery
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Real homes. Real transformations. See the VelocityMaid difference.
          </p>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-semibold transition ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-500">
            Showing {filteredImages.length} {filteredImages.length === 1 ? 'photo' : 'photos'}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {filteredImages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-gray-600 mb-4">No photos found in this category.</p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-primary-600 hover:text-primary-700 font-semibold"
              >
                View all photos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredImages.map((image, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-2xl shadow-lg overflow-hidden card-hover cursor-pointer relative"
                  onClick={() => setSelectedImage(image.src)}
                >
                  <div className="relative w-full aspect-square bg-gray-100">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      onError={(e) => {
                        // Show placeholder instead of hiding
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="600"%3E%3Crect fill="%23f3f4f6" width="800" height="600"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="18"%3EImage loading...%3C/text%3E%3C/svg%3E';
                        console.error('Image failed to load:', image.src);
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300" />
                    {image.badge && (
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold ${
                        image.badge === 'Before' 
                          ? 'bg-red-500 text-white' 
                          : 'bg-green-500 text-white'
                      }`}>
                        {image.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-gray-900 text-sm mb-1">{image.category}</p>
                    <p className="text-xs text-gray-600">{image.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-[101] bg-black bg-opacity-50 rounded-full p-2"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt="Full size gallery image"
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Home?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Book your cleaning service today and experience the VelocityMaid difference
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center bg-white text-primary-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition"
          >
            Book Your Cleaning Service
          </Link>
        </div>
      </section>
    </div>
  );
}

