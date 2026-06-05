"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgendaEvent } from "../agendaEvents";
import { fetchAgendaEventsClient, subscribeAgendaUpdates } from "../agendaClient";

const POLL_MS = 30_000;

type UseAgendaEventsOptions = {
  /** Données préchargées côté serveur (homepage). */
  initialEvents?: AgendaEvent[];
  /** Rafraîchir au montage pour synchroniser avec la base. */
  syncOnMount?: boolean;
};

/**
 * État agenda côté client : fetch API + sync après mutations admin.
 */
export function useAgendaEvents(options: UseAgendaEventsOptions = {}) {
  const { initialEvents = [], syncOnMount = true } = options;
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents);
  const [syncing, setSyncing] = useState(false);
  const mountedRef = useRef(false);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setSyncing(true);
    try {
      const next = await fetchAgendaEventsClient();
      if (next !== null) setEvents(next);
    } finally {
      if (!opts?.silent) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  useEffect(() => {
    if (!syncOnMount || mountedRef.current) return;
    mountedRef.current = true;
    void refresh({ silent: initialEvents.length > 0 });
  }, [syncOnMount, initialEvents.length, refresh]);

  useEffect(() => {
    const unsubBroadcast = subscribeAgendaUpdates(() => {
      void refresh({ silent: true });
    });

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const pollId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh({ silent: true });
      }
    }, POLL_MS);

    return () => {
      unsubBroadcast();
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(pollId);
    };
  }, [refresh]);

  return { events, syncing, refresh };
}
