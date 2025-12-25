const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.unsplash.com'],
    unoptimized: false,
  },
  typescript: {
    ignoreBuildErrors: true,
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
