import { SUCCES, FAMILLES_SUCCES } from './succes'
import { BALLS, PIERRES } from './config'

// Libellé court de la récompense (affiché à droite de chaque succès).
function libelleRecompense(r) {
  if (!r) return ''
  if (r.type === 'argent') return `${r.montant} 💰`
  if (r.type === 'ball') return `${r.quantite}× ${BALLS[r.ball]?.emoji || ''}`
  if (r.type === 'pierre') return `${r.quantite}× ${PIERRES[r.pierre]?.emoji || '💎'}`
  if (r.type === 'bonus') {
    const nom = r.stat === 'xp' ? 'XP' : '💰'
    return `+${Math.round(r.valeur * 100)}% ${nom}`
  }
  return ''
}

// Un succès à bonus permanent est "précieux" → mis en valeur visuellement.
function estBonus(s) {
  return s.recompense && s.recompense.type === 'bonus'
}

function Succes({ succesDebloques, etatSucces, onFermer }) {
  const debloques = succesDebloques || []
  const etat = etatSucces || {
    nbCaptures: 0, nbShiny: 0, nbVus: 0, totalDex: 1025,
    nbVaincus: 0, nbBoss: 0, nbDresseurs: 0, nbZones: 0, nbSpeciaux: 0,
  }
  const totalObtenus = SUCCES.filter((s) => debloques.includes(s.id)).length
  const pctGlobal = SUCCES.length > 0 ? Math.round((totalObtenus / SUCCES.length) * 100) : 0

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-succes-doree" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🏆 Succès</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        {/* Bandeau de complétion globale */}
        <div className="succes-global">
          <div className="succes-global-haut">
            <span className="succes-global-label">Complétion</span>
            <span className="succes-global-compte">{totalObtenus} / {SUCCES.length} ({pctGlobal}%)</span>
          </div>
          <div className="succes-global-barre">
            <div className="succes-global-fill" style={{ width: `${pctGlobal}%` }}></div>
          </div>
        </div>

        <div className="succes-familles">
          {FAMILLES_SUCCES.map((fam) => {
            const liste = SUCCES.filter((s) => s.famille === fam.cle)
            if (liste.length === 0) return null
            const obtenusFam = liste.filter((s) => debloques.includes(s.id)).length
            return (
              <div key={fam.cle} className="succes-famille">
                <div className="succes-famille-entete">
                  <span className="succes-famille-titre">{fam.emoji} {fam.nom}</span>
                  <span className="succes-famille-compte">{obtenusFam}/{liste.length}</span>
                </div>

                <div className="succes-liste">
                  {liste.map((s) => {
                    const obtenu = debloques.includes(s.id)
                    let infoProgres = null
                    if (!obtenu && typeof s.progres === 'function') {
                      const { actuel, cible } = s.progres(etat)
                      const actuelAffiche = Math.min(actuel, cible)
                      const pct = cible > 0 ? Math.min(100, (actuel / cible) * 100) : 0
                      infoProgres = { actuelAffiche, cible, pct }
                    }
                    const classes = [
                      'succes-item',
                      obtenu ? 'obtenu' : '',
                      estBonus(s) ? 'succes-bonus' : '',
                    ].filter(Boolean).join(' ')
                    return (
                      <div key={s.id} className={classes}>
                        <span className="succes-emoji">{obtenu ? s.emoji : '🔒'}</span>
                        <div className="succes-infos">
                          <span className="succes-nom">{s.nom}</span>
                          <span className="succes-desc">{s.description}</span>
                          {infoProgres && (
                            <div className="succes-progres">
                              <div className="succes-progres-barre">
                                <div className="succes-progres-fill" style={{ width: `${infoProgres.pct}%` }}></div>
                              </div>
                              <span className="succes-progres-texte">
                                {infoProgres.actuelAffiche}/{infoProgres.cible}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`succes-recompense ${estBonus(s) ? 'recompense-bonus' : ''}`}>
                          {obtenu ? '✓' : libelleRecompense(s.recompense)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Succes