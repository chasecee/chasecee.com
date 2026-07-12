import { defineConfig, fontProviders } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  site: "https://chasecee.com",
  output: "server",
  adapter: vercel({
    isr: {
      bypassToken: process.env.ISR_BYPASS_TOKEN,
      exclude: ["/api/revalidate"],
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
    plugins: [tailwindcss()],
    worker: {
      format: "es",
      plugins: () => [wasm(), topLevelAwait()],
    },
    optimizeDeps: { exclude: ["@dimforge/rapier2d"] },
  },
});
