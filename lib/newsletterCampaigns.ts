import type { NewsletterCampaignKind } from "@prisma/client";

import { prisma } from "./prisma";

export type CampaignKind = "campaign" | "content" | "agenda" | "reminder";

export type NewsletterCampaignDto = {
  id: string;
  kind: CampaignKind;
  subject: string;
  referenceId: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  sentAt: string;
};

export type NewsletterCampaignStats = {
  total: number;
  emailsSent: number;
  emailsFailed: number;
  last: NewsletterCampaignDto | null;
};

export type NewsletterCampaignMeta = {
  kind: CampaignKind;
  subject: string;
  referenceId?: string | null;
};

export type RecordNewsletterCampaignInput = NewsletterCampaignMeta & {
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
};

function mapCampaign(row: {
  id: string;
  kind: NewsletterCampaignKind;
  subject: string;
  referenceId: string | null;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  sentAt: Date;
}): NewsletterCampaignDto {
  return {
    id: row.id,
    kind: row.kind,
    subject: row.subject,
    referenceId: row.referenceId,
    totalRecipients: row.totalRecipients,
    sentCount: row.sentCount,
    failedCount: row.failedCount,
    sentAt: row.sentAt.toISOString(),
  };
}

/** Enregistre une campagne ou notification groupée après envoi. */
export async function recordNewsletterCampaign(
  input: RecordNewsletterCampaignInput
): Promise<NewsletterCampaignDto> {
  const row = await prisma.newsletterCampaign.create({
    data: {
      kind: input.kind,
      subject: input.subject.trim(),
      referenceId: input.referenceId ?? null,
      totalRecipients: input.totalRecipients,
      sentCount: input.sentCount,
      failedCount: input.failedCount,
    },
  });
  return mapCampaign(row);
}

/** Statistiques agrégées pour l'admin newsletter. */
export async function getNewsletterCampaignStats(): Promise<NewsletterCampaignStats> {
  const [aggregate, lastRow] = await Promise.all([
    prisma.newsletterCampaign.aggregate({
      _count: { _all: true },
      _sum: { sentCount: true, failedCount: true },
    }),
    prisma.newsletterCampaign.findFirst({
      orderBy: { sentAt: "desc" },
    }),
  ]);

  return {
    total: aggregate._count._all,
    emailsSent: aggregate._sum.sentCount ?? 0,
    emailsFailed: aggregate._sum.failedCount ?? 0,
    last: lastRow ? mapCampaign(lastRow) : null,
  };
}

/** Historique récent des campagnes (admin). */
export async function getRecentNewsletterCampaigns(limit = 12): Promise<NewsletterCampaignDto[]> {
  const rows = await prisma.newsletterCampaign.findMany({
    orderBy: { sentAt: "desc" },
    take: Math.max(1, Math.min(limit, 50)),
  });
  return rows.map(mapCampaign);
}

export const CAMPAIGN_KIND_LABEL: Record<CampaignKind, string> = {
  campaign: "Campagne libre",
  content: "Annonce contenu",
  agenda: "Agenda",
  reminder: "Rappel 24 h",
};
