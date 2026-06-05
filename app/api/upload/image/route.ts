import { handleUpload } from "../../../../lib/uploadRoute";

export const dynamic = "force-dynamic";

/**
 * POST /api/upload/image
 * FormData: file (image uniquement)
 * Retourne { data: { kind, path, url, publicUrl } }.
 */
export function POST(request: Request) {
  return handleUpload(request, "image");
}
