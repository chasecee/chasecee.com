import type RAPIER from "@dimforge/rapier2d";

let rapierPromise: Promise<typeof RAPIER> | null = null;

export const initRapier = (): Promise<typeof RAPIER> => {
  if (rapierPromise) {
    return rapierPromise;
  }

  rapierPromise = new Promise(async (resolve) => {
    const rapier = await import("@dimforge/rapier2d");
    resolve(rapier);
  });

  return rapierPromise;
};
