/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    serverActions: {
      bodySizeLimit: "20mb"
    }
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.pexels.com"
      },
      {
        protocol: "https",
        hostname: "**.ngrok-free.dev"
      },
      {
        protocol: "https",
        hostname: "**.ngrok-free.app"
      }
    ]
  }
};

export default nextConfig;
