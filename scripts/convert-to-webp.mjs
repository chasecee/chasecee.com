#!/usr/bin/env node

import { readdir, stat } from "fs/promises";
import { join, extname, basename } from "path";
import sharp from "sharp";

const CONFIG = {
  quality: 85,
  keepOriginals: false,
  sourceDir: "./public",
  recursive: true,
  extensions: [".jpg", ".jpeg", ".JPG", ".JPEG"],
};

async function findImages(dir) {
  const images = [];
  const items = await readdir(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stats = await stat(fullPath);

    if (stats.isDirectory() && CONFIG.recursive) {
      const subImages = await findImages(fullPath);
      images.push(...subImages);
    } else if (stats.isFile() && CONFIG.extensions.includes(extname(item))) {
      images.push(fullPath);
    }
  }

  return images;
}

async function convertToWebP(imagePath) {
  const dir = imagePath.substring(0, imagePath.lastIndexOf("/"));
  const name = basename(imagePath, extname(imagePath));
  const webpPath = join(dir, `${name}.webp`);

  try {
    const info = await sharp(imagePath)
      .webp({ quality: CONFIG.quality })
      .toFile(webpPath);

    return {
      success: true,
      original: imagePath,
      converted: webpPath,
      originalSize: (await stat(imagePath)).size,
      newSize: info.size,
    };
  } catch (error) {
    return {
      success: false,
      original: imagePath,
      error: error.message,
    };
  }
}

async function main() {
  console.log("🔍 Finding JPG images...");

  try {
    const images = await findImages(CONFIG.sourceDir);

    if (images.length === 0) {
      console.log("❌ No JPG images found");
      return;
    }

    console.log(`📸 Found ${images.length} images to convert`);
    console.log(
      `⚙️  Quality: ${CONFIG.quality}%, Keep originals: ${CONFIG.keepOriginals}\n`,
    );

    let totalOriginalSize = 0;
    let totalNewSize = 0;
    let converted = 0;
    let errors = 0;

    for (const imagePath of images) {
      const result = await convertToWebP(imagePath);

      if (result.success) {
        converted++;
        totalOriginalSize += result.originalSize;
        totalNewSize += result.newSize;

        const savings = (
          ((result.originalSize - result.newSize) / result.originalSize) *
          100
        ).toFixed(1);
        console.log(
          `✅ ${result.original} → ${result.converted} (${savings}% smaller)`,
        );

        if (!CONFIG.keepOriginals) {
          const { unlink } = await import("fs/promises");
          await unlink(result.original);
          console.log(`🗑️  Removed ${result.original}`);
        }
      } else {
        errors++;
        console.log(`❌ Failed: ${result.original} - ${result.error}`);
      }
    }

    const totalSavings = (
      ((totalOriginalSize - totalNewSize) / totalOriginalSize) *
      100
    ).toFixed(1);
    const sizeBefore = (totalOriginalSize / 1024 / 1024).toFixed(2);
    const sizeAfter = (totalNewSize / 1024 / 1024).toFixed(2);

    console.log(`\n📊 Summary:`);
    console.log(`   Converted: ${converted}/${images.length}`);
    console.log(`   Errors: ${errors}`);
    console.log(
      `   Size: ${sizeBefore}MB → ${sizeAfter}MB (${totalSavings}% reduction)`,
    );
  } catch (error) {
    console.error("💥 Script failed:", error.message);
    process.exit(1);
  }
}

if (process.argv.includes("--help")) {
  console.log(`
Usage: node scripts/convert-to-webp.js [options]

Options:
  --quality <number>    WebP quality (default: 85)
  --keep-originals      Keep original JPG files
  --dir <path>          Source directory (default: ./public)
  --help                Show this help

Examples:
  node scripts/convert-to-webp.js
  node scripts/convert-to-webp.js --quality 90 --keep-originals
  node scripts/convert-to-webp.js --dir ./assets
`);
  process.exit(0);
}

const qualityArg = process.argv.indexOf("--quality");
if (qualityArg > -1) {
  CONFIG.quality = parseInt(process.argv[qualityArg + 1]) || CONFIG.quality;
}

const dirArg = process.argv.indexOf("--dir");
if (dirArg > -1) {
  CONFIG.sourceDir = process.argv[dirArg + 1] || CONFIG.sourceDir;
}

if (process.argv.includes("--keep-originals")) {
  CONFIG.keepOriginals = true;
}

main();
