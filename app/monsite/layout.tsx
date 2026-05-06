import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminAuthGate } from "../../components/admin/AdminAuthGate";

export const metadata: Metadata = {
  title: "Espace prive",
  robots: { index: false, follow: false },
};

export default function MonSiteLayout({ children }: { children: ReactNode }) {
  return <AdminAuthGate>{children}</AdminAuthGate>;
}
