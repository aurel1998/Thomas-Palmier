import type { ContentType } from "../types/content";

export type MonthBucket = {
  month: string;
  label: string;
  count: number;
};

export type SubscriberMonthBucket = MonthBucket & {
  newSubscribers: number;
  cumulative: number;
};

export type ContentTypeBucket = {
  type: ContentType;
  label: string;
  total: number;
  published: number;
};

export type CategoryBucket = {
  categoryId: string | null;
  label: string;
  count: number;
};

export type DashboardNewsletterStats = {
  active: number;
  inactive: number;
  campaignsSent: number;
  totalRecipientsReached: number;
};

export type DashboardAgendaStats = {
  total: number;
  published: number;
  draft: number;
  upcoming: number;
  past: number;
  featured: number;
};

export type DashboardAnalytics = {
  contentsByType: ContentTypeBucket[];
  contentsByCategory: CategoryBucket[];
  subscribersByMonth: SubscriberMonthBucket[];
  contentsPublishedByMonth: MonthBucket[];
  newsletter: DashboardNewsletterStats;
  agenda: DashboardAgendaStats;
};

const TYPE_LABELS: Record<ContentType, string> = {
  video: "Vidéo",
  article: "Publication",
  audio: "Audio",
};

const MONTHS_BACK = 12;

export function contentTypeLabel(type: ContentType): string {
  return TYPE_LABELS[type];
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabelFromKey(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" }).format(
    new Date(year, month - 1, 1)
  );
}

/** Derniers N mois calendaires (du plus ancien au plus récent). */
export function buildMonthKeys(months = MONTHS_BACK, now = new Date()): string[] {
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

export function buildContentsPublishedByMonth(
  dates: Date[],
  now = new Date()
): MonthBucket[] {
  const keys = buildMonthKeys(MONTHS_BACK, now);
  const counts = new Map(keys.map((k) => [k, 0]));
  for (const date of dates) {
    const key = monthKey(date);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return keys.map((month) => ({
    month,
    label: monthLabelFromKey(month),
    count: counts.get(month) ?? 0,
  }));
}

export function buildSubscribersByMonth(
  subscribedDates: Date[],
  now = new Date()
): SubscriberMonthBucket[] {
  const keys = buildMonthKeys(MONTHS_BACK, now);
  const newByMonth = new Map(keys.map((k) => [k, 0]));
  for (const date of subscribedDates) {
    const key = monthKey(date);
    if (newByMonth.has(key)) newByMonth.set(key, (newByMonth.get(key) ?? 0) + 1);
  }
  let cumulative = 0;
  const beforeWindow = subscribedDates.filter((d) => {
    const firstKey = keys[0];
    const [y, m] = firstKey.split("-").map(Number);
    return d < new Date(y, m - 1, 1);
  }).length;
  cumulative = beforeWindow;
  return keys.map((month) => {
    const newSubscribers = newByMonth.get(month) ?? 0;
    cumulative += newSubscribers;
    return {
      month,
      label: monthLabelFromKey(month),
      count: newSubscribers,
      newSubscribers,
      cumulative,
    };
  });
}

export function mergeTypeBuckets(
  totalRows: { type: ContentType; count: number }[],
  publishedRows: { type: ContentType; count: number }[]
): ContentTypeBucket[] {
  const publishedMap = new Map(publishedRows.map((r) => [r.type, r.count]));
  const types: ContentType[] = ["video", "article", "audio"];
  return types.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    total: totalRows.find((r) => r.type === type)?.count ?? 0,
    published: publishedMap.get(type) ?? 0,
  }));
}
