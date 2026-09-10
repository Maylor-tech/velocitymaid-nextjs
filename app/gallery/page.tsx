"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import {
  GALLERY_CATEGORIES,
  GALLERY_IMAGES,
  type PortfolioImage,
} from "@/lib/marketing/portfolio";

const primaryButton =
  "inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark";

export default function GalleryPage() {
  const [category, setCategory] = useState<(typeof GALLERY_CATEGORIES)[number]>(
    "All"
  );
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const images = useMemo(
    () =>
      category === "All"
        ? GALLERY_IMAGES
        : GALLERY_IMAGES.filter((image) => image.category === category),
    [category]
  );

  const active = activeIndex === null ? null : images[activeIndex];

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader bookingHref="/book?branch=new-jersey" />
      <main>
        <section className="bg-vm-navy px-5 py-16 text-center sm:py-20">
          <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan">
            Portfolio
          </p>
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Our Work
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-sm leading-relaxed text-white/65 sm:text-base">
            A small, curated look at real VelocityMaid property care across
            Vermont homes — guest-ready interiors, outdoor living, and finished
            presentation details.
          </p>
        </section>

        <section className="px-5 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap justify-center gap-2">
              {GALLERY_CATEGORIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setCategory(item);
                    setActiveIndex(null);
                  }}
                  className={
                    category === item
                      ? "rounded-full bg-vm-navy px-4 py-2 font-body text-xs font-semibold text-white"
                      : "rounded-full border border-vm-border bg-white px-4 py-2 font-body text-xs font-semibold text-vm-navy hover:border-vm-cyan"
                  }
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="mt-4 text-center font-body text-xs text-vm-muted">
              {images.length} {images.length === 1 ? "photograph" : "photographs"}
              {category !== "All" ? ` · ${category}` : ""}
            </p>

            <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12">
              {images.map((image, index) => (
                <GalleryCard
                  key={image.src}
                  image={image}
                  onOpen={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-vm-navy px-5 py-16 text-center">
          <h2 className="font-heading text-3xl font-bold text-white">
            Ready for guest-ready results?
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-white/65">
            Vermont hosts can request property care. New Jersey households can
            book residential cleaning online.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/vermont/host-intake" className={primaryButton}>
              Book Property Care
            </Link>
            <Link
              href="/book?branch=new-jersey"
              className="inline-flex items-center justify-center rounded-md border border-white/40 px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-white transition hover:border-vm-cyan hover:text-vm-cyan"
            >
              Book NJ Cleaning
            </Link>
          </div>
        </section>
      </main>
      <Footer />

      {active && activeIndex !== null ? (
        <Lightbox
          image={active}
          index={activeIndex}
          total={images.length}
          onClose={() => setActiveIndex(null)}
          onPrev={() =>
            setActiveIndex((current) =>
              current === null
                ? null
                : current === 0
                  ? images.length - 1
                  : current - 1
            )
          }
          onNext={() =>
            setActiveIndex((current) =>
              current === null
                ? null
                : current === images.length - 1
                  ? 0
                  : current + 1
            )
          }
        />
      ) : null}
    </div>
  );
}

function GalleryCard({
  image,
  onOpen,
}: {
  image: PortfolioImage;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group text-left"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes="(max-width: 639px) calc(100vw - 2.5rem), 480px"
          className="object-cover transition duration-300 group-hover:scale-[1.01]"
        />
      </div>
      <div className="mt-4">
        <p className="font-heading text-sm font-bold text-vm-navy">
          {image.caption}
        </p>
        <p className="mt-1 font-body text-xs text-vm-muted">{image.category}</p>
      </div>
    </button>
  );
}

function Lightbox({
  image,
  index,
  total,
  onClose,
  onPrev,
  onNext,
}: {
  image: PortfolioImage;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white"
        onClick={onClose}
        aria-label="Close image"
      >
        <X className="h-6 w-6" />
      </button>
      {total > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white"
            onClick={(event) => {
              event.stopPropagation();
              onPrev();
            }}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </>
      ) : null}
      <div
        className="relative h-[80vh] w-full max-w-5xl"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-white">
        <p className="font-heading text-sm font-semibold">{image.caption}</p>
        <p className="mt-1 font-body text-xs text-white/70">
          {image.category} · {index + 1} / {total}
        </p>
      </div>
    </div>
  );
}
