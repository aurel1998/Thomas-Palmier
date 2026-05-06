export type ContentType = "video" | "article" | "audio";

export type Content = {
  id: string;
  title: string;
  type: ContentType;
  content: string;
  image_url: string;
  tags: string[];
  category_id?: string | null;
  is_featured?: boolean;
  created_at: string;
};
