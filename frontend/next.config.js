/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy /api/* → Express backend so the browser never needs CORS
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
