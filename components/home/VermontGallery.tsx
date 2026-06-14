"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";

/** Set to true once photos are in public/images/vermont/ */
export const VERMONT_GALLERY_ENABLED = false;

const PHOTOS = [
  {
    src: "/images/vermont/vermont-kitchen.jpg",
    alt: "Clean white kitchen at Vermont short-term rental",
    room: "Kitchen",
  },
  {
    src: "/images/vermont/vermont-living-room.jpg",
    alt: "Living room at Vermont rental property",
    room: "Living room",
  },
  {
    src: "/images/vermont/vermont-reading-room.jpg",
    alt: "Reading room with bay window Vermont",
    room: "Reading room",
  },
  {
    src: "/images/vermont/vermont-attic-bedroom-1.jpg",
    alt: "Attic bedroom with exposed wood ceiling Vermont",
    room: "Attic bedroom",
  },
  {
    src: "/images/vermont/vermont-attic-bedroom-2.jpg",
    alt: "Second attic suite at Vermont rental",
    room: "Attic suite",
  },
  {
    src: "/images/vermont/vermont-attic-lounge.jpg",
    alt: "Upstairs lounge with TV Vermont rental",
    room: "Upstairs lounge",
  },
  {
    src: "/images/vermont/vermont-nook.jpg",
    alt: "Cozy reading nook with octagon window Vermont",
    room: "Reading nook",
  },
  {
    src: "/images/vermont/vermont-screened-porch.jpg",
    alt: "Screened porch with wicker furniture Vermont",
    room: "Screened porch",
  },
  {
    src: "/images/vermont/vermont-dining-room.jpg",
    alt: "Dining room with stained glass pendant Vermont",
    room: "Dining room",
  },
  {
    src: "/images/vermont/vermont-laundry-room.jpg",
    alt: "Laundry room at Vermont rental property",
    room: "Laundry room",
  },
];

const TRUST = [
  "Photo report after every clean",
  "Locally operated from Ludlow, VT",
  "Turnover-ready in time for check-in",
];

function PhotoFallback() {
  return (
    <div className="w-full h-full bg-vm-navy flex items-center justify-center">
      <span className="text-vm-cyan/40 text-sm font-body">Photo loading...</span>
    </div>
  );
}

export default function VermontGallery() {
  const [active, setActive] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  if (!VERMONT_GALLERY_ENABLED) {
    return null;
  }

  const markError = (index: number) => {
    setImgErrors((prev) => ({ ...prev, [index]: true }));
  };

  return (
    <section className="py-16 px-6 bg-vm-surface">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold font-body text-vm-cyan uppercase tracking-widest mb-2">
            Vermont properties
          </p>
          <h2 className="text-3xl font-bold font-heading text-vm-navy mb-3">
            Real Vermont homes we care for
          </h2>
          <p className="font-body text-vm-muted text-sm max-w-xl leading-relaxed">
            Middlebury, VT — a charming 4-bedroom, 2.5-bath home on Airbnb, VRBO,
            and Booking.com. VelocityMaid handles every turnover so the owner can
            manage confidently from out of state.
          </p>
        </div>

        <div
          className="relative w-full rounded-xl overflow-hidden bg-vm-navy mb-3"
          style={{ aspectRatio: "16/9" }}
        >
          {imgErrors[active] ? (
            <PhotoFallback />
          ) : (
            <Image
              src={PHOTOS[active].src}
              alt={PHOTOS[active].alt}
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, 900px"
              priority={active === 0}
              onError={() => markError(active)}
            />
          )}
          <div
            className="absolute bottom-0 left-0 right-0 px-5 py-4"
            style={{
              background:
                "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
            }}
          >
            <span className="text-white font-heading font-semibold text-sm">
              {PHOTOS[active].room}
            </span>
            <span className="text-white/55 font-body text-xs ml-2">
              Middlebury, Vermont
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-10 md:grid-cols-10">
          {PHOTOS.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View ${photo.room}`}
              className={`relative rounded-lg overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-vm-cyan ${
                active === i
                  ? "ring-2 ring-vm-cyan ring-offset-2 opacity-100"
                  : "opacity-50 hover:opacity-80"
              }`}
              style={{ aspectRatio: "1" }}
            >
              {imgErrors[i] ? (
                <PhotoFallback />
              ) : (
                <Image
                  src={photo.src}
                  alt={photo.room}
                  fill
                  className="object-cover"
                  sizes="80px"
                  onError={() => markError(i)}
                />
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-vm-border">
          <div className="flex flex-wrap gap-4 flex-1">
            {TRUST.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-vm-cyan/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-vm-cyan text-xs font-bold">✓</span>
                </div>
                <span className="font-body text-sm text-vm-text">{item}</span>
              </div>
            ))}
          </div>
          <Link
            href="/vermont/host-intake"
            className="bg-vm-cyan text-vm-navy font-heading font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-vm-cyan-dark transition-colors flex-shrink-0"
          >
            Get a quote →
          </Link>
        </div>
      </div>
    </section>
  );
}
