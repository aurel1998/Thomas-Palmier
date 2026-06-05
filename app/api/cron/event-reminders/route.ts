import { NextResponse } from "next/server";
import { authorizeCron, cronSecretConfigured } from "../../../../lib/cronAuth";
import { processEventReminders } from "../../../../lib/eventReminders";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * GET/POST /api/cron/event-reminders
 *
 * Tâche planifiée (cron VPS IONOS) : rappels email 24 h avant les événements.
 * Auth : Authorization: Bearer CRON_SECRET ou ?secret=CRON_SECRET
 */
async function handle(request: Request) {
  if (!cronSecretConfigured()) {
    return NextResponse.json(
      { error: "CRON_SECRET non configuré sur le serveur." },
      { status: 503 }
    );
  }

  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const result = await processEventReminders();
    return NextResponse.json(
      { data: result },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[cron] event-reminders:", (error as Error).message);
    return NextResponse.json(
      { error: "Traitement des rappels impossible." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
