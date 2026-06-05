import type { Category } from "../types/category";
import type { Content } from "../types/content";
import type { Subcategory } from "../types/subcategory";
import type { AgendaEvent } from "./agendaEvents";
import type { PublicationStatus } from "./publicationStatus";

type CategoryRow = {
  id: string;
  name: string;
  description: string;
  position: number;
  createdAt: Date;
};

type SubcategoryRow = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  position: number;
  createdAt: Date;
};

type ContentRow = {
  id: string;
  title: string;
  type: "video" | "article" | "audio";
  content: string;
  imageUrl: string;
  tags: string[];
  categoryId: string | null;
  subcategoryId: string | null;
  isFeatured: boolean;
  status: PublicationStatus;
  createdAt: Date;
};

type EventRow = {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  status: PublicationStatus;
  isFeatured: boolean;
  reminderEnabled: boolean;
  reminderSentAt: Date | null;
  createdAt: Date;
};

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    position: row.position,
    created_at: row.createdAt.toISOString(),
  };
}

export function mapSubcategoryRow(row: SubcategoryRow): Subcategory {
  return {
    id: row.id,
    category_id: row.categoryId,
    name: row.name,
    description: row.description,
    position: row.position,
    created_at: row.createdAt.toISOString(),
  };
}

export function mapContentRow(row: ContentRow): Content {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    content: row.content,
    image_url: row.imageUrl,
    tags: row.tags,
    category_id: row.categoryId,
    subcategory_id: row.subcategoryId,
    is_featured: row.isFeatured,
    status: row.status,
    created_at: row.createdAt.toISOString(),
  };
}

export function mapAgendaRow(row: EventRow): AgendaEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    date: row.date.toISOString(),
    location: row.location,
    status: row.status,
    is_featured: row.isFeatured,
    reminder_enabled: row.reminderEnabled,
    reminder_sent_at: row.reminderSentAt?.toISOString() ?? null,
    created_at: row.createdAt.toISOString(),
  };
}
