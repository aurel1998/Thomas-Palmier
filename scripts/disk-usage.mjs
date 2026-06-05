import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");

function dirSize(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) total += dirSize(full);
    else total += fs.statSync(full).size;
  }
  return total;
}

function mb(n) {
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

const rows = [
  ["node_modules", dirSize(path.join(ROOT, "node_modules"))],
  ["public", dirSize(path.join(ROOT, "public"))],
  [".next (cache build)", dirSize(path.join(ROOT, ".next"))],
];

const total = rows.reduce((s, [, v]) => s + v, 0);

console.log("Poids local du projet :\n");
for (const [name, bytes] of rows) {
  console.log(`  ${name.padEnd(22)} ${mb(bytes)}`);
}
console.log(`  ${"TOTAL (approx.)".padEnd(22)} ${mb(total)}`);
console.log("\nNote : node_modules et .next ne partent pas en production (git ignore .next).");
console.log("Pour alléger : npm run clean && npm run optimize:media");
