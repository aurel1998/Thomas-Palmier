#!/usr/bin/env node
/**
 * Vérifications post-déploiement (à lancer sur le VPS).
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

function loadEnv() {
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();

const localBase = "http://127.0.0.1:3000";
const publicBase = (process.env.NEXT_PUBLIC_APP_URL || localBase).replace(/\/$/, "");
const bases = [...new Set([localBase, publicBase])];
const checks = [];

function ok(label) {
  checks.push({ label, status: "ok" });
  console.log(`  ✓ ${label}`);
}

function fail(label, detail = "") {
  checks.push({ label, status: "fail", detail });
  console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
}

console.log("\n==> Vérification post-déploiement\n");

if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  if (/CHANGEME/.test(raw)) fail(".env complet (plus de CHANGEME)");
  else ok(".env complet");
} else {
  fail(".env présent");
}

const jwt = (process.env.JWT_SECRET || "").trim();
if (jwt.length >= 32 && !/change-me|CHANGEME/i.test(jwt)) ok("JWT_SECRET fort");
else fail("JWT_SECRET fort");

const cron = (process.env.CRON_SECRET || "").trim();
if (cron.length >= 24 && !/CHANGEME/i.test(cron)) ok("CRON_SECRET configuré");
else fail("CRON_SECRET configuré");

let siteOk = false;
for (const base of bases) {
  try {
    const res = await fetch(`${base}/`, { redirect: "follow" });
    if (res.ok) {
      ok(`Site accessible (${base})`);
      siteOk = true;
      try {
        const loginRes = await fetch(`${base}/login`, { redirect: "manual" });
        if (loginRes.status >= 200 && loginRes.status < 400) ok("Page /login");
        else fail("Page /login", `HTTP ${loginRes.status}`);
      } catch (error) {
        fail("Page /login", error instanceof Error ? error.message : String(error));
      }
      break;
    }
  } catch {
    /* essaie l'URL suivante */
  }
}
if (!siteOk) {
  fail(`Site accessible (${bases.join(" ou ")})`, "vérifie pm2 logs sport-journal");
}

const smtpOk =
  Boolean(process.env.EMAIL_USER?.trim()) &&
  Boolean(process.env.EMAIL_PASS?.trim()) &&
  !/CHANGEME/i.test(process.env.EMAIL_PASS || "");
if (smtpOk) ok("SMTP configuré (EMAIL_USER / EMAIL_PASS)");
else fail("SMTP configuré");

const failed = checks.filter((c) => c.status === "fail").length;
console.log("");
if (failed === 0) {
  console.log("✓ Tout est prêt. Connecte-toi : " + publicBase + "/login");
} else {
  console.log(`⚠ ${failed} point(s) à corriger. Voir HOSTING.md / IONOS_QUICKSTART.md`);
  process.exit(1);
}
console.log("");
