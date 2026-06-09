import { useEffect, useState } from 'react'

// =====================================================================
// MenuTitre.jsx — Ecran d'accueil facon jeu Pokemon.
// Fond video (public/menu-fond.mp4) + couches animees CSS + 3 slots de save.
//
// Props :
//   slots : tableau de 3 elements. Chaque element = null (vide) OU
//           { pokedexPct, zoneMax, nbPokemon, nbShiny } (occupe).
//   onJouer(index)      : continuer / demarrer la partie du slot index.
//   onNouvellePartie(index) : creer une nouvelle partie sur un slot vide.
//   onSupprimer(index)  : supprimer la save d'un slot (avec confirmation amont).
// =====================================================================

// Sprites animes Showdown (vrais Pokemon qui se baladent sur le menu).
const SHOWDOWN = (nom) => `https://play.pokemonshowdown.com/sprites/ani/${nom}.gif`

// Quelques Pokemon qui se baladent a l'ecran (oiseaux qui volent, etc.).
const POKEMON_DECO = [
  { nom: 'pidgeot', classe: 'mt-poke-vol-0' },
  { nom: 'butterfree', classe: 'mt-poke-vol-1' },
  { nom: 'pikachu', classe: 'mt-poke-sol-0' },
  { nom: 'eevee', classe: 'mt-poke-sol-1' },
]

function SlotSave({ index, data, onJouer, onNouvellePartie, onSupprimer }) {
  const occupe = !!data
  return (
    <div className={`mt-slot ${occupe ? 'mt-slot-occupe' : 'mt-slot-vide'}`}>
      <div className="mt-slot-numero">Partie {index + 1}</div>
      {occupe ? (
        <>
          <div className="mt-slot-resume">
            <div className="mt-slot-stat"><span className="mt-slot-stat-val">{data.pokedexPct}%</span><span className="mt-slot-stat-lbl">Pokedex</span></div>
            <div className="mt-slot-stat"><span className="mt-slot-stat-val">Zone {data.zoneMax}</span><span className="mt-slot-stat-lbl">Progression</span></div>
            <div className="mt-slot-stat"><span className="mt-slot-stat-val">{data.nbPokemon}</span><span className="mt-slot-stat-lbl">Pokemon</span></div>
            {data.nbShiny > 0 && (
              <div className="mt-slot-stat"><span className="mt-slot-stat-val">✨ {data.nbShiny}</span><span className="mt-slot-stat-lbl">Shinies</span></div>
            )}
          </div>
          <div className="mt-slot-actions">
            <button className="mt-bouton-continuer" onClick={() => onJouer(index)}>▶ Continuer</button>
            <button className="mt-bouton-corbeille" title="Supprimer cette partie" onClick={() => onSupprimer(index)}>🗑️</button>
          </div>
        </>
      ) : (
        <button className="mt-bouton-nouvelle" onClick={() => onNouvellePartie(index)}>
          <span className="mt-nouvelle-plus">+</span>
          <span className="mt-nouvelle-txt">Nouvelle partie</span>
        </button>
      )}
    </div>
  )
}

function MenuTitre({ slots = [null, null, null], onJouer, onNouvellePartie, onSupprimer }) {
  const [pret, setPret] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setPret(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="mt-ecran">
      {/* Fond video */}
      <video className="mt-video" autoPlay loop muted playsInline
        onError={(e) => { e.currentTarget.style.display = 'none' }}>
        <source src="/menu-fond.mp4" type="video/mp4" />
      </video>
      {/* Voile sombre pour lisibilite */}
      <div className="mt-voile" />

      {/* Particules lumineuses qui flottent */}
      <div className="mt-particules" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={`mt-part mt-part-${i}`} />
        ))}
      </div>

      {/* Pokemon animes qui se baladent */}
      <div className="mt-pokemon-deco" aria-hidden="true">
        {POKEMON_DECO.map((p, i) => (
          <img key={i} className={`mt-poke ${p.classe}`} src={SHOWDOWN(p.nom)} alt=""
            onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ))}
      </div>

      {/* Contenu : logo + slots */}
      <div className={`mt-contenu ${pret ? 'mt-pret' : ''}`}>
        <div className="mt-logo-zone">
          <img className="mt-logo" src="/logo-titre.png" alt="Pokedle"
            onError={(e) => { e.currentTarget.style.display = 'none'; const t = e.currentTarget.nextElementSibling; if (t) t.style.display = 'block' }} />
          <h1 className="mt-logo-txt" style={{ display: 'none' }}>Pokedle</h1>
          <p className="mt-slogan">Attrape-les tous... en pilote automatique !</p>
        </div>

        <div className="mt-slots">
          {[0, 1, 2].map((i) => (
            <SlotSave key={i} index={i} data={slots[i]}
              onJouer={onJouer} onNouvellePartie={onNouvellePartie} onSupprimer={onSupprimer} />
          ))}
        </div>

        <div className="mt-pied">Un jeu fait avec passion · Bonne aventure, Dresseur !</div>
      </div>
    </div>
  )
}

export default MenuTitre