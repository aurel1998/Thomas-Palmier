import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/**
 * Client Supabase cote serveur (API routes).
 *
 * Priorite des cles :
 *  1. SUPABASE_SERVICE_ROLE_KEY  -> bypass RLS (ecriture admin)
 *  2. SUPABASE_ANON_KEY          -> respecte RLS
 *  3. NEXT_PUBLIC_SUPABASE_ANON_KEY (dev)
 *
 * Utilise `getServerSupabaseOrResponse` dans une API route :
 *
 *   const srv = getServerSupabaseOrResponse();
 *   if (!srv.ok) return srv.response;
 *   const { supabase } = srv;
 */
export type ServerSupabaseResult =
  | { ok: true; supabase: SupabaseClient }
  | { ok: false; response: NextResponse };

export function getServerSupabaseOrResponse(): ServerSupabaseResult {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Configuration Supabase manquante. Definis SUPABASE_URL et SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY).",
        },
        { status: 500 }
      ),
    };
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return { ok: true, supabase };
}
