"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Category } from "../../types/category";
import type { SiteSettingsDto } from "../../types/editorial";

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type SiteSettingsAdminPanelProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
};

export function SiteSettingsAdminPanel({ apiFetch, pushToast }: SiteSettingsAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<SiteSettingsDto | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [catDescriptions, setCatDescriptions] = useState<Record<string, string>>({});
  const [savingCatId, setSavingCatId] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    const response = await apiFetch("/api/site-settings", { cache: "no-store" });
    const result = (await response.json()) as { data?: SiteSettingsDto; error?: string };
    if (!response.ok) {
      if (response.status !== 401) pushToast("error", result.error ?? "Impossible de charger les textes.");
      return;
    }
    if (result.data) setForm(result.data);
  }, [apiFetch, pushToast]);

  const loadCategories = useCallback(async () => {
    const response = await apiFetch("/api/categories", { cache: "no-store" });
    const result = (await response.json()) as { data?: Category[]; error?: string };
    if (!response.ok) {
      if (response.status !== 401) pushToast("error", result.error ?? "Impossible de charger les catégories.");
      return;
    }
    const list = Array.isArray(result.data) ? result.data : [];
    setCategories(list);
    const desc: Record<string, string> = {};
    for (const c of list) desc[c.id] = c.description ?? "";
    setCatDescriptions(desc);
  }, [apiFetch, pushToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadSettings(), loadCategories()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadSettings, loadCategories]);

  function updateField<K extends keyof SiteSettingsDto>(key: K, value: SiteSettingsDto[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const response = await apiFetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) pushToast("error", result.error ?? "Enregistrement impossible.");
        return;
      }
      pushToast("success", "Textes du site enregistrés.");
      void loadSettings();
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveCategoryDescription(categoryId: string, name: string) {
    setSavingCatId(categoryId);
    try {
      const response = await apiFetch(`/api/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: catDescriptions[categoryId] ?? "" }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) pushToast("error", result.error ?? "Mise à jour impossible.");
        return;
      }
      pushToast("success", `Description « ${name} » enregistrée.`);
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSavingCatId(null);
    }
  }

  if (loading || !form) {
    return <p className="admin-field__hint">Chargement des textes…</p>;
  }

  const fields: { key: keyof SiteSettingsDto; label: string; rows?: number }[] = [
    { key: "footer_tagline", label: "Pied de page — accroche" },
    { key: "newsletter_eyebrow", label: "Newsletter — surtitre" },
    { key: "newsletter_title", label: "Newsletter — titre" },
    { key: "home_about_eyebrow", label: "Accueil — surtitre bloc À propos" },
    { key: "home_about_title", label: "Accueil — titre bloc À propos" },
    { key: "contact_intro", label: "Contact — introduction", rows: 3 },
    { key: "contact_role", label: "Contact — rôle affiché" },
    { key: "collaborer_eyebrow", label: "Collaborer — surtitre" },
    { key: "collaborer_hero_title", label: "Collaborer — titre hero" },
    { key: "collaborer_hero_subtitle", label: "Collaborer — sous-titre hero", rows: 2 },
    { key: "collaborer_cta_label", label: "Collaborer — libellé bouton" },
    { key: "collaborer_cta_href", label: "Collaborer — lien bouton" },
    { key: "collaborer_closing_title", label: "Collaborer — titre de clôture" },
  ];

  return (
    <div className="admin-reveal">
      <form className="admin-form" onSubmit={onSave}>
        {fields.map(({ key, label, rows }) => (
          <div key={key} className="admin-field">
            <label htmlFor={key}>{label}</label>
            {rows ? (
              <textarea
                id={key}
                rows={rows}
                value={form[key] as string}
                onChange={(e) => updateField(key, e.target.value)}
              />
            ) : (
              <input
                id={key}
                value={form[key] as string}
                onChange={(e) => updateField(key, e.target.value)}
              />
            )}
          </div>
        ))}
        <button type="submit" className="admin-btn" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer les textes"}
        </button>
      </form>

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid var(--border, #e5e5e5)" }} />

      <h2 className="admin-title" style={{ fontSize: "1.1rem", marginBottom: 12 }}>
        Descriptions des catégories (catalogue)
      </h2>
      <p className="admin-field__hint" style={{ marginBottom: 16 }}>
        Les 4 catégories sont fixes ; vous pouvez modifier leur description affichée sur le catalogue.
      </p>

      {categories.map((cat) => (
        <div key={cat.id} className="admin-field" style={{ marginBottom: 20 }}>
          <label htmlFor={`cat-${cat.id}`}>{cat.name}</label>
          <textarea
            id={`cat-${cat.id}`}
            rows={2}
            value={catDescriptions[cat.id] ?? ""}
            onChange={(e) => setCatDescriptions((prev) => ({ ...prev, [cat.id]: e.target.value }))}
          />
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            style={{ marginTop: 8 }}
            disabled={savingCatId === cat.id}
            onClick={() => void onSaveCategoryDescription(cat.id, cat.name)}
          >
            {savingCatId === cat.id ? "…" : "Enregistrer"}
          </button>
        </div>
      ))}
    </div>
  );
}
