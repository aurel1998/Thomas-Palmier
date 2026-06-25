"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { FormEvent } from "react";
import type { PublicationStatus } from "../../lib/publicationStatus";

export type AgendaAdminFormValues = {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
};

type AgendaAdminEventDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  values: AgendaAdminFormValues;
  eventStatus: PublicationStatus;
  onEventStatusChange: (value: PublicationStatus) => void;
  notifySubscribers: boolean;
  onNotifySubscribersChange: (value: boolean) => void;
  isFeatured: boolean;
  onIsFeaturedChange: (value: boolean) => void;
  reminderEnabled: boolean;
  onReminderEnabledChange: (value: boolean) => void;
  reminderSentAt: string | null;
  saving: boolean;
  deleting: boolean;
  onChange: (patch: Partial<AgendaAdminFormValues>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onDelete?: () => void;
};

/**
 * Popup formulaire agenda admin (création / édition).
 */
export function AgendaAdminEventDialog({
  open,
  mode,
  values,
  eventStatus,
  onEventStatusChange,
  notifySubscribers,
  onNotifySubscribersChange,
  isFeatured,
  onIsFeaturedChange,
  reminderEnabled,
  onReminderEnabledChange,
  reminderSentAt,
  saving,
  deleting,
  onChange,
  onClose,
  onSubmit,
  onDelete,
}: AgendaAdminEventDialogProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => titleRef.current?.focus(), 60);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const titleLabel = mode === "edit" ? "Modifier le rendez-vous" : "Nouveau rendez-vous";

  return createPortal(
    <div className="admin-agenda-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-agenda-dialog-title">
      <button type="button" className="admin-agenda-dialog__backdrop" onClick={onClose} aria-label="Fermer" />
      <div className="admin-agenda-dialog__panel">
        <header className="admin-agenda-dialog__head">
          <h2 id="admin-agenda-dialog-title" className="admin-agenda-dialog__title">
            {titleLabel}
          </h2>
          <button type="button" className="admin-agenda-dialog__close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <form className="admin-form admin-agenda-dialog__form" onSubmit={onSubmit}>
          <fieldset className="admin-field admin-agenda-dialog__visibility">
            <legend>Visibilité</legend>
            <div className="admin-agenda-dialog__statusChoices">
              <label className="admin-check admin-agenda-dialog__statusChoice">
                <input
                  type="radio"
                  name="adminAgendaStatus"
                  value="published"
                  checked={eventStatus === "published"}
                  onChange={() => onEventStatusChange("published")}
                />
                <span>
                  <strong>Publié</strong> — visible sur l&apos;accueil et le calendrier public
                </span>
              </label>
              <label className="admin-check admin-agenda-dialog__statusChoice">
                <input
                  type="radio"
                  name="adminAgendaStatus"
                  value="draft"
                  checked={eventStatus === "draft"}
                  onChange={() => onEventStatusChange("draft")}
                />
                <span>
                  <strong>Brouillon</strong> — réservé à l&apos;admin, invisible pour les visiteurs
                </span>
              </label>
            </div>
          </fieldset>

          <div className="admin-field">
            <label htmlFor="adminAgendaTitle">Titre</label>
            <input
              ref={titleRef}
              id="adminAgendaTitle"
              value={values.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Ex. Plateau Ligue 1"
              required
            />
          </div>

          <div className="admin-agenda-dialog__row">
            <div className="admin-field">
              <label htmlFor="adminAgendaDate">Date</label>
              <input
                id="adminAgendaDate"
                type="date"
                value={values.date}
                onChange={(e) => onChange({ date: e.target.value })}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="adminAgendaTime">Heure</label>
              <input
                id="adminAgendaTime"
                type="time"
                value={values.time}
                onChange={(e) => onChange({ time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="admin-field">
            <label htmlFor="adminAgendaLocation">Lieu</label>
            <input
              id="adminAgendaLocation"
              value={values.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="RMC Sport, Paris, En ligne…"
            />
          </div>

          <div className="admin-field">
            <label htmlFor="adminAgendaDescription">Description</label>
            <textarea
              id="adminAgendaDescription"
              rows={4}
              value={values.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Détail du rendez-vous affiché sur le site"
              required
            />
          </div>

          <div className="admin-field">
            <label className="admin-check" htmlFor="adminAgendaNotify">
              <input
                id="adminAgendaNotify"
                type="checkbox"
                checked={notifySubscribers}
                disabled={eventStatus !== "published"}
                onChange={(e) => onNotifySubscribersChange(e.target.checked)}
              />
              <span>Informer les abonnés par e-mail</span>
            </label>
            <p className="admin-field__hint">
              {eventStatus !== "published"
                ? "Passez le rendez-vous en « Publié » pour envoyer une notification aux abonnés actifs."
                : mode === "edit"
                  ? "En modification, l'email part uniquement si la date a changé."
                  : "Envoie un email aux abonnés actifs à l'enregistrement de ce rendez-vous."}
            </p>
          </div>

          <div className="admin-field">
            <label className="admin-check" htmlFor="adminAgendaFeatured">
              <input
                id="adminAgendaFeatured"
                type="checkbox"
                checked={isFeatured}
                disabled={eventStatus !== "published"}
                onChange={(e) => onIsFeaturedChange(e.target.checked)}
              />
              <span>Mettre en avant</span>
            </label>
            <p className="admin-field__hint">
              {eventStatus !== "published"
                ? "Disponible une fois le rendez-vous publié."
                : "Affiché en haut du calendrier admin et sur l'accueil. Un seul événement à la fois."}
            </p>
          </div>

          <div className="admin-field">
            <label className="admin-check" htmlFor="adminAgendaReminder">
              <input
                id="adminAgendaReminder"
                type="checkbox"
                checked={reminderEnabled}
                disabled={eventStatus !== "published"}
                onChange={(e) => onReminderEnabledChange(e.target.checked)}
              />
              <span>Envoyer un rappel 24 h avant</span>
            </label>
            <p className="admin-field__hint">
              {eventStatus !== "published"
                ? "Disponible une fois le rendez-vous publié."
                : "Email automatique aux abonnés actifs la veille du rendez-vous (cron horaire sur le serveur)."}
            </p>
            {eventStatus === "published" && reminderSentAt ? (
              <p className="admin-field__hint" style={{ marginTop: 6 }}>
                Rappel déjà envoyé le{" "}
                {new Intl.DateTimeFormat("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(reminderSentAt))}
                . Modifier la date pour reprogrammer.
              </p>
            ) : null}
          </div>

          <div className="admin-agenda-dialog__actions">
            {mode === "edit" && onDelete ? (
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={onDelete}
                disabled={saving || deleting}
              >
                {deleting ? (
                  <>
                    <span className="admin-loader" aria-hidden="true" />
                    Suppression…
                  </>
                ) : (
                  "Supprimer"
                )}
              </button>
            ) : null}
            <div className="admin-agenda-dialog__actionsRight">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} disabled={saving || deleting}>
                Annuler
              </button>
              <button type="submit" className="admin-btn" disabled={saving || deleting}>
                {saving ? (
                  <>
                    <span className="admin-loader" aria-hidden="true" />
                    Enregistrement…
                  </>
                ) : mode === "edit" ? (
                  "Enregistrer"
                ) : (
                  "Sauvegarder"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
