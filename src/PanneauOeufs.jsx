import { useState } from 'react'
import {
  TYPES_OEUF, ORDRE_OEUFS, infoOeuf, combatsRequis, pretAEclore, pourcentageOeuf,
  AMELIORATIONS_ELEVAGE, ORDRE_AMELIORATIONS, NIVEAU_MAX_AMELIO, prixAmelioration,
  prixIncubateur, nbIncubateurs, NB_INCUBATEURS_MAX,
} from './oeufs'

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
      <circle cx="24" cy="30" r="3" fill="rgba(255,255,255,0.25)" />
      <circle cx="14" cy="38" r="2.5" fill="rgba(255,255,255,0.2)" />
    </svg>
  )
}

// Un incubateur (capsule à eau avec bulles). Vide, en incubation, ou prêt.
function Incubateur({ oeuf, am, onEclore }) {
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
  const pct = pourcentageOeuf(oeuf, am)
  const pret = pretAEclore(oeuf, am)
  const requis = combatsRequis(oeuf, am)
  return (
    <div className={`incub ${pret ? 'incub-pret' : 'incub-actif'}`} style={{ '--c-oeuf': info.couleur, '--a-oeuf': info.accent }}>
      <div className="incub-capsule">
        <div className="incub-eau"></div>
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

// Onglet Incubateurs : capsules + réserve + boutique d'œufs.
function OngletIncubateurs({ slots, am, reserveOeufs, jetonsElevage, aUnLibre, onPlacerOeuf, onEclore, onAcheterOeuf }) {
  return (
    <>
      <div className="incub-rangee">
        {slots.map((oeuf, i) => (
          <Incubateur key={i} oeuf={oeuf} am={am} onEclore={onEclore} />
        ))}
      </div>

      <h3 className="oeufs-section-titre">Tes œufs ({reserveOeufs.length})</h3>
      {reserveOeufs.length === 0 ? (
        <p className="oeufs-vide">Aucun œuf en réserve. Trouve-en en combattant, ou achète-en ci-dessous.</p>
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
      <p className="oeufs-aide-jetons">Gagne des jetons en combattant et en battant les boss. Les œufs spéciaux (Chromatique, Parfait, Mystère) ne s'obtiennent qu'ici.</p>
    </>
  )
}

// Onglet Améliorations : 5 caractéristiques + achat d'incubateurs.
function OngletAmeliorations({ am, jetonsElevage, onAmeliorer, onAcheterIncubateur }) {
  const nbInc = nbIncubateurs(am)
  const prixInc = prixIncubateur(nbInc)
  return (
    <div className="amel-elevage">
      {/* Incubateurs */}
      <div className="amel-bloc-inc">
        <div className="amel-inc-txt">
          <span className="amel-inc-titre">🏠 Incubateurs</span>
          <span className="amel-inc-sous">{nbInc} / {NB_INCUBATEURS_MAX} débloqués</span>
        </div>
        {prixInc != null ? (
          <button className="amel-bouton" disabled={jetonsElevage < prixInc}
            onClick={() => onAcheterIncubateur()}>
            + Incubateur · 🎟️ {prixInc}
          </button>
        ) : (
          <span className="amel-max">MAX</span>
        )}
      </div>

      {/* Les 5 améliorations */}
      {ORDRE_AMELIORATIONS.map((cle) => {
        const a = AMELIORATIONS_ELEVAGE[cle]
        const niveau = am?.[cle] || 0
        const prix = prixAmelioration(cle, niveau)
        const max = niveau >= NIVEAU_MAX_AMELIO
        const peut = prix != null && jetonsElevage >= prix
        return (
          <div key={cle} className="amel-ligne" style={{ '--c-amel': a.couleur }}>
            <div className="amel-tete">
              <span className="amel-pastille" style={{ background: a.couleur }}>{a.emoji}</span>
              <div className="amel-info">
                <span className="amel-nom">{a.nom} <span className="amel-niv">Niv. {niveau}/{NIVEAU_MAX_AMELIO}</span></span>
                <span className="amel-desc">{a.desc}</span>
              </div>
            </div>
            <div className="amel-barre">
              {Array.from({ length: NIVEAU_MAX_AMELIO }).map((_, i) => (
                <span key={i} className={`amel-cran ${i < niveau ? 'plein' : ''}`} style={i < niveau ? { background: a.couleur } : null}></span>
              ))}
            </div>
            {max ? (
              <span className="amel-max">MAX</span>
            ) : (
              <button className="amel-bouton" disabled={!peut} onClick={() => onAmeliorer(cle)}>
                Améliorer · 🎟️ {prix}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

function PanneauOeufs({
  oeufsIncubes = [],
  reserveOeufs = [],
  jetonsElevage = 0,
  ameliorations = {},
  onPlacerOeuf,
  onEclore,
  onAcheterOeuf,
  onAmeliorer,
  onAcheterIncubateur,
  onFermer,
}) {
  const [onglet, setOnglet] = useState('incubateurs')
  const nbInc = nbIncubateurs(ameliorations)
  // Tableau d'incubateurs dimensionné au nombre débloqué.
  const slots = []
  for (let i = 0; i < nbInc; i++) slots.push(oeufsIncubes[i] || null)
  const aUnLibre = slots.some((s) => !s)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="oeufs-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="oeufs-entete">
          <h2>🥚 Centre d'Élevage</h2>
          <span className="oeufs-jetons">🎟️ {jetonsElevage} jetons</span>
          <button className="oeufs-fermer" onClick={onFermer}>✕</button>
        </div>

        {/* Onglets */}
        <div className="oeufs-onglets">
          <button className={`oeufs-onglet ${onglet === 'incubateurs' ? 'actif' : ''}`} onClick={() => setOnglet('incubateurs')}>Incubateurs</button>
          <button className={`oeufs-onglet ${onglet === 'ameliorations' ? 'actif' : ''}`} onClick={() => setOnglet('ameliorations')}>Améliorations</button>
        </div>

        {onglet === 'incubateurs' ? (
          <OngletIncubateurs
            slots={slots} am={ameliorations} reserveOeufs={reserveOeufs}
            jetonsElevage={jetonsElevage} aUnLibre={aUnLibre}
            onPlacerOeuf={onPlacerOeuf} onEclore={onEclore} onAcheterOeuf={onAcheterOeuf}
          />
        ) : (
          <OngletAmeliorations
            am={ameliorations} jetonsElevage={jetonsElevage}
            onAmeliorer={onAmeliorer} onAcheterIncubateur={onAcheterIncubateur}
          />
        )}
      </div>
    </div>
  )
}

export default PanneauOeufs