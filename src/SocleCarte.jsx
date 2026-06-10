// ============================================================
// SOCLE-CARTE v4 — la plateforme sous chaque combattant.
// VRAIE pose Yu-Gi-Oh : la carte est vue en perspective 3/4
// isometrique -> un LOSANGE penche en diagonale dans le sens de
// la profondeur du terrain (rotation dans son plan PUIS couchee).
//   - Par defaut : image officielle du dos de carte Pokemon
//     (secours : dos dessine en CSS si l'image ne charge pas).
//   - Carte choisie (champ `socleCarte`) : son image TCG + lisere
//     selon la finition, or si shiny, rouge sang si boss.
// 100% styles inline — zero App.css, zero conflit.
// ============================================================

// Image officielle du dos de carte (cascade : 2x -> 1x -> dos CSS).
const DOS_OFFICIEL = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back-2x.jpg'
const DOS_OFFICIEL_SECOURS = 'https://tcg.pokemon.com/assets/img/global/tcg-card-back.jpg'

// ----- REGLAGES (a ajuster librement) -----
const INCLINAISON = 60   // couchage au sol (90 = totalement a plat)
const ROTATION = 12      // carte tournee de cote (mets -14 pour pencher dans l'autre sens)
const LARGEUR = 118      // largeur de la carte (px) avant perspective
const HAUTEUR = 156      // hauteur de la carte (px) avant perspective
const PERSPECTIVE = 450  // distance du point de fuite (petit = 3D plus marquee)
const CENTRAGE = 0.5     // part de la carte DERRIERE les pieds du Pokemon
const DECALAGE_X = 0   // decalage horizontal de la carte (px) pour centrer le Pokemon dessus
const DECALAGE_Y = 0    // remonte la carte (px) pour que le Pokemon soit pose au MILIEU

// Lisere / halo selon la finition de la carte choisie (+ shiny / boss).
function styleHalo(carte, shiny, boss) {
  if (boss) return { borderColor: '#7a1024', boxShadow: '0 0 16px 4px rgba(170, 0, 35, 0.5)' }
  if (shiny) return { borderColor: '#fcd34d', boxShadow: '0 0 14px 3px rgba(252, 211, 77, 0.5)' }
  if (carte && carte.finition === 'prismatique') return { borderColor: '#c084fc', boxShadow: '0 0 14px 3px rgba(192, 132, 252, 0.55)' }
  if (carte && carte.finition === 'brillante') return { borderColor: '#cfd8e3', boxShadow: '0 0 12px 2px rgba(207, 216, 227, 0.45)' }
  if (carte) return { borderColor: '#fcd34d', boxShadow: '0 0 8px 1px rgba(252, 211, 77, 0.3)' }
  return { borderColor: 'rgba(255,255,255,0.25)', boxShadow: 'none' }
}

function SocleCarte({ carte = null, shiny = false, boss = false, ko = false, camp = 'joueur' }) {
  const halo = ko ? { borderColor: 'rgba(255,255,255,0.12)', boxShadow: 'none' } : styleHalo(carte, shiny, boss)
  const echelle = boss ? 1.3 : 1
  const L = LARGEUR * echelle
  const H = HAUTEUR * echelle
  // Sens de la diagonale : meme sens pour les 2 camps (profondeur du terrain).
  // Pour inverser un camp un jour : mettre -ROTATION selon `camp`.
  const rotation = ROTATION

  // Cascade d'images pour le dos officiel : 2x -> 1x -> dos CSS de secours.
  const erreurDos = (e) => {
    const img = e.currentTarget
    if (img.dataset.secours !== '1') {
      img.dataset.secours = '1'
      img.src = DOS_OFFICIEL_SECOURS
      return
    }
    img.style.display = 'none' // le dos CSS dessous devient visible
  }

  return (
    // ANCRE : un point (0x0) sous les pieds du Pokemon. Tout est centre dessus.
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', left: '50%', bottom: camp === 'ennemi' ? 10 : 40,
        width: 0, height: 0,
        zIndex: 0, pointerEvents: 'none',
      }}
    >

      {/* La carte : tournee en diagonale dans son plan, puis couchee au sol. */}
      <div
        style={{
          position: 'absolute', left: -L / 2 + DECALAGE_X, top: -H * CENTRAGE - DECALAGE_Y,
          width: L, height: H,
          transform: 'rotateX(' + INCLINAISON + 'deg) rotateZ(' + rotation + 'deg)',
          transformOrigin: 'center center',
          borderRadius: 8, border: '2px solid', ...halo,
          overflow: 'hidden', background: '#1c2434',
          opacity: ko ? 0.45 : 0.97,
          filter: ko ? 'grayscale(1) brightness(0.6)' : 'none',
        }}
      >
        {!ko && carte && carte.imageSmall ? (
          // Carte choisie par le joueur : son image TCG.
          <img
            src={carte.imageSmall}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <>
            {/* Dos CSS de secours (visible seulement si l'image officielle echoue) */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(160deg, #3470c4 0%, #2a5fb0 45%, #1d4a92 100%)',
              border: '5px solid #f0e6c8', borderRadius: 5, boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: '52%', aspectRatio: '1', borderRadius: '50%',
                background: '#1c4486', border: '3px solid #f0e6c8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: '36%', aspectRatio: '1', borderRadius: '50%', background: '#f0e6c8' }}></div>
              </div>
            </div>
            {/* VRAIE image officielle du dos de carte Pokemon */}
            <img
              src={DOS_OFFICIEL}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              loading="lazy"
              onError={erreurDos}
            />
          </>
        )}
        {/* Voile de profondeur : bord lointain (haut) assombri, bord proche lumineux */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.08) 50%, rgba(255,255,255,0.08) 100%)',
          pointerEvents: 'none',
        }}></div>
      </div>
    </div>
  )
}

export default SocleCarte