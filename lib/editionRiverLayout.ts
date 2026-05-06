/**
 * Rythme visuel du « fleuve éditorial » : alternance plein écran, duo, trio,
 * sans logique blog (pas de grille uniforme).
 */
const RIVER_SLOTS = [
  "edition-slot--spotlight",
  "edition-slot--duoA",
  "edition-slot--duoB",
  "edition-slot--solo",
  "edition-slot--wide",
  "edition-slot--narrow",
] as const;

export function editionRiverSlotClass(index: number): string {
  return RIVER_SLOTS[index % RIVER_SLOTS.length] ?? "edition-slot--solo";
}
