import type RAPIER from "@dimforge/rapier2d";

let rapierPromise: Promise<typeof RAPIER> | null = null;

export const initRapier = (): Promise<typeof RAPIER> => {
  if (!rapierPromise) {
    rapierPromise = import("@dimforge/rapier2d").then(async (mod: any) => {
      try {
        // Handle both ESM and CommonJS exports
        const rapierModule = mod.default || mod;

        // Initialize WASM if it's a function (init function)
        if (typeof rapierModule === "function") {
          await rapierModule();
        } else if (typeof rapierModule.init === "function") {
          await rapierModule.init();
        }

        // Return the module, handling different export patterns
        return rapierModule.default || rapierModule;
      } catch (error) {
        console.error("Failed to initialize Rapier2D:", error);
        throw error;
      }
    });
  }
  return rapierPromise;
};
