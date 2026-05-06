import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getAdminEmailForPresentation,
  isPresentationModeEnabled,
  PRESENTATION_COOKIE,
  PRESENTATION_COOKIE_VALUE,
} from "../../../../lib/presentationMode";

/** Verifie la presence du cookie de session demo (HttpOnly). */
export async function GET() {
  if (!isPresentationModeEnabled()) {
    return NextResponse.json({ authenticated: false }, { status: 404 });
  }
  const jar = await cookies();
  const ok = jar.get(PRESENTATION_COOKIE)?.value === PRESENTATION_COOKIE_VALUE;
  if (!ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    email: getAdminEmailForPresentation(),
  });
}
