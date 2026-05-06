import { redirect } from "next/navigation";

/** Ancienne URL : tout pointe vers le parcours éditorial « Mes contenus ». */
export default function ContenusLegacyRedirect() {
  redirect("/mes-contenus");
}
