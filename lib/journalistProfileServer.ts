import { getServerSupabaseOrResponse } from "./supabaseServer";

/**
 * Retourne l'URL d'image du profil journaliste (ou null).
 */
export async function getJournalistProfileImageServer(): Promise<string | null> {
  const srv = getServerSupabaseOrResponse();
  if (!srv.ok) return null;

  try {
    const { data, error } = await srv.supabase
      .from("journalist_profile")
      .select("image_url")
      .eq("id", true)
      .maybeSingle();

    if (error) return null;
    const url = typeof data?.image_url === "string" ? data.image_url.trim() : "";
    return url || null;
  } catch {
    return null;
  }
}
