import { useState } from 'react'
import { IDS_SETS } from './setsCartes'
import {
  infoSet, cartesDuSet, idsPossedesDuSet, progressionSet,
  compterParPalierMin, PALIERS,
} from './boosters'

// ============================================================
// AlbumSetsTCG : album des 15 nouveaux sets (boosters).
// Un set a la fois. Styles inline (aucun conflit App.css).
// Props :
//   - collection : collectionCartesTCG (tableau d'objets carte)
// ============================================================

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
  // Tri : palier decroissant puis nom.
  cartes.sort((a, b) => (b.palier - a.palier) || a.nom.localeCompare(b.nom))

  return (
    <div style={S.wrap}>
      {/* Selecteur de set */}
      <div style={S.setBarre}>
        {IDS_SETS.map((sid) => {
          const i = infoSet(sid)
          const p = progressionSet(collection, sid)
          const actif = sid === setActif
          return (
            <button key={sid} onClick={() => setSetActif(sid)}
              style={{ ...S.setPuce, ...(actif ? S.setPuceActif : {}) }}>
              {i && i.logo && <img src={i.logo} alt={i.nom} style={S.setPuceLogo} />}
              <span style={S.setPuceNom}>{i ? i.nom : sid}</span>
              <span style={S.setPucePct}>{p.possedees}/{p.total}</span>
            </button>
          )
        })}
      </div>

      {/* Bandeau du set actif */}
      <div style={S.bandeau}>
        <div style={S.bandeauHaut}>
          <span style={S.bandeauTitre}>{info ? info.nom : setActif}</span>
          <span style={S.bandeauCompteur}>
            {prog.possedees} / {prog.total} <span style={{ opacity: 0.6 }}>({prog.pct}%)</span>
          </span>
        </div>
        <div style={S.barreFond}>
          <div style={{ ...S.barreFill, width: `${prog.pct}%` }} />
        </div>
        <div style={S.bandeauFx}>
          <span style={S.fxBadge} title="Cartes Ultra Rare et +">🟣 {nbUltra}</span>
          <span style={S.fxBadge} title="Cartes Chromatiques">🌈 {nbChroma}</span>
          {prog.pct === 100 && <span style={S.complet}>★ Set complété ! ★</span>}
        </div>
      </div>

      {/* Filtres */}
      <div style={S.filtres}>
        <input style={S.recherche} placeholder="🔍 Rechercher..." value={recherche}
          onChange={(e) => setRecherche(e.target.value)} />
        <select style={S.select} value={palierFiltre} onChange={(e) => setPalierFiltre(e.target.value)}>
          <option value="tous">Tous paliers</option>
          {[1, 2, 3, 4, 5, 6].map((p) => (
            <option key={p} value={p}>{PALIERS[p].emoji} {PALIERS[p].nom}</option>
          ))}
        </select>
        <button style={{ ...S.toggle, ...(montrerManquantes ? S.toggleActif : {}) }}
          onClick={() => setMontrerManquantes((v) => !v)}>
          {montrerManquantes ? '👁️ Manquantes' : '🚫 Manquantes'}
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
          return (
            <div key={c.id} style={{
              ...S.slot,
              border: `2px solid ${palier.couleur}`,
              boxShadow: brillante ? `0 0 9px ${palier.couleur}` : 'none',
            }} onClick={() => setApercu(c)}>
              <img src={c.img} alt={c.nom} loading="lazy" style={S.slotImg}
                onError={(e) => { e.target.style.visibility = 'hidden' }} />
              <span style={{ ...S.slotPalier, background: palier.couleur }}>{palier.emoji}</span>
            </div>
          )
        })}
      </div>
      {cartes.length === 0 && (
        <p style={S.vide}>Aucune carte ici. Ouvre des boosters de ce set !</p>
      )}

      {/* Apercu grande carte */}
      {apercu && (
        <div style={S.apercuOverlay} onClick={() => setApercu(null)}>
          <div style={S.apercuBoite} onClick={(e) => e.stopPropagation()}>
            <button style={S.apercuFermer} onClick={() => setApercu(null)}>✕</button>
            <div style={{
              ...S.apercuCarte,
              boxShadow: `0 0 26px ${(PALIERS[apercu.palier] || PALIERS[3]).couleur}`,
              border: `3px solid ${(PALIERS[apercu.palier] || PALIERS[3]).couleur}`,
            }}>
              <img src={apercu.img} alt={apercu.nom} style={S.apercuImg} />
            </div>
            <div style={S.apercuInfos}>
              <p style={S.apercuNom}>{apercu.nom}</p>
              <p style={{ ...S.apercuPalier, color: (PALIERS[apercu.palier] || PALIERS[3]).couleur }}>
                {(PALIERS[apercu.palier] || PALIERS[3]).emoji} {(PALIERS[apercu.palier] || PALIERS[3]).nom}
              </p>
              <p style={S.apercuRarete}>{apercu.rarete}</p>
              <p style={S.apercuSet}>{info ? info.nom : setActif}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  wrap: {
    color: '#e8e8f0', fontFamily: 'system-ui,-apple-system,sans-serif',
    maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden',
    paddingRight: 4, WebkitOverflowScrolling: 'touch',
  },
  setBarre: {
    display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 12,
  },
  setPuce: {
    flexShrink: 0, minWidth: 96, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 3, padding: '8px 10px', borderRadius: 10,
    border: '1px solid #2c2e44', background: '#1a1c2a', color: '#cfcfe0',
    cursor: 'pointer',
  },
  setPuceActif: { border: '2px solid #5b6cff', background: '#23253a' },
  setPuceLogo: { maxWidth: 60, maxHeight: 28, objectFit: 'contain' },
  setPuceNom: { fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.1 },
  setPucePct: { fontSize: 10, opacity: 0.6 },
  bandeau: {
    background: 'linear-gradient(180deg,#23253a,#181a2a)', border: '1px solid #2c2e44',
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  bandeauHaut: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  bandeauTitre: { fontSize: 17, fontWeight: 800 },
  bandeauCompteur: { fontSize: 14, fontWeight: 700 },
  barreFond: { height: 8, background: '#0e0f1a', borderRadius: 5, overflow: 'hidden' },
  barreFill: { height: '100%', background: 'linear-gradient(90deg,#5b6cff,#a855f7)', borderRadius: 5 },
  bandeauFx: { display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', fontSize: 12 },
  fxBadge: { background: '#0e0f1a', borderRadius: 6, padding: '3px 8px', fontWeight: 700 },
  complet: { color: '#f5c542', fontWeight: 800, fontSize: 12 },
  filtres: { display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  recherche: {
    flex: 1, minWidth: 140, padding: '8px 12px', borderRadius: 8,
    border: '1px solid #2c2e44', background: '#13141f', color: '#e8e8f0', fontSize: 13,
  },
  select: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid #2c2e44',
    background: '#13141f', color: '#e8e8f0', fontSize: 13, cursor: 'pointer',
  },
  toggle: {
    padding: '8px 12px', borderRadius: 8, border: '1px solid #2c2e44',
    background: '#13141f', color: '#cfcfe0', fontSize: 13, cursor: 'pointer', fontWeight: 600,
  },
  toggleActif: { border: '1px solid #5b6cff', background: '#23253a' },
  grille: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(78px,1fr))', gap: 8,
  },
  slot: {
    aspectRatio: '63/88', borderRadius: 8, overflow: 'hidden', position: 'relative',
    cursor: 'pointer', background: '#0c0d16',
  },
  slotImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  slotPalier: {
    position: 'absolute', bottom: 0, right: 0, fontSize: 9, padding: '1px 4px',
    borderTopLeftRadius: 6,
  },
  slotVide: {
    aspectRatio: '63/88', borderRadius: 8, border: '1px dashed #2c2e44',
    background: '#11121c', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  slotVidePt: { fontSize: 22, color: '#2c2e44', fontWeight: 800 },
  vide: { textAlign: 'center', opacity: 0.6, padding: 24, fontSize: 13 },
  apercuOverlay: {
    position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(8,10,18,0.88)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
  },
  apercuBoite: {
    background: 'linear-gradient(180deg,#1a1c2a,#13141f)', border: '1px solid #2c2e44',
    borderRadius: 16, padding: 18, maxWidth: 340, width: '100%', position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
  },
  apercuFermer: {
    position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 8,
    border: 'none', background: '#2a2c40', color: '#cfcfe0', fontSize: 15, cursor: 'pointer',
  },
  apercuCarte: { width: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 14 },
  apercuImg: { width: '100%', display: 'block' },
  apercuInfos: { textAlign: 'center' },
  apercuNom: { fontSize: 18, fontWeight: 800, margin: '0 0 4px' },
  apercuPalier: { fontSize: 14, fontWeight: 700, margin: '0 0 2px' },
  apercuRarete: { fontSize: 12, opacity: 0.7, margin: '0 0 2px' },
  apercuSet: { fontSize: 12, opacity: 0.5, margin: 0 },
}