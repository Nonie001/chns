import type { NextConfig } from "next";
import { resolve } from 'path';

const nextConfig: NextConfig = {
  // Bundle optimization for Turbopack
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns"],
  },
  
  // Compression and performance
  compress: true,
  
  // Static optimization for lighter builds
  output: "standalone",
  
  // Turbopack configuration (replaces webpack config in Next.js 16)
  turbopack: {
    // Set root directory explicitly to silence warning
    root: resolve(__dirname),
    // Resolve aliases for better tree-shaking
    resolveAlias: {
      canvas: './empty-module',
    },
  },

  // Image optimization
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Headers for better caching
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ],
};

export default nextConfig;
