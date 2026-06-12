import { useState, useEffect, useRef } from 'react'
import { ROLES, determinerRole } from './roles'
import { nomShowdown } from './pokedexNoms'
import { xpRequise } from './stats'
import { XP_BASE_NIVEAU } from './config'
import { statutsActifs } from './statuts'
import { COULEURS_TYPES } from './types'

// ============================================================
// SPRITE COMBATTANT — REFONTE HOLOGRAMME v7 (projection boostée)
// Le sprite EST une projection holographique : teinte holo, lignes
// de scan qui épousent sa forme (via mask), flicker, glow intense.
// La carte inclinée + colonne de lumière dense + base d'émission +
// particules + ondes au sol complètent l'illusion "le Pokémon est
// projeté depuis la carte".
//
// 100% CSS pur (zéro canvas). On garde TOUTE la logique : PV, jauge
// ATB, XP, niveau, flash de coup, bond d'attaque, master ball, K.O.
// ============================================================

const DOS_CARTE = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg'
const DOS_CARTE_SECOURS = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'

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

const COULEUR_STATUT = {
  gel: '#7fd9f5', brulure: '#ff7a1a', poison: '#cf6bf0',
  paralysie: '#ffe93c', rage: '#ff4d4d', garde: '#3da9e0', hate: '#34d399',
}
const ORDRE_STATUTS = ['gel', 'brulure', 'poison', 'paralysie', 'rage', 'garde', 'hate']

// Écussons de rôle (formes géométriques distinctes, comme la maquette).
const GLYPHE_ROLE = {
  tank: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l9 4v6c0 6-4 10-9 12-5-2-9-6-9-12V5z"/></svg>',
  dps: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1l3 8 8 0-6.5 5 2.5 8-7-5-7 5 2.5-8L1 9l8 0z"/></svg>',
  eclaireur: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 1L3 14h7l-2 9 11-14h-7z"/></svg>',
  soutien: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 2h4v6h6v4h-6v6h-4v-6H4V8h6z"/></svg>',
  joker: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="#0a0e1a"/></svg>',
}
const GLYPHE_SPARK = '<svg viewBox="0 0 24 24" fill="#fcd34d"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z"/></svg>'
const GLYPHE_BOSS = '<svg viewBox="0 0 40 20" fill="#fcd34d"><path d="M20 2l6 8-6-3-6 3z"/><path d="M8 6l5 7-5-2-5 2z" opacity="0.85"/><path d="M32 6l5 7-5-2-5 2z" opacity="0.85"/></svg>'
const GLYPHE_ULTIME = '<svg viewBox="0 0 32 32"><defs><linearGradient id="apzug" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fcd34d"/></linearGradient></defs><path d="M16 3l5 7-5 19-5-19z" fill="url(#apzug)" stroke="#fcd34d" stroke-width="1"/><path d="M11 10h10l-5 4z" fill="#fff" opacity="0.7"/></svg>'

// Glyphes SVG des statuts (néon, intégrés près du Pokémon).
const GLYPHE_STATUT = {
  gel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M4 6l16 12M20 6L4 18"/></svg>',
  brulure: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-2-1-3-1-4 2 1 3 3 3 6a5 5 0 01-10 0c0-5 5-7 5-11z"/></svg>',
  poison: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8 8 6 11 6 15a6 6 0 0012 0c0-4-2-7-6-13z"/></svg>',
  paralysie: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-2 8 10-13h-7z"/></svg>',
  rage: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 8l4 2 1-5 3 4 3-5 2 5 4-2-2 7H5z"/><rect x="5" y="16" width="14" height="3" rx="1"/></svg>',
  garde: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/></svg>',
  hate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 4a8 8 0 108 8"/><path d="M12 4l3 3-3 3"/></svg>',
}

const KEYFRAMES_ID = 'holo-combat-keyframes-v7'
function injecterKeyframes() {
  if (typeof document === 'undefined') return
  const ancien = document.getElementById('holo-combat-keyframes')
  if (ancien) ancien.remove()
  if (document.getElementById(KEYFRAMES_ID)) return
  const s = document.createElement('style')
  s.id = KEYFRAMES_ID
  s.textContent = `
@keyframes holoFlotte { 0%,100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-5px); } }
@keyframes holoSocle { 0%,100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); } 50% { opacity: 0.95; transform: translateX(-50%) scaleX(1.14); } }
@keyframes holoColonne { 0%,100% { opacity: 0.6; } 50% { opacity: 0.95; } }
/* ondes/anneaux qui s'élargissent à plat sur le sol (fidèle maquette ondeExpand) */
@keyframes holoOnde {
  0% { transform: perspective(200px) rotateX(64deg) scale(0.3); opacity: 0.8; }
  100% { transform: perspective(200px) rotateX(64deg) scale(1.6); opacity: 0; }
}
/* anneau de scan qui grossit pour englober le Pokémon et monte un peu (sans dépasser le sprite) */
@keyframes holoScanMonte {
  0% { bottom: 28px; opacity: 0; transform: translateX(-50%) scale(0.4); }
  25% { opacity: 0.9; }
  75% { opacity: 0.5; }
  100% { bottom: 88px; opacity: 0; transform: translateX(-50%) scale(2.1); }
}
/* aura de rôle qui pulse doucement sous le Pokémon */
@keyframes holoAura { 0%,100% { opacity: 0.3; } 50% { opacity: 0.55; } }
/* carte énergisée : l'aura autour de la carte pulse */
@keyframes holoCarteEnergie { 0%,100% { opacity: 0.5; transform: translateX(-50%) perspective(420px) rotateX(55deg) scale(0.98); } 50% { opacity: 0.9; transform: translateX(-50%) perspective(420px) rotateX(55deg) scale(1.04); } }
/* flash d'énergie sur la surface de la carte */
@keyframes holoCarteSurface { 0%,100% { opacity: 0.4; } 50% { opacity: 0.85; } }
/* stries de scan qui montent dans le cône (lignes de données holographiques) */
@keyframes holoScanFlux { 0% { background-position: 0 0; } 100% { background-position: 0 -12px; } }
/* faisceau qui glitche : saute et change d'opacité par à-coups (façon Ralph) */
@keyframes holoGlitchFaisceau {
  0%, 92%, 100% { opacity: 1; transform: translateX(-50%) scaleX(1); }
  93% { opacity: 0.5; transform: translateX(-52%) scaleX(1.08); }
  94% { opacity: 1; transform: translateX(-48%) scaleX(0.94); }
  95% { opacity: 0.7; transform: translateX(-50%) scaleX(1.04); }
  96% { opacity: 1; transform: translateX(-50%) scaleX(1); }
}
/* micro-particules holographiques qui flottent et scintillent */
@keyframes holoFlotteParticule {
  0% { transform: translate(0, 0) scale(1); opacity: 0; }
  20% { opacity: 1; }
  50% { transform: translate(var(--dx), -28px) scale(0.8); opacity: 0.7; }
  80% { opacity: 0.4; }
  100% { transform: translate(calc(var(--dx) * -1), -58px) scale(0.3); opacity: 0; }
}
/* BUG DE MATRICE : bandes qui se décalent horizontalement par à-coups (datamosh) */
@keyframes holoDatamosh {
  0%, 100% { clip-path: inset(0 0 0 0); transform: translateX(0); opacity: 0; }
  10% { clip-path: inset(8% 0 78% 0); transform: translateX(-8px); opacity: 0.9; }
  22% { clip-path: inset(42% 0 44% 0); transform: translateX(9px); opacity: 0.8; }
  34% { clip-path: inset(66% 0 20% 0); transform: translateX(-6px); opacity: 0.85; }
  46% { clip-path: inset(24% 0 60% 0); transform: translateX(7px); opacity: 0.7; }
  58% { clip-path: inset(82% 0 4% 0); transform: translateX(-9px); opacity: 0.8; }
  70% { clip-path: inset(14% 0 70% 0); transform: translateX(5px); opacity: 0.6; }
  85% { clip-path: inset(50% 0 38% 0); transform: translateX(-4px); opacity: 0.4; }
}
/* scanline de corruption qui balaye verticalement (façon Matrix/CRT cassé) */
@keyframes holoScanCorrupt {
  0% { top: -10%; opacity: 0; }
  10% { opacity: 0.9; }
  90% { opacity: 0.7; }
  100% { top: 105%; opacity: 0; }
}
/* pluie de code verticale qui défile (Matrix) */
@keyframes holoCodeRain { 0% { background-position: 0 0; } 100% { background-position: 0 40px; } }
/* pixels de données qui clignotent dans le faisceau (matrice légère) */
@keyframes holoDataClignote {
  0%, 100% { opacity: 0; transform: translateY(0); }
  10% { opacity: 0.9; }
  45% { opacity: 0.3; }
  55% { opacity: 0.85; }
  90% { opacity: 0; transform: translateY(-14px); }
}
/* barre de vie vivante : reflet brillant qui balaye */
@keyframes holoLpBrille { 0% { transform: translateX(-120%); } 60%, 100% { transform: translateX(320%); } }
/* barre de vie : pulsation douce du glow quand PV bas */
@keyframes holoLpAlerte { 0%,100% { opacity: 0.7; } 50% { opacity: 1; } }
/* finition de carte (prismatique/brillante) qui défile */
@keyframes holoPrisma { 0% { background-position: 0 0; } 100% { background-position: 200% 0; } }
/* flicker CRT : la projection vacille très légèrement */
@keyframes holoCRT {
  0%, 100% { opacity: 0.92; }
  50% { opacity: 0.85; }
  82% { opacity: 0.92; }
  83% { opacity: 0.65; }
  84% { opacity: 0.92; }
  93% { opacity: 0.8; }
  94% { opacity: 0.92; }
}
@keyframes holoAberration {
  0%, 90%, 100% { filter: none; transform: translateX(0); }
  91% { transform: translateX(-1.5px); }
  92% { transform: translateX(1.5px); }
  93% { transform: translateX(0); }
}
@keyframes holoChromaJitter {
  0%, 100% { filter: drop-shadow(1.5px 0 0 rgba(255,40,90,0.5)) drop-shadow(-1.5px 0 0 rgba(0,220,255,0.5)) drop-shadow(0 0 13px var(--holo-glow)) drop-shadow(0 0 5px var(--holo-glow)) brightness(1.06); }
  33% { filter: drop-shadow(2px 1px 0 rgba(255,40,90,0.55)) drop-shadow(-2px -1px 0 rgba(0,220,255,0.55)) drop-shadow(0 0 16px var(--holo-glow)) drop-shadow(0 0 6px var(--holo-glow)) brightness(1.08); }
  66% { filter: drop-shadow(1px 0 0 rgba(255,40,90,0.42)) drop-shadow(-1px 0 0 rgba(0,220,255,0.42)) drop-shadow(0 0 12px var(--holo-glow)) brightness(1.04); }
}
@keyframes holoIrise { 0% { background-position: 0% 0%; } 100% { background-position: 0% 200%; } }
@keyframes holoScanSprite { 0% { background-position: 0 0; } 100% { background-position: 0 4px; } }
@keyframes holoParticule {
  0% { transform: translateY(0) scale(1); opacity: 0; }
  15% { opacity: 1; }
  85% { opacity: 0.9; }
  100% { transform: translateY(-64px) scale(0.35); opacity: 0; }
}
@keyframes koFantome { 0%,100% { transform: translateX(-50%) translateY(0); opacity: 1; } 50% { transform: translateX(-50%) translateY(-4px); opacity: 0.7; } }
/* badge ultime qui pulse quand prêt */
@keyframes holoUltime { 0%,100% { transform: scale(1); } 50% { transform: scale(1.18); } }
/* étincelles shiny qui scintillent */
@keyframes holoSpark { 0%,100% { opacity: 0; transform: scale(0.6); } 50% { opacity: 1; transform: scale(1); } }
/* pastilles de statut qui pulsent */
@keyframes holoStatutPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.12); } }
/* chiffres de combat qui jaillissent (utilisé par rendreChiffre dans App.jsx) */
@keyframes chiffreJaillit {
  0% { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 0; }
  20% { transform: translateX(-50%) translateY(-8px) scale(1.2); opacity: 1; }
  70% { opacity: 1; }
  100% { transform: translateX(-50%) translateY(-40px) scale(1); opacity: 0; }
}
/* éclat lumineux au moment de l'attaque */
@keyframes holoEclatTir { 0% { transform: translateX(-50%) scale(0.4); opacity: 0.9; } 100% { transform: translateX(-50%) scale(1.4); opacity: 0; } }
/* GLITCH façon Vanellope : le sprite saute, se décale, RGB split violent */
@keyframes holoGlitch {
  0% { transform: translate(0,0); }
  15% { transform: translate(-4px, 1px); filter: drop-shadow(4px 0 0 rgba(255,40,90,0.9)) drop-shadow(-4px 0 0 rgba(0,220,255,0.9)) brightness(1.2); }
  30% { transform: translate(5px, -2px); filter: drop-shadow(-5px 0 0 rgba(255,40,90,0.9)) drop-shadow(5px 0 0 rgba(0,220,255,0.9)) brightness(1.1); }
  45% { transform: translate(-3px, 2px); filter: drop-shadow(3px 1px 0 rgba(255,40,90,0.8)) drop-shadow(-3px -1px 0 rgba(0,220,255,0.8)); }
  60% { transform: translate(4px, 0); filter: drop-shadow(-4px 0 0 rgba(255,40,90,0.9)) drop-shadow(4px 0 0 rgba(0,220,255,0.9)) brightness(1.15); }
  75% { transform: translate(-2px, -1px); }
  90% { transform: translate(2px, 1px); filter: drop-shadow(2px 0 0 rgba(255,40,90,0.7)) drop-shadow(-2px 0 0 rgba(0,220,255,0.7)); }
  100% { transform: translate(0,0); }
}
/* bandes de glitch horizontales qui sautent */
@keyframes holoGlitchBandes {
  0%,100% { clip-path: inset(0 0 0 0); }
  20% { clip-path: inset(20% 0 60% 0); transform: translateX(6px); }
  40% { clip-path: inset(55% 0 15% 0); transform: translateX(-7px); }
  60% { clip-path: inset(35% 0 40% 0); transform: translateX(5px); }
  80% { clip-path: inset(70% 0 5% 0); transform: translateX(-4px); }
}

/* ===== NEUTRALISATION anciennes règles App.css ===== */
.cbt-slot, .cbt-slot * { transition: none !important; }
.cbt-slot .cbt-sprite { animation: none !important; }
.cbt-scene:hover, .cbt-scene *:hover { transform: none; }
`
  document.head.appendChild(s)
}

function SpriteCombattant({
  pokemon, pvActuels, jauge = 0, camp = 'joueur',
  ultimeLance = false, ultimeEnnemi = false,
  marqueeMaster = false, ciblableMaster = false, onCiblerMaster = null,
  plafond = null,
}) {
  injecterKeyframes()

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

  // --- Sprite de FACE ---
  const num = pokemon.id || pokemon.numero
  const nomSd = nomSpriteShowdown(pokemon)
  const shiny = !!pokemon.shiny
  const dossierAni = shiny ? 'ani-shiny' : 'ani'
  const base = 'https://play.pokemonshowdown.com/sprites/'
  const repoBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
  const numValide = typeof num === 'number'

  const sources = [
    nomSd ? `${base}${dossierAni}/${nomSd}.gif` : null,
    numValide ? `${repoBase}other/${shiny ? 'official-artwork/shiny' : 'official-artwork'}/${num}.png` : null,
    numValide ? `${repoBase}${shiny ? 'shiny/' : ''}${num}.png` : null,
    pokemon.shiny ? (pokemon.spriteShiny || pokemon.sprite) : pokemon.sprite,
  ].filter(Boolean)

  const [srcActuelle, setSrcActuelle] = useState(sources[0])

  // Particules holographiques (positions stables, générées une fois). Plus nombreuses.
  const particulesRef = useRef(null)
  if (particulesRef.current === null) {
    particulesRef.current = Array.from({ length: 20 }, (_, i) => ({
      i,
      gauche: 8 + Math.random() * 84,
      taille: 1.5 + Math.random() * 3.5,
      duree: 1.6 + Math.random() * 2,
      delai: -Math.random() * 3.5,
      dx: (Math.random() * 16 - 8).toFixed(0),
      carre: Math.random() > 0.55,
    }))
  }
  // Pixels de "données" matrice qui clignotent dans le faisceau (générés une fois).
  const dataRef = useRef(null)
  if (dataRef.current === null) {
    dataRef.current = Array.from({ length: 9 }, (_, i) => ({
      i,
      gauche: 22 + Math.random() * 56,
      bas: 30 + Math.random() * 90,
      taille: 2 + Math.random() * 2.5,
      duree: (0.5 + Math.random() * 0.8).toFixed(2),
      delai: (-Math.random() * 3).toFixed(2),
    }))
  }

  const onError = (e) => {
    const img = e.currentTarget
    const etape = parseInt(img.dataset.etape || '0', 10)
    const suivante = etape + 1
    if (suivante < sources.length) {
      img.dataset.etape = String(suivante)
      img.src = sources[suivante]
      setSrcActuelle(sources[suivante])
    }
  }

  // --- Flash de coup ---
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

  // --- Bond d'attaque + mise en avant (F) ---
  const jaugePrec = useRef(jauge)
  const bondRef = useRef(null)
  const bondEnCours = useRef(false)
  const [vientDattaquer, setVientDattaquer] = useState(false)
  useEffect(() => {
    if (jauge < jaugePrec.current - 25 && !ko && bondRef.current && !bondEnCours.current) {
      const dy = -12
      try {
        bondEnCours.current = true
        const anim = bondRef.current.animate(
          [
            { transform: 'translateX(-50%) translateY(0)' },
            { transform: `translateX(-50%) translateY(${dy}px)`, offset: 0.35 },
            { transform: 'translateX(-50%) translateY(0)' },
          ],
          { duration: 360, easing: 'ease-out', fill: 'none' }
        )
        anim.onfinish = () => { bondEnCours.current = false }
        anim.oncancel = () => { bondEnCours.current = false }
      } catch {
        bondEnCours.current = false
      }
      // Mise en avant : le sprite grossit + la carte brille plus fort un court instant
      setVientDattaquer(true)
      const t = setTimeout(() => setVientDattaquer(false), 520)
      jaugePrec.current = jauge
      return () => clearTimeout(t)
    }
    jaugePrec.current = jauge
  }, [jauge, ko])

  // --- Glitch aléatoire occasionnel (effet hologramme qui bugge, façon Vanellope) ---
  const [glitch, setGlitch] = useState(false)
  useEffect(() => {
    if (ko) return
    let timerGlitch
    let timerFin
    const programmer = () => {
      // prochain glitch dans 4 à 11 secondes (aléatoire par sprite)
      const delai = 4000 + Math.random() * 7000
      timerGlitch = setTimeout(() => {
        setGlitch(true)
        // le glitch dure 220 à 420 ms
        timerFin = setTimeout(() => {
          setGlitch(false)
          programmer()
        }, 220 + Math.random() * 200)
      }, delai)
    }
    programmer()
    return () => { clearTimeout(timerGlitch); clearTimeout(timerFin) }
  }, [ko])

  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]
  // Type principal (pour le tag) + traduction FR + couleur.
  const TYPE_FR = {
    normal: 'Normal', fire: 'Feu', water: 'Eau', electric: 'Élec', grass: 'Plante',
    ice: 'Glace', fighting: 'Combat', poison: 'Poison', ground: 'Sol', flying: 'Vol',
    psychic: 'Psy', bug: 'Insecte', rock: 'Roche', ghost: 'Spectre', dragon: 'Dragon',
    dark: 'Ténèbres', steel: 'Acier', fairy: 'Fée',
  }
  const typePrincipal = Array.isArray(pokemon.types) && pokemon.types.length > 0 ? pokemon.types[0] : null
  const typeNom = typePrincipal ? (TYPE_FR[typePrincipal] || typePrincipal) : null
  const typeCouleur = typePrincipal && COULEURS_TYPES ? (COULEURS_TYPES[typePrincipal] || '#9aa5c8') : '#9aa5c8'
  const statuts = ko ? [] : statutsActifs(pokemon)
  const estRare = !!pokemon.estRareTour
  const estBoss = !!pokemon.estBoss
  const carte = pokemon.socleCarte || null
  const imageCarte = (carte && carte.imageSmall) ? carte.imageSmall : DOS_CARTE
  const estDos = !(carte && carte.imageSmall)

  const cleStatut = ko ? null : ORDRE_STATUTS.find((s) => (statuts || []).includes(s))
  let accent
  if (cleStatut) accent = COULEUR_STATUT[cleStatut]
  else if (estBoss) accent = '#f43f5e'
  else if (shiny) accent = '#fcd34d'
  else if (estJoueur) accent = '#5eead4'
  else accent = '#f87171'

  const rgba = (hex, a) => {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${a})`
  }

  const erreurDos = (e) => {
    const img = e.currentTarget
    if (img.dataset.secours !== '1') { img.dataset.secours = '1'; img.src = DOS_CARTE_SECOURS; return }
    img.style.display = 'none'
  }

  // ===== ENCART YU-GI-OH (barre de vie vivante + toutes infos) =====
  const lameSvg = (
    <svg viewBox="0 0 24 24" fill="#f87171" style={{ width: 12, height: 12, flexShrink: 0, filter: 'drop-shadow(0 0 3px #f87171)' }}><path d="M4 20l2-2 8-8 3-7-7 3-8 8-2 2 1 1 2-2 4-4 1 1-4 4-2 2z" /></svg>
  )
  const couleurPvFill = pourcentageVie > 50
    ? 'linear-gradient(180deg, #5dffa0 0%, #2dd47a 50%, #16a34a 100%)'
    : pourcentageVie > 22
      ? 'linear-gradient(180deg, #fde047 0%, #f59e0b 50%, #d97706 100%)'
      : 'linear-gradient(180deg, #ff8a8a 0%, #ef4444 50%, #dc2626 100%)'
  const glowPv = pourcentageVie > 50 ? 'rgba(74,222,128,0.8)' : pourcentageVie > 22 ? 'rgba(251,191,36,0.8)' : 'rgba(248,113,113,0.8)'
  const pvBas = pourcentageVie <= 22
  const tailleNom = (pokemon.nom || '').length > 13 ? 10.5 : (pokemon.nom || '').length > 10 ? 12 : 13.5
  const panneauInfos = (
    <div style={{
      marginTop: 6, width: '100%', maxWidth: 198,
      background: 'linear-gradient(180deg, rgba(22,30,52,0.95), rgba(9,13,23,0.97))',
      backdropFilter: 'blur(2px)',
      border: prendCoup ? '1.5px solid rgba(239,68,68,0.8)' : `1.5px solid ${rgba(accent, 0.45)}`,
      borderRadius: 12, padding: 0, overflow: 'hidden',
      position: 'relative', zIndex: 6,
      boxShadow: `0 8px 24px rgba(0,0,0,0.6), 0 0 24px ${rgba(accent, 0.18)}`,
      fontFamily: "'Rubik', system-ui, sans-serif",
    }}>
      {/* Bandeau titre teinté : rôle + nom + niveau */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 9px 5px', background: `linear-gradient(90deg, ${rgba(accent, 0.18)}, transparent 80%)`, borderBottom: `1px solid ${rgba(accent, 0.25)}` }}>
        {infoRole && <span style={{ width: 14, height: 14, flexShrink: 0, color: infoRole.couleur || accent, filter: `drop-shadow(0 0 4px ${infoRole.couleur || accent})`, display: 'block' }} title={infoRole.nom} dangerouslySetInnerHTML={{ __html: GLYPHE_ROLE[role] || '' }} />}
        <span style={{ fontSize: tailleNom, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textShadow: `0 0 8px ${rgba(accent, 0.4)}`, letterSpacing: 0.2 }}>{pokemon.nom}</span>
        {pokemon.shiny && <span style={{ width: 11, height: 11, flexShrink: 0, display: 'block', filter: 'drop-shadow(0 0 3px #fcd34d)' }} dangerouslySetInnerHTML={{ __html: GLYPHE_SPARK }} />}
        <span style={{ fontSize: 9, fontWeight: 900, color: '#04060c', background: 'linear-gradient(180deg, #fde68a, #fcd34d)', padding: '2px 6px', borderRadius: 5, boxShadow: '0 0 8px rgba(252,211,77,0.5)', flexShrink: 0 }}>{auMax ? `N.${niveau}✦` : `N.${niveau}`}</span>
      </div>

      <div style={{ padding: '8px 10px 9px' }}>
        {/* Barre de vie LP épaisse et VIVANTE */}
        <div style={{ height: 18, borderRadius: 5, background: 'linear-gradient(180deg, #14110a, #0a0804)', overflow: 'hidden', position: 'relative', border: `1px solid ${rgba(accent, 0.3)}`, boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)', marginBottom: 7 }}>
          <div style={{ height: '100%', width: pourcentageVie + '%', background: couleurPvFill, boxShadow: `0 0 14px ${glowPv}, inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -2px 4px rgba(0,0,0,0.3)`, borderRadius: 4, position: 'relative', transition: 'width 0.4s cubic-bezier(0.22,1,0.36,1)', animation: pvBas ? 'holoLpAlerte 0.8s ease-in-out infinite' : 'none' }}>
            {/* reflet supérieur */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '45%', background: 'linear-gradient(180deg, rgba(255,255,255,0.4), transparent)', borderRadius: '4px 4px 0 0' }}></div>
            {/* brillance qui balaye (vivant) */}
            {!ko && pourcentageVie > 0 && <div style={{ position: 'absolute', top: 0, bottom: 0, width: 14, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)', filter: 'blur(1px)', animation: 'holoLpBrille 2.8s ease-in-out infinite' }}></div>}
          </div>
          <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 7, fontWeight: 900, color: 'rgba(255,255,255,0.65)', letterSpacing: 1, zIndex: 2, textShadow: '0 1px 2px rgba(0,0,0,1)' }}>PV</span>
          <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,1)', letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums', zIndex: 2 }}>
            {Math.max(0, pvActuels).toLocaleString('fr-FR')} / {pvMax.toLocaleString('fr-FR')}
          </span>
        </div>

        {/* Pied : ATK (score de carte) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flexShrink: 1, overflow: 'hidden' }}>
            {lameSvg}
            <span style={{ fontSize: 8, fontWeight: 900, color: '#ffb0b0', letterSpacing: 0.5, flexShrink: 0 }}>ATK</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', textShadow: '0 0 10px rgba(248,113,113,0.8)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, whiteSpace: 'nowrap' }}>{(pokemon.attaque || 0).toLocaleString('fr-FR')}</span>
          </span>
          {estJoueur && (
            <span style={{ fontSize: 8, fontWeight: 700, color: auMax ? '#fcd34d' : '#9aa5c8', letterSpacing: 0.3, flexShrink: 0 }}>{auMax ? 'MAX' : `${Math.round(pourcentageXp)}%`}</span>
          )}
        </div>
        {/* Barre XP fine en pleine largeur (joueur) */}
        {estJoueur && (
          <div style={{ height: 3, background: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden', marginTop: 5 }} title={auMax ? 'Niveau maximum' : `XP : ${xpAct} / ${xpReq}`}>
            <div style={{ height: '100%', width: pourcentageXp + '%', background: 'linear-gradient(90deg, #b8860b, #fcd34d)', borderRadius: 2, boxShadow: '0 0 4px rgba(252,211,77,0.6)', transition: 'width 0.4s ease' }}></div>
          </div>
        )}
      </div>
    </div>
  )

  const tailleSprite = estBoss ? 104 : 112
  const spriteBottom = ko ? 48 : (estJoueur ? 94 : 90)
  const spriteLeft = ko ? '52%' : (estJoueur ? '58%' : '55%')
  const masque = {
    WebkitMaskImage: `url(${srcActuelle})`,
    maskImage: `url(${srcActuelle})`,
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center bottom',
    maskPosition: 'center bottom',
  }

  return (
    <div
      className={`cbt-slot ${estJoueur ? 'cbt-joueur' : 'cbt-ennemi'} ${ko ? 'cbt-ko' : ''} ${prendCoup ? 'cbt-coup' : ''} ${pokemon.shiny ? 'cbt-shiny' : ''} ${estRare ? 'cbt-rare' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative' }}
    >
      {/* ===== SCÈNE HOLOGRAMME ===== */}
      <div className="cbt-scene" style={{
        position: 'relative', width: '100%', height: 210, pointerEvents: 'none',
      }}>
        {estRare && !ko && <span className="cbt-couronne-rare" title="Pokemon rare" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: -8, zIndex: 8 }}>👑</span>}
        {estBoss && !ko && <span title="Boss" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: -6, width: 30, height: 16, zIndex: 9, filter: 'drop-shadow(0 0 6px #fcd34d)', display: 'block' }} dangerouslySetInnerHTML={{ __html: GLYPHE_BOSS }} />}

        {/* Badge ultime : losange d'énergie, doré pulsant quand prêt */}
        {!ko && (ultimeLance || ultimeEnnemi) && (
          <span title="Ultime prêt" style={{
            position: 'absolute', top: 2, right: 26, width: 24, height: 24, zIndex: 8,
            animation: 'holoUltime 1.1s ease-in-out infinite',
            filter: 'drop-shadow(0 0 8px #fcd34d)',
          }} dangerouslySetInnerHTML={{ __html: GLYPHE_ULTIME }} />
        )}

        {/* Statuts actifs : pastilles néon en colonne, collées au Pokémon (gauche) */}
        {!ko && statuts && statuts.length > 0 && (
          <div style={{
            position: 'absolute', left: 8, top: 52, zIndex: 8,
            display: 'flex', flexDirection: 'column', gap: 4, pointerEvents: 'none',
          }}>
            {ORDRE_STATUTS.filter((s) => statuts.includes(s)).map((s) => {
              const col = COULEUR_STATUT[s]
              return (
                <span key={s} title={s} style={{
                  width: 20, height: 20, borderRadius: 6, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'linear-gradient(180deg, rgba(20,26,44,0.95), rgba(10,14,26,0.95))',
                  border: `1.5px solid ${col}`,
                  boxShadow: `0 0 8px ${col}`,
                  color: col,
                  animation: 'holoStatutPulse 1.6s ease-in-out infinite',
                }}>
                  <span style={{ width: 12, height: 12, display: 'block', filter: `drop-shadow(0 0 2px ${col})` }} dangerouslySetInnerHTML={{ __html: GLYPHE_STATUT[s] || '' }} />
                </span>
              )
            })}
          </div>
        )}

        {/* Étincelles shiny qui scintillent autour */}
        {pokemon.shiny && !ko && (
          <>
            <span style={{ position: 'absolute', left: '14%', top: '22%', width: 8, height: 8, zIndex: 7, animation: 'holoSpark 1.5s ease-in-out infinite', filter: 'drop-shadow(0 0 4px #fcd34d)', display: 'block' }} dangerouslySetInnerHTML={{ __html: GLYPHE_SPARK }} />
            <span style={{ position: 'absolute', right: '16%', top: '16%', width: 10, height: 10, zIndex: 7, animation: 'holoSpark 1.9s ease-in-out -0.5s infinite', filter: 'drop-shadow(0 0 4px #fcd34d)', display: 'block' }} dangerouslySetInnerHTML={{ __html: GLYPHE_SPARK }} />
            <span style={{ position: 'absolute', left: '20%', top: '54%', width: 7, height: 7, zIndex: 7, animation: 'holoSpark 2.3s ease-in-out -1s infinite', filter: 'drop-shadow(0 0 4px #fcd34d)', display: 'block' }} dangerouslySetInnerHTML={{ __html: GLYPHE_SPARK }} />
          </>
        )}

        {ciblableMaster && onCiblerMaster && (
          <button type="button"
            className={`cbt-cible-master ${marqueeMaster ? 'actif' : ''}`}
            title={marqueeMaster ? 'Master Ball ciblee (clic pour annuler)' : 'Cibler pour une Master Ball'}
            onClick={(e) => { e.stopPropagation(); onCiblerMaster() }}
            style={{ position: 'absolute', top: 0, right: 4, zIndex: 9, pointerEvents: 'auto' }}>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
              alt="Master Ball" className="cbt-cible-master-img"
              onError={(e) => { e.currentTarget.replaceWith(document.createTextNode('⚫')) }} />
          </button>
        )}

        {/* Lueur pulsante au sol, sous la carte */}
        <div style={{
          position: 'absolute', left: '50%', bottom: 0, width: 110, height: 26, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${rgba(accent, ko ? 0.12 : 0.6)}, transparent 70%)`,
          filter: 'blur(3px)', zIndex: 0,
          animation: ko ? 'none' : 'holoSocle 2.8s ease-in-out infinite',
        }}></div>

        {/* (l'aura de rôle est désormais intégrée aux anneaux de montée ci-dessous) */}

        {/* Ondes qui s'élargissent à plat sur le sol (maquette : bottom 92) */}
        {!ko && (
          <div style={{ position: 'absolute', left: '50%', bottom: 92, transform: 'translateX(-50%)', width: 70, height: 24, zIndex: 0, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', inset: 0, border: `1.5px solid ${rgba(accent, 0.8)}`, borderRadius: '50%',
              transform: 'perspective(200px) rotateX(64deg)', opacity: 0,
              animation: 'holoOnde 3s ease-out infinite',
            }}></div>
            <div style={{
              position: 'absolute', inset: 0, border: `1.5px solid ${rgba(accent, 0.8)}`, borderRadius: '50%',
              transform: 'perspective(200px) rotateX(64deg)', opacity: 0,
              animation: 'holoOnde 3s ease-out 1.5s infinite',
            }}></div>
          </div>
        )}

        {/* 3 anneaux d'invocation qui montent (bien visibles, légèrement flous) */}
        {!ko && [0, 1, 2].map((k) => {
          const cRole = infoRole ? (infoRole.couleur || accent) : accent
          return (
            <div key={`scan-${k}`} style={{
              position: 'absolute', left: '50%',
              width: 68, height: 18, zIndex: 3, pointerEvents: 'none',
              opacity: 0,
              transform: 'translateX(-50%) scale(0.4)',
              animation: `holoScanMonte 3s ease-in-out ${k * 1}s infinite`,
            }}>
              {/* disque lumineux diffus (teinte du rôle) */}
              <div style={{
                position: 'absolute', inset: -2, borderRadius: '50%',
                background: `radial-gradient(ellipse, ${rgba(cRole, 0.4)}, ${rgba(accent, 0.16)} 50%, transparent 75%)`,
                filter: 'blur(4px)',
              }}></div>
              {/* contour de l'anneau (visible, légèrement flou) */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: `2.5px solid ${rgba(accent, 0.8)}`,
                boxShadow: `0 0 14px ${rgba(accent, 0.8)}, inset 0 0 8px ${rgba(cRole, 0.5)}`,
                filter: 'blur(0.8px)',
              }}></div>
            </div>
          )
        })}

        {/* Aura énergétique qui entoure la carte (la carte "se charge") */}
        {!ko && (
          <div style={{
            position: 'absolute', left: '50%', bottom: 2, transform: 'translateX(-50%) perspective(420px) rotateX(55deg)',
            width: 116, height: 152, transformOrigin: 'bottom center', borderRadius: 14,
            zIndex: 0, pointerEvents: 'none',
            background: `radial-gradient(ellipse at 50% 50%, ${rgba(accent, 0.5)}, ${rgba(accent, 0.15)} 55%, transparent 78%)`,
            filter: 'blur(8px)',
            animation: 'holoCarteEnergie 2.4s ease-in-out infinite',
          }}></div>
        )}

        {/* La carte TCG (ou dos), inclinée sur le plateau */}
        <div style={{
          position: 'absolute', left: '50%', bottom: 4, transform: 'translateX(-50%) perspective(420px) rotateX(55deg)',
          width: 100, height: 140, transformOrigin: 'bottom center',
          borderRadius: 10, overflow: 'hidden', zIndex: 1,
          border: `2px solid ${rgba(accent, ko ? 0.25 : 0.9)}`,
          boxShadow: ko ? 'none' : (vientDattaquer ? `0 0 44px ${rgba(accent, 0.95)}, 0 7px 16px rgba(0,0,0,0.55)` : `0 0 30px ${rgba(accent, 0.6)}, 0 7px 16px rgba(0,0,0,0.55)`),
          transition: 'box-shadow 0.2s ease',
          filter: ko ? 'grayscale(1) brightness(0.5)' : 'none',
          background: '#1c2434',
        }}>
          <img src={imageCarte} alt="" loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={estDos ? erreurDos : (e) => { e.currentTarget.style.display = 'none' }} />
          {!ko && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${rgba(accent, 0.2)}, transparent 50%, ${rgba(accent, 0.14)})`, pointerEvents: 'none' }}></div>}
          {/* Flash d'énergie sur la surface de la carte (pulse, comme une invocation) */}
          {!ko && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen',
              background: `radial-gradient(ellipse at 50% 45%, ${rgba(accent, 0.6)}, ${rgba(accent, 0.2)} 45%, transparent 70%)`,
              animation: 'holoCarteSurface 2.4s ease-in-out infinite',
            }}></div>
          )}
          {!ko && carte && carte.finition === 'prismatique' && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen',
              backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,100,200,0.18) 0 6px, rgba(100,220,255,0.18) 6px 12px, rgba(160,255,170,0.14) 12px 18px)',
              backgroundSize: '200% 100%',
              animation: 'holoPrisma 3s linear infinite',
            }}></div>
          )}
          {!ko && carte && carte.finition === 'brillante' && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen',
              backgroundImage: 'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.4) 48%, transparent 66%)',
              backgroundSize: '250% 100%',
              animation: 'holoPrisma 2.5s linear infinite',
            }}></div>
          )}
        </div>

        {!ko && (
          <>
            {/* ===== PROJECTION HOLOGRAMME EN CÔNE (invocation épurée, façon film) ===== */}
            {/* 0. Lueur englobante : baigne carte + faisceau + sprite dans une même ambiance */}
            <div style={{
              position: 'absolute', left: '50%', bottom: 30, transform: 'translateX(-50%)',
              width: 120, height: 170, zIndex: 1, pointerEvents: 'none',
              background: `radial-gradient(ellipse at 50% 80%, ${rgba(accent, 0.22)} 0%, ${rgba(accent, 0.08)} 45%, transparent 72%)`,
              filter: 'blur(10px)',
              animation: 'holoColonne 3s ease-in-out infinite',
            }}></div>
            {/* 1. Colonne de lumière floue (pas de bords nets, organique) */}
            <div style={{
              position: 'absolute', left: '50%', bottom: 22, transform: 'translateX(-50%)',
              width: 86, height: 144, zIndex: 2, pointerEvents: 'none',
              background: `radial-gradient(ellipse 60% 70% at 50% 100%, ${rgba(accent, 0.4)} 0%, ${rgba(accent, 0.16)} 45%, ${rgba(accent, 0.04)} 75%, transparent 100%)`,
              borderRadius: '46% 46% 30% 30% / 30% 30% 8% 8%',
              filter: 'blur(8px)',
              animation: 'holoColonne 2.6s ease-in-out infinite, holoGlitchFaisceau 4.5s steps(1) infinite',
            }}></div>
            {/* 2. Cœur du faisceau (plus dense au centre, flou) */}
            <div style={{
              position: 'absolute', left: '50%', bottom: 24, transform: 'translateX(-50%)',
              width: 46, height: 132, zIndex: 2, pointerEvents: 'none',
              background: `linear-gradient(to top, ${rgba(accent, 0.4)}, ${rgba(accent, 0.12)} 55%, transparent 90%)`,
              borderRadius: '50% 50% 40% 40% / 20% 20% 6% 6%',
              filter: 'blur(6px)',
              animation: 'holoColonne 2s ease-in-out infinite, holoGlitchFaisceau 3.7s steps(1) infinite',
            }}></div>
            {/* 4. Émission douce sur la surface de la carte (jonction homogène) */}
            <div style={{
              position: 'absolute', left: '50%', bottom: 14, transform: 'translateX(-50%)',
              width: 86, height: 22, borderRadius: '50%', zIndex: 3, pointerEvents: 'none',
              background: `radial-gradient(ellipse, ${rgba(accent, 0.7)} 0%, ${rgba(accent, 0.35)} 45%, ${rgba(accent, 0.12)} 65%, transparent 82%)`,
              filter: 'blur(5px)',
              animation: 'holoSocle 2s ease-in-out infinite',
            }}></div>
            {/* 5. Micro-particules holographiques flottantes (ronds + carrés "données") */}
            {particulesRef.current.map((p) => (
              <div key={p.i} style={{
                position: 'absolute', left: `${p.gauche}%`, bottom: 26,
                width: p.taille, height: p.taille,
                borderRadius: p.carre ? '1px' : '50%',
                zIndex: 3,
                background: p.i % 3 === 0 ? rgba(accent, 0.95) : '#fff',
                boxShadow: `0 0 ${p.taille * 3.5}px ${rgba(accent, 1)}`,
                filter: p.i % 2 === 0 ? 'blur(0.8px)' : 'none',
                opacity: 0.85,
                '--dx': `${p.dx}px`,
                animation: `holoFlotteParticule ${p.duree}s ease-out ${p.delai}s infinite`,
                pointerEvents: 'none',
              }}></div>
            ))}
            {/* 6. Pixels de "données" matrice qui clignotent dans le faisceau (léger) */}
            {dataRef.current.map((d) => (
              <div key={`data-${d.i}`} style={{
                position: 'absolute', left: `${d.gauche}%`, bottom: d.bas,
                width: d.taille, height: d.taille, borderRadius: '1px', zIndex: 3,
                background: rgba(accent, 1),
                boxShadow: `0 0 4px ${rgba(accent, 1)}`,
                opacity: 0,
                animation: `holoDataClignote ${d.duree}s steps(2) ${d.delai}s infinite`,
                pointerEvents: 'none',
              }}></div>
            ))}
          </>
        )}

        {/* H : faisceau d'énergie discret quand on attaque */}
        {vientDattaquer && !ko && (
          <div style={{
            position: 'absolute', left: '50%',
            [estJoueur ? 'top' : 'bottom']: 30,
            width: 60, height: 60, borderRadius: '50%', zIndex: 7, pointerEvents: 'none',
            transform: 'translateX(-50%)',
            background: `radial-gradient(circle, ${rgba(accent, 0.7)}, transparent 65%)`,
            animation: 'holoEclatTir 0.5s ease-out forwards',
          }}></div>
        )}

        {/* Sprite : projection holo (vivant) ou fantôme (K.O.) */}
        <div ref={bondRef} style={{
          position: 'absolute', left: spriteLeft, bottom: spriteBottom, transform: 'translateX(-50%)',
          zIndex: 4, width: tailleSprite, height: tailleSprite,
          animation: ko ? 'koFantome 3.5s ease-in-out infinite' : 'holoFlotte 3s ease-in-out infinite',
        }}>
          <div style={{
            position: 'relative', width: '100%', height: '100%',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            animation: ko ? 'none' : 'holoCRT 5s ease-in-out infinite',
            transform: vientDattaquer ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            transformOrigin: 'bottom center',
          }}>
            <div style={{
              position: 'relative', width: '100%', height: '100%',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              animation: ko ? 'none' : 'holoAberration 6s ease-in-out infinite',
            }}>
              <img
                src={sources[0]} alt={pokemon.nom} className="cbt-sprite" data-etape="0" onError={onError}
                style={{
                  maxHeight: ko ? tailleSprite * 0.72 : tailleSprite, maxWidth: '100%', objectFit: 'contain',
                  transform: estBoss ? 'scale(1.05)' : undefined,
                  transformOrigin: 'bottom center',
                  opacity: ko ? 0.4 : 0.96,
                  position: 'relative', zIndex: 2,
                  '--holo-glow': rgba(accent, 0.9),
                  filter: ko
                    ? 'grayscale(1) brightness(1.3) opacity(0.5) drop-shadow(0 0 6px rgba(180,200,230,0.4))'
                    : `drop-shadow(1.5px 0 0 rgba(255,40,90,0.5)) drop-shadow(-1.5px 0 0 rgba(0,220,255,0.5)) drop-shadow(0 0 13px ${rgba(accent, 0.9)}) drop-shadow(0 0 5px ${rgba(accent, 0.9)}) brightness(1.06)`,
                  animation: ko
                    ? 'none'
                    : (glitch ? 'holoGlitch 0.32s steps(2) infinite' : 'holoChromaJitter 0.9s steps(3) infinite'),
                }}
              />

              {/* Copie glitch (bandes horizontales déchirées) pendant le bug */}
              {!ko && glitch && srcActuelle && (
                <img src={srcActuelle} alt="" aria-hidden="true"
                  style={{
                    position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
                    maxHeight: tailleSprite, maxWidth: '100%', objectFit: 'contain',
                    opacity: 0.85, zIndex: 3, pointerEvents: 'none', mixBlendMode: 'screen',
                    filter: 'drop-shadow(3px 0 0 rgba(255,40,90,0.8)) drop-shadow(-3px 0 0 rgba(0,220,255,0.8))',
                    animation: 'holoGlitchBandes 0.3s steps(3) infinite',
                  }} />
              )}

              {/* DATAMOSH : tranche du sprite décalée violemment (bug de matrice) */}
              {!ko && glitch && srcActuelle && (
                <img src={srcActuelle} alt="" aria-hidden="true"
                  style={{
                    position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)',
                    maxHeight: tailleSprite, maxWidth: '100%', objectFit: 'contain',
                    opacity: 0.9, zIndex: 4, pointerEvents: 'none', mixBlendMode: 'screen',
                    filter: `drop-shadow(0 0 4px ${rgba(accent, 0.9)}) saturate(1.6)`,
                    animation: 'holoDatamosh 0.32s steps(2) infinite',
                  }} />
              )}

              {/* Scanline de corruption qui balaye le sprite pendant le bug */}
              {!ko && glitch && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, height: 6, zIndex: 5, pointerEvents: 'none',
                  background: `linear-gradient(to bottom, transparent, ${rgba(accent, 0.9)}, #fff, ${rgba(accent, 0.9)}, transparent)`,
                  boxShadow: `0 0 12px ${rgba(accent, 0.9)}`,
                  mixBlendMode: 'screen',
                  animation: 'holoScanCorrupt 0.3s linear infinite',
                }}></div>
              )}

              {!ko && srcActuelle && (
                <>
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none',
                    background: rgba(accent, 0.15),
                    mixBlendMode: 'screen',
                    ...masque,
                  }}></div>

                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
                    backgroundImage: `linear-gradient(115deg, transparent 30%, rgba(255,100,200,0.16) 42%, rgba(100,220,255,0.18) 50%, rgba(160,255,170,0.14) 58%, transparent 70%)`,
                    backgroundSize: '100% 240%',
                    mixBlendMode: 'screen',
                    animation: 'holoIrise 5s linear infinite',
                    ...masque,
                  }}></div>

                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 1px, rgba(0,0,0,0.4) 1px 2px)`,
                    mixBlendMode: 'multiply',
                    animation: 'holoScanSprite 1.2s linear infinite',
                    ...masque,
                  }}></div>

                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none',
                    backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 2.5px, ${rgba(accent, 0.28)} 2.5px 3px)`,
                    mixBlendMode: 'screen',
                    animation: 'holoScanSprite 1.6s linear infinite reverse',
                    ...masque,
                  }}></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== PANNEAU DE VIE ===== */}
      {panneauInfos}
    </div>
  )
}

export default SpriteCombattant