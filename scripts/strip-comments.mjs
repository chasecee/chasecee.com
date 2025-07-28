#!/usr/bin/env node
// Strips all comments from JS/TS sources without touching formatting.
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { globSync } from "glob";
import strip from "strip-comments";

const PATTERNS = ["**/*.js", "**/*.ts", "**/*.jsx", "**/*.tsx"];

function getFiles(dir) {
  return PATTERNS.flatMap((p) =>
    globSync(p, {
      cwd: dir,
      absolute: true,
      nodir: true,
      ignore: "node_modules/**",
    }),
  );
}

async function stripFile(file) {
  const src = await readFile(file, "utf8");
  const cleaned = strip(src, { preserveNewlines: true });
  if (cleaned !== src) {
    await writeFile(file, cleaned, "utf8");
  }
}

async function main() {
  const targetDir = path.resolve(process.argv[2] || ".");
  for (const file of getFiles(targetDir)) {
    await stripFile(file);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
