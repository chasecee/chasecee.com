# Music Platform Audit (Phase 1)

This folder is the phase-1 audit output for Sanity music docs in `lgevplo8/production`.

## Outputs

- `sanity-snapshot.json`: live Sanity export of `music` docs and current fields.
- `platform-catalog.json`: per-release proposed `links` and `embeds` for phase-2 Sanity writes.

## Coverage Matrix

| Band | Album | Spotify | Apple Music | YouTube | Notes |
|---|---|---|---|---|---|
| Phantom Drum | INITIALIZE | found | found | no confident match | ready |
| Rumble Gums | Metro Party Life | found | found | no confident match | convert existing generic Spotify embed to typed `spotify` |
| Honey Dew | Can't Elope | found | found | no confident match | ready |
| Rumble Gums | Pool Party Palace | found | found | no confident match | ready |
| Pandahead | Everybody | found | found | no confident match | ready |

Spotify + Apple Music are complete for all 5 releases. Players render as minimal Spotify / Apple Music tabs (inactive iframe unmounted; Apple forced `theme=dark`). YouTube has no confident full-album embeds.

## Script

- Runner: `scripts/music-audit.ts`
- Command: `bun scripts/music-audit.ts`
- Behavior:
  - fetches Sanity snapshot
  - queries Apple (iTunes Search)
  - queries Spotify (open.spotify.com search via mirrored text + oEmbed validation)
  - queries YouTube via Invidious search and only accepts high-confidence full-album matches
  - writes both JSON artifacts

Manual fills after the automated pass:

- Pool Party Palace Spotify (`6olrzFKie6TRPkLGgyXBww`) and Pandahead Everybody Spotify (`4wvTC13RXjdCUvkowQasg3`) from provided embeds
- Rumble Gums Apple Music albums via artist lookup (`1176821151`) because iTunes search misses them

## Runtime Safeguards

- per-request timeout is enforced (`REQUEST_TIMEOUT_MS = 7000`)
- capped external probes:
  - Spotify candidates per release: `MAX_SPOTIFY_CANDIDATES = 6`
  - Invidious instance probes: `MAX_INVIDIOUS_PROBES = 4`
- verbose logs print each network request, request duration, candidate scoring, and per-release completion.

## Phase-2 Apply (draft-safe)

Script: `scripts/music-apply.ts`

```bash
# dry-run all (default, no writes)
bun music:apply

# dry-run one release
bun music:apply --only=phantom-drum-initialize

# write drafts only (needs SANITY_API_WRITE_TOKEN)
bun music:apply --draft --only=phantom-drum-initialize --apply
```

- Default is dry-run: prints planned `links` / `embeds` patches.
- `--apply` requires `--draft` (refuses published writes).
- Draft writes use `createOrReplace` on `drafts.{id}`; published docs stay unchanged until you publish in Studio.

## Phase-2 Mapping Notes

- For each release, use `proposed.links` and `proposed.embeds` from `platform-catalog.json`.
- Convert `Metro Party Life` existing Spotify embed from generic `embed` to typed `spotify`.
- Skip YouTube until a real full-album/official upload exists.
- Existing schema is sufficient:
  - Spotify uses `_type: "spotify"`.
  - Apple embeds use `_type: "embed"`.
  - Outbound store/listen URLs use `links[]`.
