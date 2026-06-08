"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ClientFxBundle } from "../fx/ClientFxBundle";
import { GsapRegister } from "../fx/GsapRegister";
import { SmoothScroll } from "../fx/SmoothScroll";
import { PageTransition } from "../page-transition";
import { SiteFooter } from "../site-footer";
import { SiteHeader } from "../site-header";
import type { SocialLinkDto } from "../../types/editorial";

type SiteChromeProps = {
  children: ReactNode;
  profileImageSrc?: string;
  footerTagline?: string;
  socialLinks?: SocialLinkDto[];
};

const MINIMAL_CHROME_PREFIXES = ["/monsite"];

function isMinimalChrome(pathname: string): boolean {
  return MINIMAL_CHROME_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

/** Header/footer publics masqués sur admin et login. */
export function SiteChrome({
  children,
  profileImageSrc,
  footerTagline,
  socialLinks,
}: SiteChromeProps) {
  const pathname = usePathname() ?? "/";
  const minimal = isMinimalChrome(pathname);

  if (minimal) {
    return <main className="site-chrome site-chrome--minimal">{children}</main>;
  }

  return (
    <>
      <GsapRegister />
      <SmoothScroll />
      <ClientFxBundle />
      <SiteHeader profileImageSrc={profileImageSrc} socialLinks={socialLinks} />
      <PageTransition>{children}</PageTransition>
      <SiteFooter tagline={footerTagline} socialLinks={socialLinks} />
    </>
  );
}
