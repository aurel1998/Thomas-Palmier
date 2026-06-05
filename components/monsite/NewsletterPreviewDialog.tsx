"use client";

import { useEffect, useState } from "react";

export type NewsletterPreviewData = {
  subject: string;
  html: string;
  from: string;
  kind: "campaign" | "content";
};

type PreviewViewport = "desktop" | "mobile";

type NewsletterPreviewDialogProps = {
  open: boolean;
  loading: boolean;
  preview: NewsletterPreviewData | null;
  onClose: () => void;
};

export function NewsletterPreviewDialog({
  open,
  loading,
  preview,
  onClose,
}: NewsletterPreviewDialogProps) {
  const [viewport, setViewport] = useState<PreviewViewport>("desktop");

  useEffect(() => {
    if (!open) return;
    setViewport("desktop");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="admin-newsletter-preview" role="dialog" aria-modal="true" aria-labelledby="newsletter-preview-title">
      <button
        type="button"
        className="admin-newsletter-preview__backdrop"
        onClick={onClose}
        aria-label="Fermer l'aperçu"
      />
      <div className="admin-newsletter-preview__panel">
        <header className="admin-newsletter-preview__head">
          <div>
            <p className="admin-newsletter-preview__eyebrow">Aperçu avant envoi</p>
            <h2 id="newsletter-preview-title" className="admin-newsletter-preview__title">
              Prévisualiser l&apos;email
            </h2>
          </div>
          <button
            type="button"
            className="admin-newsletter-preview__close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className="admin-newsletter-preview__toolbar">
          <div className="admin-newsletter-preview__toggle" role="tablist" aria-label="Format d'aperçu">
            <button
              type="button"
              role="tab"
              aria-selected={viewport === "desktop"}
              className={`admin-newsletter-preview__toggleBtn${viewport === "desktop" ? " admin-newsletter-preview__toggleBtn--active" : ""}`}
              onClick={() => setViewport("desktop")}
            >
              Desktop
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewport === "mobile"}
              className={`admin-newsletter-preview__toggleBtn${viewport === "mobile" ? " admin-newsletter-preview__toggleBtn--active" : ""}`}
              onClick={() => setViewport("mobile")}
            >
              Mobile
            </button>
          </div>
          <p className="admin-newsletter-preview__hint">
            {viewport === "desktop"
              ? "Largeur 600 px — rendu inbox classique"
              : "Largeur 375 px — rendu smartphone"}
          </p>
        </div>

        {loading ? (
          <div className="admin-newsletter-preview__loading" aria-live="polite">
            <span className="admin-skeleton admin-skeleton--line" aria-hidden="true" />
            <span className="admin-skeleton admin-skeleton--line" aria-hidden="true" />
            <p className="admin-field__hint" style={{ margin: "12px 0 0" }}>
              Génération de l&apos;aperçu…
            </p>
          </div>
        ) : preview ? (
          <>
            <div className="admin-newsletter-preview__envelope" aria-label="En-tête email">
              <p>
                <span>De</span> {preview.from}
              </p>
              <p>
                <span>Objet</span> {preview.subject}
              </p>
            </div>
            <div
              className={`admin-newsletter-preview__stage admin-newsletter-preview__stage--${viewport}`}
            >
              <div
                className={`admin-newsletter-preview__device admin-newsletter-preview__device--${viewport}`}
              >
                {viewport === "mobile" ? (
                  <div className="admin-newsletter-preview__phoneBar" aria-hidden="true" />
                ) : null}
                <iframe
                  title={`Aperçu email — ${preview.subject}`}
                  className="admin-newsletter-preview__frame"
                  srcDoc={preview.html}
                  sandbox=""
                  scrolling="auto"
                />
              </div>
            </div>
          </>
        ) : (
          <p className="admin-field__hint" style={{ margin: 0 }}>
            Aperçu indisponible.
          </p>
        )}

        <footer className="admin-newsletter-preview__footer">
          <p className="admin-field__hint" style={{ margin: 0 }}>
            Rendu identique à l&apos;email envoyé (template premium, logo, CTA, désinscription).
          </p>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose}>
            Fermer
          </button>
        </footer>
      </div>
    </div>
  );
}
