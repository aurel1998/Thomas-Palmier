import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type UploadKind = "image" | "audio";

export type LocalUploadResult = {
  kind: UploadKind;
  /** Chemin relatif sous /uploads (ex. images/1234-abc.jpg) */
  path: string;
  /** Chemin public relatif (ex. /uploads/images/1234-abc.jpg) */
  url: string;
  /** URL absolue si NEXTAUTH_URL ou NEXT_PUBLIC_APP_URL est défini */
  publicUrl: string;
};

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_AUDIO_BYTES = 60 * 1024 * 1024;

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"]);
const AUDIO_EXT = new Set(["mp3", "wav", "ogg", "m4a", "aac", "webm"]);

/** Largeur max conservee pour les images uploadees (suffisante pour le rendu desktop). */
const MAX_IMAGE_WIDTH = 1920;
/** Qualite WebP a l'enregistrement (bon compromis poids/qualite). */
const WEBP_QUALITY = 82;

type OptimizedImage = { buffer: Buffer<ArrayBufferLike>; ext: string };

/**
 * Optimise une image : redimensionne (max 1920px de large, sans agrandir),
 * convertit en WebP et supprime les metadonnees. Les GIF (potentiellement
 * animes) sont conserves tels quels. En cas d'echec, renvoie l'original.
 */
async function optimizeImageBuffer(input: Buffer, sourceExt: string): Promise<OptimizedImage> {
  if (sourceExt === "gif") {
    return { buffer: input, ext: "gif" };
  }
  try {
    const { default: sharp } = await import("sharp");
    const output = await sharp(input)
      .rotate()
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { buffer: output, ext: "webp" };
  } catch (error) {
    console.error("[upload] optimisation image ignoree:", (error as Error).message);
    return { buffer: input, ext: sourceExt };
  }
}

/** Crée public/uploads/images et public/uploads/audio si besoin. */
export async function ensureUploadDirectories(): Promise<void> {
  await mkdir(path.join(UPLOAD_ROOT, "images"), { recursive: true });
  await mkdir(path.join(UPLOAD_ROOT, "audio"), { recursive: true });
}

/** URL absolue pour un fichier sous /uploads (prod VPS). */
export function toPublicUploadUrl(relativePath: string): string {
  const pathPart = `/uploads/${relativePath.replace(/^\/+/, "")}`;
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    process.env.NEXTAUTH_URL?.replace(/\/$/, "");
  return base ? `${base}${pathPart}` : pathPart;
}

export function detectUploadKind(mimeType: string): UploadKind | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}

function safeExtension(fileName: string, kind: UploadKind): string {
  const raw = fileName.includes(".") ? fileName.split(".").pop() : undefined;
  const ext = raw ? raw.toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  if (ext && (kind === "image" ? IMAGE_EXT : AUDIO_EXT).has(ext)) return ext;
  return kind === "image" ? "jpg" : "mp3";
}

function uniqueFileName(ext: string): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
}

/**
 * Enregistre un fichier image ou audio et retourne son URL publique.
 *
 * @param file fichier reçu (FormData)
 * @param expectedKind si fourni, rejette un fichier dont le type ne correspond pas
 */
export async function saveLocalUpload(
  file: File,
  expectedKind?: UploadKind
): Promise<LocalUploadResult> {
  if (file.size === 0) {
    throw new Error("FILE_EMPTY");
  }

  const kind = detectUploadKind(file.type);
  if (!kind) {
    throw new Error("TYPE_UNSUPPORTED");
  }
  if (expectedKind && kind !== expectedKind) {
    throw new Error("TYPE_MISMATCH");
  }

  const limit = kind === "image" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
  if (file.size > limit) {
    throw new Error("FILE_TOO_LARGE");
  }

  await ensureUploadDirectories();

  const folder = kind === "image" ? "images" : "audio";
  let ext = safeExtension(file.name, kind);
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());

  // Optimisation a la source pour les images (poids reduit + moins de CPU au runtime VPS).
  if (kind === "image") {
    const optimized = await optimizeImageBuffer(buffer, ext);
    buffer = optimized.buffer;
    ext = optimized.ext;
  }

  const fileName = uniqueFileName(ext);
  const relativePath = `${folder}/${fileName}`;
  const diskPath = path.join(UPLOAD_ROOT, folder, fileName);

  await writeFile(diskPath, buffer);

  return {
    kind,
    path: relativePath,
    url: `/uploads/${relativePath}`,
    publicUrl: toPublicUploadUrl(relativePath),
  };
}

export function uploadErrorMessage(code: string, kind?: UploadKind): string {
  switch (code) {
    case "FILE_EMPTY":
      return "Le fichier est vide.";
    case "TYPE_UNSUPPORTED":
      return "Type de fichier non supporte. Utilise une image ou un audio.";
    case "TYPE_MISMATCH":
      return kind === "image"
        ? "Le fichier doit etre une image."
        : kind === "audio"
          ? "Le fichier doit etre un audio."
          : "Type de fichier inattendu.";
    case "FILE_TOO_LARGE": {
      const mb = kind === "image" ? MAX_IMAGE_BYTES / (1024 * 1024) : MAX_AUDIO_BYTES / (1024 * 1024);
      return `Fichier trop lourd (max ${Math.round(mb)} Mo).`;
    }
    default:
      return "Upload impossible.";
  }
}

/** Codes d'erreur d'upload mappés vers un statut HTTP (400 par défaut). */
export const UPLOAD_ERROR_CODES = new Set([
  "FILE_EMPTY",
  "TYPE_UNSUPPORTED",
  "TYPE_MISMATCH",
  "FILE_TOO_LARGE",
]);
