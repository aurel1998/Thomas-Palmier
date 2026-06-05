import { NextResponse } from "next/server";
import { requireAdmin } from "./apiAuth";
import {
  saveLocalUpload,
  UPLOAD_ERROR_CODES,
  uploadErrorMessage,
  type UploadKind,
} from "./localUpload";

/**
 * Handler partagé pour les routes d'upload dédiées (image / audio).
 *
 * - Auth admin requise
 * - Validation type fichier (rejette si != `expectedKind`)
 * - Limite de taille (gérée dans `saveLocalUpload`)
 * - Sauvegarde serveur sous /public/uploads
 */
export async function handleUpload(request: Request, expectedKind: UploadKind) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requete invalide (FormData attendue)." }, { status: 400 });
  }

  const entry = formData.get("file");
  if (!(entry instanceof File)) {
    return NextResponse.json({ error: "Champ 'file' manquant ou invalide." }, { status: 400 });
  }

  try {
    const result = await saveLocalUpload(entry, expectedKind);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (UPLOAD_ERROR_CODES.has(code)) {
      return NextResponse.json({ error: uploadErrorMessage(code, expectedKind) }, { status: 400 });
    }
    return NextResponse.json({ error: "Upload impossible." }, { status: 500 });
  }
}
