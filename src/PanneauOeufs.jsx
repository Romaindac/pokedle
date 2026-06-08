import { NB_INCUBATEURS, TYPES_OEUF, ORDRE_OEUFS, infoOeuf, combatsRequis, pretAEclore, pourcentageOeuf } from './oeufs'

// Petite icône d'œuf en SVG (couleur selon la rareté).
function IconeOeuf({ couleur, accent, taille = 46 }) {
  return (
    <svg viewBox="0 0 40 52" width={taille} height={taille * 1.3} aria-hidden="true">
      <defs>
        <radialGradient id={`og-${couleur.replace('#','')}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={couleur} />
        </radialGradient>
      </defs>
      <path d="M20 2 C30 2 38 22 38 34 C38 45 30 50 20 50 C10 50 2 45 2 34 C2 22 10 2 20 2 Z"
        fill={`url(#og-${couleur.replace('#','')})`} stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
      <ellipse cx="15" cy="18" rx="5" ry="7" fill="rgba(255,255,255,0.35)" />
      {/* taches décoratives */}
      <circle cx="24" cy="30" r="3" fill="rgba(255,255,255,0.25)" />
      <circle cx="14" cy="38" r="2.5" fill="rgba(255,255,255,0.2)" />
    </svg>
  )
}

// Un incubateur (capsule à eau avec bulles). Vide, en incubation, ou prêt.
function Incubateur({ oeuf, onEclore }) {
  if (!oeuf) {
    return (
      <div className="incub incub-vide">
        <div className="incub-capsule">
          <div className="incub-eau"></div>
          <div className="incub-vide-txt">Vide</div>
        </div>
        <div className="incub-socle"></div>
        <span className="incub-label">Incubateur libre</span>
      </div>
    )
  }
  const info = infoOeuf(oeuf.rarete)
  const pct = pourcentageOeuf(oeuf)
  const pret = pretAEclore(oeuf)
  const requis = combatsRequis(oeuf)
  return (
    <div className={`incub ${pret ? 'incub-pret' : 'incub-actif'}`} style={{ '--c-oeuf': info.couleur, '--a-oeuf': info.accent }}>
      <div className="incub-capsule">
        <div className="incub-eau"></div>
        {/* bulles */}
        <span className="incub-bulle b1"></span>
        <span className="incub-bulle b2"></span>
        <span className="incub-bulle b3"></span>
        <span className="incub-bulle b4"></span>
        <div className={`incub-oeuf ${pret ? 'secoue' : ''}`}>
          <IconeOeuf couleur={info.couleur} accent={info.accent} />
        </div>
      </div>
      <div className="incub-socle"></div>
      <span className="incub-label" style={{ color: info.accent }}>{info.nom}</span>
      <div className="incub-barre">
        <div className="incub-barre-fill" style={{ width: `${pct}%` }}></div>
      </div>
      <span className="incub-compteur">
        {pret ? 'Prêt à éclore !' : `${oeuf.progression} / ${requis} combats`}
      </span>
      {pret && (
        <button className="incub-eclore" onClick={() => onEclore(oeuf)}>✦ Faire éclore</button>
      )}
    </div>
  )
}

// Panneau principal des œufs.
function PanneauOeufs({
  oeufsIncubes = [],     // tableau (taille NB_INCUBATEURS, peut contenir null)
  reserveOeufs = [],     // œufs en attente (pas encore en incubateur)
  jetonsElevage = 0,     // monnaie dédiée aux œufs
  onPlacerOeuf,          // (oeuf) => met un œuf de la réserve dans un incubateur libre
  onEclore,              // (oeuf) => éclôt l'œuf prêt
  onAcheterOeuf,         // (rarete) => achète un œuf (boutique intégrée)
  onFermer,
}) {
  // Comble le tableau d'incubateurs à NB_INCUBATEURS.
  const slots = []
  for (let i = 0; i < NB_INCUBATEURS; i++) slots.push(oeufsIncubes[i] || null)
  const aUnLibre = slots.some((s) => !s)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="oeufs-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="oeufs-entete">
          <h2>🥚 Élevage — Incubateurs</h2>
          <span className="oeufs-jetons">🎟️ {jetonsElevage} jetons</span>
          <button className="oeufs-fermer" onClick={onFermer}>✕</button>
        </div>

        <p className="oeufs-intro">
          Place tes œufs dans un incubateur. Ils éclosent en <strong>combattant</strong> :
          chaque victoire fait progresser l'incubation. Les œufs ont une <strong>chance accrue de shiny</strong> !
        </p>

        {/* Les incubateurs */}
        <div className="incub-rangee">
          {slots.map((oeuf, i) => (
            <Incubateur key={i} oeuf={oeuf} onEclore={onEclore} />
          ))}
        </div>

        {/* Réserve d'œufs à placer */}
        <h3 className="oeufs-section-titre">Tes œufs ({reserveOeufs.length})</h3>
        {reserveOeufs.length === 0 ? (
          <p className="oeufs-vide">Aucun œuf en réserve. Trouve-en en combattant, en battant des boss, ou achète-en ci-dessous.</p>
        ) : (
          <div className="oeufs-reserve">
            {reserveOeufs.map((oeuf) => {
              const info = infoOeuf(oeuf.rarete)
              return (
                <button key={oeuf.id} className="oeuf-reserve-item" style={{ '--c-oeuf': info.couleur, '--a-oeuf': info.accent }}
                  onClick={() => aUnLibre && onPlacerOeuf(oeuf)}
                  disabled={!aUnLibre}
                  title={aUnLibre ? 'Placer dans un incubateur' : 'Aucun incubateur libre'}>
                  <IconeOeuf couleur={info.couleur} accent={info.accent} taille={38} />
                  <span className="oeuf-reserve-nom" style={{ color: info.accent }}>{info.nom}</span>
                  <span className="oeuf-reserve-action">{aUnLibre ? 'Placer ▸' : 'Plein'}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Boutique d'œufs intégrée (monnaie : jetons d'élevage) */}
        <h3 className="oeufs-section-titre">Acheter un œuf (jetons d'élevage)</h3>
        <div className="oeufs-boutique">
          {ORDRE_OEUFS.map((cle) => {
            const info = TYPES_OEUF[cle]
            const prix = info.prix
            const peut = jetonsElevage >= prix
            return (
              <button key={cle} className="oeuf-achat" style={{ '--c-oeuf': info.couleur, '--a-oeuf': info.accent }}
                onClick={() => peut && onAcheterOeuf(cle)} disabled={!peut}
                title={peut ? `Acheter pour ${prix} jetons` : 'Pas assez de jetons'}>
                {info.emoji && <span className="oeuf-achat-tag" style={{ background: info.couleur }}>{info.emoji}</span>}
                <IconeOeuf couleur={info.couleur} accent={info.accent} taille={34} />
                <span className="oeuf-achat-nom" style={{ color: info.accent }}>{info.nom}</span>
                <span className="oeuf-achat-prix">🎟️ {prix}</span>
              </button>
            )
          })}
        </div>
        <p className="oeufs-aide-jetons">Gagne des jetons en combattant (parfois) et en battant les boss de zone (+5 garantis). Les œufs spéciaux (Chromatique, Parfait, Mystère) ne s'obtiennent qu'ici.</p>
      </div>
    </div>
  )
}

export default PanneauOeufs