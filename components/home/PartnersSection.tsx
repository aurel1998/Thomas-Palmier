import Link from "next/link";
import { HOME_PARTNER_LOGOS } from "../../lib/partners";
import { BrandLogo } from "../media/BrandLogo";

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
            Marques et structures qui accompagnent les récits sportifs.
          </p>
        </header>

        <div className="home-partners__grid" role="list">
          {HOME_PARTNER_LOGOS.map((item) => (
            <div key={item.id} className="home-partners__cell" role="listitem">
              <div className="home-partners__tile">
                <BrandLogo
                  name={item.name}
                  logoSrc={item.logoSrc}
                  initials={item.initials}
                  className="brand-logo--partner"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="home-partners__cta">
          <Link href="/collaborer" className="btn btn-secondary home-partners__link">
            Collaborer
          </Link>
        </div>
      </div>
    </section>
  );
}
