# Logo Header Layer Contract

This document captures the requested logo/header layering behavior and tuning workflow.

## Visual intent

- The logo stays rotated so it extends past header edges.
- The logo border and header border read as one continuous outline.
- The logo border inner fill creates clear padding between glyphs and stroke.
- Kapow sits behind the combined header/logo border system.

## Required z-stack

Highest to lowest paint order:

1. `logo svg`
2. `logo border inner`
3. `header inner`
4. `logo border`
5. `header border`
6. `kapow`

## Layer placement model

- `header border` and `header inner` remain in `Header.astro`.
- `logo border` and `logo border inner` are rendered via header-level portal roots so they can interleave with `header inner`.
- `logo svg` and `kapow` stay in the logo island.
- Stroke thickness uses `calc(var(--site-border-width) * 2)` so the masked visible half matches the header border weight.

## Rotation + overflow requirements

- Keep `.logo-wordmark` rotation active.
- Ensure logo/sticker layers use `overflow: visible`.
- Keep logo anchor/container in header with overflow visible so protrusion is not clipped.

## Sticker bake tuning knobs

File: `apps/site/scripts/bake-logo-stickers.ts`

- `BRIDGE_RADIUS`: controls cross-letter bridging/blobbing.
- `STICKER_PADDING`: controls apparent border offset from glyphs.
- `CONNECTOR_HEIGHT`: controls connector band thickness.
- Blur/threshold constants in the bridge and padding passes: controls sharpness vs blob.
- Connector horizontal bounds: must stay constrained to glyph span.

After tuning, regenerate:

```bash
bun run logo:bake
```

## Kapow halftone tuning

File: `apps/site/src/components/logo/kapowHalftone.ts`

- `KAPOW_HALFTONE_DOT_RADIUS`
- `KAPOW_HALFTONE_DOT_SPACING`
- `KAPOW_HALFTONE_SHAPE`

Regenerate:

```bash
bun run kapow:halftone
```
