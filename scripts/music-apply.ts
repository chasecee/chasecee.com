import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

type CatalogEntry = {
  sanityId: string;
  slug: string;
  bandName: string;
  albumName: string;
  proposed: {
    links: Array<{ label: string; url: string }>;
    embeds: Array<Record<string, unknown>>;
  };
};

type Flags = {
  apply: boolean;
  draft: boolean;
  only: string | null;
};

const PROJECT_ID = "lgevplo8";
const DATASET = "production";
const API_VERSION = "2023-07-12";
const CATALOG_PATH = resolve(
  import.meta.dir,
  "../docs/music-audit/platform-catalog.json",
);
const API_BASE = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data`;

function log(message: string): void {
  console.log(`[music-apply] ${message}`);
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { apply: false, draft: false, only: null };
  for (const arg of argv) {
    if (arg === "--apply") flags.apply = true;
    else if (arg === "--draft") flags.draft = true;
    else if (arg.startsWith("--only=")) flags.only = arg.slice("--only=".length);
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown flag: ${arg}`);
    }
  }
  return flags;
}

function printHelp(): void {
  console.log(`Usage: bun scripts/music-apply.ts [flags]

Defaults to dry-run (prints patches, writes nothing).

Flags:
  --draft          Write drafts.{id} only (published stays unchanged)
  --apply          Actually mutate (requires --draft and SANITY_API_WRITE_TOKEN)
  --only=<slug>    Limit to one release slug
  --help           Show this help

Examples:
  bun scripts/music-apply.ts
  bun scripts/music-apply.ts --only=phantom-drum-initialize
  bun scripts/music-apply.ts --draft --only=phantom-drum-initialize --apply
`);
}

function key(): string {
  return randomBytes(6).toString("hex");
}

function withKeys(
  links: CatalogEntry["proposed"]["links"],
  embeds: CatalogEntry["proposed"]["embeds"],
) {
  return {
    links: links.map((link) => ({ _key: key(), ...link })),
    embeds: embeds.map((embed) => ({ _key: key(), ...embed })),
  };
}

function loadEnvToken(): string | null {
  return (
    process.env.SANITY_API_WRITE_TOKEN?.trim() ||
    process.env.SANITY_WRITE_TOKEN?.trim() ||
    null
  );
}

async function loadCatalog(only: string | null): Promise<CatalogEntry[]> {
  const raw = await readFile(CATALOG_PATH, "utf8");
  const catalog = JSON.parse(raw) as CatalogEntry[];
  if (!only) return catalog;
  const filtered = catalog.filter((entry) => entry.slug === only);
  if (filtered.length === 0) {
    const slugs = catalog.map((entry) => entry.slug).join(", ");
    throw new Error(`No catalog entry for --only=${only}. Available: ${slugs}`);
  }
  return filtered;
}

async function sanityFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json()) as T & { error?: unknown; message?: string };
  if (!res.ok) {
    throw new Error(
      `Sanity ${res.status}: ${JSON.stringify(body.error ?? body.message ?? body)}`,
    );
  }
  return body;
}

async function getPublishedDoc(
  token: string,
  id: string,
): Promise<Record<string, unknown>> {
  const query = encodeURIComponent(`*[_id == $id][0]`);
  const idParam = encodeURIComponent(JSON.stringify(id));
  const data = await sanityFetch<{ result: Record<string, unknown> | null }>(
    `/query/${DATASET}?query=${query}&$id=${idParam}`,
    token,
  );
  if (!data.result) throw new Error(`Published doc not found: ${id}`);
  return data.result;
}

async function createOrReplaceDraft(
  token: string,
  doc: Record<string, unknown>,
): Promise<void> {
  await sanityFetch(`/mutate/${DATASET}?returnIds=true`, token, {
    method: "POST",
    body: JSON.stringify({
      mutations: [{ createOrReplace: doc }],
    }),
  });
}

async function run() {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.apply && !flags.draft) {
    throw new Error(
      "Refusing to write published docs. Pass --draft with --apply.",
    );
  }

  const catalog = await loadCatalog(flags.only);
  const mutations = catalog.map((entry) => {
    const fields = withKeys(entry.proposed.links, entry.proposed.embeds);
    const targetId = flags.draft ? `drafts.${entry.sanityId}` : entry.sanityId;
    return {
      slug: entry.slug,
      bandName: entry.bandName,
      albumName: entry.albumName,
      publishedId: entry.sanityId,
      targetId,
      set: fields,
    };
  });

  log(
    flags.apply
      ? `APPLY mode (${flags.draft ? "drafts only" : "published"})`
      : "DRY-RUN mode (no writes)",
  );
  log(`Planning ${mutations.length} mutation(s)`);
  console.log(JSON.stringify(mutations, null, 2));

  if (!flags.apply) {
    log("Dry-run complete. Re-run with --draft --apply to write drafts.");
    return;
  }

  const token = loadEnvToken();
  if (!token) {
    throw new Error(
      "Missing SANITY_API_WRITE_TOKEN (or SANITY_WRITE_TOKEN) in env.",
    );
  }

  for (const mutation of mutations) {
    log(`Fetching published ${mutation.publishedId}`);
    const published = await getPublishedDoc(token, mutation.publishedId);
    const draftDoc = {
      ...published,
      _id: mutation.targetId,
      links: mutation.set.links,
      embeds: mutation.set.embeds,
    };
    delete (draftDoc as { _rev?: string })._rev;

    log(`Writing draft ${mutation.targetId} (${mutation.slug})`);
    await createOrReplaceDraft(token, draftDoc);
    log(`Wrote draft ${mutation.targetId}`);
  }

  log(
    "Done. Preview drafts in Studio or draft mode; publish manually when ready.",
  );
}

await run();
