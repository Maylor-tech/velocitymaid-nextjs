import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://velocitymaid.com';
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/book`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${baseUrl}/gallery`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/locations/new-jersey`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${baseUrl}/vermont`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/jamaica`, lastModified: now, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${baseUrl}/jamaica/work-with-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/partners`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/corporate/nj`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/franchise/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/cleaners/apply`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/refunds`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let branchRoutes: MetadataRoute.Sitemap = [];
  try {
    const branches = await prisma.branch.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    });
    branchRoutes = branches.map((b) => ({
      url: `${baseUrl}/locations/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch (e) {
    console.error('[sitemap] Could not load branches:', e);
  }

  return [...staticRoutes, ...branchRoutes];
}
