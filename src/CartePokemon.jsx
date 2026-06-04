import { useState, useEffect, useRef } from 'react'
import { COULEURS_TYPES } from './types'
import { xpRequise } from './stats'
import { XP_BASE_NIVEAU } from './config'
import { ROLES, determinerRole } from './roles'

function CartePokemon({ pokemon, pvActuels, jauge = 0, niveau, compact = false }) {
  const pourcentageVie = (pvActuels / pokemon.pvMax) * 100
  const ko = pvActuels <= 0

  // --- Détection d'un coup reçu (baisse de PV) pour l'animation ---
  const pvPrecedents = useRef(pvActuels)
  const [prendCoup, setPrendCoup] = useState(false)
  useEffect(() => {
    // Si les PV ont baissé (et pas un reset/respawn qui les fait remonter), on flash.
    if (pvActuels < pvPrecedents.current && pvActuels >= 0) {
      setPrendCoup(true)
      const t = setTimeout(() => setPrendCoup(false), 320)
      pvPrecedents.current = pvActuels
      return () => clearTimeout(t)
    }
    pvPrecedents.current = pvActuels
  }, [pvActuels])

  const niv = pokemon.niveau || 1
  const requise = xpRequise(niv, XP_BASE_NIVEAU)
  const pourcentageXP = Math.min(100, ((pokemon.xp || 0) / requise) * 100)

  const evolueBientot =
    pokemon.evolueEn &&
    pokemon.evolueNiveau &&
    pokemon.formeEvoluee &&
    pokemon.evolueNiveau - niv <= 3 &&
    pokemon.evolueNiveau - niv > 0

  // Rôle (Tank / DPS / Éclaireur / Soutien)
  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]

  return (
    <div className={`carte-pokemon ${compact ? 'compact' : ''} ${ko ? 'ko' : ''} ${pokemon.shiny ? 'est-shiny' : ''} ${prendCoup ? 'prend-coup' : ''}`}>
      {evolueBientot && (
        <span className="badge-evolution" title={`Évolue niveau ${pokemon.evolueNiveau}`}>⏫</span>
      )}
      {pokemon.shiny && (
        <span className="badge-shiny" title="Shiny !">✨</span>
      )}
      <div className="sprite-zone">
        <img src={pokemon.sprite} alt={pokemon.nom} className="sprite" />
      </div>
      <h2>
        {infoRole && <span className="role-inline" title={infoRole.nom}>{infoRole.emoji}</span>}
        {pokemon.nom} {niveau ? <span className="niveau-badge">N.{niveau}</span> : null}
      </h2>
      <div className="types-badges">
        {(pokemon.types || []).map((t) => (
          <span key={t} className="type-badge" style={{ backgroundColor: COULEURS_TYPES[t] || '#888' }}>
            {t}
          </span>
        ))}
      </div>
      <div className="barre-ligne">
        <span className="barre-repere" title="Points de Vie">❤️</span>
        <div className="barre-vie">
          <div className="barre-vie-remplissage" style={{ width: `${pourcentageVie}%` }}></div>
        </div>
      </div>
      <div className="barre-ligne">
        <span className="barre-repere" title="Jauge d'action (vitesse)">⚡</span>
        <div className="barre-jauge">
          <div className="barre-jauge-remplissage" style={{ width: `${ko ? 0 : jauge}%` }}></div>
        </div>
      </div>
      <div className="barre-ligne">
        <span className="barre-repere" title="Expérience">⭐</span>
        <div className="barre-xp">
          <div className="barre-xp-remplissage" style={{ width: `${pourcentageXP}%` }}></div>
        </div>
      </div>
      <p className="carte-pv">PV : {pvActuels} / {pokemon.pvMax}</p>
    </div>
  )
}

export default CartePokemon