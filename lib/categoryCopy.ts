import type { Category } from "../types/category";
import { slugFromCategoryName, type CatalogCategorySlug } from "./fixedCategories";

/** Libellé affiché sur l’onglet / puce (nom éditorial tel quel, trim). */
export function categoryChipLabel(category: Pick<Category, "name">): string {
  return category.name.trim();
}

function slugForCategory(category: Pick<Category, "name">): CatalogCategorySlug | null {
  return slugFromCategoryName(category.name);
}

/** Phrase sous le titre de page quand une catégorie est active. */
export function categoryCatalogLede(category: Category, count: number): string {
  const custom = category.description?.trim();
  if (custom && custom.length > 8) return custom;

  const slug = slugForCategory(category);
  if (slug === "radio") {
    return "Formats audio : chroniques, interviews et magazines à parcourir par rubrique.";
  }
  if (slug === "tv") {
    return "Reportages, directs et séquences télé — sélectionnées par rubrique.";
  }
  if (slug === "presse") {
    return "Articles, enquêtes et publications web — classés par rubrique.";
  }
  if (slug === "reseaux") {
    return "Reels, stories et formats courts — regroupés par rubrique.";
  }

  const n = count;
  return n === 1
    ? `Un titre dans « ${category.name.trim()} ».`
    : `${n} titres dans « ${category.name.trim()} ».`;
}

/** Sous-titre des rails « sélection éditoriale » sur l’accueil. */
export function categoryRailLede(category: Category): string {
  const custom = category.description?.trim();
  if (custom && custom.length > 8) return custom;

  const slug = slugForCategory(category);
  if (slug === "radio") return "Chroniques et interviews — écoute directe.";
  if (slug === "tv") return "Reportages et formats TV — lecture directe.";
  if (slug === "presse") return "Articles longs, brèves et enquêtes.";
  if (slug === "reseaux") return "Formats courts pour les réseaux sociaux.";

  return `Contenus classés sous « ${category.name.trim()} ».`;
}

/** Compteur catalogue (vue « Tous »). */
export function catalogCountLabel(count: number): string {
  if (count === 0) return "Aucun titre pour le moment";
  if (count === 1) return "1 titre au catalogue";
  return `${count} titres au catalogue`;
}

/** Accessibilité : libellé complet de l’onglet catégorie. */
export function categoryTabAriaLabel(
  category: Pick<Category, "name">,
  count: number,
  active: boolean
): string {
  const base =
    count === 0
      ? `${category.name.trim()}, aucun contenu`
      : count === 1
        ? `${category.name.trim()}, 1 contenu`
        : `${category.name.trim()}, ${count} contenus`;
  return active ? `${base}, filtre actif` : base;
}

/** Introduction du hub catalogue (niveau catégories). */
export function catalogHubIntro(): string {
  return "Reportages, interviews et réactions — cliquez sur une vidéo pour la regarder.";
}
