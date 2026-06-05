"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Content } from "../../types/content";
import { sanitizeNewsletterHtml } from "../../lib/sanitizeHtml";
import {
  NewsletterPreviewDialog,
  type NewsletterPreviewData,
} from "./NewsletterPreviewDialog";

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type SubscriberDto = {
  id: string;
  email: string;
  fullName: string | null;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
};

type CampaignDto = {
  id: string;
  kind: "campaign" | "content" | "agenda" | "reminder";
  subject: string;
  referenceId: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  sentAt: string;
};

type CampaignStats = {
  total: number;
  emailsSent: number;
  emailsFailed: number;
  last: CampaignDto | null;
};

type SubscribersResponse = {
  data?: SubscriberDto[];
  stats?: { total: number; active: number; inactive: number; unsubscribed: number };
  campaigns?: CampaignStats;
  recentCampaigns?: CampaignDto[];
  mailer?: { configured: boolean; from: string };
  error?: string;
};

type SendResult = {
  data?: { total: number; sent: number; failed: number };
  error?: string;
};

type NewsletterAdminPanelProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("fr-FR");

const CAMPAIGN_KIND_LABEL: Record<CampaignDto["kind"], string> = {
  campaign: "Campagne libre",
  content: "Annonce contenu",
  agenda: "Agenda",
  reminder: "Rappel 24 h",
};

type StatKpi = {
  id: string;
  label: string;
  value: number | string;
  tone: "active" | "inactive" | "campaigns" | "sent" | "failed";
};

function StatKpiCard({ item, loading }: { item: StatKpi; loading: boolean }) {
  return (
    <article className={`admin-newsletter__kpi admin-newsletter__kpi--${item.tone}`}>
      <p className="admin-newsletter__kpiLabel">{item.label}</p>
      {loading ? (
        <span className="admin-skeleton admin-skeleton--value" aria-hidden="true" />
      ) : (
        <p className="admin-newsletter__kpiValue">{item.value}</p>
      )}
    </article>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Texte brut → paragraphes HTML pour l’envoi campagne. */
function bodyToHtml(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return sanitizeNewsletterHtml(trimmed);
  return trimmed
    .split(/\n\n+/)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#333">${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
}

/**
 * Gestion newsletter : statut SMTP, liste d’abonnés, campagne libre, notification par contenu.
 */
export function NewsletterAdminPanel({ apiFetch, pushToast }: NewsletterAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<SubscriberDto[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, unsubscribed: 0 });
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    total: 0,
    emailsSent: 0,
    emailsFailed: 0,
    last: null,
  });
  const [recentCampaigns, setRecentCampaigns] = useState<CampaignDto[]>([]);
  const [mailerConfigured, setMailerConfigured] = useState(false);
  const [mailFrom, setMailFrom] = useState("");

  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [sendingCampaign, setSendingCampaign] = useState(false);

  const [contents, setContents] = useState<Content[]>([]);
  const [notifyContentId, setNotifyContentId] = useState("");
  const [sendingNotify, setSendingNotify] = useState(false);

  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<NewsletterPreviewData | null>(null);

  const loadSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/newsletter/subscribers", { cache: "no-store" });
      const result = (await response.json()) as SubscribersResponse;
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Impossible de charger les abonnés.");
        }
        return;
      }
      setSubscribers(Array.isArray(result.data) ? result.data : []);
      if (result.stats) {
        setStats({
          total: result.stats.total,
          active: result.stats.active,
          inactive: result.stats.inactive,
          unsubscribed: result.stats.unsubscribed ?? result.stats.inactive,
        });
      }
      if (result.campaigns) setCampaignStats(result.campaigns);
      setRecentCampaigns(Array.isArray(result.recentCampaigns) ? result.recentCampaigns : []);
      setMailerConfigured(Boolean(result.mailer?.configured));
      setMailFrom(result.mailer?.from ?? "");
    } catch {
      pushToast("error", "Erreur réseau (abonnés).");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, pushToast]);

  const loadContents = useCallback(async () => {
    try {
      const response = await apiFetch("/api/content?include_drafts=1", { cache: "no-store" });
      const result = (await response.json()) as { data?: Content[] };
      if (response.ok && Array.isArray(result.data)) {
        const published = result.data.filter((c) => c.status === "published");
        setContents(published);
        if (published[0]) {
          setNotifyContentId((prev) => prev || published[0].id);
        }
      }
    } catch {
      /* optionnel */
    }
  }, [apiFetch]);

  useEffect(() => {
    void loadSubscribers();
    void loadContents();
  }, [loadSubscribers, loadContents]);

  const filteredSubscribers = useMemo(() => {
    if (filter === "active") return subscribers.filter((s) => s.isActive);
    if (filter === "inactive") return subscribers.filter((s) => !s.isActive);
    return subscribers;
  }, [subscribers, filter]);

  async function openPreview(payload: { contentId: string } | { subject: string; html: string }) {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const response = await apiFetch("/api/newsletter/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        data?: NewsletterPreviewData;
        error?: string;
      };
      if (!response.ok) {
        setPreviewOpen(false);
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Aperçu impossible.");
        }
        return;
      }
      if (result.data) setPreviewData(result.data);
    } catch {
      setPreviewOpen(false);
      pushToast("error", "Erreur réseau (aperçu).");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function onPreviewCampaign() {
    const subject = campaignSubject.trim();
    const html = bodyToHtml(campaignBody);
    if (!subject || !html) {
      pushToast("error", "Sujet et message sont obligatoires pour prévisualiser.");
      return;
    }
    await openPreview({ subject, html });
  }

  async function onPreviewContent() {
    if (!notifyContentId) {
      pushToast("error", "Choisissez un contenu à prévisualiser.");
      return;
    }
    await openPreview({ contentId: notifyContentId });
  }

  async function onSendCampaign(e: FormEvent) {
    e.preventDefault();
    if (!mailerConfigured) {
      pushToast("error", "SMTP non configuré sur le serveur (.env).");
      return;
    }
    const subject = campaignSubject.trim();
    const html = bodyToHtml(campaignBody);
    if (!subject || !html) {
      pushToast("error", "Sujet et message sont obligatoires.");
      return;
    }
    if (stats.active === 0) {
      pushToast("info", "Aucun abonné actif à notifier.");
      return;
    }
    if (!window.confirm(`Envoyer cette campagne à ${stats.active} abonné(s) actif(s) ?`)) return;

    setSendingCampaign(true);
    try {
      const response = await apiFetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html }),
      });
      const result = (await response.json()) as SendResult;
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Envoi impossible.");
        }
        return;
      }
      const sent = result.data?.sent ?? 0;
      const failed = result.data?.failed ?? 0;
      pushToast(
        failed > 0 ? "info" : "success",
        `Campagne envoyée : ${sent} réussi(s), ${failed} échec(s).`
      );
      setCampaignSubject("");
      setCampaignBody("");
      await loadSubscribers();
    } catch {
      pushToast("error", "Erreur réseau pendant l'envoi.");
    } finally {
      setSendingCampaign(false);
    }
  }

  async function onNotifyContent() {
    if (!mailerConfigured) {
      pushToast("error", "SMTP non configuré sur le serveur (.env).");
      return;
    }
    if (!notifyContentId) {
      pushToast("error", "Choisissez un contenu à annoncer.");
      return;
    }
    if (stats.active === 0) {
      pushToast("info", "Aucun abonné actif.");
      return;
    }
    const item = contents.find((c) => c.id === notifyContentId);
    if (!window.confirm(`Notifier ${stats.active} abonné(s) pour « ${item?.title ?? "ce contenu"} » ?`)) {
      return;
    }

    setSendingNotify(true);
    try {
      const response = await apiFetch("/api/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: notifyContentId }),
      });
      const result = (await response.json()) as SendResult;
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Notification impossible.");
        }
        return;
      }
      const sent = result.data?.sent ?? 0;
      const failed = result.data?.failed ?? 0;
      pushToast(
        failed > 0 ? "info" : "success",
        `Notification envoyée : ${sent} réussi(s), ${failed} échec(s).`
      );
      await loadSubscribers();
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSendingNotify(false);
    }
  }

  async function toggleSubscriber(sub: SubscriberDto) {
    setTogglingId(sub.id);
    try {
      const response = await apiFetch("/api/newsletter/subscribers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sub.id, isActive: !sub.isActive }),
      });
      const result = (await response.json()) as { data?: SubscriberDto; error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Mise à jour impossible.");
        }
        return;
      }
      if (result.data) {
        await loadSubscribers();
      }
      pushToast("success", sub.isActive ? "Abonné désactivé." : "Abonné réactivé.");
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setTogglingId(null);
    }
  }

  const lastCampaign = campaignStats.last;
  const deliveryRate =
    campaignStats.emailsSent + campaignStats.emailsFailed > 0
      ? Math.round(
          (campaignStats.emailsSent /
            (campaignStats.emailsSent + campaignStats.emailsFailed)) *
            100
        )
      : null;

  const kpis: StatKpi[] = [
    { id: "active", label: "Abonnés actifs", value: stats.active, tone: "active" },
    {
      id: "inactive",
      label: "Désinscrits",
      value: stats.unsubscribed,
      tone: "inactive",
    },
    {
      id: "campaigns",
      label: "Campagnes totales",
      value: campaignStats.total,
      tone: "campaigns",
    },
    {
      id: "sent",
      label: "Emails envoyés",
      value: numberFormatter.format(campaignStats.emailsSent),
      tone: "sent",
    },
    {
      id: "failed",
      label: "Emails échoués",
      value: numberFormatter.format(campaignStats.emailsFailed),
      tone: "failed",
    },
  ];

  return (
    <div className="admin-reveal admin-newsletter">
      <header className="admin-newsletter__head">
        <div>
          <p className="admin-newsletter__eyebrow">Performances</p>
          <h2 className="admin-newsletter__title">Newsletter</h2>
          <p className="admin-newsletter__subtitle">
            Suivi des abonnés et des envois — campagnes libres, annonces de contenus et
            notifications agenda.
          </p>
        </div>
        <div className="admin-newsletter__mailer">
          <span
            className={`admin-newsletter__mailerBadge${mailerConfigured ? " admin-newsletter__mailerBadge--ok" : ""}`}
          >
            SMTP {mailerConfigured ? "configuré" : "non configuré"}
          </span>
          {mailerConfigured ? (
            <p className="admin-newsletter__mailerMeta">Expéditeur : {mailFrom}</p>
          ) : (
            <p className="admin-field__hint" style={{ margin: "6px 0 0", maxWidth: "32ch" }}>
              Renseigne <code>EMAIL_USER</code>, <code>EMAIL_PASS</code>, <code>SMTP_HOST</code> et{" "}
              <code>SMTP_PORT</code> dans <code>.env</code>.
            </p>
          )}
        </div>
      </header>

      <div className="admin-newsletter__kpis" aria-label="Statistiques newsletter">
        {kpis.map((item) => (
          <StatKpiCard key={item.id} item={item} loading={loading} />
        ))}
      </div>

      <section className="admin-newsletter__last" aria-labelledby="newsletter-last-campaign">
        <div className="admin-newsletter__sectionHead">
          <h3 id="newsletter-last-campaign" className="admin-newsletter__sectionTitle">
            Dernière campagne
          </h3>
          {deliveryRate !== null ? (
            <span className="admin-newsletter__rate">
              Taux de livraison global : {deliveryRate} %
            </span>
          ) : null}
        </div>
        {loading ? (
          <div className="admin-newsletter__lastCard admin-newsletter__lastCard--loading">
            <span className="admin-skeleton admin-skeleton--line" aria-hidden="true" />
            <span className="admin-skeleton admin-skeleton--line" aria-hidden="true" />
          </div>
        ) : lastCampaign ? (
          <article className="admin-newsletter__lastCard">
            <div className="admin-newsletter__lastMain">
              <span className="admin-newsletter__lastKind">
                {CAMPAIGN_KIND_LABEL[lastCampaign.kind]}
              </span>
              <p className="admin-newsletter__lastSubject">{lastCampaign.subject}</p>
              <p className="admin-newsletter__lastMeta">
                {dateFormatter.format(new Date(lastCampaign.sentAt))}
              </p>
            </div>
            <dl className="admin-newsletter__lastStats">
              <div>
                <dt>Destinataires</dt>
                <dd>{lastCampaign.totalRecipients}</dd>
              </div>
              <div>
                <dt>Envoyés</dt>
                <dd className="admin-newsletter__lastStats--ok">{lastCampaign.sentCount}</dd>
              </div>
              <div>
                <dt>Échecs</dt>
                <dd
                  className={
                    lastCampaign.failedCount > 0
                      ? "admin-newsletter__lastStats--fail"
                      : undefined
                  }
                >
                  {lastCampaign.failedCount}
                </dd>
              </div>
            </dl>
          </article>
        ) : (
          <p className="admin-field__hint" style={{ margin: 0 }}>
            Aucune campagne enregistrée pour le moment. Les prochains envois apparaîtront ici.
          </p>
        )}
      </section>

      {recentCampaigns.length > 1 ? (
        <section className="admin-newsletter__history" aria-labelledby="newsletter-campaign-history">
          <h3 id="newsletter-campaign-history" className="admin-newsletter__sectionTitle">
            Historique des envois
          </h3>
          <ul className="admin-list" role="list">
            {recentCampaigns.map((campaign) => (
              <li key={campaign.id} className="admin-list__item">
                <div className="admin-list__info">
                  <div className="admin-list__row">
                    <p className="admin-list__title">{campaign.subject}</p>
                    <span className="admin-list__tag">{CAMPAIGN_KIND_LABEL[campaign.kind]}</span>
                  </div>
                  <p className="admin-list__meta">
                    {dateFormatter.format(new Date(campaign.sentAt))} — {campaign.sentCount} envoyé(s)
                    {campaign.failedCount > 0 ? `, ${campaign.failedCount} échec(s)` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="admin-field__hint" style={{ marginBottom: 16 }}>
        Le formulaire public est en bas de la page d&apos;accueil. Les emails aux abonnés ne partent que
        si vous cochez « Informer les abonnés » à la publication d&apos;un contenu ou d&apos;un rendez-vous
        agenda (ou via les actions ci-dessous).
      </p>

      <div className="admin-card" style={{ marginBottom: 20 }}>
        <p className="admin-card__label">Notifier un contenu existant</p>
        <div className="admin-tools" style={{ marginTop: 12, flexWrap: "wrap", gap: 12 }}>
          <div className="admin-field" style={{ minWidth: 220, flex: "1 1 240px" }}>
          <select
            value={notifyContentId}
            onChange={(e) => setNotifyContentId(e.target.value)}
            disabled={!contents.length || sendingNotify}
            aria-label="Contenu à annoncer"
          >
            {contents.length === 0 ? (
              <option value="">Aucun contenu publié</option>
            ) : (
              contents.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))
            )}
          </select>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={!notifyContentId || sendingNotify || previewLoading}
            onClick={() => void onPreviewContent()}
          >
            Prévisualiser
          </button>
          <button
            type="button"
            className="admin-btn"
            disabled={!notifyContentId || sendingNotify || !mailerConfigured}
            onClick={() => void onNotifyContent()}
          >
            {sendingNotify ? "Envoi…" : "Notifier les abonnés"}
          </button>
        </div>
      </div>

      <form className="admin-form admin-card" onSubmit={onSendCampaign} style={{ marginBottom: 24 }}>
        <p className="admin-card__label">Campagne libre</p>
        <div className="admin-field" style={{ marginTop: 12 }}>
          <label htmlFor="newsletter-campaign-subject">Sujet</label>
          <input
            id="newsletter-campaign-subject"
            value={campaignSubject}
            onChange={(e) => setCampaignSubject(e.target.value)}
            placeholder="Ex. Nouvelle enquête publiée"
            disabled={sendingCampaign}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="newsletter-campaign-body">Message</label>
          <textarea
            id="newsletter-campaign-body"
            rows={8}
            value={campaignBody}
            onChange={(e) => setCampaignBody(e.target.value)}
            placeholder="Texte brut ou HTML simple. Les paragraphes vides séparent les blocs."
            disabled={sendingCampaign}
          />
          <p className="admin-field__hint">
            Envoyé à tous les abonnés <strong>actifs</strong> ({stats.active}). Lien de désinscription
            ajouté automatiquement.
          </p>
        </div>
        <div className="admin-formActions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            disabled={sendingCampaign || previewLoading}
            onClick={() => void onPreviewCampaign()}
          >
            Prévisualiser
          </button>
          <button
            type="submit"
            className="admin-btn"
            disabled={sendingCampaign || !mailerConfigured || stats.active === 0}
          >
            {sendingCampaign ? "Envoi en cours…" : "Envoyer la campagne"}
          </button>
        </div>
      </form>

      <NewsletterPreviewDialog
        open={previewOpen}
        loading={previewLoading}
        preview={previewData}
        onClose={() => setPreviewOpen(false)}
      />

      <div className="admin-tools" style={{ marginBottom: 12 }}>
        <p className="admin-field__hint" style={{ margin: 0 }}>
          {loading
            ? "Chargement des abonnés…"
            : `${filteredSubscribers.length} affiché(s) sur ${stats.total}`}
        </p>
        <div className="admin-tools" style={{ gap: 8 }}>
          <div className="admin-field">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as "all" | "active" | "inactive")}
            aria-label="Filtrer les abonnés"
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Désinscrits</option>
          </select>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => void loadSubscribers()}
            disabled={loading}
          >
            Actualiser
          </button>
        </div>
      </div>

      {filteredSubscribers.length === 0 && !loading ? (
        <p className="admin-field__hint">Aucun abonné pour ce filtre.</p>
      ) : (
        <ul className="admin-list" role="list">
          {filteredSubscribers.map((sub) => (
            <li key={sub.id} className="admin-list__item">
              <div className="admin-list__info">
                <div className="admin-list__row">
                  <p className="admin-list__title">{sub.email}</p>
                  <span className="admin-list__tag" style={sub.isActive ? undefined : { opacity: 0.55 }}>
                    {sub.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>
                <p className="admin-list__meta">
                  Inscrit le {dateFormatter.format(new Date(sub.subscribedAt))}
                  {sub.fullName ? ` — ${sub.fullName}` : ""}
                </p>
              </div>
              <div className="admin-list__actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost"
                  disabled={togglingId === sub.id}
                  onClick={() => void toggleSubscriber(sub)}
                >
                  {togglingId === sub.id
                    ? "…"
                    : sub.isActive
                      ? "Désactiver"
                      : "Réactiver"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
