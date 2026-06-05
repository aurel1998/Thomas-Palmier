import type { AgendaEvent } from "./agendaEvents";

export const AGENDA_BROADCAST_CHANNEL = "sport-journal-agenda";

/** Récupère les événements depuis l'API (table `events` via Prisma). `null` = erreur réseau/API. */
export async function fetchAgendaEventsClient(): Promise<AgendaEvent[] | null> {
  try {
    const response = await fetch("/api/agenda", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const result = (await response.json()) as { data?: AgendaEvent[]; error?: string };
    if (!response.ok || !Array.isArray(result.data)) {
      return null;
    }
    return result.data.filter((e) => !Number.isNaN(new Date(e.date).getTime()));
  } catch {
    return null;
  }
}

/** Signale aux autres onglets (ex. homepage ouverte) que l'agenda a changé. */
export function notifyAgendaUpdated(): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(AGENDA_BROADCAST_CHANNEL);
  channel.postMessage({ type: "agenda-updated", at: Date.now() });
  channel.close();
}

/** Écoute les mises à jour agenda (admin → homepage). */
export function subscribeAgendaUpdates(onUpdate: () => void): () => void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return () => {};
  }
  const channel = new BroadcastChannel(AGENDA_BROADCAST_CHANNEL);
  channel.onmessage = () => onUpdate();
  return () => channel.close();
}
