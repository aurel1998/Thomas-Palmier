/**
 * Affiché pendant la résolution RSC d’une route : feedback immédiat au clic menu.
 * Le header / footer restent visibles (layout parent).
 */
export default function Loading() {
  return (
    <div className="route-loading" aria-busy="true" aria-live="polite">
      <div className="route-loading__inner">
        <div className="route-loading__bar" role="presentation" />
        <p className="route-loading__label muted">Chargement…</p>
      </div>
    </div>
  );
}
