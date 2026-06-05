import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/apiAuth";
import { mapCaseRow } from "../../../lib/editorialMappers";
import { getCollaborationCasesServer } from "../../../lib/editorialServer";
import { prisma } from "../../../lib/prisma";

type CaseBody = {
  number?: unknown;
  title?: unknown;
  format?: unknown;
  note?: unknown;
  position?: unknown;
};

/** GET /api/collaboration-cases */
export async function GET() {
  try {
    const data = await getCollaborationCasesServer();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de charger les cas clients.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/** POST /api/collaboration-cases */
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as CaseBody;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Le champ 'title' est obligatoire." }, { status: 400 });

    const position =
      typeof body.position === "number" && Number.isFinite(body.position)
        ? Math.max(0, Math.floor(body.position))
        : 100;

    const data = await prisma.collaborationCase.create({
      data: {
        number: typeof body.number === "string" ? body.number.trim() : "",
        title,
        format: typeof body.format === "string" ? body.format.trim() : "",
        note: typeof body.note === "string" ? body.note.trim() : "",
        position,
      },
    });

    return NextResponse.json({ data: mapCaseRow(data) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
