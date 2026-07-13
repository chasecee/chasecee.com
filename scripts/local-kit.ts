import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const monorepoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const localKit = path.resolve(monorepoRoot, "../sanity-kit");
const localKitPackageJson = path.join(localKit, "package.json");

function hasValidLocalKit(): boolean {
  if (!existsSync(localKitPackageJson)) return false;
  try {
    const pkg = JSON.parse(readFileSync(localKitPackageJson, "utf8")) as {
      name?: string;
    };
    return pkg.name === "@chasecee/sanity-kit";
  } catch {
    return false;
  }
}

export const useLocalKit = hasValidLocalKit();

function sameTarget(linkPath: string, expectedTarget: string): boolean {
  try {
    return realpathSync(linkPath) === realpathSync(expectedTarget);
  } catch {
    return false;
  }
}

function ensureLink(linkPath: string, targetPath: string): boolean {
  if (sameTarget(linkPath, targetPath)) return false;
  mkdirSync(path.dirname(linkPath), { recursive: true });
  try {
    lstatSync(linkPath);
    rmSync(linkPath, { recursive: true, force: true });
  } catch {
    // no existing path
  }
  symlinkSync(targetPath, linkPath, "dir");
  return true;
}

export function ensureLocalKit(): boolean {
  if (!useLocalKit) return false;
  const targets = [
    path.join(monorepoRoot, "node_modules/@chasecee/sanity-kit"),
    path.join(monorepoRoot, "apps/site/node_modules/@chasecee/sanity-kit"),
    path.join(monorepoRoot, "apps/admin/node_modules/@chasecee/sanity-kit"),
  ];
  let changed = false;
  for (const linkPath of targets) {
    if (ensureLink(linkPath, localKit)) changed = true;
  }
  return changed;
}
