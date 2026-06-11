// ============================================================
// SOCLE-CARTE v6 — la plateforme sous chaque combattant.
// Carte en pose isometrique (tournee puis couchee). L'aura
// d'invocation (Canvas) jaillit de la carte vers le sprite.
//   - Par defaut : image officielle du dos de carte Pokemon.
//   - Carte choisie : son image TCG + lisere selon finition.
//   - NOUVEAU : le CADRE de la carte reagit au STATUT actif
//     (givre bleu, braises orange, gouttes violettes...).
// 100% styles inline — zero App.css. Les rares keyframes sont
// injectees par le composant lui-meme (une seule fois).
// ============================================================

const DOS_OFFICIEL = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg'
const DOS_OFFICIEL_SECOURS = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'

// ----- REGLAGES (a ajuster librement) -----
// Effet HOLOGRAMME : carte penchee en arriere (chevalet), le sprite
// jaillit devant elle en perspective.
const INCLINAISON = 50   // 0 = face mur ; 50 = forte perspective (hologramme) ; 60 = couchee
const ROTATION = 4       // leger biais pour le relief
const LARGEUR = 106      // largeur de la carte (px)
const HAUTEUR = 148      // hauteur de la carte (px)
const CENTRAGE = 0.62    // part de la carte derriere/au-dessus des pieds
const DECALAGE_X = 0     // recentrage horizontal du Pokemon sur la carte
// La carte penchee se pose juste derriere les pieds du sprite.
const BOTTOM_JOUEUR = 14
const BOTTOM_ENNEMI = 10

// --- STATUT -> habillage du cadre (priorite dans cet ordre) ---
// couleur du lisere, glow, et eventuelle animation/goutte.
const STATUT_CADRE = {
  gel:       { ordre: 1, couleur: '#7fd9f5', glow: 'rgba(127,217,245,0.7)', anim: 'socleStatutPulse 2.4s ease-in-out infinite', givre: true },
  brulure:   { ordre: 2, couleur: '#ff7a1a', glow: 'rgba(255,90,0,0.7)',    anim: 'socleStatutCrepite 0.5s ease-in-out infinite' },
  poison:    { ordre: 3, couleur: '#b030e0', glow: 'rgba(176,48,224,0.7)',  anim: 'socleStatutPulse 1.6s ease-in-out infinite', goutte: '#cf6bf0' },
  paralysie: { ordre: 4, couleur: '#ffe93c', glow: 'rgba(255,233,60,0.7)',  anim: 'socleStatutSaccade 0.4s steps(3) infinite' },
  rage:      { ordre: 5, couleur: '#ff4d4d', glow: 'rgba(255,40,40,0.75)',  anim: 'socleStatutCrepite 0.45s ease-in-out infinite' },
  garde:     { ordre: 6, couleur: '#3da9e0', glow: 'rgba(61,169,224,0.65)', anim: 'socleStatutPulse 2s ease-in-out infinite' },
  hate:      { ordre: 7, couleur: '#34d399', glow: 'rgba(52,211,153,0.65)', anim: 'socleStatutPulse 1.1s ease-in-out infinite' },
}
const ORDRE_STATUTS = ['gel', 'brulure', 'poison', 'paralysie', 'rage', 'garde', 'hate']

// Keyframes injectees une seule fois (pas dans App.css).
const KEYFRAMES_ID = 'socle-statut-keyframes'
function injecterKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(KEYFRAMES_ID)) return
  const s = document.createElement('style')
  s.id = KEYFRAMES_ID
  s.textContent = `
@keyframes socleStatutPulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
@keyframes socleStatutCrepite { 0%,100% { opacity: 0.6; filter: brightness(1); } 50% { opacity: 1; filter: brightness(1.5); } }
@keyframes socleStatutSaccade { 0% { opacity: 1; } 33% { opacity: 0.3; } 66% { opacity: 0.9; } 100% { opacity: 0.5; } }
@keyframes socleGoutte { 0% { transform: translateY(0) scaleY(0.6); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(14px) scaleY(1.2); opacity: 0; } }
`
  document.head.appendChild(s)
}

function styleHalo(carte, shiny, boss) {
  if (boss) return { borderColor: '#7a1024', boxShadow: '0 0 16px 4px rgba(170, 0, 35, 0.5)' }
  if (shiny) return { borderColor: '#fcd34d', boxShadow: '0 0 14px 3px rgba(252, 211, 77, 0.5)' }
  if (carte && carte.finition === 'prismatique') return { borderColor: '#c084fc', boxShadow: '0 0 14px 3px rgba(192, 132, 252, 0.55)' }
  if (carte && carte.finition === 'brillante') return { borderColor: '#cfd8e3', boxShadow: '0 0 12px 2px rgba(207, 216, 227, 0.45)' }
  if (carte) return { borderColor: '#fcd34d', boxShadow: '0 0 8px 1px rgba(252, 211, 77, 0.3)' }
  return { borderColor: 'rgba(255,255,255,0.25)', boxShadow: 'none' }
}

function SocleCarte({ carte = null, shiny = false, boss = false, ko = false, camp = 'joueur', statuts = [] }) {
  injecterKeyframes()

  const halo = ko ? { borderColor: 'rgba(255,255,255,0.12)', boxShadow: 'none' } : styleHalo(carte, shiny, boss)
  const echelle = boss ? 1.3 : 1
  const L = LARGEUR * echelle
  const H = HAUTEUR * echelle
  const rotation = ROTATION
  const bas = camp === 'ennemi' ? BOTTOM_ENNEMI : BOTTOM_JOUEUR

  // Statut prioritaire actif sur le cadre (aucun si K.O.).
  const cleStatut = ko ? null : ORDRE_STATUTS.find((s) => (statuts || []).includes(s))
  const stat = cleStatut ? STATUT_CADRE[cleStatut] : null

  const transfo = 'rotateX(' + INCLINAISON + 'deg) rotateZ(' + rotation + 'deg)'

  const erreurDos = (e) => {
    const img = e.currentTarget
    if (img.dataset.secours !== '1') { img.dataset.secours = '1'; img.src = DOS_OFFICIEL_SECOURS; return }
    img.style.display = 'none'
  }

  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: bas, width: 0, height: 0, zIndex: 0, pointerEvents: 'none' }}>
      {/* CADRE DE ZONE autour de la carte (passe en couleur de statut si actif) */}
      <div style={{
        position: 'absolute', left: -L / 2 + DECALAGE_X - 8, top: -H * CENTRAGE - 8,
        width: L + 16, height: H + 16,
        transform: transfo,
        transformOrigin: 'center center', borderRadius: 13,
        border: ko ? '1.5px solid rgba(255,255,255,0.06)'
          : stat ? ('2.5px solid ' + stat.couleur)
          : ('2px solid ' + (halo.borderColor || 'rgba(255,255,255,0.2)')),
        boxShadow: ko ? 'none' : stat ? ('0 0 16px 4px ' + stat.glow) : halo.boxShadow,
        opacity: ko ? 0.3 : 0.85,
        animation: stat ? stat.anim : 'none',
        pointerEvents: 'none',
      }}></div>

      {/* GIVRE (gel) : fins traits clairs aux coins du cadre */}
      {stat && stat.givre && (
        <div style={{
          position: 'absolute', left: -L / 2 + DECALAGE_X - 8, top: -H * CENTRAGE - 8,
          width: L + 16, height: H + 16, transform: transfo, transformOrigin: 'center center',
          borderRadius: 13, pointerEvents: 'none',
          background: 'radial-gradient(circle at 12% 12%, rgba(255,255,255,0.5), transparent 22%), radial-gradient(circle at 88% 88%, rgba(255,255,255,0.45), transparent 22%), radial-gradient(circle at 88% 12%, rgba(200,244,255,0.4), transparent 20%), radial-gradient(circle at 12% 88%, rgba(200,244,255,0.4), transparent 20%)',
          opacity: 0.9,
        }}></div>
      )}

      {/* GOUTTES (poison) : 2 petites gouttes qui coulent du bas du cadre */}
      {stat && stat.goutte && (
        <div style={{
          position: 'absolute', left: -L / 2 + DECALAGE_X, top: -H * CENTRAGE,
          width: L, height: H, transform: transfo, transformOrigin: 'center center',
          pointerEvents: 'none', overflow: 'visible',
        }}>
          <span style={{ position: 'absolute', left: '28%', bottom: -4, width: 5, height: 8, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: stat.goutte, animation: 'socleGoutte 1.8s ease-in infinite' }}></span>
          <span style={{ position: 'absolute', left: '68%', bottom: -4, width: 4, height: 7, borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', background: stat.goutte, animation: 'socleGoutte 1.8s ease-in infinite 0.9s' }}></span>
        </div>
      )}

      {/* La carte */}
      <div style={{
        position: 'absolute', left: -L / 2 + DECALAGE_X, top: -H * CENTRAGE,
        width: L, height: H,
        transform: transfo,
        transformOrigin: 'center center',
        borderRadius: 8, border: '2px solid', ...halo,
        overflow: 'hidden', background: '#1c2434',
        opacity: ko ? 0.45 : 0.97, filter: ko ? 'grayscale(1) brightness(0.6)' : 'none',
      }}>
        {!ko && carte && carte.imageSmall ? (
          <img src={carte.imageSmall} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        ) : (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #3470c4 0%, #2a5fb0 45%, #1d4a92 100%)', border: '5px solid #f0e6c8', borderRadius: 5, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '52%', aspectRatio: '1', borderRadius: '50%', background: '#1c4486', border: '3px solid #f0e6c8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '36%', aspectRatio: '1', borderRadius: '50%', background: '#f0e6c8' }}></div>
              </div>
            </div>
            <img src={DOS_OFFICIEL} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" onError={erreurDos} />
          </>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 50%, rgba(255,255,255,0.08) 100%)', pointerEvents: 'none' }}></div>
      </div>
    </div>
  )
}

export default SocleCarte