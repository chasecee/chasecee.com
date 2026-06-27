import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import tailwindcss from "@tailwindcss/vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  site: "https://chasecee.com",
  output: "server",
  adapter: vercel(),
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
