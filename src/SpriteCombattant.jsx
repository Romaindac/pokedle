import { useState, useEffect, useRef } from 'react'
import { ROLES, determinerRole } from './roles'
import { nomShowdown } from './pokedexNoms'
import { xpRequise } from './stats'
import { XP_BASE_NIVEAU } from './config'
import { statutsActifs } from './statuts'
import { COULEURS_TYPES } from './types'
import AuraPokemon from './AuraPokemon'
import SocleCarte from './SocleCarte'

// ============================================================
// SPRITE COMBATTANT — REFONTE ARENE DE DUEL
// Chaque combattant = une colonne propre :
//   ENNEMI : [mini-plaque] puis [sprite sur sa carte]
//   JOUEUR : [sprite sur sa carte] puis [panneau de vie complet]
// Panneau joueur redessine (inline, zero App.css) :
//   nom + niveau + role + shiny | barre PV | jauge ATB | barre XP
// K.O. : sprite estompe gris + carte retournee grisee.
// ============================================================


// Corrections de centrage pour les sprites mal cadres dans leur PNG Showdown.
// Cle = nom (minuscule, sans accent), valeur = decalage horizontal en px
// (negatif = gauche, positif = droite). Ajoute ici tout sprite decale.
const DECALAGE_SPRITE = {
  mewtwo: -26,
  entei: -14,
}
function decalageSprite(nom) {
  const n = (nom || '').toLowerCase().split('-')[0]
  return DECALAGE_SPRITE[n] || 0
}

function nomSpriteShowdown(pokemon) {
  const num = pokemon.id || pokemon.numero
  if (typeof num === 'number' && num >= 1 && num <= 1025) {
    const n = nomShowdown(num)
    if (n) return n
  }
  let n = (pokemon.nom || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  const i = n.indexOf('-')
  if (i !== -1) n = n.slice(0, i + 1) + n.slice(i + 1).replace(/-/g, '')
  return n
}

function SpriteCombattant({
  pokemon, pvActuels, jauge = 0, camp = 'joueur',
  ultimeLance = false, ultimeEnnemi = false,
  marqueeMaster = false, ciblableMaster = false, onCiblerMaster = null,
  plafond = null,
}) {
  const pvMax = pokemon.pvMax || 1
  const pourcentageVie = Math.max(0, Math.min(100, (pvActuels / pvMax) * 100))
  const ko = pvActuels <= 0
  const estJoueur = camp === 'joueur'

  const couleurPv = pourcentageVie > 50 ? '#34d399' : pourcentageVie > 22 ? '#fbbf24' : '#ef4444'

  const niveau = pokemon.niveau || 1
  const auMax = plafond != null && niveau >= plafond
  const xpReq = xpRequise(niveau, XP_BASE_NIVEAU) || 1
  const xpAct = pokemon.xp || 0
  const pourcentageXp = auMax ? 100 : Math.max(0, Math.min(100, (xpAct / xpReq) * 100))

  // --- Cascade d'URLs de sprite selon le camp ---
  const num = pokemon.id || pokemon.numero
  const nomSd = nomSpriteShowdown(pokemon)
  const shiny = !!pokemon.shiny
  const dossierAni = shiny ? 'ani-shiny' : 'ani'
  const dossierAniBack = shiny ? 'ani-back-shiny' : 'ani-back'
  const base = 'https://play.pokemonshowdown.com/sprites/'
  const repoBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
  const numValide = typeof num === 'number'

  let sources
  if (estJoueur) {
    sources = [
      nomSd ? `${base}${dossierAniBack}/${nomSd}.gif` : null,
      numValide ? `${repoBase}back/${shiny ? 'shiny/' : ''}${num}.png` : null,
      nomSd ? `${base}${dossierAni}/${nomSd}.gif` : null,
      pokemon.shiny ? (pokemon.spriteShiny || pokemon.sprite) : pokemon.sprite,
    ].filter(Boolean)
  } else {
    sources = [
      nomSd ? `${base}${dossierAni}/${nomSd}.gif` : null,
      numValide ? `${repoBase}other/${shiny ? 'official-artwork/shiny' : 'official-artwork'}/${num}.png` : null,
      pokemon.shiny ? (pokemon.spriteShiny || pokemon.sprite) : pokemon.sprite,
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

  // --- Bond d'attaque (la jauge ATB retombe = le Pokemon vient d'agir) ---
  const jaugePrec = useRef(jauge)
  const bondRef = useRef(null)
  const bondEnCours = useRef(false)
  useEffect(() => {
    if (jauge < jaugePrec.current - 25 && !ko && bondRef.current && !bondEnCours.current) {
      const dx = estJoueur ? 14 : -14
      const dy = estJoueur ? -8 : 8
      try {
        bondEnCours.current = true
        const anim = bondRef.current.animate(
          [
            { transform: 'translate(0,0)' },
            { transform: `translate(${dx}px, ${dy}px)`, offset: 0.35 },
            { transform: 'translate(0,0)' },
          ],
          { duration: 360, easing: 'ease-out', fill: 'none' }
        )
        anim.onfinish = () => { bondEnCours.current = false }
        anim.oncancel = () => { bondEnCours.current = false }
      } catch {
        bondEnCours.current = false
      }
    }
    jaugePrec.current = jauge
  }, [jauge, ko, estJoueur])

  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]
  const statuts = ko ? [] : statutsActifs(pokemon)
  const estRare = !!pokemon.estRareTour
  const estBoss = !!pokemon.estBoss
  const auraContour = estBoss ? '#ff2d2d' : (shiny ? '#fcd34d' : (COULEURS_TYPES[(pokemon.types || [])[0]] || '#9099a1'))

  // Panneau de vie complet — IDENTIQUE pour joueur et ennemi, sous la carte.
  // (La barre XP doree n'a de sens que pour le joueur.)
  const panneauInfos = (
    <div style={{
      marginTop: 22, width: '94%', maxWidth: 168,
      background: 'rgba(8,12,20,0.85)',
      border: prendCoup ? '1px solid rgba(239,68,68,0.7)' : '1px solid rgba(255,255,255,0.14)',
      borderRadius: 10, padding: '5px 9px 7px',
      position: 'relative', zIndex: 3,
      fontFamily: "'Rubik', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        {estBoss && <span style={{ fontSize: 10 }}>👑</span>}
        {infoRole && <span style={{ fontSize: 10 }} title={infoRole.nom}>{infoRole.emoji}</span>}
        <span style={{ fontSize: 11, fontWeight: 800, color: '#eef2fb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{pokemon.nom}</span>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: auMax ? '#fcd34d' : '#9ca8bd' }}>{auMax ? `N.${niveau} MAX` : `N.${niveau}`}</span>
        {pokemon.shiny && <span style={{ fontSize: 9 }}>✨</span>}
      </div>
      {/* PV */}
      <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pourcentageVie + '%', background: couleurPv, borderRadius: 4, transition: 'width 0.3s ease' }}></div>
      </div>
      {/* Jauge ATB */}
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 3 }}>
        <div style={{ height: '100%', width: (ko ? 0 : jauge) + '%', background: '#38bdf8', borderRadius: 2 }}></div>
      </div>
      {/* XP doree (joueur seulement) */}
      {estJoueur && (
        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 3 }} title={auMax ? 'Niveau maximum' : `XP : ${xpAct} / ${xpReq}`}>
          <div style={{ height: '100%', width: pourcentageXp + '%', background: 'linear-gradient(to right, #b8860b, #fcd34d)', borderRadius: 2, transition: 'width 0.4s ease' }}></div>
        </div>
      )}
      <div style={{ textAlign: 'right', fontSize: 9.5, fontWeight: 700, color: '#9ca8bd', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>
        {Math.max(0, pvActuels)} / {pvMax}
      </div>
    </div>
  )

  return (
    <div
      className={`cbt-slot ${estJoueur ? 'cbt-joueur' : 'cbt-ennemi'} ${ko ? 'cbt-ko' : ''} ${prendCoup ? 'cbt-coup' : ''} ${pokemon.shiny ? 'cbt-shiny' : ''} ${estRare ? 'cbt-rare' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative' }}
    >
      {/* Sprite sur sa carte */}
      <div className="cbt-sprite-zone" style={{
        position: 'relative', width: '100%',
        height: 152,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        {estRare && !ko && <span className="cbt-couronne-rare" title="Pokemon rare" style={{ position: 'absolute', top: -14, zIndex: 4 }}>👑</span>}
        {ciblableMaster && onCiblerMaster && (
          <button type="button"
            className={`cbt-cible-master ${marqueeMaster ? 'actif' : ''}`}
            title={marqueeMaster ? 'Master Ball ciblee (clic pour annuler)' : 'Cibler pour une Master Ball'}
            onClick={(e) => { e.stopPropagation(); onCiblerMaster() }}
            style={{ position: 'absolute', top: -4, right: 2, zIndex: 5 }}>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
              alt="Master Ball" className="cbt-cible-master-img"
              onError={(e) => { e.currentTarget.replaceWith(document.createTextNode('⚫')) }} />
          </button>
        )}
        {/* aura geree par le Canvas AuraPokemon (mode invocation) ci-dessous */}
        {/* SOCLE-CARTE : dos par defaut, carte choisie, retournee grisee si K.O. ; cadre reagit au statut */}
        <SocleCarte carte={pokemon.socleCarte || null} shiny={shiny} boss={estBoss} ko={ko} camp={camp} statuts={statuts} />
        <div className="cbt-sprite-bond" ref={bondRef} style={{ position: 'relative', zIndex: 2, marginBottom: 58, display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div style={{ transform: estBoss ? 'scale(1.1)' : undefined, transformOrigin: 'bottom center', filter: ko ? 'grayscale(1) opacity(0.35)' : undefined }}>
            <img
              src={sources[0]}
              alt={pokemon.nom}
              className="cbt-sprite"
              data-etape="0"
              onError={onError}
              style={{ maxHeight: estBoss ? 96 : 108, maxWidth: '100%', display: 'block', margin: '0 auto', objectFit: 'contain', transform: `translateX(${decalageSprite(pokemon.nom)}px)` }}
            />
          </div>
        </div>
        {/* AURA CANVAS : type / statut / shiny / boss */}
        <div style={{ position: 'absolute', left: '50%', bottom: 10, transform: 'translateX(-50%)', width: 200, height: 230, zIndex: 1, pointerEvents: 'none' }}>
          <AuraPokemon types={pokemon.types || []} statuts={statuts} shiny={shiny} ko={ko} boss={estBoss} special={!!pokemon.estFusion} legendaire={pokemon.rarete === 'special' || pokemon.rarete === 'legendaire'} />
        </div>
      </div>

      {/* Panneau de vie complet en dessous (joueur ET ennemi) */}
      {panneauInfos}
    </div>
  )
}

export default SpriteCombattant