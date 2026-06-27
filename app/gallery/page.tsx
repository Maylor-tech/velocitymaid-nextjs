'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, X, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

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
  {
    src: '/images/gallery/bathroom-sink-02.jpg',
    alt: 'Bathroom sink cleaning',
    category: 'Bathroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/bathroom-window-01.jpg',
    alt: 'Bathroom window cleaning',
    category: 'Bathroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/bedroom-canopy-01.jpg',
    alt: 'Bedroom canopy cleaning',
    category: 'Bedroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/bedroom-gray-01.jpg',
    alt: 'Bedroom cleaning',
    category: 'Bedroom',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/dining-rustic-01.jpg',
    alt: 'Dining room cleaning',
    category: 'Living Room',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/kitchen-cabin-01.jpg',
    alt: 'Kitchen cabin cleaning',
    category: 'Kitchen',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/kitchen-cabin-02.jpg',
    alt: 'Kitchen cabin cleaning',
    category: 'Kitchen',
    location: 'New Jersey'
  },
  {
    src: '/images/gallery/loft-blue-chair-01.jpg',
    alt: 'Loft living space cleaning',
    category: 'Living Room',
    location: 'New Jersey'
  },
];

const categories = ['All', 'Kitchen', 'Bathroom', 'Bedroom', 'Living Room', 'Closet'];

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredImages, setFilteredImages] = useState(galleryImages);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    if (selectedCategory === 'All') {
      setFilteredImages(galleryImages);
    } else {
      setFilteredImages(galleryImages.filter(img => img.category === selectedCategory));
    }
  }, [selectedCategory]);

  const openLightbox = (imageSrc: string) => {
    const index = filteredImages.findIndex(img => img.src === imageSrc);
    setSelectedImage(imageSrc);
    setSelectedImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    
    let newIndex: number;
    if (direction === 'prev') {
      newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : filteredImages.length - 1;
    } else {
      newIndex = selectedImageIndex < filteredImages.length - 1 ? selectedImageIndex + 1 : 0;
    }
    
    setSelectedImageIndex(newIndex);
    setSelectedImage(filteredImages[newIndex].src);
  };

  // Touch handlers for swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigateImage('next');
    } else if (isRightSwipe) {
      navigateImage('prev');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedImage) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigateImage('prev');
      } else if (e.key === 'ArrowRight') {
        navigateImage('next');
      }
    };

    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage, selectedImageIndex, filteredImages]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-vm-cyan-dark hover:text-vm-cyan-dark">
              <ArrowLeft className="w-5 h-5" />
              <Sparkles className="w-6 h-6" />
              <span className="text-xl font-bold">VelocityMaid</span>
            </Link>
            <Link 
              href="/"
              className="text-vm-muted hover:text-vm-cyan-dark transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Gallery Header */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-vm-surface to-white">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-vm-text mb-4">
            Our Work Gallery
          </h1>
          <p className="text-xl text-vm-muted mb-8">
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
                    ? 'bg-vm-navy text-white'
                    : 'bg-white text-vm-text hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <p className="text-sm text-vm-muted">
            Showing {filteredImages.length} {filteredImages.length === 1 ? 'photo' : 'photos'}
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          {filteredImages.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-vm-muted mb-4">No photos found in this category.</p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="text-vm-cyan-dark hover:text-vm-cyan-dark font-semibold"
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
                  onClick={() => openLightbox(image.src)}
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
                          ? 'bg-vm-danger text-white' 
                          : 'bg-vm-success text-white'
                      }`}>
                        {image.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-vm-text text-sm mb-1">{image.category}</p>
                    <p className="text-xs text-vm-muted">{image.location}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Image Lightbox Modal */}
      {selectedImage && selectedImageIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-95 p-4"
          onClick={closeLightbox}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Close Button */}
          <button
            className="absolute top-4 right-4 text-white hover:text-vm-muted transition z-[101] bg-black bg-opacity-70 rounded-full p-3 hover:bg-opacity-90"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            aria-label="Close image"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Navigation Arrows */}
          {filteredImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-vm-muted transition z-[101] bg-black bg-opacity-70 rounded-full p-3 hover:bg-opacity-90"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('prev');
                }}
                aria-label="Previous image"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-vm-muted transition z-[101] bg-black bg-opacity-70 rounded-full p-3 hover:bg-opacity-90"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateImage('next');
                }}
                aria-label="Next image"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            </>
          )}

          {/* Image Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black bg-opacity-70 rounded-full px-4 py-2 text-sm z-[101]">
            {selectedImageIndex + 1} / {filteredImages.length}
          </div>

          {/* Image Container */}
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={selectedImage}
              alt={filteredImages[selectedImageIndex]?.alt || "Full size gallery image"}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Image Info */}
          {filteredImages[selectedImageIndex] && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 text-center text-white bg-black bg-opacity-70 rounded-lg px-6 py-3 max-w-2xl z-[101]">
              <p className="font-semibold text-lg">{filteredImages[selectedImageIndex].category}</p>
              <p className="text-sm text-vm-muted">{filteredImages[selectedImageIndex].location}</p>
            </div>
          )}
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-vm-navy to-vm-navy">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Home?
          </h2>
          <p className="text-xl text-vm-muted mb-8">
            Book your cleaning service today and experience the VelocityMaid difference
          </p>
          <Link
            href="/book"
            className="inline-flex items-center bg-white text-vm-cyan-dark px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition"
          >
            Book Your Cleaning Service
          </Link>
        </div>
      </section>
    </div>
  );
}

