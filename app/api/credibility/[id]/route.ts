import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/apiAuth";
import { revalidateEditorialCaches } from "../../../../lib/editorialCache";
import { mapCredibilityRow } from "../../../../lib/editorialMappers";
import { prisma } from "../../../../lib/prisma";
import type { CredibilityKind } from "../../../../types/editorial";

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

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    const body = (await request.json()) as CredibilityBody;
    const updates: Record<string, string | number | boolean> = {};

    if (body.kind !== undefined) {
      const kind = str(body.kind);
      if (!kind || !KINDS.includes(kind as CredibilityKind)) {
        return NextResponse.json({ error: "Champ 'kind' invalide." }, { status: 400 });
      }
      updates.kind = kind;
    }
    const name = str(body.name);
    if (name !== undefined) updates.name = name;
    const title = str(body.title);
    if (title !== undefined) updates.title = title;
    const subtitle = str(body.subtitle);
    if (subtitle !== undefined) updates.subtitle = subtitle;
    const year = str(body.year);
    if (year !== undefined) updates.year = year;
    const logoUrl = str(body.logo_url);
    if (logoUrl !== undefined) updates.logoUrl = logoUrl;
    const initials = str(body.initials);
    if (initials !== undefined) updates.initials = initials;
    const linkUrl = str(body.link_url);
    if (linkUrl !== undefined) updates.linkUrl = linkUrl;
    if (body.position !== undefined) {
      if (typeof body.position !== "number" || !Number.isFinite(body.position)) {
        return NextResponse.json({ error: "Le champ 'position' doit etre un nombre." }, { status: 400 });
      }
      updates.position = Math.max(0, Math.floor(body.position));
    }
    if (body.is_active !== undefined) updates.isActive = Boolean(body.is_active);

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    const data = await prisma.credibilityItem.update({ where: { id }, data: updates });
    revalidateEditorialCaches();
    return NextResponse.json({ data: mapCredibilityRow(data) }, { status: 200 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Element introuvable." }, { status: 404 });
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
    await prisma.credibilityItem.delete({ where: { id } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Element introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de supprimer." }, { status: 500 });
  }

  revalidateEditorialCaches();
  return NextResponse.json({ ok: true }, { status: 200 });
}
