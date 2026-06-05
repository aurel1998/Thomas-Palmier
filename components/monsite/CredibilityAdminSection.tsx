"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { CredibilityItemDto, CredibilityKind } from "../../types/editorial";
import { uploadMediaFile } from "../../lib/uploadClient";

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type CredibilityAdminSectionProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
  kind: CredibilityKind;
  title: string;
  hint: string;
};

export function CredibilityAdminSection({
  apiFetch,
  pushToast,
  kind,
  title,
  hint,
}: CredibilityAdminSectionProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<CredibilityItemDto[]>([]);
  const [name, setName] = useState("");
  const [credTitle, setCredTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [year, setYear] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [initials, setInitials] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [position, setPosition] = useState("100");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const response = await apiFetch(`/api/credibility?kind=${kind}&active_only=0`, {
      cache: "no-store",
    });
    const result = (await response.json()) as { data?: CredibilityItemDto[] };
    setItems(Array.isArray(result.data) ? result.data : []);
  }, [apiFetch, kind]);

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
    setName("");
    setCredTitle("");
    setSubtitle("");
    setYear("");
    setLogoUrl("");
    setInitials("");
    setLinkUrl("");
    setPosition("100");
    setEditingId(null);
  }

  function onEdit(item: CredibilityItemDto) {
    setEditingId(item.id);
    setName(item.name);
    setCredTitle(item.title);
    setSubtitle(item.subtitle);
    setYear(item.year);
    setLogoUrl(item.logo_url);
    setInitials(item.initials);
    setLinkUrl(item.link_url);
    setPosition(String(item.position));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const result = await uploadMediaFile(apiFetch, file, "image");
    if (!result) {
      pushToast("error", "Upload impossible.");
      return null;
    }
    return result.url;
  }

  async function onLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setLogoUrl(url);
        pushToast("success", "Logo uploadé.");
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      pushToast("error", "Nom obligatoire.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        kind,
        name: name.trim(),
        title: credTitle.trim(),
        subtitle: subtitle.trim(),
        year: year.trim(),
        logo_url: logoUrl.trim(),
        initials: initials.trim(),
        link_url: linkUrl.trim(),
        position: Number.isFinite(Number(position)) ? Number(position) : 100,
      };
      const isEditing = Boolean(editingId);
      const response = await apiFetch(isEditing ? `/api/credibility/${editingId}` : "/api/credibility", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) pushToast("error", result.error ?? "Enregistrement impossible.");
        return;
      }
      pushToast("success", isEditing ? "Élément modifié." : "Élément ajouté.");
      resetForm();
      await load();
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Supprimer cet élément ?")) return;
    const response = await apiFetch(`/api/credibility/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      if (response.status !== 401) pushToast("error", result.error ?? "Suppression impossible.");
      return;
    }
    pushToast("success", "Élément supprimé.");
    if (editingId === id) resetForm();
    await load();
  }

  async function onToggleActive(item: CredibilityItemDto) {
    const response = await apiFetch(`/api/credibility/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      if (response.status !== 401) pushToast("error", result.error ?? "Mise à jour impossible.");
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="admin-field__hint">Chargement {title.toLowerCase()}…</p>;
  }

  return (
    <section className="admin-profile-section">
      <h3 className="admin-profile-section__title">{title}</h3>
      <p className="admin-field__hint" style={{ marginBottom: 12 }}>
        {hint}
      </p>

      <form className="admin-form" onSubmit={onSubmit}>
        <div className="admin-field">
          <label htmlFor={`cred-name-${kind}`}>Nom</label>
          <input
            id={`cred-name-${kind}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        {kind === "award" ? (
          <>
            <div className="admin-field">
              <label htmlFor={`cred-title-${kind}`}>Titre récompense</label>
              <input
                id={`cred-title-${kind}`}
                value={credTitle}
                onChange={(e) => setCredTitle(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor={`cred-year-${kind}`}>Année</label>
              <input id={`cred-year-${kind}`} value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="admin-field">
              <label htmlFor={`cred-sub-${kind}`}>Sous-titre</label>
              <input
                id={`cred-sub-${kind}`}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="admin-field">
              <label htmlFor={`cred-logo-${kind}`}>Logo (URL)</label>
              <input
                id={`cred-logo-${kind}`}
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
            <div className="admin-field">
              <label htmlFor={`cred-upload-${kind}`}>Logo (upload)</label>
              <input
                id={`cred-upload-${kind}`}
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                disabled={uploading}
              />
            </div>
            <div className="admin-field">
              <label htmlFor={`cred-init-${kind}`}>Initiales (secours)</label>
              <input
                id={`cred-init-${kind}`}
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                placeholder="Ex. FTV"
              />
            </div>
            <div className="admin-field">
              <label htmlFor={`cred-link-${kind}`}>Lien (optionnel)</label>
              <input
                id={`cred-link-${kind}`}
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://"
              />
            </div>
          </>
        )}
        <div className="admin-field">
          <label htmlFor={`cred-pos-${kind}`}>Position</label>
          <input
            id={`cred-pos-${kind}`}
            type="number"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>
        <div className="admin-formActions">
          <button type="submit" className="admin-btn" disabled={saving || uploading}>
            {saving ? "…" : editingId ? "Mettre à jour" : "Ajouter"}
          </button>
          {editingId ? (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={resetForm}>
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <ul className="admin-list" style={{ marginTop: 14 }}>
        {items.map((item) => (
          <li key={item.id} className="admin-list__item">
            <div className="admin-list__info">
              <p className="admin-list__title">{item.name}</p>
              <p className="admin-list__meta">
                {item.is_active ? "Visible" : "Masqué"}
                {item.year ? ` · ${item.year}` : ""}
                {item.logo_url ? " · logo" : ""}
              </p>
            </div>
            <div className="admin-list__actions">
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => void onToggleActive(item)}
              >
                {item.is_active ? "Masquer" : "Afficher"}
              </button>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onEdit(item)}>
                Modifier
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => void onDelete(item.id)}
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
