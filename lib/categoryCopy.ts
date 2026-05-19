import type { Category } from "../types/category";

/** Libellé affiché sur l’onglet / puce (nom éditorial tel quel, trim). */
export function categoryChipLabel(category: Pick<Category, "name">): string {
  return category.name.trim();
}

/** Phrase sous le titre de page quand une catégorie est active. */
export function categoryCatalogLede(category: Category, count: number): string {
  const custom = category.description?.trim();
  if (custom && custom.length > 8) return custom;

  const key = category.name.toLowerCase();
  if (key.includes("reportage") || key.includes("rmc")) {
    return "Reportages et formats terrain — vidéos, articles et chroniques de cette ligne.";
  }
  if (key.includes("vidéo") || key.includes("video")) {
    return "Sélection vidéo : formats courts et longs, lecture directe dans le catalogue.";
  }
  if (key.includes("audio") || key.includes("podcast") || key.includes("radio")) {
    return "Chroniques et formats audio à écouter depuis le catalogue.";
  }
  if (key.includes("analyse") || key.includes("tactique")) {
    return "Analyses et décryptages — lecture approfondie sur le jeu et les enjeux.";
  }
  if (key.includes("immersion") || key.includes("coulisse")) {
    return "Immersion et coulisses — le sport vu de l’intérieur.";
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

  const key = category.name.toLowerCase();
  if (key.includes("reportage") || key.includes("rmc")) {
    return "Reportages terrain et récits au plus près du sport.";
  }
  if (key.includes("vidéo") || key.includes("video")) {
    return "Vidéos récentes de cette thématique.";
  }
  if (key.includes("audio") || key.includes("podcast")) {
    return "Formats audio et chroniques à écouter.";
  }
  if (key.includes("analyse") || key.includes("tactique")) {
    return "Analyses et lectures tactiques.";
  }

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
