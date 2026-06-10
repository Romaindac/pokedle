import { useState, useMemo } from 'react'
import { creerFusion, trouverSpriteFusionSync, nomFusion, statsFusion, typesFusion, coutFusion, especeFusionnable, urlSpriteFusionSecours } from './fusion'
import { trouverFusion } from './fusionsDisponibles'
import { partenairesDe, ESPECES_FUSION } from './fusionsDisponibles'
import { nomShowdown } from './pokedexNoms'

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

// Cascade d'erreur pour un sprite de fusion : GitLab -> miroir GitHub -> action finale.
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
    background: 'rgba(5, 8, 14, 0.78)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
  },
  fenetre: {
    width: 'min(96vw, 980px)', maxHeight: '92vh', overflow: 'auto',
    boxSizing: 'border-box', padding: '18px 18px 22px',
    background: 'linear-gradient(168deg, #1a1f2b, #141925)',
    border: '1px solid rgba(252, 211, 77, 0.45)', borderRadius: 18,
    boxShadow: '0 22px 70px rgba(0,0,0,0.65)',
    color: '#e8edf7', fontFamily: "'Rubik', system-ui, sans-serif",
  },
  header: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
  titre: { margin: 0, fontSize: 20, flex: 1 },
  adn: { fontWeight: 700, color: '#7ee3a8', background: 'rgba(126,227,168,0.1)', border: '1px solid rgba(126,227,168,0.35)', borderRadius: 999, padding: '4px 12px', fontSize: 14 },
  fermer: { background: 'none', border: 'none', color: '#9ca8bd', fontSize: 20, cursor: 'pointer', padding: 6 },
  corps: { display: 'flex', flexDirection: 'column', gap: 14 },
  slots: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' },
  slot: { width: 120, minHeight: 120, border: '2px dashed #3a4356', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative', padding: 8, background: 'rgba(255,255,255,0.02)' },
  slotSprite: { width: 72, height: 72, objectFit: 'contain', imageRendering: 'pixelated' },
  resultat: { textAlign: 'center', minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fusionPreview: { display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center', flexWrap: 'wrap' },
  fusionSprite: { width: 110, height: 110, objectFit: 'contain', imageRendering: 'pixelated' },
  grille: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))', gap: 8, maxHeight: 300, overflow: 'auto', padding: 4 },
  carte: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'rgba(255,255,255,0.03)', border: '1px solid #2a3242', borderRadius: 10, padding: '8px 4px', cursor: 'pointer', color: '#dfe6f2', fontSize: 11 },
  carteSprite: { width: 52, height: 52, objectFit: 'contain', imageRendering: 'pixelated' },
  recherche: { width: '100%', boxSizing: 'border-box', background: '#10151f', border: '1px solid #2a3242', borderRadius: 10, padding: '9px 12px', color: '#e8edf7', fontSize: 13, marginBottom: 8 },
  bouton: { background: 'linear-gradient(135deg, #fcd34d, #f59e0b)', border: 'none', borderRadius: 12, color: '#1a1205', fontWeight: 800, fontSize: 14, padding: '12px 22px', cursor: 'pointer' },
  onglet: (actif) => ({ flex: 1, padding: '9px 10px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
    border: actif ? '1px solid #fcd34d' : '1px solid #2a3242',
    background: actif ? 'rgba(252,211,77,0.12)' : 'rgba(255,255,255,0.03)', color: '#e8edf7' }),
}

function PastilleType({ type }) {
  return (
    <span style={{ background: COULEUR_TYPE[type] || '#888', color: '#0d1117', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginRight: 4 }}>
      {NOM_TYPE_FR[type] || type}
    </span>
  )
}

function CentreFusion({
  collection = [],
  adnFusion = 0,
  onFusionner,
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
        <div className="cf-header" style={S.header}>
          <h2 className="cf-titre" style={S.titre}>🧬 Centre de Fusion</h2>
          <div className="cf-adn" style={S.adn}>🧬 {adnFusion} ADN</div>
          <button className="cf-fermer" style={S.fermer} onClick={onFermer}>✕</button>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button onClick={() => setOnglet('fusion')} style={S.onglet(onglet === 'fusion')}>⚡ Fusionner</button>
          <button onClick={() => { setOnglet('pokedex'); setDexDetail(null) }} style={S.onglet(onglet === 'pokedex')}>📖 Pokedex des fusions</button>
        </div>

        {/* ================= ONGLET POKEDEX ================= */}
        {onglet === 'pokedex' && !dexEspece && (
          <div>
            <p style={{ fontSize: 13, color: '#9ca8bd', marginTop: 0 }}>
              Choisis un Pokemon pour voir <strong>toutes ses fusions</strong>. Les ombres = Pokemon que tu n'as pas encore. ({nbPossedees} / {ESPECES_FUSION.length} possedes)
            </p>
            <input style={S.recherche} type="text" placeholder="Rechercher (nom anglais ou numero)..."
              value={dexRecherche} onChange={(e) => setDexRecherche(e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(74px, 1fr))', gap: 6, maxHeight: 430, overflow: 'auto', padding: 2 }}>
              {dexListe.map((id) => {
                const possede = especesPossedees.has(id)
                return (
                  <button key={id} onClick={() => { setDexEspece(id); setDexDetail(null) }}
                    style={{ ...S.carte, padding: '6px 2px' }}>
                    <img src={`${SPRITE_POKEAPI}${id}.png`} alt={nomShowdown(id) || id}
                      style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'pixelated', filter: possede ? 'none' : 'brightness(0) opacity(0.55)' }}
                      loading="lazy" onError={(e) => { e.currentTarget.style.visibility = 'hidden' }} />
                    <span style={{ fontSize: 10, color: possede ? '#dfe6f2' : '#5b6575' }}>{possede ? (nomShowdown(id) || id) : `N.${id}`}</span>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(92px, 1fr))', gap: 8, maxHeight: 380, overflow: 'auto', padding: 2 }}>
                {partenaires.map((idP) => {
                  const f = trouverSpriteFusionSync(dexEspece, idP)
                  if (!f) return null
                  const possedeP = especesPossedees.has(idP)
                  const realisable = aLEspece && possedeP
                  const detailOuvert = dexDetail === idP
                  return (
                    <button key={idP} onClick={() => setDexDetail(detailOuvert ? null : idP)}
                      style={{ ...S.carte, borderColor: detailOuvert ? '#fcd34d' : (realisable ? '#7ee3a8' : '#2a3242') }}>
                      <img src={f.url} alt="fusion"
                        style={{ width: 62, height: 62, objectFit: 'contain', imageRendering: 'pixelated', filter: realisable ? 'none' : 'brightness(0) opacity(0.6)' }}
                        loading="lazy" onError={(e) => erreurSpriteFusion(e, dexEspece, idP, (img) => { const b = img.closest('button'); if (b) b.style.display = 'none' })} />
                      <span style={{ fontSize: 10, color: realisable ? '#7ee3a8' : '#5b6575' }}>
                        {realisable ? '+ ' + (nomShowdown(idP) || idP) : '???'}
                      </span>
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
                return (
                  <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: '1px solid rgba(96,165,250,0.35)', background: 'rgba(96,165,250,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <img src={f.url} alt="fusion" style={{ width: 72, height: 72, objectFit: 'contain', imageRendering: 'pixelated', filter: realisable ? 'none' : 'brightness(0) opacity(0.6)' }}
                      onError={(e) => erreurSpriteFusion(e, dexEspece, idP, null)} />
                    <div style={{ flex: 1, minWidth: 200 }}>
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
                      <button style={{ ...S.bouton, padding: '8px 16px', fontSize: 13 }} onClick={() => preparerFusion(dexEspece, idP)}>⚡ Preparer</button>
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
              <div className="cf-slot" style={{ ...S.slot, borderStyle: pokeA ? 'solid' : 'dashed', borderColor: pokeA ? '#fcd34d' : '#3a4356' }}>
                {pokeA ? (
                  <>
                    <img src={pokeA.spriteNormal || pokeA.sprite} alt={pokeA.nom} style={S.slotSprite} />
                    <span style={{ fontSize: 12 }}>{pokeA.nom}</span>
                    <button style={{ ...S.fermer, position: 'absolute', top: 2, right: 4, fontSize: 13 }} onClick={() => { setChoixA(null); setChoixB(null) }}>✕</button>
                  </>
                ) : <span style={{ color: '#5b6575', fontSize: 12 }}>Pokemon 1</span>}
              </div>

              <button
                style={{ ...S.fermer, fontSize: 24, opacity: (!pokeA || !pokeB) ? 0.35 : 1 }}
                disabled={!pokeA || !pokeB}
                onClick={() => setInverse((v) => !v)}
                title="Inverser tete / corps (change le sprite)"
              >↔</button>

              <div className="cf-slot" style={{ ...S.slot, borderStyle: pokeB ? 'solid' : 'dashed', borderColor: pokeB ? '#fcd34d' : '#3a4356' }}>
                {pokeB ? (
                  <>
                    <img src={pokeB.spriteNormal || pokeB.sprite} alt={pokeB.nom} style={S.slotSprite} />
                    <span style={{ fontSize: 12 }}>{pokeB.nom}</span>
                    <button style={{ ...S.fermer, position: 'absolute', top: 2, right: 4, fontSize: 13 }} onClick={() => setChoixB(null)}>✕</button>
                  </>
                ) : <span style={{ color: '#5b6575', fontSize: 12 }}>Pokemon 2</span>}
              </div>
            </div>

            <div className="cf-resultat" style={S.resultat}>
              {!pokeA || !pokeB ? (
                <p style={{ color: '#7a87a0', fontSize: 13 }}>
                  {pokeA ? 'Choisis le 2e Pokemon parmi les partenaires affiches.' : 'Choisis deux Pokemon ci-dessous pour voir la fusion.'}
                </p>
              ) : !apercu ? (
                <div style={{ color: '#fca5a5', fontSize: 13 }}>
                  <p style={{ margin: '4px 0' }}>😕 Pas de sprite dessine pour cette fusion.</p>
                </div>
              ) : (
                <div className="cf-fusion-preview" style={S.fusionPreview}>
                  <img src={apercu.url} alt={apercuNom} style={S.fusionSprite}
                    onError={(e) => erreurSpriteFusion(e, pokeA.id, pokeB.id, null)} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>{apercuNom}</div>
                    <div style={{ marginBottom: 6 }}>
                      {apercuTypes.map((t) => <PastilleType key={t} type={t} />)}
                    </div>
                    {apercuStats && (
                      <div style={{ display: 'flex', gap: 10, fontSize: 13, color: '#c3cde0' }}>
                        <span>❤️ {apercuStats.pvBase}</span>
                        <span>⚔️ {apercuStats.attaqueBase}</span>
                        <span>🛡️ {apercuStats.defBase}</span>
                        <span>💨 {apercuStats.vitesseBase}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {pokeA && pokeB && (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <div style={{ fontSize: 13, marginBottom: 8, color: assezAdn ? '#7ee3a8' : '#fca5a5' }}>
                  Cout : 🧬 {cout} ADN {!assezAdn && <span>(il t'en manque {cout - adnFusion})</span>}
                </div>
                <button style={{ ...S.bouton, opacity: peutFusionner ? 1 : 0.45, cursor: peutFusionner ? 'pointer' : 'default' }} disabled={!peutFusionner} onClick={lancerFusion}>
                  ⚡ Fusionner
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
                    <span>{p.nom}</span>
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
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 8 }}>🧬 Mes fusions ({mesFusions.length})</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
                {mesFusions.map((f) => (
                  <div key={f.uid} style={{ background: 'rgba(126,227,168,0.05)', border: '1px solid rgba(126,227,168,0.3)', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <img src={f.sprite} alt={f.nom} style={{ width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated' }} loading="lazy" />
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{f.nom}</span>
                    <span style={{ fontSize: 10, color: '#9ca8bd' }}>{f.nomTete} + {f.nomCorps}</span>
                    <span style={{ fontSize: 10, color: '#7a87a0' }}>N.{f.niveau}</span>
                  </div>
                ))}
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