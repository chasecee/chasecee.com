# chasecee.com

Personal portfolio site showcasing my best work.

## Stack

Astro + React islands + TypeScript + Bun. Tailwind v4 with custom components and dark mode.

Sanity CMS for content management with Portable Text.

Physics simulation via Rapier2D, WebGL graphics, and Lottie animations.

## Dev

```bash
bun i && bun dev
```

Sanity Studio:

```bash
bun studio:dev
```

Deploy Studio:

```bash
bun studio:deploy
```

## Preview Editing

Required environment variables:

- `SANITY_API_READ_TOKEN` (site deployment; server-side draft reads)
- `SANITY_STUDIO_PREVIEW_URL` (studio deployment; defaults to `https://chasecee.com`)

Preview endpoints:

- `/api/draft-mode/enable`
- `/api/draft-mode/disable`
