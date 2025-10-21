/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {},
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
  webpack(config, { isServer }) {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    // Set target for modern browsers that support async/await and WebAssembly
    if (!isServer) {
      config.target = ["web", "es2020"];
      config.output = {
        ...config.output,
        environment: {
          ...config.output?.environment,
          asyncFunction: true,
          arrowFunction: true,
          const: true,
          destructuring: true,
          forOf: true,
          module: true,
        },
      };
    }

    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
    });

    // Fix for Rapier2D WASM loading in workers
    if (!isServer) {
      try {
        const rapierPath = require.resolve("@dimforge/rapier2d");
        config.resolve.alias = {
          ...config.resolve.alias,
          "@dimforge/rapier2d": rapierPath,
        };
      } catch (e) {
        // Only warn if the package is actually missing
        if (e.code !== "MODULE_NOT_FOUND") {
          console.warn(
            "Could not resolve @dimforge/rapier2d path, using default",
          );
        }
      }
    }

    // Disable polyfills for modern browsers
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };

    // Optimize chunks for better module loading
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          rapier: {
            test: /[\\/]node_modules[\\/]@dimforge[\\/]rapier2d/,
            name: "rapier",
            chunks: "all",
            priority: 10,
          },
        },
      },
    };

    return config;
  },
};

module.exports = nextConfig;
