export type EventPayload = {
  title: string;
  description: string;
  date: string;
  location: string;
};

export function parseEventBody(body: unknown): { ok: true; data: EventPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Corps de requete invalide (JSON attendu)." };
  }

  const raw = body as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const description = typeof raw.description === "string" ? raw.description.trim() : "";
  const location = typeof raw.location === "string" ? raw.location.trim() : "";

  const dateRaw =
    typeof raw.date === "string"
      ? raw.date.trim()
      : typeof raw.starts_at === "string"
        ? raw.starts_at.trim()
        : typeof raw.startsAt === "string"
          ? raw.startsAt.trim()
          : "";

  if (!title) return { ok: false, error: "Le titre est obligatoire." };
  if (!description) return { ok: false, error: "La description est obligatoire." };
  if (!dateRaw) return { ok: false, error: "La date est obligatoire." };

  const parsedDate = new Date(dateRaw);
  if (Number.isNaN(parsedDate.getTime())) {
    return { ok: false, error: "Date ou heure invalide." };
  }

  return {
    ok: true,
    data: {
      title,
      description,
      date: parsedDate.toISOString(),
      location,
    },
  };
}

/** Date (YYYY-MM-DD) et heure (HH:mm) depuis ISO. */
export function isoToDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/** Combine date + heure locales en ISO UTC. */
export function combineDateAndTimeToIso(date: string, time: string): string {
  if (!date) return "";
  const t = time?.trim() || "10:00";
  const d = new Date(`${date}T${t}`);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
