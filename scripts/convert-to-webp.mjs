#!/usr/bin/env bun

import { basename, dirname, extname, join } from "node:path";

const config = {
  quality: 85,
  keepOriginals: false,
  sourceDir: "./apps/site/public",
};

const args = process.argv.slice(2);
if (args.includes("--help")) {
  console.log(`Usage: bun scripts/convert-to-webp.mjs [options]

Options:
  --quality <number>    WebP quality (default: 85)
  --keep-originals      Keep original JPG files
  --dir <path>          Source directory (default: ./apps/site/public)
  --help                Show this help
`);
  process.exit(0);
}

const qualityIdx = args.indexOf("--quality");
if (qualityIdx > -1) {
  config.quality = Number.parseInt(args[qualityIdx + 1], 10) || config.quality;
}

const dirIdx = args.indexOf("--dir");
if (dirIdx > -1) {
  config.sourceDir = args[dirIdx + 1] || config.sourceDir;
}

if (args.includes("--keep-originals")) {
  config.keepOriginals = true;
}

async function findImages(dir) {
  const images = [];
  const glob = new Bun.Glob("**/*.{jpg,jpeg,JPG,JPEG}");
  for await (const path of glob.scan({ cwd: dir, absolute: true })) {
    images.push(path);
  }
  return images;
}

async function convertToWebP(imagePath) {
  const webpPath = join(
    dirname(imagePath),
    `${basename(imagePath, extname(imagePath))}.webp`,
  );
  const original = Bun.file(imagePath);
  const originalSize = original.size;

  try {
    await original.image().webp({ quality: config.quality }).write(webpPath);
    return {
      ok: true,
      original: imagePath,
      converted: webpPath,
      originalSize,
      newSize: Bun.file(webpPath).size,
    };
  } catch (error) {
    return {
      ok: false,
      original: imagePath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

const images = await findImages(config.sourceDir);
if (images.length === 0) {
  console.log("No JPG images found");
  process.exit(0);
}

console.log(`Found ${images.length} images`);
console.log(
  `Quality: ${config.quality}%, keep originals: ${config.keepOriginals}\n`,
);

let totalOriginalSize = 0;
let totalNewSize = 0;
let converted = 0;
let errors = 0;

for (const imagePath of images) {
  const result = await convertToWebP(imagePath);
  if (!result.ok) {
    errors++;
    console.log(`Failed: ${result.original} - ${result.error}`);
    continue;
  }

  converted++;
  totalOriginalSize += result.originalSize;
  totalNewSize += result.newSize;
  const savings = (
    ((result.originalSize - result.newSize) / result.originalSize) *
    100
  ).toFixed(1);
  console.log(`${result.original} -> ${result.converted} (${savings}% smaller)`);

  if (!config.keepOriginals) {
    await Bun.file(result.original).unlink();
    console.log(`Removed ${result.original}`);
  }
}

const totalSavings =
  totalOriginalSize > 0
    ? (((totalOriginalSize - totalNewSize) / totalOriginalSize) * 100).toFixed(1)
    : "0.0";

console.log(`\nConverted: ${converted}/${images.length}`);
console.log(`Errors: ${errors}`);
console.log(
  `Size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB -> ${(totalNewSize / 1024 / 1024).toFixed(2)}MB (${totalSavings}% reduction)`,
);
