/**
 * Génère scripts/youtube-catalog.data.json à partir de .youtube-metadata.json
 * Usage : node scripts/build-youtube-catalog-data.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const RUBRIQUE_SLUG = {
  reactions: "d0000001-0001-4001-8001-000000000001",
  reportages: "d0000001-0001-4001-8001-000000000002",
  entretiens: "d0000001-0001-4001-8001-000000000003",
  resumes: "d0000001-0001-4001-8001-000000000004",
};

/** Ordre chaîne YouTube (plus récent en premier) → UUIDs déterministes. */
const CHANNEL_ORDER = [
  "prDE5sRbynI", "GF_VZ15fKVc", "2Uk1Pc7i5Nc", "47JRgcpcjfk", "GND19_nc8iA",
  "qOA78KYKguU", "RfZwBnG2DsU", "d6MO7xc59Ek", "N95A1ZQhlug", "c-8cdn3UBGE",
  "7XjlOKqe1AY", "nYDFLLOgfAk", "TyMgZCGUgFY", "JdAcYht-Pww", "lt50J8SgsF4",
  "zfSkNh04HOA", "8ftNXHYu580", "nPNLvcoccK4", "LBgRIgjs6UE", "lC6QPvS9o-I",
  "EOh7VCHa6l0", "H-cGUl-8cP0", "zkJSq8Jl4oM", "KgYmOyg2A1k", "3c7WeIEopmQ",
  "41_80hgr_hA", "XFUDyyewEv0", "_IMXn4CNC9g", "D4AkAjWfyEk", "7xjtoc4vxQw",
];

const CLASSIFY = {
  prDE5sRbynI: "reactions",
  GF_VZ15fKVc: "reactions",
  "2Uk1Pc7i5Nc": "reactions",
  "47JRgcpcjfk": "entretiens",
  GND19_nc8iA: "entretiens",
  qOA78KYKguU: "entretiens",
  RfZwBnG2DsU: "entretiens",
  d6MO7xc59Ek: "entretiens",
  N95A1ZQhlug: "resumes",
  "c-8cdn3UBGE": "reportages",
  "7XjlOKqe1AY": "resumes",
  nYDFLLOgfAk: "entretiens",
  TyMgZCGUgFY: "entretiens",
  "JdAcYht-Pww": "entretiens",
  lt50J8SgsF4: "entretiens",
  zfSkNh04HOA: "entretiens",
  "8ftNXHYu580": "entretiens",
  nPNLvcoccK4: "entretiens",
  LBgRIgjs6UE: "entretiens",
  "lC6QPvS9o-I": "entretiens",
  EOh7VCHa6l0: "entretiens",
  "H-cGUl-8cP0": "entretiens",
  zkJSq8Jl4oM: "entretiens",
  KgYmOyg2A1k: "reportages",
  "3c7WeIEopmQ": "reportages",
  "41_80hgr_hA": "entretiens",
  XFUDyyewEv0: "entretiens",
  _IMXn4CNC9g: "entretiens",
  D4AkAjWfyEk: "entretiens",
  "7xjtoc4vxQw": "entretiens",
};

const FEATURED_YOUTUBE_ID = "prDE5sRbynI";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function formatFrenchDate(uploadDate) {
  const y = uploadDate.slice(0, 4);
  const m = Number(uploadDate.slice(4, 6)) - 1;
  const d = Number(uploadDate.slice(6, 8));
  return `${d} ${MONTHS[m]} ${y}`;
}

function toIsoDate(uploadDate) {
  return `${uploadDate.slice(0, 4)}-${uploadDate.slice(4, 6)}-${uploadDate.slice(6, 8)}T12:00:00.000Z`;
}

function contentId(index) {
  const n = String(index + 1).padStart(6, "0");
  return `e0000001-0001-4001-8001-${n}`;
}

function trimBody(description, maxLen = 900) {
  const text = (description ?? "").trim();
  if (!text) return "";
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastBreak = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". "));
  return (lastBreak > 200 ? cut.slice(0, lastBreak + 1) : cut).trim() + "…";
}

function inferTags(title, description, rubrique) {
  const hay = `${title} ${description}`.toLowerCase();
  const candidates = [
    ["Handball", /handball|starligue|prod2|chambéry|psg hand/i],
    ["Athlétisme", /meeting|liévin|perche|3000m|steeple|all star perche|perche en or/i],
    ["Basket", /basket/i],
    ["Cyclisme", /cycl|critérium|tour de france|guidon/i],
    ["Football", /foot|ligue 1|cf63|tfc|clermont foot/i],
    ["Volleyball", /volley/i],
    ["Triathlon", /ironman/i],
    ["Interview", /entretien|interview|évoque|confié/i],
    ["Résumé", rubrique === "resumes"],
    ["Reportage", rubrique === "reportages"],
    ["JO Paris 2024", /jo|jeux olympiques|paris 2024/i],
    ["Journalisme", /journaliste|thierry adam/i],
  ];
  const tags = candidates
    .filter(([tag, rule]) => {
      if (typeof rule === "boolean") return rule;
      return rule.test(hay);
    })
    .map(([tag]) => tag);
  return [...new Set(tags)].slice(0, 6);
}

function inferLede(title, uploadDate, rubrique) {
  const date = formatFrenchDate(uploadDate);
  if (rubrique === "reactions") return `${date} · Réaction d'après-match`;
  if (rubrique === "resumes") return `${date} · Résumé commenté`;
  if (rubrique === "reportages") return `${date} · Reportage TV`;
  if (/meeting liévin/i.test(title)) return `${date} · Meeting de Liévin`;
  if (/all star perche|perche en or/i.test(title)) return `${date} · Saut à la perche`;
  if (/entretien/i.test(title)) return `${date} · Entretien`;
  return `${date} · Interview`;
}

const metadata = JSON.parse(
  readFileSync(join(__dirname, ".youtube-metadata.json"), "utf8"),
);
const byId = new Map(metadata.map((v) => [v.id, v]));

const videos = CHANNEL_ORDER.map((youtubeId, index) => {
  const meta = byId.get(youtubeId);
  if (!meta) throw new Error(`Métadonnées manquantes pour ${youtubeId}`);
  const rubrique = CLASSIFY[youtubeId];
  if (!rubrique) throw new Error(`Classification manquante pour ${youtubeId}`);

  return {
    id: contentId(index),
    subcategoryId: RUBRIQUE_SLUG[rubrique],
    youtubeId,
    title: meta.title,
    lede: inferLede(meta.title, meta.upload_date, rubrique),
    body: trimBody(meta.description),
    tags: inferTags(meta.title, meta.description, rubrique),
    publishedAt: toIsoDate(meta.upload_date),
    isFeatured: youtubeId === FEATURED_YOUTUBE_ID,
  };
});

writeFileSync(
  join(__dirname, "youtube-catalog.data.json"),
  JSON.stringify({ videos }, null, 2) + "\n",
  "utf8",
);

console.log(`[OK] ${videos.length} entrées → scripts/youtube-catalog.data.json`);
