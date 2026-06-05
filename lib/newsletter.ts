import type { AgendaEvent } from "./agendaEvents";

import { formatAgendaEventDisplay } from "./agendaEvents";

import { articleExcerpt, plainBodyTeaser } from "./articleExcerpt";

import type { Content } from "../types/content";

import { prisma } from "./prisma";

import { getMailFrom, isMailerConfigured, sendMail } from "./mailer";

import { escapeEmailHtml, renderPremiumEmail } from "./newsletterTemplate";

import {
  recordNewsletterCampaign,
  type NewsletterCampaignMeta,
} from "./newsletterCampaigns";

import { getPublicAppUrl, getSiteName } from "./siteConfig";



const SITE_NAME = getSiteName();



const TYPE_LABEL: Record<Content["type"], string> = {

  video: "Vidéo",

  article: "Article",

  audio: "Audio",

};



const CTA_LABEL: Record<Content["type"], string> = {

  video: "Voir la vidéo",

  article: "Lire l'article",

  audio: "Écouter le format",

};



/** Lien de desinscription personnalise (l'UUID de l'abonne sert de jeton). */

export function buildUnsubscribeUrl(subscriberId: string): string {

  return `${getPublicAppUrl()}/api/newsletter/unsubscribe?id=${encodeURIComponent(subscriberId)}`;

}



function contentSummary(content: Pick<Content, "type" | "content" | "title">): string {

  if (content.type === "article") {

    return articleExcerpt(content.content, 200) || content.title;

  }

  const teaser = plainBodyTeaser(content.content, 160);

  if (teaser) return teaser;

  return `Un nouveau format ${TYPE_LABEL[content.type].toLowerCase()} vient d'être publié sur ${SITE_NAME}.`;

}



/** Email de bienvenue a l'inscription. */

export function buildWelcomeEmail(subscriberId: string): { subject: string; html: string } {

  const unsubscribeUrl = buildUnsubscribeUrl(subscriberId);

  const homeUrl = getPublicAppUrl();



  return {

    subject: `Bienvenue dans la newsletter ${SITE_NAME}`,

    html: renderPremiumEmail({

      preheader: `Vous êtes inscrit à la newsletter de ${SITE_NAME}.`,

      eyebrow: "Newsletter",

      title: "Inscription confirmée",

      summary:

        "Merci de votre inscription. Vous recevrez nos prochains récits sportifs, vidéos, articles et dates d'agenda — sans spam, sans bruit.",

      cta: { label: "Découvrir le site", href: homeUrl },

      unsubscribeUrl,

    }),

  };

}



/** Email de notification d'un nouveau contenu. */

export function buildContentNotificationEmail(

  content: Pick<Content, "id" | "title" | "type" | "image_url" | "content">,

  subscriberId: string

): { subject: string; html: string } {

  const unsubscribeUrl = buildUnsubscribeUrl(subscriberId);

  const url = `${getPublicAppUrl()}/mes-contenus/${content.id}`;

  const label = TYPE_LABEL[content.type] ?? "Contenu";

  const summary = contentSummary(content);



  return {

    subject: `Nouveau ${label.toLowerCase()} : ${content.title}`,

    html: renderPremiumEmail({

      preheader: summary,

      eyebrow: label,

      title: content.title,

      summary,

      coverImageUrl: content.image_url || undefined,

      coverLinkUrl: url,

      cta: { label: CTA_LABEL[content.type] ?? "Découvrir", href: url },

      unsubscribeUrl,

    }),

  };

}



export type NewsletterSendResult = {

  configured: boolean;

  total: number;

  sent: number;

  failed: number;

};



type BuildPerSubscriber = (subscriberId: string) => { subject: string; html: string };



/**

 * Envoie un email a tous les abonnes actifs, avec contenu personnalise

 * (lien de desinscription unique). Envoi sequentiel par petits lots pour

 * menager le serveur SMTP. Ne jette jamais : retourne un bilan.

 */

export async function sendToActiveSubscribers(

  build: BuildPerSubscriber,

  campaign?: NewsletterCampaignMeta

): Promise<NewsletterSendResult> {

  const subscribers = await prisma.subscriber.findMany({

    where: { isActive: true },

    select: { id: true, email: true },

  });



  const result: NewsletterSendResult = {

    configured: isMailerConfigured(),

    total: subscribers.length,

    sent: 0,

    failed: 0,

  };



  const BATCH = 20;

  for (let i = 0; i < subscribers.length; i += BATCH) {

    const slice = subscribers.slice(i, i + BATCH);

    const outcomes = await Promise.all(

      slice.map(async (sub) => {

        const { subject, html } = build(sub.id);

        return sendMail({ to: sub.email, subject, html });

      })

    );

    for (const ok of outcomes) {

      if (ok) result.sent += 1;

      else result.failed += 1;

    }

  }



  if (campaign) {

    try {

      await recordNewsletterCampaign({

        ...campaign,

        totalRecipients: result.total,

        sentCount: result.sent,

        failedCount: result.failed,

      });

    } catch (error) {

      console.error(

        "[newsletter] enregistrement campagne echoue:",

        (error as Error).message

      );

    }

  }



  return result;

}



function contentNotificationSubject(

  content: Pick<Content, "title" | "type">

): string {

  const label = TYPE_LABEL[content.type] ?? "Contenu";

  return `Nouveau ${label.toLowerCase()} : ${content.title}`;

}



/** Notifie tous les abonnes actifs d'un nouveau contenu (fire-and-forget). */

export async function notifyNewContent(

  content: Pick<Content, "id" | "title" | "type" | "image_url" | "content">

): Promise<NewsletterSendResult> {

  return sendToActiveSubscribers(

    (subscriberId) => buildContentNotificationEmail(content, subscriberId),

    {

      kind: "content",

      subject: contentNotificationSubject(content),

      referenceId: content.id,

    }

  );

}



/** Email de notification d'une date agenda (création ou changement de date). */

export function buildAgendaNotificationEmail(

  event: Pick<AgendaEvent, "title" | "description" | "date" | "location">,

  subscriberId: string,

  kind: "created" | "updated"

): { subject: string; html: string } {

  const unsubscribeUrl = buildUnsubscribeUrl(subscriberId);

  const agendaUrl = `${getPublicAppUrl()}/#agenda`;

  const { date, time } = formatAgendaEventDisplay(event.date);



  const locationLine = event.location.trim()

    ? `Lieu : ${event.location.trim()}`

    : "";

  const descriptionLine = event.description.trim() || "";

  const summaryParts = [

    kind === "updated"

      ? "Une date de l'agenda vient d'être mise à jour."

      : "Une nouvelle date vient d'être ajoutée à l'agenda.",

    `${date} — ${time}`,

    locationLine,

    descriptionLine,

  ].filter(Boolean);

  const summary = summaryParts.join(" ");



  const extraHtml = `

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0;width:100%;border:1px solid #e8e9ed;border-radius:12px;overflow:hidden">

      <tr>

        <td style="padding:16px 18px;background:#f7f8fa">

          <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5a96e4">Détails</p>

          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#111114">${escapeEmailHtml(event.title)}</p>

          <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#333842">${escapeEmailHtml(date)} — ${escapeEmailHtml(time)}</p>

          ${event.location.trim() ? `<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333842"><strong>Lieu :</strong> ${escapeEmailHtml(event.location.trim())}</p>` : ""}

          ${event.description.trim() ? `<p style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#333842">${escapeEmailHtml(event.description.trim())}</p>` : ""}

        </td>

      </tr>

    </table>`;



  const subject =

    kind === "updated"

      ? `Agenda mis à jour : ${event.title}`

      : `Nouvelle date agenda : ${event.title}`;



  return {

    subject,

    html: renderPremiumEmail({

      preheader: `${date} — ${event.title}`,

      eyebrow: "Agenda",

      title: kind === "updated" ? "Date modifiée" : "Nouvelle date",

      summary,

      extraHtml,

      cta: { label: "Voir l'agenda", href: agendaUrl },

      unsubscribeUrl,

    }),

  };

}



function agendaNotificationSubject(

  event: Pick<AgendaEvent, "title">,

  kind: "created" | "updated"

): string {

  return kind === "updated"

    ? `Agenda mis à jour : ${event.title}`

    : `Nouvelle date agenda : ${event.title}`;

}



/** Email de rappel 24 h avant un événement agenda. */

export function buildAgendaReminderEmail(

  event: Pick<AgendaEvent, "title" | "description" | "date" | "location">,

  subscriberId: string

): { subject: string; html: string } {

  const unsubscribeUrl = buildUnsubscribeUrl(subscriberId);

  const agendaUrl = `${getPublicAppUrl()}/#agenda`;

  const { date, time } = formatAgendaEventDisplay(event.date);



  const summaryParts = [

    "Rappel : votre rendez-vous approche.",

    `${date} — ${time}`,

    event.location.trim() ? `Lieu : ${event.location.trim()}` : "",

    event.description.trim() || "",

  ].filter(Boolean);

  const summary = summaryParts.join(" ");



  const extraHtml = `

    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0;width:100%;border:1px solid #e8e9ed;border-radius:12px;overflow:hidden">

      <tr>

        <td style="padding:16px 18px;background:#f7f8fa">

          <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#5a96e4">Demain</p>

          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#111114">${escapeEmailHtml(event.title)}</p>

          <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#333842">${escapeEmailHtml(date)} — ${escapeEmailHtml(time)}</p>

          ${event.location.trim() ? `<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#333842"><strong>Lieu :</strong> ${escapeEmailHtml(event.location.trim())}</p>` : ""}

          ${event.description.trim() ? `<p style="margin:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#333842">${escapeEmailHtml(event.description.trim())}</p>` : ""}

        </td>

      </tr>

    </table>`;



  const subject = `Rappel : ${event.title} — demain`;



  return {

    subject,

    html: renderPremiumEmail({

      preheader: `${date} — ${event.title}`,

      eyebrow: "Rappel",

      title: "C'est demain",

      summary,

      extraHtml,

      cta: { label: "Voir l'agenda", href: agendaUrl },

      unsubscribeUrl,

    }),

  };

}



function agendaReminderSubject(event: Pick<AgendaEvent, "title">): string {

  return `Rappel : ${event.title} — demain`;

}



/** Envoie le rappel 24 h à tous les abonnés actifs. */

export async function sendAgendaReminder(

  event: Pick<AgendaEvent, "id" | "title" | "description" | "date" | "location">

): Promise<NewsletterSendResult> {

  return sendToActiveSubscribers(

    (subscriberId) => buildAgendaReminderEmail(event, subscriberId),

    {

      kind: "reminder",

      subject: agendaReminderSubject(event),

      referenceId: event.id,

    }

  );

}



/** Notifie tous les abonnés actifs d'un événement agenda. */

export async function notifyAgendaEvent(

  event: Pick<AgendaEvent, "id" | "title" | "description" | "date" | "location">,

  kind: "created" | "updated"

): Promise<NewsletterSendResult> {

  return sendToActiveSubscribers(

    (subscriberId) => buildAgendaNotificationEmail(event, subscriberId, kind),

    {

      kind: "agenda",

      subject: agendaNotificationSubject(event, kind),

      referenceId: event.id,

    }

  );

}



/** Envoie une newsletter libre (sujet + HTML) a tous les abonnes actifs. */

export async function sendNewsletter(input: {

  subject: string;

  html: string;

}): Promise<NewsletterSendResult> {

  return sendToActiveSubscribers(

    (subscriberId) => buildFreeCampaignEmail(input, subscriberId),

    {

      kind: "campaign",

      subject: input.subject,

    }

  );

}



/** ID fictif pour l'aperçu admin (lien de désinscription non fonctionnel). */

export const NEWSLETTER_PREVIEW_SUBSCRIBER_ID = "00000000-0000-0000-0000-000000000000";



function buildFreeCampaignEmail(

  input: { subject: string; html: string },

  subscriberId: string

): { subject: string; html: string } {

  const bodyHtml = input.html;

  return {

    subject: input.subject,

    html: renderPremiumEmail({

      preheader: input.subject,

      eyebrow: "Édition spéciale",

      title: input.subject,

      extraHtml: `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#333842">${bodyHtml}</div>`,

      cta: { label: "Visiter le site", href: getPublicAppUrl() },

      unsubscribeUrl: buildUnsubscribeUrl(subscriberId),

    }),

  };

}



/** Aperçu exact d'une campagne libre (admin). */

export function previewCampaignEmail(input: {

  subject: string;

  html: string;

}): { subject: string; html: string } {

  return buildFreeCampaignEmail(input, NEWSLETTER_PREVIEW_SUBSCRIBER_ID);

}



/** Aperçu exact d'une annonce de contenu (admin). */

export function previewContentEmail(

  content: Pick<Content, "id" | "title" | "type" | "image_url" | "content">

): { subject: string; html: string } {

  return buildContentNotificationEmail(content, NEWSLETTER_PREVIEW_SUBSCRIBER_ID);

}



/** Expediteur courant (utile pour diagnostics/affichage admin). */

export function newsletterSender(): string {

  return getMailFrom();

}


