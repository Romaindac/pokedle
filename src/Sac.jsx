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
const ICONE_PARCHEMIN = '/icons/parchemin.png'
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

  const onglets = [
    { cle: 'balls', label: 'Poké Balls', icone: <img src={ICONES_BALLS.poke} alt="" className="btq-onglet-img" /> },
    { cle: 'pierres', label: 'Pierres', icone: '💎' },
    { cle: 'bonbons', label: 'Bonbons', icone: '🍬' },
    { cle: 'objets', label: 'Objets', icone: '⚙️' },
    { cle: 'parchemins', label: 'Parchemins', icone: '📜' },
  ]

  // Ligne d'article réutilisable.
  // sprite : URL d'image fiable (balls/pierres/objets/bonbons). Si l'image peut ne pas
  // exister (parchemins), passer `sansImage` pour afficher un cadre vide sans tenter de charger.
  function LigneItem({ sprite, sansImage, nom, sousTitre, prix, prixMajore, boutons }) {
    return (
      <div className="btq-item">
        <div className="btq-item-sprite">
          {sprite && !sansImage && <img src={sprite} alt={nom} className="btq-item-img" />}
        </div>
        <div className="btq-item-texte">
          <span className="btq-item-nom">{nom}</span>
          {sousTitre && <span className="btq-item-sous">{sousTitre}</span>}
        </div>
        {prix != null && (
          <span className={`btq-item-prix ${prixMajore ? 'majore' : ''}`}>
            {prix} <img src={ICONE_ARGENT} alt="" className="btq-prix-icone" />
          </span>
        )}
        {boutons && <div className="btq-item-boutons">{boutons}</div>}
      </div>
    )
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="btq-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="btq-entete">
          <h2>🛒 Boutique</h2>
          <button className="btq-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="btq-argent">
          <img src={ICONE_ARGENT} alt="" className="btq-argent-icone" />
          <span className="btq-argent-val">{(pokeDollars || 0).toLocaleString('fr-FR')}</span>
          <span className="btq-argent-label">PokéDollars</span>
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
            {Object.entries(BALLS).map(([type, info]) => (
              <LigneItem
                key={type}
                sprite={ICONES_BALLS[type]}
                nom={info.nom}
                sousTitre={`En stock : ${balls[type] || 0}`}
                prix={info.prix}
                boutons={[1, 10, 50, 100].map((q) => (
                  <button key={q} className="btq-achat" onClick={() => onAcheterBall(type, q)} disabled={pokeDollars < info.prix * q}>×{q}</button>
                ))}
              />
            ))}
          </div>
        )}

        {onglet === 'pierres' && (
          <div className="btq-liste">
            <p className="btq-info">💎 Les pierres ne tombent plus en combat : on les achète ici. Le prix monte à chaque achat (puis rebaisse en battant des boss).</p>
            {Object.entries(PIERRES).map(([type, info]) => {
              const prix = prixActuel(type, info.prix)
              const majore = prix > info.prix
              return (
                <LigneItem
                  key={type}
                  sprite={ICONES_PIERRES[type]}
                  spriteEmoji={info.emoji}
                  nom={info.nom}
                  sousTitre={`En stock : ${pierres[type] || 0}`}
                  prix={prix}
                  prixMajore={majore}
                  boutons={[1, 5].map((q) => (
                    <button key={q} className="btq-achat" onClick={() => onAcheterPierre(type, q)} disabled={pokeDollars < prix * q}>×{q}</button>
                  ))}
                />
              )
            })}
          </div>
        )}

        {onglet === 'bonbons' && (
          <div className="btq-liste">
            <p className="btq-info">🎁 Les bonbons ne sont plus en vente. On les obtient en butin de boss !</p>
            {Object.entries(BONBONS).map(([type, info]) => (
              <LigneItem
                key={type}
                sprite={ICONES_BONBONS[type]}
                spriteEmoji={info.emoji}
                nom={info.nom}
                sousTitre={info.description}
                boutons={<span className="btq-stock-compte">×{bonbons[type] || 0}</span>}
              />
            ))}
          </div>
        )}

        {onglet === 'objets' && (
          <div className="btq-liste">
            <p className="btq-info">⚙️ Objets à équiper sur tes Pokémon (1 par Pokémon). Le prix monte à chaque achat. On en gagne aussi en Arène et en combat !</p>
            {Object.entries(OBJETS).filter(([, info]) => info.prix).map(([id, info]) => {
              const prix = prixActuel(id, info.prix)
              const majore = prix > info.prix
              return (
                <LigneItem
                  key={id}
                  sprite={info.sprite}
                  spriteEmoji={info.emoji}
                  nom={info.nom}
                  sousTitre={`${info.desc} — En stock : ${objets[id] || 0}`}
                  prix={prix}
                  prixMajore={majore}
                  boutons={[1, 3].map((q) => (
                    <button key={q} className="btq-achat" onClick={() => onAcheterObjet(id, q)} disabled={pokeDollars < prix * q}>×{q}</button>
                  ))}
                />
              )
            })}
          </div>
        )}

        {onglet === 'parchemins' && (
          <div className="btq-liste">
            <p className="btq-info">📜 Objets ENDGAME ultra-rares. Utilise un parchemin sur un Pokémon (dans sa fiche) pour changer DÉFINITIVEMENT son rôle. Le Sceau du Joker le rend flexible (n'importe quelle case + passifs Joker).</p>
            {Object.entries(PARCHEMINS).map(([cle, info]) => {
              const cher = pokeDollars < info.prix
              return (
                <LigneItem
                  key={cle}
                  sprite={ICONE_PARCHEMIN}
                  sansImage={true}
                  nom={info.nom}
                  sousTitre={`${info.description} — En stock : ${parchemins[cle] || 0}`}
                  prix={formaterPrixParchemin(info.prix)}
                  prixMajore={cher}
                  boutons={
                    <button className="btq-achat" onClick={() => onAcheterParchemin(cle, 1)} disabled={cher}>Acheter ×1</button>
                  }
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Boutique