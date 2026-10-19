'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import type { FounderVideoEmbed } from '@/lib/marketing/founderVideo';
import { VT_FOUNDER_VIDEO_POSTER } from '@/lib/marketing/founderVideo';

type FounderRecruitmentVideoProps = {
  embed: FounderVideoEmbed;
  className?: string;
};

function playbackSrc(embed: FounderVideoEmbed): string {
  const url = new URL(embed.src);
  url.searchParams.set('autoplay', '1');
  return url.toString();
}

export function FounderRecruitmentVideo({
  embed,
  className = '',
}: FounderRecruitmentVideoProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <figure className={`mx-auto w-full max-w-xl ${className}`.trim()}>
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/15 bg-black">
        {playing ? (
          <iframe
            src={playbackSrc(embed)}
            title={embed.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full"
            aria-label={`Play video: ${embed.title}`}
          >
            <Image
              src={VT_FOUNDER_VIDEO_POSTER.src}
              alt={VT_FOUNDER_VIDEO_POSTER.alt}
              fill
              sizes="(max-width: 640px) 100vw, 576px"
              className="object-cover"
              priority={false}
            />
            <span className="absolute inset-0 bg-vm-navy/25" aria-hidden />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-vm-cyan text-vm-navy shadow-lg transition group-hover:bg-vm-cyan-dark">
                <Play className="ml-0.5 h-6 w-6" fill="currentColor" aria-hidden />
              </span>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 text-center font-body text-xs leading-relaxed text-white/70">
        A short message from Brian, founder of VelocityMaid.
      </figcaption>
    </figure>
  );
}
