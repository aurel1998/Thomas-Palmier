import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "../auth";
import { isAllowedAdminUser } from "./adminAccess";

type AuthOk = { ok: true; session: Session };
type AuthFail = { ok: false; response: NextResponse };
export type AuthResult = AuthOk | AuthFail;

function unauthorized(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Vérifie qu'une requête API est faite par l'admin autorisé
 * (email contact@thomaspalmier.fr + rôle admin).
 */
export async function requireAdmin(): Promise<AuthResult> {
  const session = await auth();
  if (!isAllowedAdminUser(session?.user)) {
    return { ok: false, response: unauthorized("Authentification requise.") };
  }

  return { ok: true, session: session! };
}

/** Session admin valide (lecture seule, ex. brouillons sur GET publics). */
export async function isAdminSession(): Promise<boolean> {
  const session = await auth();
  return isAllowedAdminUser(session?.user);
}
