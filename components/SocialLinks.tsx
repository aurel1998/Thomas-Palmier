import type { FC } from "react";

import { useId } from "react";

import type { SocialId } from "../lib/social";

import { SOCIAL, SOCIAL_LABELS, SOCIAL_LINK_ORDER } from "../lib/social";



type SocialLinksProps = {

  className?: string;

  /** `header` : icônes seules ; `default` : icône + libellé */

  variant?: "default" | "header";

};



/** Couleurs marque — remplissages explicites (pas `currentColor`). */

function IconYoutube({ className }: { className?: string }) {

  return (

    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden>

      <path

        fill="#FF0000"

        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"

      />

      <path fill="#FFFFFF" d="M9.545 15.569V8.431L15.818 12l-6.273 3.569z" />

    </svg>

  );

}



function IconInstagram({ className }: { className?: string }) {

  const raw = useId();

  const gid = `ig-brand-${raw.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (

    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden>

      <defs>

        <linearGradient id={gid} x1="0%" y1="100%" x2="100%" y2="0%">

          <stop offset="0%" stopColor="#fccc0a" />

          <stop offset="22%" stopColor="#fc0c4f" />

          <stop offset="52%" stopColor="#ef32cc" />

          <stop offset="78%" stopColor="#7a36f4" />

          <stop offset="100%" stopColor="#3051f1" />

        </linearGradient>

      </defs>

      <path

        fill={`url(#${gid})`}

        d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8A3.6 3.6 0 0 0 20 16.4V7.6A3.6 3.6 0 0 0 16.4 4H7.6m9.65 1.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 .001 6.001A3 3 0 0 0 12 9z"

      />

    </svg>

  );

}



const TIKTOK_D =

  "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z";



function IconTiktok({ className }: { className?: string }) {

  return (

    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden>

      <path fill="#25F4EE" d={TIKTOK_D} transform="translate(-0.35, -0.35)" />

      <path fill="#FE2C55" d={TIKTOK_D} transform="translate(0.35, 0.35)" />

      <path fill="#000000" d={TIKTOK_D} />

    </svg>

  );

}



function IconFacebook({ className }: { className?: string }) {

  return (

    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden>

      <path

        fill="#1877F2"

        d="M13.5 22v-9.5h3.2l.48-3.7H13.5V6.8c0-1.07.3-1.8 1.85-1.8h2V1.6c-.33 0-1.47-.1-2.8-.1-2.77 0-4.66 1.69-4.66 4.8v2.2H6.5v3.7h2.4V22h4.6z"

      />

    </svg>

  );

}

function IconLinkedin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="#0A66C2"
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </svg>
  );
}



const ICONS: Record<SocialId, FC<{ className?: string }>> = {

  youtube: IconYoutube,

  linkedin: IconLinkedin,

  instagram: IconInstagram,

  tiktok: IconTiktok,

  facebook: IconFacebook,

};



export function SocialLinks({ className = "", variant = "default" }: SocialLinksProps) {

  const compact = variant === "header";

  const mod = variant === "header" ? "social-links--header" : "";

  return (

    <div className={`social-links ${mod} ${className}`.trim()} role="list">

      {SOCIAL_LINK_ORDER.map((id) => {

        const Icon = ICONS[id];

        const label = SOCIAL_LABELS[id];

        const href = SOCIAL[id];

        return (

          <a

            key={id}

            role="listitem"

            href={href}

            target="_blank"

            rel="noopener noreferrer"

            className={`social-links__item social-links__item--${id} is-pressable`.trim()}

            aria-label={label}

            title={label}

          >

            <Icon className="social-links__icon social-links__icon--brand" />

            {!compact ? <span className="social-links__label">{label}</span> : null}

          </a>

        );

      })}

    </div>

  );

}


