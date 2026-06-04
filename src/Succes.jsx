import { SUCCES } from './succes'

function Succes({ succesDebloques, etatSucces, onFermer }) {
  const debloques = succesDebloques || []

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🏆 Succès ({debloques.length}/{SUCCES.length})</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="succes-liste">
          {SUCCES.map((s) => {
            const obtenu = debloques.includes(s.id)
            return (
              <div key={s.id} className={`succes-item ${obtenu ? 'obtenu' : ''}`}>
                <span className="succes-emoji">{obtenu ? s.emoji : '🔒'}</span>
                <div className="succes-infos">
                  <span className="succes-nom">{s.nom}</span>
                  <span className="succes-desc">{s.description}</span>
                </div>
                <span className="succes-recompense">
                  {obtenu ? '✓' : `${s.recompense} 💰`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Succes