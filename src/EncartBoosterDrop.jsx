import { infoSet } from './boosters'

// ============================================================
// EncartBoosterDrop : petit encart "booster obtenu !" en fin de
// combat de Tour — REFONTE PREMIUM (cohérent avec EcranBoosters).
// Deux cas :
//   - drop normal : { godPack: false, idSet }
//   - god pack    : { godPack: true, nb }
// Disparait tout seul (le parent remet boosterDrop a null apres 4s).
// Props :
//   - drop      : l'objet boosterDrop (ou null)
//   - onOuvrir  : () => void  (optionnel : ouvre l'ecran des boosters)
// ============================================================

export default function EncartBoosterDrop({ drop, onOuvrir }) {
  if (!drop) return null

  // --- GOD PACK (rare, spectaculaire) ---
  if (drop.godPack) {
    return (
      <div style={{ ...S.encart, ...S.encartGod }}>
        <div style={S.godHalo} />
        <div style={S.godIcone}><div style={S.pokeball} /></div>
        <div style={S.texte}>
          <span style={S.titreGod}>★ GOD PACK ★</span>
          <span style={S.nom}>{drop.nb || 10} boosters d'un coup !</span>
          {onOuvrir && (
            <button style={{ ...S.boutonOuvrir, ...S.boutonOr }} onClick={onOuvrir}>Ouvrir mes boosters</button>
          )}
        </div>
      </div>
    )
  }

  // --- DROP NORMAL ---
  const set = infoSet(drop.idSet)
  return (
    <div style={S.encart}>
      <div style={S.aura} />
      <div style={S.logoZone}>
        {set && set.logo
          ? <img src={set.logo} alt={set.nom} style={S.logo} onError={(e) => { e.currentTarget.style.display = 'none' }} />
          : <div style={S.pokeballPetite} />}
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
    zIndex: 8500, display: 'flex', alignItems: 'center', gap: 14, overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(70,50,110,0.92), rgba(28,20,50,0.95))',
    border: '2px solid rgba(180,140,255,0.6)', borderRadius: 14, padding: '12px 18px',
    boxShadow: '0 8px 30px rgba(159,127,238,0.4)', color: '#e8ecf6',
    fontFamily: "'Rubik',system-ui,-apple-system,sans-serif", maxWidth: 360,
  },
  encartGod: {
    border: '2px solid #f59e0b',
    background: 'linear-gradient(180deg, rgba(90,65,20,0.95), rgba(40,28,8,0.96))',
    boxShadow: '0 8px 40px rgba(245,158,11,0.6)',
  },
  aura: {
    position: 'absolute', top: -20, left: 10, width: 90, height: 90, pointerEvents: 'none',
    background: 'radial-gradient(circle, rgba(252,211,77,0.2) 0%, transparent 70%)',
  },
  godHalo: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(circle at 22% 50%, rgba(245,158,11,0.28) 0%, transparent 60%)',
  },
  logoZone: {
    width: 56, height: 56, flexShrink: 0, display: 'flex',
    alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1,
  },
  logo: { maxWidth: 56, maxHeight: 56, objectFit: 'contain', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' },
  godIcone: { flexShrink: 0, position: 'relative', zIndex: 1 },
  pokeball: {
    width: 44, height: 44, borderRadius: '50%',
    background: 'linear-gradient(180deg, #c0392b 0%, #c0392b 46%, #1a1a1a 46%, #1a1a1a 54%, #f7f7f7 54%)',
    border: '4px solid #1a1a1a', boxShadow: '0 0 18px rgba(245,158,11,0.7)',
  },
  pokeballPetite: {
    width: 40, height: 40, borderRadius: '50%',
    background: 'linear-gradient(180deg, #c0392b 0%, #c0392b 46%, #1a1a1a 46%, #1a1a1a 54%, #f7f7f7 54%)',
    border: '3px solid #1a1a1a',
  },
  texte: { display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, position: 'relative', zIndex: 1 },
  titre: { fontSize: 12, fontWeight: 800, color: '#c9a0ff', letterSpacing: 0.5 },
  titreGod: { fontSize: 15, fontWeight: 900, color: '#fcd34d', letterSpacing: 1, textShadow: '0 0 12px rgba(252,211,77,0.6)' },
  nom: { fontSize: 15, fontWeight: 900, lineHeight: 1.2, color: '#fff' },
  boutonOuvrir: {
    marginTop: 7, alignSelf: 'flex-start', border: 'none', borderRadius: 9,
    cursor: 'pointer', background: 'linear-gradient(180deg,#9f7fee,#7a5fd0)',
    color: '#fff', padding: '6px 14px', fontSize: 12, fontWeight: 800, boxShadow: '0 3px 0 #5a3fb0',
  },
  boutonOr: {
    background: 'linear-gradient(180deg,#fcd34d,#e0a82e)', color: '#3a2800', boxShadow: '0 3px 0 #a87b1e',
  },
}