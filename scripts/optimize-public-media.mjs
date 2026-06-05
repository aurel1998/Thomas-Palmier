/**
 * Compresse les images locales (JPG/JPEG → WebP) et supprime les orphelins lourds.
 * Usage : node scripts/optimize-public-media.mjs
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const ORPHAN_VIDEOS = [
  "public/src/video/video2.mp4",
  "public/src/video/video9.mp4",
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function fmtMb(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} Mo`;
}

let saved = 0;

for (const rel of ORPHAN_VIDEOS) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) continue;
  const size = fs.statSync(full).size;
  fs.unlinkSync(full);
  saved += size;
  console.log(`Supprimé (orphelin) : ${rel} (${fmtMb(size)})`);
}

const images = walk(PUBLIC).filter((f) => /\.(jpe?g)$/i.test(f));

for (const src of images) {
  const dest = src.replace(/\.(jpe?g)$/i, ".webp");
  const before = fs.statSync(src).size;
  await sharp(src)
    .rotate()
    .webp({ quality: 82, effort: 4 })
    .toFile(dest);
  const after = fs.statSync(dest).size;
  if (after < before) {
    saved += before - after;
    fs.unlinkSync(src);
    saved += before;
    console.log(`WebP : ${path.relative(ROOT, dest)} (${fmtMb(before)} → ${fmtMb(after)}, JPG supprimé)`);
  } else {
    fs.unlinkSync(dest);
    console.log(`Conservé JPG (déjà optimal) : ${path.relative(ROOT, src)}`);
  }
}

console.log(`\nÉconomie estimée : ${fmtMb(saved)}`);
