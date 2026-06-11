import { useState } from 'react'
import {
  PALIERS_GLOBAUX,
  PALIERS_GENERATION,
  GENERATIONS as GENS_RECOMP,
  compteGeneration,
  decrireGains,
} from './recompenses'
import { SPECIAUX, SPECIAUX_RAID, TOUS_SPECIAUX, spriteSpecial } from './speciaux'
import { nomShowdown } from './pokedexNoms'
import { urlSpriteFusionSecours } from './fusion'
import { trouverFusion } from './fusionsDisponibles'

// ============================================================
// POKEDEX — REFONTE PREMIUM (fond sombre, auras, animations).
// 100% inline + classes prefixe "pkd-" (PAS "pkx-") pour ne PAS
// heriter des 176 regles .pkx- d'App.css. Zero impact App.css.
// Toute la logique conservee (modes, filtres, completion, survol).
// ============================================================

const TOTAL_POKEDEX = 1025
const TOTAL_SPECIAUX = TOUS_SPECIAUX.length

const GENERATIONS = [
  { nom: 'Gen 1', debut: 1, fin: 151 },
  { nom: 'Gen 2', debut: 152, fin: 251 },
  { nom: 'Gen 3', debut: 252, fin: 386 },
  { nom: 'Gen 4', debut: 387, fin: 493 },
  { nom: 'Gen 5', debut: 494, fin: 649 },
  { nom: 'Gen 6', debut: 650, fin: 721 },
  { nom: 'Gen 7', debut: 722, fin: 809 },
  { nom: 'Gen 8', debut: 810, fin: 905 },
  { nom: 'Gen 9', debut: 906, fin: 1025 },
]

function rgba(hex, a) {
  const h = (hex || '#888').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

const PKD_CSS = `
@keyframes pkdFill { 0%{ width:0 } }
@keyframes pkdShine { 0%{ background-position:-200% 0 } 100%{ background-position:200% 0 } }
@keyframes pkdRise { 0%{ opacity:0; transform:translateY(10px) } 100%{ opacity:1; transform:translateY(0) } }
.pkd-scroll::-webkit-scrollbar { width: 9px; }
.pkd-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 5px; }
.pkd-case { transition: transform .14s ease, box-shadow .14s ease, border-color .14s ease; }
.pkd-case-obtenu:hover { transform: translateY(-3px) scale(1.04); box-shadow: 0 6px 18px rgba(99,179,237,0.4); border-color: #63b3ed !important; z-index: 2; }
.pkd-fill { animation: pkdFill 1s cubic-bezier(.22,1,.36,1) both; }
.pkd-shine { background: linear-gradient(90deg,#fff 30%,#fcd34d 50%,#fff 70%); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: pkdShine 5s linear infinite; }
.pkd-rise { animation: pkdRise .4s ease both; }
`

// ============================================================
// STYLES (inline)
// ============================================================
const P = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,7,14,0.86)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14,
  },
  panneau: {
    width: 'min(96vw, 1100px)', maxHeight: '92vh', overflowY: 'auto', position: 'relative',
    background: 'radial-gradient(circle at 50% 0%, #16213f 0%, #080c1a 75%)',
    border: '2px solid rgba(120,160,255,0.3)', borderRadius: 18, padding: '20px 22px 24px',
    boxShadow: '0 22px 70px rgba(0,0,0,0.7)', color: '#e8ecf6', fontFamily: "'Rubik',system-ui,sans-serif",
  },
  halo: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180, pointerEvents: 'none',
    background: 'radial-gradient(circle at 50% 0%, rgba(99,179,237,0.12) 0%, transparent 70%)',
  },
  entete: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, position: 'relative' },
  surTitre: { fontSize: 11, letterSpacing: 3, color: '#7fb0ff', fontWeight: 800 },
  titre: { fontSize: 23, fontWeight: 900, color: '#fff', margin: 0, textShadow: '0 0 18px rgba(127,176,255,0.45)' },
  fermer: { width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#cfd8e3', fontSize: 16, fontWeight: 700, flexShrink: 0 },
  onglets: { display: 'flex', gap: 8, marginBottom: 12, position: 'relative' },
  onglet: (actif) => ({
    flex: 1, padding: '10px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer',
    border: actif ? '2px solid #fcd34d' : '1px solid rgba(255,255,255,0.12)',
    background: actif ? 'rgba(252,211,77,0.14)' : 'rgba(255,255,255,0.04)', color: actif ? '#fcd34d' : '#aeb9cf',
  }),
  pilule: (actif, couleur = '#7fb0ff') => ({
    padding: '7px 14px', borderRadius: 20, fontWeight: 700, fontSize: 12, cursor: 'pointer',
    border: `1.5px solid ${actif ? couleur : 'rgba(255,255,255,0.14)'}`,
    background: actif ? rgba(couleur, 0.16) : 'rgba(255,255,255,0.03)', color: actif ? couleur : '#aeb9cf',
  }),
  sousOnglets: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(82px, 1fr))', gap: 10 },
  grilleSpeciaux: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 },
  sectionTitre: { fontSize: 14, fontWeight: 800, color: '#fff', margin: '16px 0 10px', display: 'flex', alignItems: 'center', gap: 9 },
  vide: { color: '#7a86a0', fontSize: 13, gridColumn: '1 / -1', padding: '20px 0', textAlign: 'center' },
}

// Barre-accent coloree pour les titres de section.
function AccentTitre({ couleur = '#fcd34d', children }) {
  return (
    <div style={P.sectionTitre}>
      <span style={{ width: 4, height: 16, borderRadius: 2, background: couleur, boxShadow: `0 0 8px ${rgba(couleur, 0.7)}`, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  )
}

function Pokedex({ pokedexVus, pokedexShiny, pokedexSpeciaux = [], captures = [], recompensesReclamees = [], onReclamer, onFermer }) {
  const [onglet, setOnglet] = useState('dex')
  const [modeShiny, setModeShiny] = useState(false)
  const [modeSpeciaux, setModeSpeciaux] = useState(false)
  const [modeFusions, setModeFusions] = useState(false)
  const [filtre, setFiltre] = useState('tous')

  const idsVus = new Set(pokedexVus || [])
  const idsShiny = new Set(pokedexShiny || [])
  const idsSpeciaux = new Set(pokedexSpeciaux || [])
  const reclamees = new Set(recompensesReclamees || [])

  const mesFusions = (captures || []).filter((p) => p && p.estFusion)
  const registreActif = modeShiny ? idsShiny : idsVus

  const completionParGen = GENERATIONS.map((g) => {
    let obtenus = 0
    for (let n = g.debut; n <= g.fin; n++) if (registreActif.has(n)) obtenus++
    return { ...g, obtenus, total: g.fin - g.debut + 1 }
  })

  const numeros = Array.from({ length: TOTAL_POKEDEX }, (_, i) => i + 1).filter((numero) => {
    const vu = registreActif.has(numero)
    if (filtre === 'obtenus') return vu
    if (filtre === 'manquants') return !vu
    return true
  })

  const nbVus = idsVus.size

  function etatPalierGlobal(p) {
    if (reclamees.has(p.id)) return 'reclame'
    if (nbVus >= p.seuil) return 'dispo'
    return 'verrouille'
  }
  function etatPalierGen(palier, gen) {
    if (reclamees.has(palier.id)) return 'reclame'
    const total = gen.fin - gen.debut + 1
    if (compteGeneration(idsVus, gen) >= total) return 'dispo'
    return 'verrouille'
  }

  const nbDispo =
    PALIERS_GLOBAUX.filter((p) => etatPalierGlobal(p) === 'dispo').length +
    GENS_RECOMP.filter((g) => {
      const palier = PALIERS_GENERATION.find((p) => p.generation === g.cle)
      return palier && etatPalierGen(palier, g) === 'dispo'
    }).length

  // Pourcentage global pour le hero.
  const pctGlobal = Math.round((registreActif.size / TOTAL_POKEDEX) * 100)

  function LigneRecompense({ palier, sousTitre, etat }) {
    const couleurEtat = etat === 'dispo' ? '#fcd34d' : etat === 'reclame' ? '#34d399' : '#5b6575'
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 16px', marginBottom: 8, borderRadius: 12,
        border: `1.5px solid ${etat === 'dispo' ? 'rgba(252,211,77,0.5)' : 'rgba(255,255,255,0.1)'}`,
        background: etat === 'dispo' ? 'rgba(252,211,77,0.08)' : 'rgba(255,255,255,0.03)',
        opacity: etat === 'verrouille' ? 0.6 : 1,
        boxShadow: etat === 'dispo' ? '0 0 18px rgba(252,211,77,0.2)' : 'none',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: '#fff' }}>{palier.nom}</div>
          <div style={{ fontSize: 12, color: '#9aa6bd' }}>{sousTitre}</div>
          <div style={{ fontSize: 12, color: '#fcd34d', marginTop: 2 }}>{decrireGains(palier.gains)}</div>
        </div>
        <div style={{ flexShrink: 0 }}>
          {etat === 'reclame' && <span style={{ fontSize: 12, fontWeight: 800, color: '#34d399' }}>✓ Réclamé</span>}
          {etat === 'verrouille' && <span style={{ fontSize: 16, color: '#5b6575' }}>🔒</span>}
          {etat === 'dispo' && (
            <button onClick={() => onReclamer && onReclamer(palier)} style={{
              border: 'none', borderRadius: 10, cursor: 'pointer', padding: '9px 18px', fontSize: 13, fontWeight: 900,
              background: 'linear-gradient(180deg,#fcd34d,#e0a82e)', color: '#3a2800', boxShadow: '0 3px 0 #a87b1e',
            }}>Réclamer</button>
          )}
        </div>
      </div>
    )
  }

  function CaseSpeciale({ sp, label }) {
    const debloque = idsSpeciaux.has(sp.id)
    return (
      <div className={debloque ? 'pkd-case pkd-case-obtenu' : 'pkd-case'}
        title={debloque ? `${sp.nomFr} (${label})` : `??? — ${label}`}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 6px 8px', borderRadius: 12,
          border: `2px solid ${debloque ? '#fcd34d' : 'rgba(255,255,255,0.08)'}`,
          background: debloque ? 'rgba(252,211,77,0.08)' : 'rgba(255,255,255,0.02)',
          boxShadow: debloque ? '0 0 14px rgba(252,211,77,0.2)' : 'none',
        }}>
        <img src={spriteSpecial(sp.id)} alt={sp.nomFr} loading="lazy"
          style={{ width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated', filter: debloque ? 'none' : 'brightness(0) opacity(0.5)' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: debloque ? '#fff' : '#5b6575', textAlign: 'center' }}>{debloque ? sp.nomFr : '???'}</span>
        <span style={{ fontSize: 9, color: debloque ? '#fcd34d' : '#5b6575', textAlign: 'center' }}>{debloque ? `✓ ${label}` : `🔒 ${label}`}</span>
      </div>
    )
  }

  function CaseFusion({ f }) {
    const erreurSprite = (e) => {
      const img = e.currentTarget
      if (img.dataset.secours === '1') { img.style.visibility = 'hidden'; return }
      const tab = trouverFusion(f.teteId, f.corpsId)
      if (tab) { img.dataset.secours = '1'; img.src = urlSpriteFusionSecours(tab.tetePif, tab.corpsPif) }
      else { img.style.visibility = 'hidden' }
    }
    const typesTexte = (f.types || []).join(' / ')
    return (
      <div className="pkd-case pkd-case-obtenu"
        title={`${f.nom} — ${f.nomTete} + ${f.nomCorps}${typesTexte ? ` (${typesTexte})` : ''}`}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '10px 6px 8px', borderRadius: 12,
          border: '2px solid #fcd34d', background: 'linear-gradient(180deg, rgba(252,211,77,0.12), rgba(30,22,8,0.4))',
          boxShadow: '0 0 16px rgba(252,211,77,0.25)',
        }}>
        <img src={f.sprite} alt={f.nom} loading="lazy" onError={erreurSprite}
          style={{ width: 68, height: 68, objectFit: 'contain', imageRendering: 'pixelated' }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: '#fcd34d', textAlign: 'center' }}>{f.nom}</span>
        <span style={{ fontSize: 9, color: '#9aa6bd', textAlign: 'center' }}>{f.nomTete} + {f.nomCorps}</span>
        <span style={{ fontSize: 9, color: '#7a86a0' }}>Niv. {f.niveau || 1}</span>
      </div>
    )
  }

  const titreOnglet = onglet === 'dex'
    ? (modeFusions ? `Fusions (${mesFusions.length})`
      : modeSpeciaux ? `Spéciaux (${idsSpeciaux.size}/${TOTAL_SPECIAUX})`
      : `${modeShiny ? 'Shiny' : 'National'} (${registreActif.size}/${TOTAL_POKEDEX})`)
    : 'Récompenses'

  return (
    <div style={P.overlay} onClick={onFermer}>
      <style>{PKD_CSS}</style>
      <div className="pkd-scroll" style={P.panneau} onClick={(e) => e.stopPropagation()}>
        <div style={P.halo} />
        <div style={P.entete}>
          <div>
            <div style={P.surTitre}>⬡ POKÉDEX</div>
            <h2 className="pkd-shine" style={P.titre}>{titreOnglet}</h2>
          </div>
          <button style={P.fermer} onClick={onFermer}>✕</button>
        </div>

        {/* Onglets principaux */}
        <div style={P.onglets}>
          <button style={P.onglet(onglet === 'dex')} onClick={() => setOnglet('dex')}>Pokédex</button>
          <button style={P.onglet(onglet === 'recompenses')} onClick={() => setOnglet('recompenses')}>
            Récompenses{nbDispo > 0 ? ` (${nbDispo})` : ''}
          </button>
        </div>

        {onglet === 'dex' && (
          <>
            {/* Barre de progression globale (hero) */}
            {!modeSpeciaux && !modeFusions && (
              <div style={{ marginBottom: 14, padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#cfd8e3' }}>Complétion {modeShiny ? 'Shiny' : 'nationale'}</span>
                  <span style={{ fontSize: 18, fontWeight: 900, color: '#fcd34d' }}>{pctGlobal}%</span>
                </div>
                <div style={{ height: 9, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="pkd-fill" style={{ width: `${pctGlobal}%`, height: '100%', background: 'linear-gradient(90deg,#b8860b,#fcd34d)', borderRadius: 5, boxShadow: '0 0 10px rgba(252,211,77,0.6)' }} />
                </div>
                {/* Mini-barres par génération */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: 8, marginTop: 12 }}>
                  {completionParGen.map((g) => {
                    const pct = Math.round((g.obtenus / g.total) * 100)
                    const complete = pct === 100
                    return (
                      <div key={g.nom} style={{ fontSize: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontWeight: 800, color: complete ? '#fcd34d' : '#aeb9cf' }}>{g.nom}</span>
                          <span style={{ color: '#8696b0' }}>{g.obtenus}/{g.total}</span>
                        </div>
                        <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: complete ? '#fcd34d' : '#63b3ed', borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Modes Normal / Shiny / Spéciaux / Fusions */}
            <div style={P.sousOnglets}>
              <button style={P.pilule(!modeShiny && !modeSpeciaux && !modeFusions)} onClick={() => { setModeShiny(false); setModeSpeciaux(false); setModeFusions(false) }}>National ({idsVus.size})</button>
              <button style={P.pilule(modeShiny && !modeSpeciaux && !modeFusions, '#fcd34d')} onClick={() => { setModeShiny(true); setModeSpeciaux(false); setModeFusions(false) }}>✨ Shiny ({idsShiny.size})</button>
              <button style={P.pilule(modeSpeciaux, '#ec4899')} onClick={() => { setModeSpeciaux(true); setModeFusions(false) }}>Spéciaux ({idsSpeciaux.size}/{TOTAL_SPECIAUX})</button>
              <button style={P.pilule(modeFusions, '#a855f7')} onClick={() => { setModeFusions(true); setModeSpeciaux(false) }}>Fusions ({mesFusions.length})</button>
            </div>

            {/* Filtres */}
            {!modeSpeciaux && !modeFusions && (
              <div style={P.sousOnglets}>
                <button style={P.pilule(filtre === 'tous')} onClick={() => setFiltre('tous')}>Tous</button>
                <button style={P.pilule(filtre === 'obtenus', '#34d399')} onClick={() => setFiltre('obtenus')}>Obtenus</button>
                <button style={P.pilule(filtre === 'manquants', '#9aa6bd')} onClick={() => setFiltre('manquants')}>Non obtenus</button>
              </div>
            )}

            {/* Contenu */}
            {modeFusions ? (
              <div>
                <AccentTitre couleur="#a855f7">Mes fusions ({mesFusions.length})</AccentTitre>
                {mesFusions.length === 0 ? (
                  <p style={P.vide}>Aucune fusion créée pour l'instant. Rendez-vous au Centre de Fusion !</p>
                ) : (
                  <div style={P.grilleSpeciaux}>
                    {mesFusions.map((f) => (<CaseFusion key={f.uid} f={f} />))}
                  </div>
                )}
              </div>
            ) : modeSpeciaux ? (
              <div>
                <AccentTitre couleur="#ef7d57">Champions d'Arène ({SPECIAUX.filter((s) => idsSpeciaux.has(s.id)).length}/{SPECIAUX.length})</AccentTitre>
                <div style={P.grilleSpeciaux}>
                  {SPECIAUX.map((sp) => (<CaseSpeciale key={sp.id} sp={sp} label={sp.boss} />))}
                </div>
                <AccentTitre couleur="#ff7843">Boss de Raid ({SPECIAUX_RAID.filter((s) => idsSpeciaux.has(s.id)).length}/{SPECIAUX_RAID.length})</AccentTitre>
                <div style={P.grilleSpeciaux}>
                  {SPECIAUX_RAID.map((sp) => (<CaseSpeciale key={sp.id} sp={sp} label={sp.boss} />))}
                </div>
              </div>
            ) : (
              <div style={P.grille}>
                {numeros.length === 0 ? (
                  <p style={P.vide}>Aucun Pokémon dans ce filtre.</p>
                ) : (
                  numeros.map((numero) => {
                    const vu = registreActif.has(numero)
                    const aussiShiny = idsShiny.has(numero)
                    const urlStatique = modeShiny
                      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${numero}.png`
                      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`
                    const nomSd = nomShowdown(numero)
                    const dossierSd = modeShiny ? 'ani-shiny' : 'ani'
                    const urlAnimee = nomSd ? `https://play.pokemonshowdown.com/sprites/${dossierSd}/${nomSd}.gif` : null
                    const survol = (e) => { if (vu && urlAnimee) { e.currentTarget.dataset.statique = urlStatique; e.currentTarget.src = urlAnimee } }
                    const sortie = (e) => { e.currentTarget.src = urlStatique }
                    const erreurAnime = (e) => { e.currentTarget.src = e.currentTarget.dataset.statique || urlStatique }
                    return (
                      <div key={numero}
                        className={vu ? 'pkd-case pkd-case-obtenu' : 'pkd-case'}
                        title={vu ? `N°${numero}${aussiShiny ? ' ✨' : ''}` : `N°${numero} — ???`}
                        style={{
                          position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 4px 5px', borderRadius: 11,
                          border: `2px solid ${vu ? (modeShiny ? '#fcd34d' : 'rgba(99,179,237,0.5)') : 'rgba(255,255,255,0.07)'}`,
                          background: vu ? (modeShiny ? 'rgba(252,211,77,0.08)' : 'rgba(99,179,237,0.07)') : 'rgba(255,255,255,0.02)',
                          boxShadow: modeShiny && vu ? '0 0 12px rgba(252,211,77,0.3)' : 'none',
                        }}>
                        <img src={urlStatique} alt={`Pokémon ${numero}`} loading="lazy"
                          onMouseEnter={survol} onMouseLeave={sortie} onError={erreurAnime}
                          style={{ width: 52, height: 52, objectFit: 'contain', imageRendering: 'pixelated', filter: vu ? 'none' : 'brightness(0) opacity(0.5)' }} />
                        <span style={{ fontSize: 10, color: vu ? '#aeb9cf' : '#5b6575', fontWeight: 700 }}>{numero}</span>
                        {!modeShiny && aussiShiny && <span style={{ position: 'absolute', top: 4, right: 5, fontSize: 11 }}>✨</span>}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}

        {onglet === 'recompenses' && (
          <div className="pkd-rise">
            <div style={{ fontSize: 13, color: '#c3ccde', marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
              Pokémon vus : <strong style={{ color: '#fcd34d' }}>{nbVus}/{TOTAL_POKEDEX}</strong>. Réclame tes paliers de complétion !
            </div>
            <AccentTitre couleur="#fcd34d">Paliers globaux</AccentTitre>
            {PALIERS_GLOBAUX.map((p) => (
              <LigneRecompense key={p.id} palier={p} sousTitre={`${p.seuil} Pokémon vus`} etat={etatPalierGlobal(p)} />
            ))}
            <AccentTitre couleur="#63b3ed">Par génération</AccentTitre>
            {GENS_RECOMP.map((g) => {
              const palier = PALIERS_GENERATION.find((p) => p.generation === g.cle)
              if (!palier) return null
              const total = g.fin - g.debut + 1
              const obtenus = compteGeneration(idsVus, g)
              return (
                <LigneRecompense key={palier.id} palier={palier} sousTitre={`${obtenus}/${total} capturés`} etat={etatPalierGen(palier, g)} />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Pokedex