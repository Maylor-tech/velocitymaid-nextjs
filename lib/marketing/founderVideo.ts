/**
 * Vermont Work with us founder video.
 * Hidden unless NEXT_PUBLIC_VT_WORK_WITH_US_VIDEO_URL is a valid https
 * YouTube or Vimeo URL. Google Drive and raw file URLs are rejected.
 */

export const VT_WORK_WITH_US_VIDEO_ENV = 'NEXT_PUBLIC_VT_WORK_WITH_US_VIDEO_URL';

/** Approved in-repo property photo — guest-ready Vermont living room. */
export const VT_FOUNDER_VIDEO_POSTER = {
  src: '/images/portfolio/vermont/velocitymaid-vermont-guest-ready-living-room.jpg',
  alt: 'Guest-ready Vermont vacation rental living room after a VelocityMaid clean',
} as const;

export type FounderVideoProvider = 'youtube' | 'vimeo';

export type FounderVideoEmbed = {
  provider: FounderVideoProvider;
  videoId: string;
  src: string;
  title: string;
};

const TITLE = 'Brian, founder of VelocityMaid, on working with us in Vermont';

const BLOCKED_HOST =
  /^(?:drive\.google\.com|docs\.google\.com|googleusercontent\.com)$/i;

function youtubeEmbedSrc(id: string): string {
  const params = new URLSearchParams({
    autoplay: '0',
    loop: '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}

function vimeoEmbedSrc(id: string): string {
  const params = new URLSearchParams({
    autoplay: '0',
    loop: '0',
    title: '0',
    byline: '0',
  });
  return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}

function youtubeIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return isYoutubeId(id) ? id : null;
  }
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
    if (url.pathname.startsWith('/embed/')) {
      const id = url.pathname.split('/')[2];
      return isYoutubeId(id) ? id : null;
    }
    if (url.pathname.startsWith('/shorts/')) {
      const id = url.pathname.split('/')[2];
      return isYoutubeId(id) ? id : null;
    }
    const id = url.searchParams.get('v');
    return isYoutubeId(id) ? id : null;
  }
  return null;
}

function vimeoIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, '');
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const parts = url.pathname.split('/').filter(Boolean);
    const maybeId = host === 'player.vimeo.com' && parts[0] === 'video' ? parts[1] : parts[0];
    return isVimeoId(maybeId) ? maybeId : null;
  }
  return null;
}

function isYoutubeId(id: string | null | undefined): id is string {
  return Boolean(id && /^[\w-]{11}$/.test(id));
}

function isVimeoId(id: string | null | undefined): id is string {
  return Boolean(id && /^\d{6,12}$/.test(id));
}

export function parseFounderVideoEmbed(
  raw: string | null | undefined
): FounderVideoEmbed | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^www\./, '');
  if (BLOCKED_HOST.test(host)) {
    return null;
  }

  const youtubeId = youtubeIdFromUrl(url);
  if (youtubeId) {
    return {
      provider: 'youtube',
      videoId: youtubeId,
      src: youtubeEmbedSrc(youtubeId),
      title: TITLE,
    };
  }

  const vimeoId = vimeoIdFromUrl(url);
  if (vimeoId) {
    return {
      provider: 'vimeo',
      videoId: vimeoId,
      src: vimeoEmbedSrc(vimeoId),
      title: TITLE,
    };
  }

  return null;
}

export function readVermontFounderVideoEmbed(): FounderVideoEmbed | null {
  return parseFounderVideoEmbed(process.env[VT_WORK_WITH_US_VIDEO_ENV]);
}
