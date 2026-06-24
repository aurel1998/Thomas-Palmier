import { NextResponse } from "next/server";

/** Fichier de vérification Google Search Console (ne pas supprimer). */
export async function GET() {
  return new NextResponse("google-site-verification: googleb810a331e41c58b3.html", {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
