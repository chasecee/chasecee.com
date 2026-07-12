import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { localKitPlugin, localKit, useLocalKit } from "../../scripts/local-kit.ts";

const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const appRoot = path.dirname(fileURLToPath(import.meta.url));

// Dev servers alias @chasecee/sanity-kit to the local sibling checkout when it
// exists on disk; deployed builds fall back to the installed github: package.
const localKitAliases = useLocalKit
  ? [
      {
        find: "@chasecee/sanity-kit/astro/lightbox/galleryLightboxBoot",
        replacement: path.join(localKit, "src/astro/lightbox/galleryLightboxBoot.ts"),
      },
      {
        find: "@chasecee/sanity-kit/astro/lightbox/imageGalleryLightbox",
        replacement: path.join(localKit, "src/astro/lightbox/imageGalleryLightbox.ts"),
      },
      {
        find: "@chasecee/sanity-kit/astro",
        replacement: path.join(localKit, "src/astro/index.ts"),
      },
    ]
  : [];

export default defineConfig({
  site: "https://chasecee.com",
  output: "server",
  prefetch: {
    defaultStrategy: 'viewport'
  },
  adapter: vercel({
    isr: {
      bypassToken: process.env.ISR_BYPASS_TOKEN,
      exclude: [/^\/api\/.+/],
    },
  }),
  fonts: [
    {
      name: "Rubik",
      cssVariable: "--font-rubik",
      provider: fontProviders.local(),
      options: {
        variants: [
          {
            weight: "300 900",
            style: "normal",
            src: [
              "@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2",
            ],
          },
          {
            weight: "300 900",
            style: "italic",
            src: [
              "@fontsource-variable/rubik/files/rubik-latin-wght-italic.woff2",
            ],
          },
        ],
      },
    },
  ],
  build: {
    inlineStylesheets: "always",
  },
  integrations: [react()],
  vite: {
    envDir: monorepoRoot,
    resolve: {
      alias: localKitAliases,
    },
    server: {
      fs: {
        allow: [monorepoRoot, localKit],
      },
    },
    plugins: [localKitPlugin(appRoot), tailwindcss()].filter(Boolean),
    worker: {
      format: "es",
      plugins: () => [wasm(), topLevelAwait()],
    },
    optimizeDeps: { exclude: ["@dimforge/rapier2d"] },
  },
});
