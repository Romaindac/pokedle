import { useState, useRef, useEffect } from 'react'
import { listerInventaire, totalBoosters, retirerBooster } from './inventaireBoosters'
import { ouvrirBooster, PALIERS, infoSet } from './boosters'

// ============================================================
// EcranBoosters : inventaire + ouverture animee des boosters TCG.
// REFONTE PREMIUM (fond sombre, auras par palier, flash sur les
// cartes rares, images haute resolution). Styles 100% inline.
// Props :
//  - inventaire        : objet { idSet: quantite }
//  - onRetirerBooster  : (idSet) => void
//  - onCartesObtenues  : (cartes[]) => void
//  - onFermer          : () => void
// ============================================================

// Hex -> rgba (halos translucides).
function rgba(hex, a) {
  const h = (hex || '#888').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}
// URL haute resolution (fallback gere par onError).
function hires(url) { return (url || '').replace(/\.png$/, '_hires.png') }

export default function EcranBoosters({ inventaire, onRetirerBooster, onCartesObtenues, onFermer }) {
  const [ouverture, setOuverture] = useState(null)
  const timersRef = useRef([])

  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
  }, [])

  const liste = listerInventaire(inventaire)
  const total = totalBoosters(inventaire)

  function lancerOuverture(idSet) {
    if (ouverture) return
    const cartes = ouvrirBooster(idSet)
    if (!cartes || cartes.length === 0) return

    if (onRetirerBooster) onRetirerBooster(idSet)
    if (onCartesObtenues) onCartesObtenues(cartes)

    setOuverture({ idSet, cartes, reveal: cartes.map(() => false), termine: false })

    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    cartes.forEach((_, i) => {
      const t = setTimeout(() => {
        setOuverture((o) => {
          if (!o) return o
          const reveal = [...o.reveal]
          reveal[i] = true
          const termine = i === cartes.length - 1
          return { ...o, reveal, termine }
        })
      }, 450 + i * 420)
      timersRef.current.push(t)
    })
  }

  function toutReveler() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setOuverture((o) => o ? { ...o, reveal: o.cartes.map(() => true), termine: true } : o)
  }

  function fermerOuverture() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setOuverture(null)
  }

  // ============================================================
  // RENDU : ECRAN D'OUVERTURE
  // ============================================================
  if (ouverture) {
    const setInfo = infoSet(ouverture.idSet)
    const toutRevele = ouverture.reveal.every(Boolean)
    // Meilleure carte revelee (pour le bandeau de fin).
    const meilleurPalier = ouverture.cartes.reduce((m, c, i) => (ouverture.reveal[i] && c.palier > m ? c.palier : m), 0)
    return (
      <div style={S.overlay}>
        <div style={S.fenetreOuverture}>
          <div style={S.haloFond} />
          <div style={S.enteteOuverture}>
            <div>
              <div style={S.surTitre}>OUVERTURE DE BOOSTER</div>
              <span style={S.titreOuverture}>{setInfo ? setInfo.nom : ouverture.idSet}</span>
            </div>
            {!toutRevele && (
              <button style={S.boutonPasser} onClick={toutReveler}>Tout révéler</button>
            )}
          </div>

          <div style={S.grilleCartes}>
            {ouverture.cartes.map((carte, i) => (
              <CarteRevelee key={`${carte.id}-${i}`} carte={carte} revele={ouverture.reveal[i]} />
            ))}
          </div>

          {toutRevele && (
            <div style={S.barreBas}>
              {meilleurPalier >= 4 && (
                <div style={{ ...S.bandeauResultat, color: (PALIERS[meilleurPalier] || PALIERS[3]).couleur, borderColor: (PALIERS[meilleurPalier] || PALIERS[3]).couleur }}>
                  Meilleure trouvaille : {(PALIERS[meilleurPalier] || PALIERS[3]).nom} !
                </div>
              )}
              <button style={S.boutonPrincipal} onClick={fermerOuverture}>Continuer</button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================================
  // RENDU : LISTE DES BOOSTERS
  // ============================================================
  return (
    <div style={S.overlay}>
      <div style={S.fenetre}>
        <div style={S.haloFond} />
        <div style={S.entete}>
          <div>
            <div style={S.surTitre}>INVENTAIRE TCG</div>
            <span style={S.titre}>Mes Boosters {total > 0 && <span style={S.compteur}>({total})</span>}</span>
          </div>
          <button style={S.boutonFermer} onClick={onFermer}>✕</button>
        </div>

        {liste.length === 0 ? (
          <div style={S.vide}>
            <div style={S.videIcone}>?</div>
            <div style={{ fontWeight: 800, marginBottom: 6, fontSize: 15, color: '#fff' }}>Aucun booster pour le moment</div>
            <div style={{ fontSize: 13, color: '#9aa6bd', lineHeight: 1.5 }}>
              Grimpe dans la Tour Infinie pour gagner des boosters !<br />
              Un booster garanti tous les 5 niveaux.
            </div>
          </div>
        ) : (
          <div style={S.grilleBoosters}>
            {liste.map((b) => (
              <div key={b.id} style={S.carteBooster}>
                <div style={S.boosterAura} />
                <div style={S.logoZone}>
                  {b.logo
                    ? <img src={b.logo} alt={b.nom} style={S.logo} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    : <span style={S.nomSet}>{b.nom}</span>}
                </div>
                <div style={S.nomSet}>{b.nom}</div>
                <div style={S.serieSet}>{b.serie}</div>
                <div style={S.ligneBas}>
                  <span style={S.badgeQte}>×{b.quantite}</span>
                  <button style={S.boutonOuvrir} onClick={() => lancerOuverture(b.id)}>Ouvrir</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// Une carte revelee (dos -> face avec halo + flash selon palier)
// ------------------------------------------------------------
function CarteRevelee({ carte, revele }) {
  const palier = PALIERS[carte.palier] || PALIERS[3]
  const couleur = palier.couleur
  const brillante = carte.palier >= 4 // halo + flash a partir d'Ultra Rare
  const chroma = carte.palier >= 6

  const [flash, setFlash] = useState(false)
  const dejaRevele = useRef(false)
  useEffect(() => {
    if (revele && !dejaRevele.current) {
      dejaRevele.current = true
      if (brillante) {
        setFlash(true)
        const t = setTimeout(() => setFlash(false), 600)
        return () => clearTimeout(t)
      }
    }
  }, [revele, brillante])

  return (
    <div style={{
      ...S.carteContainer,
      transform: revele ? 'scale(1)' : 'scale(0.9)',
      opacity: revele ? 1 : 0.85,
      transition: 'transform 0.35s ease, opacity 0.35s ease',
    }}>
      <div style={{
        ...S.carteInner,
        boxShadow: revele
          ? `0 0 ${brillante ? 22 : 10}px ${rgba(couleur, 0.7)}${brillante ? `, 0 0 40px ${rgba(couleur, 0.4)}` : ''}`
          : '0 2px 6px rgba(0,0,0,0.4)',
        border: `2px solid ${revele ? couleur : '#2a2a3a'}`,
      }}>
        {revele ? (
          <>
            <img src={hires(carte.image)} alt={carte.nom} style={S.carteImg}
              data-hires="1"
              onError={(e) => {
                if (e.currentTarget.dataset.hires === '1') { e.currentTarget.dataset.hires = '0'; e.currentTarget.src = carte.image }
                else { e.currentTarget.style.display = 'none' }
              }} />
            {chroma && <div style={S.holo} />}
            {flash && <div style={{ ...S.flash, background: `radial-gradient(circle, ${rgba(couleur, 0.9)} 0%, transparent 70%)` }} />}
            <div style={{ ...S.bandeau, background: couleur }}>
              <span style={S.palierNom}>{palier.nom}</span>
            </div>
          </>
        ) : (
          <div style={S.dosCarte}>
            <div style={S.dosPokeball} />
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// STYLES (inline)
// ============================================================
const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9000,
    background: 'rgba(6,8,16,0.9)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
  },
  fenetre: {
    width: '100%', maxWidth: 880, maxHeight: '88vh', overflowY: 'auto', position: 'relative',
    background: 'radial-gradient(circle at 50% 0%, #1a1430 0%, #0a0612 75%)',
    border: '2px solid rgba(180,140,255,0.3)', borderRadius: 18, padding: 22,
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)', color: '#e8ecf6',
    fontFamily: "'Rubik',system-ui,-apple-system,sans-serif",
  },
  fenetreOuverture: {
    width: '100%', maxWidth: 900, maxHeight: '92vh', overflowY: 'auto', position: 'relative',
    background: 'radial-gradient(circle at 50% 0%, #1a1430 0%, #08060f 78%)',
    border: '2px solid rgba(252,211,77,0.35)', borderRadius: 18, padding: 22, color: '#e8ecf6',
    fontFamily: "'Rubik',system-ui,-apple-system,sans-serif",
    boxShadow: '0 0 50px rgba(252,211,77,0.12), 0 20px 60px rgba(0,0,0,0.7)',
  },
  haloFond: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 200, pointerEvents: 'none',
    background: 'radial-gradient(circle at 50% 0%, rgba(180,140,255,0.12) 0%, transparent 70%)',
  },
  entete: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 18, position: 'relative',
  },
  enteteOuverture: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18, position: 'relative',
  },
  surTitre: { fontSize: 11, letterSpacing: 3, color: '#c9a0ff', fontWeight: 800, marginBottom: 2 },
  titre: { fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 0 18px rgba(201,160,255,0.4)' },
  titreOuverture: { fontSize: 22, fontWeight: 900, color: '#fcd34d', textShadow: '0 0 18px rgba(252,211,77,0.5)' },
  compteur: { fontWeight: 700, color: '#9aa6bd', fontSize: 17 },
  boutonFermer: {
    width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
    background: 'rgba(255,255,255,0.1)', color: '#cfd8e3', fontSize: 16, fontWeight: 700, flexShrink: 0,
  },
  vide: { textAlign: 'center', padding: '48px 20px', position: 'relative' },
  videIcone: {
    width: 64, height: 64, margin: '0 auto 14px', borderRadius: '50%',
    border: '2px dashed rgba(180,140,255,0.4)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#7a86a0',
  },
  grilleBoosters: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(168px,1fr))', gap: 16, position: 'relative',
  },
  carteBooster: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(70,50,110,0.4), rgba(28,20,50,0.55))',
    border: '2px solid rgba(180,140,255,0.4)', borderRadius: 16, padding: 14,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 0 20px rgba(159,127,238,0.2)',
  },
  boosterAura: {
    position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
    width: 140, height: 100, pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(252,211,77,0.18) 0%, transparent 70%)',
  },
  logoZone: {
    width: '100%', height: 68, display: 'flex', alignItems: 'center',
    justifyContent: 'center', marginBottom: 8, position: 'relative', zIndex: 1,
  },
  logo: { maxWidth: '100%', maxHeight: 68, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' },
  nomSet: { fontWeight: 800, fontSize: 14, textAlign: 'center', lineHeight: 1.2, color: '#fff', position: 'relative', zIndex: 1 },
  serieSet: { fontSize: 11, color: '#9aa6bd', marginBottom: 12, textAlign: 'center', position: 'relative', zIndex: 1 },
  ligneBas: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: 'auto', gap: 8, position: 'relative', zIndex: 1,
  },
  badgeQte: {
    background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: 7,
    padding: '4px 9px', fontSize: 13, fontWeight: 800,
  },
  boutonOuvrir: {
    flex: 1, border: 'none', borderRadius: 9, cursor: 'pointer',
    background: 'linear-gradient(180deg,#fcd34d,#e0a82e)', color: '#3a2800',
    padding: '8px 10px', fontSize: 13, fontWeight: 900, boxShadow: '0 3px 0 #a87b1e',
  },
  boutonPasser: {
    border: '1px solid rgba(255,255,255,0.2)', borderRadius: 9, cursor: 'pointer', background: 'rgba(255,255,255,0.06)',
    color: '#cfd8e3', padding: '8px 14px', fontSize: 13, fontWeight: 700, flexShrink: 0,
  },
  grilleCartes: {
    display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, position: 'relative',
  },
  carteContainer: { aspectRatio: '63/88' },
  carteInner: {
    width: '100%', height: '100%', borderRadius: 11, overflow: 'hidden',
    position: 'relative', background: '#0c0d16',
    transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
  },
  carteImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  holo: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'linear-gradient(120deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)',
  },
  flash: {
    position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2,
    animation: 'none',
  },
  dosCarte: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'repeating-linear-gradient(45deg,#1c1e30,#1c1e30 6px,#222540 6px,#222540 12px)',
  },
  dosPokeball: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'linear-gradient(180deg, #c0392b 0%, #c0392b 46%, #1a1a1a 46%, #1a1a1a 54%, #f7f7f7 54%)',
    border: '3px solid #1a1a1a', opacity: 0.55,
  },
  bandeau: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '3px 4px', fontSize: 9, fontWeight: 800, color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.7)',
  },
  palierNom: { letterSpacing: 0.3 },
  barreBas: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 22, position: 'relative' },
  bandeauResultat: {
    fontSize: 13, fontWeight: 800, padding: '6px 16px', borderRadius: 20,
    border: '1.5px solid', background: 'rgba(255,255,255,0.04)',
  },
  boutonPrincipal: {
    border: 'none', borderRadius: 12, cursor: 'pointer',
    background: 'linear-gradient(180deg,#fcd34d,#e0a82e)', color: '#3a2800',
    padding: '13px 40px', fontSize: 16, fontWeight: 900, boxShadow: '0 5px 0 #a87b1e',
  },
}