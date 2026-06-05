"use client";

import { ProfileEditorialAdminPanel } from "./ProfileEditorialAdminPanel";
import { CredibilityAdminSection } from "./CredibilityAdminSection";
import { SocialAdminPanel } from "./SocialAdminPanel";

type ToastKind = "success" | "error" | "info";
type PushToast = (kind: ToastKind, message: string) => void;

type ThomasProfileAdminPanelProps = {
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
  pushToast: PushToast;
};

/**
 * Hub admin — profil Thomas : photo, bio, récompenses, médias, partenaires, réseaux.
 */
export function ThomasProfileAdminPanel({ apiFetch, pushToast }: ThomasProfileAdminPanelProps) {
  return (
    <div className="admin-reveal admin-thomas-profile">
      <header className="admin-thomas-profile__head">
        <p className="admin-thomas-profile__eyebrow">Identité éditoriale</p>
        <h2 className="admin-thomas-profile__title">Profil Thomas</h2>
        <p className="admin-field__hint" style={{ margin: "8px 0 0" }}>
          Toutes les informations ci-dessous alimentent le site public (accueil, À propos, header,
          footer, contact, collaborer).
        </p>
      </header>

      <ProfileEditorialAdminPanel apiFetch={apiFetch} pushToast={pushToast} embedded />

      <CredibilityAdminSection
        apiFetch={apiFetch}
        pushToast={pushToast}
        kind="award"
        title="Récompenses"
        hint="Affichées sur la page À propos (section Récompenses)."
      />

      <CredibilityAdminSection
        apiFetch={apiFetch}
        pushToast={pushToast}
        kind="media"
        title="Médias"
        hint="Logos des médias — page À propos et mur de crédibilité Collaborer."
      />

      <CredibilityAdminSection
        apiFetch={apiFetch}
        pushToast={pushToast}
        kind="partner"
        title="Partenaires"
        hint="Logos partenaires — page Collaborer et écosystème."
      />

      <section className="admin-profile-section">
        <h3 className="admin-profile-section__title">Réseaux sociaux</h3>
        <p className="admin-field__hint" style={{ marginBottom: 12 }}>
          Liens affichés dans le header, le footer et la page contact.
        </p>
        <SocialAdminPanel apiFetch={apiFetch} pushToast={pushToast} embedded />
      </section>
    </div>
  );
}
