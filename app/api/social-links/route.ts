import { NextResponse } from "next/server";
import { isAdminSession, requireAdmin } from "../../../lib/apiAuth";
import { revalidateEditorialCaches } from "../../../lib/editorialCache";
import { mapSocialRow } from "../../../lib/editorialMappers";
import { getSocialLinksServer } from "../../../lib/editorialServer";
import { prisma } from "../../../lib/prisma";

type SocialBody = {
  platform?: unknown;
  label?: unknown;
  url?: unknown;
  position?: unknown;
  is_active?: unknown;
};

/** GET /api/social-links?active_only=1 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("active_only") === "0";
  if (includeInactive && !(await isAdminSession())) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  const activeOnly = !includeInactive;

  try {
    const data = await getSocialLinksServer(activeOnly);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de charger les liens.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/** POST /api/social-links */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as SocialBody;
    const platform = typeof body.platform === "string" ? body.platform.trim() : "";
    const label = typeof body.label === "string" ? body.label.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!platform || !label || !url) {
      return NextResponse.json({ error: "platform, label et url sont obligatoires." }, { status: 400 });
    }

    const position =
      typeof body.position === "number" && Number.isFinite(body.position)
        ? Math.max(0, Math.floor(body.position))
        : 100;

    const data = await prisma.socialLink.create({
      data: { platform, label, url, position, isActive: body.is_active !== false },
    });

    revalidateEditorialCaches();
    return NextResponse.json({ data: mapSocialRow(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
