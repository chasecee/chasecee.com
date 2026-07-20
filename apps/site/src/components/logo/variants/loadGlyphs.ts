import { MORPH_VARIANT_IDS } from "./morphMeta.js";
import { GLYPH_LOADERS, type VariantGlyphs } from "./glyphs/index.js";

const cache = new Map<number, Promise<VariantGlyphs>>();

export function loadGlyphs(index: number): Promise<VariantGlyphs> {
  const id = MORPH_VARIANT_IDS[index];
  const loader = id ? GLYPH_LOADERS[id] : undefined;
  if (!loader) {
    return Promise.reject(new Error(`Unknown morph variant index: ${index}`));
  }
  let pending = cache.get(index);
  if (!pending) {
    pending = loader();
    cache.set(index, pending);
    pending.catch(() => cache.delete(index));
  }
  return pending;
}

export function prefetchGlyphs(index: number): void {
  loadGlyphs(index).catch(() => {});
}
