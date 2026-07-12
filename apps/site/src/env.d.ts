/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SANITY_API_READ_TOKEN?: string;
  readonly PUBLIC_SANITY_STUDIO_URL?: string;
  readonly ISR_BYPASS_TOKEN?: string;
  readonly REVALIDATE_SECRET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type SanityPerspective = import("@sanity/client").ClientPerspective;

declare namespace App {
  interface Locals {
    draftMode: boolean;
    perspective?: SanityPerspective;
  }
}
