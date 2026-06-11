import { useState, useRef, useEffect } from 'react'
import { listerInventaire, totalBoosters, retirerBooster } from './inventaireBoosters'
import { ouvrirBooster, PALIERS, infoSet } from './boosters'

// ============================================================
// EcranBoosters : inventaire + ouverture animee des boosters TCG.
// Styles 100% inline (evite tout conflit avec App.css).
// Props :
//  - inventaire        : objet { idSet: quantite }
//  - onRetirerBooster  : (idSet) => void  (decremente l'inventaire parent)
//  - onCartesObtenues  : (cartes[]) => void  (ajoute les cartes a la collection)
//  - onFermer          : () => void
// ============================================================

export default function EcranBoosters({ inventaire, onRetirerBooster, onCartesObtenues, onFermer }) {
  // null = on est sur la liste ; sinon objet { idSet, cartes, reveal }
  const [ouverture, setOuverture] = useState(null)
  const timersRef = useRef([])

  // Nettoyage des timers a la fermeture du composant.
  useEffect(() => {
    return () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
  }, [])

  const liste = listerInventaire(inventaire)
  const total = totalBoosters(inventaire)

  // --- Lancer l'ouverture d'un booster ---
  function lancerOuverture(idSet) {
    if (ouverture) return // une ouverture a la fois
    const cartes = ouvrirBooster(idSet)
    if (!cartes || cartes.length === 0) return

    // On retire le booster de l'inventaire et on ajoute les cartes a la collection.
    if (onRetirerBooster) onRetirerBooster(idSet)
    if (onCartesObtenues) onCartesObtenues(cartes)

    // reveal[i] = true quand la carte i est revelee.
    setOuverture({ idSet, cartes, reveal: cartes.map(() => false), termine: false })

    // Revelation une par une.
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

  // --- Tout reveler d'un coup (bouton "passer") ---
  function toutReveler() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
    setOuverture((o) => o ? { ...o, reveal: o.cartes.map(() => true), termine: true } : o)
  }

  // --- Retour a la liste apres ouverture ---
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
    return (
      <div style={S.overlay}>
        <div style={S.fenetreOuverture}>
          <div style={S.enteteOuverture}>
            <span style={S.titreOuverture}>
              Booster {setInfo ? setInfo.nom : ouverture.idSet}
            </span>
            {!toutRevele && (
              <button style={S.boutonPasser} onClick={toutReveler}>Tout reveler</button>
            )}
          </div>

          <div style={S.grilleCartes}>
            {ouverture.cartes.map((carte, i) => (
              <CarteRevelee key={`${carte.id}-${i}`} carte={carte} revele={ouverture.reveal[i]} />
            ))}
          </div>

          {toutRevele && (
            <div style={S.barreBas}>
              <button style={S.boutonPrincipal} onClick={fermerOuverture}>
                Continuer
              </button>
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
        <div style={S.entete}>
          <span style={S.titre}>Mes Boosters {total > 0 && <span style={S.compteur}>({total})</span>}</span>
          <button style={S.boutonFermer} onClick={onFermer}>✕</button>
        </div>

        {liste.length === 0 ? (
          <div style={S.vide}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Aucun booster pour le moment</div>
            <div style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.5 }}>
              Grimpe dans la Tour Infinie pour gagner des boosters !<br />
              Un booster garanti tous les 5 niveaux.
            </div>
          </div>
        ) : (
          <div style={S.grilleBoosters}>
            {liste.map((b) => (
              <div key={b.id} style={S.carteBooster}>
                <div style={S.logoZone}>
                  {b.logo
                    ? <img src={b.logo} alt={b.nom} style={S.logo} />
                    : <span style={{ fontSize: 28 }}>🎴</span>}
                </div>
                <div style={S.nomSet}>{b.nom}</div>
                <div style={S.serieSet}>{b.serie}</div>
                <div style={S.ligneBas}>
                  <span style={S.badgeQte}>x{b.quantite}</span>
                  <button style={S.boutonOuvrir} onClick={() => lancerOuverture(b.id)}>
                    Ouvrir
                  </button>
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
// Une carte revelee (dos -> face avec halo selon palier)
// ------------------------------------------------------------
function CarteRevelee({ carte, revele }) {
  const palier = PALIERS[carte.palier] || PALIERS[3]
  const couleur = palier.couleur
  const brillante = carte.palier >= 4 // halo prononce a partir d'Ultra Rare

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
          ? `0 0 ${brillante ? 18 : 9}px ${couleur}, 0 0 ${brillante ? 34 : 0}px ${brillante ? couleur : 'transparent'}`
          : '0 2px 6px rgba(0,0,0,0.4)',
        border: `2px solid ${revele ? couleur : '#2a2a3a'}`,
      }}>
        {revele ? (
          <>
            <img src={carte.image} alt={carte.nom} style={S.carteImg}
                 onError={(e) => { e.target.style.display = 'none' }} />
            <div style={{ ...S.bandeau, background: couleur }}>
              <span style={S.palierEmoji}>{palier.emoji}</span>
              <span style={S.palierNom}>{palier.nom}</span>
            </div>
          </>
        ) : (
          <div style={S.dosCarte}>
            <span style={{ fontSize: 26, opacity: 0.5 }}>★</span>
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
    background: 'rgba(8,10,18,0.86)', backdropFilter: 'blur(2px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
  },
  fenetre: {
    width: '100%', maxWidth: 760, maxHeight: '88vh', overflowY: 'auto',
    background: 'linear-gradient(180deg,#1a1c2a,#13141f)',
    border: '1px solid #2c2e44', borderRadius: 16, padding: 18,
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)', color: '#e8e8f0',
    fontFamily: 'system-ui,-apple-system,sans-serif',
  },
  entete: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #2c2e44',
  },
  titre: { fontSize: 19, fontWeight: 800, letterSpacing: 0.3 },
  compteur: { fontWeight: 600, opacity: 0.6, fontSize: 16 },
  boutonFermer: {
    width: 34, height: 34, borderRadius: 8, border: 'none', cursor: 'pointer',
    background: '#2a2c40', color: '#cfcfe0', fontSize: 16, fontWeight: 700,
  },
  vide: { textAlign: 'center', padding: '40px 20px', color: '#cfcfe0' },
  grilleBoosters: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12,
  },
  carteBooster: {
    background: 'linear-gradient(180deg,#23253a,#1a1b2a)',
    border: '1px solid #34375a', borderRadius: 12, padding: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  logoZone: {
    width: '100%', height: 64, display: 'flex', alignItems: 'center',
    justifyContent: 'center', marginBottom: 8,
  },
  logo: { maxWidth: '100%', maxHeight: 64, objectFit: 'contain' },
  nomSet: { fontWeight: 700, fontSize: 14, textAlign: 'center', lineHeight: 1.2 },
  serieSet: { fontSize: 11, opacity: 0.55, marginBottom: 10, textAlign: 'center' },
  ligneBas: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: 'auto', gap: 8,
  },
  badgeQte: {
    background: '#34375a', color: '#fff', borderRadius: 6,
    padding: '3px 8px', fontSize: 13, fontWeight: 700,
  },
  boutonOuvrir: {
    flex: 1, border: 'none', borderRadius: 8, cursor: 'pointer',
    background: 'linear-gradient(180deg,#5b6cff,#4453e6)', color: '#fff',
    padding: '7px 10px', fontSize: 13, fontWeight: 700,
  },
  // --- Ouverture ---
  fenetreOuverture: {
    width: '100%', maxWidth: 820, maxHeight: '90vh', overflowY: 'auto',
    background: 'linear-gradient(180deg,#14152a,#0d0e18)',
    border: '1px solid #2c2e44', borderRadius: 16, padding: 18, color: '#e8e8f0',
    fontFamily: 'system-ui,-apple-system,sans-serif',
  },
  enteteOuverture: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  titreOuverture: { fontSize: 18, fontWeight: 800 },
  boutonPasser: {
    border: 'none', borderRadius: 8, cursor: 'pointer', background: '#2a2c40',
    color: '#cfcfe0', padding: '7px 12px', fontSize: 13, fontWeight: 600,
  },
  grilleCartes: {
    display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10,
  },
  carteContainer: { aspectRatio: '63/88' },
  carteInner: {
    width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden',
    position: 'relative', background: '#0c0d16',
    transition: 'box-shadow 0.4s ease, border-color 0.4s ease',
  },
  carteImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  dosCarte: {
    width: '100%', height: '100%', display: 'flex', alignItems: 'center',
    justifyContent: 'center',
    background: 'repeating-linear-gradient(45deg,#1c1e30,#1c1e30 6px,#222540 6px,#222540 12px)',
  },
  bandeau: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    padding: '2px 4px', fontSize: 9, fontWeight: 700, color: '#fff',
    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
  },
  palierEmoji: { fontSize: 10 },
  palierNom: { letterSpacing: 0.2 },
  barreBas: { display: 'flex', justifyContent: 'center', marginTop: 18 },
  boutonPrincipal: {
    border: 'none', borderRadius: 10, cursor: 'pointer',
    background: 'linear-gradient(180deg,#5b6cff,#4453e6)', color: '#fff',
    padding: '11px 34px', fontSize: 15, fontWeight: 800,
  },
}