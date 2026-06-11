import { infoSet } from './boosters'

// ============================================================
// EncartBoosterDrop : petit encart "booster obtenu !" en fin de
// combat de Tour. Deux cas :
//   - drop normal : { godPack: false, idSet }
//   - god pack    : { godPack: true, nb }
// Disparait tout seul (le parent remet boosterDrop a null apres 4s).
// Props :
//   - drop      : l'objet boosterDrop (ou null)
//   - onOuvrir  : () => void  (optionnel : ouvre l'ecran des boosters)
// ============================================================

export default function EncartBoosterDrop({ drop, onOuvrir }) {
  if (!drop) return null

  // --- GOD PACK ---
  if (drop.godPack) {
    return (
      <div style={{ ...S.encart, ...S.encartGod }}>
        <div style={S.iconeGod}>🌈</div>
        <div style={S.texte}>
          <span style={S.titreGod}>GOD PACK !!</span>
          <span style={S.nom}>{drop.nb || 10} boosters d'un coup !</span>
          {onOuvrir && (
            <button style={S.boutonOuvrir} onClick={onOuvrir}>Ouvrir mes boosters</button>
          )}
        </div>
      </div>
    )
  }

  // --- DROP NORMAL ---
  const set = infoSet(drop.idSet)
  return (
    <div style={S.encart}>
      <div style={S.logoZone}>
        {set && set.logo
          ? <img src={set.logo} alt={set.nom} style={S.logo} />
          : <span style={{ fontSize: 26 }}>📦</span>}
      </div>
      <div style={S.texte}>
        <span style={S.titre}>Booster obtenu !</span>
        <span style={S.nom}>{set ? set.nom : 'Nouveau set'}</span>
        {onOuvrir && (
          <button style={S.boutonOuvrir} onClick={onOuvrir}>Ouvrir</button>
        )}
      </div>
    </div>
  )
}

const S = {
  encart: {
    position: 'fixed', bottom: 90, left: '50%', transform: 'translateX(-50%)',
    zIndex: 8500, display: 'flex', alignItems: 'center', gap: 12,
    background: 'linear-gradient(180deg,#23253a,#181a2a)',
    border: '1px solid #4453e6', borderRadius: 12, padding: '12px 16px',
    boxShadow: '0 8px 30px rgba(68,83,230,0.35)', color: '#e8e8f0',
    fontFamily: 'system-ui,-apple-system,sans-serif', maxWidth: 340,
    animation: 'none',
  },
  encartGod: {
    border: '2px solid #f59e0b',
    background: 'linear-gradient(180deg,#3a2e1a,#241a0d)',
    boxShadow: '0 8px 34px rgba(245,158,11,0.5)',
  },
  logoZone: {
    width: 56, height: 56, flexShrink: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  logo: { maxWidth: 56, maxHeight: 56, objectFit: 'contain' },
  iconeGod: { fontSize: 38, flexShrink: 0 },
  texte: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  titre: { fontSize: 13, fontWeight: 700, color: '#9aa6ff' },
  titreGod: { fontSize: 15, fontWeight: 800, color: '#f5c542', letterSpacing: 0.4 },
  nom: { fontSize: 15, fontWeight: 800, lineHeight: 1.2 },
  boutonOuvrir: {
    marginTop: 6, alignSelf: 'flex-start', border: 'none', borderRadius: 8,
    cursor: 'pointer', background: 'linear-gradient(180deg,#5b6cff,#4453e6)',
    color: '#fff', padding: '5px 12px', fontSize: 12, fontWeight: 700,
  },
}