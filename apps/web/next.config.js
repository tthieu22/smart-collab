/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },

  transpilePackages: ['antd', '@ant-design', '@ant-design/icons'],

  experimental: {
    appDir: true, // bật App Router
    reactRoot: true, // React 18
  },
  devIndicators: false,
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
