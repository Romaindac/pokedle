// ============================================================
// HUD DE DUEL — la couche d'interface au-dessus de l'arene.
// Barres de vie FACON JEU POKEMON (boitier GBA classique) :
//   cadre creme arrondi, etiquette PV orange, barre qui passe
//   du vert au jaune puis au rouge, chiffres en style retro.
//   - En haut a gauche : TON boitier (pseudo).
//   - En haut a droite : boitier ennemi (mode BOSS : rouge + 👑).
//   - En bas a droite : le TICKER (2 derniers evenements).
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

// Couleur de la barre PV selon le pourcentage (codes des jeux Pokemon).
function couleurPv(pct) {
  if (pct > 50) return '#58d068'   // vert
  if (pct > 20) return '#f8d030'   // jaune
  return '#f05868'                  // rouge
}

// Boitier de PV facon Pokemon GBA.
function BoitierPokemon({ titre, pv, pvMax, boss = false }) {
  const pct = pvMax > 0 ? Math.max(0, Math.min(100, (pv / pvMax) * 100)) : 0
  return (
    <div style={{
      background: '#f8f0d0',
      border: `3px solid ${boss ? '#a3001b' : '#5a5a73'}`,
      borderRadius: 10,
      boxShadow: boss
        ? '0 0 14px 2px rgba(170, 0, 35, 0.45), inset 0 0 0 2px #fffbe8'
        : '0 4px 10px rgba(0,0,0,0.45), inset 0 0 0 2px #fffbe8',
      padding: '5px 12px 7px',
      minWidth: 215,
      fontFamily: "'Rubik', system-ui, sans-serif",
    }}>
      {/* Nom (pseudo / zone) */}
      <div style={{
        fontSize: 13, fontWeight: 800, color: boss ? '#a3001b' : '#3a3a52',
        letterSpacing: 0.5, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {titre}
      </div>
      {/* Ligne PV : etiquette orange + barre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 10, fontWeight: 900, color: '#f8f0d0',
          background: '#f8a030', borderRadius: 4, padding: '1px 5px',
          letterSpacing: 1,
        }}>PV</span>
        <div style={{
          flex: 1, height: 10,
          background: '#5a5a73', borderRadius: 6, padding: 2,
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: couleurPv(pct),
            borderRadius: 4,
            transition: 'width 0.45s ease, background 0.45s ease',
          }}></div>
        </div>
      </div>
      {/* Chiffres */}
      <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#3a3a52', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(pv).toLocaleString('fr-FR')} <span style={{ fontWeight: 600, color: '#8a8aa0' }}>/ {Math.round(pvMax).toLocaleString('fr-FR')}</span>
      </div>
    </div>
  )
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

  // Les 2 derniers evenements du journal (le plus recent en bas).
  const dernieres = (journal || []).slice(-2)

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>

      {/* ===== Ton boitier : en haut a gauche ===== */}
      <div style={{ position: 'absolute', top: '44%', left: 12 }}>
        <BoitierPokemon titre={pseudo} pv={pvJ} pvMax={maxJ} />
      </div>

      {/* ===== Boitier ennemi : en haut a droite ===== */}
      <div style={{ position: 'absolute', top: '44%', right: 12 }}>
        <BoitierPokemon
          titre={estBoss ? `👑 BOSS — ${nomZone}` : `Ennemis — ${nomZone}`}
          pv={pvE} pvMax={maxE}
          boss={estBoss}
        />
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
          fontFamily: "'Rubik', system-ui, sans-serif",
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