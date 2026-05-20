import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const sourcePath = path.join(rootDir, "assets/logo/logo.png");
const outputPath = path.join(rootDir, "assets/logo/logo.webp");
const size = 256;

async function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const sourceStats = await stat(sourcePath);
  const image = sharp(sourcePath).resize(size, size, {
    fit: "inside",
    withoutEnlargement: true,
  });

  await image.webp({ quality: 82 }).toFile(outputPath);

  const outputStats = await stat(outputPath);
  const meta = await sharp(outputPath).metadata();

  console.log(`Source: ${sourcePath} (${await formatKb(sourceStats.size)})`);
  console.log(
    `Output: ${outputPath} (${await formatKb(outputStats.size)}, ${meta.width}x${meta.height})`,
  );
}

main().catch((error) => {
  console.error("optimize-logo failed:", error);
  process.exit(1);
});
