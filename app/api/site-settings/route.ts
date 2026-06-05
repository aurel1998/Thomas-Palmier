import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/apiAuth";
import { revalidateEditorialCaches } from "../../../lib/editorialCache";
import { mapSiteRow } from "../../../lib/editorialMappers";
import { upsertSiteSettingsRow } from "../../../lib/editorialSingleton";
import { getSiteSettingsServer } from "../../../lib/editorialServer";
import { prisma } from "../../../lib/prisma";

type SiteBody = {
  footer_tagline?: unknown;
  contact_intro?: unknown;
  contact_role?: unknown;
  newsletter_eyebrow?: unknown;
  newsletter_title?: unknown;
  home_about_eyebrow?: unknown;
  home_about_title?: unknown;
  collaborer_eyebrow?: unknown;
  collaborer_hero_title?: unknown;
  collaborer_hero_subtitle?: unknown;
  collaborer_cta_label?: unknown;
  collaborer_cta_href?: unknown;
  collaborer_closing_title?: unknown;
};

function strField(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

/** GET /api/site-settings — lecture publique des textes du site. */
export async function GET() {
  try {
    const data = await getSiteSettingsServer();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de recuperer les parametres.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/** PUT /api/site-settings — mise à jour admin. */
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as SiteBody;
    const updates: Parameters<typeof upsertSiteSettingsRow>[0] = {};

    const map: [keyof SiteBody, keyof Parameters<typeof upsertSiteSettingsRow>[0]][] = [
      ["footer_tagline", "footerTagline"],
      ["contact_intro", "contactIntro"],
      ["contact_role", "contactRole"],
      ["newsletter_eyebrow", "newsletterEyebrow"],
      ["newsletter_title", "newsletterTitle"],
      ["home_about_eyebrow", "homeAboutEyebrow"],
      ["home_about_title", "homeAboutTitle"],
      ["collaborer_eyebrow", "collaborerEyebrow"],
      ["collaborer_hero_title", "collaborerHeroTitle"],
      ["collaborer_hero_subtitle", "collaborerHeroSubtitle"],
      ["collaborer_cta_label", "collaborerCtaLabel"],
      ["collaborer_cta_href", "collaborerCtaHref"],
      ["collaborer_closing_title", "collaborerClosingTitle"],
    ];

    for (const [apiKey, dbKey] of map) {
      const val = strField(body[apiKey]);
      if (val !== undefined) updates[dbKey] = val;
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    await upsertSiteSettingsRow(updates);
    const row = await prisma.siteSettings.findFirst();
    const data = row ? mapSiteRow(row) : await getSiteSettingsServer();

    revalidateEditorialCaches();
    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
