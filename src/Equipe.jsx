import { useState, memo } from 'react'
import { xpRequise, STAT_MAX_IV } from './stats'
import { XP_BASE_NIVEAU, PIERRES } from './config'
import { ROLES, determinerRole, passifDe, passifEffectif, passifsDuRole, passifPourMode, compterRoles, compterSpeciaux, compositionValide, COMPOSITION_REQUISE, MIN_PAR_ROLE, MAX_PAR_ROLE, MAX_SPECIAL, estJoker, roleEffectif, CASES_JOKER } from './roles'
import { OBJETS } from './objets'
import { PARCHEMINS } from './parchemins'
import { SYNERGIES, synergiesActives, manquePourSynergie } from './synergies'

// ============================================================
// EQUIPE — REFONTE PREMIUM (fond sombre, auras par rôle).
// 100% inline + classes prefixe "eqp-" (PAS "eqm-") pour ne PAS
// heriter des 218 regles .eqm- d'App.css. Zero impact App.css.
// Toute la logique (rôles, passifs, synergies, fiche, socle) conservee.
// ============================================================

function rgba(hex, a) {
  const h = (hex || '#888').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

// CSS anime autonome scope eqp- (injecte une fois).
const EQP_CSS = `
@keyframes eqpBreath { 0%,100%{ opacity:.4 } 50%{ opacity:.8 } }
@keyframes eqpPulse { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.05) } }
@keyframes eqpFloat { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-8px) } }
@keyframes eqpRise { 0%{ opacity:0; transform:translateY(14px) } 100%{ opacity:1; transform:translateY(0) } }
@keyframes eqpFill { 0%{ width:0 } }
@keyframes eqpSpinSlow { from{ transform:rotate(0) } to{ transform:rotate(360deg) } }
@keyframes eqpShine { 0%{ background-position:-200% 0 } 100%{ background-position:200% 0 } }
@keyframes eqpSweep { 0%{ transform:translateX(-120%) } 60%,100%{ transform:translateX(320%) } }
.eqp-slot-vide:hover { border-color: rgba(127,176,255,0.6) !important; background: rgba(127,176,255,0.08) !important; }
.eqp-carte:hover { transform: translateY(-2px); }
.eqp-carte { transition: transform .15s ease; }
.eqp-shiny-glow { animation: eqpBreath 2.6s ease-in-out infinite; }
.eqp-scroll::-webkit-scrollbar { width: 8px; }
.eqp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
.eqp-hero-sprite { animation: eqpFloat 3.6s ease-in-out infinite; }
.eqp-hero-ring { animation: eqpSpinSlow 14s linear infinite; }
.eqp-hero-aura { animation: eqpBreath 3s ease-in-out infinite; }
.eqp-rise { animation: eqpRise .45s ease both; }
.eqp-fill { animation: eqpFill 1s cubic-bezier(.22,1,.36,1) both; }
.eqp-bar { position: relative; overflow: hidden; }
.eqp-bar::after {
  content: ''; position: absolute; top: 0; left: 0; width: 35%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
  animation: eqpSweep 2.8s ease-in-out infinite;
}
.eqp-shine {
  background: linear-gradient(90deg,#fff 30%,#fcd34d 50%,#fff 70%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; animation: eqpShine 5s linear infinite;
}
`

function nomSpriteShowdown(nomBrut) {
  let n = (nomBrut || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  const i = n.indexOf('-')
  if (i !== -1) n = n.slice(0, i + 1) + n.slice(i + 1).replace(/-/g, '')
  return n
}

function SpritePoke({ poke, style, anime = true }) {
  const nom = nomSpriteShowdown(poke.nom)
  const shiny = !!poke.shiny
  const dossierAnime = shiny ? 'ani-shiny' : 'ani'
  const urlAnime = `https://play.pokemonshowdown.com/sprites/${dossierAnime}/${nom}.gif`
  const dossierHd = shiny ? 'official-artwork/shiny' : 'official-artwork'
  const urlHd = poke.id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${dossierHd}/${poke.id}.png` : null
  const fallback = poke.sprite
  const onError = (e) => {
    const img = e.currentTarget
    const etape = parseInt(img.dataset.etape || '0', 10)
    if (etape === 0 && urlHd) { img.dataset.etape = '1'; img.src = urlHd }
    else if (etape <= 1 && fallback) { img.dataset.etape = '2'; img.src = fallback }
  }
  return (
    <img
      src={anime ? urlAnime : (fallback || urlHd)}
      alt={poke.nom}
      style={style}
      data-etape="0"
      loading="lazy"
      onError={onError}
    />
  )
}

const COULEURS_TYPE = {
  normal: '#9099a1', fire: '#ff9d55', water: '#4d90d5', electric: '#f4d23c',
  grass: '#63bb5b', ice: '#73cec0', fighting: '#ce4069', poison: '#ab6ac8',
  ground: '#d97746', flying: '#8fa8dd', psychic: '#fa7179', bug: '#90c12c',
  rock: '#c7b78b', ghost: '#5269ac', dragon: '#0b6dc3', dark: '#5a5366',
  steel: '#5a8ea1', fairy: '#ec8fe6',
}

// Icône SVG par rôle (bouclier=Tank, épée=DPS, œil=Éclaireur, cœur=Soutien, losange=Joker).
// Reçoit la couleur et la taille. Trait épais, lisible en petit.
function IconeRole({ role, couleur = '#fff', taille = 14 }) {
  const p = { fill: 'none', stroke: couleur, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const wrap = (children) => (
    <svg width={taille} height={taille} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>{children}</svg>
  )
  switch (role) {
    case 'tank':
      return wrap(<path {...p} d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" fill={couleur} fillOpacity="0.18" />)
    case 'dps':
      return wrap(<g {...p}><path d="M14.5 4.5L20 4l-.5 5.5-9 9-4.5.5-.5-4.5 9-9z" fill={couleur} fillOpacity="0.18" /><path d="M5 19l3-3" /></g>)
    case 'eclaireur':
      return wrap(<g {...p}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" fill={couleur} fillOpacity="0.15" /><circle cx="12" cy="12" r="2.6" fill={couleur} /></g>)
    case 'soutien':
      return wrap(<path {...p} d="M12 20s-7-4.5-7-9.5C5 7 7 5.5 9 5.5c1.6 0 2.6.9 3 1.8.4-.9 1.4-1.8 3-1.8 2 0 4 1.5 4 5 0 5-7 9.5-7 9.5z" fill={couleur} fillOpacity="0.18" />)
    case 'joker':
      return wrap(<path {...p} d="M12 2l4 10-4 10-4-10 4-10z" fill={couleur} fillOpacity="0.18" />)
    default:
      return wrap(<circle {...p} cx="12" cy="12" r="7" fill={couleur} fillOpacity="0.18" />)
  }
}

// Icône SVG par passif (3 formes distinctes selon la position dans le rôle).
function IconePassif({ index, couleur = '#fff', taille = 14 }) {
  const p = { fill: 'none', stroke: couleur, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const wrap = (children) => (
    <svg width={taille} height={taille} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>{children}</svg>
  )
  const i = ((index % 3) + 3) % 3
  if (i === 0) return wrap(<g {...p}><circle cx="12" cy="12" r="8" fill={couleur} fillOpacity="0.18" /><path d="M12 8v8M8 12h8" /></g>) // renfort (+)
  if (i === 1) return wrap(<path {...p} d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" fill={couleur} fillOpacity="0.18" />) // bouclier
  return wrap(<polygon {...p} points="12,3 14.5,9 21,9 15.5,13 17.5,20 12,16 6.5,20 8.5,13 3,9 9.5,9" fill={couleur} fillOpacity="0.18" />) // étoile
}



function urlCarte(c) {
  if (!c) return null
  return c.imageSmall || c.image || c.imageUrl || c.img || null
}
function nomCarte(c) {
  if (!c) return ''
  return c.nom || c.name || ''
}
function couleurFinition(finition) {
  if (finition === 'prismatique') return '#c084fc'
  if (finition === 'brillante') return '#cfd8e3'
  return '#2a3242'
}
const COULEURS_PALIER = {
  1: '#9ca3af', 2: '#22c55e', 3: '#3b82f6',
  4: '#a855f7', 5: '#ec4899', 6: '#f59e0b',
}
const NOMS_PALIER = {
  1: 'Commune', 2: 'Peu commune', 3: 'Rare',
  4: 'Ultra Rare', 5: 'Illustration', 6: 'Chromatique',
}
function couleurPalier(c) {
  if (c && c.palier && COULEURS_PALIER[c.palier]) return COULEURS_PALIER[c.palier]
  return couleurFinition(c && c.finition)
}

const ICONES_PIERRES = {
  'fire-stone': '/icons/fire-stone.png', 'water-stone': '/icons/water-stone.png',
  'thunder-stone': '/icons/thunder-stone.png', 'leaf-stone': '/icons/leaf-stone.png',
  'moon-stone': '/icons/moon-stone.png', 'sun-stone': '/icons/sun-stone.png',
  'shiny-stone': '/icons/shiny-stone.png', 'dusk-stone': '/icons/dusk-stone.png',
  'dawn-stone': '/icons/dawn-stone.png', 'ice-stone': '/icons/ice-stone.png',
}

// ============================================================
// STYLES (inline)
// ============================================================
const E = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,7,14,0.86)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14,
  },
  panneau: {
    width: 'min(96vw, 1180px)', maxHeight: '92vh', overflowY: 'auto', position: 'relative',
    background: 'radial-gradient(circle at 50% 0%, #14203f 0%, #080c1a 75%)',
    border: '2px solid rgba(120,160,255,0.3)', borderRadius: 18, padding: '20px 22px 24px',
    boxShadow: '0 22px 70px rgba(0,0,0,0.7)', color: '#e8ecf6', fontFamily: "'Rubik',system-ui,sans-serif",
  },
  halo: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180, pointerEvents: 'none',
    background: 'radial-gradient(circle at 50% 0%, rgba(99,179,237,0.12) 0%, transparent 70%)',
  },
  entete: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' },
  surTitre: { fontSize: 11, letterSpacing: 3, color: '#7fb0ff', fontWeight: 800 },
  titre: { fontSize: 23, fontWeight: 900, color: '#fff', textShadow: '0 0 18px rgba(127,176,255,0.45)', margin: 0 },
  fermer: { width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#cfd8e3', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  bouton: { border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 900, padding: '9px 16px', fontSize: 13 },
  boutonOr: { background: 'linear-gradient(180deg,#fcd34d,#e0a82e)', color: '#3a2800', boxShadow: '0 3px 0 #a87b1e' },
  recherche: {
    flex: 1, minWidth: 130, boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '8px 12px', color: '#e8ecf6', fontSize: 13, fontFamily: 'inherit',
  },
  select: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9,
    padding: '8px 10px', color: '#e8ecf6', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: 12 },
  grilleEquipe: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 18 },
  sectionTitre: { fontSize: 13, fontWeight: 800, color: '#fff', margin: '4px 0 10px', display: 'flex', alignItems: 'center', gap: 8 },
}

// ---- Carte Pokémon avec aura de rôle ----
function CartePoke({ poke, onClick, retirable, indexRetrait, onRetirerMembre }) {
  const role = poke.role || determinerRole(poke)
  const infoRole = ROLES[role]
  const couleur = infoRole ? infoRole.couleur : '#7fb0ff'
  return (
    <div className="eqp-carte" style={{
      position: 'relative', borderRadius: 14, padding: '10px 6px 8px', textAlign: 'center',
      background: `linear-gradient(180deg, ${rgba(couleur, 0.1)}, rgba(15,20,35,0.6))`,
      border: `1.5px solid ${rgba(couleur, 0.6)}`, boxShadow: `0 0 8px ${rgba(couleur, 0.18)}`,
    }}>
      {infoRole && <span title={infoRole.nom} style={{ position: 'absolute', top: 6, left: 7 }}><IconeRole role={role} couleur={couleur} taille={15} /></span>}
      {poke.shiny && <span className="eqp-shiny-glow" style={{ position: 'absolute', top: 5, right: 7, fontSize: 12 }}>✨</span>}
      <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ height: 66, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <SpritePoke poke={poke} style={{ maxWidth: 72, maxHeight: 66, objectFit: 'contain', imageRendering: 'pixelated' }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', marginTop: 4 }}>{poke.nom}</span>
        <span style={{ fontSize: 10, color: rgba(couleur, 0.95), fontWeight: 700 }}>N.{poke.niveau || 1} · {infoRole ? infoRole.nom : ''}</span>
      </button>
      {retirable && (
        <button onClick={() => onRetirerMembre(indexRetrait)} style={{
          marginTop: 6, width: '100%', border: '1px solid rgba(255,120,120,0.4)', background: 'rgba(255,80,80,0.12)',
          color: '#fca5a5', borderRadius: 7, padding: '3px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}>Retirer</button>
      )}
    </div>
  )
}

// ---- Indicateur de composition ----
function IndicateurCompo({ equipe }) {
  const compte = compterRoles(equipe)
  const valide = compositionValide(equipe)
  const nbSpeciaux = compterSpeciaux(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div style={{
      background: valide ? rgba('#5bc47f', 0.1) : rgba('#ef7d57', 0.1),
      border: `1px solid ${valide ? '#5bc47f' : '#ef7d57'}`, borderRadius: 12, padding: '10px 14px', marginBottom: 10,
    }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: valide ? '#5bc47f' : '#ef7d57', marginBottom: 8 }}>
        {valide ? '✓ Composition valide — prête au combat' : `Compo : 1 à 2 par rôle (chaque rôle présent) · ${MAX_SPECIAL} spécial max`}
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
        {ordre.map((role) => {
          const info = ROLES[role]
          const actuel = compte[role]
          const ok = actuel >= MIN_PAR_ROLE && actuel <= MAX_PAR_ROLE
          return (
            <span key={role} style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9,
              border: `1px solid ${info.couleur}`, color: info.couleur,
              background: rgba(info.couleur, ok ? 0.15 : 0.04), opacity: ok ? 1 : 0.55,
            }}>{info.emoji} {info.nom} {actuel}/{MAX_PAR_ROLE}</span>
          )
        })}
        {nbSpeciaux > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 9,
            border: '1px solid #d986ff', color: '#d986ff', background: rgba('#d986ff', nbSpeciaux <= MAX_SPECIAL ? 0.15 : 0.04),
          }}>🌟 Spécial {nbSpeciaux}/{MAX_SPECIAL}</span>
        )}
      </div>
    </div>
  )
}

// ---- Popup synergies ----
function PopupSynergies({ onFermer }) {
  return (
    <div style={{ ...E.overlay, zIndex: 400 }} onClick={onFermer}>
      <div style={{ ...E.panneau, maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div style={E.halo} />
        <div style={E.entete}>
          <h3 style={{ ...E.titre, fontSize: 19 }}>⚡ Comment marchent les synergies ?</h3>
          <button style={E.fermer} onClick={onFermer}>✕</button>
        </div>
        <p style={{ fontSize: 13, color: '#c3ccde', lineHeight: 1.5, position: 'relative' }}>
          Les synergies sont des <strong>bonus automatiques</strong> qui s'activent selon les <strong>rôles</strong> des Pokémon de ton équipe. Tu n'as rien à cliquer : dès que ta composition remplit la condition, le bonus s'applique en combat !
        </p>
        <p style={{ fontSize: 13, color: '#9aa6bd', lineHeight: 1.5, position: 'relative' }}>
          <strong>Exemple :</strong> 2 Éclaireurs + 1 DPS → la synergie <strong>Blitz</strong> s'active toute seule.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', marginTop: 8 }}>
          {Object.keys(SYNERGIES).map((cle) => {
            const s = SYNERGIES[cle]
            return (
              <div key={cle} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10,
                border: `1px solid ${rgba(s.couleur, 0.5)}`, background: rgba(s.couleur, 0.07),
              }}>
                <span style={{ fontSize: 18 }}>{s.emoji}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: s.couleur }}>{s.nom}</div>
                  <div style={{ fontSize: 12, color: '#9aa6bd' }}>{s.description}</div>
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 12, color: '#7a86a0', marginTop: 12, position: 'relative' }}>💡 Astuce : change le rôle d'un Pokémon avec un parchemin, ou utilise un Joker qui s'adapte.</p>
      </div>
    </div>
  )
}

// ---- Indicateur synergies (compact + dépliable) ----
function IndicateurSynergies({ equipe }) {
  const [popup, setPopup] = useState(false)
  const [deplie, setDeplie] = useState(false)
  const actives = synergiesActives(equipe)
  const clesActives = new Set(actives.map((s) => s.cle))
  const inactives = Object.keys(SYNERGIES).map((cle) => ({ cle, ...SYNERGIES[cle] })).filter((s) => !clesActives.has(s.cle))

  return (
    <div style={{ background: rgba('#d986ff', 0.07), border: `1px solid ${rgba('#d986ff', 0.4)}`, borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: actives.length > 0 ? 8 : 4 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#d986ff' }}>⚡ Synergies</span>
        <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 8px', borderRadius: 7, background: actives.length ? '#d986ff' : 'rgba(255,255,255,0.1)', color: actives.length ? '#2a0a3a' : '#9aa6bd' }}>
          {actives.length} active{actives.length > 1 ? 's' : ''}
        </span>
        <button onClick={() => setPopup(true)} title="Comment ça marche ?" style={{
          marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(217,134,255,0.6)',
          background: 'rgba(217,134,255,0.12)', color: '#d986ff', fontWeight: 900, fontSize: 12, cursor: 'pointer',
        }}>?</button>
      </div>

      {actives.length > 0 ? (
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
          {actives.map((s) => (
            <span key={s.cle} title={s.description} style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              border: `1px solid ${s.couleur}`, color: s.couleur, background: rgba(s.couleur, 0.12),
            }}>{s.emoji} {s.nom}</span>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 12, color: '#9aa6bd', margin: 0 }}>Aucune synergie active. Combine les rôles pour en débloquer (le « ? » explique tout).</p>
      )}

      <button onClick={() => setDeplie((v) => !v)} style={{
        marginTop: 8, background: 'none', border: 'none', color: '#aeb9cf', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0,
      }}>
        {deplie ? '▲ Masquer les autres' : `▼ Voir toutes les synergies (${inactives.length} à débloquer)`}
      </button>

      {deplie && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {inactives.map((s) => {
            const manque = manquePourSynergie(equipe, s.cle)
            return (
              <div key={s.cle} title={s.description} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 9,
                border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', opacity: 0.75,
              }}>
                <span style={{ fontSize: 14 }}>{s.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.couleur }}>{s.nom}</span>
                <span style={{ fontSize: 11, color: '#9aa6bd', flex: 1 }}>{s.description}</span>
                <span style={{ fontSize: 10, color: '#7a86a0' }}>{manque}</span>
              </div>
            )
          })}
        </div>
      )}

      {popup && <PopupSynergies onFermer={() => setPopup(false)} />}
    </div>
  )
}

// ---- Barre de stat ----
function BarreStat({ label, valeur, pctMax, couleur }) {
  const pct = Math.max(8, Math.min(100, pctMax))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#9aa6bd', width: 34 }}>{label}</span>
      <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="eqp-fill eqp-bar" style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${rgba(couleur, 0.55)}, ${couleur})`, borderRadius: 6, boxShadow: `0 0 5px ${rgba(couleur, 0.4)}` }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#e8ecf6', width: 36, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{valeur}</span>
    </div>
  )
}

function BarreIV({ label, valeur }) {
  const v = Math.max(0, Math.min(STAT_MAX_IV, valeur || 0))
  const pct = (v / STAT_MAX_IV) * 100
  const couleur = v >= 28 ? '#34d399' : v >= 20 ? '#a3e635' : v >= 12 ? '#fcd34d' : v >= 6 ? '#fb923c' : '#ef6868'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#9aa6bd', width: 34 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="eqp-fill" style={{ width: `${Math.max(4, pct)}%`, height: '100%', background: `linear-gradient(90deg, ${rgba(couleur, 0.6)}, ${couleur})`, borderRadius: 5, boxShadow: `0 0 8px ${rgba(couleur, 0.5)}` }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 800, color: couleur, width: 42, textAlign: 'right' }}>{v}/{STAT_MAX_IV}</span>
    </div>
  )
}

function IconeObjet({ id, taille = 24 }) {
  const o = OBJETS[id]
  if (!o) return null
  if (o.sprite) {
    return <img src={o.sprite} alt={o.nom} style={{ width: taille, height: taille, objectFit: 'contain' }} onError={(e) => { e.target.replaceWith(Object.assign(document.createElement('span'), { textContent: o.emoji })) }} />
  }
  return <span style={{ fontSize: taille * 0.8 }}>{o.emoji}</span>
}

// Bloc section reutilisable (barre-accent coloree a gauche du titre).
function Section({ titre, accent = '#fcd34d', children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px', marginBottom: 12 }}>
      {titre && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <span style={{ width: 4, height: 15, borderRadius: 2, background: accent, boxShadow: `0 0 8px ${rgba(accent, 0.7)}`, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff', letterSpacing: 0.3 }}>{titre}</span>
        </div>
      )}
      {children}
    </div>
  )
}

function Fiche({ pokemon, pierres, objets = {}, parchemins = {}, cartesTCG = [], onChoisirSocle, onEquiperObjet, onEvoluerPierre, onChoisirPassif, onChoisirCaseJoker, onAppliquerParchemin, onRetour }) {
  const [grilleOuverte, setGrilleOuverte] = useState(false)
  const [styleOuvert, setStyleOuvert] = useState(false)
  const iv = pokemon.iv || { pv: 0, attaque: 0, vitesse: 0, defense: 0 }
  const niv = pokemon.niveau || 1
  const requise = xpRequise(niv, XP_BASE_NIVEAU)
  const xp = pokemon.xp || 0
  const pourcentageXP = Math.min(100, (xp / requise) * 100)

  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]
  const couleurRole = infoRole ? infoRole.couleur : '#7fb0ff'
  const types = pokemon.types || []

  const joker = estJoker(pokemon)
  const caseActuelle = roleEffectif(pokemon)
  const passifsChoix = passifsDuRole(role)
  const passifParModeActuel = {
    principal: passifPourMode(pokemon, 'principal'),
    arene: passifPourMode(pokemon, 'arene'),
    pvp: passifPourMode(pokemon, 'pvp'),
  }

  const pvMax = pokemon.pvMax ?? 0
  const attaque = pokemon.attaque ?? 0
  const vitesse = pokemon.vitesse ?? 0
  const defense = pokemon.defense ?? 0
  const statMax = Math.max(pvMax, attaque, vitesse, defense, 1)

  const objetEquipe = pokemon.objetEquipe && OBJETS[pokemon.objetEquipe] ? OBJETS[pokemon.objetEquipe] : null
  const objetsDispo = Object.entries(objets).filter(([id, n]) => n > 0 && id !== pokemon.objetEquipe && OBJETS[id])
  const evosPierre = (pokemon.evolutionsPierre || []).filter((e) => (pierres[e.pierre] || 0) > 0)

  const socleActuel = pokemon.socleCarte || null
  const baseEspece = (pokemon.nom || '').toLowerCase().split('-')[0]
  const cartesEspece = (() => {
    const source = Array.isArray(cartesTCG) ? cartesTCG : []
    const filtrees = pokemon.estFusion ? source : source.filter((c) => nomCarte(c).toLowerCase().includes(baseEspece))
    const vues = new Set()
    const uniques = []
    for (const c of filtrees) {
      const cle = (c && c.id) || `${nomCarte(c)}|${c?.setNom || c?.set || ''}|${c?.finition || ''}`
      if (!cle || vues.has(cle)) continue
      vues.add(cle)
      if (urlCarte(c)) uniques.push(c)
    }
    return uniques
  })()

  const btnMini = { border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: '#cfd8e3', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }

  // Total IV pour le badge qualité du hero.
  const totalIV = (iv.pv || 0) + (iv.attaque || 0) + (iv.vitesse || 0) + (iv.defense || 0)
  const pctQualiteHero = Math.round((totalIV / (STAT_MAX_IV * 4)) * 100)
  const couleurQualiteHero = pctQualiteHero >= 80 ? '#34d399' : pctQualiteHero >= 55 ? '#fcd34d' : pctQualiteHero >= 30 ? '#fb923c' : '#ef6868'

  return (
    <div>
      <style>{EQP_CSS}</style>
      <button onClick={onRetour} style={{ ...btnMini, marginBottom: 12 }}>← Retour</button>

      {/* ===== HERO ===== */}
      <div className="eqp-rise" style={{
        position: 'relative', overflow: 'hidden', marginBottom: 16, padding: '20px 20px 18px', borderRadius: 18,
        background: `radial-gradient(circle at 26% 40%, ${rgba(couleurRole, 0.16)} 0%, transparent 60%), linear-gradient(135deg, rgba(20,28,48,0.9), rgba(10,14,26,0.95))`,
        border: `1.5px solid ${rgba(couleurRole, 0.7)}`, boxShadow: `0 0 16px ${rgba(couleurRole, 0.2)}`,
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap', position: 'relative' }}>
          {/* Sprite + halo + anneau */}
          <div style={{ position: 'relative', width: 150, height: 150, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="eqp-hero-aura" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${rgba(couleurRole, 0.25)} 0%, transparent 65%)` }} />
            <div className="eqp-hero-ring" style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `1.5px dashed ${rgba(couleurRole, 0.35)}` }} />
            <SpritePoke poke={pokemon} style={{ position: 'relative', maxWidth: 128, maxHeight: 128, objectFit: 'contain', imageRendering: 'pixelated', filter: `drop-shadow(0 4px 8px ${rgba(couleurRole, 0.35)})` }} />
            {pokemon.shiny && <span className="eqp-shiny-glow" style={{ position: 'absolute', top: 6, right: 10, fontSize: 22 }}>✨</span>}
          </div>

          {/* Identité */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
              <span className="eqp-shine" style={{ fontSize: 30, fontWeight: 900 }}>{pokemon.nom}</span>
              <span style={{ fontSize: 13, color: '#9aa6bd', fontWeight: 700 }}>N°{String(pokemon.id).padStart(3, '0')}</span>
            </div>
            {infoRole && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '5px 14px', borderRadius: 20, border: `2px solid ${couleurRole}`, background: rgba(couleurRole, 0.16), color: couleurRole, fontWeight: 800, fontSize: 13 }}>
                <IconeRole role={role} couleur={couleurRole} taille={16} />
                {infoRole.nom}{joker ? ' (Joker)' : ''}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {types.map((t) => (
                <span key={t} style={{ fontSize: 12, fontWeight: 800, color: '#0d1117', background: COULEURS_TYPE[t] || '#777', borderRadius: 7, padding: '3px 12px', textTransform: 'capitalize', boxShadow: `0 2px 8px ${rgba(COULEURS_TYPE[t] || '#777', 0.5)}` }}>{t}</span>
              ))}
            </div>
            {/* Mini-stats rapides */}
            <div style={{ display: 'flex', gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: 10, color: '#8696b0', fontWeight: 700 }}>NIVEAU</div><div style={{ fontSize: 20, fontWeight: 900, color: '#fcd34d' }}>{niv}</div></div>
              <div><div style={{ fontSize: 10, color: '#8696b0', fontWeight: 700 }}>PV</div><div style={{ fontSize: 20, fontWeight: 900, color: '#34d399' }}>{pvMax}</div></div>
              <div><div style={{ fontSize: 10, color: '#8696b0', fontWeight: 700 }}>ATT</div><div style={{ fontSize: 20, fontWeight: 900, color: '#fb923c' }}>{attaque}</div></div>
              <div><div style={{ fontSize: 10, color: '#8696b0', fontWeight: 700 }}>POTENTIEL</div><div style={{ fontSize: 20, fontWeight: 900, color: couleurQualiteHero }}>{pctQualiteHero}%</div></div>
            </div>
          </div>
        </div>
        {/* Barre XP intégrée au hero */}
        <div style={{ marginTop: 16, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9aa6bd', marginBottom: 4 }}>
            <span>Expérience</span><span>{xp} / {requise}</span>
          </div>
          <div style={{ height: 9, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="eqp-fill eqp-bar" style={{ width: `${pourcentageXP}%`, height: '100%', background: 'linear-gradient(90deg,#b8860b,#fcd34d)', borderRadius: 5, boxShadow: '0 0 12px rgba(252,211,77,0.7)' }} />
          </div>
        </div>
      </div>

      {/* Parchemins */}
      {(() => {
        const possedes = Object.entries(PARCHEMINS).filter(([cle]) => (parchemins[cle] || 0) > 0)
        if (possedes.length === 0) return null
        const roleActuel = pokemon.roleForce || pokemon.role
        return (
          <Section titre="Changer le rôle (parchemin)" accent="#41a6f6">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {possedes.map(([cle, info]) => {
                const dejaCeRole = roleActuel === info.role
                const c = ROLES[info.role]?.couleur || '#888'
                return (
                  <button key={cle} disabled={dejaCeRole}
                    title={dejaCeRole ? `Déjà ${ROLES[info.role]?.nom}` : info.description}
                    onClick={() => { if (onAppliquerParchemin) onAppliquerParchemin(pokemon.uid, cle) }}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 12px', borderRadius: 10,
                      border: `1.5px solid ${c}`, background: rgba(c, 0.1), color: '#e8ecf6', cursor: dejaCeRole ? 'default' : 'pointer',
                      opacity: dejaCeRole ? 0.4 : 1,
                    }}>
                    <IconeRole role={info.role} couleur={c} taille={18} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{ROLES[info.role]?.nom || info.role}</span>
                    <span style={{ fontSize: 10, color: '#9aa6bd' }}>×{parchemins[cle]}</span>
                  </button>
                )
              })}
            </div>
          </Section>
        )
      })()}

      {/* Joker */}
      {joker && (
        <Section titre="Case du Joker (rôle joué en combat)" accent="#d986ff">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CASES_JOKER.map((cle) => {
              const info = ROLES[cle]
              const actif = cle === caseActuelle
              return (
                <button key={cle} onClick={() => { if (!actif && onChoisirCaseJoker) onChoisirCaseJoker(pokemon.uid, cle) }}
                  title={`Faire jouer ce Joker comme ${info.nom}`}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 14px', borderRadius: 10,
                    border: `2px solid ${info.couleur}`, background: rgba(info.couleur, actif ? 0.22 : 0.06), color: '#e8ecf6', cursor: 'pointer',
                    boxShadow: actif ? `0 0 14px ${rgba(info.couleur, 0.5)}` : 'none',
                  }}>
                  <IconeRole role={cle} couleur={info.couleur} taille={18} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: info.couleur }}>{info.nom}</span>
                </button>
              )
            })}
          </div>
        </Section>
      )}

      {/* Passifs par mode */}
      {passifsChoix.length > 0 && (
        <Section titre={`Passifs ${infoRole ? '— ' + infoRole.nom : ''}${joker ? ' (Joker : tous)' : ''}`} accent={couleurRole}>
          <p style={{ fontSize: 12, color: '#9aa6bd', margin: '0 0 10px' }}>Choisis un passif par mode de jeu :</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {[
              { mode: 'principal', label: 'Principal' },
              { mode: 'arene', label: 'Arène' },
              { mode: 'pvp', label: 'PvP' },
            ].map(({ mode, label }) => (
              <div key={mode}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#cfd8e3', marginBottom: 6 }}>{label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {passifsChoix.map((p, pi) => {
                    const actif = p.cle === passifParModeActuel[mode]
                    return (
                      <button key={p.cle} onClick={() => { if (!actif && onChoisirPassif) onChoisirPassif(pokemon.uid, p.cle, mode) }}
                        title={p.description}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, padding: '6px 10px', borderRadius: 8,
                          border: `1.5px solid ${actif ? couleurRole : 'rgba(255,255,255,0.12)'}`,
                          background: actif ? rgba(couleurRole, 0.18) : 'rgba(255,255,255,0.03)', color: '#e8ecf6', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                        }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                          <IconePassif index={pi} couleur={actif ? couleurRole : '#8696b0'} taille={15} />
                          {p.nom}
                        </span>
                        {actif && <span style={{ color: couleurRole }}>✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {passifsChoix.map((p, pi) => (
              <div key={p.cle} style={{ fontSize: 11, color: '#9aa6bd' }}>
                <span style={{ fontWeight: 700, color: '#cfd8e3', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <IconePassif index={pi} couleur={couleurRole} taille={14} />
                  {p.nom}
                </span> — {p.description}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Stats + IV côte à côte (responsive) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <Section titre="Statistiques" accent="#60a5fa">
          <BarreStat label="PV" valeur={pvMax} pctMax={(pvMax / statMax) * 100} couleur="#34d399" />
          <BarreStat label="ATT" valeur={attaque} pctMax={(attaque / statMax) * 100} couleur="#fb923c" />
          <BarreStat label="VIT" valeur={vitesse} pctMax={(vitesse / statMax) * 100} couleur="#60a5fa" />
          <BarreStat label="DÉF" valeur={defense} pctMax={(defense / statMax) * 100} couleur="#a78bfa" />
        </Section>

        {(() => {
          const total = (iv.pv || 0) + (iv.attaque || 0) + (iv.vitesse || 0) + (iv.defense || 0)
          const pctQualite = Math.round((total / (STAT_MAX_IV * 4)) * 100)
          const couleurQualite = pctQualite >= 80 ? '#34d399' : pctQualite >= 55 ? '#fcd34d' : pctQualite >= 30 ? '#fb923c' : '#ef6868'
          return (
            <Section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fcd34d' }}>Potentiel (IV)</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: couleurQualite }}>{total}/{STAT_MAX_IV * 4} · {pctQualite}%</span>
              </div>
              <BarreIV label="PV" valeur={iv.pv} />
              <BarreIV label="ATT" valeur={iv.attaque} />
              <BarreIV label="VIT" valeur={iv.vitesse} />
              <BarreIV label="DÉF" valeur={iv.defense} />
            </Section>
          )
        })()}
      </div>

      {/* Socle-carte TCG */}
      {onChoisirSocle && (
        <Section titre="Style — Socle de combat" accent="#ec4899">
          <p style={{ fontSize: 12, color: '#9aa6bd', margin: '0 0 10px' }}>
            La carte posée sous ce Pokémon sur le terrain. {pokemon.estFusion ? 'Fusion : toutes tes cartes sont autorisées !' : 'Seules tes cartes de cette espèce sont proposées — drop-en dans la Tour !'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              width: 64, height: 89, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
              border: socleActuel ? `2px solid ${couleurFinition(socleActuel.finition) === '#2a3242' ? '#fcd34d' : couleurFinition(socleActuel.finition)}` : '1px dashed rgba(255,255,255,0.3)',
              background: '#1c2434', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {socleActuel && urlCarte(socleActuel)
                ? <img src={urlCarte(socleActuel)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" />
                : <span style={{ fontSize: 10, color: '#7a87a0', textAlign: 'center', padding: 4 }}>Dos de carte (défaut)</span>}
            </div>
            <div style={{ flex: 1, minWidth: 170 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{socleActuel ? nomCarte(socleActuel) : 'Dos de carte par défaut'}</div>
              {socleActuel && socleActuel.finition && socleActuel.finition !== 'normale' && (
                <div style={{ fontSize: 11, color: couleurFinition(socleActuel.finition), fontWeight: 700 }}>
                  {socleActuel.finition === 'prismatique' ? 'Prismatique' : 'Brillante'}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                <button style={btnMini} onClick={() => setStyleOuvert((v) => !v)}>{styleOuvert ? 'Fermer' : `Choisir une carte (${cartesEspece.length})`}</button>
                {socleActuel && <button style={btnMini} onClick={() => { onChoisirSocle(pokemon.uid, null); setStyleOuvert(false) }}>Remettre le dos</button>}
              </div>
            </div>
          </div>
          {styleOuvert && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
              <button onClick={() => { onChoisirSocle(pokemon.uid, null); setStyleOuvert(false) }} title="Dos de carte classique"
                style={{ width: 84, cursor: 'pointer', borderRadius: 8, padding: 4, border: !socleActuel ? '2px solid #fcd34d' : '1px solid #2a3242', background: '#141a26', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 72, height: 100, borderRadius: 5, background: 'linear-gradient(160deg, #3470c4 0%, #2a5fb0 45%, #1d4a92 100%)', border: '3px solid #f0e6c8', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '46%', aspectRatio: '1', borderRadius: '50%', background: '#1c4486', border: '2px solid #f0e6c8' }} />
                </div>
                <span style={{ fontSize: 10, color: '#9ca8bd' }}>Dos (défaut)</span>
              </button>
              {cartesEspece.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                  <span style={{ fontSize: 12, color: '#7a87a0' }}>Aucune carte de {pokemon.nom} dans ta collection — la Tour t'attend !</span>
                </div>
              ) : (
                cartesEspece.map((c, idx) => {
                  const cleC = (c && c.id) || `${nomCarte(c)}-${idx}`
                  const choisie = socleActuel && ((socleActuel.id && socleActuel.id === c.id) || (urlCarte(socleActuel) === urlCarte(c)))
                  const carteMin = { id: c.id || null, nom: nomCarte(c).slice(0, 40), imageSmall: urlCarte(c), finition: c.finition || 'normale', rarete: c.rarete || null, setNom: c.setNom || c.set || null }
                  return (
                    <button key={cleC} onClick={() => { onChoisirSocle(pokemon.uid, carteMin); setStyleOuvert(false) }}
                      title={`${nomCarte(c)}${c.setNom ? ' — ' + c.setNom : ''}`}
                      style={{ width: 84, cursor: 'pointer', borderRadius: 8, padding: 4, border: choisie ? '2px solid #fcd34d' : `2px solid ${couleurPalier(c)}`, boxShadow: choisie ? '0 0 10px #fcd34d' : (c.palier >= 4 ? `0 0 9px ${couleurPalier(c)}` : 'none'), background: '#141a26', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <img src={urlCarte(c)} alt={nomCarte(c)} style={{ width: 72, height: 100, objectFit: 'cover', borderRadius: 5, display: 'block' }} loading="lazy"
                        onError={(e) => { const b = e.currentTarget.closest('button'); if (b) b.style.display = 'none' }} />
                      <span style={{ fontSize: 9, color: couleurPalier(c), textAlign: 'center', lineHeight: 1.2, fontWeight: 700 }}>{choisie ? '✓ Choisie' : (c.palier ? NOMS_PALIER[c.palier] : nomCarte(c).slice(0, 14))}</span>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </Section>
      )}

      {/* Objet équipé */}
      <Section titre="Objet équipé" accent="#9aa6bd">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setGrilleOuverte((v) => !v)} title={objetEquipe ? 'Changer / retirer' : 'Équiper un objet'}
            style={{ width: 48, height: 48, borderRadius: 10, border: `1.5px solid ${objetEquipe ? '#fcd34d' : 'rgba(255,255,255,0.2)'}`, background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {objetEquipe ? <IconeObjet id={pokemon.objetEquipe} taille={30} /> : <span style={{ fontSize: 24, color: '#7a86a0' }}>+</span>}
          </button>
          <div style={{ flex: 1 }}>
            {objetEquipe ? (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{objetEquipe.nom}</div>
                <div style={{ fontSize: 11, color: '#9aa6bd' }}>{objetEquipe.desc}</div>
                <button style={{ ...btnMini, marginTop: 4, padding: '3px 10px' }} onClick={() => onEquiperObjet(pokemon.uid, null)}>Retirer</button>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#7a86a0' }}>Aucun objet — clique le slot pour en équiper un</span>
            )}
          </div>
        </div>
        {grilleOuverte && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {objetsDispo.length > 0 ? objetsDispo.map(([id, n]) => (
              <button key={id} onClick={() => { onEquiperObjet(pokemon.uid, id); setGrilleOuverte(false) }} title={`${OBJETS[id].nom} — ${OBJETS[id].desc}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 10px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)', cursor: 'pointer', minWidth: 64 }}>
                <IconeObjet id={id} taille={26} />
                <span style={{ fontSize: 10, color: '#cfd8e3', fontWeight: 700 }}>{OBJETS[id].nom}</span>
                <span style={{ fontSize: 9, color: '#9aa6bd' }}>×{n}</span>
              </button>
            )) : <p style={{ fontSize: 12, color: '#7a86a0' }}>Aucun objet disponible dans ton sac.</p>}
          </div>
        )}
      </Section>

      {/* Évolution par pierre */}
      {evosPierre.length > 0 && (
        <Section titre="Évolution par pierre" accent="#34d399">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {evosPierre.map((e) => {
              const infoPierre = PIERRES[e.pierre]
              return (
                <button key={e.pierre} onClick={() => onEvoluerPierre(pokemon.uid, e.evolueEn, e.pierre)}
                  title={`Utiliser une ${infoPierre ? infoPierre.nom : e.pierre}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(252,211,77,0.4)', background: 'rgba(252,211,77,0.08)', color: '#e8ecf6', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  {ICONES_PIERRES[e.pierre]
                    ? <img src={ICONES_PIERRES[e.pierre]} alt="" style={{ width: 22, height: 22 }} />
                    : <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 7px rgba(52,211,153,0.7)' }} />} → {e.evolueEn} (x{pierres[e.pierre] || 0})
                </button>
              )
            })}
          </div>
        </Section>
      )}
    </div>
  )
}

function Equipe({ equipe, collection, pierres = {}, objets = {}, parchemins = {}, collectionCartesTCG = [], onChoisirSocle, onEquiperObjet, onEvoluerPierre, onChoisirPassif, onChoisirCaseJoker, onAppliquerParchemin, onAjouterMembre, onRetirerMembre, onAutoEquipe, onFermer }) {
  const [selection, setSelection] = useState(null)
  const [ajoutEnCours, setAjoutEnCours] = useState(false)
  const [tri, setTri] = useState('numero')
  const [typeFiltre, setTypeFiltre] = useState('tous')
  const [roleFiltre, setRoleFiltre] = useState('tous')
  const [recherche, setRecherche] = useState('')
  const [shinyOnly, setShinyOnly] = useState(false)

  const uidsEquipe = equipe.map((p) => p.uid)
  const famillesEquipe = equipe.map((p) => p.familleId).filter((f) => f != null)
  const NB_SLOTS = 6
  const slotsVides = NB_SLOTS - equipe.length
  const typesDispo = ['tous', ...Array.from(new Set(collection.flatMap((p) => p.types || []))).sort()]

  function trierFiltrer(liste) {
    let resultat = [...liste]
    if (recherche.trim() !== '') {
      const q = recherche.trim().toLowerCase()
      resultat = resultat.filter((p) => (p.nom || '').toLowerCase().includes(q))
    }
    if (shinyOnly) resultat = resultat.filter((p) => p.shiny)
    if (typeFiltre !== 'tous') resultat = resultat.filter((p) => (p.types || []).includes(typeFiltre))
    if (roleFiltre !== 'tous') resultat = resultat.filter((p) => (p.role || determinerRole(p)) === roleFiltre)
    if (tri === 'numero') resultat.sort((a, b) => a.id - b.id)
    else if (tri === 'niveau') resultat.sort((a, b) => (b.niveau || 1) - (a.niveau || 1))
    else if (tri === 'nom') resultat.sort((a, b) => a.nom.localeCompare(b.nom))
    else if (tri === 'rarete') {
      const ordreRarete = { legendaire: 4, tresRare: 3, rare: 2, commun: 1 }
      resultat.sort((a, b) => (ordreRarete[b.rarete] || 0) - (ordreRarete[a.rarete] || 0))
    }
    return resultat
  }

  const barreTriFiltre = (
    <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
      <input type="text" style={E.recherche} placeholder="🔍 Rechercher..."
        value={recherche} onChange={(e) => setRecherche(e.target.value)} onClick={(e) => e.stopPropagation()} />
      <select style={E.select} value={tri} onChange={(e) => setTri(e.target.value)}>
        <option value="numero">Tri : N°</option>
        <option value="niveau">Tri : Niveau</option>
        <option value="nom">Tri : Nom</option>
        <option value="rarete">Tri : Rareté</option>
      </select>
      <select style={E.select} value={typeFiltre} onChange={(e) => setTypeFiltre(e.target.value)}>
        {typesDispo.map((t) => (<option key={t} value={t}>{t === 'tous' ? 'Type : tous' : `Type : ${t}`}</option>))}
      </select>
      <select style={E.select} value={roleFiltre} onChange={(e) => setRoleFiltre(e.target.value)}>
        <option value="tous">Rôle : tous</option>
        {Object.entries(ROLES).map(([cle, info]) => (<option key={cle} value={cle}>{info.emoji} {info.nom}</option>))}
      </select>
      <button onClick={(e) => { e.stopPropagation(); setShinyOnly((v) => !v) }} title="Afficher seulement les shinies"
        style={{ ...E.select, fontWeight: 700, border: shinyOnly ? '1px solid #fcd34d' : '1px solid rgba(255,255,255,0.15)', color: shinyOnly ? '#fcd34d' : '#e8ecf6', background: shinyOnly ? 'rgba(252,211,77,0.12)' : 'rgba(255,255,255,0.06)' }}>✨ Shiny</button>
    </div>
  )

  // Écran "Ajouter à l'équipe"
  if (ajoutEnCours) {
    const dispoBrut = collection.filter((p) => !uidsEquipe.includes(p.uid) && !famillesEquipe.includes(p.familleId))
    const dispo = trierFiltrer(dispoBrut)
    return (
      <div style={E.overlay} onClick={onFermer}>
        <div className="eqp-scroll" style={E.panneau} onClick={(e) => e.stopPropagation()}>
          <div style={E.halo} />
          <div style={E.entete}>
            <div>
              <div style={E.surTitre}>⬡ RENFORT</div>
              <h2 style={E.titre}>Ajouter à l'équipe</h2>
            </div>
            <button style={E.fermer} onClick={() => setAjoutEnCours(false)}>✕</button>
          </div>
          <IndicateurCompo equipe={equipe} />
          {barreTriFiltre}
          <div style={E.grille}>
            {dispo.length === 0 ? (
              <p style={{ color: '#7a86a0', fontSize: 13, gridColumn: '1 / -1' }}>Aucun Pokémon disponible (vérifie les filtres).</p>
            ) : (
              dispo.map((poke) => (
                <CartePoke key={poke.uid} poke={poke} onClick={() => { onAjouterMembre(poke); setAjoutEnCours(false) }} />
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // Écran "Fiche détaillée"
  if (selection) {
    const pokemonAJour = collection.find((p) => p.uid === selection.uid) || selection
    return (
      <div style={E.overlay} onClick={onFermer}>
        <div className="eqp-scroll" style={E.panneau} onClick={(e) => e.stopPropagation()}>
          <div style={E.halo} />
          <div style={E.entete}>
            <div>
              <div style={E.surTitre}>⬡ FICHE POKÉMON</div>
              <h2 style={E.titre}>Détails</h2>
            </div>
            <button style={E.fermer} onClick={onFermer}>✕</button>
          </div>
          <Fiche pokemon={pokemonAJour} pierres={pierres} objets={objets} parchemins={parchemins}
            cartesTCG={collectionCartesTCG} onChoisirSocle={onChoisirSocle}
            onEquiperObjet={onEquiperObjet} onEvoluerPierre={onEvoluerPierre} onChoisirPassif={onChoisirPassif}
            onChoisirCaseJoker={onChoisirCaseJoker} onAppliquerParchemin={onAppliquerParchemin}
            onRetour={() => setSelection(null)} />
        </div>
      </div>
    )
  }

  const collectionAffichee = trierFiltrer(collection)

  // Écran principal
  return (
    <div style={E.overlay} onClick={onFermer}>
      <style>{EQP_CSS}</style>
      <div className="eqp-scroll" style={E.panneau} onClick={(e) => e.stopPropagation()}>
        <div style={E.halo} />
        <div style={E.entete}>
          <div>
            <div style={E.surTitre}>⬡ MON ÉQUIPE</div>
            <h2 style={E.titre}>Équipe active <span style={{ fontSize: 15, color: '#8fa3c0' }}>{equipe.length}/{NB_SLOTS}</span></h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {onAutoEquipe && <button style={{ ...E.bouton, ...E.boutonOr }} onClick={onAutoEquipe}>⚡ Auto-équipe</button>}
            <button style={E.fermer} onClick={onFermer}>✕</button>
          </div>
        </div>

        <IndicateurCompo equipe={equipe} />
        <IndicateurSynergies equipe={equipe} />
        <p style={{ fontSize: 12, color: '#9aa6bd', margin: '0 0 12px' }}>Les changements s'appliquent au prochain combat. Règle : 1 à 2 Pokémon par rôle, les 4 rôles présents · 1 spécial max.</p>

        <div style={E.grilleEquipe}>
          {equipe.map((poke, i) => (
            <CartePoke key={poke.uid} poke={poke} onClick={() => setSelection(poke)} retirable={equipe.length > 1} indexRetrait={i} onRetirerMembre={onRetirerMembre} />
          ))}
          {Array.from({ length: slotsVides }).map((_, i) => (
            <button key={`vide-${i}`} className="eqp-slot-vide" onClick={() => setAjoutEnCours(true)}
              style={{ borderRadius: 14, border: '2px dashed rgba(127,176,255,0.4)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', minHeight: 130, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: '#7fb0ff' }}>
              <span style={{ fontSize: 30, lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>Ajouter</span>
            </button>
          ))}
        </div>

        <h3 style={{ ...E.sectionTitre, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14 }}>📦 Collection ({collectionAffichee.length})</h3>
        {barreTriFiltre}
        <div style={E.grille}>
          {collectionAffichee.length === 0 ? (
            <p style={{ color: '#7a86a0', fontSize: 13, gridColumn: '1 / -1' }}>Aucun Pokémon ne correspond (vérifie les filtres).</p>
          ) : (
            collectionAffichee.map((poke) => (
              <CartePoke key={poke.uid} poke={poke} onClick={() => setSelection(poke)} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function equipePropsEgales(prev, next) {
  if (prev.collection !== next.collection) return false
  if (prev.equipe !== next.equipe) return false
  if (prev.pierres !== next.pierres) return false
  if (prev.objets !== next.objets) return false
  if (prev.parchemins !== next.parchemins) return false
  if (prev.collectionCartesTCG !== next.collectionCartesTCG) return false
  return true
}

export default memo(Equipe, equipePropsEgales)