import { useRef, useEffect } from 'react'
import { ambianceDeZone } from './AmbianceCombat'

// ============================================================
// ARENE PREMIUM — mise en scène "Duel Arena" hologramme.
// Reproduit fidèlement la maquette : fond sombre dégradé, sol
// grille néon 3D qui défile, horizon lumineux, bandeaux Life
// Points (avatar + total ATK + pips restants + barre), noyau VS
// cristal animé, vignette cinématique, poussière d'énergie.
//
// Les rangées de combattants (SpriteCombattant) arrivent déjà
// rendues via rangeeEnnemis / rangeeJoueur. Tout le CSS est
// injecté avec des sélecteurs .apz-arene spécifiques (bat App.css).
// ============================================================

const COULEUR_GRILLE = {
  neige: '#67e8f9', cendres: '#fb923c', sable: '#fbbf24',
  spores: '#c084fc', feuilles: '#4ade80', poussiere: '#93c5fd',
}

// Ambiance de FOND par type de zone : 2 halos de couleur (haut + bas) qui
// teintent l'arène de façon cohérente avec le décor, sans casser le style holo.
// [halo haut, halo bas] en rgba prêts à l'emploi.
const AMBIANCE_FOND = {
  neige:     { haut: 'rgba(56,130,200,0.30)',  bas: 'rgba(40,90,150,0.22)',  base: '#060d18' },
  cendres:   { haut: 'rgba(180,60,30,0.30)',   bas: 'rgba(120,40,20,0.24)',  base: '#140805' },
  sable:     { haut: 'rgba(180,140,50,0.28)',  bas: 'rgba(130,95,30,0.22)',  base: '#120e05' },
  spores:    { haut: 'rgba(130,70,180,0.32)',  bas: 'rgba(80,40,130,0.24)',  base: '#0d0618' },
  feuilles:  { haut: 'rgba(50,150,80,0.28)',   bas: 'rgba(30,100,55,0.22)',  base: '#06120a' },
  poussiere: { haut: 'rgba(110,70,180,0.28)',  bas: 'rgba(20,30,55,0.24)',   base: '#04060c' },
}

// Particules d'ambiance par zone, réparties sur TOUT l'écran.
// type: 'chute' (tombe), 'monte' (s'élève), 'scintille' (clignote sur place).
const AMBIANCE_PARTICULES = {
  neige:     { couleur: '#cfeaff', glow: '#a5d8ff', type: 'chute',     forme: 'rond',   nb: 34, tailleMin: 2, tailleMax: 5 },
  cendres:   { couleur: '#ff9a4c', glow: '#ff6b1a', type: 'monte',     forme: 'rond',   nb: 30, tailleMin: 2, tailleMax: 4 },
  sable:     { couleur: '#e8c878', glow: '#d4a843', type: 'chute',     forme: 'rond',   nb: 30, tailleMin: 1.5, tailleMax: 3.5 },
  spores:    { couleur: '#d8b0ff', glow: '#c084fc', type: 'monte',     forme: 'rond',   nb: 28, tailleMin: 2, tailleMax: 5 },
  feuilles:  { couleur: '#7fe89a', glow: '#4ade80', type: 'chute',     forme: 'feuille', nb: 26, tailleMin: 3, tailleMax: 6 },
  poussiere: { couleur: '#c5d0ff', glow: '#93c5fd', type: 'scintille', forme: 'rond',   nb: 40, tailleMin: 1.5, tailleMax: 3.5 },
}


const STYLE_ID = 'arene-premium-styles-v2'
function injecterStyles() {
  if (typeof document === 'undefined') return
  const ancien = document.getElementById('arene-premium-styles')
  if (ancien) ancien.remove() // retire l'ancienne version si présente
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = CSS
  document.head.appendChild(s)
}

function rgba(hex, a) {
  const h = (hex || '#888888').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

function ArenePremium({
  rangeeEnnemis, rangeeJoueur,
  equipeJoueur = [], equipeEnnemie = [],
  pvJoueur = [], pvEnnemis = [],
  pseudo = 'Toi', nomZone = 'Combat', estBoss = false,
  decor = null,
  onZonePrec = null, onZoneSuiv = null, zonePrecDispo = false, zoneSuivDispo = false, indexZone = null, totalZones = null, progressionZone = null,
  numZone = null, combatActuel = null, victoiresZone = null, seuilBoss = null,
}) {
  injecterStyles()
  const monElement = useRef(null)

  // Ambiance de fond selon la zone (couleur + base), calculée tôt pour le useEffect.
  const couleurGrille = estBoss ? '#f43f5e' : (COULEUR_GRILLE[ambianceDeZone(decor)] || COULEUR_GRILLE.poussiere)
  const ambKey = ambianceDeZone(decor)
  const amb = estBoss
    ? { haut: 'rgba(180,30,50,0.32)', bas: 'rgba(120,20,35,0.24)', base: '#100407' }
    : (AMBIANCE_FOND[ambKey] || AMBIANCE_FOND.poussiere)
  const ambP = estBoss
    ? { couleur: '#ff8a8a', glow: '#f43f5e', type: 'monte', forme: 'rond', nb: 30, tailleMin: 2, tailleMax: 4 }
    : (AMBIANCE_PARTICULES[ambKey] || AMBIANCE_PARTICULES.poussiere)

  // Force la div parente (.arene-terrain de App.jsx) à devenir un cadre
  // neutre : on retire l'image de zone (avec !important pour battre le style
  // inline backgroundImage de App.jsx), le voile, le padding, la bordure.
  useEffect(() => {
    const parent = monElement.current?.parentElement
    if (!parent) return
    parent.style.setProperty('background', amb.base, 'important')
    parent.style.setProperty('background-image', 'none', 'important')
    parent.style.setProperty('padding', '0', 'important')
    parent.style.setProperty('border', 'none', 'important')
    parent.style.setProperty('box-shadow', 'none', 'important')
    parent.style.setProperty('overflow', 'hidden', 'important')
    parent.style.setProperty('border-radius', '16px', 'important')
    parent.style.setProperty('min-height', '74vh', 'important')
  })

  // Particules générées une seule fois (stables entre les rendus).
  const decorRef = useRef(null)
  if (decorRef.current === null) {
    decorRef.current = {
      etoiles: Array.from({ length: 50 }, () => ({
        x: Math.random() * 100, y: Math.random() * 44,
        d: (2 + Math.random() * 3).toFixed(1), del: (-Math.random() * 3).toFixed(1),
      })),
      poussiere: Array.from({ length: 20 }, () => ({
        x: Math.random() * 100, b: 8 + Math.random() * 50,
        s: (1.5 + Math.random() * 2.5).toFixed(1),
        col: Math.random() > 0.5 ? 'rgba(94,234,212,0.55)' : 'rgba(150,170,255,0.45)',
        d: (4 + Math.random() * 4).toFixed(1), del: (-Math.random() * 6).toFixed(1),
      })),
      rayons: Array.from({ length: 7 }, (_, i) => ({
        x: 10 + i * 13 + Math.random() * 5, rot: -8 + Math.random() * 16,
        del: (-Math.random() * 6).toFixed(1),
      })),
      // Particules d'ambiance réparties sur TOUT l'écran (positions stables).
      ambiance: Array.from({ length: 40 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        t: Math.random(),          // facteur taille
        dur: (5 + Math.random() * 6).toFixed(1),
        del: (-Math.random() * 8).toFixed(1),
        dx: (Math.random() * 40 - 20).toFixed(0),
      })),
    }
  }
  const { etoiles, poussiere, rayons } = decorRef.current
  const ambianceParticules = decorRef.current.ambiance

  // Totaux pour les bandeaux LP.
  const sommePv = (arr) => arr.reduce((t, v) => t + Math.max(0, v || 0), 0)
  const sommePvMax = (eq) => eq.reduce((t, p) => t + (p?.pvMax || 0), 0)
  const sommeAtk = (eq) => eq.reduce((t, p) => t + (p?.attaque || 0), 0)

  const pvJTotal = sommePv(pvJoueur), pvJMax = sommePvMax(equipeJoueur) || 1
  const pvETotal = sommePv(pvEnnemis), pvEMax = sommePvMax(equipeEnnemie) || 1
  const pctJ = Math.max(0, Math.min(100, (pvJTotal / pvJMax) * 100))
  const pctE = Math.max(0, Math.min(100, (pvETotal / pvEMax) * 100))
  const atkJ = sommeAtk(equipeJoueur), atkE = sommeAtk(equipeEnnemie)

  const couleurE = estBoss ? '#f43f5e' : '#f87171'

  const lame = <svg viewBox="0 0 24 24" fill="#f87171" style={{ width: 10, height: 10, flexShrink: 0 }}><path d="M4 20l2-2 8-8 3-7-7 3-8 8-2 2 1 1 2-2 4-4 1 1-4 4-2 2z" /></svg>

  const bandeauLP = (estJ) => {
    const cc = estJ ? '#5eead4' : couleurE
    const pv = estJ ? pvJTotal : pvETotal
    const pct = estJ ? pctJ : pctE
    const atk = estJ ? atkJ : atkE
    const arr = estJ ? pvJoueur : pvEnnemis
    const eq = estJ ? equipeJoueur : equipeEnnemie
    const nom = estJ ? (pseudo || 'Toi').toUpperCase() : (nomZone || 'Adversaire').toUpperCase()
    const mono = (estJ ? (pseudo || 'T') : (nomZone || 'E')).charAt(0).toUpperCase()
    const tag = estJ ? 'Vous' : (estBoss ? 'Boss' : 'Sauvage')
    const style = { '--cc': cc, '--cc-glow': rgba(cc, 0.5), '--cc-trans': rgba(cc, 0.14), '--cc-bord': rgba(cc, 0.4) }
    return (
      <div className={`apz-lp ${estJ ? 'apz-lp-j' : 'apz-lp-e'}`} style={style}>
        <div className="apz-lp-avatar"><span className="apz-lp-mono">{mono}</span></div>
        <div className="apz-lp-infos">
          <div className="apz-lp-nomligne">
            <span className="apz-lp-nom">{nom}</span>
            <span className="apz-lp-tag">{tag}</span>
          </div>
          <div className="apz-lp-valligne">
            <span className="apz-lp-val">{pv.toLocaleString('fr-FR')}</span>
            <div className="apz-lp-meta">
              <span className="apz-lp-atk">{lame}{atk.toLocaleString('fr-FR')}</span>
              <div className="apz-lp-pips">
                {eq.map((_, i) => <div key={i} className={`apz-pip ${(arr[i] || 0) <= 0 ? 'mort' : ''}`} />)}
              </div>
            </div>
          </div>
          <div className="apz-lp-barre"><div className="apz-lp-barrefill" style={{ width: pct + '%' }} /></div>
        </div>
      </div>
    )
  }

  return (
    <div ref={monElement} className={`apz-arene ${estBoss ? 'apz-boss' : ''}`}
      style={{ '--grille': couleurGrille, '--grille-t1': rgba(couleurGrille, 0.13), '--grille-t2': rgba(couleurGrille, 0.09), '--grille-glow': rgba(couleurGrille, 0.1), '--amb-haut': amb.haut, '--amb-bas': amb.bas, '--amb-base': amb.base }}>

      {decor && <div className="apz-decor" style={{ backgroundImage: `url(${decor})` }} />}
      <div className="apz-decor-halos" />
      <div className="apz-etoiles">
        {etoiles.map((e, i) => <div key={i} className="apz-etoile" style={{ left: e.x + '%', top: e.y + '%', animationDuration: e.d + 's', animationDelay: e.del + 's' }} />)}
      </div>
      <div className="apz-rayons">
        {rayons.map((r, i) => <div key={i} className="apz-rayon" style={{ left: r.x + '%', transform: `rotate(${r.rot}deg)`, animationDelay: r.del + 's' }} />)}
      </div>

      <div className="apz-sol-wrap"><div className="apz-sol" /></div>
      <div className="apz-sol-lueur" />
      <div className="apz-horizon-halo" />
      <div className="apz-brume" />
      <div className="apz-poussieres">
        {poussiere.map((p, i) => <div key={i} className="apz-poussiere" style={{ left: p.x + '%', bottom: p.b + '%', width: p.s + 'px', height: p.s + 'px', background: p.col, boxShadow: `0 0 6px ${p.col}`, animationDuration: p.d + 's', animationDelay: p.del + 's' }} />)}
      </div>

      {/* Particules d'ambiance de la zone, réparties sur TOUT l'écran */}
      <div className="apz-ambiance">
        {ambianceParticules.slice(0, ambP.nb).map((p, i) => {
          const taille = (ambP.tailleMin + p.t * (ambP.tailleMax - ambP.tailleMin)).toFixed(1)
          const anim = ambP.type === 'chute' ? 'apzAmbChute' : ambP.type === 'monte' ? 'apzAmbMonte' : 'apzAmbScintille'
          const estFeuille = ambP.forme === 'feuille'
          return (
            <div key={i} style={{
              position: 'absolute', left: p.x + '%', top: p.y + '%',
              width: taille + 'px', height: taille + 'px',
              borderRadius: estFeuille ? '50% 0 50% 0' : '50%',
              background: ambP.couleur,
              boxShadow: `0 0 ${Number(taille) * 2.5}px ${ambP.glow}`,
              opacity: 0,
              '--adx': p.dx + 'px',
              animation: `${anim} ${p.dur}s ${ambP.type === 'scintille' ? 'ease-in-out' : 'linear'} ${p.del}s infinite`,
              pointerEvents: 'none',
            }} />
          )
        })}
      </div>

      {bandeauLP(true)}
      {bandeauLP(false)}
      <div className="apz-tour">
        {onZonePrec && <button className="apz-zone-fleche" onClick={onZonePrec} disabled={!zonePrecDispo}>‹</button>}
        <div className="apz-tour-centre">
          <div className="apz-tour-label">{indexZone != null && totalZones != null ? `Zone ${indexZone} / ${totalZones}` : 'Zone'}</div>
          <div className="apz-tour-val">{estBoss ? '👑 ' : ''}{nomZone}</div>
          {numZone != null && combatActuel != null && (
            <div className="apz-tour-combat">
              <span className="apz-tour-combat-txt">Combat {numZone}-{combatActuel}</span>
              {estBoss ? (
                <span className="apz-tour-boss-badge">BOSS</span>
              ) : (victoiresZone != null && seuilBoss != null && (
                <span className="apz-tour-jauge" title={`Victoires avant le boss : ${Math.min(victoiresZone, seuilBoss)}/${seuilBoss}`}>
                  <span className="apz-tour-jauge-piste"><span className="apz-tour-jauge-fill" style={{ width: `${Math.min(100, (Math.min(victoiresZone, seuilBoss) / seuilBoss) * 100)}%` }}></span></span>
                  <span className="apz-tour-jauge-txt">{Math.min(victoiresZone, seuilBoss)}/{seuilBoss} 👑</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {onZoneSuiv && <button className="apz-zone-fleche" onClick={onZoneSuiv} disabled={!zoneSuivDispo}>›</button>}
      </div>

      <div className="apz-rangee apz-rangee-e">{rangeeEnnemis}</div>

      <div className="apz-vs">
        <div className="apz-vs-barre" />
        <div className="apz-vs-noyau">
          <div className="apz-vs-anneau" />
          <div className="apz-vs-anneau2" />
          <div className="apz-vs-cristal" />
          <div className="apz-vs-texte">VS</div>
        </div>
      </div>

      <div className="apz-rangee apz-rangee-j">{rangeeJoueur}</div>

      <div className="apz-vignette" />
    </div>
  )
}

// ============================================================
// CSS — fidèle à la maquette v6. Sélecteurs .apz-arene xxx pour
// la spécificité (bat App.css). Neutralise aussi le ::before de
// .arene-terrain (le voile sombre) côté parent.
// ============================================================
const CSS = `
.arene-terrain:has(.apz-arene)::before,
.arene-terrain:has(.apz-arene)::after { display: none !important; }

.apz-arene {
  position: relative; width: 100%; min-height: 74vh; overflow: hidden; border-radius: 16px;
  background:
    radial-gradient(ellipse 75% 50% at 50% 10%, var(--amb-haut, rgba(110,70,180,0.30)), transparent 58%),
    radial-gradient(ellipse 100% 60% at 50% 95%, var(--amb-bas, rgba(20,30,55,0.55)), transparent 72%),
    radial-gradient(ellipse 90% 55% at 50% 0%, var(--amb-haut, rgba(110,70,180,0.30)), transparent 65%),
    radial-gradient(ellipse 130% 90% at 50% 100%, rgba(8,12,24,0.92), var(--amb-base, #04060c) 72%),
    var(--amb-base, #04060c);
  box-shadow: inset 0 0 140px rgba(0,0,0,0.72);
  perspective: 1500px;
  padding: 82px 12px 26px;
  display: flex; flex-direction: column; justify-content: space-between;
  transition: background 0.8s ease;
}
.apz-arene * { box-sizing: border-box; }
.apz-arene .apz-decor { position: absolute; inset: 0; z-index: 0; background-size: cover; background-position: center; opacity: 0.07; filter: saturate(0.5) brightness(0.4); }
.apz-arene .apz-decor-halos { position: absolute; inset: 0; z-index: 1; opacity: 0.7; pointer-events: none; background: radial-gradient(circle at 18% 28%, rgba(80,50,130,0.28), transparent 38%), radial-gradient(circle at 82% 22%, rgba(50,40,110,0.24), transparent 42%), radial-gradient(circle at 50% 60%, rgba(40,60,120,0.15), transparent 50%); }
.apz-arene .apz-etoiles { position: absolute; inset: 0; z-index: 1; overflow: hidden; pointer-events: none; }
.apz-arene .apz-etoile { position: absolute; width: 2px; height: 2px; border-radius: 50%; background: #fff; opacity: 0.5; animation: apzScintille 3s ease-in-out infinite; }
.apz-arene .apz-rayons { position: absolute; left: 0; right: 0; top: 0; height: 60%; z-index: 1; pointer-events: none; opacity: 0.4; overflow: hidden; }
.apz-arene .apz-rayon { position: absolute; top: -10%; width: 3px; height: 120%; background: linear-gradient(to bottom, rgba(150,170,255,0.35), transparent 70%); transform-origin: top center; filter: blur(2px); animation: apzRayon 6s ease-in-out infinite; }

/* SOL grille néon 3D */
.apz-arene .apz-sol-wrap { position: absolute; left: 0; right: 0; bottom: 0; height: 34%; z-index: 2; overflow: hidden; -webkit-mask-image: linear-gradient(to top, transparent 2%, #000 30%, rgba(0,0,0,0.4) 65%, transparent 90%); mask-image: linear-gradient(to top, transparent 2%, #000 30%, rgba(0,0,0,0.4) 65%, transparent 90%); pointer-events: none; }
.apz-arene .apz-sol { position: absolute; left: 50%; top: 0; width: 300%; height: 200%; transform: translateX(-50%) rotateX(73deg); transform-origin: top center; background-image: linear-gradient(var(--grille-t1) 1.5px, transparent 1.5px), linear-gradient(90deg, var(--grille-t2) 1.5px, transparent 1.5px); background-size: 66px 66px; animation: apzSol 14s linear infinite; }
.apz-arene .apz-sol-lueur { position: absolute; left: 50%; bottom: 0; width: 62%; height: 70%; transform: translateX(-50%); background: radial-gradient(ellipse at 50% 100%, var(--grille-glow), transparent 70%); z-index: 2; pointer-events: none; }
.apz-arene .apz-horizon { position: absolute; left: 0; right: 0; top: 45%; height: 2px; background: linear-gradient(90deg, transparent, rgba(150,170,255,0.5) 25%, rgba(200,220,255,0.85) 50%, rgba(150,170,255,0.5) 75%, transparent); box-shadow: 0 0 40px rgba(150,170,255,0.7), 0 0 80px rgba(150,170,255,0.4); z-index: 3; pointer-events: none; }
.apz-arene .apz-horizon-halo { position: absolute; left: 50%; top: 45%; width: 68%; height: 120px; transform: translate(-50%, -50%); background: radial-gradient(ellipse, rgba(150,170,255,0.18), transparent 65%); z-index: 2; pointer-events: none; }
.apz-arene .apz-brume { position: absolute; left: 0; right: 0; bottom: 0; height: 34%; background: linear-gradient(to top, var(--grille-glow), transparent); z-index: 3; pointer-events: none; }
.apz-arene .apz-poussieres { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
.apz-arene .apz-ambiance { position: absolute; inset: 0; z-index: 3; pointer-events: none; overflow: hidden; }
.apz-arene .apz-poussiere { position: absolute; border-radius: 50%; animation: apzPoussiere 6s ease-out infinite; }

/* BANDEAUX LIFE POINTS */
.apz-arene .apz-lp { position: absolute; top: 14px; z-index: 14; display: flex; align-items: center; gap: 10px; }
.apz-arene .apz-lp-j { left: 16px; }
.apz-arene .apz-lp-e { right: 16px; flex-direction: row-reverse; }
.apz-arene .apz-lp-avatar { position: relative; width: 48px; height: 48px; border-radius: 13px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--cc); box-shadow: 0 0 16px var(--cc-glow), inset 0 0 12px rgba(0,0,0,0.5); background: linear-gradient(135deg, rgba(24,32,54,0.95), rgba(10,14,26,0.95)); flex-shrink: 0; overflow: hidden; }
.apz-arene .apz-lp-avatar::before { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(135deg, transparent 0 5px, var(--cc-trans) 5px 6px); opacity: 0.5; }
.apz-arene .apz-lp-mono { font-size: 22px; font-weight: 900; font-style: italic; color: var(--cc); text-shadow: 0 0 10px var(--cc-glow); z-index: 1; }
.apz-arene .apz-lp-infos { display: flex; flex-direction: column; gap: 3px; min-width: 240px; }
.apz-arene .apz-lp-e .apz-lp-infos { align-items: flex-end; }
.apz-arene .apz-lp-nomligne { display: flex; align-items: center; gap: 8px; }
.apz-arene .apz-lp-e .apz-lp-nomligne { flex-direction: row-reverse; }
.apz-arene .apz-lp-nom { font-size: 13px; font-weight: 800; letter-spacing: 0.5px; color: #eef2fb; }
.apz-arene .apz-lp-tag { font-size: 9px; font-weight: 700; padding: 1px 7px; border-radius: 4px; background: var(--cc-trans); color: var(--cc); border: 1px solid var(--cc-bord); text-transform: uppercase; letter-spacing: 1px; }
.apz-arene .apz-lp-valligne { display: flex; align-items: baseline; gap: 8px; }
.apz-arene .apz-lp-e .apz-lp-valligne { flex-direction: row-reverse; }
.apz-arene .apz-lp-val { font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; color: #fff; text-shadow: 0 0 10px var(--cc-glow); line-height: 1; }
.apz-arene .apz-lp-meta { display: flex; gap: 8px; align-items: center; }
.apz-arene .apz-lp-e .apz-lp-meta { flex-direction: row-reverse; }
.apz-arene .apz-lp-atk { display: flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 800; color: #ffb0b0; font-variant-numeric: tabular-nums; }
.apz-arene .apz-lp-pips { display: flex; gap: 2px; align-items: center; }
.apz-arene .apz-pip { width: 7px; height: 7px; border-radius: 2px; background: var(--cc); box-shadow: 0 0 5px var(--cc-glow); }
.apz-arene .apz-pip.mort { background: rgba(255,255,255,0.12); box-shadow: none; }
.apz-arene .apz-lp-barre { width: 250px; max-width: 38vw; height: 9px; background: rgba(0,0,0,0.6); border-radius: 5px; overflow: hidden; border: 1px solid var(--cc-bord); position: relative; }
.apz-arene .apz-lp-barrefill { height: 100%; background: linear-gradient(90deg, var(--cc), #fff); box-shadow: 0 0 12px var(--cc-glow); border-radius: 4px; transition: width 0.6s cubic-bezier(0.22,1,0.36,1); }

.apz-arene .apz-tour {
  position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
  z-index: 14; display: flex; align-items: center; gap: 10px;
  pointer-events: auto;
  padding: 5px 8px;
  border-radius: 11px;
  background: linear-gradient(180deg, rgba(14,20,36,0.9), rgba(8,12,22,0.93));
  border: 1px solid rgba(94,234,212,0.18);
  box-shadow: 0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05);
}
.apz-arene .apz-tour:hover { transform: translateX(-50%) !important; }
.apz-arene .apz-tour-centre { text-align: center; width: 200px; flex-shrink: 0; }
.apz-arene .apz-tour-label { font-size: 8.5px; font-weight: 800; color: #8b96b5; letter-spacing: 2.5px; text-transform: uppercase; }
.apz-arene .apz-tour-val { font-size: 14px; font-weight: 900; color: #fcd34d; text-shadow: 0 0 12px rgba(252,211,77,0.5); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.apz-arene .apz-tour-combat { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 3px; }
.apz-arene .apz-tour-combat-txt { font-size: 9px; font-weight: 700; color: #9aa5c8; white-space: nowrap; flex-shrink: 0; }
.apz-arene .apz-tour-boss-badge { font-size: 8px; font-weight: 900; letter-spacing: 1px; color: #fff; background: linear-gradient(180deg, #f43f5e, #b91c3c); padding: 2px 7px; border-radius: 5px; box-shadow: 0 0 8px rgba(244,63,94,0.6); }
.apz-arene .apz-tour-jauge { display: flex; align-items: center; gap: 5px; min-width: 0; }
.apz-arene .apz-tour-jauge-piste { width: 54px; height: 5px; background: rgba(0,0,0,0.5); border-radius: 3px; overflow: hidden; flex-shrink: 0; }
.apz-arene .apz-tour-jauge-fill { display: block; height: 100%; background: linear-gradient(90deg, #fcd34d, #f59e0b); border-radius: 3px; box-shadow: 0 0 6px rgba(252,211,77,0.6); transition: width 0.4s ease; }
.apz-arene .apz-tour-jauge-txt { font-size: 8px; font-weight: 800; color: #fcd34d; white-space: nowrap; flex-shrink: 0; }
.apz-arene .apz-zone-fleche {
  flex-shrink: 0; width: 30px; height: 30px;
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 900; line-height: 1; border-radius: 9px;
  background: rgba(94,234,212,0.12); border: 1px solid rgba(94,234,212,0.25);
  color: #5eead4; cursor: pointer; padding: 0;
  transform: none !important; transition: none !important; box-shadow: none !important;
}
.apz-arene .apz-zone-fleche:hover, .apz-arene .apz-zone-fleche:focus, .apz-arene .apz-zone-fleche:active {
  transform: none !important; box-shadow: none !important; outline: none;
}
.apz-arene .apz-zone-fleche:disabled { opacity: 0.22; cursor: not-allowed; }

/* NOYAU VS */
.apz-arene .apz-vs { position: relative; z-index: 8; display: flex; align-items: center; justify-content: center; height: 90px; pointer-events: none; margin: 2px 0; }
.apz-arene .apz-vs-barre { position: absolute; left: 4%; right: 4%; height: 2px; top: 50%; background: linear-gradient(90deg, transparent, #5eead4 6%, rgba(255,255,255,0.55) 50%, #f87171 94%, transparent); box-shadow: 0 0 22px rgba(255,255,255,0.45); }
.apz-arene .apz-vs-noyau { position: relative; width: 78px; height: 78px; display: flex; align-items: center; justify-content: center; z-index: 9; }
.apz-arene .apz-vs-noyau::before { content: ''; position: absolute; inset: -15px; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,0.32), rgba(252,211,77,0.18) 40%, transparent 68%); animation: apzPulse 2s ease-in-out infinite; }
.apz-arene .apz-vs-anneau { position: absolute; inset: -4px; border: 2px solid rgba(252,211,77,0.5); border-radius: 50%; border-top-color: transparent; border-bottom-color: transparent; animation: apzRotate 4s linear infinite; }
.apz-arene .apz-vs-anneau2 { position: absolute; inset: 4px; border: 2px solid rgba(255,255,255,0.4); border-radius: 50%; border-left-color: transparent; border-right-color: transparent; animation: apzRotateInv 3s linear infinite; }
.apz-arene .apz-vs-cristal { width: 46px; height: 46px; background: linear-gradient(135deg, #fff 0%, #fcd34d 60%, #f59e0b 100%); border-radius: 10px; box-shadow: 0 0 28px #fcd34d, 0 0 56px rgba(252,211,77,0.55), inset 0 0 16px rgba(255,255,255,0.9); animation: apzCristal 8s linear infinite; }
.apz-arene .apz-vs-texte { position: absolute; font-size: 26px; font-weight: 900; font-style: italic; letter-spacing: 1px; color: #fff; text-shadow: 0 0 16px #fcd34d, 0 2px 4px rgba(0,0,0,0.6); z-index: 10; }

/* RANGÉES */
.apz-arene .apz-rangee { position: relative; z-index: 5; display: flex; justify-content: center; align-items: flex-end; gap: 12px; flex-wrap: nowrap; }
/* Slots élargis dans l'arène premium pour aérer les encarts + noms entiers */
.apz-arene .terrain-slot { flex: 0 1 122px !important; max-width: 122px !important; }
.apz-arene .apz-rangee-e { transform: scale(0.86); transform-origin: top center; }

.apz-arene .apz-vignette { position: absolute; inset: 0; z-index: 13; pointer-events: none; box-shadow: inset 0 0 180px rgba(0,0,0,0.62), inset 0 0 70px rgba(0,0,0,0.32); border-radius: 16px; }

@keyframes apzScintille { 0%,100% { opacity: 0.2; } 50% { opacity: 0.7; } }
@keyframes apzRayon { 0%,100% { opacity: 0.25; } 50% { opacity: 0.5; } }
@keyframes apzSol { from { background-position: 0 0; } to { background-position: 0 66px; } }
@keyframes apzPoussiere { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: 0.6; } 80% { opacity: 0.4; } 100% { transform: translateY(-44px); opacity: 0; } }
/* particules d'ambiance sur tout l'écran */
@keyframes apzAmbChute { 0% { transform: translate(0, -10%); opacity: 0; } 10% { opacity: 0.85; } 90% { opacity: 0.7; } 100% { transform: translate(var(--adx, 20px), 600%); opacity: 0; } }
@keyframes apzAmbMonte { 0% { transform: translate(0, 10%); opacity: 0; } 12% { opacity: 0.85; } 88% { opacity: 0.6; } 100% { transform: translate(var(--adx, 20px), -600%); opacity: 0; } }
@keyframes apzAmbScintille { 0%, 100% { opacity: 0.15; transform: scale(0.8); } 50% { opacity: 0.9; transform: scale(1.1); } }
@keyframes apzPulse { 0%,100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.12); } }
@keyframes apzRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes apzRotateInv { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
@keyframes apzCristal { from { transform: rotate(45deg); } to { transform: rotate(405deg); } }

@media (prefers-reduced-motion: reduce) {
  .apz-arene .apz-sol, .apz-arene .apz-rayon, .apz-arene .apz-poussiere,
  .apz-arene .apz-vs-cristal, .apz-arene .apz-vs-anneau, .apz-arene .apz-vs-anneau2,
  .apz-arene .apz-etoile { animation: none !important; }
}
@media (max-width: 1100px) {
  .apz-arene .apz-lp-infos { min-width: 150px; }
  .apz-arene .apz-lp-barre { width: 150px; }
  .apz-arene .apz-rangee { gap: 6px; }
}
`

export default ArenePremium