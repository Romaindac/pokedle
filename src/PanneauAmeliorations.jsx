import { AMELIORATIONS, PALIER_MAX, coutAmelioration } from './ameliorations'

function PanneauAmeliorations({ ameliorations = {}, pokeDollars, onAcheter, onFermer }) {
  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-boost-doree boost-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🔧 Améliorations</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <p className="boutique-argent">💰 {pokeDollars} PokéDollars</p>

        <div className="boutique-grille">
          {Object.entries(AMELIORATIONS).map(([cle, info]) => {
            const niveau = ameliorations[cle] || 0
            const max = niveau >= PALIER_MAX
            const cout = max ? 0 : coutAmelioration(cle, niveau)
            return (
              <div key={cle} className="boutique-item">
                <div className="boutique-item-info">
                  <span className="boutique-item-emoji">{info.emoji}</span>
                  <div className="boutique-item-texte">
                    <span className="boutique-item-nom">{info.nom} — Niv. {niveau}/{PALIER_MAX}</span>
                    <span className="boutique-item-stock">{info.description}</span>
                  </div>
                </div>
                <div className="amelio-barre">
                  {Array.from({ length: PALIER_MAX }).map((_, i) => (
                    <span key={i} className={`amelio-pip ${i < niveau ? 'rempli' : ''}`}></span>
                  ))}
                </div>
                <div className="boutique-item-boutons">
                  {max ? (
                    <span className="amelio-max">MAX ✓</span>
                  ) : (
                    <button
                      className="bouton-achat-lot"
                      onClick={() => onAcheter(cle)}
                      disabled={pokeDollars < cout}
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