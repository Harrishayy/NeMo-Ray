import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false, path: false, http: false, https: false, zlib: false,
    };
    config.output = { ...config.output, sourcePrefix: '' };
    return config;
  },
};

export default nextConfig;
