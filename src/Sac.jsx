import { useState } from 'react'
import { BALLS, PIERRES, BONBONS } from './config'
import { OBJETS } from './objets'

// Icones reutilisees (memes chemins que la Boutique).
const ICONES_BALLS = {
  poke: '/icons/ball-poke.png',
  super: '/icons/ball-super.png',
  hyper: '/icons/ball-hyper.png',
  master: '/icons/ball-master.png',
}
const ICONES_BONBONS = {
  'bonbon': '/icons/bonbon.png',
  'super-bonbon': '/icons/super-bonbon.png',
}
const ICONES_PIERRES = {
  'fire-stone': '/icons/fire-stone.png',
  'water-stone': '/icons/water-stone.png',
  'thunder-stone': '/icons/thunder-stone.png',
  'leaf-stone': '/icons/leaf-stone.png',
  'moon-stone': '/icons/moon-stone.png',
  'sun-stone': '/icons/sun-stone.png',
  'shiny-stone': '/icons/shiny-stone.png',
  'dusk-stone': '/icons/dusk-stone.png',
  'dawn-stone': '/icons/dawn-stone.png',
  'ice-stone': '/icons/ice-stone.png',
}

// Sac = inventaire (affichage des quantites possedees). Reprend le style btq-*.
// Props : balls, pierres, bonbons, objetsBoss, collection (+ actions, non utilisees en V1).
function Sac({ balls = {}, pierres = {}, bonbons = {}, objetsBoss = {}, collection = [], onEvoluerPierre, onUtiliserBonbon, onUtiliserBonbonIV, onFermer }) {
  const [onglet, setOnglet] = useState('balls')

  const onglets = [
    { cle: 'balls', label: 'Poke Balls', icone: <img src={ICONES_BALLS.poke} alt="" className="btq-onglet-img" /> },
    { cle: 'pierres', label: 'Pierres', icone: '💎' },
    { cle: 'bonbons', label: 'Bonbons', icone: '🍬' },
    { cle: 'objets', label: 'Objets de boss', icone: '🏆' },
  ]

  // Ligne d'inventaire (sans prix : on affiche juste la quantite possedee).
  function LigneItem({ sprite, sansImage, nom, sousTitre, quantite }) {
    return (
      <div className="btq-item">
        <div className="btq-item-sprite">
          {sprite && !sansImage && <img src={sprite} alt={nom} className="btq-item-img"
            onError={(e) => { e.currentTarget.style.display = 'none' }} />}
        </div>
        <div className="btq-item-texte">
          <span className="btq-item-nom">{nom}</span>
          {sousTitre && <span className="btq-item-sous">{sousTitre}</span>}
        </div>
        <span className="btq-stock-compte">×{quantite || 0}</span>
      </div>
    )
  }

  // Objets de boss : on liste ce que le joueur possede reellement (objetsBoss),
  // en cherchant le nom dans OBJETS si dispo, sinon on affiche la cle brute.
  const entreesObjetsBoss = Object.entries(objetsBoss).filter(([, q]) => (q || 0) > 0)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="btq-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="btq-entete">
          <h2>🎒 Sac</h2>
          <button className="btq-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="btq-onglets">
          {onglets.map((o) => (
            <button key={o.cle} className={`btq-onglet ${onglet === o.cle ? 'actif' : ''}`} onClick={() => setOnglet(o.cle)}>
              <span className="btq-onglet-icone">{o.icone}</span>
              <span className="btq-onglet-label">{o.label}</span>
            </button>
          ))}
        </div>

        {onglet === 'balls' && (
          <div className="btq-liste">
            <p className="btq-info">🎯 Tes Poke Balls. Elles servent automatiquement a capturer selon tes regles de capture.</p>
            {Object.entries(BALLS).map(([type, info]) => (
              <LigneItem key={type} sprite={ICONES_BALLS[type]} nom={info.nom} quantite={balls[type]} />
            ))}
          </div>
        )}

        {onglet === 'pierres' && (
          <div className="btq-liste">
            <p className="btq-info">💎 Tes pierres d'evolution. Pour les utiliser, ouvre la fiche d'un Pokemon dans l'onglet Equipe.</p>
            {Object.entries(PIERRES).map(([type, info]) => (
              <LigneItem key={type} sprite={ICONES_PIERRES[type]} nom={info.nom} quantite={pierres[type]} />
            ))}
          </div>
        )}

        {onglet === 'bonbons' && (
          <div className="btq-liste">
            <p className="btq-info">🍬 Tes bonbons (gagnes sur les boss). Pour les utiliser, ouvre la fiche d'un Pokemon dans l'onglet Equipe.</p>
            {Object.entries(BONBONS).map(([type, info]) => (
              <LigneItem key={type} sprite={ICONES_BONBONS[type]} nom={info.nom} sousTitre={info.description} quantite={bonbons[type]} />
            ))}
          </div>
        )}

        {onglet === 'objets' && (
          <div className="btq-liste">
            <p className="btq-info">🏆 Objets rares obtenus sur les boss et en arene.</p>
            {entreesObjetsBoss.length === 0 ? (
              <p className="btq-info" style={{ opacity: 0.7 }}>Aucun objet de boss pour l'instant. Bats des boss pour en gagner !</p>
            ) : (
              entreesObjetsBoss.map(([id, q]) => {
                const info = OBJETS[id]
                return (
                  <LigneItem key={id}
                    sprite={info?.sprite}
                    sansImage={!info?.sprite}
                    nom={info?.nom || id}
                    sousTitre={info?.desc}
                    quantite={q} />
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sac