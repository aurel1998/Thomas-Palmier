type BrandLogoProps = {
  name: string;
  logoSrc?: string;
  initials?: string;
  className?: string;
  imgClassName?: string;
};

/**
 * Logo marque / média : <img> natif pour les SVG (affichage fiable, pas d’optimizer Next).
 */
export function BrandLogo({ name, logoSrc, initials, className = "", imgClassName = "" }: BrandLogoProps) {
  if (logoSrc) {
    return (
      <div className={`brand-logo ${className}`.trim()}>
        <img
          src={logoSrc}
          alt=""
          className={`brand-logo__img ${imgClassName}`.trim()}
          loading="lazy"
          decoding="async"
        />
        <span className="u-visuallyHidden">{name}</span>
      </div>
    );
  }

  return (
    <div className={`brand-logo brand-logo--fallback ${className}`.trim()}>
      <span className="brand-logo__initials">{initials ?? name.slice(0, 2).toUpperCase()}</span>
      <span className="brand-logo__name">{name}</span>
    </div>
  );
}
