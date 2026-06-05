"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { notifyAgendaUpdated } from "../../lib/agendaClient";
import { combineDateAndTimeToIso, isoToDateAndTime } from "../../lib/agendaDb";
import type { AgendaEvent } from "../../lib/agendaEvents";
import type { PublicationStatus } from "../../lib/publicationStatus";
import { resolveFeaturedEvent } from "../../lib/agendaEvents";
import { FeaturedAgendaEventCard } from "../home/FeaturedAgendaEventCard";
import {
  AgendaAdminEventDialog,
  type AgendaAdminFormValues,
} from "./AgendaAdminEventDialog";

const AdminAgendaCalendar = dynamic(
  () => import("./AdminAgendaCalendar").then((m) => ({ default: m.AdminAgendaCalendar })),
  {
    ssr: false,
    loading: () => <div className="admin-agenda-cal admin-agenda-cal--loading" aria-busy="true" />,
  }
);

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type AgendaAdminPanelProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
};

const emptyForm = (): AgendaAdminFormValues => ({
  title: "",
  date: "",
  time: "10:00",
  location: "",
  description: "",
});

function formFromEvent(event: AgendaEvent): AgendaAdminFormValues {
  const { date, time } = isoToDateAndTime(event.date);
  return {
    title: event.title,
    date,
    time: time || "10:00",
    location: event.location ?? "",
    description: event.description,
  };
}

function formFromDate(date: Date): AgendaAdminFormValues {
  const { date: d, time } = isoToDateAndTime(date.toISOString());
  return {
    ...emptyForm(),
    date: d,
    time: time || "10:00",
  };
}

/**
 * Gestion agenda : calendrier interactif + popup formulaire.
 */
export function AgendaAdminPanel({ apiFetch, pushToast }: AgendaAdminPanelProps) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AgendaAdminFormValues>(emptyForm);
  const [eventStatus, setEventStatus] = useState<PublicationStatus>("draft");
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderSentAt, setReminderSentAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/agenda?include_drafts=1", { cache: "no-store" });
      const result = (await response.json()) as { data?: AgendaEvent[]; error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Impossible de charger l'agenda.");
        }
        return;
      }
      const list = Array.isArray(result.data) ? result.data : [];
      setEvents(
        [...list].sort((a, b) => {
          const af = a.is_featured ? 1 : 0;
          const bf = b.is_featured ? 1 : 0;
          if (bf !== af) return bf - af;
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        })
      );
    } catch {
      pushToast("error", "Erreur réseau pendant le chargement de l'agenda.");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, pushToast]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const closeDialog = useCallback(() => {
    if (saving || deleting) return;
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    setEventStatus("draft");
    setNotifySubscribers(false);
    setIsFeatured(false);
    setReminderEnabled(false);
    setReminderSentAt(null);
  }, [saving, deleting]);

  const openCreate = useCallback((date: Date) => {
    setDialogMode("create");
    setEditingId(null);
    setForm(formFromDate(date));
    setEventStatus("draft");
    setNotifySubscribers(false);
    setIsFeatured(false);
    setReminderEnabled(false);
    setReminderSentAt(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((event: AgendaEvent) => {
    setDialogMode("edit");
    setEditingId(event.id);
    setForm(formFromEvent(event));
    setEventStatus(event.status ?? "draft");
    setNotifySubscribers(false);
    setIsFeatured(Boolean(event.is_featured));
    setReminderEnabled(Boolean(event.reminder_enabled));
    setReminderSentAt(event.reminder_sent_at ?? null);
    setDialogOpen(true);
  }, []);

  async function persistEvent() {
    if (!form.title.trim() || !form.date || !form.description.trim()) {
      pushToast("error", "Titre, date et description sont obligatoires.");
      return;
    }

    const dateIso = combineDateAndTimeToIso(form.date, form.time);
    if (!dateIso) {
      pushToast("error", "Date ou heure invalide.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      date: dateIso,
      location: form.location.trim(),
      description: form.description.trim(),
      status: eventStatus,
      notify: notifySubscribers,
      is_featured: isFeatured,
      reminder_enabled: reminderEnabled,
    };

    setSaving(true);
    try {
      const isEditing = dialogMode === "edit" && editingId;
      const response = await apiFetch(isEditing ? `/api/agenda/${editingId}` : "/api/agenda", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { data?: AgendaEvent; error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Enregistrement impossible.");
        }
        return;
      }

      const saved = result.data;
      if (saved) {
        setEvents((prev) => {
          const next = isEditing
            ? prev.map((e) => (e.id === saved.id ? saved : e))
            : [...prev, saved];
          return next.sort((a, b) => {
            const af = a.is_featured ? 1 : 0;
            const bf = b.is_featured ? 1 : 0;
            if (bf !== af) return bf - af;
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
        });
      } else {
        await loadEvents();
      }

      notifyAgendaUpdated();
      pushToast("success", isEditing ? "Rendez-vous mis à jour." : "Rendez-vous ajouté.");
      closeDialog();
    } catch {
      pushToast("error", "Erreur réseau pendant l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await persistEvent();
  }

  async function onDelete() {
    if (!editingId) return;
    const ok = window.confirm("Supprimer ce rendez-vous ?");
    if (!ok) return;

    setDeleting(true);
    try {
      const response = await apiFetch(`/api/agenda/${editingId}`, { method: "DELETE" });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Suppression impossible.");
        }
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== editingId));
      notifyAgendaUpdated();
      pushToast("success", "Rendez-vous supprimé.");
      closeDialog();
    } catch {
      pushToast("error", "Erreur réseau pendant la suppression.");
    } finally {
      setDeleting(false);
    }
  }

  const featuredEvent = resolveFeaturedEvent(events);

  return (
    <div className="admin-reveal">
      <div className="admin-tools" style={{ marginBottom: 14 }}>
        <p className="admin-field__hint" style={{ margin: 0 }}>
          {loading
            ? "Chargement du calendrier…"
            : `${events.length} rendez-vous — table « events »`}
        </p>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => void loadEvents()}
          disabled={loading}
        >
          Actualiser
        </button>
      </div>

      {featuredEvent ? (
        <section className="admin-agenda-featured" aria-labelledby="admin-agenda-featured-heading">
          <h3 id="admin-agenda-featured-heading" className="admin-agenda-featured__title">
            Événement mis en avant
          </h3>
          <FeaturedAgendaEventCard
            event={featuredEvent}
            onOpen={(id) => {
              const ev = events.find((e) => e.id === id);
              if (ev) openEdit(ev);
            }}
            className="admin-agenda-featured__card"
          />
        </section>
      ) : null}

      <AdminAgendaCalendar events={events} onDateClick={openCreate} onEventClick={openEdit} />

      <AgendaAdminEventDialog
        open={dialogOpen}
        mode={dialogMode}
        values={form}
        eventStatus={eventStatus}
        onEventStatusChange={(next) => {
          setEventStatus(next);
          if (next === "draft") {
            setNotifySubscribers(false);
            setIsFeatured(false);
            setReminderEnabled(false);
          }
        }}
        notifySubscribers={notifySubscribers}
        onNotifySubscribersChange={setNotifySubscribers}
        isFeatured={isFeatured}
        onIsFeaturedChange={setIsFeatured}
        reminderEnabled={reminderEnabled}
        onReminderEnabledChange={setReminderEnabled}
        reminderSentAt={reminderSentAt}
        saving={saving}
        deleting={deleting}
        onChange={(patch) => setForm((f) => ({ ...f, ...patch }))}
        onClose={closeDialog}
        onSubmit={onSubmit}
        onDelete={dialogMode === "edit" ? () => void onDelete() : undefined}
      />
    </div>
  );
}
