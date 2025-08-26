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
  devIndicators: {
    buildActivity: false,
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
