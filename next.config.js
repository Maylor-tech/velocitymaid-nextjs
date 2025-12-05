/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
    // Enable image optimization for local images
    unoptimized: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent static generation timeout for review pages
  experimental: {
    isrMemoryCacheSize: 0,
  },
}

module.exports = nextConfig
