/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.inprocess.world",
      },
      {
        protocol: "https",
        hostname: "*.arweave.net",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
      },
    ],
  },
};

module.exports = nextConfig;
