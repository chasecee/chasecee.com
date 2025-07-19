/* lazy-load and init rapier2d wasm exactly once */
import type RAPIER from "@dimforge/rapier2d";

let rapierPromise: Promise<typeof RAPIER> | null = null;

export const initRapier = (): Promise<typeof RAPIER> => {
  if (!rapierPromise) {
    rapierPromise = import("@dimforge/rapier2d").then(async (mod: any) => {
      // the default export is an async init fn that resolves once the wasm has loaded
      if (typeof mod.default === "function") {
        const wasmUrl = new URL(
          "@dimforge/rapier2d/rapier_wasm2d_bg.wasm",
          import.meta.url,
        );
        await mod.default(wasmUrl);
      }
      return mod as typeof RAPIER;
    });
  }
  return rapierPromise;
};
