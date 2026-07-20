export type VariantGlyphs = readonly (readonly number[])[];

export const GLYPH_LOADERS: Readonly<
  Record<string, () => Promise<VariantGlyphs>>
>;
