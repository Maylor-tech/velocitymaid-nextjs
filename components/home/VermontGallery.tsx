"use client";

import Image from "next/image";
import { useState } from "react";
import Link from "next/link";
import {
  VERMONT_GALLERY_PHOTOS,
  VERMONT_GALLERY_HEADLINE,
  VERMONT_GALLERY_SUBHEADLINE,
  VERMONT_GALLERY_TRUST_LINE,
} from "@/lib/vermont/middleburyPhotos";

/** Set to true once photos are in public/images/vermont/ */
export const VERMONT_GALLERY_ENABLED = true;

const TRUST = [
  "Photo report after every clean",
  "Locally operated from Middlebury, VT",
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

  const photos = VERMONT_GALLERY_PHOTOS;
  const current = photos[active];

  return (
    <section className="py-16 px-6 bg-white border-t border-vm-border">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold font-body text-vm-cyan uppercase tracking-widest mb-2">
            {VERMONT_GALLERY_TRUST_LINE}
          </p>
          <h2 className="text-3xl font-bold font-heading text-vm-navy mb-3">
            {VERMONT_GALLERY_HEADLINE}
          </h2>
          <p className="font-body text-vm-muted text-sm max-w-2xl leading-relaxed">
            {VERMONT_GALLERY_SUBHEADLINE}
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
              src={current.src}
              alt={current.alt}
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
                "linear-gradient(to top, rgba(6,27,68,0.85), transparent)",
            }}
          >
            <span className="text-white font-heading font-semibold text-sm">
              {current.label}
            </span>
            <span className="text-white/55 font-body text-xs ml-2">
              Middlebury, Vermont
            </span>
          </div>
        </div>

        <div
          className={`grid gap-2 mb-10 grid-cols-3 sm:grid-cols-6`}
        >
          {photos.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View ${photo.label}`}
              aria-current={active === i ? "true" : undefined}
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
                  alt={photo.label}
                  fill
                  className="object-cover"
                  sizes="120px"
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
