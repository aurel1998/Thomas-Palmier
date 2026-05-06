import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  isPresentationModeEnabled,
  PRESENTATION_COOKIE,
} from "../../../../lib/presentationMode";

export async function POST() {
  if (!isPresentationModeEnabled()) {
    return NextResponse.json({ ok: true });
  }
  const jar = await cookies();
  if (!jar.has(PRESENTATION_COOKIE)) {
    return NextResponse.json({ ok: true });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PRESENTATION_COOKIE, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
