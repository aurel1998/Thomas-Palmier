"use client";

import { useCallback, useEffect, useState } from "react";
import type { Content, ContentType } from "../../types/content";
import { publicationStatusLabel } from "../../lib/publicationStatus";

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type DashboardData = {
  stats: {
    contentsTotal: number;
    videos: number;
    articles: number;
    audios: number;
    subscribersActive: number;
    upcomingEvents: number;
  };
  featured: Content | null;
  recentContents: Content[];
  recentSubscribers: {
    id: string;
    email: string;
    fullName: string | null;
    isActive: boolean;
    subscribedAt: string;
  }[];
};

type DashboardAdminPanelProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
  onEditContent: (content: Content) => void;
  onOpenTab: (tab: "publier" | "contenus" | "newsletter" | "agenda") => void;
};

const typeLabels: Record<ContentType, string> = {
  video: "Vidéo",
  article: "Publication",
  audio: "Audio",
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type KpiItem = {
  id: string;
  label: string;
  value: number | string;
  tone: "total" | "video" | "article" | "audio" | "newsletter" | "agenda";
};

function KpiCard({ item, loading }: { item: KpiItem; loading: boolean }) {
  return (
    <article className={`admin-dashboard__kpi admin-dashboard__kpi--${item.tone}`}>
      <p className="admin-dashboard__kpiLabel">{item.label}</p>
      {loading ? (
        <span className="admin-skeleton admin-skeleton--value" aria-hidden="true" />
      ) : (
        <p className="admin-dashboard__kpiValue">{item.value}</p>
      )}
    </article>
  );
}

/**
 * Tableau de bord admin — vue d'ensemble du site.
 */
export function DashboardAdminPanel({
  apiFetch,
  pushToast,
  onEditContent,
  onOpenTab,
}: DashboardAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/dashboard", { cache: "no-store" });
      const result = (await response.json()) as { data?: DashboardData; error?: string };
      if (!response.ok) {
        if (response.status !== 401) {
          pushToast("error", result.error ?? "Impossible de charger le dashboard.");
        }
        return;
      }
      if (result.data) setData(result.data);
    } catch {
      pushToast("error", "Erreur réseau (dashboard).");
    } finally {
      setLoading(false);
    }
  }, [apiFetch, pushToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = data?.stats;
  const kpis: KpiItem[] = [
    { id: "total", label: "Contenus", value: stats?.contentsTotal ?? 0, tone: "total" },
    { id: "video", label: "Vidéos", value: stats?.videos ?? 0, tone: "video" },
    { id: "article", label: "Publications", value: stats?.articles ?? 0, tone: "article" },
    { id: "audio", label: "Audios", value: stats?.audios ?? 0, tone: "audio" },
    { id: "newsletter", label: "Abonnés actifs", value: stats?.subscribersActive ?? 0, tone: "newsletter" },
    { id: "agenda", label: "Événements à venir", value: stats?.upcomingEvents ?? 0, tone: "agenda" },
  ];

  const featured = data?.featured ?? null;
  const recentContents = data?.recentContents ?? [];
  const recentSubscribers = data?.recentSubscribers ?? [];

  return (
    <div className="admin-dashboard admin-reveal">
      <header className="admin-dashboard__head">
        <div>
          <p className="admin-dashboard__eyebrow">Administration</p>
          <h2 className="admin-dashboard__title">Vue d&apos;ensemble</h2>
          <p className="admin-dashboard__subtitle">
            Contenus, newsletter et agenda — état du site en un coup d&apos;œil.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Actualisation…" : "Actualiser"}
        </button>
      </header>

      <section className="admin-dashboard__kpis" aria-label="Indicateurs clés">
        {kpis.map((item) => (
          <KpiCard key={item.id} item={item} loading={loading} />
        ))}
      </section>

      <section className="admin-dashboard__featured" aria-labelledby="dashboard-featured-heading">
        <div className="admin-dashboard__sectionHead">
          <h3 id="dashboard-featured-heading" className="admin-dashboard__sectionTitle">
            À la une
          </h3>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onOpenTab("publier")}>
            Publier
          </button>
        </div>

        {loading ? (
          <div className="admin-dashboard__featuredCard admin-dashboard__featuredCard--loading">
            <span className="admin-skeleton admin-skeleton--thumb" aria-hidden="true" />
            <div className="admin-dashboard__featuredBody">
              <span className="admin-skeleton admin-skeleton--line" aria-hidden="true" />
              <span className="admin-skeleton admin-skeleton--line short" aria-hidden="true" />
            </div>
          </div>
        ) : featured ? (
          <article className="admin-dashboard__featuredCard">
            {featured.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="admin-dashboard__featuredImg"
                src={featured.image_url}
                alt=""
                loading="lazy"
              />
            ) : (
              <div className="admin-dashboard__featuredPlaceholder" aria-hidden="true">
                {typeLabels[featured.type]}
              </div>
            )}
            <div className="admin-dashboard__featuredBody">
              <span className={`admin-typeBadge admin-typeBadge--${featured.type}`}>
                {typeLabels[featured.type]}
              </span>
              <h4 className="admin-dashboard__featuredTitle">{featured.title}</h4>
              <p className="admin-dashboard__featuredMeta">
                Publié le {dateFormatter.format(new Date(featured.created_at))}
              </p>
              <button
                type="button"
                className="admin-btn"
                onClick={() => onEditContent(featured)}
              >
                Modifier
              </button>
            </div>
          </article>
        ) : (
          <p className="admin-field__hint">
            Aucun contenu publié n&apos;est mis en avant. Activez « Mettre à la une » dans l&apos;onglet{" "}
            <strong>Publier</strong>.
          </p>
        )}
      </section>

      <div className="admin-dashboard__columns">
        <section className="admin-dashboard__panel" aria-labelledby="dashboard-recent-contents">
          <div className="admin-dashboard__sectionHead">
            <h3 id="dashboard-recent-contents" className="admin-dashboard__sectionTitle">
              Derniers contenus publiés
            </h3>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onOpenTab("contenus")}>
              Tout voir
            </button>
          </div>

          {loading ? (
            <ul className="admin-dashboard__list" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="admin-dashboard__listItem">
                  <span className="admin-skeleton admin-skeleton--line" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ) : recentContents.length === 0 ? (
            <p className="admin-field__hint">Aucun contenu publié pour le moment.</p>
          ) : (
            <ul className="admin-dashboard__list">
              {recentContents.map((item) => (
                <li key={item.id} className="admin-dashboard__listItem">
                  <button
                    type="button"
                    className="admin-dashboard__listBtn"
                    onClick={() => onEditContent(item)}
                  >
                    <span className={`admin-typeBadge admin-typeBadge--${item.type}`}>
                      {typeLabels[item.type]}
                    </span>
                    <span className="admin-dashboard__listTitle">{item.title}</span>
                    <time className="admin-dashboard__listMeta" dateTime={item.created_at}>
                      {dateFormatter.format(new Date(item.created_at))}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="admin-dashboard__panel" aria-labelledby="dashboard-recent-subscribers">
          <div className="admin-dashboard__sectionHead">
            <h3 id="dashboard-recent-subscribers" className="admin-dashboard__sectionTitle">
              Derniers abonnés
            </h3>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onOpenTab("newsletter")}>
              Newsletter
            </button>
          </div>

          {loading ? (
            <ul className="admin-dashboard__list" aria-busy="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="admin-dashboard__listItem">
                  <span className="admin-skeleton admin-skeleton--line" aria-hidden="true" />
                </li>
              ))}
            </ul>
          ) : recentSubscribers.length === 0 ? (
            <p className="admin-field__hint">Aucun abonné pour le moment.</p>
          ) : (
            <ul className="admin-dashboard__list">
              {recentSubscribers.map((sub) => (
                <li key={sub.id} className="admin-dashboard__listItem">
                  <div className="admin-dashboard__subscriber">
                    <p className="admin-dashboard__subscriberEmail">{sub.email}</p>
                    <p className="admin-dashboard__listMeta">
                      {dateTimeFormatter.format(new Date(sub.subscribedAt))}
                      {sub.fullName ? ` — ${sub.fullName}` : ""}
                    </p>
                    <span
                      className={`admin-statusBadge ${sub.isActive ? "admin-statusBadge--published" : "admin-statusBadge--draft"}`}
                    >
                      {sub.isActive ? "Actif" : "Inactif"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="admin-dashboard__footnote admin-field__hint">
        Les compteurs contenus incluent les brouillons. Les listes et l&apos;événement à la une ne montrent que le
        contenu <strong>{publicationStatusLabel("published").toLowerCase()}</strong>.
      </p>
    </div>
  );
}
