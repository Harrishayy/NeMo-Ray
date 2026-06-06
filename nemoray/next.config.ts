import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CesiumJS creates a WebGL context that the browser can't release fast enough for
  // React's Strict Mode mount→unmount→remount cycle, causing "initialization failed".
  reactStrictMode: false,
  // turbopack: {} silences the "webpack config without turbopack config" dev-mode error.
  // The webpack config below still applies for `next build` (webpack is the production bundler).
  turbopack: {},
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
