# Logo Header Layer Contract

This document captures the current header/logo layering model with a single-path Kapow backdrop.

## Visual intent

- The logo stays skewed so it extends beyond the header edges.
- Per-letter border strokes and the header border read as one continuous system.
- Per-letter inner strokes create padding between glyph fill and border stroke.
- Kapow is one morphing backdrop path inside the same SVG as the glyphs.

## Required z-stack

Highest to lowest paint order:

1. `logo svg glyph paths`
2. `logo svg kapow path`
3. `logo border inner`
4. `header inner`
5. `logo border`
6. `header border`

## Layer placement model

- `header border` and `header inner` remain in `Header.astro`.
- `logo border` and `logo border inner` render through header-level portal roots so they can interleave with `header inner`.
- The logo island renders one `ChaseCeeLogo` SVG containing both Kapow and glyph paths.
- All three morphing systems (glyph fill + border mirrors + Kapow backdrop) are driven by the same rAF step.

## Morph data

- Glyph morph source remains `variants/morphData.js`.
- Kapow morph source is deterministic 200-point variant data in `components/logo/kapowMorph.ts`.
- Kapow path topology is shared across variants so interpolation stays clean.

## Stroke width controls

File: `apps/site/src/styles/logo.css`

- `--logo-padding-stroke`: per-letter halo thickness.
- `--logo-border-stroke`: outer border thickness.
- Default relationship: `--logo-border-stroke: calc(var(--logo-padding-stroke) + 4 * var(--site-border-width))`.
- `stroke-linejoin: round` on both stroke layers.

## Skew + overflow requirements

- Keep `.logo-wordmark` skew active.
- Ensure logo stroke layers use `overflow: visible`.
- Keep logo anchor/container in header with overflow visible so protrusion is not clipped.
