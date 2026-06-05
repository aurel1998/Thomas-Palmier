import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

/**
 * Type MIME a partir de l'extension. Couvre les formats autorises a l'upload.
 */
const MIME_TYPES: Record<string, string> = {
  // images
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  // audio
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  aac: "audio/aac",
  webm: "audio/webm",
};

/**
 * GET /uploads/* — filet de securite pour servir les medias uploades.
 *
 * En production classique (`next start`), Next sert deja les fichiers presents
 * dans `public/uploads`. Cette route prend le relais pour les fichiers ajoutes
 * au runtime non couverts par le service statique (selon l'hebergement VPS).
 *
 * Securite : verrouille strictement sous public/uploads (anti path-traversal).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  if (!segments || segments.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const relative = segments.join("/");
  const resolved = path.resolve(UPLOAD_ROOT, relative);

  // Empeche toute sortie du dossier uploads (../ etc.).
  if (resolved !== UPLOAD_ROOT && !resolved.startsWith(UPLOAD_ROOT + path.sep)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const info = await stat(resolved);
    if (!info.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }

    const ext = resolved.split(".").pop()?.toLowerCase() ?? "";
    const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
    const file = await readFile(resolved);

    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(info.size),
        // Noms uniques => contenu immuable : cache navigateur/CDN long.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
