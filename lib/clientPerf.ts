/**
 * Signaux client pour alléger WebGL / animations (sans dépendre de React).
 */

export function prefersSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return Boolean(conn?.saveData);
}

/** Réseau ou device modeste : éviter un second contexte WebGL (hero). */
/** Tactile principal : curseur custom + spotlight souris peu utiles — on évite le coût JS. */
export function prefersCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function prefersLightWebGL(): boolean {
  if (typeof navigator === "undefined") return false;
  if (prefersSaveData()) return true;
  const dm = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof dm === "number" && dm > 0 && dm <= 4) return true;
  const hc = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency;
  if (typeof hc === "number" && hc > 0 && hc <= 4) return true;
  return false;
}
