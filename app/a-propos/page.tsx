import { AProposClient } from "../../components/a-propos/AProposClient";
import { getJournalistProfileImageServer } from "../../lib/journalistProfileServer";

const FALLBACK_PORTRAIT = "/src/joueurs/joueur10.jpg";

export default async function AProposPage() {
  const profileUrl = await getJournalistProfileImageServer();
  const src = profileUrl?.trim() ? profileUrl : FALLBACK_PORTRAIT;
  return <AProposClient profileImageUrl={src} />;
}
