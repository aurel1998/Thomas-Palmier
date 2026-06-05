import type { ReactNode } from "react";
import { buildPageMetadata } from "../../lib/seo";

export const metadata = buildPageMetadata({
  title: "Contenus",
  description:
    "Articles, vidéos et formats courts de Thomas Palmier : sport raconté au plus près, analyses terrain et reportages.",
  path: "/mes-contenus",
});

export default function MesContenusLayout({ children }: { children: ReactNode }) {
  return children;
}
