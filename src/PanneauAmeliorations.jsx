import { useState } from 'react'
import {
  AMELIORATIONS, AMELIORATIONS_ENDGAME, OBJETS_BOSS,
  PALIER_MAX, coutAmelioration, coutEndgame, endgameDebloque, peutPayerEndgame,
} from './ameliorations'

function PanneauAmeliorations({
  ameliorations = {},
  pokeDollars,
  objetsBoss = {},
  onAcheter,
  onAcheterEndgame,
  onFermer,
}) {
  const [onglet, setOnglet] = useState('normal')

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-boost-doree boostv3" onClick={(e) => e.stopPropagation()}>
        <div className="boostv3-entete">
          <h2>🔧 Améliorations</h2>
          <button className="boostv3-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="boostv3-onglets">
          <button
            className={`boostv3-onglet ${onglet === 'normal' ? 'actif' : ''}`}
            onClick={() => setOnglet('normal')}
          >Normal</button>
          <button
            className={`boostv3-onglet ${onglet === 'endgame' ? 'actif' : ''}`}
            onClick={() => setOnglet('endgame')}
          >★ Endgame</button>
        </div>

        {onglet === 'normal' && (
          <>
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
                        <span key={i} className={`boostv3-pip ${i < niveau ? 'boostv3-pip-rempli' : ''}`}></span>
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
          </>
        )}

        {onglet === 'endgame' && (
          <>
            <div className="boostv3-banque">
              <span className="boostv3-banque-item" title={OBJETS_BOSS.rouage.nom}>
                <img src={OBJETS_BOSS.rouage.sprite} alt="" className="boostv3-banque-img"
                  onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.rouage.emoji)) }} />
                {objetsBoss.rouage || 0}
              </span>
              <span className="boostv3-banque-item" title={OBJETS_BOSS.cristal.nom}>
                <img src={OBJETS_BOSS.cristal.sprite} alt="" className="boostv3-banque-img"
                  onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.cristal.emoji)) }} />
                {objetsBoss.cristal || 0}
              </span>
              <span className="boostv3-banque-item" title={OBJETS_BOSS.relique.nom}>
                <img src={OBJETS_BOSS.relique.sprite} alt="" className="boostv3-banque-img"
                  onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.relique.emoji)) }} />
                {objetsBoss.relique || 0}
              </span>
            </div>
            <p className="boostv3-note">
              Débloqué quand la version normale est au niveau 10. Payé avec les objets lâchés par les boss.
            </p>
            <div className="boostv3-grille">
              {Object.entries(AMELIORATIONS_ENDGAME).map(([cleEg, info]) => {
                const niveau = ameliorations[cleEg] || 0
                const max = niveau >= PALIER_MAX
                const debloque = endgameDebloque(ameliorations, cleEg)
                const cout = coutEndgame(niveau)
                const payable = peutPayerEndgame(objetsBoss, cout)

                return (
                  <div key={cleEg} className={`boostv3-carte ${!debloque ? 'boostv3-verrou' : ''}`}>
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
                        <span key={i} className={`boostv3-pip boostv3-pip-eg ${i < niveau ? 'boostv3-pip-rempli-eg' : ''}`}></span>
                      ))}
                    </div>

                    {!debloque ? (
                      <div className="boostv3-action">
                        <span className="boostv3-verrou-txt">🔒 Monte la version normale à 10</span>
                      </div>
                    ) : max ? (
                      <div className="boostv3-action">
                        <span className="boostv3-max">MAX ✓</span>
                      </div>
                    ) : (
                      <>
                        <div className="boostv3-cout">
                          <span className="boostv3-cout-item">
                            <img src={OBJETS_BOSS.rouage.sprite} alt="" className="boostv3-cout-img"
                              onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.rouage.emoji)) }} />
                            {cout.rouage}
                          </span>
                          <span className="boostv3-cout-item">
                            <img src={OBJETS_BOSS.cristal.sprite} alt="" className="boostv3-cout-img"
                              onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.cristal.emoji)) }} />
                            {cout.cristal}
                          </span>
                          {cout.relique > 0 && (
                            <span className="boostv3-cout-item">
                              <img src={OBJETS_BOSS.relique.sprite} alt="" className="boostv3-cout-img"
                                onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.relique.emoji)) }} />
                              {cout.relique}
                            </span>
                          )}
                        </div>
                        <div className="boostv3-action">
                          <button
                            className="boostv3-bouton boostv3-bouton-eg"
                            onClick={() => onAcheterEndgame(cleEg)}
                            disabled={!payable}
                          >
                            Améliorer ★
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PanneauAmeliorations