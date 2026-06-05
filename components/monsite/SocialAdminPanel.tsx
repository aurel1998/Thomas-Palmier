"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { SocialLinkDto } from "../../types/editorial";

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type SocialAdminPanelProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
  embedded?: boolean;
};

export function SocialAdminPanel({ apiFetch, pushToast, embedded = false }: SocialAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<SocialLinkDto[]>([]);
  const [platform, setPlatform] = useState("youtube");
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [position, setPosition] = useState("100");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await apiFetch("/api/social-links?active_only=0", { cache: "no-store" });
    const result = (await response.json()) as { data?: SocialLinkDto[]; error?: string };
    if (!response.ok) {
      if (response.status !== 401) pushToast("error", result.error ?? "Impossible de charger les liens.");
      return;
    }
    setLinks(Array.isArray(result.data) ? result.data : []);
  }, [apiFetch, pushToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  function resetForm() {
    setPlatform("youtube");
    setLabel("");
    setUrl("");
    setPosition("100");
    setEditingId(null);
  }

  function onEdit(link: SocialLinkDto) {
    setEditingId(link.id);
    setPlatform(link.platform);
    setLabel(link.label);
    setUrl(link.url);
    setPosition(String(link.position));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!label.trim() || !url.trim()) {
      pushToast("error", "Libellé et URL obligatoires.");
      return;
    }
    setSaving(true);
    try {
      const isEditing = Boolean(editingId);
      const response = await apiFetch(isEditing ? `/api/social-links/${editingId}` : "/api/social-links", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platform.trim(),
          label: label.trim(),
          url: url.trim(),
          position: Number.isFinite(Number(position)) ? Number(position) : 100,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) pushToast("error", result.error ?? "Enregistrement impossible.");
        return;
      }
      pushToast("success", isEditing ? "Lien modifié." : "Lien ajouté.");
      resetForm();
      void load();
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function onToggleActive(link: SocialLinkDto) {
    const response = await apiFetch(`/api/social-links/${link.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !link.is_active }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      if (response.status !== 401) pushToast("error", result.error ?? "Mise à jour impossible.");
      return;
    }
    void load();
  }

  async function onDelete(id: string) {
    if (!window.confirm("Supprimer ce lien ?")) return;
    const response = await apiFetch(`/api/social-links/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      if (response.status !== 401) pushToast("error", result.error ?? "Suppression impossible.");
      return;
    }
    pushToast("success", "Lien supprimé.");
    if (editingId === id) resetForm();
    void load();
  }

  if (loading) return <p className="admin-field__hint">Chargement…</p>;

  const Wrapper = embedded ? "div" : "div";
  const wrapperClass = embedded ? "" : "admin-reveal";

  return (
    <Wrapper className={wrapperClass || undefined}>
      {!embedded ? (
        <p className="admin-field__hint" style={{ marginBottom: 16 }}>
          Gérez les liens réseaux sociaux affichés dans le header et le pied de page.
        </p>
      ) : null}

      <form className="admin-form" onSubmit={onSubmit}>
        <div className="admin-field">
          <label htmlFor="socialPlatform">Plateforme (id technique)</label>
          <select id="socialPlatform" value={platform} onChange={(e) => setPlatform(e.target.value)}>
            <option value="youtube">youtube</option>
            <option value="linkedin">linkedin</option>
            <option value="instagram">instagram</option>
            <option value="facebook">facebook</option>
            <option value="x">x</option>
            <option value="tiktok">tiktok</option>
            <option value="other">other</option>
          </select>
        </div>
        <div className="admin-field">
          <label htmlFor="socialLabel">Libellé</label>
          <input id="socialLabel" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="socialUrl">URL</label>
          <input id="socialUrl" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="admin-field">
          <label htmlFor="socialPosition">Position</label>
          <input id="socialPosition" type="number" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div className="admin-formActions">
          <button type="submit" className="admin-btn" disabled={saving}>
            {editingId ? "Mettre à jour" : "Ajouter lien"}
          </button>
          {editingId ? (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={resetForm}>
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <div className="admin-list" style={{ marginTop: 16 }}>
        {links.map((link) => (
          <article key={link.id} className="admin-list__item">
            <div className="admin-list__info">
              <div className="admin-list__row">
                <span className="admin-typeBadge">{link.platform}</span>
                {!link.is_active ? <span className="admin-list__tag">Masqué</span> : null}
              </div>
              <p className="admin-list__title">{link.label}</p>
              <p className="admin-list__meta">{link.url}</p>
            </div>
            <div className="admin-list__actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onEdit(link)}>
                Modifier
              </button>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void onToggleActive(link)}>
                {link.is_active ? "Masquer" : "Afficher"}
              </button>
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => void onDelete(link.id)}>
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </Wrapper>
  );
}
