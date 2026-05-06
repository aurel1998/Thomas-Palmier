import { CREDIBILITY_AWARDS, CREDIBILITY_MEDIA, CREDIBILITY_PARTNERS } from "../lib/credibility";
import { HOME_PARTNER_LOGOS } from "../lib/partners";

type SocialProofBandProps = {
  title?: string;
  className?: string;
};

/** Bandeau crédibilité compact : récompenses, médias, partenaires. */
export function SocialProofBand({
  title = "Preuve sociale",
  className = "",
}: SocialProofBandProps) {
  const partners = [...CREDIBILITY_PARTNERS, ...HOME_PARTNER_LOGOS].slice(0, 6);

  return (
    <section
      className={`social-proof ${className}`.trim()}
      aria-label="Preuve sociale : récompenses, médias et partenaires"
    >
      <div className="social-proof__head">
        <p className="home-sectionEyebrow">Crédibilité</p>
        <h2 className="social-proof__title">{title}</h2>
      </div>

      <div className="social-proof__grid">
        <div className="social-proof__block">
          <h3>Récompenses</h3>
          <ul>
            {CREDIBILITY_AWARDS.map((award) => (
              <li key={award.id}>
                <span className="social-proof__chip">{award.year ?? "—"}</span>
                <span>{award.title}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="social-proof__block">
          <h3>Médias</h3>
          <div className="social-proof__logos">
            {CREDIBILITY_MEDIA.map((m) => (
              <span key={m.id} className="social-proof__logo">
                {m.initials ?? m.name.slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
        </div>

        <div className="social-proof__block">
          <h3>Partenaires</h3>
          <div className="social-proof__logos">
            {partners.map((p) => (
              <span key={p.id} className="social-proof__logo">
                {p.initials ?? p.name.slice(0, 2).toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
