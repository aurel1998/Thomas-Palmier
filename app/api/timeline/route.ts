import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/apiAuth";
import { revalidateEditorialCaches } from "../../../lib/editorialCache";
import { mapTimelineRow } from "../../../lib/editorialMappers";
import { getTimelineStepsServer } from "../../../lib/editorialServer";
import { prisma } from "../../../lib/prisma";

type TimelineBody = {
  period?: unknown;
  title?: unknown;
  text?: unknown;
  position?: unknown;
};

/** GET /api/timeline */
export async function GET() {
  try {
    const data = await getTimelineStepsServer();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de charger la timeline.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/** POST /api/timeline */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as TimelineBody;
    const period = typeof body.period === "string" ? body.period.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!period || !title) {
      return NextResponse.json({ error: "Les champs 'period' et 'title' sont obligatoires." }, { status: 400 });
    }

    const position =
      typeof body.position === "number" && Number.isFinite(body.position)
        ? Math.max(0, Math.floor(body.position))
        : 100;

    const data = await prisma.timelineStep.create({
      data: {
        period,
        title,
        text: typeof body.text === "string" ? body.text.trim() : "",
        position,
      },
    });

    revalidateEditorialCaches();
    return NextResponse.json({ data: mapTimelineRow(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
