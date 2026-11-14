/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/portfolio",
        destination: "/",
        permanent: true,
      },
      {
        source: "/portfolio/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/resumes/:filename*",
        destination: "/api/resumes/render-pdf?filename=:filename*",
      },
    ];
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(pdf)$/i,
      type: "asset/resource",
    });
    return config;
  },
};

module.exports = nextConfig;
