import { useState, useEffect, useRef } from 'react'
import { ROLES, determinerRole } from './roles'
import { nomShowdown } from './pokedexNoms'

// Sprite de combat "champ de bataille" : sprite animé sur le décor + plaque de combat.
// - camp 'joueur'  → sprite de DOS (ani-back → back → ani → stocké)
// - camp 'ennemi'  → sprite de FACE (ani → artwork HD → stocké)
// Garde : barre de PV colorée, nom + niveau, liseré de jauge ATB, halo de rôle,
// flash de coup, badge d'ultime, ciblage Master Ball (ennemis).
function SpriteCombattant({
  pokemon, pvActuels, jauge = 0, camp = 'joueur',
  ultimeLance = false, ultimeEnnemi = false,
  marqueeMaster = false, ciblableMaster = false, onCiblerMaster = null,
}) {
  const pvMax = pokemon.pvMax || 1
  const pourcentageVie = Math.max(0, Math.min(100, (pvActuels / pvMax) * 100))
  const ko = pvActuels <= 0
  const estJoueur = camp === 'joueur'

  // Couleur de la barre de PV selon le pourcentage (vert → orange → rouge).
  const couleurPv = pourcentageVie > 50 ? '#34d399' : pourcentageVie > 22 ? '#fbbf24' : '#ef4444'

  // --- Cascade d'URLs de sprite selon le camp ---
  const num = pokemon.id || pokemon.numero
  const nomSd = num ? nomShowdown(num) : (pokemon.nom || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const shiny = !!pokemon.shiny
  const dossierAni = shiny ? 'ani-shiny' : 'ani'
  const dossierAniBack = shiny ? 'ani-back-shiny' : 'ani-back'
  const base = 'https://play.pokemonshowdown.com/sprites/'
  const repoBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

  // Liste ordonnée des sources à tenter (la 1re qui charge gagne ; onError descend).
  let sources
  if (estJoueur) {
    sources = [
      nomSd ? `${base}${dossierAniBack}/${nomSd}.gif` : null,            // dos animé
      num ? `${repoBase}back/${shiny ? 'shiny/' : ''}${num}.png` : null, // dos statique
      nomSd ? `${base}${dossierAni}/${nomSd}.gif` : null,                // face animée (repli)
      pokemon.shiny ? (pokemon.spriteShiny || pokemon.sprite) : pokemon.sprite, // stocké
    ].filter(Boolean)
  } else {
    sources = [
      nomSd ? `${base}${dossierAni}/${nomSd}.gif` : null,                          // face animée
      num ? `${repoBase}other/${shiny ? 'official-artwork/shiny' : 'official-artwork'}/${num}.png` : null, // artwork HD
      pokemon.shiny ? (pokemon.spriteShiny || pokemon.sprite) : pokemon.sprite,    // stocké
    ].filter(Boolean)
  }
  const onError = (e) => {
    const img = e.currentTarget
    const etape = parseInt(img.dataset.etape || '0', 10)
    const suivante = etape + 1
    if (suivante < sources.length) {
      img.dataset.etape = String(suivante)
      img.src = sources[suivante]
    }
  }

  // --- Flash de coup (baisse de PV) ---
  const pvPrec = useRef(pvActuels)
  const [prendCoup, setPrendCoup] = useState(false)
  useEffect(() => {
    if (pvActuels < pvPrec.current && pvActuels >= 0) {
      setPrendCoup(true)
      const t = setTimeout(() => setPrendCoup(false), 320)
      pvPrec.current = pvActuels
      return () => clearTimeout(t)
    }
    pvPrec.current = pvActuels
  }, [pvActuels])

  // --- Bond d'attaque (la jauge ATB retombe = le Pokémon vient d'agir) ---
  const jaugePrec = useRef(jauge)
  const [compteurAttaque, setCompteurAttaque] = useState(0)
  useEffect(() => {
    if (jauge < jaugePrec.current - 25 && !ko) {
      setCompteurAttaque((n) => n + 1) // change à chaque attaque → relance l'animation
    }
    jaugePrec.current = jauge
  }, [jauge, ko])

  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]

  return (
    <div className={`cbt-slot ${estJoueur ? 'cbt-joueur' : 'cbt-ennemi'} ${ko ? 'cbt-ko' : ''} ${prendCoup ? 'cbt-coup' : ''} ${pokemon.shiny ? 'cbt-shiny' : ''} ${marqueeMaster ? 'cbt-cible-master' : ''}`}>
      {/* Plaque de combat (nom + niveau + barre PV) */}
      <div className="cbt-plaque">
        <div className="cbt-plaque-haut">
          {infoRole && <span className="cbt-role" title={infoRole.nom}>{infoRole.emoji}</span>}
          <span className="cbt-nom">{pokemon.nom}</span>
          <span className="cbt-niv">N.{pokemon.niveau || 1}</span>
          {pokemon.shiny && <span className="cbt-shiny-badge" title="Shiny">✨</span>}
        </div>
        <div className="cbt-barre-pv">
          <div className="cbt-barre-pv-fill" style={{ width: `${pourcentageVie}%`, background: couleurPv }}></div>
        </div>
        <div className="cbt-barre-atb">
          <div className="cbt-barre-atb-fill" style={{ width: `${ko ? 0 : jauge}%` }}></div>
        </div>
        <span className="cbt-pv-txt">{Math.max(0, pvActuels)} / {pvMax}</span>
      </div>

      {/* Sprite sur le terrain */}
      <div className="cbt-sprite-zone">
        {ciblableMaster && onCiblerMaster && (
          <button type="button"
            className={`cbt-cible-master ${marqueeMaster ? 'actif' : ''}`}
            title={marqueeMaster ? 'Master Ball ciblée (clic pour annuler)' : 'Cibler pour une Master Ball'}
            onClick={(e) => { e.stopPropagation(); onCiblerMaster() }}>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
              alt="Master Ball" className="cbt-cible-master-img"
              onError={(e) => { e.currentTarget.replaceWith(document.createTextNode('⚫')) }} />
          </button>
        )}
        <div
          className={`cbt-sprite-bond ${estJoueur ? 'bond-joueur' : 'bond-ennemi'} ${compteurAttaque > 0 ? 'a-attaque' : ''}`}
          key={compteurAttaque}
        >
          <img
            src={sources[0]}
            alt={pokemon.nom}
            className="cbt-sprite"
            data-etape="0"
            onError={onError}
          />
        </div>
      </div>
    </div>
  )
}

export default SpriteCombattant