import { NextResponse } from "next/server";
import {
  getAdminEmailForPresentation,
  getPresentationPassword,
  isPresentationModeEnabled,
  PRESENTATION_COOKIE,
  PRESENTATION_COOKIE_VALUE,
} from "../../../../lib/presentationMode";

type Body = { email?: string; password?: string };

export async function POST(request: Request) {
  if (!isPresentationModeEnabled()) {
    return NextResponse.json({ error: "Mode presentation desactive." }, { status: 404 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = (body.password ?? "").trim();
  const expectedEmail = getAdminEmailForPresentation();
  const expectedPassword = getPresentationPassword();

  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe obligatoires." }, { status: 400 });
  }

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ error: "Identifiants incorrects." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PRESENTATION_COOKIE, PRESENTATION_COOKIE_VALUE, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
