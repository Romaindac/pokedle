import { AMELIORATIONS, PALIER_MAX, coutAmelioration } from './ameliorations'

function PanneauAmeliorations({ ameliorations = {}, pokeDollars, onAcheter, onFermer }) {
  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-boost-doree boostv3" onClick={(e) => e.stopPropagation()}>
        <div className="boostv3-entete">
          <h2>🔧 Améliorations</h2>
          <button className="boostv3-fermer" onClick={onFermer}>✕</button>
        </div>

        <p className="boostv3-argent">💰 {pokeDollars} PokéDollars</p>

        <div className="boostv3-grille">
          {Object.entries(AMELIORATIONS).map(([cle, info]) => {
            const niveau = ameliorations[cle] || 0
            const max = niveau >= PALIER_MAX
            const cout = max ? 0 : coutAmelioration(cle, niveau)
            const tropCher = pokeDollars < cout
            return (
              <div key={cle} className="boostv3-carte">
                <div className="boostv3-haut">
                  <span className="boostv3-emoji">{info.emoji}</span>
                  <div className="boostv3-texte">
                    <span className="boostv3-nom">{info.nom}</span>
                    <span className="boostv3-niv">Niv. {niveau}/{PALIER_MAX}</span>
                  </div>
                </div>

                <p className="boostv3-desc">{info.description}</p>

                <div className="boostv3-pips">
                  {Array.from({ length: PALIER_MAX }).map((_, i) => (
                    <span
                      key={i}
                      className={`boostv3-pip ${i < niveau ? 'boostv3-pip-rempli' : ''}`}
                    ></span>
                  ))}
                </div>

                <div className="boostv3-action">
                  {max ? (
                    <span className="boostv3-max">MAX ✓</span>
                  ) : (
                    <button
                      className="boostv3-bouton"
                      onClick={() => onAcheter(cle)}
                      disabled={tropCher}
                    >
                      Améliorer — {cout} 💰
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PanneauAmeliorations