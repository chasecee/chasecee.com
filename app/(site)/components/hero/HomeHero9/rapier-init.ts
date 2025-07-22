import type RAPIER from "@dimforge/rapier2d";

let rapierPromise: Promise<typeof RAPIER> | null = null;

export const initRapier = (): Promise<typeof RAPIER> => {
  if (!rapierPromise) {
    rapierPromise = import("@dimforge/rapier2d").then(async (mod: any) => {
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
