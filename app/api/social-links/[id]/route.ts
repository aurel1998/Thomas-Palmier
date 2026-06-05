import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/apiAuth";
import { revalidateEditorialCaches } from "../../../../lib/editorialCache";
import { mapSocialRow } from "../../../../lib/editorialMappers";
import { prisma } from "../../../../lib/prisma";

type SocialBody = {
  platform?: unknown;
  label?: unknown;
  url?: unknown;
  position?: unknown;
  is_active?: unknown;
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    const body = (await request.json()) as SocialBody;
    const updates: Record<string, string | number | boolean> = {};

    if (body.platform !== undefined) {
      const platform = typeof body.platform === "string" ? body.platform.trim() : "";
      if (!platform) return NextResponse.json({ error: "platform invalide." }, { status: 400 });
      updates.platform = platform;
    }
    if (body.label !== undefined) {
      const label = typeof body.label === "string" ? body.label.trim() : "";
      if (!label) return NextResponse.json({ error: "label invalide." }, { status: 400 });
      updates.label = label;
    }
    if (body.url !== undefined) {
      const url = typeof body.url === "string" ? body.url.trim() : "";
      if (!url) return NextResponse.json({ error: "url invalide." }, { status: 400 });
      updates.url = url;
    }
    if (body.position !== undefined) {
      if (typeof body.position !== "number" || !Number.isFinite(body.position)) {
        return NextResponse.json({ error: "position invalide." }, { status: 400 });
      }
      updates.position = Math.max(0, Math.floor(body.position));
    }
    if (body.is_active !== undefined) updates.isActive = Boolean(body.is_active);

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    const data = await prisma.socialLink.update({ where: { id }, data: updates });
    revalidateEditorialCaches();
    return NextResponse.json({ data: mapSocialRow(data) }, { status: 200 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Lien introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    await prisma.socialLink.delete({ where: { id } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Lien introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de supprimer." }, { status: 500 });
  }

  revalidateEditorialCaches();
  return NextResponse.json({ ok: true }, { status: 200 });
}
