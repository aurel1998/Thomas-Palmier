import { NextResponse } from "next/server";
import { isAdminSession, requireAdmin } from "../../../lib/apiAuth";
import { revalidateEditorialCaches } from "../../../lib/editorialCache";
import { mapCredibilityRow } from "../../../lib/editorialMappers";
import { getCredibilityItemsServer } from "../../../lib/editorialServer";
import { prisma } from "../../../lib/prisma";
import type { CredibilityKind } from "../../../types/editorial";

const KINDS: CredibilityKind[] = ["media", "partner", "award", "institution"];

type CredibilityBody = {
  kind?: unknown;
  name?: unknown;
  title?: unknown;
  subtitle?: unknown;
  year?: unknown;
  logo_url?: unknown;
  initials?: unknown;
  link_url?: unknown;
  position?: unknown;
  is_active?: unknown;
};

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

/** GET /api/credibility?kind=media&active_only=1 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const kindParam = searchParams.get("kind");
  const kind = KINDS.includes(kindParam as CredibilityKind) ? (kindParam as CredibilityKind) : undefined;
  const includeInactive = searchParams.get("active_only") === "0";
  if (includeInactive && !(await isAdminSession())) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }
  const activeOnly = !includeInactive;

  try {
    const data = await getCredibilityItemsServer({ kind, activeOnly });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de charger les elements.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/** POST /api/credibility */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as CredibilityBody;
    const kind = str(body.kind);
    if (!KINDS.includes(kind as CredibilityKind)) {
      return NextResponse.json({ error: "Champ 'kind' invalide." }, { status: 400 });
    }

    const position =
      typeof body.position === "number" && Number.isFinite(body.position)
        ? Math.max(0, Math.floor(body.position))
        : 100;

    const data = await prisma.credibilityItem.create({
      data: {
        kind: kind as CredibilityKind,
        name: str(body.name),
        title: str(body.title),
        subtitle: str(body.subtitle),
        year: str(body.year),
        logoUrl: str(body.logo_url),
        initials: str(body.initials),
        linkUrl: str(body.link_url),
        position,
        isActive: body.is_active !== false,
      },
    });

    revalidateEditorialCaches();
    return NextResponse.json({ data: mapCredibilityRow(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
