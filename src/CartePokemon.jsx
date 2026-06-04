import { useState, useEffect, useRef } from 'react'
import { COULEURS_TYPES } from './types'
import { xpRequise } from './stats'
import { XP_BASE_NIVEAU } from './config'
import { ROLES, determinerRole, passifDe } from './roles'
import { ultimeDuRole } from './ultimes'

function CartePokemon({
  pokemon, pvActuels, jauge = 0, niveau, compact = false,
  // Props d'ultime (optionnelles : seule l'équipe joueur les passe).
  chargeUltime = 0, coutUltime = 0, ultimePret = false, onUltime = null, ultimeEnnemi = false,
}) {
  const pourcentageVie = (pvActuels / pokemon.pvMax) * 100
  const ko = pvActuels <= 0

  // --- Détection d'un coup reçu (baisse de PV) pour l'animation ---
  const pvPrecedents = useRef(pvActuels)
  const [prendCoup, setPrendCoup] = useState(false)
  useEffect(() => {
    if (pvActuels < pvPrecedents.current && pvActuels >= 0) {
      setPrendCoup(true)
      const t = setTimeout(() => setPrendCoup(false), 320)
      pvPrecedents.current = pvActuels
      return () => clearTimeout(t)
    }
    pvPrecedents.current = pvActuels
  }, [pvActuels])

  // --- Halo d'effet de RÔLE (glow coloré) déclenché au bon moment ---
  // tank: prend un coup · soutien: PV montent · dps: vient de frapper (jauge retombe)
  // eclaireur: jauge progresse vite. On détecte via PV/jauge précédents.
  const roleCourant = pokemon.role || determinerRole(pokemon)
  const [haloRole, setHaloRole] = useState(false)
  const pvPrecHalo = useRef(pvActuels)
  const jaugePrecHalo = useRef(jauge)
  useEffect(() => {
    let declenche = false
    if (roleCourant === 'tank' && pvActuels < pvPrecHalo.current) declenche = true
    else if (roleCourant === 'soutien' && pvActuels > pvPrecHalo.current) declenche = true
    else if (roleCourant === 'dps' && jauge < jaugePrecHalo.current - 20) declenche = true // jauge retombe = a frappé
    else if (roleCourant === 'eclaireur' && jauge > jaugePrecHalo.current && jauge - jaugePrecHalo.current > 3) declenche = true
    pvPrecHalo.current = pvActuels
    jaugePrecHalo.current = jauge
    if (declenche) {
      setHaloRole(true)
      const t = setTimeout(() => setHaloRole(false), 450)
      return () => clearTimeout(t)
    }
  }, [pvActuels, jauge, roleCourant])

  const niv = pokemon.niveau || 1
  const requise = xpRequise(niv, XP_BASE_NIVEAU)
  const pourcentageXP = Math.min(100, ((pokemon.xp || 0) / requise) * 100)

  const evolueBientot =
    pokemon.evolueEn &&
    pokemon.evolueNiveau &&
    pokemon.formeEvoluee &&
    pokemon.evolueNiveau - niv <= 3 &&
    pokemon.evolueNiveau - niv > 0

  // Rôle (Tank / DPS / Éclaireur / Soutien) + passif.
  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]
  const passif = passifDe(pokemon)

  // Ultime du rôle + état de charge (seulement si on a reçu des props d'ultime).
  const ultime = ultimeDuRole(role)
  const afficheUltime = coutUltime > 0 && ultime && !ko
  const pourcentageUltime = coutUltime > 0 ? Math.min(100, (chargeUltime / coutUltime) * 100) : 0

  return (
    <div className={`carte-pokemon ${compact ? 'compact' : ''} ${ko ? 'ko' : ''} ${pokemon.shiny ? 'est-shiny' : ''} ${prendCoup ? 'prend-coup' : ''} ${haloRole ? `halo-role halo-${roleCourant}` : ''}`}>
      {evolueBientot && (
        <span className="badge-evolution" title={`Évolue niveau ${pokemon.evolueNiveau}`}>⏫</span>
      )}
      {pokemon.shiny && (
        <span className="badge-shiny" title="Shiny !">✨</span>
      )}

      {/* Bouton/jauge d'ultime. Joueur = cliquable ; ennemi = visible non-cliquable. */}
      {afficheUltime && (
        <button
          className={`bouton-ultime ${ultimePret ? 'pret' : ''} ${ultimeEnnemi ? 'ultime-ennemi' : ''}`}
          title={ultimeEnnemi
            ? `Ultime ennemi ${ultime.nom} (${chargeUltime}/${coutUltime})`
            : (ultimePret ? `${ultime.nom} prêt ! Clique pour lancer.` : `${ultime.nom} (${chargeUltime}/${coutUltime})`)}
          onClick={() => { if (!ultimeEnnemi && ultimePret && onUltime) onUltime() }}
          disabled={ultimeEnnemi || !ultimePret}
          style={{ '--couleur-ultime': ultime.couleur }}
        >
          <span className="bouton-ultime-emoji">{ultime.emoji}</span>
          <span className="bouton-ultime-jauge" style={{ height: `${pourcentageUltime}%` }}></span>
        </button>
      )}

      <div className="sprite-zone">
        <img src={pokemon.sprite} alt={pokemon.nom} className="sprite" />
      </div>
      <h2>
        {infoRole && <span className="role-inline" title={infoRole.nom}>{infoRole.emoji}</span>}
        {pokemon.nom} {niveau ? <span className="niveau-badge">N.{niveau}</span> : null}
      </h2>
      {/* Passif du Pokémon (sous le nom) */}
      {passif && (
        <div className="carte-passif" title={passif.description}>
          <span className="carte-passif-emoji">{passif.emoji}</span>
          <span className="carte-passif-nom">{passif.nom}</span>
        </div>
      )}
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