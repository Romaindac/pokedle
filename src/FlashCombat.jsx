import { useEffect, useState } from 'react'

// ============================================================
// FLASH COMBAT — overlay non-bloquant pour les moments forts d'un
// auto-battler : "BOSS VAINCU", "ZONE LIBÉRÉE", "VICTOIRE"...
// Ne stoppe pas le combat : s'affiche, joue son anim, disparaît.
//
// Usage dans App.jsx :
//   const [flash, setFlash] = useState(null)
//   ... quand un boss tombe : setFlash({ type: 'boss', texte: 'BOSS VAINCU', sousTexte: route.nom })
//   <FlashCombat evenement={flash} onFini={() => setFlash(null)} />
//
// Types : 'boss' (or, épique), 'zone' (cyan, léger), 'victoire' (or),
//         'defaite' (rouge). Tout autre type = neutre.
// ============================================================

const STYLE_ID = 'flash-combat-styles'
function injecter() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = `
@keyframes fcVoile { 0% { opacity: 0; } 12% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
@keyframes fcTexte {
  0% { transform: scale(0.4) translateY(20px); opacity: 0; letter-spacing: 20px; }
  18% { transform: scale(1.08) translateY(0); opacity: 1; letter-spacing: 3px; }
  28% { transform: scale(1) translateY(0); }
  78% { transform: scale(1) translateY(0); opacity: 1; }
  100% { transform: scale(1.12) translateY(-12px); opacity: 0; letter-spacing: 8px; }
}
@keyframes fcSous { 0% { opacity: 0; transform: translateY(10px); } 30% { opacity: 0; } 45% { opacity: 1; transform: translateY(0); } 80% { opacity: 1; } 100% { opacity: 0; } }
@keyframes fcRaie { 0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; } 25% { opacity: 1; } 60%,100% { transform: translateX(120%) skewX(-18deg); opacity: 0; } }
@keyframes fcParticule { 0% { transform: translateY(0) scale(1); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-90px) scale(0.3); opacity: 0; } }
@keyframes fcAnneau { 0% { transform: translate(-50%,-50%) scale(0.2); opacity: 0.9; } 100% { transform: translate(-50%,-50%) scale(2.6); opacity: 0; } }
`
  document.head.appendChild(s)
}

const THEMES = {
  boss:     { c1: '#fcd34d', c2: '#f59e0b', glow: 'rgba(252,211,77,0.7)', duree: 2600 },
  victoire: { c1: '#fcd34d', c2: '#fbbf24', glow: 'rgba(252,211,77,0.7)', duree: 2400 },
  zone:     { c1: '#67e8f9', c2: '#22d3ee', glow: 'rgba(103,232,249,0.6)', duree: 1900 },
  defaite:  { c1: '#f87171', c2: '#dc2626', glow: 'rgba(248,113,113,0.6)', duree: 2200 },
  neutre:   { c1: '#a5b4fc', c2: '#818cf8', glow: 'rgba(165,180,252,0.6)', duree: 1900 },
}

function FlashCombat({ evenement, onFini }) {
  injecter()
  const [particules] = useState(() => Array.from({ length: 18 }, () => ({
    x: Math.random() * 100, d: (1.3 + Math.random() * 1.2).toFixed(2), del: (Math.random() * 0.5).toFixed(2),
    s: (2 + Math.random() * 3).toFixed(1),
  })))

  useEffect(() => {
    if (!evenement) return
    const theme = THEMES[evenement.type] || THEMES.neutre
    const t = setTimeout(() => { onFini && onFini() }, theme.duree)
    return () => clearTimeout(t)
  }, [evenement, onFini])

  if (!evenement) return null
  const theme = THEMES[evenement.type] || THEMES.neutre
  const texte = evenement.texte || 'VICTOIRE'
  const sousTexte = evenement.sousTexte || ''

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', borderRadius: 16,
      animation: `fcVoile ${theme.duree}ms ease-out forwards`,
      background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${theme.glow.replace('0.7', '0.22').replace('0.6', '0.2')}, transparent 70%), rgba(4,6,12,0.45)`,
      fontFamily: "'Rubik', system-ui, sans-serif",
    }}>
      {/* anneau de choc */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: 160, height: 160, borderRadius: '50%',
        border: `3px solid ${theme.c1}`, boxShadow: `0 0 30px ${theme.glow}`,
        animation: 'fcAnneau 0.9s ease-out forwards',
      }}></div>

      {/* raie lumineuse qui balaye */}
      <div style={{
        position: 'absolute', top: '42%', left: 0, width: '60%', height: 70,
        background: `linear-gradient(90deg, transparent, ${theme.glow}, transparent)`,
        filter: 'blur(6px)', animation: 'fcRaie 1.4s ease-out forwards',
      }}></div>

      {/* particules qui montent */}
      {particules.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${p.x}%`, bottom: '34%',
          width: p.s + 'px', height: p.s + 'px', borderRadius: '50%',
          background: theme.c1, boxShadow: `0 0 ${p.s * 2.5}px ${theme.c1}`,
          animation: `fcParticule ${p.d}s ease-out ${p.del}s forwards`,
        }}></div>
      ))}

      {/* texte principal */}
      <div style={{
        fontSize: 'clamp(2.2rem, 6vw, 4.4rem)', fontWeight: 900, fontStyle: 'italic',
        background: `linear-gradient(180deg, #fff 0%, ${theme.c1} 55%, ${theme.c2} 100%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        WebkitTextStroke: `1px ${theme.c2}`,
        filter: `drop-shadow(0 0 24px ${theme.glow}) drop-shadow(0 4px 6px rgba(0,0,0,0.6))`,
        animation: `fcTexte ${theme.duree}ms cubic-bezier(0.22,1,0.36,1) forwards`,
        textAlign: 'center', lineHeight: 1, padding: '0 16px',
      }}>{texte}</div>

      {/* sous-texte */}
      {sousTexte && (
        <div style={{
          marginTop: 14, fontSize: 'clamp(0.9rem, 2vw, 1.2rem)', fontWeight: 700,
          color: '#eef2fb', letterSpacing: 4, textTransform: 'uppercase',
          textShadow: `0 0 14px ${theme.glow}, 0 2px 4px rgba(0,0,0,0.8)`,
          animation: `fcSous ${theme.duree}ms ease-out forwards`,
        }}>{sousTexte}</div>
      )}
    </div>
  )
}

export default FlashCombat