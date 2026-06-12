// ============================================================
// HUD DE DUEL — v5 : BARRE DE DUEL + HUD DE ZONE FONDU.
// - Une longue barre fine au milieu : tes PV (bleu) à gauche,
//   PV ennemis (rouge) à droite, épées au centre.
// - HUD DE ZONE en haut-centre : nom + compteur + barre de
//   progression + flèches Préc/Suiv (fondu dans l'arène).
// 100% styles inline — zéro App.css.
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
  onZonePrec = null, onZoneSuiv = null,
  zonePrecDispo = false, zoneSuivDispo = false,
  indexZone = null, totalZones = null,
  progressionZone = null,
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

      {/* ===== HUD DE ZONE (fondu, en haut-centre) ===== */}
      <div style={{ position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 14, pointerEvents: 'auto' }}>
        {onZonePrec && (
          <button onClick={onZonePrec} disabled={!zonePrecDispo} title="Zone précédente"
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, fontWeight: 900, lineHeight: 1, borderRadius: 8, padding: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(94,234,212,0.18)',
              color: 'rgba(94,234,212,0.85)', cursor: zonePrecDispo ? 'pointer' : 'not-allowed',
              opacity: zonePrecDispo ? 1 : 0.25, backdropFilter: 'blur(3px)', transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { if (zonePrecDispo) { e.currentTarget.style.background = 'rgba(94,234,212,0.15)'; e.currentTarget.style.color = '#5eead4'; e.currentTarget.style.transform = 'scale(1.1)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(94,234,212,0.85)'; e.currentTarget.style.transform = 'scale(1)' }}
          >‹</button>
        )}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: '#8b96b5', letterSpacing: 2.5, textTransform: 'uppercase' }}>
            {indexZone != null && totalZones != null ? `Zone ${indexZone} / ${totalZones}` : 'Zone'}
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: estBoss ? '#f43f5e' : '#fcd34d', textShadow: estBoss ? '0 0 12px rgba(244,63,94,0.6)' : '0 0 12px rgba(252,211,77,0.5)', marginTop: 1, maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {estBoss ? '👑 ' : ''}{nomZone}
          </div>
          {progressionZone != null && (
            <div style={{ width: 90, height: 3, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden', margin: '4px auto 0' }}>
              <div style={{ height: '100%', width: Math.max(0, Math.min(100, progressionZone)) + '%', background: 'linear-gradient(90deg, #fcd34d, #f59e0b)', borderRadius: 2, boxShadow: '0 0 6px rgba(252,211,77,0.5)', transition: 'width 0.4s ease' }}></div>
            </div>
          )}
        </div>
        {onZoneSuiv && (
          <button onClick={onZoneSuiv} disabled={!zoneSuivDispo} title="Zone suivante"
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, fontWeight: 900, lineHeight: 1, borderRadius: 8, padding: 0,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(94,234,212,0.18)',
              color: 'rgba(94,234,212,0.85)', cursor: zoneSuivDispo ? 'pointer' : 'not-allowed',
              opacity: zoneSuivDispo ? 1 : 0.25, backdropFilter: 'blur(3px)', transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { if (zoneSuivDispo) { e.currentTarget.style.background = 'rgba(94,234,212,0.15)'; e.currentTarget.style.color = '#5eead4'; e.currentTarget.style.transform = 'scale(1.1)' } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(94,234,212,0.85)'; e.currentTarget.style.transform = 'scale(1)' }}
          >›</button>
        )}
      </div>

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
            <span style={{ color: '#ffe2e2', fontWeight: 800 }}>{Math.round(pvE).toLocaleString('fr-FR')}</span> {estBoss ? '👑 BOSS' : 'SAUVAGE'}
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