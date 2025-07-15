import type RAPIER from "@dimforge/rapier2d";

let rapierPromise: Promise<typeof RAPIER> | null = null;

export const initRapier = (): Promise<typeof RAPIER> => {
  if (rapierPromise) {
    return rapierPromise;
  }

  rapierPromise = new Promise(async (resolve) => {
    const rapier = await import("@dimforge/rapier2d");
    // No need to call .init() on the standard package
    console.log("Rapier WASM module loaded.");
    resolve(rapier);
  });

  return rapierPromise;
};
