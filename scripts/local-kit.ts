// Local sanity-kit dev support: alias kit entrypoints to the sibling checkout
// and force its shared deps (react, sanity, @sanity/ui, ...) to resolve from
// the consumer app so there is only one instance of each.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const monorepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const localKit = path.resolve(monorepoRoot, "../sanity-kit");
export const useLocalKit = existsSync(path.join(localKit, "src/studio/index.ts"));

function sharedDeps() {
  const pkg = JSON.parse(readFileSync(path.join(localKit, "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
    "styled-components",
  ]);
}

export function localKitPlugin(appRoot: string) {
  if (!useLocalKit) return null;
  const deps = sharedDeps();
  const rootImporter = path.join(appRoot, "package.json");
  return {
    name: "local-sanity-kit-deps",
    enforce: "pre" as const,
    async resolveId(
      this: { resolve: (id: string, importer?: string, opts?: object) => Promise<unknown> },
      source: string,
      importer: string | undefined,
      options: object,
    ) {
      if (!importer) return null;
      const importerPath = importer.startsWith("/@fs") ? importer.slice(4) : importer;
      if (!importerPath.startsWith(localKit)) return null;
      if (source.startsWith(".") || source.startsWith("/")) return null;
      const parts = source.split("/");
      const pkgName = source.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
      if (!deps.has(pkgName)) return null;
      return this.resolve(source, rootImporter, { ...options, skipSelf: true });
    },
  };
}
