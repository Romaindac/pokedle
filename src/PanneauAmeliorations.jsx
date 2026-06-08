import { useState } from 'react'
import {
  AMELIORATIONS, AMELIORATIONS_ENDGAME, OBJETS_BOSS,
  PALIER_MAX, coutAmelioration, coutEndgame, endgameDebloque, peutPayerEndgame,
} from './ameliorations'

function ImgBoss({ obj, classe }) {
  return <img src={obj.sprite} alt={obj.nom} className={classe}
    onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(obj.emoji)) }} />
}

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
      <div className="amel-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="amel-entete">
          <h2>🔧 Améliorations</h2>
          <button className="amel-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="amel-onglets">
          <button className={`amel-onglet ${onglet === 'normal' ? 'actif' : ''}`} onClick={() => setOnglet('normal')}>Normal</button>
          <button className={`amel-onglet ${onglet === 'endgame' ? 'actif' : ''}`} onClick={() => setOnglet('endgame')}>★ Endgame</button>
        </div>

        {onglet === 'normal' && (
          <>
            <div className="amel-argent">
              <img src="/icons/argent.png" alt="" className="amel-argent-icone" onError={(e)=>{e.currentTarget.style.display='none'}} />
              <span className="amel-argent-val">{pokeDollars.toLocaleString('fr-FR')}</span>
              <span className="amel-argent-label">PokéDollars</span>
            </div>
            <div className="amel-grille">
              {Object.entries(AMELIORATIONS).map(([cle, info]) => {
                const niveau = ameliorations[cle] || 0
                const max = niveau >= PALIER_MAX
                const cout = max ? 0 : coutAmelioration(cle, niveau)
                const tropCher = pokeDollars < cout
                return (
                  <div key={cle} className="amel-carte">
                    <div className="amel-haut">
                      <span className="amel-emoji">{info.emoji}</span>
                      <div className="amel-texte">
                        <span className="amel-nom">{info.nom}</span>
                        <span className="amel-niv">Niv. {niveau}/{PALIER_MAX}</span>
                      </div>
                    </div>
                    <p className="amel-desc">{info.description}</p>
                    <div className="amel-pips">
                      {Array.from({ length: PALIER_MAX }).map((_, i) => (
                        <span key={i} className={`amel-pip ${i < niveau ? 'rempli' : ''}`}></span>
                      ))}
                    </div>
                    <div className="amel-action">
                      {max ? (
                        <span className="amel-max">MAX ✓</span>
                      ) : (
                        <button className="amel-bouton" onClick={() => onAcheter(cle)} disabled={tropCher}>
                          Améliorer — {cout.toLocaleString('fr-FR')} 💰
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
            <div className="amel-banque">
              <span className="amel-banque-item" title={OBJETS_BOSS.rouage.nom}>
                <ImgBoss obj={OBJETS_BOSS.rouage} classe="amel-banque-img" /> {objetsBoss.rouage || 0}
              </span>
              <span className="amel-banque-item" title={OBJETS_BOSS.cristal.nom}>
                <ImgBoss obj={OBJETS_BOSS.cristal} classe="amel-banque-img" /> {objetsBoss.cristal || 0}
              </span>
              <span className="amel-banque-item" title={OBJETS_BOSS.relique.nom}>
                <ImgBoss obj={OBJETS_BOSS.relique} classe="amel-banque-img" /> {objetsBoss.relique || 0}
              </span>
            </div>
            <p className="amel-note">Débloqué quand la version normale est au niveau 10. Payé avec les objets lâchés par les boss.</p>
            <div className="amel-grille">
              {Object.entries(AMELIORATIONS_ENDGAME).map(([cleEg, info]) => {
                const niveau = ameliorations[cleEg] || 0
                const max = niveau >= PALIER_MAX
                const debloque = endgameDebloque(ameliorations, cleEg)
                const cout = coutEndgame(niveau)
                const payable = peutPayerEndgame(objetsBoss, cout)
                return (
                  <div key={cleEg} className={`amel-carte amel-eg ${!debloque ? 'verrou' : ''}`}>
                    <div className="amel-haut">
                      <span className="amel-emoji">{info.emoji}</span>
                      <div className="amel-texte">
                        <span className="amel-nom">{info.nom}</span>
                        <span className="amel-niv">Niv. {niveau}/{PALIER_MAX}</span>
                      </div>
                    </div>
                    <p className="amel-desc">{info.description}</p>
                    <div className="amel-pips">
                      {Array.from({ length: PALIER_MAX }).map((_, i) => (
                        <span key={i} className={`amel-pip eg ${i < niveau ? 'rempli-eg' : ''}`}></span>
                      ))}
                    </div>
                    {!debloque ? (
                      <div className="amel-action"><span className="amel-verrou-txt">🔒 Monte la version normale à 10</span></div>
                    ) : max ? (
                      <div className="amel-action"><span className="amel-max">MAX ✓</span></div>
                    ) : (
                      <>
                        <div className="amel-cout">
                          <span className="amel-cout-item"><ImgBoss obj={OBJETS_BOSS.rouage} classe="amel-cout-img" /> {cout.rouage}</span>
                          <span className="amel-cout-item"><ImgBoss obj={OBJETS_BOSS.cristal} classe="amel-cout-img" /> {cout.cristal}</span>
                          {cout.relique > 0 && (
                            <span className="amel-cout-item"><ImgBoss obj={OBJETS_BOSS.relique} classe="amel-cout-img" /> {cout.relique}</span>
                          )}
                        </div>
                        <div className="amel-action">
                          <button className="amel-bouton amel-bouton-eg" onClick={() => onAcheterEndgame(cleEg)} disabled={!payable}>Améliorer ★</button>
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