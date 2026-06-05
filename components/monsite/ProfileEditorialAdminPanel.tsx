"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import type { JournalistProfileDto, TimelineStepDto } from "../../types/editorial";
import { CONTACT_EMAIL } from "../../lib/sitePublic";
import { uploadMediaFile } from "../../lib/uploadClient";

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type ProfileEditorialAdminPanelProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
  /** Intégré dans ThomasProfileAdminPanel (sans en-tête dupliqué). */
  embedded?: boolean;
};

export function ProfileEditorialAdminPanel({
  apiFetch,
  pushToast,
  embedded = false,
}: ProfileEditorialAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [bioShort, setBioShort] = useState("");
  const [specialtiesInput, setSpecialtiesInput] = useState("");
  const [heroVideoUrl, setHeroVideoUrl] = useState("");
  const [heroPosterUrl, setHeroPosterUrl] = useState("");
  const [photoCaption, setPhotoCaption] = useState("");
  const [editorialLine, setEditorialLine] = useState("");

  const [timeline, setTimeline] = useState<TimelineStepDto[]>([]);
  const [tlPeriod, setTlPeriod] = useState("");
  const [tlTitle, setTlTitle] = useState("");
  const [tlText, setTlText] = useState("");
  const [tlPosition, setTlPosition] = useState("100");
  const [editingTlId, setEditingTlId] = useState<string | null>(null);
  const [savingTl, setSavingTl] = useState(false);

  const loadProfile = useCallback(async () => {
    const response = await apiFetch("/api/profile", { cache: "no-store" });
    const result = (await response.json()) as { data?: JournalistProfileDto; error?: string };
    if (!response.ok) {
      if (response.status !== 401) pushToast("error", result.error ?? "Impossible de charger le profil.");
      return;
    }
    const p = result.data;
    if (!p) return;
    setImageUrl(p.image_url ?? "");
    setDisplayName(p.display_name ?? "");
    setJobTitle(p.job_title ?? "");
    setTagline(p.tagline ?? "");
    setBio(p.bio ?? "");
    setBioShort(p.bio_short ?? "");
    setSpecialtiesInput((p.specialties ?? []).join(", "));
    setHeroVideoUrl(p.hero_video_url ?? "");
    setHeroPosterUrl(p.hero_poster_url ?? "");
    setPhotoCaption(p.photo_caption ?? "");
    setEditorialLine(p.editorial_line ?? "");
  }, [apiFetch, pushToast]);

  const loadTimeline = useCallback(async () => {
    const response = await apiFetch("/api/timeline", { cache: "no-store" });
    const result = (await response.json()) as { data?: TimelineStepDto[]; error?: string };
    if (!response.ok) {
      if (response.status !== 401) pushToast("error", result.error ?? "Impossible de charger la timeline.");
      return;
    }
    setTimeline(Array.isArray(result.data) ? result.data : []);
  }, [apiFetch, pushToast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await Promise.all([loadProfile(), loadTimeline()]);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadProfile, loadTimeline]);

  async function uploadImage(file: File): Promise<string | null> {
    const result = await uploadMediaFile(apiFetch, file, "image");
    if (!result) {
      pushToast("error", "Upload impossible.");
      return null;
    }
    return result.url;
  }

  async function onImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setImageUrl(url);
        pushToast("success", "Photo uploadée.");
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function onPosterUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) {
        setHeroPosterUrl(url);
        pushToast("success", "Poster hero uploadé.");
      }
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function onSaveProfile(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const specialties = specialtiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const response = await apiFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl.trim(),
          display_name: displayName.trim(),
          job_title: jobTitle.trim(),
          tagline: tagline.trim(),
          bio: bio.trim(),
          bio_short: bioShort.trim(),
          specialties,
          hero_video_url: heroVideoUrl.trim(),
          hero_poster_url: heroPosterUrl.trim(),
          photo_caption: photoCaption.trim(),
          editorial_line: editorialLine.trim(),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) pushToast("error", result.error ?? "Mise à jour impossible.");
        return;
      }
      pushToast("success", "Profil enregistré.");
      void loadProfile();
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  function resetTlForm() {
    setTlPeriod("");
    setTlTitle("");
    setTlText("");
    setTlPosition("100");
    setEditingTlId(null);
  }

  function onEditTl(step: TimelineStepDto) {
    setEditingTlId(step.id);
    setTlPeriod(step.period);
    setTlTitle(step.title);
    setTlText(step.text);
    setTlPosition(String(step.position));
  }

  async function onSubmitTimeline(event: FormEvent) {
    event.preventDefault();
    if (!tlPeriod.trim() || !tlTitle.trim()) {
      pushToast("error", "Période et titre obligatoires.");
      return;
    }
    setSavingTl(true);
    try {
      const isEditing = Boolean(editingTlId);
      const endpoint = isEditing ? `/api/timeline/${editingTlId}` : "/api/timeline";
      const response = await apiFetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period: tlPeriod.trim(),
          title: tlTitle.trim(),
          text: tlText.trim(),
          position: Number.isFinite(Number(tlPosition)) ? Number(tlPosition) : 100,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) pushToast("error", result.error ?? "Enregistrement impossible.");
        return;
      }
      pushToast("success", isEditing ? "Étape modifiée." : "Étape ajoutée.");
      resetTlForm();
      void loadTimeline();
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSavingTl(false);
    }
  }

  async function onDeleteTl(id: string, label: string) {
    if (!window.confirm(`Supprimer l'étape « ${label} » ?`)) return;
    const response = await apiFetch(`/api/timeline/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      if (response.status !== 401) pushToast("error", result.error ?? "Suppression impossible.");
      return;
    }
    pushToast("success", "Étape supprimée.");
    if (editingTlId === id) resetTlForm();
    void loadTimeline();
  }

  if (loading) {
    return <p className="admin-field__hint">Chargement du profil…</p>;
  }

  const Wrapper = embedded ? "section" : "div";
  const wrapperClass = embedded ? "admin-profile-section" : "admin-reveal";

  return (
    <Wrapper className={wrapperClass}>
      {embedded ? (
        <h3 className="admin-profile-section__title">Photo & biographie</h3>
      ) : (
        <p className="admin-field__hint" style={{ marginBottom: 16 }}>
          <strong>Email public (fixe) :</strong> {CONTACT_EMAIL}
        </p>
      )}

      <form className="admin-form" onSubmit={onSaveProfile}>
        <div className="admin-field">
          <label htmlFor="displayName">Nom affiché</label>
          <input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="jobTitle">Titre / métier</label>
          <input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="tagline">Accroche hero</label>
          <input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="editorialLine">Ligne éditoriale</label>
          <input id="editorialLine" value={editorialLine} onChange={(e) => setEditorialLine(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="bioShort">Bio courte (accueil)</label>
          <textarea id="bioShort" rows={4} value={bioShort} onChange={(e) => setBioShort(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="bio">Biographie (page À propos)</label>
          <textarea id="bio" rows={8} value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="specialties">Spécialités (virgules)</label>
          <input
            id="specialties"
            placeholder="Football, Analyse, Reportage"
            value={specialtiesInput}
            onChange={(e) => setSpecialtiesInput(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label htmlFor="photoCaption">Légende photo (À propos)</label>
          <input id="photoCaption" value={photoCaption} onChange={(e) => setPhotoCaption(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="imageUrl">Photo du journaliste (URL)</label>
          <input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="profileUpload">Photo (upload)</label>
          <input id="profileUpload" type="file" accept="image/*" onChange={onImageUpload} disabled={uploading} />
        </div>
        <div className="admin-field">
          <label htmlFor="heroVideoUrl">Vidéo hero (URL MP4)</label>
          <input id="heroVideoUrl" value={heroVideoUrl} onChange={(e) => setHeroVideoUrl(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="heroPosterUrl">Poster hero (image de secours)</label>
          <input id="heroPosterUrl" value={heroPosterUrl} onChange={(e) => setHeroPosterUrl(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="heroPosterUpload">Poster hero (upload)</label>
          <input
            id="heroPosterUpload"
            type="file"
            accept="image/*"
            onChange={onPosterUpload}
            disabled={uploading}
          />
        </div>
        <button type="submit" className="admin-btn" disabled={saving || uploading}>
          {saving ? "Enregistrement…" : "Enregistrer le profil"}
        </button>
      </form>

      <hr style={{ margin: "28px 0", border: "none", borderTop: "1px solid var(--border, #e5e5e5)" }} />

      <h2 className="admin-title" style={{ fontSize: "1.1rem", marginBottom: 12 }}>
        Timeline (page À propos)
      </h2>

      <form className="admin-form" onSubmit={onSubmitTimeline}>
        <div className="admin-field">
          <label htmlFor="tlPeriod">Période</label>
          <input id="tlPeriod" value={tlPeriod} onChange={(e) => setTlPeriod(e.target.value)} placeholder="2020 — 2023" />
        </div>
        <div className="admin-field">
          <label htmlFor="tlTitle">Titre</label>
          <input id="tlTitle" value={tlTitle} onChange={(e) => setTlTitle(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="tlText">Texte</label>
          <textarea id="tlText" rows={3} value={tlText} onChange={(e) => setTlText(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="tlPosition">Position</label>
          <input id="tlPosition" type="number" value={tlPosition} onChange={(e) => setTlPosition(e.target.value)} />
        </div>
        <div className="admin-formActions">
          <button type="submit" className="admin-btn" disabled={savingTl}>
            {savingTl ? "…" : editingTlId ? "Mettre à jour" : "Ajouter étape"}
          </button>
          {editingTlId ? (
            <button type="button" className="admin-btn admin-btn--ghost" onClick={resetTlForm}>
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <div className="admin-list" style={{ marginTop: 16 }}>
        {timeline.map((step) => (
          <article key={step.id} className="admin-list__item">
            <div className="admin-list__info">
              <p className="admin-list__title">
                {step.period} — {step.title}
              </p>
              {step.text ? <p className="admin-list__meta">{step.text}</p> : null}
            </div>
            <div className="admin-list__actions">
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => onEditTl(step)}>
                Modifier
              </button>
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => void onDeleteTl(step.id, step.title)}
              >
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </Wrapper>
  );
}
