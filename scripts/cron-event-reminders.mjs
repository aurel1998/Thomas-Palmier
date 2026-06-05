#!/usr/bin/env node
/**
 * Déclenche les rappels agenda (24 h avant) via l'API Next.js.
 * Usage VPS IONOS (crontab horaire) :
 *   0 * * * * cd /var/www/sport-journal && /usr/bin/node scripts/cron-event-reminders.mjs >> /var/log/sport-journal-cron.log 2>&1
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
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

loadEnvFile(envPath);

const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET?.trim();

if (!secret) {
  console.error("[cron-event-reminders] CRON_SECRET manquant dans .env");
  process.exit(1);
}

const url = `${baseUrl}/api/cron/event-reminders`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    Accept: "application/json",
  },
});

const body = await response.text();
const stamp = new Date().toISOString();

if (!response.ok) {
  console.error(`[${stamp}] HTTP ${response.status} — ${body}`);
  process.exit(1);
}

console.log(`[${stamp}] OK — ${body}`);
