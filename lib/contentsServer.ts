import type { Content } from "../types/content";
import { getServerSupabaseOrResponse } from "./supabaseServer";

const HOME_CONTENTS_COLUMNS =
  "id,title,type,content,image_url,tags,category_id,is_featured,created_at";

/**
 * Homepage uniquement : borne le nombre de lignes pour réduire le temps DB + le HTML RSC
 * (listing, cartes, JSON inline). L’ordre reste `created_at` desc comme l’ancien chargement complet.
 */
export async function getContentsForHomeServer(limit = 120): Promise<Content[]> {
  const srv = getServerSupabaseOrResponse();
  if (!srv.ok) return [];

  try {
    const { data, error } = await srv.supabase
      .from("contents")
      .select(HOME_CONTENTS_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(Math.max(24, Math.min(limit, 200)));
    if (error) return [];
    return (data ?? []) as Content[];
  } catch {
    return [];
  }
}

/**
 * Liste complète (admin, futures pages archive). Préférer `getContentsForHomeServer` sur l’accueil.
 */
export async function getAllContentsServer(): Promise<Content[]> {
  const srv = getServerSupabaseOrResponse();
  if (!srv.ok) return [];

  try {
    const { data, error } = await srv.supabase
      .from("contents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as Content[];
  } catch {
    return [];
  }
}
