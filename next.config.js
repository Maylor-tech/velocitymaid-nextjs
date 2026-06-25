const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/franchise', destination: '/', permanent: true },
      { source: '/franchise/:path*', destination: '/', permanent: true },
      { source: '/jamaica', destination: '/', permanent: true },
      { source: '/jamaica/:path*', destination: '/', permanent: true },
      { source: '/locations/port-antonio', destination: '/', permanent: true },
      { source: '/cities/port-antonio', destination: '/', permanent: true },
    ];
  },
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Explicitly configure webpack to resolve @/ path alias
  // This ensures Vercel's build system understands the alias
  webpack: (config, { isServer }) => {
    // Ensure @/ resolves to project root for both server and client
    const rootPath = path.resolve(__dirname);
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': rootPath,
    };
    
    // Also set up fallbacks for better resolution
    config.resolve.modules = [
      ...(config.resolve.modules || []),
      rootPath,
      'node_modules',
    ];
    
    return config;
  },
}

module.exports = nextConfig;
