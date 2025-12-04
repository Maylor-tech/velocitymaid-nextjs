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
}

module.exports = nextConfig
