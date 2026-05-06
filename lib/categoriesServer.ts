import type { Category } from "../types/category";
import { getServerSupabaseOrResponse } from "./supabaseServer";

/**
 * Lit les categories depuis Supabase cote serveur (RSC).
 * Retourne [] en cas d'erreur pour eviter de casser le rendu.
 */
export async function getAllCategoriesServer(): Promise<Category[]> {
  const srv = getServerSupabaseOrResponse();
  if (!srv.ok) return [];

  try {
    const { data, error } = await srv.supabase
      .from("categories")
      .select("*")
      .order("position", { ascending: true })
      .order("name", { ascending: true });

    if (error) return [];
    return (data ?? []) as Category[];
  } catch {
    return [];
  }
}
