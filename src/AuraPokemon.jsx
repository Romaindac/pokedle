import { useRef, useEffect, memo } from 'react'

// ============================================================
// AURA POKEMON — moteur de particules Canvas (refonte v2).
// Dessine une VRAIE aura animee qui jaillit du bas de la carte
// et enveloppe le sprite :
//   - au repos : aura selon le(s) TYPE(s) du Pokemon. Bi-type =
//     les DEUX effets se melangent (spawn alterne).
//   - sous STATUT : une fine couche se superpose a l'aura de type
//     (braises, glacons, petillements violets, Z de sommeil...).
//   - shiny : etincelles dorees en plus.
//   - boss : halo rouge sang + fumee (prioritaire, ignore les types).
//   - fusion/special/legendaire : aura prismatique (prioritaire).
// 100% autonome : 30 fps, React.memo, AUCUNE ligne dans App.css.
// Chaque effet est en rendu ADDITIF (globalCompositeOperation
// 'lighter') pour un vrai glow, sauf l'ombre (densite).
// ============================================================

// --- Comportements (spawn de base + duree de vie) ------------
const AURAS = {
  flamme:    { spawn: 0.48, vie: [800, 1300] },
  bulle:     { spawn: 0.42, vie: [900, 1600] },
  etincelle: { spawn: 0.55, vie: [260, 560] },
  feuille:   { spawn: 0.42, vie: [1400, 2200] },
  cristal:   { spawn: 0.40, vie: [1200, 2200] },
  volute:    { spawn: 0.40, vie: [1100, 1900] },
  orbite:    { spawn: 0.42, vie: [1500, 2400] },
  ombre:     { spawn: 0.50, vie: [900, 1500] },
  scintille: { spawn: 0.38, vie: [500, 1000] },
  roche:     { spawn: 0.42, vie: [700, 1300] },
  vent:      { spawn: 0.45, vie: [420, 850] },
  toxique:   { spawn: 0.45, vie: [900, 1600] },
  dome:      { spawn: 0.45, vie: [800, 1400] },
  ecaille:   { spawn: 0.42, vie: [900, 1600] }, // dragon
  vortex:    { spawn: 0.60, vie: [900, 1500] }, // fusions : plasma spirale
}

// Aura de TYPE : chaque type Pokemon -> comportement + palette.
const AURA_TYPE = {
  fire:     { mode: 'flamme',    couleurs: ['#ffdf6b', '#ff9a3c', '#ff5722'] },
  water:    { mode: 'bulle',     couleurs: ['#7cc7ff', '#4d90d5', '#bfe6ff'] },
  electric: { mode: 'etincelle', couleurs: ['#ffe93c', '#fff8b0', '#f4d23c'] },
  grass:    { mode: 'feuille',   couleurs: ['#7fd86a', '#63bb5b', '#b9f0a5'] },
  bug:      { mode: 'feuille',   couleurs: ['#b9d34c', '#90c12c', '#e2f3a0'] },
  ice:      { mode: 'cristal',   couleurs: ['#aef0e6', '#73cec0', '#e3fffa'] },
  ghost:    { mode: 'volute',    couleurs: ['#b39aef', '#8c6fd6', '#d3c6ff'] },
  psychic:  { mode: 'orbite',    couleurs: ['#ff9bb0', '#fa7179', '#ffd4de'] },
  dark:     { mode: 'ombre',     couleurs: ['#7a6fa0', '#352c4a', '#9d8fc0'] },
  fairy:    { mode: 'scintille', couleurs: ['#ffb8f5', '#ec8fe6', '#ffe3fb'] },
  dragon:   { mode: 'ecaille',   couleurs: ['#9fb6ff', '#5b7de6', '#c4d6ff'] },
  rock:     { mode: 'roche',     couleurs: ['#d6c79a', '#a8946b', '#efe6c8'] },
  ground:   { mode: 'roche',     couleurs: ['#e0a877', '#c2703f', '#f3cfa8'] },
  steel:    { mode: 'roche',     couleurs: ['#cdd9e2', '#7fa0b3', '#eef6fb'] },
  poison:   { mode: 'toxique',   couleurs: ['#d36ef0', '#a23bd6', '#f0b8ff'] },
  fighting: { mode: 'flamme',    couleurs: ['#ff8aa5', '#ce4069', '#ffc4d2'] },
  flying:   { mode: 'vent',      couleurs: ['#cfdcf7', '#8fa8dd', '#eef3ff'] },
  normal:   { mode: 'vent',      couleurs: ['#e2e6ec', '#aab2bd', '#f6f8fb'] },
}

// Aura de STATUT (couche superposee, plus legere) : transformation visible.
const AURA_STATUT = {
  brulure:   { mode: 'flamme',    couleurs: ['#ffd23c', '#ff7a1a', '#e63b00'], intensite: 0.9 },
  gel:       { mode: 'cristal',   couleurs: ['#c8f4ff', '#7fd9f5', '#ffffff'], intensite: 0.8 },
  poison:    { mode: 'toxique',   couleurs: ['#e07cff', '#b030e0', '#f3c4ff'], intensite: 0.9 },
  paralysie: { mode: 'etincelle', couleurs: ['#fff176', '#ffe93c', '#ffffff'], intensite: 0.8 },
  rage:      { mode: 'flamme',    couleurs: ['#ff6b6b', '#e62222', '#ffb3b3'], intensite: 0.9 },
  garde:     { mode: 'dome',      couleurs: ['#7cd4ff', '#3da9e0', '#d4f1ff'], intensite: 0.9 },
  hate:      { mode: 'vent',      couleurs: ['#7ef0d4', '#34d399', '#d2fff1'], intensite: 1.0 },
}
const ORDRE_STATUTS = ['brulure', 'gel', 'poison', 'paralysie', 'rage', 'garde', 'hate']

const OR = ['#ffe27a', '#fcd34d', '#fff6cf'] // etincelles shiny

// AURA DE BOSS : fumee noire-violette + braises rouge sang + halo pulsant.
const BOSS_FUMEE = ['#1a1026', '#3a1c3f', '#0d0712']
const BOSS_BRAISES = ['#ff3d2e', '#a3001b', '#ff7a45']
const PRISME = ['#c084fc', '#60a5fa', '#f472b6', '#fcd34d', '#5eead4']

function entre(min, max) { return min + Math.random() * (max - min) }
function pioche(liste) { return liste[Math.floor(Math.random() * liste.length)] }

// Cree une particule selon le mode. Repere : (cx, sol) = bas de la carte.
// Les particules NAISSENT sur toute la largeur du bas et montent en
// s'evasant pour envelopper le sprite (effet "jaillit du socle").
function creerParticule(mode, couleurs, L, H, vie) {
  const cx = L / 2
  const sol = H * 0.88
  const p = {
    mode, couleur: pioche(couleurs), vie: 0, vieMax: entre(vie[0], vie[1]),
    x: cx, y: sol, vx: 0, vy: 0, taille: 3, angle: Math.random() * Math.PI * 2, va: 0,
  }
  switch (mode) {
    case 'flamme':
      p.x = cx + entre(-L * 0.40, L * 0.40); p.y = sol - entre(0, 6)
      p.vx = entre(-0.18, 0.18); p.vy = entre(-1.3, -2.3)
      p.taille = entre(6, 13); break
    case 'bulle':
      p.x = cx + entre(-L * 0.44, L * 0.44); p.y = sol
      p.vx = entre(-0.10, 0.10); p.vy = entre(-0.5, -1.05)
      p.taille = entre(3.6, 8); break
    case 'etincelle':
      p.x = cx + entre(-L * 0.46, L * 0.46); p.y = sol - entre(0, H * 0.7)
      p.vx = entre(-0.5, 0.5); p.vy = entre(-0.7, 0.3)
      p.taille = entre(9, 19); break
    case 'feuille':
      // Naissent en bas, montent en spiralant (spores) ; certaines tombent.
      p.x = cx + entre(-L * 0.36, L * 0.36); p.y = sol - entre(0, 10)
      p.vx = entre(-0.25, 0.25); p.vy = entre(-0.7, -1.15)
      p.taille = entre(3.5, 6.5); p.va = entre(-0.06, 0.06)
      p.phase = Math.random() * Math.PI * 2; p.estPetale = Math.random() < 0.45; break
    case 'cristal':
      p.x = cx + entre(-L * 0.44, L * 0.44); p.y = sol - entre(0, H * 0.7)
      p.vx = entre(-0.06, 0.06); p.vy = entre(-0.14, -0.28)
      p.taille = entre(4.5, 8.5); p.va = entre(-0.025, 0.025); break
    case 'volute':
      // Volutes spectrales qui serpentent en montant.
      p.x = cx + entre(-L * 0.30, L * 0.30); p.y = sol - entre(0, 8)
      p.vx = 0; p.vy = entre(-0.6, -1.0)
      p.taille = entre(5, 10); p.phase = Math.random() * Math.PI * 2
      p.ampl = entre(8, 20); p.baseX = p.x; break
    case 'orbite':
      // Orbes en orbite + quelques ondes concentriques.
      p.rayon = entre(L * 0.16, L * 0.34); p.cy = sol - H * 0.34
      p.va = entre(0.018, 0.034) * (Math.random() < 0.5 ? -1 : 1)
      p.taille = entre(2.5, 5); p.onde = Math.random() < 0.18
      if (p.onde) { p.taille = entre(L * 0.18, L * 0.3); p.vieMax = entre(700, 1100) }
      break
    case 'ombre':
      // Fumee sombre dense qui monte en gonflant.
      p.x = cx + entre(-L * 0.40, L * 0.40); p.y = sol - entre(0, H * 0.2)
      p.vx = entre(-0.10, 0.10); p.vy = entre(-0.35, -0.65)
      p.taille = entre(7, 14); p.phase = Math.random() * Math.PI * 2; break
    case 'scintille':
      p.x = cx + entre(-L * 0.34, L * 0.34); p.y = sol - entre(0, H * 0.65)
      p.vx = entre(-0.04, 0.04); p.vy = entre(-0.08, -0.16)
      p.taille = entre(3.5, 7); break
    case 'roche':
      // Eclats mineraux qui JAILLISSENT vers le haut puis retombent (gravite).
      p.x = cx + entre(-L * 0.30, L * 0.30); p.y = sol - entre(0, 4)
      p.vx = entre(-0.5, 0.5); p.vy = entre(-1.4, -2.6)
      p.gravite = 0.05; p.taille = entre(2.2, 5)
      p.angle = Math.random() * Math.PI * 2; p.va = entre(-0.08, 0.08)
      p.facettes = 3 + Math.floor(Math.random() * 3); break
    case 'vent':
      // Traines horizontales rapides + quelques plumes.
      p.x = entre(0, L * 0.25); p.y = sol - entre(H * 0.08, H * 0.62)
      p.vx = entre(0.9, 1.7); p.vy = entre(-0.05, 0.05)
      p.taille = entre(8, 18); p.plume = Math.random() < 0.3
      p.longueur = entre(0.5, 1); break
    case 'toxique':
      // Bulles toxiques qui bouillonnent et eclatent.
      p.x = cx + entre(-L * 0.32, L * 0.32); p.y = sol
      p.vx = entre(-0.10, 0.10); p.vy = entre(-0.4, -0.8)
      p.taille = entre(3, 6.5); p.phase = Math.random() * Math.PI * 2; break
    case 'dome':
      p.rayon = L * 0.3; p.cy = sol - H * 0.3
      p.angle = Math.random() * Math.PI * 2
      p.va = entre(0.02, 0.035); p.taille = entre(1.8, 3); break
    case 'ecaille':
      // Dragon : souffle ascendant + ecailles lumineuses qui montent.
      p.x = cx + entre(-L * 0.34, L * 0.34); p.y = sol - entre(0, 8)
      p.vx = entre(-0.12, 0.12); p.vy = entre(-0.9, -1.6)
      p.taille = entre(4, 8); p.angle = Math.random() * Math.PI * 2
      p.va = entre(-0.04, 0.04); p.souffle = Math.random() < 0.4; break
    case 'vortex': {
      // Plasma qui spirale autour du sprite : chaque particule orbite a un
      // rayon donne, monte lentement, et son angle tourne (effet tourbillon).
      p.cy = sol - H * 0.42
      p.rayon = entre(L * 0.12, L * 0.42)
      p.angle = Math.random() * Math.PI * 2
      p.va = entre(0.05, 0.09) * (Math.random() < 0.5 ? -1 : 1) // sens de rotation
      p.montee = entre(0.25, 0.6)
      p.taille = entre(3, 6.5)
      break
    }
    default: break
  }
  return p
}

function dessinerParticule(ctx, p, L, H) {
  const t = p.vie / p.vieMax
  const alpha = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1
  const a = Math.max(0, Math.min(1, alpha))
  ctx.globalAlpha = a
  ctx.fillStyle = p.couleur
  ctx.strokeStyle = p.couleur
  const cx = L / 2
  const ADD = 'lighter'

  switch (p.mode) {
    case 'flamme': {
      // VRAIE LANGUE DE FEU : goutte inversee effilee vers le haut (pointe),
      // empilement additif rouge sombre -> orange -> coeur clair. Moins large
      // et moins diffus qu'un halo : une vraie flamme qui leche vers le haut.
      const r = p.taille * (1 - t * 0.6)
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      const dx = Math.sin(p.vie * 0.02 + p.angle) * r * 0.25
      // forme de flamme : base large arrondie, pointe fine en haut.
      const flamme = (cx0, cy0, larg, haut, col, al) => {
        ctx.globalAlpha = a * al; ctx.fillStyle = col
        ctx.beginPath()
        ctx.moveTo(cx0, cy0 - haut)                    // pointe haute
        ctx.quadraticCurveTo(cx0 + larg, cy0 - haut * 0.35, cx0 + larg * 0.55, cy0)
        ctx.quadraticCurveTo(cx0, cy0 + haut * 0.18, cx0 - larg * 0.55, cy0)
        ctx.quadraticCurveTo(cx0 - larg, cy0 - haut * 0.35, cx0, cy0 - haut)
        ctx.closePath(); ctx.fill()
      }
      // couche externe (rouge/orange selon l'age)
      flamme(p.x + dx, p.y, r * 0.85, r * 2.6, t > 0.55 ? '#9a2200' : p.couleur, 0.45)
      // couche moyenne orange vif, plus fine
      flamme(p.x + dx, p.y - r * 0.15, r * 0.5, r * 2.0, t > 0.6 ? '#ff5a1e' : '#ff8c2e', 0.55)
      // coeur clair (flamme jeune)
      if (t < 0.55) flamme(p.x + dx, p.y - r * 0.1, r * 0.26, r * 1.3, '#fff2c0', 0.6)
      ctx.globalCompositeOperation = av
      break
    }
    case 'bulle':
    case 'toxique': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      const r = p.taille
      ctx.globalAlpha = a * 0.4
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 1.3, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = a * 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha = a * 0.7; ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill()
      ctx.globalCompositeOperation = av
      break
    }
    case 'etincelle': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      const pts = [{ x: p.x, y: p.y }]
      let x = p.x, y = p.y
      for (let s = 0; s < 4; s++) { x += entre(-p.taille, p.taille); y += entre(-p.taille * 1.3, p.taille * 0.6); pts.push({ x, y }) }
      ctx.globalAlpha = a * 0.5; ctx.strokeStyle = p.couleur; ctx.lineWidth = 4; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const pt of pts) ctx.lineTo(pt.x, pt.y); ctx.stroke()
      ctx.globalAlpha = a * 0.95; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (const pt of pts) ctx.lineTo(pt.x, pt.y); ctx.stroke()
      ctx.globalCompositeOperation = av
      break
    }
    case 'feuille': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
      if (p.estPetale) {
        // Petale : ellipse pointue.
        ctx.globalAlpha = a * 0.85; ctx.fillStyle = p.couleur
        ctx.beginPath(); ctx.ellipse(0, 0, p.taille * 1.7, p.taille * 0.65, 0, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8
        ctx.beginPath(); ctx.moveTo(-p.taille * 1.5, 0); ctx.lineTo(p.taille * 1.5, 0); ctx.stroke()
      } else {
        // Spore lumineuse : point + halo.
        ctx.globalAlpha = a * 0.35; ctx.fillStyle = p.couleur
        ctx.beginPath(); ctx.arc(0, 0, p.taille * 1.4, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#f4ffe0'
        ctx.beginPath(); ctx.arc(0, 0, p.taille * 0.5, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
      ctx.globalCompositeOperation = av
      break
    }
    case 'cristal': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
      const r = p.taille
      // Flocon : 3 axes croises + losange central.
      ctx.globalAlpha = a * 0.5; ctx.strokeStyle = p.couleur; ctx.lineWidth = 1.4; ctx.lineCap = 'round'
      for (let k = 0; k < 3; k++) {
        const ang = (k * Math.PI) / 3
        ctx.beginPath()
        ctx.moveTo(-Math.cos(ang) * r * 1.3, -Math.sin(ang) * r * 1.3)
        ctx.lineTo(Math.cos(ang) * r * 1.3, Math.sin(ang) * r * 1.3)
        ctx.stroke()
      }
      ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.moveTo(0, -r * 0.55); ctx.lineTo(r * 0.28, 0); ctx.lineTo(0, r * 0.55); ctx.lineTo(-r * 0.28, 0); ctx.closePath(); ctx.fill()
      ctx.restore()
      ctx.globalCompositeOperation = av
      break
    }
    case 'volute': {
      // Volute spectrale : traine ondulante semi-transparente + tete lumineuse.
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      const r = p.taille * (0.7 + t * 0.6)
      ctx.globalAlpha = a * 0.4; ctx.fillStyle = p.couleur
      // 3 boules decalees pour faire une traine fantome.
      for (let k = 0; k < 3; k++) {
        const dy = k * r * 0.9
        const dx = Math.sin((p.vie * 0.006) + p.phase + k) * r * 0.7
        ctx.globalAlpha = a * (0.42 - k * 0.1)
        ctx.beginPath(); ctx.arc(p.x + dx, p.y + dy, r * (1 - k * 0.18), 0, Math.PI * 2); ctx.fill()
      }
      // Tete claire.
      ctx.globalAlpha = a * 0.7; ctx.fillStyle = '#eadcff'
      ctx.beginPath(); ctx.arc(p.x, p.y - r * 0.2, r * 0.45, 0, Math.PI * 2); ctx.fill()
      ctx.globalCompositeOperation = av
      break
    }
    case 'orbite': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      if (p.onde) {
        // Onde concentrique psychique : anneau qui s'agrandit.
        const r = p.taille * (0.3 + t * 0.9)
        ctx.globalAlpha = a * 0.5; ctx.strokeStyle = p.couleur; ctx.lineWidth = 2
        ctx.beginPath(); ctx.ellipse(cx, p.cy, r, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke()
      } else {
        const x = cx + Math.cos(p.angle) * p.rayon
        const y = p.cy + Math.sin(p.angle) * p.rayon * 0.42
        ctx.globalAlpha = a * 0.45; ctx.fillStyle = p.couleur
        ctx.beginPath(); ctx.arc(x, y, p.taille * 1.5, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = a * 0.95; ctx.fillStyle = '#ffffff'
        ctx.beginPath(); ctx.arc(x, y, p.taille * 0.45, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalCompositeOperation = av
      break
    }
    case 'scintille': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      const r = p.taille * (0.55 + 0.45 * Math.sin(p.vie * 0.025 + p.angle))
      ctx.save(); ctx.translate(p.x, p.y)
      ctx.globalAlpha = a * 0.4; ctx.fillStyle = p.couleur
      ctx.beginPath(); ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2); ctx.fill()
      ctx.globalAlpha = a * 0.95; ctx.fillStyle = p.couleur
      ctx.beginPath()
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.22, -r * 0.22); ctx.lineTo(r, 0); ctx.lineTo(r * 0.22, r * 0.22)
      ctx.lineTo(0, r); ctx.lineTo(-r * 0.22, r * 0.22); ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.22, -r * 0.22)
      ctx.closePath(); ctx.fill()
      ctx.globalAlpha = a * 0.7; ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      ctx.globalCompositeOperation = av
      break
    }
    case 'roche': {
      // Eclat mineral facette (polygone) qui tournoie.
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
      const r = p.taille
      const n = p.facettes || 4
      ctx.globalAlpha = a * 0.85; ctx.fillStyle = p.couleur
      ctx.beginPath()
      for (let k = 0; k < n; k++) {
        const ang = (k / n) * Math.PI * 2
        const rr = r * (0.7 + (k % 2) * 0.5)
        const px = Math.cos(ang) * rr, py = Math.sin(ang) * rr
        if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
      }
      ctx.closePath(); ctx.fill()
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.25, r * 0.25, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      ctx.globalCompositeOperation = av
      break
    }
    case 'vent': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      const len = p.taille * (p.longueur || 1)
      if (p.plume) {
        // Petite plume : arc courbe.
        ctx.globalAlpha = a * 0.7; ctx.strokeStyle = p.couleur; ctx.lineWidth = 2; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(p.x - len, p.y); ctx.quadraticCurveTo(p.x, p.y - 4, p.x + len, p.y); ctx.stroke()
      } else {
        // Traine de vent : trait effile avec degrade d'alpha.
        ctx.globalAlpha = a * 0.6; ctx.strokeStyle = p.couleur; ctx.lineWidth = 2.4; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(p.x - len, p.y); ctx.lineTo(p.x + len, p.y); ctx.stroke()
        ctx.globalAlpha = a * 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.9
        ctx.beginPath(); ctx.moveTo(p.x - len * 0.5, p.y); ctx.lineTo(p.x + len, p.y); ctx.stroke()
      }
      ctx.globalCompositeOperation = av
      break
    }
    case 'dome': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      const x = cx + Math.cos(p.angle) * p.rayon
      const y = p.cy + Math.sin(p.angle) * p.rayon * 0.55
      ctx.globalAlpha = a * 0.8; ctx.fillStyle = p.couleur
      ctx.beginPath(); ctx.arc(x, y, p.taille, 0, Math.PI * 2); ctx.fill()
      ctx.globalCompositeOperation = av
      break
    }
    case 'ombre': {
      // Fumee sombre : pas d'additif (le noir ne glow pas). Densite + violet profond.
      const r = p.taille * (0.8 + t * 0.9)
      const dx = Math.sin(p.vie * 0.005 + p.phase) * 5
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = p.couleur
      ctx.beginPath(); ctx.arc(p.x + dx, p.y, r, 0, Math.PI * 2); ctx.fill()
      // Liseré violet vif pour decoller du fond.
      ctx.globalAlpha = a * 0.35; ctx.strokeStyle = '#9d7cff'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(p.x + dx, p.y, r * 0.7, 0, Math.PI * 2); ctx.stroke()
      break
    }
    case 'ecaille': {
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      if (p.souffle) {
        // Souffle : trait vertical lumineux qui monte.
        const r = p.taille
        ctx.globalAlpha = a * 0.5; ctx.fillStyle = p.couleur
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 0.55, r * 1.6, 0, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = a * 0.8; ctx.fillStyle = '#e8f0ff'
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r * 0.25, r * 0.9, 0, 0, Math.PI * 2); ctx.fill()
      } else {
        // Ecaille : losange brillant qui tournoie.
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
        const r = p.taille
        ctx.globalAlpha = a * 0.55; ctx.fillStyle = p.couleur
        ctx.beginPath(); ctx.moveTo(0, -r * 1.1); ctx.lineTo(r * 0.6, 0); ctx.lineTo(0, r * 1.1); ctx.lineTo(-r * 0.6, 0); ctx.closePath(); ctx.fill()
        ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#ffffff'
        ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.3, r * 0.22, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }
      ctx.globalCompositeOperation = av
      break
    }
    case 'vortex': {
      // Plasma en spirale : orbe lumineux + traine, position calculee par l'orbite.
      const av = ctx.globalCompositeOperation
      ctx.globalCompositeOperation = ADD
      const x = cx + Math.cos(p.angle) * p.rayon
      const y = p.cy + Math.sin(p.angle) * p.rayon * 0.5
      // traine : un point en arriere sur l'orbite
      const xa = cx + Math.cos(p.angle - p.va * 6) * p.rayon
      const ya = p.cy + Math.sin(p.angle - p.va * 6) * p.rayon * 0.5
      ctx.globalAlpha = a * 0.4; ctx.strokeStyle = p.couleur; ctx.lineWidth = p.taille * 0.9; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(x, y); ctx.stroke()
      // halo
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = p.couleur
      ctx.beginPath(); ctx.arc(x, y, p.taille * 1.4, 0, Math.PI * 2); ctx.fill()
      // coeur blanc
      ctx.globalAlpha = a * 0.95; ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.arc(x, y, p.taille * 0.5, 0, Math.PI * 2); ctx.fill()
      ctx.globalCompositeOperation = av
      break
    }
    default: break
  }
  ctx.globalAlpha = 1
}

function majParticule(p, dt) {
  p.vie += dt
  const f = dt * 0.06
  if (p.mode === 'vortex') { p.angle += p.va * f; p.cy -= p.montee * f; return }
  if (p.mode === 'orbite' && !p.onde) { p.angle += p.va * f; return }
  if (p.mode === 'dome') { p.angle += p.va * f; return }
  if (p.gravite) p.vy += p.gravite * f
  p.x += p.vx * f
  p.y += p.vy * f
  if (p.va && p.mode !== 'orbite') p.angle += p.va * f
  if (p.mode === 'flamme') p.x += Math.sin(p.vie * 0.02 + p.angle) * 0.55
  if (p.mode === 'bulle' || p.mode === 'toxique') p.x += Math.sin(p.vie * 0.008 + (p.phase || 0)) * 0.22
  if (p.mode === 'feuille') p.x += Math.sin(p.vie * 0.005 + (p.phase || 0)) * 0.45
  if (p.mode === 'volute') p.x = p.baseX + Math.sin(p.vie * 0.006 + p.phase) * p.ampl
  if (p.mode === 'ecaille' && p.souffle) p.x += Math.sin(p.vie * 0.01 + p.angle) * 0.4
}

function AuraPokemon({ types = [], statuts = [], shiny = false, ko = false, boss = false, special = false, legendaire = false }) {
  const canvasRef = useRef(null)
  // config : aura de type (1 ou 2 modes melanges) + couche statut superposee.
  const configRef = useRef({ couches: [], statut: null, shiny: false, ko: false, boss: false, special: false })

  const cleStatuts = (statuts || []).join(',')
  const cleTypes = (types || []).join(',')
  useEffect(() => {
    // 1) Aura de TYPE : on prend jusqu'a 2 types et on melange leurs effets.
    // Les LEGENDAIRES gardent leur element mais en version BOOSTEE (intensite x1.8).
    const boost = legendaire ? 1.8 : 1
    const couches = []
    const vus = new Set()
    for (const ty of (types || [])) {
      const a = AURA_TYPE[ty]
      if (a && !vus.has(a.mode)) { couches.push({ mode: a.mode, couleurs: a.couleurs, intensite: boost }); vus.add(a.mode) }
      if (couches.length >= 2) break
    }
    if (couches.length === 0) couches.push({ mode: 'vent', couleurs: AURA_TYPE.normal.couleurs, intensite: boost })

    // 2) Couche STATUT superposee (la plus prioritaire des statuts actifs).
    let statut = null
    const statutActif = ORDRE_STATUTS.find((s) => (statuts || []).includes(s))
    if (statutActif) {
      const st = AURA_STATUT[statutActif]
      statut = { mode: st.mode, couleurs: st.couleurs, intensite: st.intensite }
    }

    // 3) Priorites :
    //    - BOSS : halo rouge sang (ecrase tout).
    //    - FUSION (special) : vortex de plasma multicolore (ecrase les types).
    //    - LEGENDAIRE : garde son element booste + legere touche prismatique.
    let prioritaire = null
    if (boss) prioritaire = 'boss'
    else if (special) prioritaire = 'special'

    configRef.current = {
      couches, statut, prioritaire,
      legendaire: !!legendaire && !boss && !special,
      shiny: !!shiny, ko: !!ko, boss: !!boss, special: !!special,
    }
  }, [cleTypes, cleStatuts, !!shiny, !!ko, !!boss, !!special, !!legendaire])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particules = []
    let actif = true
    let precedent = performance.now()
    let accumulateur = 0
    const CADENCE = 1000 / 30
    let tour = 0 // pour alterner le spawn des 2 couches de type

    function dimensionner() {
      const r = canvas.getBoundingClientRect()
      const L = Math.max(60, Math.round(r.width))
      const H = Math.max(60, Math.round(r.height))
      if (canvas.width !== L) canvas.width = L
      if (canvas.height !== H) canvas.height = H
    }
    dimensionner()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(dimensionner) : null
    if (observer) observer.observe(canvas)

    function boucle(maintenant) {
      if (!actif) return
      requestAnimationFrame(boucle)
      const dt = Math.min(80, maintenant - precedent)
      precedent = maintenant
      accumulateur += dt
      if (accumulateur < CADENCE) return
      const pas = accumulateur
      accumulateur = 0
      if (document.hidden) return

      const conf = configRef.current
      const L = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, L, H)
      if (conf.ko) { particules = []; return }
      tour++

      // === BOSS : halo rouge sang pulsant + fumee + braises (ecrase les types) ===
      if (conf.prioritaire === 'boss') {
        const pulse = 0.6 + 0.4 * Math.sin(maintenant * 0.0035)
        const g = ctx.createRadialGradient(L / 2, H * 0.86, 4, L / 2, H * 0.86, L * 0.5)
        g.addColorStop(0, `rgba(170, 0, 35, ${0.4 * pulse})`)
        g.addColorStop(0.6, `rgba(60, 0, 50, ${0.22 * pulse})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.ellipse(L / 2, H * 0.86, L * 0.5, H * 0.2, 0, 0, Math.PI * 2); ctx.fill()
        if (particules.length < 150) {
          if (Math.random() < 0.5) { const f = creerParticule('ombre', BOSS_FUMEE, L, H, [1000, 1800]); f.taille *= 1.4; particules.push(f) }
          if (Math.random() < 0.45) { const b = creerParticule('flamme', BOSS_BRAISES, L, H, [500, 950]); b.vx *= 1.5; particules.push(b) }
        }
      } else if (conf.prioritaire === 'special') {
        // === FUSION : VORTEX DE PLASMA multicolore qui spirale (ecrase les types) ===
        if (particules.length < 150 && Math.random() < 0.85) {
          particules.push(creerParticule('vortex', PRISME, L, H, [900, 1500]))
        }
      } else {
        // === AURA DE TYPE : 1 ou 2 couches melangees (spawn alterne) ===
        // (legendaire = intensite boostee deja dans la config)
        const couches = conf.couches || []
        if (couches.length > 0 && particules.length < 155) {
          const couche = couches[tour % couches.length]
          const base = AURAS[couche.mode]
          if (base) {
            const debit = base.spawn * couche.intensite * 4.0
            if (Math.random() < debit) {
              particules.push(creerParticule(couche.mode, couche.couleurs, L, H, base.vie))
            }
          }
        }
        // === LEGENDAIRE : legere touche prismatique en bonus (pas envahissante) ===
        if (conf.legendaire && particules.length < 165 && Math.random() < 0.10) {
          const pr = creerParticule('scintille', PRISME, L, H, [600, 1100])
          pr.taille *= 0.8
          particules.push(pr)
        }
        // === COUCHE STATUT superposee (plus legere) ===
        if (conf.statut && particules.length < 170) {
          const base = AURAS[conf.statut.mode]
          if (base) {
            const debit = base.spawn * conf.statut.intensite * 2.4
            if (Math.random() < debit) {
              const sp = creerParticule(conf.statut.mode, conf.statut.couleurs, L, H, base.vie)
              sp.estStatut = true
              particules.push(sp)
            }
          }
        }
      }

      // === Etincelles dorees shiny (en plus de tout) ===
      if (conf.shiny && particules.length < 170 && Math.random() < 0.12) {
        const p = creerParticule('scintille', OR, L, H, [500, 900]); p.estOr = true; particules.push(p)
      }

      for (let i = particules.length - 1; i >= 0; i--) {
        const p = particules[i]
        majParticule(p, pas)
        if (p.vie >= p.vieMax || p.y < -12 || p.x < -16 || p.x > L + 16 || p.y > H + 14) {
          particules.splice(i, 1); continue
        }
        dessinerParticule(ctx, p, L, H)
      }
    }
    requestAnimationFrame(boucle)
    return () => { actif = false; if (observer) observer.disconnect() }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}
    />
  )
}

function egales(avant, apres) {
  return (
    avant.shiny === apres.shiny &&
    avant.ko === apres.ko &&
    avant.boss === apres.boss &&
    avant.special === apres.special &&
    avant.legendaire === apres.legendaire &&
    (avant.types || []).join(',') === (apres.types || []).join(',') &&
    (avant.statuts || []).join(',') === (apres.statuts || []).join(',')
  )
}

export default memo(AuraPokemon, egales)