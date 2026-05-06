import { NextResponse } from "next/server";
import { getServerSupabaseOrResponse } from "../../../lib/supabaseServer";
import { requireAdmin } from "../../../lib/apiAuth";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 Mo
const MAX_AUDIO_BYTES = 60 * 1024 * 1024; // 60 Mo

type UploadKind = "image" | "audio";

function detectKind(mimeType: string): UploadKind | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Champ 'file' manquant ou invalide." }, { status: 400 });
    }

    const kind = detectKind(file.type);
    if (!kind) {
      return NextResponse.json(
        { error: "Type de fichier non supporte. Utilise une image ou un audio." },
        { status: 400 }
      );
    }

    const limit = kind === "image" ? MAX_IMAGE_BYTES : MAX_AUDIO_BYTES;
    if (file.size > limit) {
      const limitMb = Math.round(limit / (1024 * 1024));
      return NextResponse.json({ error: `Fichier trop lourd (> ${limitMb} Mo).` }, { status: 400 });
    }

    const srv = getServerSupabaseOrResponse();
    if (!srv.ok) return srv.response;
    const supabase = srv.supabase;

    const rawExt = file.name.includes(".") ? file.name.split(".").pop() : undefined;
    const safeExt = rawExt ? rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") : kind === "image" ? "jpg" : "mp3";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
    const folder = kind === "image" ? "images" : "audio";
    const path = `${folder}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json(
        { error: "Echec de l'upload vers Supabase Storage.", details: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json(
      { data: { kind, path, url: publicData.publicUrl } },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Requete invalide (FormData attendue)." }, { status: 400 });
  }
}
