import { useState } from 'react'

// ============================================================
// AIDE TAUX — petit bouton "?" qui ouvre une pop-up listant
// les taux de drop des boosters (en Tour) et les taux de rarete
// des cartes dans un booster.
//
// Les valeurs sont synchronisees avec :
//   - inventaireBoosters.js (dropBoosterTour) : 15% / multiples 5-10 / God Pack
//   - boosters.js (ouvrirBooster + TABLE_RARE_CLASSIQUE / TABLE_BRILLANT)
// Si tu changes ces valeurs dans le code, pense a les mettre a jour ici.
//
// Usage : <AideTaux /> (place-le ou tu veux dans la Tour).
// ============================================================

const PALIERS = [
  { nom: 'Commune', emoji: '⚪', couleur: '#9ca3af' },
  { nom: 'Peu commune', emoji: '🟢', couleur: '#22c55e' },
  { nom: 'Rare', emoji: '🔵', couleur: '#3b82f6' },
  { nom: 'Ultra Rare', emoji: '🟣', couleur: '#a855f7' },
  { nom: 'Illustration', emoji: '🌸', couleur: '#ec4899' },
  { nom: 'Chromatique', emoji: '🌈', couleur: '#f59e0b' },
]

// Lignes de proba des slots (depuis boosters.js).
const SLOT_RARE = [
  { p: 'Rare', pct: '80%', c: '#3b82f6' },
  { p: 'Ultra Rare', pct: '16%', c: '#a855f7' },
  { p: 'Illustration', pct: '3%', c: '#ec4899' },
  { p: 'Chromatique', pct: '1%', c: '#f59e0b' },
]
const SLOT_BRILLANT = [
  { p: 'Rare', pct: '45%', c: '#3b82f6' },
  { p: 'Ultra Rare', pct: '38%', c: '#a855f7' },
  { p: 'Illustration', pct: '12%', c: '#ec4899' },
  { p: 'Chromatique', pct: '5%', c: '#f59e0b' },
]

function Ligne({ gauche, droite, couleur }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontSize: 13.5 }}>
      <span style={{ color: '#d4dbe9' }}>{gauche}</span>
      <span style={{ fontWeight: 800, color: couleur || '#fcd34d', fontVariantNumeric: 'tabular-nums' }}>{droite}</span>
    </div>
  )
}

function Section({ titre, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#fcd34d', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{titre}</div>
      <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '6px 12px' }}>
        {children}
      </div>
    </div>
  )
}

function AideTaux({ taille = 26 }) {
  const [ouvert, setOuvert] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        title="Voir les taux de drop"
        style={{
          width: taille, height: taille, borderRadius: '50%', cursor: 'pointer',
          border: '2px solid rgba(252,211,77,0.6)', background: 'rgba(252,211,77,0.12)',
          color: '#fcd34d', fontWeight: 900, fontSize: taille * 0.55, lineHeight: 1,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
        }}
      >?</button>

      {ouvert && (
        <div
          onClick={() => setOuvert(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(4,6,14,0.82)', backdropFilter: 'blur(4px)', padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 460, maxHeight: '86vh', overflowY: 'auto',
              background: 'linear-gradient(180deg, #161c2e 0%, #10141f 100%)',
              border: '2px solid #fcd34d', borderRadius: 16,
              boxShadow: '0 0 40px rgba(252,211,77,0.22), 0 20px 60px rgba(0,0,0,0.6)',
              padding: '22px 22px 18px', color: '#e8ecf6',
              fontFamily: "'Rubik', system-ui, sans-serif", position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setOuvert(false)}
              title="Fermer"
              style={{
                position: 'absolute', top: 12, right: 12, width: 28, height: 28, borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
                color: '#cfd8e3', fontWeight: 800, cursor: 'pointer', fontSize: 15,
              }}
            >✕</button>

            <h2 style={{ margin: '0 0 16px', fontSize: 20, color: '#fff3c4', textAlign: 'center' }}>
              🎴 Taux de drop
            </h2>

            <Section titre="Boosters en Tour Infinie">
              <Ligne gauche="Niveau normal" droite="15%" />
              <Ligne gauche="Niveau multiple de 5" droite="1 garanti" couleur="#34d399" />
              <Ligne gauche="Niveau multiple de 10" droite="1 garanti" couleur="#34d399" />
              <Ligne gauche="God Pack (sur multiple de 10)" droite="0,01% → 10 boosters" couleur="#f59e0b" />
            </Section>

            <Section titre="Contenu d'un booster (10 cartes)">
              <Ligne gauche="⚪ Commune" droite="~70% des 6 cartes de base" couleur="#9ca3af" />
              <Ligne gauche="🟢 Peu commune" droite="~30% des 6 cartes de base" couleur="#22c55e" />
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '6px 0' }} />
              <div style={{ fontSize: 12, color: '#9aa6bd', marginBottom: 2 }}>+ 2 slots « rare » :</div>
              {SLOT_RARE.map((s, i) => <Ligne key={i} gauche={s.p} droite={s.pct} couleur={s.c} />)}
              <div style={{ fontSize: 12, color: '#9aa6bd', margin: '6px 0 2px' }}>+ 2 slots « brillant » :</div>
              {SLOT_BRILLANT.map((s, i) => <Ligne key={i} gauche={s.p} droite={s.pct} couleur={s.c} />)}
            </Section>

            <Section titre="Les 6 raretés">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {PALIERS.map((p, i) => (
                  <span key={i} style={{
                    fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 8,
                    border: `1px solid ${p.couleur}`, color: p.couleur, background: 'rgba(255,255,255,0.03)',
                  }}>{p.emoji} {p.nom}</span>
                ))}
              </div>
            </Section>

            <div style={{ fontSize: 11.5, color: '#7a86a0', textAlign: 'center', marginTop: 4 }}>
              Les cartes d'un slot sont tirées au hasard parmi les cartes de cette rareté dans le set.
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AideTaux