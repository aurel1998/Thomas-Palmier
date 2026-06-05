#!/usr/bin/env node
/**
 * Crée .env pour le VPS à partir de .env.production.example.
 * Génère automatiquement JWT_SECRET et CRON_SECRET.
 * Il ne reste que 3 valeurs à personnaliser (DB, admin, boîte mail).
 */
import { randomBytes } from "node:crypto";
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = join(root, ".env.production.example");
const envPath = join(root, ".env");

if (!existsSync(templatePath)) {
  console.error("Erreur : .env.production.example introuvable.");
  process.exit(1);
}

if (existsSync(envPath)) {
  console.log(".env existe déjà — rien n'a été modifié.");
  console.log("Pour repartir de zéro : rm .env && npm run env:init");
  process.exit(0);
}

const jwt = randomBytes(32).toString("base64");
const cron = randomBytes(32).toString("base64");

let content = readFileSync(templatePath, "utf8");
content = content.replace(/CHANGEME_JWT_SECRET/g, jwt);
content = content.replace(/CHANGEME_CRON_SECRET/g, cron);

writeFileSync(envPath, content, { mode: 0o600 });
console.log("");
console.log("✓ Fichier .env créé (secrets JWT + CRON générés automatiquement).");
console.log("");
console.log("À compléter dans .env (3 valeurs) :");
console.log("  1. CHANGEME_MOT_DE_PASSE_DB      → mot de passe PostgreSQL (utilisateur sport)");
console.log("  2. CHANGEME_MOT_DE_PASSE_ADMIN   → mot de passe login /monsite");
console.log("  3. CHANGEME_MOT_DE_PASSE_BOITE_MAIL → mot de passe boîte contact@thomaspalmier.fr");
console.log("");
console.log("Puis : npm run deploy:vps");
console.log("");
