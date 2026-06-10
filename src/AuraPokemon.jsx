import { useRef, useEffect, memo } from 'react'

// ============================================================
// AURA POKEMON — moteur de particules Canvas.
// Dessine une VRAIE aura animee autour du sprite :
//   - au repos : aura selon le TYPE principal (flammes, bulles, arcs...)
//   - sous STATUT : l'aura se transforme (brulure, gel, poison...)
//   - shiny : etincelles dorees en plus, quelle que soit l'aura
// 100% autonome : son propre rythme d'animation (30 fps), React.memo,
// AUCUNE ligne dans App.css, aucun filter/blur sur les sprites.
// ============================================================

// --- Configuration des auras ---------------------------------
// Chaque aura definit : un comportement, des couleurs, un debit.
const AURAS = {
  // Comportements : flamme, bulle, etincelle, feuille, cristal,
  // volute, orbite, ombre, scintille, roche, vent, toxique, dome
  flamme:    { spawn: 0.55, vie: [600, 1000] },
  bulle:     { spawn: 0.30, vie: [900, 1600] },
  etincelle: { spawn: 0.40, vie: [180, 380] },
  feuille:   { spawn: 0.25, vie: [1200, 2000] },
  cristal:   { spawn: 0.25, vie: [1200, 2200] },
  volute:    { spawn: 0.30, vie: [1000, 1800] },
  orbite:    { spawn: 0.30, vie: [1400, 2200] },
  ombre:     { spawn: 0.35, vie: [800, 1400] },
  scintille: { spawn: 0.35, vie: [500, 1000] },
  roche:     { spawn: 0.22, vie: [700, 1200] },
  vent:      { spawn: 0.30, vie: [400, 800] },
  toxique:   { spawn: 0.35, vie: [900, 1500] },
  dome:      { spawn: 0.45, vie: [800, 1400] },
}

// Aura de TYPE (au repos) : comportement + palette.
const AURA_TYPE = {
  fire:     { mode: 'flamme',    couleurs: ['#ffdf6b', '#ff9a3c', '#ff5722'] },
  water:    { mode: 'bulle',     couleurs: ['#7cc7ff', '#4d90d5', '#bfe6ff'] },
  electric: { mode: 'etincelle', couleurs: ['#ffe93c', '#fff8b0', '#f4d23c'] },
  grass:    { mode: 'feuille',   couleurs: ['#7fd86a', '#63bb5b', '#b9f0a5'] },
  bug:      { mode: 'feuille',   couleurs: ['#b9d34c', '#90c12c', '#e2f3a0'] },
  ice:      { mode: 'cristal',   couleurs: ['#aef0e6', '#73cec0', '#e3fffa'] },
  ghost:    { mode: 'volute',    couleurs: ['#a18ae6', '#7b62c9', '#d3c6ff'] },
  psychic:  { mode: 'orbite',    couleurs: ['#ff9bb0', '#fa7179', '#ffd4de'] },
  dark:     { mode: 'ombre',     couleurs: ['#6b6378', '#3f3a4a', '#8d84a0'] },
  fairy:    { mode: 'scintille', couleurs: ['#ffb8f5', '#ec8fe6', '#ffe3fb'] },
  dragon:   { mode: 'flamme',    couleurs: ['#8fb0ff', '#3b6dd6', '#c4d6ff'] },
  rock:     { mode: 'roche',     couleurs: ['#d6c79a', '#c7b78b', '#efe6c8'] },
  ground:   { mode: 'roche',     couleurs: ['#e0a877', '#d97746', '#f3cfa8'] },
  steel:    { mode: 'roche',     couleurs: ['#b8ccd6', '#5a8ea1', '#e2eef3'] },
  poison:   { mode: 'toxique',   couleurs: ['#c98ae0', '#b265d6', '#e6c4f5'] },
  fighting: { mode: 'flamme',    couleurs: ['#ff8aa5', '#ce4069', '#ffc4d2'] },
  flying:   { mode: 'vent',      couleurs: ['#cfdcf7', '#8fa8dd', '#eef3ff'] },
  normal:   { mode: 'vent',      couleurs: ['#d8dce2', '#9099a1', '#f0f2f5'] },
}

// Aura de STATUT (prioritaire sur le type) : la transformation.
const AURA_STATUT = {
  brulure:   { mode: 'flamme',    couleurs: ['#ffd23c', '#ff7a1a', '#e63b00'], intensite: 1.7 },
  gel:       { mode: 'cristal',   couleurs: ['#c8f4ff', '#7fd9f5', '#ffffff'], intensite: 1.5 },
  poison:    { mode: 'toxique',   couleurs: ['#d36ef0', '#9b30c9', '#f0b8ff'], intensite: 1.6 },
  paralysie: { mode: 'etincelle', couleurs: ['#fff176', '#ffe93c', '#ffffff'], intensite: 1.9 },
  rage:      { mode: 'flamme',    couleurs: ['#ff6b6b', '#e62222', '#ffb3b3'], intensite: 1.8 },
  garde:     { mode: 'dome',      couleurs: ['#7cd4ff', '#3da9e0', '#d4f1ff'], intensite: 1.3 },
  hate:      { mode: 'vent',      couleurs: ['#7ef0d4', '#34d399', '#d2fff1'], intensite: 1.9 },
}
const ORDRE_STATUTS = ['brulure', 'gel', 'poison', 'paralysie', 'rage', 'garde', 'hate']

const OR = ['#ffe27a', '#fcd34d', '#fff6cf'] // etincelles shiny

// AURA DE BOSS : fumee noire-violette + braises rouge sang + halo pulsant au sol.
const BOSS_FUMEE = ['#1a1026', '#3a1c3f', '#0d0712']
const BOSS_BRAISES = ['#ff3d2e', '#a3001b', '#ff7a45']

function entre(min, max) { return min + Math.random() * (max - min) }
function pioche(liste) { return liste[Math.floor(Math.random() * liste.length)] }

// Cree une particule selon le mode, dans un repere ou (cx, cy) = pied du sprite.
function creerParticule(mode, couleurs, L, H, vie) {
  const cx = L / 2
  const sol = H * 0.86
  const p = {
    mode, couleur: pioche(couleurs), vie: 0, vieMax: entre(vie[0], vie[1]),
    x: cx, y: sol, vx: 0, vy: 0, taille: 3, angle: Math.random() * Math.PI * 2, va: 0,
  }
  switch (mode) {
    case 'flamme':
      p.x = cx + entre(-L * 0.22, L * 0.22); p.y = sol - entre(0, 6)
      p.vx = entre(-0.12, 0.12); p.vy = entre(-0.55, -0.95)
      p.taille = entre(2.2, 4.6); break
    case 'bulle':
      p.x = cx + entre(-L * 0.26, L * 0.26); p.y = sol
      p.vx = entre(-0.06, 0.06); p.vy = entre(-0.25, -0.5)
      p.taille = entre(1.8, 3.6); break
    case 'etincelle':
      p.x = cx + entre(-L * 0.3, L * 0.3); p.y = sol - entre(0, H * 0.55)
      p.vx = entre(-0.3, 0.3); p.vy = entre(-0.3, 0.3)
      p.taille = entre(3, 7); break
    case 'feuille':
      p.x = cx + entre(-L * 0.3, L * 0.3); p.y = sol - H * 0.6 - entre(0, 14)
      p.vx = entre(-0.18, 0.18); p.vy = entre(0.12, 0.3)
      p.taille = entre(2, 3.6); p.va = entre(-0.05, 0.05); break
    case 'cristal':
      p.x = cx + entre(-L * 0.28, L * 0.28); p.y = sol - entre(0, H * 0.5)
      p.vx = entre(-0.04, 0.04); p.vy = entre(-0.12, -0.22)
      p.taille = entre(1.8, 3.4); p.va = entre(-0.02, 0.02); break
    case 'volute':
      p.x = cx + entre(-L * 0.24, L * 0.24); p.y = sol - entre(0, 8)
      p.vx = entre(-0.08, 0.08); p.vy = entre(-0.3, -0.5)
      p.taille = entre(3, 6); break
    case 'orbite':
      p.rayon = entre(L * 0.16, L * 0.3); p.cy = sol - H * 0.3
      p.va = entre(0.015, 0.03) * (Math.random() < 0.5 ? -1 : 1)
      p.taille = entre(1.6, 3); break
    case 'ombre':
      p.x = cx + entre(-L * 0.26, L * 0.26); p.y = sol - entre(0, H * 0.35)
      p.vx = entre(-0.08, 0.08); p.vy = entre(0.08, 0.2)
      p.taille = entre(3, 6); break
    case 'scintille':
      p.x = cx + entre(-L * 0.3, L * 0.3); p.y = sol - entre(0, H * 0.6)
      p.vx = 0; p.vy = entre(-0.06, -0.12)
      p.taille = entre(1.5, 3.2); break
    case 'roche':
      p.x = cx + entre(-L * 0.28, L * 0.28); p.y = sol - entre(0, 4)
      p.vx = entre(-0.1, 0.1); p.vy = entre(-0.3, -0.5)
      p.gravite = 0.012; p.taille = entre(1.4, 2.8); break
    case 'vent':
      p.x = entre(0, L * 0.2); p.y = sol - entre(H * 0.1, H * 0.55)
      p.vx = entre(0.7, 1.3); p.vy = entre(-0.03, 0.03)
      p.taille = entre(5, 11); break
    case 'toxique':
      p.x = cx + entre(-L * 0.24, L * 0.24); p.y = sol
      p.vx = entre(-0.05, 0.05); p.vy = entre(-0.18, -0.34)
      p.taille = entre(2, 4.2); break
    case 'dome':
      p.rayon = L * 0.3; p.cy = sol - H * 0.28
      p.angle = Math.random() * Math.PI * 2
      p.va = entre(0.02, 0.035); p.taille = entre(1.6, 2.6); break
    default: break
  }
  return p
}

function dessinerParticule(ctx, p, L, H) {
  const t = p.vie / p.vieMax
  // Apparition douce + extinction douce.
  const alpha = t < 0.15 ? t / 0.15 : t > 0.7 ? (1 - t) / 0.3 : 1
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.9
  ctx.fillStyle = p.couleur
  ctx.strokeStyle = p.couleur
  const cx = L / 2
  switch (p.mode) {
    case 'flamme': {
      // Flamme : goutte qui retrecit en montant, coeur clair.
      const r = p.taille * (1 - t * 0.7)
      ctx.beginPath()
      ctx.ellipse(p.x, p.y, r * 0.7, r * 1.25, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha *= 0.7
      ctx.fillStyle = '#fff6cf'
      ctx.beginPath()
      ctx.ellipse(p.x, p.y + r * 0.2, r * 0.3, r * 0.55, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'bulle':
    case 'toxique': {
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2); ctx.stroke()
      ctx.globalAlpha *= 0.35
      ctx.beginPath(); ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 'etincelle': {
      // Petit arc electrique en zigzag.
      ctx.lineWidth = 1.2
      ctx.beginPath()
      let x = p.x, y = p.y
      ctx.moveTo(x, y)
      for (let s = 0; s < 3; s++) {
        x += entre(-p.taille, p.taille); y += entre(-p.taille, p.taille)
        ctx.lineTo(x, y)
      }
      ctx.stroke()
      break
    }
    case 'feuille': {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
      ctx.beginPath(); ctx.ellipse(0, 0, p.taille * 1.6, p.taille * 0.7, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      break
    }
    case 'cristal': {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle)
      const r = p.taille
      ctx.beginPath()
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.6, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.6, 0)
      ctx.closePath(); ctx.fill()
      ctx.restore()
      break
    }
    case 'volute':
    case 'ombre': {
      const r = p.taille * (0.7 + t * 0.8)
      ctx.globalAlpha *= 0.45
      ctx.beginPath(); ctx.arc(p.x + Math.sin(p.vie * 0.01 + p.angle) * 4, p.y, r, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 'orbite': {
      const x = cx + Math.cos(p.angle) * p.rayon
      const y = p.cy + Math.sin(p.angle) * p.rayon * 0.4
      ctx.beginPath(); ctx.arc(x, y, p.taille, 0, Math.PI * 2); ctx.fill()
      break
    }
    case 'scintille': {
      // Etoile a 4 branches qui scintille.
      const r = p.taille * (0.6 + 0.4 * Math.sin(p.vie * 0.02 + p.angle))
      ctx.save(); ctx.translate(p.x, p.y)
      ctx.beginPath()
      ctx.moveTo(0, -r); ctx.lineTo(r * 0.25, -r * 0.25); ctx.lineTo(r, 0); ctx.lineTo(r * 0.25, r * 0.25)
      ctx.lineTo(0, r); ctx.lineTo(-r * 0.25, r * 0.25); ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.25, -r * 0.25)
      ctx.closePath(); ctx.fill()
      ctx.restore()
      break
    }
    case 'roche': {
      ctx.beginPath(); ctx.arc(p.x, p.y, p.taille * (1 - t * 0.4), 0, Math.PI * 2); ctx.fill()
      break
    }
    case 'vent': {
      ctx.lineWidth = 1.4
      ctx.beginPath(); ctx.moveTo(p.x - p.taille, p.y); ctx.lineTo(p.x + p.taille, p.y); ctx.stroke()
      break
    }
    case 'dome': {
      const x = cx + Math.cos(p.angle) * p.rayon
      const y = p.cy + Math.sin(p.angle) * p.rayon * 0.55
      ctx.beginPath(); ctx.arc(x, y, p.taille, 0, Math.PI * 2); ctx.fill()
      break
    }
    default: break
  }
  ctx.globalAlpha = 1
}

function majParticule(p, dt) {
  p.vie += dt
  if (p.mode === 'orbite' || p.mode === 'dome') { p.angle += p.va * dt * 0.06; return }
  if (p.gravite) p.vy += p.gravite * dt * 0.06
  p.x += p.vx * dt * 0.06
  p.y += p.vy * dt * 0.06
  if (p.va) p.angle += p.va * dt * 0.06
  if (p.mode === 'flamme') p.x += Math.sin(p.vie * 0.012 + p.angle) * 0.25 // vacillement
  if (p.mode === 'bulle' || p.mode === 'toxique') p.x += Math.sin(p.vie * 0.008 + p.angle) * 0.18
  if (p.mode === 'feuille') p.x += Math.sin(p.vie * 0.006 + p.angle) * 0.3 // balancement
}

function AuraPokemon({ types = [], statuts = [], shiny = false, ko = false, boss = false }) {
  const canvasRef = useRef(null)
  const configRef = useRef({ mode: null, couleurs: [], intensite: 1, shiny: false, ko: false, boss: false })

  // Met a jour la config SANS redemarrer la boucle (transition fluide).
  const cleStatuts = (statuts || []).join(',')
  const cleTypes = (types || []).join(',')
  useEffect(() => {
    let conf = null
    const statutActif = ORDRE_STATUTS.find((s) => (statuts || []).includes(s))
    if (statutActif) {
      const a = AURA_STATUT[statutActif]
      conf = { mode: a.mode, couleurs: a.couleurs, intensite: a.intensite }
    } else {
      const typePrincipal = (types || [])[0]
      const a = AURA_TYPE[typePrincipal]
      if (a) conf = { mode: a.mode, couleurs: a.couleurs, intensite: 1 }
    }
    configRef.current = { ...(conf || { mode: null, couleurs: [], intensite: 1 }), shiny: !!shiny, ko: !!ko, boss: !!boss }
  }, [cleTypes, cleStatuts, shiny, ko, boss])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let particules = []
    let actif = true
    let precedent = performance.now()
    let accumulateur = 0
    const CADENCE = 1000 / 30 // 30 fps : fluide et leger

    // Dimensionne le canvas sur sa taille reelle a l'ecran.
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

      // === AURA DE BOSS : halo rouge sombre pulsant au sol + fumee + braises ===
      if (conf.boss) {
        const pulse = 0.6 + 0.4 * Math.sin(maintenant * 0.0035)
        const g = ctx.createRadialGradient(L / 2, H * 0.86, 4, L / 2, H * 0.86, L * 0.5)
        g.addColorStop(0, `rgba(170, 0, 35, ${0.4 * pulse})`)
        g.addColorStop(0.6, `rgba(60, 0, 50, ${0.22 * pulse})`)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.ellipse(L / 2, H * 0.86, L * 0.5, H * 0.2, 0, 0, Math.PI * 2); ctx.fill()
        if (particules.length < 36) {
          if (Math.random() < 0.5) {
            const f = creerParticule('ombre', BOSS_FUMEE, L, H, [1000, 1800])
            f.taille *= 1.6; particules.push(f)
          }
          if (Math.random() < 0.45) {
            const b = creerParticule('flamme', BOSS_BRAISES, L, H, [500, 950])
            b.vx *= 1.6; particules.push(b)
          }
        }
      }

      // Spawn selon le mode actif.
      if (!conf.boss && conf.mode && AURAS[conf.mode]) {
        const base = AURAS[conf.mode]
        const debit = base.spawn * conf.intensite
        if (particules.length < 26 && Math.random() < debit) {
          particules.push(creerParticule(conf.mode, conf.couleurs, L, H, base.vie))
        }
      }
      // Etincelles dorees shiny (en plus de l'aura).
      if (conf.shiny && particules.length < 32 && Math.random() < 0.12) {
        const p = creerParticule('scintille', OR, L, H, [500, 900])
        p.estOr = true
        particules.push(p)
      }

      // Mise a jour + dessin.
      for (let i = particules.length - 1; i >= 0; i--) {
        const p = particules[i]
        majParticule(p, pas)
        if (p.vie >= p.vieMax || p.y < -10 || p.x < -14 || p.x > L + 14 || p.y > H + 10) {
          particules.splice(i, 1)
          continue
        }
        // Une particule d'un ancien mode finit sa vie naturellement (transition douce).
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
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1,
      }}
    />
  )
}

// Memo : on ne re-rend que si l'aura doit reellement changer
// (les ticks de combat ne redemarrent jamais l'animation).
function egales(avant, apres) {
  return (
    avant.shiny === apres.shiny &&
    avant.ko === apres.ko &&
    avant.boss === apres.boss &&
    (avant.types || []).join(',') === (apres.types || []).join(',') &&
    (avant.statuts || []).join(',') === (apres.statuts || []).join(',')
  )
}

export default memo(AuraPokemon, egales)