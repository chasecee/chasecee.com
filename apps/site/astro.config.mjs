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
      provider: fontProviders.fontsource(),
      weights: ["300 900"],
      styles: ["normal", "italic"],
      subsets: ["latin"],
    },
  ],
  build: {
    inlineStylesheets: "always",
  },
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), wasm(), topLevelAwait()],
    worker: { format: "es" },
    optimizeDeps: { exclude: ["@dimforge/rapier2d"] },
  },
});
