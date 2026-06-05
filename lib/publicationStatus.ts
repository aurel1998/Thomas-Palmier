export type PublicationStatus = "draft" | "published";

export const PUBLICATION_STATUSES: PublicationStatus[] = ["draft", "published"];

/** Parse un statut de publication depuis le corps JSON admin. */
export function parsePublicationStatus(
  value: unknown,
  fallback: PublicationStatus = "draft"
): PublicationStatus {
  if (value === "published") return "published";
  if (value === "draft") return "draft";
  return fallback;
}

export function publicationStatusLabel(status: PublicationStatus): string {
  return status === "published" ? "Publié" : "Brouillon";
}
