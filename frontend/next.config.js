/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    formats: ['image/webp'],
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  // Proxy /api/* and /health → Express backend (no CORS needed in production)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/:path*`,
      },
      {
        source: "/health",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/health`,
      },
    ];
  },
};

module.exports = nextConfig;
