import { useRef, useEffect } from 'react'
import { ambianceDeZone } from './AmbianceCombat'

// ============================================================
// TAPIS DE DUEL — le sol holographique 3D de l'arene.
// Trois couches, toutes en pointer-events none :
//   1. VIGNETTE : assombrit doucement le decor de fond (les
//      combattants, auras et cartes ressortent).
//   2. TAPIS : un plan 3D en perspective (rotateX) avec une
//      grille lumineuse aux couleurs de la zone, qui DEFILE
//      lentement vers le joueur (sol holographique vivant).
//   3. HORIZON : une ligne de lumiere a la jonction sol/decor.
// Mode boss : la grille vire au rouge sang et pulse.
// 100% styles inline + Web Animations API — zero App.css.
// ============================================================

// Couleur de la grille selon l'ambiance de la zone.
const COULEUR_AMBIANCE = {
  neige:     '#67e8f9', // cyan glace
  cendres:   '#fb923c', // orange braise
  sable:     '#fbbf24', // sable dore
  spores:    '#c084fc', // violet mystique
  feuilles:  '#4ade80', // vert nature
  poussiere: '#93c5fd', // bleu neutre
}
const COULEUR_BOSS = '#f43f5e' // rouge sang

const PAS_GRILLE = 56 // taille d'une case de la grille (px)

function TapisDuel({ decor, estBoss = false }) {
  const solRef = useRef(null)

  const ambiance = ambianceDeZone(decor)
  const couleur = estBoss ? COULEUR_BOSS : (COULEUR_AMBIANCE[ambiance] || COULEUR_AMBIANCE.poussiere)

  // Defilement infini de la grille vers le joueur (Web Animations API :
  // pas de keyframes CSS, donc rien dans App.css).
  useEffect(() => {
    const sol = solRef.current
    if (!sol || typeof sol.animate !== 'function') return
    const anim = sol.animate(
      [
        { backgroundPosition: '0px 0px, 0px 0px' },
        { backgroundPosition: `0px ${PAS_GRILLE}px, 0px ${PAS_GRILLE}px` },
      ],
      { duration: estBoss ? 2600 : 5200, iterations: Infinity, easing: 'linear' }
    )
    return () => anim.cancel()
  }, [estBoss])

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>

      {/* 1. VIGNETTE : decor assombri sur les bords + en haut (le ciel recule) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(5,8,14,0.45) 0%, rgba(5,8,14,0.1) 30%, rgba(5,8,14,0.15) 100%)',
      }}></div>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 75% 70% at 50% 55%, rgba(0,0,0,0) 55%, rgba(5,8,14,0.5) 100%)',
      }}></div>

      {/* 2. LE TAPIS : plan 3D incline, grille lumineuse qui defile */}
      <div style={{
        position: 'absolute', left: '-25%', right: '-25%', bottom: '-12%', height: '88%',
        perspective: 620, perspectiveOrigin: '50% 0%',
      }}>
        <div
          ref={solRef}
          style={{
            width: '100%', height: '100%',
            transform: 'rotateX(58deg)',
            transformOrigin: 'top center',
            backgroundImage:
              `repeating-linear-gradient(to right, ${couleur}26 0px, ${couleur}26 1.5px, transparent 1.5px, transparent ${PAS_GRILLE}px),` +
              `repeating-linear-gradient(to bottom, ${couleur}33 0px, ${couleur}33 1.5px, transparent 1.5px, transparent ${PAS_GRILLE}px)`,
            backgroundSize: `${PAS_GRILLE}px ${PAS_GRILLE}px, ${PAS_GRILLE}px ${PAS_GRILLE}px`,
          }}
        >
          {/* Teinte du sol : plus dense pres du joueur, fondu vers l'horizon */}
          <div style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(to bottom, ${couleur}00 0%, ${couleur}0d 45%, ${couleur}1f 100%)`,
          }}></div>
        </div>
      </div>

      {/* Fondu de l'horizon : la grille s'evanouit en s'eloignant */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: '11%', height: '22%',
        background: 'linear-gradient(to bottom, rgba(5,8,14,0.0) 0%, rgba(5,8,14,0.0) 10%, rgba(5,8,14,0.0) 100%)',
        borderTop: 'none',
      }}></div>

      {/* 3. LIGNE D'HORIZON lumineuse */}
      <div style={{
        position: 'absolute', left: '6%', right: '6%', top: '13%', height: 2,
        background: `linear-gradient(to right, transparent 0%, ${couleur}55 18%, ${couleur}aa 50%, ${couleur}55 82%, transparent 100%)`,
        boxShadow: `0 0 14px 2px ${couleur}44`,
      }}></div>
    </div>
  )
}

export default TapisDuel