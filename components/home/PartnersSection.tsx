import Image from "next/image";
import Link from "next/link";
import { HOME_PARTNER_LOGOS } from "../../lib/partners";

function PartnerTile({ item }: { item: (typeof HOME_PARTNER_LOGOS)[number] }) {
  const hasLogo = Boolean(item.logoSrc);

  return (
    <div className="home-partners__tile">
      <div
        className={
          hasLogo
            ? "home-partners__logoFrame home-partners__logoFrame--img"
            : "home-partners__logoFrame"
        }
      >
        {hasLogo && item.logoSrc ? (
          <Image
            src={item.logoSrc}
            alt=""
            fill
            className="home-partners__logoImg"
            sizes="140px"
          />
        ) : (
          <span className="home-partners__initials">
            {item.initials ?? item.name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="home-partners__brand">{item.name}</span>
    </div>
  );
}

/**
 * Section partenaires : grille sobre, CTA vers Collaborer (orientation business).
 */
export function PartnersSection() {
  return (
    <section className="home-partners" id="partenaires" aria-labelledby="home-partners-heading">
      <div className="container home-partners__inner">
        <header className="home-partners__head">
          <div className="home-sectionEyebrow">Business</div>
          <h2 id="home-partners-heading" className="home-partners__title">
            Partenaires
          </h2>
          <p className="muted home-partners__intro">
            Marques et structures qui soutiennent les projets éditoriaux — sponsoring, production ou
            événements.
          </p>
        </header>

        <div className="home-partners__grid" role="list">
          {HOME_PARTNER_LOGOS.map((item) => (
            <div key={item.id} className="home-partners__cell" role="listitem">
              <PartnerTile item={item} />
            </div>
          ))}
        </div>

        <div className="home-partners__cta">
          <Link href="/collaborer" className="btn btn-secondary home-partners__link">
            Collaborer avec nous
          </Link>
          <p className="muted home-partners__ctaHint">
            Sponsoring, contenus brandés, reportages — faisons le point sur vos objectifs.
          </p>
        </div>
      </div>
    </section>
  );
}
