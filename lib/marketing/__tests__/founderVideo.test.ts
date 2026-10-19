import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  parseFounderVideoEmbed,
  readVermontFounderVideoEmbed,
  VT_FOUNDER_VIDEO_POSTER,
  VT_WORK_WITH_US_VIDEO_ENV,
} from '@/lib/marketing/founderVideo';
import { CLEANER_APPLY_VERMONT_PATH } from '@/lib/marketing/publicCtas';
import { RECRUITMENT_PAY_HEADING } from '@/lib/marketing/recruitmentPayCopy';

const repoRoot = path.resolve(__dirname, '../../..');

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('parseFounderVideoEmbed', () => {
  it('hides the player when the URL is missing or blank', () => {
    expect(parseFounderVideoEmbed(undefined)).toBeNull();
    expect(parseFounderVideoEmbed(null)).toBeNull();
    expect(parseFounderVideoEmbed('')).toBeNull();
    expect(parseFounderVideoEmbed('   ')).toBeNull();
  });

  it('rejects Google Drive and non-https URLs', () => {
    expect(
      parseFounderVideoEmbed('https://drive.google.com/file/d/abc/view')
    ).toBeNull();
    expect(
      parseFounderVideoEmbed('http://www.youtube.com/watch?v=abcdefghijk')
    ).toBeNull();
    expect(parseFounderVideoEmbed('/videos/founder.mp4')).toBeNull();
  });

  it('builds a no-autoplay no-loop YouTube nocookie embed', () => {
    const embed = parseFounderVideoEmbed(
      'https://www.youtube.com/watch?v=abcdefghijk'
    );
    expect(embed).toMatchObject({
      provider: 'youtube',
      videoId: 'abcdefghijk',
    });
    expect(embed?.src).toContain('youtube-nocookie.com/embed/abcdefghijk');
    expect(embed?.src).toContain('autoplay=0');
    expect(embed?.src).toContain('loop=0');
    expect(embed?.src).toContain('playsinline=1');
  });

  it('accepts youtu.be and embed URLs', () => {
    expect(parseFounderVideoEmbed('https://youtu.be/abcdefghijk')?.videoId).toBe(
      'abcdefghijk'
    );
    expect(
      parseFounderVideoEmbed('https://www.youtube.com/embed/abcdefghijk')?.videoId
    ).toBe('abcdefghijk');
  });

  it('builds a no-autoplay no-loop Vimeo embed', () => {
    const embed = parseFounderVideoEmbed('https://vimeo.com/123456789');
    expect(embed).toMatchObject({
      provider: 'vimeo',
      videoId: '123456789',
    });
    expect(embed?.src).toContain('player.vimeo.com/video/123456789');
    expect(embed?.src).toContain('autoplay=0');
    expect(embed?.src).toContain('loop=0');
  });
});

describe('Vermont Work with us founder video wiring', () => {
  it('uses the env-gated embed on Work with us only', () => {
    const page = readRepoFile('app/vermont/work-with-us/page.tsx');
    expect(page).toContain('readVermontFounderVideoEmbed');
    expect(page).toContain('FounderRecruitmentVideo');
    expect(page).toContain('founderVideo ?');
    expect(page).toContain('CLEANER_APPLY_VERMONT_PATH');
    expect(page).toContain('Apply for Vermont');
    expect(CLEANER_APPLY_VERMONT_PATH).toBe('/cleaners/apply?market=vermont');

    const homepage = readRepoFile('components/marketing/HomepageMarketing.tsx');
    const hosts = readRepoFile('components/hosts/HostsLandingPage.tsx');
    const vermont = readRepoFile('app/vermont/page.tsx');
    expect(homepage).not.toContain('FounderRecruitmentVideo');
    expect(hosts).not.toContain('FounderRecruitmentVideo');
    expect(vermont).not.toContain('FounderRecruitmentVideo');
  });

  it('keeps Apply visible and uses an in-repo poster, not a committed video file', () => {
    const component = readRepoFile(
      'components/marketing/FounderRecruitmentVideo.tsx'
    );
    const parser = readRepoFile('lib/marketing/founderVideo.ts');
    expect(component).toContain('aspect-video');
    expect(component).toContain('max-w-xl');
    expect(component).toContain('Play video:');
    expect(component).toContain('VT_FOUNDER_VIDEO_POSTER');
    expect(component).not.toContain('drive.google.com');
    expect(component).not.toMatch(/\.mp4|\.mov/);
    expect(parser).toContain('playsinline');

    expect(VT_FOUNDER_VIDEO_POSTER.src).toBe(
      '/images/portfolio/vermont/velocitymaid-vermont-guest-ready-living-room.jpg'
    );
    expect(
      fs.existsSync(
        path.join(
          repoRoot,
          'public',
          VT_FOUNDER_VIDEO_POSTER.src.replace(/^\//, '')
        )
      )
    ).toBe(true);

    const envExample = readRepoFile('.env.example');
    expect(envExample).toContain(VT_WORK_WITH_US_VIDEO_ENV);
    expect(envExample).toMatch(/# NEXT_PUBLIC_VT_WORK_WITH_US_VIDEO_URL=/);
    expect(envExample).not.toMatch(/^NEXT_PUBLIC_VT_WORK_WITH_US_VIDEO_URL=/m);
  });

  it('stays hidden when NEXT_PUBLIC_VT_WORK_WITH_US_VIDEO_URL is unset', () => {
    const prev = process.env[VT_WORK_WITH_US_VIDEO_ENV];
    delete process.env[VT_WORK_WITH_US_VIDEO_ENV];
    expect(readVermontFounderVideoEmbed()).toBeNull();
    if (prev === undefined) {
      delete process.env[VT_WORK_WITH_US_VIDEO_ENV];
    } else {
      process.env[VT_WORK_WITH_US_VIDEO_ENV] = prev;
    }
  });

  it('uses accurate payout copy and keeps the Apply CTA', () => {
    const page = readRepoFile('app/vermont/work-with-us/page.tsx');
    expect(page).toContain('RECRUITMENT_PAY_HEADING');
    expect(page).toContain('RECRUITMENT_PAY_OFFER_COPY');
    expect(page).toContain('RECRUITMENT_PAY_SCHEDULE_COPY');
    expect(page).not.toContain('of the job total');
    expect(page).not.toContain('weekly cycle');
    expect(page).not.toContain('Nothing is assigned until you accept');
    expect(RECRUITMENT_PAY_HEADING).toBe('65% of the eligible job amount');
    expect(page).toContain('CLEANER_APPLY_VERMONT_PATH');
  });

  it('does not load an iframe until the visitor plays, so nothing autoplays on mobile', () => {
    const component = readRepoFile(
      'components/marketing/FounderRecruitmentVideo.tsx'
    );
    expect(component).toContain('const [playing, setPlaying] = useState(false)');
    expect(component).toContain('{playing ? (');
    expect(component).toContain("url.searchParams.set('autoplay', '1')");
  });
});
