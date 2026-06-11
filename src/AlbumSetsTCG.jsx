import { useState } from 'react'
import { IDS_SETS } from './setsCartes'
import {
  infoSet, cartesDuSet, idsPossedesDuSet, progressionSet,
  compterParPalierMin, PALIERS,
} from './boosters'

// ============================================================
// AlbumSetsTCG : album des sets (boosters) — REFONTE PREMIUM.
// Un set a la fois. Styles inline (aucun conflit App.css).
// Look : fond sombre profond, auras de couleur par palier,
// cartes chromatiques avec reflet holographique, vitrine des
// plus belles cartes en tete.
// Props :
//   - collection : collectionCartesTCG (tableau d'objets carte)
// ============================================================

// Hex -> rgba (pour les halos/ombres translucides).
function rgba(hex, a) {
  const h = (hex || '#888').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ----- Calcul du taux de drop d'UNE carte précise -----
// Reproduit la logique de ouvrirBooster (boosters.js) :
//   - 6 slots de base : 70% palier 1, 30% palier 2
//   - 2 slots "rare"    : [3:0.80, 4:0.16, 5:0.03, 6:0.01]
//   - 2 slots "brillant": [3:0.45, 4:0.38, 5:0.12, 6:0.05]
// Proba qu'un slot donne le palier P, puis 1/N pour la carte précise
// (N = nb de cartes de ce palier dans le set). On combine les 10 slots
// pour obtenir la proba qu'au moins un slot donne CETTE carte.
const PROBA_SLOT_BASE = { 1: 0.70, 2: 0.30, 3: 0, 4: 0, 5: 0, 6: 0 }
const PROBA_SLOT_RARE = { 1: 0, 2: 0, 3: 0.80, 4: 0.16, 5: 0.03, 6: 0.01 }
const PROBA_SLOT_BRIL = { 1: 0, 2: 0, 3: 0.45, 4: 0.38, 5: 0.12, 6: 0.05 }

function tauxDropCarte(carte, cartesDuSetListe) {
  if (!carte || !carte.palier) return null
  const P = carte.palier
  // Nombre de cartes de ce palier dans le set.
  const N = cartesDuSetListe.filter((c) => c.palier === P).length
  if (N <= 0) return null
  const pCarteDansPalier = 1 / N

  // --- Proba du PALIER (au moins une carte de ce palier dans le booster) ---
  const pBaseP = PROBA_SLOT_BASE[P] || 0
  const pRareP = PROBA_SLOT_RARE[P] || 0
  const pBrilP = PROBA_SLOT_BRIL[P] || 0
  const pAucunPalier = Math.pow(1 - pBaseP, 6) * Math.pow(1 - pRareP, 2) * Math.pow(1 - pBrilP, 2)
  const pPalier = 1 - pAucunPalier

  // --- Proba de CETTE carte précise ---
  const pBase = pBaseP * pCarteDansPalier
  const pRare = pRareP * pCarteDansPalier
  const pBril = pBrilP * pCarteDansPalier
  const pAucun = Math.pow(1 - pBase, 6) * Math.pow(1 - pRare, 2) * Math.pow(1 - pBril, 2)
  const pBooster = 1 - pAucun
  if (pBooster <= 0) return null

  return {
    surX: Math.round(1 / pBooster),
    pct: pBooster * 100,
    palierSurX: pPalier > 0 ? Math.round(1 / pPalier) : null,
    palierPct: pPalier * 100,
    nbDansPalier: N,
  }
}

// Formate "1 sur X" lisiblement (1 sur 1 240, etc.).
function formaterSurX(n) {
  return n.toLocaleString('fr-FR')
}

export default function AlbumSetsTCG({ collection = [] }) {
  const [setActif, setSetActif] = useState(IDS_SETS[0])
  const [recherche, setRecherche] = useState('')
  const [palierFiltre, setPalierFiltre] = useState('tous') // 'tous' | 1..6
  const [montrerManquantes, setMontrerManquantes] = useState(true)
  const [apercu, setApercu] = useState(null)

  const info = infoSet(setActif)
  const prog = progressionSet(collection, setActif)
  const possedes = idsPossedesDuSet(collection, setActif)
  const nbChroma = compterParPalierMin(collection, setActif, 6)
  const nbUltra = compterParPalierMin(collection, setActif, 4)

  // Cartes du set, enrichies "possedee".
  let cartes = cartesDuSet(setActif).map((c) => ({ ...c, possedee: possedes.has(c.id) }))
  if (palierFiltre !== 'tous') cartes = cartes.filter((c) => c.palier === Number(palierFiltre))
  if (recherche.trim()) {
    const q = recherche.trim().toLowerCase()
    cartes = cartes.filter((c) => c.nom.toLowerCase().includes(q))
  }
  if (!montrerManquantes) cartes = cartes.filter((c) => c.possedee)
  // Tri : palier decroissant puis nom (les plus belles en premier).
  cartes.sort((a, b) => (b.palier - a.palier) || a.nom.localeCompare(b.nom))

  // Vitrine : les plus belles cartes POSSEDEES du set (palier >= 4), max 3.
  const beauxDrops = cartesDuSet(setActif)
    .filter((c) => possedes.has(c.id) && c.palier >= 4)
    .sort((a, b) => (b.palier - a.palier) || a.nom.localeCompare(b.nom))
    .slice(0, 4)

  return (
    <div style={S.wrap}>
      {/* Selecteur de set (vignettes avec mini-barre de progression) */}
      <div style={S.setBarre}>
        {IDS_SETS.map((sid) => {
          const i = infoSet(sid)
          const p = progressionSet(collection, sid)
          const actif = sid === setActif
          return (
            <button key={sid} onClick={() => setSetActif(sid)}
              style={{ ...S.setPuce, ...(actif ? S.setPuceActif : {}) }}>
              {i && i.logo
                ? <img src={i.logo} alt={i.nom} style={S.setPuceLogo}
                    onError={(e) => { e.currentTarget.style.display = 'none' }} />
                : <span style={S.setPuceNom}>{i ? i.nom : sid}</span>}
              <span style={S.setPucePct}>{p.possedees}/{p.total}</span>
              <span style={S.setPuceBarreFond}>
                <span style={{ ...S.setPuceBarreFill, width: `${p.pct}%`, background: actif ? '#fcd34d' : '#7a5fd0' }} />
              </span>
            </button>
          )
        })}
      </div>

      {/* Bandeau du set actif */}
      <div style={S.bandeau}>
        <div style={S.bandeauHaut}>
          <span style={S.bandeauTitre}>{info ? info.nom : setActif}</span>
          <span style={S.bandeauCompteur}>
            {prog.possedees} / {prog.total} <span style={{ color: '#fcd34d' }}>({prog.pct}%)</span>
          </span>
        </div>
        <div style={S.barreFond}>
          <div style={{ ...S.barreFill, width: `${prog.pct}%` }} />
        </div>
        <div style={S.bandeauFx}>
          <span style={{ ...S.fxBadge, ...S.fxUltra }} title="Cartes Ultra Rare et +">{nbUltra} Ultra</span>
          <span style={{ ...S.fxBadge, ...S.fxChroma }} title="Cartes Chromatiques">{nbChroma} Chroma</span>
          {prog.pct === 100 && <span style={S.complet}>★ Set complété ! ★</span>}
        </div>
      </div>

      {/* Vitrine : tes plus belles cartes de ce set */}
      {beauxDrops.length > 0 && (
        <>
          <div style={S.sectionTitre}>
            <span style={S.sectionTitreTxt}>★ Tes plus belles cartes</span>
            <span style={S.sectionTrait} />
          </div>
          <div style={S.vitrine}>
            {beauxDrops.map((c) => {
              const palier = PALIERS[c.palier] || PALIERS[3]
              const chroma = c.palier >= 6
              return (
                <div key={`v-${c.id}`} style={{
                  ...S.vitrineCarte,
                  border: `2.5px solid ${palier.couleur}`,
                  boxShadow: `0 0 24px ${rgba(palier.couleur, 0.7)}`,
                }} onClick={() => setApercu(c)}>
                  <img src={(c.img || '').replace(/\.png$/, '_hires.png')} alt={c.nom} loading="lazy" style={S.vitrineImg}
                    data-hires="1"
                    onError={(e) => {
                      if (e.currentTarget.dataset.hires === '1') { e.currentTarget.dataset.hires = '0'; e.currentTarget.src = c.img }
                      else { e.currentTarget.style.visibility = 'hidden' }
                    }} />
                  {chroma && <div style={S.holo} />}
                  <span style={{ ...S.vitrinePalier, color: palier.couleur }}>{palier.nom}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Filtres */}
      <div style={S.filtres}>
        <input style={S.recherche} placeholder="Rechercher une carte..." value={recherche}
          onChange={(e) => setRecherche(e.target.value)} />
        <div style={S.pilules}>
          <button onClick={() => setPalierFiltre('tous')}
            style={{ ...S.pilule, ...(palierFiltre === 'tous' ? { borderColor: '#fcd34d', color: '#fcd34d', background: rgba('#fcd34d', 0.16) } : {}) }}>
            Toutes
          </button>
          {[6, 5, 4, 3, 2, 1].map((p) => {
            const actif = String(palierFiltre) === String(p)
            const col = PALIERS[p].couleur
            return (
              <button key={p} onClick={() => setPalierFiltre(actif ? 'tous' : p)}
                title={PALIERS[p].nom}
                style={{ ...S.pilule, borderColor: col, color: col, ...(actif ? { background: rgba(col, 0.18) } : {}) }}>
                {PALIERS[p].nom}
              </button>
            )
          })}
        </div>
        <button style={{ ...S.toggle, ...(montrerManquantes ? S.toggleActif : {}) }}
          onClick={() => setMontrerManquantes((v) => !v)}>
          {montrerManquantes ? 'Masquer manquantes' : 'Voir manquantes'}
        </button>
      </div>

      {/* Grille */}
      <div style={S.grille}>
        {cartes.map((c) => {
          const palier = PALIERS[c.palier] || PALIERS[3]
          if (!c.possedee) {
            return (
              <div key={c.id} style={S.slotVide} title="Carte non obtenue">
                <span style={S.slotVidePt}>?</span>
              </div>
            )
          }
          const brillante = c.palier >= 4
          const chroma = c.palier >= 6
          return (
            <div key={c.id} style={{
              ...S.slot,
              border: `2px solid ${palier.couleur}`,
              boxShadow: brillante ? `0 0 12px ${rgba(palier.couleur, 0.6)}` : `0 0 5px ${rgba(palier.couleur, 0.25)}`,
            }} onClick={() => setApercu(c)}>
              <img src={c.img} alt={c.nom} loading="lazy" style={S.slotImg}
                onError={(e) => { e.target.style.visibility = 'hidden' }} />
              {chroma && <div style={S.holo} />}
              <span style={{ ...S.slotPalier, background: palier.couleur }} />
            </div>
          )
        })}
      </div>
      {cartes.length === 0 && (
        <p style={S.vide}>Aucune carte ici. Ouvre des boosters de ce set !</p>
      )}

      {/* Apercu grande carte */}
      {apercu && (() => {
        const palier = PALIERS[apercu.palier] || PALIERS[3]
        const taux = tauxDropCarte(apercu, cartesDuSet(setActif))
        const chroma = apercu.palier >= 6
        return (
          <div style={S.apercuOverlay} onClick={() => setApercu(null)}>
            <div style={{ ...S.apercuBoite, boxShadow: `0 0 60px ${rgba(palier.couleur, 0.55)}, 0 20px 60px rgba(0,0,0,0.7)` }} onClick={(e) => e.stopPropagation()}>
              <button style={S.apercuFermer} onClick={() => setApercu(null)}>✕</button>

              {/* Halo derriere la carte */}
              <div style={{ ...S.apercuHalo, background: `radial-gradient(circle, ${rgba(palier.couleur, 0.45)} 0%, transparent 70%)` }} />

              <div style={{
                ...S.apercuCarte,
                boxShadow: `0 0 40px ${rgba(palier.couleur, 0.85)}`,
                border: `3px solid ${palier.couleur}`,
              }}>
                <img
                  src={(apercu.img || '').replace(/\.png$/, '_hires.png')}
                  alt={apercu.nom}
                  style={S.apercuImg}
                  data-hires="1"
                  onError={(e) => {
                    // Si la haute résolution échoue, on revient à l'image normale.
                    if (e.currentTarget.dataset.hires === '1') {
                      e.currentTarget.dataset.hires = '0'
                      e.currentTarget.src = apercu.img
                    } else {
                      e.currentTarget.style.visibility = 'hidden'
                    }
                  }}
                />
                {chroma && <div style={S.holo} />}
              </div>

              <div style={S.apercuInfos}>
                <p style={S.apercuNom}>{apercu.nom}</p>
                <span style={{ ...S.apercuPalierBadge, color: palier.couleur, borderColor: palier.couleur, background: rgba(palier.couleur, 0.12) }}>
                  {palier.nom}
                </span>
              </div>

              {/* Stats de drop */}
              <div style={S.apercuStats}>
                {taux && taux.palierSurX && (
                  <div style={S.statLigne}>
                    <span style={S.statLabel}>Sortir un <b style={{ color: palier.couleur }}>{palier.nom}</b></span>
                    <span style={{ ...S.statVal, color: palier.couleur }}>1 sur {formaterSurX(taux.palierSurX)}</span>
                  </div>
                )}
                {taux && (
                  <div style={S.statLigne}>
                    <span style={S.statLabel}>…dont la proba / booster</span>
                    <span style={S.statVal}>{taux.palierPct < 0.1 ? taux.palierPct.toFixed(3) : taux.palierPct.toFixed(1)}%</span>
                  </div>
                )}
                <div style={{ ...S.statLigne, borderTop: '1px solid rgba(255,255,255,0.12)', marginTop: 2, paddingTop: 8 }}>
                  <span style={S.statLabel}>Tomber sur <b>cette carte</b></span>
                  {taux && <span style={{ ...S.statVal, color: '#fcd34d' }}>1 sur {formaterSurX(taux.surX)}</span>}
                </div>
                {taux && (
                  <div style={S.statLigne}>
                    <span style={S.statLabel}>{taux.nbDansPalier} cartes « {palier.nom} » dans ce set</span>
                    <span style={S.statValPetit}>{info ? info.nom : setActif}</span>
                  </div>
                )}
                {apercu.rarete && (
                  <div style={{ ...S.statLigne, borderBottom: 'none' }}>
                    <span style={S.statLabel}>Rareté officielle</span>
                    <span style={S.statValPetit}>{apercu.rarete}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

const S = {
  wrap: {
    color: '#e8ecf6', fontFamily: "'Rubik',system-ui,-apple-system,sans-serif",
    maxHeight: '74vh', overflowY: 'auto', overflowX: 'hidden',
    padding: '4px 12px 8px', WebkitOverflowScrolling: 'touch',
  },
  setBarre: {
    display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 14,
  },
  setPuce: {
    flexShrink: 0, minWidth: 96, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4, padding: '9px 10px', borderRadius: 12,
    border: '1px solid rgba(180,140,255,0.3)', background: 'rgba(40,30,60,0.4)',
    color: '#cfcfe0', cursor: 'pointer',
  },
  setPuceActif: {
    border: '2px solid #fcd34d',
    background: 'linear-gradient(180deg,rgba(120,90,40,0.4),rgba(50,38,15,0.55))',
    boxShadow: '0 0 16px rgba(252,211,77,0.35)',
  },
  setPuceLogo: { maxWidth: 64, maxHeight: 26, objectFit: 'contain' },
  setPuceNom: { fontSize: 11, fontWeight: 800, textAlign: 'center', lineHeight: 1.1, color: '#c9a0ff' },
  setPucePct: { fontSize: 10, fontWeight: 700, color: '#aeb9cf' },
  setPuceBarreFond: { width: '100%', height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden' },
  setPuceBarreFill: { display: 'block', height: '100%', borderRadius: 3 },
  bandeau: {
    background: 'rgba(252,211,77,0.06)', border: '1px solid rgba(252,211,77,0.4)',
    borderRadius: 14, padding: 14, marginBottom: 14,
  },
  bandeauHaut: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  bandeauTitre: { fontSize: 18, fontWeight: 900, color: '#fff' },
  bandeauCompteur: { fontSize: 14, fontWeight: 900, color: '#fcd34d' },
  barreFond: { height: 9, background: 'rgba(0,0,0,0.4)', borderRadius: 5, overflow: 'hidden' },
  barreFill: { height: '100%', background: 'linear-gradient(90deg,#9f7fee,#fcd34d)', borderRadius: 5, boxShadow: '0 0 12px rgba(252,211,77,0.6)' },
  bandeauFx: { display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', fontSize: 12, flexWrap: 'wrap' },
  fxBadge: { borderRadius: 7, padding: '3px 10px', fontWeight: 800, fontSize: 10 },
  fxUltra: { background: 'rgba(168,85,247,0.15)', border: '1px solid #a855f7', color: '#c084fc' },
  fxChroma: { background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b', color: '#fcd34d' },
  complet: { color: '#f5c542', fontWeight: 900, fontSize: 12 },
  sectionTitre: { display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px' },
  sectionTitreTxt: { fontSize: 12, fontWeight: 800, color: '#fcd34d', letterSpacing: 0.5 },
  sectionTrait: { flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(252,211,77,0.5),transparent)' },
  vitrine: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20, padding: '0 2px' },
  vitrineCarte: {
    aspectRatio: '63/88', borderRadius: 14, overflow: 'hidden', position: 'relative',
    cursor: 'pointer', background: '#0c0d16',
  },
  vitrineImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  vitrinePalier: {
    position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center',
    fontSize: 9, fontWeight: 800, textShadow: '0 1px 3px #000',
  },
  filtres: { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' },
  recherche: {
    flex: 1, minWidth: 140, padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#e8ecf6', fontSize: 13,
    fontFamily: 'inherit',
  },
  pilules: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  pilule: {
    fontSize: 10, fontWeight: 700, padding: '5px 11px', borderRadius: 18,
    border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#aeb9cf', cursor: 'pointer',
  },
  toggle: {
    padding: '7px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)', color: '#cfcfe0', fontSize: 12, cursor: 'pointer', fontWeight: 700,
  },
  toggleActif: { border: '1px solid #fcd34d', background: 'rgba(252,211,77,0.12)', color: '#fcd34d' },
  grille: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(118px,1fr))', gap: 16,
    padding: '4px 2px',
  },
  slot: {
    aspectRatio: '63/88', borderRadius: 10, overflow: 'hidden', position: 'relative',
    cursor: 'pointer', background: '#0c0d16',
  },
  slotImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  slotPalier: {
    position: 'absolute', top: 4, right: 4, width: 10, height: 10, borderRadius: '50%',
    border: '1.5px solid rgba(0,0,0,0.4)',
  },
  slotVide: {
    aspectRatio: '63/88', borderRadius: 10, border: '1.5px dashed rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  slotVidePt: { fontSize: 22, color: '#566', fontWeight: 900 },
  vide: { textAlign: 'center', opacity: 0.6, padding: 24, fontSize: 13 },
  holo: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'linear-gradient(120deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)',
  },
  apercuOverlay: {
    position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(8,10,18,0.9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  apercuBoite: {
    background: 'linear-gradient(180deg,#1a1430,#0a0612)', border: '1px solid rgba(180,140,255,0.3)',
    borderRadius: 18, padding: '22px 22px 18px', maxWidth: 380, width: '100%', position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden',
  },
  apercuHalo: {
    position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
    width: 360, height: 360, pointerEvents: 'none', zIndex: 0,
  },
  apercuFermer: {
    position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 9,
    border: 'none', background: 'rgba(255,255,255,0.1)', color: '#cfcfe0', fontSize: 16, cursor: 'pointer', zIndex: 3,
  },
  apercuCarte: { width: 280, borderRadius: 14, overflow: 'hidden', marginBottom: 16, position: 'relative', zIndex: 1 },
  apercuImg: { width: '100%', display: 'block' },
  apercuInfos: { textAlign: 'center', position: 'relative', zIndex: 1, marginBottom: 14 },
  apercuNom: { fontSize: 22, fontWeight: 900, margin: '0 0 8px', color: '#fff' },
  apercuPalierBadge: {
    fontSize: 12, fontWeight: 800, padding: '4px 14px', borderRadius: 20,
    border: '1.5px solid', display: 'inline-block',
  },
  apercuStats: {
    width: '100%', position: 'relative', zIndex: 1,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '8px 14px',
  },
  statLigne: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 13,
  },
  statLabel: { color: '#9aa6bd' },
  statVal: { fontWeight: 800, color: '#e8ecf6', fontVariantNumeric: 'tabular-nums' },
  statValPetit: { fontWeight: 600, color: '#aeb9cf', fontSize: 11, textAlign: 'right', maxWidth: 160 },
}