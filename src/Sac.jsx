import { useState } from 'react'
import { BALLS, PIERRES, BONBONS } from './config'

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

// Si un objet (ball/pierre/bonbon) expose un champ `sprite` (sprites officiels
// PokeAPI ajoutés dans config.js), on l'utilise en priorité ; sinon on retombe
// sur les anciennes icônes custom, puis sur l'emoji. Ne plante jamais.
function imageObjet(info, fallback) {
  return (info && info.sprite) || fallback || null
}

function Sac({ balls, pierres, bonbons = {}, collection, onEvoluerPierre, onUtiliserBonbon, onFermer }) {
  const [onglet, setOnglet] = useState('balls')
  const [pierreSelectionnee, setPierreSelectionnee] = useState(null)
  const [bonbonSelectionne, setBonbonSelectionne] = useState(null)

  const pokemonsPourPierre = pierreSelectionnee
    ? collection.filter((p) =>
        (p.evolutionsPierre || []).some((e) => e.pierre === pierreSelectionnee)
      )
    : []

  function changerOnglet(o) {
    setOnglet(o)
    setPierreSelectionnee(null)
    setBonbonSelectionne(null)
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc theme-sac panneau-sac-doree sac-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🎒 Sac</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>
        <div className="banniere-mode banniere-sac">
          📦 Ton inventaire — consulte et utilise tes objets
        </div>

        <div className="boutique-onglets">
          <button className={`mode-btn ${onglet === 'balls' ? 'actif' : ''}`} onClick={() => changerOnglet('balls')}><img src={imageObjet(BALLS.poke, ICONES_BALLS.poke)} alt="" className="onglet-ball-img" /> Balls</button>
          <button className={`mode-btn ${onglet === 'pierres' ? 'actif' : ''}`} onClick={() => changerOnglet('pierres')}>💎 Pierres</button>
          <button className={`mode-btn ${onglet === 'objets' ? 'actif' : ''}`} onClick={() => changerOnglet('objets')}>🍬 Objets</button>
        </div>

        {/* Onglet Poké Balls */}
        {onglet === 'balls' && (
          <div className="sac-grille">
            {Object.entries(BALLS).map(([type, info]) => {
              const qte = balls[type] || 0
              const img = imageObjet(info, ICONES_BALLS[type])
              return (
                <div key={type} className={`sac-item ${qte === 0 ? 'sac-item-vide' : ''}`}>
                  <span className="sac-item-emoji">
                    {img ? <img src={img} alt={info.nom} className="item-ball-img" /> : (info.emoji || '◓')}
                  </span>
                  <span className="sac-item-nom">{info.nom}</span>
                  <span className="sac-item-qte">×{qte}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Onglet Pierres */}
        {onglet === 'pierres' && !pierreSelectionnee && (
          <div className="sac-grille">
            {Object.entries(PIERRES).map(([type, info]) => {
              const qte = pierres[type] || 0
              const img = imageObjet(info, ICONES_PIERRES[type])
              return (
                <button
                  key={type}
                  className={`sac-item cliquable ${qte === 0 ? 'sac-item-vide' : ''}`}
                  onClick={() => setPierreSelectionnee(type)}
                  disabled={qte === 0}
                  title={qte === 0 ? 'Tu n\'en as pas' : 'Voir les Pokémon qui évoluent'}
                >
                  <span className="sac-item-emoji">{img ? <img src={img} alt={info.nom} className="item-ball-img" /> : info.emoji}</span>
                  <span className="sac-item-nom">{info.nom}</span>
                  <span className="sac-item-qte">×{qte}</span>
                </button>
              )
            })}
          </div>
        )}

        {onglet === 'pierres' && pierreSelectionnee && (
          <div className="sac-detail">
            <button className="bouton-retour" onClick={() => setPierreSelectionnee(null)}>← Retour</button>
            <h3 className="sac-detail-titre">
              {(() => { const img = imageObjet(PIERRES[pierreSelectionnee], ICONES_PIERRES[pierreSelectionnee]); return img ? <img src={img} alt="" className="item-ball-img" /> : PIERRES[pierreSelectionnee].emoji })()} {PIERRES[pierreSelectionnee].nom} (×{pierres[pierreSelectionnee] || 0})
            </h3>
            <p className="banc-aide">Clique sur un Pokémon pour le faire évoluer :</p>
            <div className="banc-grille">
              {pokemonsPourPierre.length === 0 ? (
                <p className="banc-vide">Aucun de tes Pokémon n'évolue avec cette pierre.</p>
              ) : (
                pokemonsPourPierre.map((poke) => {
                  const evo = (poke.evolutionsPierre || []).find((e) => e.pierre === pierreSelectionnee)
                  return (
                    <button
                      key={poke.uid}
                      className="banc-carte cliquable"
                      onClick={() => {
                        onEvoluerPierre(poke.uid, evo.evolueEn, pierreSelectionnee)
                        setPierreSelectionnee(null)
                      }}
                    >
                      <img src={poke.sprite} alt={poke.nom} className="banc-sprite" />
                      <span className="banc-nom">{poke.nom}</span>
                      <span className="banc-iv">→ {evo.evolueEn}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Onglet Objets (bonbons) */}
        {onglet === 'objets' && !bonbonSelectionne && (
          <div className="sac-grille">
            {Object.entries(BONBONS).map(([type, info]) => {
              const qte = bonbons[type] || 0
              const img = imageObjet(info, ICONES_BONBONS[type])
              return (
                <button
                  key={type}
                  className={`sac-item cliquable ${qte === 0 ? 'sac-item-vide' : ''}`}
                  onClick={() => setBonbonSelectionne(type)}
                  disabled={qte === 0}
                  title={qte === 0 ? 'Tu n\'en as pas' : 'Choisir un Pokémon'}
                >
                  <span className="sac-item-emoji">{img ? <img src={img} alt={info.nom} className="item-ball-img" /> : info.emoji}</span>
                  <span className="sac-item-nom">{info.nom} <span className="sac-item-desc">({info.description})</span></span>
                  <span className="sac-item-qte">×{qte}</span>
                </button>
              )
            })}
          </div>
        )}

        {onglet === 'objets' && bonbonSelectionne && (
          <div className="sac-detail">
            <button className="bouton-retour" onClick={() => setBonbonSelectionne(null)}>← Retour</button>
            <h3 className="sac-detail-titre">
              {(() => { const img = imageObjet(BONBONS[bonbonSelectionne], ICONES_BONBONS[bonbonSelectionne]); return img ? <img src={img} alt="" className="item-ball-img" /> : BONBONS[bonbonSelectionne].emoji })()} {BONBONS[bonbonSelectionne].nom} (×{bonbons[bonbonSelectionne] || 0})
            </h3>
            <p className="banc-aide">Clique sur un Pokémon pour lui donner :</p>
            <div className="banc-grille">
              {collection.length === 0 ? (
                <p className="banc-vide">Aucun Pokémon.</p>
              ) : (
                collection.map((poke) => (
                  <button
                    key={poke.uid}
                    className="banc-carte cliquable"
                    onClick={() => {
                      onUtiliserBonbon(poke.uid, bonbonSelectionne)
                    }}
                  >
                    <img src={poke.sprite} alt={poke.nom} className="banc-sprite" />
                    <span className="banc-nom">{poke.nom}</span>
                    <span className="banc-iv">N.{poke.niveau || 1}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sac