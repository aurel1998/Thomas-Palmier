import type { CredibilityItemDto } from "../types/editorial";

export function mapCredibilityToLogoWall(items: CredibilityItemDto[]) {
  return items
    .filter((item) => item.kind === "media" || item.kind === "partner")
    .map((item) => ({
      id: item.id,
      name: item.name,
      logoSrc: item.logo_url || undefined,
      initials: item.initials || undefined,
    }));
}

export function filterAwards(items: CredibilityItemDto[]) {
  return items.filter((item) => item.kind === "award");
}
