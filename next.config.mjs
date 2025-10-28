/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack(config) {
    config.ignoreWarnings = [
      {
        message: /require\.extensions is not supported by webpack/,
      },
      {
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];

    config.resolve.fallback = {
      ...config.resolve.fallback,
      'osx-temperature-sensor': false,
    };

    return config;
  },
};

export default nextConfig;
