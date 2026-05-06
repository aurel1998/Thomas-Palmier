import { NextResponse } from "next/server";
import { isPresentationModeEnabled } from "../../../../lib/presentationMode";

/** Indique si le mode presentation (login sans Supabase) est active. */
export async function GET() {
  return NextResponse.json({ demo: isPresentationModeEnabled() });
}
