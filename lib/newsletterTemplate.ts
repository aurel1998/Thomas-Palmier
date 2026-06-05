import { absoluteUrl } from "./seo";
import { getPublicAppUrl, getSiteName } from "./siteConfig";

/** Palette alignée sur le site (fond sombre, accent doré, bleu éditorial). */
const COLORS = {
  pageBg: "#0a0b10",
  cardBg: "#12131a",
  cardInner: "#ffffff",
  ink: "#111114",
  inkMuted: "#5c5f6b",
  inkSoft: "#333842",
  headerBg: "#0f1016",
  accent: "#e2aa56",
  accentBlue: "#5a96e4",
  rule: "#2a2d38",
  footer: "#8a8f9c",
  ctaBg: "#111114",
  ctaText: "#ffffff",
} as const;

const LOGO_PATH = "/logos/thomas.png";

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** URL absolue pour assets et images (obligatoire dans les clients mail). */
export function resolveEmailMediaUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return absoluteUrl(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
}

export type PremiumEmailCta = {
  label: string;
  href: string;
};

export type PremiumEmailOptions = {
  /** Texte d'aperçu (inbox) — masqué visuellement. */
  preheader?: string;
  /** Surtitre (ex. Vidéo, Agenda). */
  eyebrow?: string;
  /** Titre principal affiché dans le corps. */
  title: string;
  /** Résumé en texte brut (échappé automatiquement). */
  summary?: string;
  /** Bloc HTML additionnel (déjà sûr / échappé). */
  extraHtml?: string;
  coverImageUrl?: string;
  coverLinkUrl?: string;
  cta?: PremiumEmailCta;
  unsubscribeUrl?: string;
};

function preheaderBlock(text: string): string {
  const pad = "&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;".repeat(12);
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;font-size:1px;line-height:1px;">${escapeEmailHtml(text)}${pad}</div>`;
}

function ctaButton(cta: PremiumEmailCta): string {
  const href = cta.href;
  const label = escapeEmailHtml(cta.label);
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0">
      <tr>
        <td align="center" style="border-radius:999px;background:${COLORS.ctaBg}">
          <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:700;letter-spacing:0.02em;color:${COLORS.ctaText};text-decoration:none;border-radius:999px;border:1px solid ${COLORS.accent}">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

function coverBlock(imageUrl: string, linkUrl?: string): string {
  const src = escapeEmailHtml(resolveEmailMediaUrl(imageUrl));
  const img = `<img src="${src}" alt="" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none" />`;
  const inner = linkUrl
    ? `<a href="${linkUrl}" target="_blank" style="text-decoration:none">${img}</a>`
    : img;
  return `
    <tr>
      <td style="padding:0;line-height:0;font-size:0">
        ${inner}
      </td>
    </tr>`;
}

/**
 * Gabarit HTML responsive, compatible clients mail (tables + styles inline).
 */
export function renderPremiumEmail(options: PremiumEmailOptions): string {
  const siteName = getSiteName();
  const siteUrl = getPublicAppUrl();
  const logoUrl = escapeEmailHtml(resolveEmailMediaUrl(LOGO_PATH));

  const preheader = options.preheader?.trim()
    ? preheaderBlock(options.preheader)
    : "";

  const eyebrow = options.eyebrow?.trim()
    ? `<p class="email-eyebrow" style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${COLORS.accentBlue}">${escapeEmailHtml(options.eyebrow)}</p>`
    : "";

  const summary = options.summary?.trim()
    ? `<p class="email-summary" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.65;color:${COLORS.inkSoft}">${escapeEmailHtml(options.summary)}</p>`
    : "";

  const extra = options.extraHtml ?? "";

  const cta = options.cta ? ctaButton(options.cta) : "";

  const footer = options.unsubscribeUrl
    ? `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;color:${COLORS.footer}">
         Vous recevez cet email car vous êtes inscrit à la newsletter de ${escapeEmailHtml(siteName)}.<br/>
         <a href="${options.unsubscribeUrl}" style="color:${COLORS.footer};text-decoration:underline">Se désinscrire</a>
       </p>`
    : "";

  const cover =
    options.coverImageUrl?.trim()
      ? coverBlock(options.coverImageUrl, options.coverLinkUrl)
      : "";

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeEmailHtml(options.title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding: 24px 20px !important; }
      .email-title { font-size: 26px !important; line-height: 1.2 !important; }
      .email-header-pad { padding: 20px 20px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .email-card-inner { background-color: #f4f4f6 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;width:100%;background-color:${COLORS.pageBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.pageBg}">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" class="email-shell" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto">
          <!-- Header -->
          <tr>
            <td class="email-header-pad" style="padding:24px 28px;background:${COLORS.headerBg};border-radius:16px 16px 0 0;border:1px solid ${COLORS.rule};border-bottom:0">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${siteUrl}" target="_blank" style="text-decoration:none;display:inline-block">
                      <img src="${logoUrl}" alt="${escapeEmailHtml(siteName)}" width="156" height="57" style="display:block;width:156px;max-width:156px;height:auto;border:0" />
                    </a>
                  </td>
                  <td align="right" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accent}">
                    Journalisme sportif
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Accent rule -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg,${COLORS.accentBlue} 0%,${COLORS.accent} 55%,#7ec8e8 100%);font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:${COLORS.cardBg};border:1px solid ${COLORS.rule};border-top:0;border-radius:0 0 16px 16px;overflow:hidden">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-card-inner" style="background:${COLORS.cardInner}">
                ${cover}
                <tr>
                  <td class="email-pad" style="padding:32px 36px 36px">
                    ${eyebrow}
                    <h1 class="email-title" style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;line-height:1.18;letter-spacing:-0.02em;color:${COLORS.ink}">${escapeEmailHtml(options.title)}</h1>
                    ${summary}
                    ${extra}
                    ${cta}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 12px 8px">
              ${footer}
              <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${COLORS.footer}">
                <a href="${siteUrl}" style="color:${COLORS.footer};text-decoration:none">${escapeEmailHtml(siteName)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
