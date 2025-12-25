const path = require('path');

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
    missingSuspenseWithCSRBailout: false,
  },
  // Explicitly configure webpack to resolve @/ path alias
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };
    return config;
  },
}

module.exports = nextConfig
