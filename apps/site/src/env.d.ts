/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type SanityPerspective = import("@sanity/client").ClientPerspective;

declare namespace App {
  interface Locals {
    draftMode: boolean;
    perspective?: SanityPerspective;
  }
}
