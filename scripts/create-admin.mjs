#!/usr/bin/env node
/**
 * Cree (ou met a jour) un utilisateur admin Supabase.
 *
 * Utilise l'API admin de Supabase (service role).
 * Variables requises (via .env.local ou environnement) :
 *   - SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - ADMIN_EMAIL    (optionnel, defaut: thomas@site.com)
 *   - ADMIN_PASSWORD (optionnel, sinon genere aleatoirement)
 *
 * Lancement : npm run create-admin
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Charge .env.local si present (Node n'expose pas nativement process.env depuis .env)
function loadDotEnv() {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    try {
      const full = resolve(process.cwd(), file);
      const raw = readFileSync(full, "utf8");
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!(key in process.env)) process.env[key] = value;
      }
    } catch {
      // fichier absent, on ignore
    }
  }
}

function generatePassword() {
  // 18 octets aleatoires -> base64url sans caracteres ambigus
  return randomBytes(18).toString("base64").replace(/[+/=]/g, "").slice(0, 20) + "!2";
}

async function main() {
  loadDotEnv();

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[create-admin] Variables manquantes : SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requises.");
    console.error("             Renseigne-les dans .env.local (voir .env.example).");
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL || "thomas@site.com").trim();
  const password = (process.env.ADMIN_PASSWORD || "").trim() || generatePassword();
  const generated = !process.env.ADMIN_PASSWORD;

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Cherche si l'utilisateur existe deja (pagination simple sur 1 page de 1000)
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) {
    console.error("[create-admin] Echec listUsers :", listErr.message);
    process.exit(1);
  }

  const existing = list.users.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, role: "admin" },
    });
    if (error) {
      console.error("[create-admin] Echec updateUserById :", error.message);
      process.exit(1);
    }
    console.log(`[create-admin] Utilisateur existant mis a jour : ${email}`);
  } else {
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });
    if (error) {
      console.error("[create-admin] Echec createUser :", error.message);
      process.exit(1);
    }
    console.log(`[create-admin] Utilisateur admin cree : ${email}`);
  }

  console.log("");
  console.log("  Email    :", email);
  console.log("  Password :", password);
  if (generated) {
    console.log("");
    console.log("  Mot de passe genere automatiquement. Copie-le maintenant :");
    console.log("  il ne sera plus affiche.");
  }
  console.log("");
  console.log("Connexion : http://localhost:3000/login");
  console.log("Espace   : http://localhost:3000/monsite");
}

main().catch((err) => {
  console.error("[create-admin] Erreur inattendue :", err);
  process.exit(1);
});
