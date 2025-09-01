/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons'],
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  transpilePackages: ['antd', '@ant-design', '@ant-design/icons'],

  devIndicators: {
    buildActivity: false,
  },

  // Improve error handling
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  ...(process.env.ANALYZE === 'true' && {
    webpack: config => {
      config.plugins.push(
        new (require('@next/bundle-analyzer')({
          enabled: true,
        })())()
      );
      return config;
    },
  }),
};

module.exports = nextConfig;
