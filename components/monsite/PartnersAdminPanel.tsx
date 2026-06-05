"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { CollaborationCaseDto, CollaborationOfferDto } from "../../types/editorial";

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type PartnersAdminPanelProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
};

export function PartnersAdminPanel({ apiFetch, pushToast }: PartnersAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<CollaborationOfferDto[]>([]);
  const [cases, setCases] = useState<CollaborationCaseDto[]>([]);

  const [offerTitle, setOfferTitle] = useState("");
  const [offerTag, setOfferTag] = useState("");
  const [offerPosition, setOfferPosition] = useState("100");
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);
  const [savingOffer, setSavingOffer] = useState(false);

  const [caseNumber, setCaseNumber] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [caseFormat, setCaseFormat] = useState("");
  const [caseNote, setCaseNote] = useState("");
  const [casePosition, setCasePosition] = useState("100");
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [savingCase, setSavingCase] = useState(false);

  const loadAll = useCallback(async () => {
    const [offerRes, caseRes] = await Promise.all([
      apiFetch("/api/collaboration-offers", { cache: "no-store" }),
      apiFetch("/api/collaboration-cases", { cache: "no-store" }),
    ]);
    const offerJson = (await offerRes.json()) as { data?: CollaborationOfferDto[] };
    const caseJson = (await caseRes.json()) as { data?: CollaborationCaseDto[] };
    setOffers(Array.isArray(offerJson.data) ? offerJson.data : []);
    setCases(Array.isArray(caseJson.data) ? caseJson.data : []);
  }, [apiFetch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadAll();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

  function resetOfferForm() {
    setOfferTitle("");
    setOfferTag("");
    setOfferPosition("100");
    setEditingOfferId(null);
  }

  async function onSubmitOffer(event: FormEvent) {
    event.preventDefault();
    if (!offerTitle.trim()) {
      pushToast("error", "Titre obligatoire.");
      return;
    }
    setSavingOffer(true);
    try {
      const isEditing = Boolean(editingOfferId);
      const response = await apiFetch(
        isEditing ? `/api/collaboration-offers/${editingOfferId}` : "/api/collaboration-offers",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: offerTitle.trim(),
            tag: offerTag.trim(),
            position: Number.isFinite(Number(offerPosition)) ? Number(offerPosition) : 100,
          }),
        }
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) pushToast("error", result.error ?? "Enregistrement impossible.");
        return;
      }
      pushToast("success", isEditing ? "Offre modifiée." : "Offre ajoutée.");
      resetOfferForm();
      void loadAll();
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSavingOffer(false);
    }
  }

  async function onDeleteOffer(id: string) {
    if (!window.confirm("Supprimer cette offre ?")) return;
    const response = await apiFetch(`/api/collaboration-offers/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      if (response.status !== 401) pushToast("error", result.error ?? "Suppression impossible.");
      return;
    }
    pushToast("success", "Offre supprimée.");
    void loadAll();
  }

  function resetCaseForm() {
    setCaseNumber("");
    setCaseTitle("");
    setCaseFormat("");
    setCaseNote("");
    setCasePosition("100");
    setEditingCaseId(null);
  }

  async function onSubmitCase(event: FormEvent) {
    event.preventDefault();
    if (!caseTitle.trim()) {
      pushToast("error", "Titre obligatoire.");
      return;
    }
    setSavingCase(true);
    try {
      const isEditing = Boolean(editingCaseId);
      const response = await apiFetch(
        isEditing ? `/api/collaboration-cases/${editingCaseId}` : "/api/collaboration-cases",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            number: caseNumber.trim(),
            title: caseTitle.trim(),
            format: caseFormat.trim(),
            note: caseNote.trim(),
            position: Number.isFinite(Number(casePosition)) ? Number(casePosition) : 100,
          }),
        }
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        if (response.status !== 401) pushToast("error", result.error ?? "Enregistrement impossible.");
        return;
      }
      pushToast("success", isEditing ? "Cas modifié." : "Cas ajouté.");
      resetCaseForm();
      void loadAll();
    } catch {
      pushToast("error", "Erreur réseau.");
    } finally {
      setSavingCase(false);
    }
  }

  async function onDeleteCase(id: string) {
    if (!window.confirm("Supprimer ce cas client ?")) return;
    const response = await apiFetch(`/api/collaboration-cases/${id}`, { method: "DELETE" });
    if (!response.ok) {
      const result = (await response.json()) as { error?: string };
      if (response.status !== 401) pushToast("error", result.error ?? "Suppression impossible.");
      return;
    }
    pushToast("success", "Cas supprimé.");
    void loadAll();
  }

  if (loading) return <p className="admin-field__hint">Chargement…</p>;

  return (
    <div className="admin-reveal">
      <p className="admin-field__hint" style={{ marginBottom: 16 }}>
        Récompenses, médias et partenaires se gèrent dans l&apos;onglet <strong>Profil Thomas</strong>.
      </p>

      <h2 className="admin-title" style={{ fontSize: "1.1rem" }}>
        Offres (page Collaborer)
      </h2>
      <form className="admin-form" onSubmit={onSubmitOffer}>
        <div className="admin-field">
          <label htmlFor="offerTitle">Titre</label>
          <input id="offerTitle" value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="offerTag">Tag</label>
          <input id="offerTag" value={offerTag} onChange={(e) => setOfferTag(e.target.value)} />
        </div>
        <button type="submit" className="admin-btn" disabled={savingOffer}>
          {editingOfferId ? "Mettre à jour" : "Ajouter offre"}
        </button>
      </form>
      <div className="admin-list" style={{ marginTop: 12, marginBottom: 28 }}>
        {offers.map((o) => (
          <article key={o.id} className="admin-list__item">
            <div className="admin-list__info">
              <p className="admin-list__title">{o.title}</p>
              {o.tag ? <p className="admin-list__meta">{o.tag}</p> : null}
            </div>
            <div className="admin-list__actions">
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setEditingOfferId(o.id);
                  setOfferTitle(o.title);
                  setOfferTag(o.tag);
                  setOfferPosition(String(o.position));
                }}
              >
                Modifier
              </button>
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => void onDeleteOffer(o.id)}>
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>

      <h2 className="admin-title" style={{ fontSize: "1.1rem" }}>
        Cas clients (page Collaborer)
      </h2>
      <form className="admin-form" onSubmit={onSubmitCase}>
        <div className="admin-field">
          <label htmlFor="caseNumber">Numéro</label>
          <input id="caseNumber" value={caseNumber} onChange={(e) => setCaseNumber(e.target.value)} placeholder="01" />
        </div>
        <div className="admin-field">
          <label htmlFor="caseTitle">Titre</label>
          <input id="caseTitle" value={caseTitle} onChange={(e) => setCaseTitle(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="caseFormat">Format</label>
          <input id="caseFormat" value={caseFormat} onChange={(e) => setCaseFormat(e.target.value)} />
        </div>
        <div className="admin-field">
          <label htmlFor="caseNote">Note</label>
          <textarea id="caseNote" rows={2} value={caseNote} onChange={(e) => setCaseNote(e.target.value)} />
        </div>
        <button type="submit" className="admin-btn" disabled={savingCase}>
          {editingCaseId ? "Mettre à jour" : "Ajouter cas"}
        </button>
      </form>
      <div className="admin-list" style={{ marginTop: 12 }}>
        {cases.map((c) => (
          <article key={c.id} className="admin-list__item">
            <div className="admin-list__info">
              <p className="admin-list__title">
                {c.number} — {c.title}
              </p>
              {c.format ? <p className="admin-list__meta">{c.format}</p> : null}
            </div>
            <div className="admin-list__actions">
              <button
                type="button"
                className="admin-btn admin-btn--ghost"
                onClick={() => {
                  setEditingCaseId(c.id);
                  setCaseNumber(c.number);
                  setCaseTitle(c.title);
                  setCaseFormat(c.format);
                  setCaseNote(c.note);
                  setCasePosition(String(c.position));
                }}
              >
                Modifier
              </button>
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => void onDeleteCase(c.id)}>
                Supprimer
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
