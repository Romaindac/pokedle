import { useState, useMemo, useEffect } from 'react'
import { creerFusion, trouverSpriteFusionSync, nomFusion, statsFusion, typesFusion, coutFusion, especeFusionnable, urlSpriteFusionSecours } from './fusion'
import { enregistrerDecouverte, chargerRegistre, cleFusion } from './apiFusions'
import { trouverFusion } from './fusionsDisponibles'
import { partenairesDe, ESPECES_FUSION } from './fusionsDisponibles'
import { nomShowdown } from './pokedexNoms'
import { ROLES } from './roles'

// Couleur par type (pour les pastilles de type).
const COULEUR_TYPE = {
  normal: '#9099a1', fire: '#ff7843', water: '#4d90d5', electric: '#f4d23c',
  grass: '#63bb5b', ice: '#73cec0', fighting: '#ce4069', poison: '#b265d6',
  ground: '#d97746', flying: '#8fa8dd', psychic: '#fa7179', bug: '#90c12c',
  rock: '#c7b78b', ghost: '#7b62c9', dragon: '#3b6dd6', dark: '#5a5366',
  steel: '#5a8ea1', fairy: '#ec8fe6',
}
const NOM_TYPE_FR = {
  normal: 'Normal', fire: 'Feu', water: 'Eau', electric: 'Electrik', grass: 'Plante',
  ice: 'Glace', fighting: 'Combat', poison: 'Poison', ground: 'Sol', flying: 'Vol',
  psychic: 'Psy', bug: 'Insecte', rock: 'Roche', ghost: 'Spectre', dragon: 'Dragon',
  dark: 'Tenebres', steel: 'Acier', fairy: 'Fee',
}

const SPRITE_POKEAPI = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

// Cascade d'erreur pour un sprite de fusion : source principale -> secours -> action finale.
function erreurSpriteFusion(e, natA, natB, actionFinale) {
  const img = e.currentTarget
  const etape = parseInt(img.dataset.secours || '0', 10)
  if (etape === 0) {
    const f = trouverFusion(natA, natB)
    if (f) { img.dataset.secours = '1'; img.src = urlSpriteFusionSecours(f.tetePif, f.corpsPif); return }
  }
  if (actionFinale) actionFinale(img)
}

// ---- Styles inline de structure (immunises contre App.css) ----
const S = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 900,
    background: 'rgba(4, 6, 14, 0.85)', backdropFilter: 'blur(3px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  fenetre: {
    width: 'min(96vw, 980px)', maxHeight: '92vh', overflow: 'auto', position: 'relative',
    boxSizing: 'border-box', padding: '20px 20px 24px',
    background: 'radial-gradient(circle at 50% 0%, #1a2348 0%, #0a0e1f 72%)',
    border: '2px solid rgba(120, 160, 255, 0.3)', borderRadius: 18,
    boxShadow: '0 22px 70px rgba(0,0,0,0.7)',
    color: '#e8edf7', fontFamily: "'Rubik', system-ui, sans-serif",
  },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, position: 'relative' },
  headerHalo: {
    position: 'absolute', top: -20, left: 0, right: 0, height: 160, pointerEvents: 'none',
    background: 'radial-gradient(circle at 50% 0%, rgba(127,176,255,0.16) 0%, transparent 70%)',
  },
  slotGlow: { position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 16 },
  reacteur: {
    position: 'relative', width: 64, height: 64, flexShrink: 0, border: 'none',
    background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },
  reacteurRing: {
    position: 'absolute', inset: 0, borderRadius: '50%',
    border: '2px dashed rgba(252,211,77,0.5)',
    background: 'radial-gradient(circle, rgba(252,211,77,0.12) 0%, transparent 70%)',
  },
  reacteurCore: {
    width: 36, height: 36, borderRadius: '50%', position: 'relative',
    background: 'radial-gradient(circle at 35% 30%, #fff3c4, #fcd34d 55%, #e0a82e)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 18px rgba(252,211,77,0.7)',
  },
  resultVide: {
    width: 80, height: 80, margin: '0 auto', borderRadius: '50%',
    border: '2px dashed rgba(252,211,77,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle, rgba(252,211,77,0.08) 0%, transparent 70%)',
  },
  titre: { margin: 0, fontSize: 22, flex: 1, fontWeight: 900, color: '#fff', textShadow: '0 0 18px rgba(127,176,255,0.45)' },
  adn: { fontWeight: 800, color: '#7fb0ff', background: 'rgba(127,176,255,0.12)', border: '1px solid rgba(127,176,255,0.4)', borderRadius: 999, padding: '5px 14px', fontSize: 14 },
  fermer: { background: 'none', border: 'none', color: '#9ca8bd', fontSize: 20, cursor: 'pointer', padding: 6 },
  corps: { display: 'flex', flexDirection: 'column', gap: 16 },
  slots: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap', position: 'relative' },
  slot: {
    width: 132, minHeight: 132, border: '2px dashed #3a4356', borderRadius: 16,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: 6, position: 'relative', padding: 10,
    background: 'linear-gradient(180deg, rgba(40,60,120,0.3), rgba(20,30,60,0.4))',
  },
  slotSprite: { width: 88, height: 88, objectFit: 'contain', imageRendering: 'pixelated' },
  resultat: { textAlign: 'center', minHeight: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fusionPreview: {
    display: 'flex', alignItems: 'center', gap: 18, justifyContent: 'center', flexWrap: 'wrap',
    background: 'linear-gradient(180deg, rgba(70,55,120,0.4), rgba(30,22,60,0.5))',
    border: '2px solid rgba(252,211,77,0.6)', borderRadius: 18, padding: '16px 22px',
    boxShadow: '0 0 36px rgba(252,211,77,0.3)', position: 'relative',
  },
  fusionSprite: { width: 128, height: 128, objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 0 14px rgba(252,211,77,0.5))' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10, maxHeight: 300, overflow: 'auto', padding: 4 },
  carte: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '9px 4px', cursor: 'pointer', color: '#dfe6f2', fontSize: 11 },
  carteSprite: { width: 56, height: 56, objectFit: 'contain', imageRendering: 'pixelated' },
  recherche: { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px', color: '#e8edf7', fontSize: 13, marginBottom: 10, fontFamily: 'inherit' },
  bouton: { background: 'linear-gradient(180deg, #fcd34d, #e0a82e)', border: 'none', borderRadius: 12, color: '#3a2800', fontWeight: 900, fontSize: 15, padding: '13px 30px', cursor: 'pointer', boxShadow: '0 4px 0 #a87b1e' },
  onglet: (actif) => ({ flex: 1, padding: '10px 10px', borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer',
    border: actif ? '2px solid #fcd34d' : '1px solid rgba(255,255,255,0.12)',
    background: actif ? 'rgba(252,211,77,0.14)' : 'rgba(255,255,255,0.04)', color: actif ? '#fcd34d' : '#aeb9cf' }),
  boutonGene: { background: 'rgba(127,176,255,0.12)', border: '1px solid rgba(127,176,255,0.4)', borderRadius: 8, color: '#9cc4ff', fontWeight: 700, fontSize: 10, padding: '4px 8px', cursor: 'pointer' },
}

function PastilleType({ type }) {
  return (
    <span style={{ background: COULEUR_TYPE[type] || '#888', color: '#0d1117', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginRight: 4 }}>
      {NOM_TYPE_FR[type] || type}
    </span>
  )
}

// CSS animé autonome (scopé cf-, injecté une fois, zéro conflit App.css).
const CF_CSS = `
@keyframes cfPulse { 0%,100%{ transform:scale(1); opacity:.9 } 50%{ transform:scale(1.06); opacity:1 } }
@keyframes cfSpin { from{ transform:rotate(0deg) } to{ transform:rotate(360deg) } }
@keyframes cfBreath { 0%,100%{ opacity:.35; transform:scale(1) } 50%{ opacity:.7; transform:scale(1.12) } }
@keyframes cfFloat { 0%{ transform:translateY(0) } 50%{ transform:translateY(-7px) } 100%{ transform:translateY(0) } }
@keyframes cfReveal { 0%{ transform:scale(.6); opacity:0 } 60%{ transform:scale(1.12) } 100%{ transform:scale(1); opacity:1 } }
@keyframes cfShine { 0%{ background-position:-200% 0 } 100%{ background-position:200% 0 } }
.cf-reacteur-core { animation: cfPulse 2.2s ease-in-out infinite; }
.cf-reacteur-ring { animation: cfSpin 9s linear infinite; }
.cf-slot-glow { animation: cfBreath 3s ease-in-out infinite; }
.cf-result-sprite { animation: cfReveal .5s cubic-bezier(.34,1.4,.64,1) both, cfFloat 3.4s ease-in-out 0.5s infinite; }
.cf-empty-pulse { animation: cfBreath 2.6s ease-in-out infinite; }
.cf-titre-shine {
  background: linear-gradient(90deg,#fff 30%,#fcd34d 50%,#fff 70%);
  background-size: 200% auto; -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; animation: cfShine 4s linear infinite;
}
`

function CentreFusion({
  collection = [],
  adnFusion = 0,
  onFusionner,
  onChangerGene,
  onFermer,
}) {
  const [onglet, setOnglet] = useState('fusion') // 'fusion' | 'pokedex'
  const [choixA, setChoixA] = useState(null)
  const [choixB, setChoixB] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [chargement, setChargement] = useState(false)
  const [inverse, setInverse] = useState(false)
  // Pokedex : espece selectionnee + fusion selectionnee (detail "qui il faut").
  const [dexEspece, setDexEspece] = useState(null) // id national
  const [dexDetail, setDexDetail] = useState(null) // id national du partenaire
  const [dexRecherche, setDexRecherche] = useState('')
  // Registre mondial : { "tete-corps": { pseudo, nom, cree_le } }
  const [registre, setRegistre] = useState({})
  const [decouverteMsg, setDecouverteMsg] = useState('')

  useEffect(() => {
    let monte = true
    chargerRegistre().then((r) => { if (monte && r.ok) setRegistre(r.table) })
    return () => { monte = false }
  }, [])

  const pokeA = collection.find((p) => p.uid === choixA) || null
  const pokeB = collection.find((p) => p.uid === choixB) || null

  // Especes possedees (hors fusions). INSTANTANE.
  const especesPossedees = useMemo(() => new Set(collection.filter((p) => p && !p.estFusion).map((p) => p.id)), [collection])

  // Partenaires (table statique) du Pokemon A selectionne. INSTANTANE.
  const partenairesA = useMemo(() => pokeA ? new Set(partenairesDe(pokeA.id)) : null, [choixA])

  // Apercu de la fusion : lookup synchrone, ZERO reseau.
  const apercu = useMemo(() => {
    if (!pokeA || !pokeB) return null
    const a = inverse ? pokeB : pokeA
    const b = inverse ? pokeA : pokeB
    return trouverSpriteFusionSync(a.id, b.id)
  }, [choixA, choixB, inverse])

  const cout = pokeA && pokeB ? coutFusion(pokeA, pokeB) : 0
  const assezAdn = adnFusion >= cout
  const peutFusionner = pokeA && pokeB && apercu && !chargement && assezAdn

  let apercuNom = '', apercuStats = null, apercuTypes = []
  if (apercu && pokeA && pokeB) {
    const tete  = apercu.teteId === pokeA.id ? pokeA : pokeB
    const corps = apercu.teteId === pokeA.id ? pokeB : pokeA
    apercuNom = nomFusion(tete.nom, corps.nom)
    apercuStats = statsFusion(pokeA, pokeB)
    apercuTypes = typesFusion(tete, corps)
  }

  function choisir(uid) {
    if (uid === choixA) { setChoixA(null); setChoixB(null); return }
    if (uid === choixB) { setChoixB(null); return }
    if (!choixA) { setChoixA(uid); return }
    if (!choixB) { setChoixB(uid); return }
    setChoixB(uid)
  }

  async function lancerFusion() {
    if (!peutFusionner) return
    const a = inverse ? pokeB : pokeA
    const b = inverse ? pokeA : pokeB
    setChargement(true)
    const fusion = await creerFusion(a, b, null)
    setChargement(false)
    if (!fusion) return
    onFusionner && onFusionner(pokeA, pokeB, fusion, cout)
    // Registre mondial : enregistre la decouverte (le premier gagne le titre).
    enregistrerDecouverte(fusion).then((r) => {
      if (!r.ok) return
      if (r.premiere && r.ligne) {
        setRegistre((t) => ({ ...t, [r.cle]: { pseudo: r.ligne.pseudo, nom: r.ligne.nom } }))
        setDecouverteMsg(`PREMIERE DECOUVERTE MONDIALE : ${fusion.nom} ! Ton nom est grave a jamais.`)
        setTimeout(() => setDecouverteMsg(''), 6000)
      }
    }).catch(() => {})
    setChoixA(null); setChoixB(null); setInverse(false)
  }

  // Prepare une fusion depuis le Pokedex.
  function preparerFusion(idA, idB) {
    const a = collection.find((p) => p && !p.estFusion && p.id === idA)
    const b = collection.find((p) => p && !p.estFusion && p.id === idB)
    if (!a || !b) return
    setChoixA(a.uid); setChoixB(b.uid); setInverse(false); setOnglet('fusion'); setDexDetail(null)
  }

  // ===== Liste de l'onglet Fusionner =====
  // Fusionnables seulement ; avec un A selectionne : seulement ses partenaires possedes.
  const liste = collection
    .filter((p) => p && !p.estFusion && especeFusionnable(p.id))
    .filter((p) => !recherche || (p.nom || '').toLowerCase().includes(recherche.toLowerCase()))
    .filter((p) => {
      if (!pokeA) return true
      if (p.uid === choixA || p.uid === choixB) return true
      if (p.id === pokeA.id) return false
      return partenairesA && partenairesA.has(p.id)
    })

  const mesFusions = collection.filter((p) => p && p.estFusion)

  // ===== Donnees du Pokedex =====
  const dexListe = ESPECES_FUSION.filter((id) => {
    if (!dexRecherche) return true
    const nom = nomShowdown(id) || ''
    return nom.includes(dexRecherche.toLowerCase()) || String(id).includes(dexRecherche)
  })
  const nbPossedees = ESPECES_FUSION.filter((id) => especesPossedees.has(id)).length

  return (
    <div className="cf-overlay" style={S.overlay} onClick={onFermer}>
      <div className="cf-fenetre" style={S.fenetre} onClick={(e) => e.stopPropagation()}>
        <style>{CF_CSS}</style>
        <div style={S.headerHalo} />
        <div className="cf-header" style={S.header}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, color: '#7fb0ff', fontWeight: 800 }}>⬡ LABORATOIRE GÉNÉTIQUE</div>
            <h2 className="cf-titre cf-titre-shine" style={S.titre}>Centre de Fusion</h2>
          </div>
          <div className="cf-adn" style={S.adn}>{adnFusion} ADN</div>
          <button className="cf-fermer" style={S.fermer} onClick={onFermer}>✕</button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => setOnglet('fusion')} style={S.onglet(onglet === 'fusion')}>Fusionner</button>
          <button onClick={() => { setOnglet('pokedex'); setDexDetail(null) }} style={S.onglet(onglet === 'pokedex')}>Pokedex des fusions</button>
        </div>

        {decouverteMsg && (
          <div style={{ marginBottom: 10, padding: '10px 14px', borderRadius: 12, border: '1px solid #fcd34d', background: 'rgba(252,211,77,0.12)', color: '#fcd34d', fontWeight: 800, fontSize: 13, textAlign: 'center' }}>
            {decouverteMsg}
          </div>
        )}

        {/* ================= ONGLET POKEDEX ================= */}
        {onglet === 'pokedex' && !dexEspece && (
          <div>
            <p style={{ fontSize: 13, color: '#9ca8bd', marginTop: 0 }}>
              Choisis un Pokemon pour voir <strong>toutes ses fusions</strong>. Les ombres = Pokemon que tu n'as pas encore. ({nbPossedees} / {ESPECES_FUSION.length} possedes)
            </p>
            <input style={S.recherche} type="text" placeholder="Rechercher (nom anglais ou numero)..."
              value={dexRecherche} onChange={(e) => setDexRecherche(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 10, maxHeight: 480, overflow: 'auto', padding: 4 }}>
              {dexListe.map((id) => {
                const possede = especesPossedees.has(id)
                return (
                  <button key={id} onClick={() => { setDexEspece(id); setDexDetail(null) }}
                    style={{ ...S.carte, padding: '10px 4px' }}>
                    <img src={`${SPRITE_POKEAPI}${id}.png`} alt={nomShowdown(id) || id}
                      style={{ width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated', filter: possede ? 'none' : 'brightness(0) opacity(0.55)' }}
                      loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
                    <span style={{ fontSize: 11, color: possede ? '#dfe6f2' : '#5b6575' }}>{possede ? (nomShowdown(id) || id) : `N.${id}`}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {onglet === 'pokedex' && dexEspece && (() => {
          const partenaires = partenairesDe(dexEspece)
          const aLEspece = especesPossedees.has(dexEspece)
          const nomEspece = nomShowdown(dexEspece) || `N.${dexEspece}`
          return (
            <div>
              <button style={{ ...S.fermer, fontSize: 14, padding: '4px 0' }} onClick={() => { setDexEspece(null); setDexDetail(null) }}>← Retour au Pokedex</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 10px' }}>
                <img src={`${SPRITE_POKEAPI}${dexEspece}.png`} alt={nomEspece}
                  style={{ width: 56, height: 56, objectFit: 'contain', imageRendering: 'pixelated', filter: aLEspece ? 'none' : 'brightness(0) opacity(0.55)' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>{nomEspece} {aLEspece ? '' : '(non possede)'}</div>
                  <div style={{ fontSize: 12, color: '#9ca8bd' }}>{partenaires.length} fusions possibles — en couleur si tu as les deux Pokemon, en ombre sinon (clique pour voir qui il faut)</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 12, maxHeight: 440, overflow: 'auto', padding: 4 }}>
                {partenaires.map((idP) => {
                  const f = trouverSpriteFusionSync(dexEspece, idP)
                  if (!f) return null
                  const possedeP = especesPossedees.has(idP)
                  const realisable = aLEspece && possedeP
                  const detailOuvert = dexDetail === idP
                  const dec = registre[cleFusion(f.teteId, f.corpsId)]
                  return (
                    <button key={idP} onClick={() => setDexDetail(detailOuvert ? null : idP)}
                      style={{ ...S.carte, padding: '10px 4px', borderColor: detailOuvert ? '#fcd34d' : (realisable ? '#7ee3a8' : 'rgba(255,255,255,0.1)') }}>
                      <img src={f.url} alt="fusion"
                        style={{ width: 80, height: 80, objectFit: 'contain', imageRendering: 'pixelated', filter: realisable ? 'none' : 'brightness(0) opacity(0.6)' }}
                        loading="lazy" onError={(e) => erreurSpriteFusion(e, dexEspece, idP, (img) => { const b = img.closest('button'); if (b) b.style.display = 'none' })} />
                      <span style={{ fontSize: 11, color: realisable ? '#7ee3a8' : '#5b6575' }}>
                        {realisable ? '+ ' + (nomShowdown(idP) || idP) : '???'}
                      </span>
                      {dec && <span style={{ fontSize: 9, color: '#fcd34d' }}>★ {dec.pseudo}</span>}
                    </button>
                  )
                })}
              </div>
              {/* Detail "qui il faut" */}
              {dexDetail && (() => {
                const idP = dexDetail
                const f = trouverSpriteFusionSync(dexEspece, idP)
                if (!f) return null
                const possedeP = especesPossedees.has(idP)
                const realisable = aLEspece && possedeP
                const nomP = nomShowdown(idP) || `N.${idP}`
                const dec = registre[cleFusion(f.teteId, f.corpsId)]
                return (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(96,165,250,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <img src={f.url} alt="fusion" style={{ width: 72, height: 72, objectFit: 'contain', imageRendering: 'pixelated', filter: realisable ? 'none' : 'brightness(0) opacity(0.6)' }}
                      onError={(e) => erreurSpriteFusion(e, dexEspece, idP, null)} />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 11, marginBottom: 6, color: dec ? '#fcd34d' : '#7ee3a8', fontWeight: 700 }}>
                        {dec ? `Decouverte par ${dec.pseudo}` : 'Jamais decouverte — sois le premier au monde !'}
                      </div>
                      <div style={{ fontWeight: 800, marginBottom: 4 }}>Il te faut :</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                        <img src={`${SPRITE_POKEAPI}${dexEspece}.png`} alt={nomEspece} style={{ width: 34, height: 34, filter: aLEspece ? 'none' : 'grayscale(1) brightness(0.4)' }} />
                        <span style={{ color: aLEspece ? '#7ee3a8' : '#fca5a5' }}>{nomEspece} {aLEspece ? '✓' : '✗ (a capturer)'}</span>
                        <span style={{ color: '#fcd34d' }}>+</span>
                        <img src={`${SPRITE_POKEAPI}${idP}.png`} alt={nomP} style={{ width: 34, height: 34, filter: possedeP ? 'none' : 'grayscale(1) brightness(0.4)' }} />
                        <span style={{ color: possedeP ? '#7ee3a8' : '#fca5a5' }}>{nomP} {possedeP ? '✓' : '✗ (a capturer)'}</span>
                      </div>
                    </div>
                    {realisable && (
                      <button style={{ ...S.bouton, padding: '8px 16px', fontSize: 13 }} onClick={() => preparerFusion(dexEspece, idP)}>Preparer</button>
                    )}
                  </div>
                )
              })()}
            </div>
          )
        })()}

        {/* ================= ONGLET FUSIONNER ================= */}
        {onglet === 'fusion' && (
        <div className="cf-corps" style={S.corps}>
          <p style={{ fontSize: 13, color: '#9ca8bd', lineHeight: 1.5, margin: 0 }}>
            Fusionne deux Pokemon en un seul ! La fusion <strong>consomme les deux Pokemon</strong> et
            cree un nouvel etre unique (sprite dessine main). Choisis un Pokemon : seuls ses partenaires de fusion restent affiches.
          </p>
          <div className="cf-apercu">
            <div className="cf-slots" style={S.slots}>
              <div className="cf-slot" style={{ ...S.slot, borderStyle: pokeA ? 'solid' : 'dashed', borderColor: pokeA ? '#4f7fd8' : 'rgba(79,127,216,0.45)', boxShadow: pokeA ? '0 0 30px rgba(79,127,216,0.5)' : '0 0 18px rgba(79,127,216,0.15)' }}>
                <div className="cf-slot-glow" style={{ ...S.slotGlow, background: 'radial-gradient(circle, rgba(79,127,216,0.4) 0%, transparent 70%)' }} />
                <div style={{ fontSize: 9, color: '#9fc0ff', fontWeight: 800, letterSpacing: 1.5, position: 'relative' }}>CORPS</div>
                {pokeA ? (
                  <>
                    <img src={pokeA.spriteNormal || pokeA.sprite} alt={pokeA.nom} style={{ ...S.slotSprite, position: 'relative' }} />
                    <span style={{ fontSize: 12, position: 'relative' }}>{pokeA.nom}</span>
                    <button style={{ ...S.fermer, position: 'absolute', top: 2, right: 4, fontSize: 13 }} onClick={() => { setChoixA(null); setChoixB(null) }}>✕</button>
                  </>
                ) : <span className="cf-empty-pulse" style={{ color: '#5b6575', fontSize: 26, fontWeight: 300, position: 'relative' }}>+</span>}
              </div>

              {/* Réacteur central */}
              <button
                style={S.reacteur}
                disabled={!pokeA || !pokeB}
                onClick={() => setInverse((v) => !v)}
                title="Inverser tete / corps (change le sprite)"
              >
                <div className="cf-reacteur-ring" style={S.reacteurRing} />
                <div className="cf-reacteur-core" style={{ ...S.reacteurCore, opacity: (pokeA && pokeB) ? 1 : 0.5 }}>
                  <span style={{ fontSize: 18, color: '#3a2800', fontWeight: 900 }}>{(pokeA && pokeB) ? '↔' : '✦'}</span>
                </div>
              </button>

              <div className="cf-slot" style={{ ...S.slot, borderStyle: pokeB ? 'solid' : 'dashed', borderColor: pokeB ? '#d85ad8' : 'rgba(216,90,216,0.45)', boxShadow: pokeB ? '0 0 30px rgba(216,90,216,0.5)' : '0 0 18px rgba(216,90,216,0.15)' }}>
                <div className="cf-slot-glow" style={{ ...S.slotGlow, background: 'radial-gradient(circle, rgba(216,90,216,0.4) 0%, transparent 70%)' }} />
                <div style={{ fontSize: 9, color: '#f0a3ff', fontWeight: 800, letterSpacing: 1.5, position: 'relative' }}>TÊTE</div>
                {pokeB ? (
                  <>
                    <img src={pokeB.spriteNormal || pokeB.sprite} alt={pokeB.nom} style={{ ...S.slotSprite, position: 'relative' }} />
                    <span style={{ fontSize: 12, position: 'relative' }}>{pokeB.nom}</span>
                    <button style={{ ...S.fermer, position: 'absolute', top: 2, right: 4, fontSize: 13 }} onClick={() => setChoixB(null)}>✕</button>
                  </>
                ) : <span className="cf-empty-pulse" style={{ color: '#5b6575', fontSize: 26, fontWeight: 300, position: 'relative' }}>+</span>}
              </div>
            </div>

            <div className="cf-resultat" style={S.resultat}>
              {!pokeA || !pokeB ? (
                <div style={{ textAlign: 'center' }}>
                  <div className="cf-empty-pulse" style={S.resultVide}>
                    <span style={{ fontSize: 30, color: 'rgba(252,211,77,0.5)' }}>✦</span>
                  </div>
                  <p style={{ color: '#7a87a0', fontSize: 13, marginTop: 10 }}>
                    {pokeA ? 'Choisis le 2e Pokemon parmi les partenaires affiches.' : 'Choisis deux Pokemon ci-dessous pour voir la fusion apparaître.'}
                  </p>
                </div>
              ) : !apercu ? (
                <div style={{ color: '#fca5a5', fontSize: 13 }}>
                  <p style={{ margin: '4px 0' }}>Pas de sprite dessine pour cette fusion.</p>
                </div>
              ) : (
                <div className="cf-fusion-preview" style={S.fusionPreview}>
                  <img className="cf-result-sprite" key={apercu.url} src={apercu.url} alt={apercuNom} style={S.fusionSprite}
                    onError={(e) => erreurSpriteFusion(e, pokeA.id, pokeB.id, null)} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 4, color: '#fff3c4' }}>{apercuNom}</div>
                    <div style={{ marginBottom: 6 }}>
                      {apercuTypes.map((t) => <PastilleType key={t} type={t} />)}
                    </div>
                    {apercuStats && (
                      <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#c3cde0' }}>
                        <span>PV {apercuStats.pvBase}</span>
                        <span>ATT {apercuStats.attaqueBase}</span>
                        <span>DEF {apercuStats.defBase}</span>
                        <span>VIT {apercuStats.vitesseBase}</span>
                      </div>
                    )}
                    {pokeA && pokeB && (pokeA.shiny && pokeB.shiny) && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#fcd34d', fontWeight: 700 }}>✨ Fusion SHINY (2 parents shiny) !</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {pokeA && pokeB && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 8, color: assezAdn ? '#7ee3a8' : '#fca5a5' }}>
                  Cout : {cout} ADN {!assezAdn && <span>(il t'en manque {cout - adnFusion})</span>}
                </div>
                <button style={{ ...S.bouton, opacity: peutFusionner ? 1 : 0.45, cursor: peutFusionner ? 'pointer' : 'default' }} disabled={!peutFusionner} onClick={lancerFusion}>
                  Fusionner
                </button>
              </div>
            )}
          </div>

          <div className="cf-collection">
            <input
              style={S.recherche}
              type="text"
              placeholder="Rechercher un Pokemon..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            <div className="cf-grille" style={S.grille}>
              {liste.map((p) => {
                const choisi = p.uid === choixA || p.uid === choixB
                return (
                  <button
                    key={p.uid}
                    style={{ ...S.carte, borderColor: choisi ? '#fcd34d' : (pokeA ? '#7ee3a8' : '#2a3242'), background: choisi ? 'rgba(252,211,77,0.08)' : S.carte.background }}
                    onClick={() => choisir(p.uid)}
                  >
                    <img src={p.spriteNormal || p.sprite} alt={p.nom} style={S.carteSprite} />
                    <span>{p.nom}{p.shiny ? ' ✨' : ''}</span>
                    <span style={{ color: '#7a87a0' }}>N.{p.niveau}</span>
                    {choisi && <span style={{ position: 'absolute', top: 4, right: 6, color: '#fcd34d', fontWeight: 800 }}>✓</span>}
                  </button>
                )
              })}
              {liste.length === 0 && (
                <p style={{ color: '#7a87a0', fontSize: 13, gridColumn: '1 / -1' }}>
                  {pokeA ? `Aucun partenaire de fusion pour ${pokeA.nom} dans ta collection (voir le Pokedex pour savoir qui chasser).` : 'Aucun Pokemon fusionnable.'}
                </p>
              )}
            </div>
          </div>

          {mesFusions.length > 0 && (
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>Mes fusions ({mesFusions.length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                {mesFusions.map((f) => {
                  const roleActuel = ROLES[f.role]?.nom || f.role || '?'
                  const roleTete = ROLES[f.roleTete]?.nom || f.roleTete
                  const roleCorps = ROLES[f.roleCorps]?.nom || f.roleCorps
                  const genesDifferents = f.roleTete && f.roleCorps && f.roleTete !== f.roleCorps
                  const dec = registre[cleFusion(f.teteId, f.corpsId)]
                  return (
                    <div key={f.uid} style={{ background: f.shiny ? 'rgba(252,211,77,0.07)' : 'rgba(126,227,168,0.05)', border: f.shiny ? '1px solid rgba(252,211,77,0.5)' : '1px solid rgba(126,227,168,0.3)', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <img src={f.sprite} alt={f.nom} style={{ width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated' }} loading="lazy"
                        onError={(e) => erreurSpriteFusion(e, f.teteId, f.corpsId, null)} />
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{f.shiny ? '✨ ' : ''}{f.nom}</span>
                      <span style={{ fontSize: 10, color: '#9ca8bd' }}>{f.nomTete} + {f.nomCorps}</span>
                      <span style={{ fontSize: 10, color: '#7a87a0' }}>N.{f.niveau} — {roleActuel}</span>
                      {dec && <span style={{ fontSize: 9, color: '#fcd34d' }}>★ Decouverte par {dec.pseudo}</span>}
                      {genesDifferents && onChangerGene && (
                        <button style={S.boutonGene} onClick={() => onChangerGene(f.uid)}
                          title={`Gene dominant : ${f.geneDominant === 'corps' ? 'Corps' : 'Tete'}. Clique pour basculer sur ${f.geneDominant === 'corps' ? roleTete : roleCorps}.`}>
                          Gene : {f.geneDominant === 'corps' ? `Corps (${roleCorps})` : `Tete (${roleTete})`} ↔
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  )
}

export default CentreFusion