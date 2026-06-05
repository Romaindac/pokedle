import { useState } from 'react'
import { BALLS, PIERRES, BONBONS, prixDynamique } from './config'
import { OBJETS } from './objets'
import { PARCHEMINS, formaterPrixParchemin } from './parchemins'

const ICONES_BALLS = {
  poke: '/icons/ball-poke.png',
  super: '/icons/ball-super.png',
  hyper: '/icons/ball-hyper.png',
  master: '/icons/ball-master.png',
}
const ICONE_ARGENT = '/icons/argent.png'
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

// achatsItems : objet { idItem: nombre d'achats } pour le prix dynamique (défaut {}).
function Boutique({ pokeDollars, balls, pierres, bonbons = {}, objets = {}, parchemins = {}, achatsItems = {}, onAcheterBall, onAcheterPierre, onAcheterBonbon, onAcheterObjet, onAcheterParchemin, onFermer }) {
  const [onglet, setOnglet] = useState('balls')

  // Prix actuel d'un item à prix dynamique (pierres/objets) selon les achats déjà faits.
  const prixActuel = (id, prixBase) => prixDynamique(prixBase, achatsItems[id] || 0)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc theme-boutique panneau-boutique-doree boutique-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🛒 Boutique</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>
        <div className="banniere-mode banniere-boutique">
          💰 Achète des objets avec tes PokéDollars
        </div>

        <p className="boutique-argent"><img src={ICONE_ARGENT} alt="" className="icone-inline" /> {pokeDollars} PokéDollars</p>

        <div className="boutique-onglets">
          <button
            className={`mode-btn ${onglet === 'balls' ? 'actif' : ''}`}
            onClick={() => setOnglet('balls')}
          >
            <img src={ICONES_BALLS.poke} alt="" className="onglet-ball-img" /> Poké Balls
          </button>
          <button
            className={`mode-btn ${onglet === 'pierres' ? 'actif' : ''}`}
            onClick={() => setOnglet('pierres')}
          >
            💎 Pierres
          </button>
          <button
            className={`mode-btn ${onglet === 'bonbons' ? 'actif' : ''}`}
            onClick={() => setOnglet('bonbons')}
          >
            🍬 Bonbons
          </button>
          <button
            className={`mode-btn ${onglet === 'objets' ? 'actif' : ''}`}
            onClick={() => setOnglet('objets')}
          >
            ⚙️ Objets
          </button>
          <button
            className={`mode-btn ${onglet === 'parchemins' ? 'actif' : ''}`}
            onClick={() => setOnglet('parchemins')}
          >
            📜 Parchemins
          </button>
        </div>

        {onglet === 'balls' && (
          <div className="boutique-grille">
            {Object.entries(BALLS).map(([type, info]) => (
              <div key={type} className="boutique-item">
                <div className="boutique-item-info">
                  <span className="boutique-item-emoji">
                    <img src={ICONES_BALLS[type]} alt={info.nom} className="item-ball-img" />
                  </span>
                  <div className="boutique-item-texte">
                    <span className="boutique-item-nom">{info.nom}</span>
                    <span className="boutique-item-stock">En stock : {balls[type] || 0}</span>
                  </div>
                  <span className="boutique-item-prix">{info.prix} <img src={ICONE_ARGENT} alt="" className="icone-inline-petit" /></span>
                </div>
                <div className="boutique-item-boutons">
                  {[1, 10, 50, 100].map((q) => (
                    <button
                      key={q}
                      className="bouton-achat-lot"
                      onClick={() => onAcheterBall(type, q)}
                      disabled={pokeDollars < info.prix * q}
                    >
                      ×{q}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {onglet === 'pierres' && (
          <div className="boutique-grille">
            <p className="boutique-indispo-info">💎 Les pierres ne tombent plus en combat : on les achète ici. Le prix monte à chaque achat (puis rebaisse en battant des boss).</p>
            {Object.entries(PIERRES).map(([type, info]) => {
              const prix = prixActuel(type, info.prix)
              const majore = prix > info.prix
              return (
                <div key={type} className="boutique-item">
                  <div className="boutique-item-info">
                    <span className="boutique-item-emoji">
                      {ICONES_PIERRES[type] ? <img src={ICONES_PIERRES[type]} alt={info.nom} className="item-ball-img" /> : info.emoji}
                    </span>
                    <div className="boutique-item-texte">
                      <span className="boutique-item-nom">{info.nom}</span>
                      <span className="boutique-item-stock">En stock : {pierres[type] || 0}</span>
                    </div>
                    <span className={`boutique-item-prix ${majore ? 'prix-majore' : ''}`}>
                      {prix} <img src={ICONE_ARGENT} alt="" className="icone-inline-petit" />
                    </span>
                  </div>
                  <div className="boutique-item-boutons">
                    {[1, 5].map((q) => (
                      <button
                        key={q}
                        className="bouton-achat-lot"
                        onClick={() => onAcheterPierre(type, q)}
                        disabled={pokeDollars < prix * q}
                      >
                        ×{q}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {onglet === 'bonbons' && (
          <div className="boutique-grille">
            <p className="boutique-indispo-info">🎁 Les bonbons ne sont plus en vente. On les obtient en butin de boss !</p>
            <p className="boutique-bonbons-aide">Tes bonbons en réserve :</p>
            <div className="boutique-bonbons-stock">
              {Object.entries(BONBONS).map(([type, info]) => (
                <div key={type} className="bonbon-stock-ligne">
                  <span className="boutique-item-emoji">
                    {ICONES_BONBONS[type] ? <img src={ICONES_BONBONS[type]} alt={info.nom} className="item-ball-img" /> : info.emoji}
                  </span>
                  <div className="boutique-item-texte">
                    <span className="boutique-item-nom">{info.nom}</span>
                    <span className="boutique-item-stock">{info.description}</span>
                  </div>
                  <span className="bonbon-stock-compte">×{bonbons[type] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {onglet === 'objets' && (
          <div className="boutique-grille">
            <p className="boutique-indispo-info">⚙️ Objets à équiper sur tes Pokémon (1 par Pokémon). Le prix monte à chaque achat. On en gagne aussi en Arène et en combat !</p>
            {Object.entries(OBJETS).filter(([, info]) => info.prix).map(([id, info]) => {
              const prix = prixActuel(id, info.prix)
              const majore = prix > info.prix
              return (
                <div key={id} className="boutique-item">
                  <div className="boutique-item-info">
                    <span className="boutique-item-emoji">
                      {info.sprite ? <img src={info.sprite} alt={info.nom} className="item-ball-img" style={{ imageRendering: 'pixelated' }} /> : info.emoji}
                    </span>
                    <div className="boutique-item-texte">
                      <span className="boutique-item-nom">{info.nom}</span>
                      <span className="boutique-item-stock">{info.desc} — En stock : {objets[id] || 0}</span>
                    </div>
                    <span className={`boutique-item-prix ${majore ? 'prix-majore' : ''}`}>
                      {prix} <img src={ICONE_ARGENT} alt="" className="icone-inline-petit" />
                    </span>
                  </div>
                  <div className="boutique-item-boutons">
                    {[1, 3].map((q) => (
                      <button
                        key={q}
                        className="bouton-achat-lot"
                        onClick={() => onAcheterObjet(id, q)}
                        disabled={pokeDollars < prix * q}
                      >
                        ×{q}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {onglet === 'parchemins' && (
          <div className="boutique-grille">
            <p className="boutique-indispo-info">📜 Objets ENDGAME ultra-rares. Utilise un parchemin sur un Pokémon (dans sa fiche) pour changer DÉFINITIVEMENT son rôle. Le Sceau du Joker le rend flexible (n'importe quelle case + passifs Joker).</p>
            {Object.entries(PARCHEMINS).map(([cle, info]) => {
              const cher = pokeDollars < info.prix
              return (
                <div key={cle} className="boutique-item">
                  <div className="boutique-item-info">
                    <span className="boutique-item-emoji">
                      {info.sprite ? <img src={info.sprite} alt={info.nom} className="item-ball-img" style={{ imageRendering: 'pixelated' }} /> : info.emoji}
                    </span>
                    <div className="boutique-item-texte">
                      <span className="boutique-item-nom">{info.emoji} {info.nom}</span>
                      <span className="boutique-item-stock">{info.description} — En stock : {parchemins[cle] || 0}</span>
                    </div>
                    <span className={`boutique-item-prix ${cher ? 'prix-majore' : ''}`}>
                      {formaterPrixParchemin(info.prix)} <img src={ICONE_ARGENT} alt="" className="icone-inline-petit" />
                    </span>
                  </div>
                  <div className="boutique-item-boutons">
                    <button
                      className="bouton-achat-lot"
                      onClick={() => onAcheterParchemin(cle, 1)}
                      disabled={cher}
                    >
                      Acheter ×1
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Boutique