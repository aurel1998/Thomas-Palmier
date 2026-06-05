export type UploadKind = "image" | "audio";

export type UploadResult = { kind: UploadKind; url: string };

/**
 * Upload image ou audio via l'API admin.
 * @param apiFetch fetch authentifié (monsite)
 */
export async function uploadMediaFile(
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>,
  file: File,
  kind: UploadKind
): Promise<UploadResult | null> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await apiFetch(`/api/upload/${kind}`, { method: "POST", body: formData });
  const result = (await response.json()) as {
    data?: { kind?: UploadKind; url?: string };
    error?: string;
  };
  if (!response.ok || !result.data?.url || result.data.kind !== kind) {
    return null;
  }
  return { kind: result.data.kind, url: result.data.url };
}

/** URL audio écoutable (upload local ou lien externe). */
export function isPlayableAudioUrl(url: string): boolean {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith("/uploads/audio/");
}
