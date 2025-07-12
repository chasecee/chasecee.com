/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },

  async headers() {
    return [
      {
        source: "/(site)/favicon.ico",
        headers: [
          {
            key: "Content-Type",
            value: "image/x-icon",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=15552000",
          },
        ],
      },
      {
        source: "/(studio)/favicon.ico",
        headers: [
          {
            key: "Content-Type",
            value: "image/x-icon",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=15552000",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
