import { getJournalistProfileServer } from "./editorialServer";

/**
 * Retourne l'URL d'image du profil journaliste (ou null).
 */
export async function getJournalistProfileImageServer(): Promise<string | null> {
  const profile = await getJournalistProfileServer();
  const url = profile.image_url?.trim() ?? "";
  return url || null;
}
