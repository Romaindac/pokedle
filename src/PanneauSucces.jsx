import { SUCCES, FAMILLES_SUCCES } from './succes'
import { BALLS, PIERRES } from './config'

// Décrit une récompense de succès de façon lisible (au lieu de [object Object]).
function decrireRecompense(r) {
  if (!r) return ''
  switch (r.type) {
    case 'argent':
      return `${r.montant.toLocaleString('fr-FR')} 💰`
    case 'ball': {
      const nom = BALLS[r.ball] ? BALLS[r.ball].nom : r.ball
      return `${r.quantite} ${nom}`
    }
    case 'pierre': {
      const nom = PIERRES[r.pierre] ? PIERRES[r.pierre].nom : r.pierre
      return `${r.quantite} ${nom}`
    }
    case 'bonus': {
      const pct = Math.round(r.valeur * 100)
      const quoi = r.stat === 'xp' ? 'XP' : 'argent'
      return `+${pct}% ${quoi} (permanent)`
    }
    default:
      return ''
  }
}

function Succes({ succesDebloques, etatSucces, onFermer }) {
  const debloques = succesDebloques || []
  const etat = etatSucces || {}

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc succes-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🏆 Succès ({debloques.length}/{SUCCES.length})</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="succes-liste">
          {FAMILLES_SUCCES.map((fam) => {
            const succesFamille = SUCCES.filter((s) => s.famille === fam.cle)
            if (succesFamille.length === 0) return null
            const nbObtenus = succesFamille.filter((s) => debloques.includes(s.id)).length

            return (
              <div key={fam.cle} className="succes-famille">
                <div className="succes-famille-titre">
                  <span>{fam.emoji} {fam.nom}</span>
                  <span className="succes-famille-compte">{nbObtenus}/{succesFamille.length}</span>
                </div>

                {succesFamille.map((s) => {
                  const obtenu = debloques.includes(s.id)
                  // Progression (barre). Si obtenu → barre pleine.
                  let actuel = 0, cible = 1
                  if (typeof s.progres === 'function') {
                    const p = s.progres(etat)
                    actuel = p.actuel || 0
                    cible = p.cible || 1
                  }
                  const pourcent = obtenu ? 100 : Math.min(100, Math.round((actuel / cible) * 100))
                  const affiche = obtenu ? cible : Math.min(actuel, cible)

                  return (
                    <div key={s.id} className={`succes-item ${obtenu ? 'obtenu' : ''}`}>
                      <span className="succes-emoji">{obtenu ? s.emoji : '🔒'}</span>
                      <div className="succes-infos">
                        <span className="succes-nom">{s.nom}</span>
                        <span className="succes-desc">{s.description}</span>
                        <div className="succes-barre">
                          <div className="succes-barre-remplissage" style={{ width: `${pourcent}%` }}></div>
                          <span className="succes-barre-texte">{affiche.toLocaleString('fr-FR')} / {cible.toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                      <span className="succes-recompense">
                        {obtenu ? '✓' : decrireRecompense(s.recompense)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Succes