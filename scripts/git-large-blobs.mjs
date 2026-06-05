import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const raw = execSync("git rev-list --objects --all", { cwd: root, encoding: "utf8" });
const lines = raw.trim().split("\n").filter(Boolean);

const batch = execSync('git cat-file --batch-check="%(objecttype) %(objectname) %(objectsize) %(rest)"', {
  cwd: root,
  input: lines.join("\n") + "\n",
  encoding: "utf8",
});

const blobs = [];
for (const line of batch.trim().split("\n")) {
  if (!line.startsWith("blob ")) continue;
  const [, , size, ...rest] = line.split(" ");
  const path = rest.join(" ");
  const bytes = Number(size);
  if (bytes > 100_000) blobs.push({ bytes, path });
}

blobs.sort((a, b) => b.bytes - a.bytes);
for (const b of blobs.slice(0, 30)) {
  console.log(`${(b.bytes / 1024 / 1024).toFixed(2)} Mo\t${b.path}`);
}
