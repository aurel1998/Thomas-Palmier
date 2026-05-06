/**
 * Formatte une duree en secondes en "M:SS" ou "H:MM:SS".
 *
 *   formatDuration(42)   // "0:42"
 *   formatDuration(225)  // "3:45"
 *   formatDuration(3725) // "1:02:05"
 */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}
