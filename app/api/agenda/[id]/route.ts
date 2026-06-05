import { NextResponse } from "next/server";
import { revalidateAgendaCaches } from "../../../../lib/agendaCache";
import { parseEventBody } from "../../../../lib/agendaDb";
import { mapAgendaRow } from "../../../../lib/dbMappers";
import { requireAdmin } from "../../../../lib/apiAuth";
import { isMailerConfigured } from "../../../../lib/mailer";
import { unsetOtherFeaturedEvents } from "../../../../lib/featuredEvent";
import { notifyAgendaEvent } from "../../../../lib/newsletter";
import { parsePublicationStatus } from "../../../../lib/publicationStatus";
import { prisma } from "../../../../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PUT /api/agenda/:id — modifier un evenement (admin).
 */
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    const body = await request.json();
    const parsed = parseEventBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const status =
      raw.status !== undefined ? parsePublicationStatus(raw.status) : undefined;
    const isFeatured =
      typeof raw.is_featured === "boolean" ? raw.is_featured : undefined;
    const reminderEnabled =
      typeof raw.reminder_enabled === "boolean" ? raw.reminder_enabled : undefined;
    const shouldNotify = raw.notify === true;

    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Evenement introuvable." }, { status: 404 });
    }

    const effectiveStatus = status ?? existing.status;
    if (isFeatured === true && effectiveStatus !== "published") {
      return NextResponse.json(
        { error: "Seuls les événements publiés peuvent être mis en avant." },
        { status: 400 }
      );
    }

    if (reminderEnabled === true && effectiveStatus !== "published") {
      return NextResponse.json(
        { error: "Seuls les événements publiés peuvent avoir un rappel automatique." },
        { status: 400 }
      );
    }

    if (isFeatured === true) {
      await unsetOtherFeaturedEvents(id);
    }

    const dateChanged =
      existing.date.getTime() !== new Date(parsed.data.date).getTime();
    const contentChanged =
      existing.title !== parsed.data.title ||
      existing.description !== parsed.data.description ||
      existing.location !== parsed.data.location ||
      dateChanged;

    const data = await prisma.event.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(status !== undefined ? { status } : {}),
        ...(isFeatured !== undefined ? { isFeatured } : {}),
        ...(reminderEnabled !== undefined ? { reminderEnabled } : {}),
        ...(effectiveStatus === "draft"
          ? { isFeatured: false, reminderEnabled: false }
          : {}),
        ...(dateChanged ? { reminderSentAt: null } : {}),
      },
    });

    const updated = mapAgendaRow(data);

    if (shouldNotify && effectiveStatus === "published" && contentChanged && isMailerConfigured()) {
      void notifyAgendaEvent(updated, "updated").catch((error) => {
        console.error("[newsletter] notification agenda (modification) échouée:", (error as Error).message);
      });
    }

    revalidateAgendaCaches();
    return NextResponse.json(
      { data: updated },
      { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Evenement introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}

/**
 * DELETE /api/agenda/:id — supprimer un evenement (admin).
 */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Identifiant manquant." }, { status: 400 });

  try {
    await prisma.event.delete({ where: { id } });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Evenement introuvable." }, { status: 404 });
    }
    return NextResponse.json({ error: "Impossible de supprimer l'evenement." }, { status: 500 });
  }

  revalidateAgendaCaches();
  return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } });
}
