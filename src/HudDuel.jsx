// ============================================================
// HUD DE DUEL — v4 : LA BARRE DE DUEL.
// Une longue barre fine stylisee qui traverse le milieu de
// l'arene : tes PV (bleu) remplissent depuis la gauche, les PV
// ennemis (rouge) depuis la droite, epees croisees au centre.
// Pseudo + total a gauche, nom de zone + total a droite.
// + le TICKER (2 derniers evenements) en bas a droite.
// 100% styles inline, pointer-events none — zero App.css.
// ============================================================

function somme(liste) {
  let total = 0
  for (const v of (liste || [])) { if (Number.isFinite(v)) total += Math.max(0, v) }
  return total
}

function sommeMax(equipe) {
  let total = 0
  for (const p of (equipe || [])) { if (p && Number.isFinite(p.pvMax)) total += p.pvMax }
  return total
}

const COULEUR_TICKER = {
  victoire: '#7ee3a8',
  echec: '#fca5a5',
  capture: '#fcd34d',
  fuite: '#fcd34d',
  info: '#9ca8bd',
}

function HudDuel({
  equipeJoueur = [], equipeEnnemie = [],
  pvJoueur = [], pvEnnemis = [],
  journal = [],
  pseudo = 'Toi',
  nomZone = '',
  estBoss = false,
}) {
  const pvJ = somme(pvJoueur)
  const maxJ = sommeMax(equipeJoueur)
  const pvE = somme(pvEnnemis)
  const maxE = sommeMax(equipeEnnemie)
  const pctJ = maxJ > 0 ? Math.max(0, Math.min(100, (pvJ / maxJ) * 100)) : 0
  const pctE = maxE > 0 ? Math.max(0, Math.min(100, (pvE / maxE) * 100)) : 0

  const dernieres = (journal || []).slice(-2)
  const accentE = estBoss ? '#f43f5e' : '#f87171'

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, fontFamily: "'Rubik', system-ui, sans-serif" }}>

      {/* ===== LA BARRE DE DUEL : fine, sur toute la largeur, au milieu ===== */}
      <div style={{ position: 'absolute', top: '46%', left: 24, right: 24 }}>
        {/* Etiquettes au-dessus */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: '#7cb8ff', textTransform: 'uppercase', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
            {pseudo} <span style={{ color: '#dfe8f7', fontWeight: 800 }}>{Math.round(pvJ).toLocaleString('fr-FR')}</span>
            <span style={{ color: '#7a87a0', fontWeight: 600, fontSize: 10 }}> / {Math.round(maxJ).toLocaleString('fr-FR')}</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1.5, color: accentE, textTransform: 'uppercase', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
            <span style={{ color: '#7a87a0', fontWeight: 600, fontSize: 10 }}>{Math.round(maxE).toLocaleString('fr-FR')} / </span>
            <span style={{ color: '#ffe2e2', fontWeight: 800 }}>{Math.round(pvE).toLocaleString('fr-FR')}</span> {estBoss ? '👑 BOSS — ' : ''}{nomZone}
          </span>
        </div>
        {/* La piste */}
        <div style={{
          position: 'relative', height: 12, borderRadius: 7,
          background: 'rgba(6,10,18,0.78)',
          border: '1px solid rgba(255,255,255,0.16)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5), inset 0 1px 2px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}>
          {/* Moitie gauche : TES PV (remplit depuis la gauche) */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%', padding: 2, boxSizing: 'border-box' }}>
            <div style={{
              height: '100%', width: pctJ + '%', borderRadius: 5,
              background: 'linear-gradient(to right, #1d4ed8, #60a5fa)',
              boxShadow: '0 0 8px rgba(96,165,250,0.55)',
              transition: 'width 0.45s ease',
            }}></div>
          </div>
          {/* Moitie droite : PV ENNEMIS (remplit depuis la droite) */}
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%', padding: 2, boxSizing: 'border-box', display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              height: '100%', width: pctE + '%', borderRadius: 5,
              background: estBoss
                ? 'linear-gradient(to left, #7a1024, #f43f5e)'
                : 'linear-gradient(to left, #b91c1c, #f87171)',
              boxShadow: estBoss ? '0 0 10px rgba(244,63,94,0.7)' : '0 0 8px rgba(248,113,113,0.5)',
              transition: 'width 0.45s ease',
            }}></div>
          </div>
          {/* Separateur central lumineux */}
          <div style={{
            position: 'absolute', left: '50%', top: -2, bottom: -2, width: 2,
            transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.55)',
            boxShadow: '0 0 8px rgba(255,255,255,0.5)',
          }}></div>
        </div>
        {/* Epees croisees au centre, posees sur la barre */}
        <div style={{
          position: 'absolute', left: '50%', top: 14, transform: 'translate(-50%, -50%)',
          fontSize: 17, textShadow: '0 0 8px rgba(0,0,0,0.9)',
        }}>⚔️</div>
      </div>

      {/* ===== Ticker : les 2 derniers evenements, en bas a droite ===== */}
      {dernieres.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 10, right: 12,
          maxWidth: '42%',
          background: 'rgba(8, 12, 20, 0.75)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10,
          padding: '6px 12px',
        }}>
          {dernieres.map((ligne, i) => (
            <div key={ligne.id || i} style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: COULEUR_TICKER[ligne.type] || '#9ca8bd',
              opacity: i === dernieres.length - 1 ? 1 : 0.55,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {ligne.texte}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HudDuel