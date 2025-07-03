/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  generateEtags: false,

  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60,
  },

  turbopack: {
    resolveExtensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        react: require.resolve("react"),
        "react-dom": require.resolve("react-dom"),
      };
    }
    return config;
  },

  transpilePackages: ["antd", "@ant-design", "@ant-design/icons"],

  ...(process.env.ANALYZE === "true" && {
    webpack: (config) => {
      config.plugins.push(
        new (require("@next/bundle-analyzer")({
          enabled: true,
        })())()
      );
      return config;
    },
  }),
};

export default nextConfig;
