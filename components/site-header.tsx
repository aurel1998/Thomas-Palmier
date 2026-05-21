"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { isReducedMotion, motion } from "../lib/gsapMotion";
import logo from "../src/logo/thomas.png";
import { SocialLinks } from "./SocialLinks";
import { ThemeToggle } from "./theme/ThemeToggle";

/**
 * Navigation : Accueil, parcours éditorial « Mes contenus », pages éditoriales.
 * Espace technique : `/monsite` (hors menu, protégé par auth).
 */
const PRIMARY_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/mes-contenus", label: "Contenus" },
  { href: "/a-propos", label: "À propos" },
  { href: "/collaborer", label: "Collaborer" },
] as const;

/** CTA séparé : mis en avant visuellement à droite du bloc liens. */
const CONTACT_CTA = { href: "/contact", label: "Contact" } as const;

/** Préchargement agressif : toutes les entrées du menu dès le montage (chunks + RSC). */
const PREFETCH_HREFS = [
  ...PRIMARY_LINKS.map((l) => l.href),
  CONTACT_CTA.href,
] as const;

type PrimaryHref = (typeof PRIMARY_LINKS)[number]["href"];
type SiteHeaderProps = { profileImageSrc?: string };

function routeMatches(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ profileImageSrc }: SiteHeaderProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const primaryNavRef = useRef<HTMLDivElement | null>(null);
  const indicatorRef = useRef<HTMLSpanElement | null>(null);
  const linkRefs = useRef<Partial<Record<PrimaryHref, HTMLAnchorElement | null>>>({});

  const setLinkRef = useCallback((href: PrimaryHref, el: HTMLAnchorElement | null) => {
    linkRefs.current[href] = el;
  }, []);

  const activePrimaryHref = useCallback((): PrimaryHref | null => {
    const hit = PRIMARY_LINKS.find((l) => routeMatches(pathname, l.href));
    return hit ? hit.href : null;
  }, [pathname]);

  const contactActive = routeMatches(pathname, CONTACT_CTA.href);
  const aboutActive = routeMatches(pathname, "/a-propos");

  const repositionIndicator = useCallback((targetHref: PrimaryHref | null, animate: boolean) => {
    const track = primaryNavRef.current;
    const ind = indicatorRef.current;
    if (!track || !ind) return;

    const el = targetHref ? linkRefs.current[targetHref] ?? null : null;
    const reduced = isReducedMotion();
    const duration = reduced || !animate ? 0 : motion.duration.route;

    if (!el || !targetHref) {
      gsap.killTweensOf(ind);
      gsap.to(ind, {
        opacity: 0,
        duration: duration || 0,
        ease: motion.ease.outSoft,
      });
      return;
    }

    const tr = track.getBoundingClientRect();
    const lr = el.getBoundingClientRect();
    const x = lr.left - tr.left;
    const w = Math.max(lr.width, 12);

    gsap.killTweensOf(ind);
    gsap.to(ind, {
      x,
      width: w,
      opacity: 1,
      duration,
      ease: motion.ease.out,
    });
  }, []);

  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      repositionIndicator(activePrimaryHref(), true);
    });
    return () => cancelAnimationFrame(id);
  }, [activePrimaryHref, repositionIndicator]);

  useEffect(() => {
    const track = primaryNavRef.current;
    if (!track || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver(() => {
      repositionIndicator(activePrimaryHref(), false);
    });
    ro.observe(track);

    const onResize = () => repositionIndicator(activePrimaryHref(), false);
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [activePrimaryHref, repositionIndicator]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(header, { y: -24, opacity: 0 }, { y: 0, opacity: 1, duration: motion.duration.reveal, ease: motion.ease.out });

      gsap.fromTo(
        [".site-header__brand", ".site-header__start .social-links__item"],
        { opacity: 0, y: -10 },
        {
          opacity: 1,
          y: 0,
          duration: motion.duration.revealMed,
          ease: motion.ease.outSoft,
          stagger: motion.duration.staggerTight,
          delay: 0.04,
        }
      );

      gsap.fromTo(
        ".site-header__navPrimary .site-header__link",
        { opacity: 0, y: -10 },
        {
          opacity: 1,
          y: 0,
          duration: motion.duration.revealMed,
          ease: motion.ease.outSoft,
          stagger: motion.duration.stagger,
          delay: 0.12,
        }
      );

      gsap.fromTo(
        ".site-header__navActions .site-header__cta",
        { opacity: 0, y: -10 },
        {
          opacity: 1,
          y: 0,
          duration: motion.duration.revealMed,
          ease: motion.ease.outSoft,
          delay: 0.38,
        }
      );
    }, header);

    const onScroll = () => {
      const scrolled = window.scrollY > 26;
      header.classList.toggle("site-header--scrolled", scrolled);
      header.classList.toggle("site-header--transparent", !scrolled);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.toggle("mobile-menu-open", menuOpen);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("mobile-menu-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    for (const href of PREFETCH_HREFS) {
      router.prefetch(href);
    }
  }, [router]);

  return (
    <header ref={headerRef} className="site-header site-header--transparent">
      <div className="site-header__bar">
        <div className="site-header__inner">
        <div className="site-header__start">
          <Link href="/" prefetch className="site-header__brand interactive" aria-label="Sport Journal, accueil">
            <span className="site-header__logoWrap">
              <Image
                src={logo}
                alt=""
                width={1024}
                height={374}
                priority
                aria-hidden
                className="site-header__logo"
              />
            </span>
          </Link>
          <SocialLinks variant="header" />
        </div>

        <button
          type="button"
          className={`site-header__menuToggle interactive is-pressable${menuOpen ? " is-open" : ""}`}
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
        </button>

        <nav className={`site-header__nav${menuOpen ? " is-open" : ""}`} aria-label="Navigation principale">
          <div
            ref={primaryNavRef}
            className="site-header__navPrimary"
            onPointerLeave={(e) => {
              if (!primaryNavRef.current?.contains(e.relatedTarget as Node)) {
                repositionIndicator(activePrimaryHref(), true);
              }
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                repositionIndicator(activePrimaryHref(), true);
              }
            }}
          >
            {PRIMARY_LINKS.map((item) => {
              const active = routeMatches(pathname, item.href);
              const navHandlers = {
                "data-nav-href": item.href,
                onPointerEnter: () => repositionIndicator(item.href, true),
                onFocus: () => repositionIndicator(item.href, true),
              } as const;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  ref={(el) => setLinkRef(item.href, el)}
                  className={`site-header__navItem site-header__link interactive${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  {...navHandlers}
                >
                  <span className="site-header__linkLabel">{item.label}</span>
                </Link>
              );
            })}
            <span ref={indicatorRef} className="site-header__navIndicator" aria-hidden />
          </div>

          <div className="site-header__navActions">
            {profileImageSrc ? (
              <Link
                href="/a-propos"
                prefetch
                className={`site-header__aboutAvatar interactive is-pressable${aboutActive ? " is-active" : ""}`}
                aria-label="Voir la page À propos"
              >
                <Image
                  src={profileImageSrc}
                  alt=""
                  width={36}
                  height={36}
                  className="site-header__aboutAvatarImg"
                />
              </Link>
            ) : null}
            <Link
              href={CONTACT_CTA.href}
              prefetch
              className={`site-header__navItem site-header__cta interactive is-magnetic is-pressable${contactActive ? " is-active" : ""}`}
              data-magnetic="0.32"
              aria-current={contactActive ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span className="site-header__ctaLabel">{CONTACT_CTA.label}</span>
            </Link>
            <ThemeToggle className="interactive is-pressable" />
          </div>
        </nav>
        </div>
      </div>
    </header>
  );
}
