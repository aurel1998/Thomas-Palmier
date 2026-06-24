/**
 * Récupère les métadonnées YouTube via yt-dlp (usage local, fichier gitignored).
 * Usage : node scripts/fetch-youtube-metadata.mjs
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const YT_DLP =
  process.env.YT_DLP ??
  `${process.env.LOCALAPPDATA}/Packages/PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0/LocalCache/local-packages/Python313/Scripts/yt-dlp.exe`;

const CHANNEL_IDS = [
  "prDE5sRbynI", "GF_VZ15fKVc", "2Uk1Pc7i5Nc", "47JRgcpcjfk", "GND19_nc8iA",
  "qOA78KYKguU", "RfZwBnG2DsU", "d6MO7xc59Ek", "N95A1ZQhlug", "c-8cdn3UBGE",
  "7XjlOKqe1AY", "nYDFLLOgfAk", "TyMgZCGUgFY", "JdAcYht-Pww", "lt50J8SgsF4",
  "zfSkNh04HOA", "8ftNXHYu580", "nPNLvcoccK4", "LBgRIgjs6UE", "lC6QPvS9o-I",
  "EOh7VCHa6l0", "H-cGUl-8cP0", "zkJSq8Jl4oM", "KgYmOyg2A1k", "3c7WeIEopmQ",
  "41_80hgr_hA", "XFUDyyewEv0", "_IMXn4CNC9g", "D4AkAjWfyEk", "7xjtoc4vxQw",
];

const results = [];

for (const id of CHANNEL_IDS) {
  try {
    const raw = execFileSync(
      YT_DLP,
      ["--remote-components", "ejs:github", "--skip-download", "--print-json", `https://www.youtube.com/watch?v=${id}`],
      { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
    );
    const meta = JSON.parse(raw.trim());
    results.push({
      id: meta.id,
      title: meta.title,
      description: meta.description ?? "",
      upload_date: meta.upload_date,
    });
    console.log(`[OK] ${id}`);
  } catch (error) {
    console.error(`[FAIL] ${id}:`, error.message?.slice(0, 120));
  }
}

writeFileSync(join(__dirname, ".youtube-metadata.json"), JSON.stringify(results, null, 2), "utf8");
console.log(`\n${results.length}/${CHANNEL_IDS.length} vidéos exportées → scripts/.youtube-metadata.json`);
