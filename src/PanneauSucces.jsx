import { SUCCES, FAMILLES_SUCCES } from './succes'
import { BALLS, PIERRES } from './config'

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
      <div className="scs-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="scs-entete">
          <h2>🏆 Succès ({debloques.length}/{SUCCES.length})</h2>
          <button className="scs-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="scs-liste">
          {FAMILLES_SUCCES.map((fam) => {
            const succesFamille = SUCCES.filter((s) => s.famille === fam.cle)
            if (succesFamille.length === 0) return null
            const nbObtenus = succesFamille.filter((s) => debloques.includes(s.id)).length

            return (
              <div key={fam.cle} className="scs-famille">
                <div className="scs-famille-titre">
                  <span>{fam.emoji} {fam.nom}</span>
                  <span className="scs-famille-compte">{nbObtenus}/{succesFamille.length}</span>
                </div>

                {succesFamille.map((s) => {
                  const obtenu = debloques.includes(s.id)
                  let actuel = 0, cible = 1
                  if (typeof s.progres === 'function') {
                    const p = s.progres(etat)
                    actuel = p.actuel || 0
                    cible = p.cible || 1
                  }
                  const pourcent = obtenu ? 100 : Math.min(100, Math.round((actuel / cible) * 100))
                  const affiche = obtenu ? cible : Math.min(actuel, cible)

                  return (
                    <div key={s.id} className={`scs-item ${obtenu ? 'obtenu' : ''}`}>
                      <span className="scs-emoji">{obtenu ? s.emoji : '🔒'}</span>
                      <div className="scs-infos">
                        <span className="scs-nom">{s.nom}</span>
                        <span className="scs-desc">{s.description}</span>
                        <div className="scs-barre">
                          <div className="scs-barre-fill" style={{ width: `${pourcent}%` }}></div>
                          <span className="scs-barre-texte">{affiche.toLocaleString('fr-FR')} / {cible.toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                      <span className="scs-recompense">
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