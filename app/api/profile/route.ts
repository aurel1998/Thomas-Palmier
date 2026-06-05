import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/apiAuth";
import { revalidateEditorialCaches } from "../../../lib/editorialCache";
import { mapProfileRow } from "../../../lib/editorialMappers";
import { upsertJournalistProfileRow } from "../../../lib/editorialSingleton";
import { getJournalistProfileServer } from "../../../lib/editorialServer";
import { prisma } from "../../../lib/prisma";

type ProfileBody = {
  image_url?: unknown;
  display_name?: unknown;
  job_title?: unknown;
  tagline?: unknown;
  bio?: unknown;
  bio_short?: unknown;
  specialties?: unknown;
  hero_video_url?: unknown;
  hero_poster_url?: unknown;
  photo_caption?: unknown;
  editorial_line?: unknown;
};

function strField(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function specialtiesField(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
}

/** GET /api/profile — lecture publique du profil journaliste. */
export async function GET() {
  try {
    const data = await getJournalistProfileServer();
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Impossible de recuperer le profil.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/** PUT /api/profile — mise à jour admin du profil. */
export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as ProfileBody;
    const updates: Parameters<typeof upsertJournalistProfileRow>[0] = {};

    const imageUrl = strField(body.image_url);
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    const displayName = strField(body.display_name);
    if (displayName !== undefined) updates.displayName = displayName;
    const jobTitle = strField(body.job_title);
    if (jobTitle !== undefined) updates.jobTitle = jobTitle;
    const tagline = strField(body.tagline);
    if (tagline !== undefined) updates.tagline = tagline;
    const bio = strField(body.bio);
    if (bio !== undefined) updates.bio = bio;
    const bioShort = strField(body.bio_short);
    if (bioShort !== undefined) updates.bioShort = bioShort;
    const specialties = specialtiesField(body.specialties);
    if (specialties !== undefined) updates.specialties = specialties;
    const heroVideoUrl = strField(body.hero_video_url);
    if (heroVideoUrl !== undefined) updates.heroVideoUrl = heroVideoUrl;
    const heroPosterUrl = strField(body.hero_poster_url);
    if (heroPosterUrl !== undefined) updates.heroPosterUrl = heroPosterUrl;
    const photoCaption = strField(body.photo_caption);
    if (photoCaption !== undefined) updates.photoCaption = photoCaption;
    const editorialLine = strField(body.editorial_line);
    if (editorialLine !== undefined) updates.editorialLine = editorialLine;

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "Aucune donnee a mettre a jour." }, { status: 400 });
    }

    await upsertJournalistProfileRow(updates);
    const row = await prisma.journalistProfile.findFirst();
    const data = row ? mapProfileRow(row) : await getJournalistProfileServer();

    revalidateEditorialCaches();
    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Corps de requete invalide (JSON attendu)." }, { status: 400 });
  }
}
