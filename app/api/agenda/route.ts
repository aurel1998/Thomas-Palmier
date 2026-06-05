import { NextResponse } from "next/server";
import { revalidateAgendaCaches } from "../../../lib/agendaCache";
import { parseEventBody } from "../../../lib/agendaDb";
import { mapAgendaRow } from "../../../lib/dbMappers";
import { isAdminSession, requireAdmin } from "../../../lib/apiAuth";
import { isMailerConfigured } from "../../../lib/mailer";
import { unsetOtherFeaturedEvents } from "../../../lib/featuredEvent";
import { notifyAgendaEvent } from "../../../lib/newsletter";
import { parsePublicationStatus } from "../../../lib/publicationStatus";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/agenda — liste publique des événements (`events`).
 */
export async function GET(request: Request) {
  try {
    const includeDrafts =
      new URL(request.url).searchParams.get("include_drafts") === "1" &&
      (await isAdminSession());
    const data = await prisma.event.findMany({
      where: includeDrafts ? undefined : { status: "published" },
      orderBy: [{ isFeatured: "desc" }, { date: "asc" }],
    });
    return NextResponse.json(
      { data: data.map(mapAgendaRow) },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de recuperer les evenements.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agenda — creer un evenement (admin).
 */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const parsed = parseEventBody(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
    const status = parsePublicationStatus(raw.status, "draft");
    const isFeatured = typeof raw.is_featured === "boolean" ? raw.is_featured : false;
    const reminderEnabled =
      typeof raw.reminder_enabled === "boolean" ? raw.reminder_enabled : false;
    const shouldNotify = raw.notify === true && status === "published";

    if (isFeatured && status !== "published") {
      return NextResponse.json(
        { error: "Seuls les événements publiés peuvent être mis en avant." },
        { status: 400 }
      );
    }

    if (reminderEnabled && status !== "published") {
      return NextResponse.json(
        { error: "Seuls les événements publiés peuvent avoir un rappel automatique." },
        { status: 400 }
      );
    }

    if (isFeatured) {
      await unsetOtherFeaturedEvents();
    }

    const data = await prisma.event.create({
      data: { ...parsed.data, status, isFeatured, reminderEnabled },
    });
    const created = mapAgendaRow(data);

    if (shouldNotify && isMailerConfigured()) {
      void notifyAgendaEvent(created, "created").catch((error) => {
        console.error("[newsletter] notification agenda (création) échouée:", (error as Error).message);
      });
    }

    revalidateAgendaCaches();
    return NextResponse.json(
      { data: created },
      { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
    }
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
