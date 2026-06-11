import { useMemo } from 'react'

// ============================================================
// AMBIANCE MODE — fond image (déjà dans /public) + animation
// overlay différente par mode. Autonome : CSS pur injecté,
// aucune dépendance. Ne touche pas à l'AmbianceCombat de l'histoire.
//
// Props :
//   mode  : 'arene' | 'raid' | 'tour'
//   boss  : true → ambiance renforcée (plus de particules, halo)
// ============================================================

// Tous les décors disponibles dans /public (pour tirage aléatoire).
export const TOUS_DECORS = [
  '/prairie.png', '/foret.png', '/grotte.png', '/volcan.png', '/desert.png',
  '/abysses.png', '/marais.png', '/electrique.png', '/temple.png', '/neige.png',
  '/cristal.png', '/dragon.png', '/sanctuaire.png',
]

// Donne un décor déterministe à partir d'un numéro (même numéro = même décor).
export function decorPourNumero(n) {
  const idx = Math.abs(Math.floor(n || 0)) % TOUS_DECORS.length
  return TOUS_DECORS[idx]
}

// ============================================================
// BIOMES (pour l'histoire) : détecte le type depuis le nom du
// décor et applique des particules naturelles adaptées.
// ============================================================
function typeBiome(decor) {
  const d = (decor || '').toLowerCase()
  if (d.includes('foret') || d.includes('prairie') || d.includes('sanctuaire') || d.includes('jade')) return 'nature'
  if (d.includes('volcan') || d.includes('feu') || d.includes('forge') || d.includes('lave')) return 'feu'
  if (d.includes('neige') || d.includes('cristal') || d.includes('glace') || d.includes('sommet')) return 'neige'
  if (d.includes('abysses') || d.includes('marais') || d.includes('eau') || d.includes('ocean') || d.includes('lac')) return 'eau'
  if (d.includes('desert') || d.includes('sable') || d.includes('plage')) return 'sable'
  if (d.includes('electrique') || d.includes('foudre') || d.includes('tonnerre')) return 'electrique'
  if (d.includes('grotte') || d.includes('temple') || d.includes('cave')) return 'poussiere'
  if (d.includes('dragon')) return 'dragon'
  return 'nature'
}

// Réglages par biome : couleur, sens d'animation, forme.
const BIOMES = {
  nature:     { accent: '#7ddc6a', accent2: '#c8f5a0', anim: 'amb-feuille', forme: 'feuille', n: 22 },
  feu:        { accent: '#ff6a2d', accent2: '#ffc04a', anim: 'amb-tombe',   forme: 'rond',    n: 26 },
  neige:      { accent: '#eaf6ff', accent2: '#bfe2ff', anim: 'amb-flocon',  forme: 'rond',    n: 30 },
  eau:        { accent: '#6cc6ff', accent2: '#bfeaff', anim: 'amb-monte',   forme: 'bulle',   n: 22 },
  sable:      { accent: '#e6c878', accent2: '#f2e0a8', anim: 'amb-vent',    forme: 'rond',    n: 24 },
  electrique: { accent: '#ffe14a', accent2: '#fff7b0', anim: 'amb-flotte',  forme: 'rond',    n: 20 },
  poussiere:  { accent: '#c9b88f', accent2: '#e3d4ad', anim: 'amb-flotte',  forme: 'rond',    n: 18 },
  dragon:     { accent: '#b07bff', accent2: '#ff9d6a', anim: 'amb-flotte',  forme: 'rond',    n: 24 },
}

// Décor de fond (image /public) + couleur d'accent par mode.
const CONFIG = {
  arene: { fond: '/cristal.png', accent: '#fcd34d', accent2: '#fff7d6', voile: 'rgba(20,16,40,0.55)' },
  raid:  { fond: '/volcan.png',  accent: '#ff5a2d', accent2: '#ffb347', voile: 'rgba(40,8,4,0.55)' },
  tour:  { fond: '/abysses.png', accent: '#5cc8ff', accent2: '#c4a6ff', voile: 'rgba(8,14,34,0.58)' },
}
// Décor spécial boss (plus dramatique).
const CONFIG_BOSS = {
  arene: { fond: '/sanctuaire.png', accent: '#ffd24a', accent2: '#fff2c2', voile: 'rgba(30,12,40,0.62)' },
  raid:  { fond: '/volcan.png',     accent: '#ff3b2f', accent2: '#ff8a3d', voile: 'rgba(48,6,4,0.62)' },
  tour:  { fond: '/dragon.png',     accent: '#8a7bff', accent2: '#5cc8ff', voile: 'rgba(14,8,38,0.62)' },
}

let _styleInjecte = false
function injecterStyles() {
  if (_styleInjecte || typeof document === 'undefined') return
  _styleInjecte = true
  const css = `
@keyframes amb-monte {
  0%   { transform: translateY(0) scale(1); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(-115vh) scale(0.5); opacity: 0; }
}
@keyframes amb-tombe {
  0%   { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { transform: translateY(110vh) translateX(var(--derive,20px)) rotate(360deg); opacity: 0; }
}
@keyframes amb-flotte {
  0%   { transform: translateY(0) translateX(0); opacity: 0; }
  20%  { opacity: 0.9; }
  50%  { transform: translateY(-40px) translateX(var(--derive,15px)); }
  80%  { opacity: 0.9; }
  100% { transform: translateY(-90px) translateX(0); opacity: 0; }
}
@keyframes amb-pulse-halo {
  0%,100% { opacity: 0.35; transform: scale(1); }
  50%     { opacity: 0.7;  transform: scale(1.08); }
}
@keyframes amb-scan {
  0%   { transform: translateY(-100%); opacity: 0; }
  50%  { opacity: 0.5; }
  100% { transform: translateY(100%); opacity: 0; }
}
@keyframes amb-feuille {
  0%   { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0; }
  10%  { opacity: 0.95; }
  90%  { opacity: 0.95; }
  100% { transform: translateY(110vh) translateX(var(--derive,80px)) rotate(540deg); opacity: 0; }
}
@keyframes amb-flocon {
  0%   { transform: translateY(-10vh) translateX(0); opacity: 0; }
  10%  { opacity: 0.95; }
  50%  { transform: translateY(50vh) translateX(var(--derive,30px)); }
  90%  { opacity: 0.95; }
  100% { transform: translateY(110vh) translateX(0); opacity: 0; }
}
@keyframes amb-vent {
  0%   { transform: translateX(-12vw) translateY(0); opacity: 0; }
  12%  { opacity: 0.9; }
  88%  { opacity: 0.9; }
  100% { transform: translateX(112vw) translateY(var(--derive,-20px)); opacity: 0; }
}
.amb-wrap { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; border-radius:inherit; }
.amb-fond { position:absolute; inset:0; background-size:cover; background-position:center; }
.amb-voile { position:absolute; inset:0; }
.amb-particule { position:absolute; border-radius:50%; will-change:transform,opacity; }
.amb-feuille-forme { border-radius:0 100% 0 100% !important; }
.amb-bulle-forme { background:transparent !important; border:1.5px solid currentColor; }
.amb-halo { position:absolute; border-radius:50%; filter:blur(38px); animation:amb-pulse-halo 4s ease-in-out infinite; }
.amb-scanline { position:absolute; left:0; right:0; height:140px; animation:amb-scan linear infinite; }
.amb-vignette { position:absolute; inset:0; box-shadow:inset 0 0 160px 40px rgba(0,0,0,0.55); }
/* ===== EFFETS ULTRA ===== */
@keyframes ult-rayon {
  0%,100% { opacity:0.10; transform:translateX(0) skewX(-18deg); }
  50%     { opacity:0.32; transform:translateX(18px) skewX(-18deg); }
}
@keyframes ult-sol {
  0%,100% { opacity:0.30; transform:translateX(-50%) scaleX(1); }
  50%     { opacity:0.55; transform:translateX(-50%) scaleX(1.12); }
}
@keyframes ult-brume {
  0%   { transform:translateX(-25%); opacity:0; }
  20%  { opacity:0.55; }
  80%  { opacity:0.55; }
  100% { transform:translateX(25%); opacity:0; }
}
@keyframes ult-haze {
  0%,100% { transform:translateY(0) scaleY(1); opacity:0.18; }
  50%     { transform:translateY(-6px) scaleY(1.04); opacity:0.32; }
}
@keyframes ult-aurore {
  0%,100% { opacity:0.25; transform:translateX(0) skewX(-8deg); background-position:0% 50%; }
  50%     { opacity:0.55; transform:translateX(20px) skewX(-8deg); background-position:100% 50%; }
}
@keyframes ult-pluie {
  0%   { transform:translateY(-12vh); opacity:0; }
  10%  { opacity:0.5; }
  90%  { opacity:0.5; }
  100% { transform:translateY(115vh); opacity:0; }
}
@keyframes ult-respire {
  0%,100% { opacity:0.45; }
  50%     { opacity:0.8; }
}
@keyframes ult-flash {
  0% { opacity:0.6; }
  100% { opacity:0; }
}
.ult-rayon { position:absolute; top:-10%; height:140%; width:80px; filter:blur(8px); mix-blend-mode:screen; animation:ult-rayon ease-in-out infinite; }
.ult-sol { position:absolute; left:50%; bottom:6%; height:90px; border-radius:50%; filter:blur(34px); mix-blend-mode:screen; animation:ult-sol ease-in-out infinite; }
.ult-brume { position:absolute; height:46%; width:160%; left:-30%; border-radius:50%; filter:blur(30px); mix-blend-mode:screen; animation:ult-brume linear infinite; }
.ult-haze { position:absolute; left:0; right:0; bottom:0; height:38%; backdrop-filter:blur(1.2px); animation:ult-haze ease-in-out infinite; }
.ult-aurore { position:absolute; top:-5%; left:-10%; right:-10%; height:55%; filter:blur(26px); mix-blend-mode:screen; background-size:200% 200%; animation:ult-aurore ease-in-out infinite; }
.ult-pluie-trait { position:absolute; width:1.5px; border-radius:1px; will-change:transform,opacity; animation:ult-pluie linear infinite; }
.ult-respire { position:absolute; inset:0; animation:ult-respire ease-in-out infinite; pointer-events:none; }
/* ===== EFFETS MAX ===== */
@keyframes max-fg {
  0%   { transform:translateX(0); }
  100% { transform:translateX(-50%); }
}
@keyframes max-rafale {
  0%,100% { transform:translateX(-15vw) translateY(0) rotate(0deg); opacity:0; }
  8%      { opacity:0.95; }
  92%     { opacity:0.95; }
  100%    { transform:translateX(120vw) translateY(var(--dy,-30px)) rotate(360deg); opacity:0; }
}
@keyframes max-luciole {
  0%,100% { opacity:0; transform:translate(0,0); }
  25%     { opacity:1; }
  50%     { opacity:0.3; transform:translate(var(--lx,12px),var(--ly,-14px)); }
  75%     { opacity:1; }
}
@keyframes max-eclair {
  0%,100%   { opacity:0; }
  1%,3%     { opacity:0.9; }
  2%        { opacity:0.2; }
  6%        { opacity:0; }
}
@keyframes max-petale {
  0%   { transform:translateY(-12vh) translateX(0) rotateZ(0deg) rotateY(0deg); opacity:0; }
  10%  { opacity:1; }
  90%  { opacity:1; }
  100% { transform:translateY(112vh) translateX(var(--derive,90px)) rotateZ(540deg) rotateY(720deg); opacity:0; }
}
@keyframes max-bloom {
  0%,100% { opacity:0.30; }
  50%     { opacity:0.65; }
}
@keyframes max-cendre {
  0%   { transform:translateY(0) scale(1); opacity:0; }
  12%  { opacity:1; }
  60%  { transform:translateY(-60vh) translateX(var(--derive,20px)) scale(0.8); opacity:1; }
  100% { transform:translateY(-115vh) translateX(calc(var(--derive,20px) * 1.5)) scale(0.3); opacity:0; }
}
@keyframes max-grain {
  0%,100% { transform:translate(0,0); }
  25% { transform:translate(-2%,1%); }
  50% { transform:translate(1%,-2%); }
  75% { transform:translate(-1%,2%); }
}
.max-fg { position:absolute; bottom:0; height:34%; width:200%; left:0; background-repeat:repeat-x; background-size:auto 100%; animation:max-fg linear infinite; pointer-events:none; }
.max-rafale { position:absolute; border-radius:0 100% 0 100%; will-change:transform,opacity; }
.max-luciole { position:absolute; border-radius:50%; animation:max-luciole ease-in-out infinite; }
.max-eclair { position:absolute; inset:0; mix-blend-mode:screen; pointer-events:none; }
.max-petale { position:absolute; border-radius:80% 0 80% 0; will-change:transform,opacity; }
.max-bloom { position:absolute; inset:0; mix-blend-mode:screen; animation:max-bloom ease-in-out infinite; pointer-events:none; }
.max-cendre { position:absolute; border-radius:50%; will-change:transform,opacity; }
.max-grain { position:absolute; inset:-20%; opacity:0.06; mix-blend-mode:overlay; animation:max-grain 0.6s steps(3) infinite; pointer-events:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E"); }
`
  const tag = document.createElement('style')
  tag.id = 'ambiance-mode-styles'
  tag.textContent = css
  document.head.appendChild(tag)
}

function AmbianceMode({ mode = 'arene', boss = false, fondForce = null }) {
  injecterStyles()
  const cfgBase = (boss ? CONFIG_BOSS : CONFIG)[mode] || CONFIG.arene
  // Si un fond est imposé (ex : tour aléatoire), il remplace l'image par défaut.
  const cfg = fondForce ? { ...cfgBase, fond: fondForce } : cfgBase

  // Génère les particules une seule fois (mémoïsé par mode+boss).
  const particules = useMemo(() => {
    const n = boss ? 46 : 28
    const arr = []
    for (let i = 0; i < n; i++) {
      const taille = 3 + Math.random() * (boss ? 7 : 5)
      const gauche = Math.random() * 100
      const duree = 4 + Math.random() * 6
      const delai = -Math.random() * 10
      const derive = (Math.random() * 60 - 30).toFixed(0) + 'px'
      arr.push({ i, taille, gauche, duree, delai, derive })
    }
    return arr
  }, [mode, boss])

  // Choix de l'animation selon le mode.
  const anim = mode === 'raid' ? 'amb-tombe' : mode === 'tour' ? 'amb-flotte' : 'amb-monte'
  // Départ vertical de la particule selon l'animation.
  const baseBottom = mode === 'raid' ? 'auto' : '-6%'
  const baseTop = mode === 'raid' ? '-6%' : 'auto'

  return (
    <div className="amb-wrap">
      {/* Image de fond */}
      <div className="amb-fond" style={{ backgroundImage: `url(${cfg.fond})` }} />
      {/* Voile teinté pour lisibilité + ambiance */}
      <div className="amb-voile" style={{ background: `linear-gradient(180deg, ${cfg.voile} 0%, rgba(0,0,0,0.35) 50%, ${cfg.voile} 100%)` }} />

      {/* Halos lumineux d'ambiance */}
      <div className="amb-halo" style={{ width: 280, height: 280, left: '12%', top: '18%', background: cfg.accent, opacity: boss ? 0.5 : 0.32 }} />
      <div className="amb-halo" style={{ width: 240, height: 240, right: '10%', bottom: '14%', background: cfg.accent2, opacity: boss ? 0.45 : 0.28, animationDelay: '1.5s' }} />
      {boss && <div className="amb-halo" style={{ width: 360, height: 360, left: '50%', top: '40%', transform: 'translate(-50%,-50%)', background: cfg.accent, opacity: 0.3, animationDelay: '0.8s' }} />}

      {/* Particules animées */}
      {particules.map((p) => (
        <span key={p.i} className="amb-particule"
          style={{
            width: p.taille, height: p.taille, left: `${p.gauche}%`,
            bottom: baseBottom, top: baseTop,
            background: p.i % 3 === 0 ? cfg.accent2 : cfg.accent,
            boxShadow: `0 0 ${p.taille * 2}px ${cfg.accent}`,
            '--derive': p.derive,
            animation: `${anim} ${p.duree}s linear ${p.delai}s infinite`,
          }} />
      ))}

      {/* Ligne de scan (effet techno/mystique) pour la tour */}
      {mode === 'tour' && (
        <div className="amb-scanline" style={{ background: `linear-gradient(180deg, transparent, ${cfg.accent}22, transparent)`, animationDuration: boss ? '3s' : '5s' }} />
      )}

      {/* Vignette pour focaliser le centre */}
      <div className="amb-vignette" />
    </div>
  )
}

export default AmbianceMode

// ============================================================
// AMBIANCE BIOME — pour l'HISTOIRE. Ne pose AUCUN fond ni voile
// (le décor + AmbianceCombat sont déjà là). Ajoute seulement des
// particules naturelles adaptées au type de zone (forêt = feuilles
// vertes au vent, neige = flocons, volcan = braises, eau = bulles...).
//
// Props :
//   decor : chemin du décor de la zone (ex '/foret.png')
//   boss  : true → un peu plus dense
// ============================================================
export function AmbianceBiome({ decor, boss = false }) {
  injecterStyles()
  const type = typeBiome(decor)
  const b = BIOMES[type] || BIOMES.nature

  const particules = useMemo(() => {
    const n = Math.round(b.n * (boss ? 1.4 : 1))
    const arr = []
    for (let i = 0; i < n; i++) {
      const taille = b.forme === 'feuille' ? 7 + Math.random() * 7 : 3 + Math.random() * 5
      const pos = Math.random() * 100
      const duree = 5 + Math.random() * 7
      const delai = -Math.random() * 12
      const derive = (Math.random() * 120 - 60).toFixed(0) + 'px'
      arr.push({ i, taille, pos, duree, delai, derive })
    }
    return arr
  }, [type, boss])

  // Sens de l'animation : 'amb-vent' part de la gauche (horizontal),
  // les autres tombent/montent (vertical).
  const horizontal = b.anim === 'amb-vent'
  const monte = b.anim === 'amb-monte'

  return (
    <div className="amb-wrap" style={{ zIndex: 1 }}>
      {particules.map((p) => {
        const classeForme = b.forme === 'feuille' ? 'amb-feuille-forme' : b.forme === 'bulle' ? 'amb-bulle-forme' : ''
        const style = {
          width: p.taille, height: p.taille,
          background: p.i % 3 === 0 ? b.accent2 : b.accent,
          color: b.accent,
          boxShadow: b.forme === 'bulle' ? 'none' : `0 0 ${p.taille * 1.6}px ${b.accent}`,
          '--derive': p.derive,
          animation: `${b.anim} ${p.duree}s linear ${p.delai}s infinite`,
        }
        if (horizontal) { style.top = `${p.pos}%`; style.left = 0 }
        else if (monte) { style.left = `${p.pos}%`; style.bottom = '-6%' }
        else { style.left = `${p.pos}%`; style.top = '-6%' }
        return <span key={p.i} className={`amb-particule ${classeForme}`} style={style} />
      })}
    </div>
  )
}


// ============================================================
// AMBIANCE BIOME ULTRA — version "grand jeu" pour l'HISTOIRE.
// Couches : god rays + sol réactif + parallaxe 3 plans de
// particules + météo par biome (brume/haze/aurore/pluie) +
// vignette colorée qui respire. Toujours SOUS les Pokémon.
// Ne pose aucun fond (le décor + AmbianceCombat sont déjà là).
// ============================================================
export function AmbianceBiomeUltra({ decor, boss = false }) {
  injecterStyles()
  const type = typeBiome(decor)
  const b = BIOMES[type] || BIOMES.nature

  // Parallaxe : 3 plans (arrière lent/gros/flou, milieu, avant rapide/net).
  const couches = useMemo(() => {
    const plans = [
      { profondeur: 'arriere', nb: Math.round(b.n * 0.5 * (boss ? 1.3 : 1)), tMin: 8, tVar: 9, sMul: 1.7, flou: 2, opac: 0.5 },
      { profondeur: 'milieu',  nb: Math.round(b.n * 0.8 * (boss ? 1.3 : 1)), tMin: 6, tVar: 7, sMul: 1.1, flou: 0.6, opac: 0.8 },
      { profondeur: 'avant',   nb: Math.round(b.n * 0.6 * (boss ? 1.3 : 1)), tMin: 4, tVar: 5, sMul: 0.7, flou: 0, opac: 1 },
    ]
    return plans.map((plan, pi) => {
      const arr = []
      for (let i = 0; i < plan.nb; i++) {
        const tBase = b.forme === 'feuille' ? 7 : 4
        const taille = (tBase + Math.random() * 6) * plan.sMul
        const pos = Math.random() * 100
        const duree = plan.tMin + Math.random() * plan.tVar
        const delai = -Math.random() * 14
        const derive = (Math.random() * 140 - 70).toFixed(0) + 'px'
        arr.push({ i: `${pi}-${i}`, taille, pos, duree, delai, derive, flou: plan.flou, opac: plan.opac })
      }
      return arr
    }).flat()
  }, [type, boss])

  // Pluie pour les biomes humides (eau).
  const pluie = useMemo(() => {
    if (type !== 'eau') return []
    const n = boss ? 60 : 42
    const arr = []
    for (let i = 0; i < n; i++) {
      arr.push({
        i, pos: Math.random() * 100, h: 14 + Math.random() * 22,
        duree: 0.6 + Math.random() * 0.7, delai: -Math.random() * 2,
      })
    }
    return arr
  }, [type, boss])

  const horizontal = b.anim === 'amb-vent'
  const monte = b.anim === 'amb-monte'
  const A = b.accent, A2 = b.accent2

  // Rayons de lumière : présents partout, plus marqués en nature/sanctuaire.
  const nbRayons = (type === 'nature' || type === 'eau') ? 5 : 3

  return (
    <div className="amb-wrap" style={{ zIndex: 1 }}>
      {/* GOD RAYS — faisceaux obliques */}
      {Array.from({ length: nbRayons }).map((_, i) => (
        <div key={`ray-${i}`} className="ult-rayon"
          style={{
            left: `${8 + i * (84 / nbRayons)}%`,
            background: `linear-gradient(to bottom, ${A2}, transparent)`,
            opacity: 0.18,
            animationDuration: `${6 + i * 1.5}s`,
            animationDelay: `${-i * 1.2}s`,
          }} />
      ))}

      {/* AURORE (neige) / VOILE coloré haut */}
      {type === 'neige' && (
        <div className="ult-aurore"
          style={{ background: `linear-gradient(100deg, ${A}, ${A2}, #a0ffe0, ${A})`, animationDuration: '9s' }} />
      )}

      {/* BRUME volumétrique (grotte/temple = poussiere, dragon) */}
      {(type === 'poussiere' || type === 'dragon') && (
        <>
          <div className="ult-brume" style={{ top: '20%', background: `radial-gradient(ellipse at center, ${A}, transparent 70%)`, animationDuration: '14s' }} />
          <div className="ult-brume" style={{ top: '55%', background: `radial-gradient(ellipse at center, ${A2}, transparent 70%)`, animationDuration: '18s', animationDelay: '-6s' }} />
        </>
      )}

      {/* HEAT HAZE (volcan/désert) — ondulation chaude en bas */}
      {(type === 'feu' || type === 'sable') && (
        <div className="ult-haze" style={{ background: `linear-gradient(to top, ${A}22, transparent)`, animationDuration: '3.5s' }} />
      )}

      {/* PLUIE (eau) */}
      {pluie.map((p) => (
        <span key={`rain-${p.i}`} className="ult-pluie-trait"
          style={{
            left: `${p.pos}%`, top: '-12vh', height: p.h,
            background: `linear-gradient(to bottom, transparent, ${A2})`,
            animationDuration: `${p.duree}s`, animationDelay: `${p.delai}s`,
          }} />
      ))}

      {/* PARALLAXE — 3 plans de particules */}
      {couches.map((p) => {
        const classeForme = b.forme === 'feuille' ? 'amb-feuille-forme' : b.forme === 'bulle' ? 'amb-bulle-forme' : ''
        const style = {
          width: p.taille, height: p.taille,
          background: Math.random() > 0.5 ? A2 : A,
          color: A,
          opacity: p.opac,
          filter: p.flou ? `blur(${p.flou}px)` : 'none',
          boxShadow: b.forme === 'bulle' ? 'none' : `0 0 ${p.taille * 1.6}px ${A}`,
          '--derive': p.derive,
          animation: `${b.anim} ${p.duree}s linear ${p.delai}s infinite`,
        }
        if (horizontal) { style.top = `${p.pos}%`; style.left = 0 }
        else if (monte) { style.left = `${p.pos}%`; style.bottom = '-6%' }
        else { style.left = `${p.pos}%`; style.top = '-6%' }
        return <span key={p.i} className={`amb-particule ${classeForme}`} style={style} />
      })}

      {/* SOL RÉACTIF — halos lumineux au sol sous les 2 rangées */}
      <div className="ult-sol" style={{ width: '46%', background: `radial-gradient(ellipse at center, ${A}, transparent 70%)`, animationDuration: '3.6s', bottom: '8%' }} />
      <div className="ult-sol" style={{ width: '46%', background: `radial-gradient(ellipse at center, ${A2}, transparent 70%)`, animationDuration: '4.4s', animationDelay: '-1.5s', bottom: '52%' }} />

      {/* VIGNETTE colorée qui respire */}
      <div className="ult-respire" style={{ boxShadow: `inset 0 0 180px 50px ${A}33`, opacity: boss ? 0.7 : 0.45 }} />
      <div className="amb-vignette" />

      {/* FLASH d'apparition (boss) */}
      {boss && <div style={{ position: 'absolute', inset: 0, background: A, animation: 'ult-flash 0.9s ease-out 1', mixBlendMode: 'screen', pointerEvents: 'none' }} />}
    </div>
  )
}

// ============================================================
// SILHOUETTES FOREGROUND (SVG data-URI) défilant en parallaxe.
// Formes sombres au premier plan selon le biome.
// ============================================================
function silhouetteBiome(type, couleur) {
  const c = encodeURIComponent(couleur)
  // Motifs répétables (200x100) : on dessine des formes en bas.
  let forme = ''
  if (type === 'nature') {
    // troncs/arbres
    forme = `%3Cpath d='M10 100 L10 30 Q14 18 18 30 L18 100 Z' fill='${c}'/%3E%3Cpath d='M70 100 L70 20 Q76 6 82 20 L82 100 Z' fill='${c}'/%3E%3Cpath d='M140 100 L140 40 Q145 28 150 40 L150 100 Z' fill='${c}'/%3E`
  } else if (type === 'feu') {
    // rochers déchiquetés
    forme = `%3Cpath d='M0 100 L30 55 L55 80 L90 40 L120 75 L160 50 L200 85 L200 100 Z' fill='${c}'/%3E`
  } else if (type === 'neige') {
    forme = `%3Cpath d='M0 100 L40 50 L80 80 L130 45 L200 90 L200 100 Z' fill='${c}'/%3E`
  } else if (type === 'eau') {
    forme = `%3Cpath d='M0 100 Q50 70 100 90 T200 85 L200 100 Z' fill='${c}'/%3E`
  } else if (type === 'sable') {
    forme = `%3Cpath d='M0 100 Q60 60 120 88 T200 80 L200 100 Z' fill='${c}'/%3E`
  } else if (type === 'poussiere') {
    // stalactites (haut) + sol
    forme = `%3Cpath d='M0 0 L20 45 L40 0 Z M80 0 L98 38 L116 0 Z M150 0 L168 50 L186 0 Z' fill='${c}'/%3E%3Crect y='88' width='200' height='12' fill='${c}'/%3E`
  } else if (type === 'dragon') {
    forme = `%3Cpath d='M0 100 L25 50 L50 78 L85 35 L120 72 L165 48 L200 82 L200 100 Z' fill='${c}'/%3E`
  } else {
    // electrique : pylônes
    forme = `%3Cpath d='M30 100 L20 30 L40 30 Z M30 45 L15 50 M30 45 L45 50' stroke='${c}' stroke-width='3' fill='none'/%3E%3Cpath d='M150 100 L140 30 L160 30 Z' stroke='${c}' stroke-width='3' fill='none'/%3E`
  }
  return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'%3E${forme}%3C/svg%3E")`
}

// ============================================================
// AMBIANCE BIOME MAX — version cinéma totale pour l'HISTOIRE.
// Tout l'Ultra + foreground parallaxe + rafales + lucioles +
// éclairs + pétales + bloom + cendres vivantes + grain de film.
// Toujours sous les Pokémon. Aucun fond posé.
// ============================================================
export function AmbianceBiomeMax({ decor, boss = false }) {
  injecterStyles()
  const type = typeBiome(decor)
  const b = BIOMES[type] || BIOMES.nature
  const A = b.accent, A2 = b.accent2

  // Parallaxe 3 plans (comme Ultra mais plus dense).
  const couches = useMemo(() => {
    const plans = [
      { pi: 0, nb: Math.round(b.n * 0.6 * (boss ? 1.4 : 1)), tMin: 8, tVar: 9, sMul: 1.8, flou: 2.5, opac: 0.45 },
      { pi: 1, nb: Math.round(b.n * 0.9 * (boss ? 1.4 : 1)), tMin: 6, tVar: 7, sMul: 1.1, flou: 0.6, opac: 0.8 },
      { pi: 2, nb: Math.round(b.n * 0.7 * (boss ? 1.4 : 1)), tMin: 4, tVar: 5, sMul: 0.7, flou: 0, opac: 1 },
    ]
    return plans.map((plan) => {
      const arr = []
      for (let i = 0; i < plan.nb; i++) {
        const tBase = b.forme === 'feuille' ? 7 : 4
        const taille = (tBase + Math.random() * 6) * plan.sMul
        arr.push({
          i: `${plan.pi}-${i}`, taille, pos: Math.random() * 100,
          duree: plan.tMin + Math.random() * plan.tVar, delai: -Math.random() * 14,
          derive: (Math.random() * 140 - 70).toFixed(0) + 'px', flou: plan.flou, opac: plan.opac,
        })
      }
      return arr
    }).flat()
  }, [type, boss])

  // Rafales de vent (bourrasques de feuilles/débris).
  const rafales = useMemo(() => {
    const n = boss ? 16 : 11
    return Array.from({ length: n }).map((_, i) => ({
      i, top: 10 + Math.random() * 70, taille: 5 + Math.random() * 9,
      duree: 2.5 + Math.random() * 3, delai: -Math.random() * 8,
      dy: (Math.random() * 80 - 40).toFixed(0) + 'px',
    }))
  }, [boss])

  // Lucioles clignotantes (nature/eau/sanctuaire surtout).
  const lucioles = useMemo(() => {
    if (!(type === 'nature' || type === 'eau')) return []
    const n = boss ? 26 : 18
    return Array.from({ length: n }).map((_, i) => ({
      i, x: Math.random() * 100, y: Math.random() * 90, taille: 2 + Math.random() * 3,
      duree: 2 + Math.random() * 3, delai: -Math.random() * 5,
      lx: (Math.random() * 30 - 15).toFixed(0) + 'px', ly: (Math.random() * 30 - 15).toFixed(0) + 'px',
    }))
  }, [type, boss])

  // Pétales (nature → cerisier).
  const petales = useMemo(() => {
    if (type !== 'nature') return []
    const n = boss ? 28 : 20
    return Array.from({ length: n }).map((_, i) => ({
      i, pos: Math.random() * 100, taille: 6 + Math.random() * 6,
      duree: 6 + Math.random() * 6, delai: -Math.random() * 12,
      derive: (Math.random() * 160 - 40).toFixed(0) + 'px',
    }))
  }, [type, boss])

  // Cendres vivantes (feu).
  const cendres = useMemo(() => {
    if (type !== 'feu') return []
    const n = boss ? 34 : 24
    return Array.from({ length: n }).map((_, i) => ({
      i, pos: Math.random() * 100, taille: 3 + Math.random() * 4,
      duree: 5 + Math.random() * 5, delai: -Math.random() * 10,
      derive: (Math.random() * 80 - 40).toFixed(0) + 'px',
    }))
  }, [type, boss])

  // Éclairs (electrique) — quelques flashs décalés.
  const eclairs = type === 'electrique' ? [0, 1, 2] : []

  const horizontal = b.anim === 'amb-vent'
  const monte = b.anim === 'amb-monte'
  const nbRayons = (type === 'nature' || type === 'eau') ? 6 : 4
  const couleurSilhouette = 'rgba(0,0,0,0.55)'

  return (
    <div className="amb-wrap" style={{ zIndex: 1 }}>
      {/* BLOOM global */}
      <div className="max-bloom" style={{ background: `radial-gradient(ellipse at 50% 45%, ${A}22, transparent 60%)`, animationDuration: boss ? '3s' : '5s' }} />

      {/* GOD RAYS */}
      {Array.from({ length: nbRayons }).map((_, i) => (
        <div key={`ray-${i}`} className="ult-rayon"
          style={{ left: `${6 + i * (88 / nbRayons)}%`, background: `linear-gradient(to bottom, ${A2}, transparent)`, opacity: 0.2, animationDuration: `${6 + i * 1.3}s`, animationDelay: `${-i * 1.1}s` }} />
      ))}

      {/* AURORE / BRUME / HAZE selon biome */}
      {type === 'neige' && <div className="ult-aurore" style={{ background: `linear-gradient(100deg, ${A}, ${A2}, #a0ffe0, ${A})`, animationDuration: '9s' }} />}
      {(type === 'poussiere' || type === 'dragon') && (<>
        <div className="ult-brume" style={{ top: '18%', background: `radial-gradient(ellipse at center, ${A}, transparent 70%)`, animationDuration: '14s' }} />
        <div className="ult-brume" style={{ top: '52%', background: `radial-gradient(ellipse at center, ${A2}, transparent 70%)`, animationDuration: '18s', animationDelay: '-6s' }} />
      </>)}
      {(type === 'feu' || type === 'sable') && <div className="ult-haze" style={{ background: `linear-gradient(to top, ${A}22, transparent)`, animationDuration: '3.5s' }} />}

      {/* ÉCLAIRS (électrique) */}
      {eclairs.map((i) => (
        <div key={`ec-${i}`} className="max-eclair"
          style={{ background: `radial-gradient(ellipse at ${30 + i * 25}% 20%, ${A2}, transparent 55%)`, animation: `max-eclair ${5 + i * 2}s ease-out ${-i * 1.7}s infinite` }} />
      ))}

      {/* PARALLAXE particules */}
      {couches.map((p) => {
        const classeForme = b.forme === 'feuille' ? 'amb-feuille-forme' : b.forme === 'bulle' ? 'amb-bulle-forme' : ''
        const style = {
          width: p.taille, height: p.taille, background: Math.random() > 0.5 ? A2 : A, color: A,
          opacity: p.opac, filter: p.flou ? `blur(${p.flou}px)` : 'none',
          boxShadow: b.forme === 'bulle' ? 'none' : `0 0 ${p.taille * 1.8}px ${A}`,
          '--derive': p.derive, animation: `${b.anim} ${p.duree}s linear ${p.delai}s infinite`,
        }
        if (horizontal) { style.top = `${p.pos}%`; style.left = 0 }
        else if (monte) { style.left = `${p.pos}%`; style.bottom = '-6%' }
        else { style.left = `${p.pos}%`; style.top = '-6%' }
        return <span key={p.i} className={`amb-particule ${classeForme}`} style={style} />
      })}

      {/* RAFALES de vent */}
      {rafales.map((r) => (
        <span key={`raf-${r.i}`} className="max-rafale"
          style={{ top: `${r.top}%`, left: 0, width: r.taille, height: r.taille, background: A2, boxShadow: `0 0 ${r.taille * 2}px ${A}`, '--dy': r.dy, animation: `max-rafale ${r.duree}s ease-in ${r.delai}s infinite` }} />
      ))}

      {/* PÉTALES (nature) */}
      {petales.map((p) => (
        <span key={`pet-${p.i}`} className="max-petale"
          style={{ left: `${p.pos}%`, top: '-12%', width: p.taille, height: p.taille * 0.7, background: '#ffd6ec', boxShadow: `0 0 6px #ffaad4`, '--derive': p.derive, animation: `max-petale ${p.duree}s linear ${p.delai}s infinite` }} />
      ))}

      {/* CENDRES vivantes (feu) */}
      {cendres.map((c) => (
        <span key={`cen-${c.i}`} className="max-cendre"
          style={{ left: `${c.pos}%`, bottom: '-2%', width: c.taille, height: c.taille, background: Math.random() > 0.5 ? '#ffcf5a' : '#ff5a2d', boxShadow: `0 0 ${c.taille * 3}px #ff6a2d`, '--derive': c.derive, animation: `max-cendre ${c.duree}s ease-out ${c.delai}s infinite` }} />
      ))}

      {/* LUCIOLES */}
      {lucioles.map((l) => (
        <span key={`luc-${l.i}`} className="max-luciole"
          style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.taille, height: l.taille, background: A2, boxShadow: `0 0 ${l.taille * 4}px ${A2}`, '--lx': l.lx, '--ly': l.ly, animation: `max-luciole ${l.duree}s ease-in-out ${l.delai}s infinite` }} />
      ))}

      {/* SOL RÉACTIF */}
      <div className="ult-sol" style={{ width: '48%', background: `radial-gradient(ellipse at center, ${A}, transparent 70%)`, animationDuration: '3.4s', bottom: '8%' }} />
      <div className="ult-sol" style={{ width: '48%', background: `radial-gradient(ellipse at center, ${A2}, transparent 70%)`, animationDuration: '4.2s', animationDelay: '-1.5s', bottom: '52%' }} />

      {/* FOREGROUND silhouettes en parallaxe */}
      <div className="max-fg" style={{ backgroundImage: silhouetteBiome(type, couleurSilhouette), animationDuration: boss ? '26s' : '40s', opacity: 0.7 }} />

      {/* GRAIN de film */}
      <div className="max-grain" />

      {/* VIGNETTE qui respire */}
      <div className="ult-respire" style={{ boxShadow: `inset 0 0 200px 60px ${A}3a`, opacity: boss ? 0.75 : 0.5 }} />
      <div className="amb-vignette" />

      {/* FLASH boss */}
      {boss && <div style={{ position: 'absolute', inset: 0, background: A, animation: 'ult-flash 0.9s ease-out 1', mixBlendMode: 'screen', pointerEvents: 'none' }} />}
    </div>
  )
}