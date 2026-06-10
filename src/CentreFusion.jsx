import { useState, useEffect, useRef } from 'react'
import { creerFusion, trouverSpriteFusion, nomFusion, statsFusion, typesFusion, coutFusion } from './fusion'

// ============================================================
// CACHE GLOBAL (niveau module) : persiste entre les ouvertures du panneau
// pendant toute la session. cle "idMin-idMax" -> true/false (sprite existe ?)
// ============================================================
const cachePaires = {}

function clePaire(a, b) { return a < b ? `${a}-${b}` : `${b}-${a}` }

async function paireFusionnable(idA, idB) {
  const cle = clePaire(idA, idB)
  if (cachePaires[cle] !== undefined) return cachePaires[cle]
  const trouve = await trouverSpriteFusion(idA, idB)
  const ok = !!trouve
  cachePaires[cle] = ok
  return ok
}

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
}

function PastilleType({ type }) {
  return (
    <span className="cf-type" style={{ background: COULEUR_TYPE[type] || '#888', color: '#0d1117', borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700, marginRight: 4 }}>
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
  const [choixA, setChoixA] = useState(null)
  const [choixB, setChoixB] = useState(null)
  const [recherche, setRecherche] = useState('')
  const [apercu, setApercu] = useState(null)
  const [chargement, setChargement] = useState(false)
  const [erreurSprite, setErreurSprite] = useState(false)
  const [inverse, setInverse] = useState(false)
  const demandeRef = useRef(0)

  // partenaires : { [idEspece]: true (au moins 1 fusion possible) | false (aucune) }
  const [partenaires, setPartenaires] = useState({})
  const [scanGlobal, setScanGlobal] = useState(false)
  const [progres, setProgres] = useState(0)
  // fusionnables : { [idEspece]: true|false } AVEC le Pokemon A selectionne.
  const [fusionnables, setFusionnables] = useState({})
  const [scanA, setScanA] = useState(false)
  const scanGlobalRef = useRef(0)
  const scanARef = useRef(0)

  const pokeA = collection.find((p) => p.uid === choixA) || null
  const pokeB = collection.find((p) => p.uid === choixB) || null

  // Especes uniques de la collection (hors fusions deja faites).
  const especes = [...new Set(collection.filter((p) => p && !p.estFusion).map((p) => p.id))]

  // ===== SCAN GLOBAL a l'ouverture : qui a au moins UN partenaire ? =====
  // Early-exit : des qu'un partenaire est trouve pour une espece, elle est validee.
  useEffect(() => {
    const monScan = ++scanGlobalRef.current
    if (especes.length < 2) return
    setScanGlobal(true); setProgres(0)
    let resolues = 0

    async function verifierEspece(id) {
      const autres = especes.filter((x) => x !== id)
      // Teste les paires une par une, s'arrete au premier partenaire trouve.
      for (const autre of autres) {
        if (scanGlobalRef.current !== monScan) return
        const ok = await paireFusionnable(id, autre)
        if (ok) { return true }
      }
      return false
    }

    async function lancer() {
      // 4 especes verifiees en parallele (chacune fait ses requetes en serie).
      const file = [...especes]
      async function ouvrier() {
        while (file.length > 0) {
          if (scanGlobalRef.current !== monScan) return
          const id = file.shift()
          const ok = await verifierEspece(id)
          if (scanGlobalRef.current !== monScan) return
          resolues += 1
          setPartenaires((p) => ({ ...p, [id]: !!ok }))
          setProgres(Math.round((resolues / especes.length) * 100))
        }
      }
      await Promise.all([ouvrier(), ouvrier(), ouvrier(), ouvrier()])
      if (scanGlobalRef.current === monScan) setScanGlobal(false)
    }
    lancer()
    return () => { scanGlobalRef.current += 1 }
  }, [])

  // ===== SCAN CIBLE : quand un Pokemon A est choisi, qui fusionne avec LUI ? =====
  useEffect(() => {
    if (!pokeA) { setFusionnables({}); setScanA(false); return }
    const monScan = ++scanARef.current
    setScanA(true); setFusionnables({})
    const cibles = especes.filter((id) => id !== pokeA.id)
    let index = 0
    const TAILLE_LOT = 8
    async function lot() {
      if (scanARef.current !== monScan) return
      const tranche = cibles.slice(index, index + TAILLE_LOT)
      if (tranche.length === 0) { setScanA(false); return }
      index += TAILLE_LOT
      const res = {}
      await Promise.all(tranche.map(async (id) => { res[id] = await paireFusionnable(pokeA.id, id) }))
      if (scanARef.current !== monScan) return
      setFusionnables((f) => ({ ...f, ...res }))
      lot()
    }
    lot()
  }, [choixA])

  // Apercu de la fusion selectionnee.
  useEffect(() => {
    if (!pokeA || !pokeB) { setApercu(null); setErreurSprite(false); return }
    const demande = ++demandeRef.current
    setChargement(true); setErreurSprite(false); setApercu(null)
    const a = inverse ? pokeB : pokeA
    const b = inverse ? pokeA : pokeB
    trouverSpriteFusion(a.id, b.id).then((trouve) => {
      if (demande !== demandeRef.current) return
      setChargement(false)
      if (trouve) setApercu(trouve)
      else { setApercu(null); setErreurSprite(true) }
    })
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
    if (!fusion) { setErreurSprite(true); return }
    onFusionner && onFusionner(pokeA, pokeB, fusion, cout)
    setChoixA(null); setChoixB(null); setApercu(null); setInverse(false)
  }

  // ===== LISTE AFFICHEE =====
  // Sans selection : on masque ceux confirmes SANS partenaire (false).
  // Avec un Pokemon A : on ne montre que A + ceux fusionnables avec A
  // (ceux pas encore verifies restent visibles, estompes).
  const liste = collection
    .filter((p) => p && !p.estFusion)
    .filter((p) => !recherche || (p.nom || '').toLowerCase().includes(recherche.toLowerCase()))
    .filter((p) => {
      if (pokeA) {
        if (p.uid === choixA || p.uid === choixB) return true
        if (p.id === pokeA.id) return false // meme espece : pas de fusion
        return fusionnables[p.id] !== false // garde fusionnables + pas-encore-verifies
      }
      return partenaires[p.id] !== false // masque ceux sans AUCUN partenaire
    })

  return (
    <div className="cf-overlay" style={S.overlay} onClick={onFermer}>
      <div className="cf-fenetre" style={S.fenetre} onClick={(e) => e.stopPropagation()}>
        <div className="cf-header" style={S.header}>
          <h2 className="cf-titre" style={S.titre}>🧬 Centre de Fusion</h2>
          <div className="cf-adn" style={S.adn}>🧬 {adnFusion} ADN</div>
          <button className="cf-fermer" style={S.fermer} onClick={onFermer}>✕</button>
        </div>

        <p className="cf-intro" style={{ fontSize: 13, color: '#9ca8bd', lineHeight: 1.5, marginTop: 0 }}>
          Fusionne deux Pokemon en un seul ! La fusion <strong>consomme les deux Pokemon</strong> et
          cree un nouvel etre unique. Seuls les Pokemon avec une fusion possible sont affiches.
        </p>

        {scanGlobal && (
          <p style={{ fontSize: 12, color: '#fcd34d', margin: '0 0 6px' }}>
            🔎 Analyse des fusions possibles dans ta collection... {progres}%
          </p>
        )}

        <div className="cf-corps" style={S.corps}>
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
                  {pokeA ? (scanA ? 'Recherche des partenaires de ' + pokeA.nom + '...' : 'Choisis le 2e Pokemon parmi les partenaires affiches.') : 'Choisis deux Pokemon ci-dessous pour voir la fusion.'}
                </p>
              ) : chargement ? (
                <p style={{ color: '#7a87a0', fontSize: 13 }}>Recherche du sprite de fusion...</p>
              ) : erreurSprite ? (
                <div style={{ color: '#fca5a5', fontSize: 13 }}>
                  <p style={{ margin: '4px 0' }}>😕 Pas de sprite dessine pour cette fusion.</p>
                  <p style={{ margin: 0, opacity: 0.8 }}>Essaie le bouton ↔ pour inverser, ou une autre paire.</p>
                </div>
              ) : apercu ? (
                <div className="cf-fusion-preview" style={S.fusionPreview}>
                  <img src={apercu.url} alt={apercuNom} style={S.fusionSprite} />
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
              ) : null}
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
              {pokeA && scanA && (
                <p style={{ color: '#fcd34d', fontSize: 12, gridColumn: '1 / -1', margin: '2px 0' }}>
                  🔎 Verification des partenaires de {pokeA.nom}...
                </p>
              )}
              {liste.map((p) => {
                const choisi = p.uid === choixA || p.uid === choixB
                const confirme = pokeA ? fusionnables[p.id] === true : partenaires[p.id] === true
                const enAttente = pokeA
                  ? (!choisi && fusionnables[p.id] === undefined && p.id !== pokeA.id)
                  : partenaires[p.id] === undefined
                return (
                  <button
                    key={p.uid}
                    style={{
                      ...S.carte,
                      borderColor: choisi ? '#fcd34d' : (confirme ? '#7ee3a8' : '#2a3242'),
                      background: choisi ? 'rgba(252,211,77,0.08)' : S.carte.background,
                      opacity: enAttente ? 0.55 : 1,
                    }}
                    onClick={() => choisir(p.uid)}
                  >
                    <img src={p.spriteNormal || p.sprite} alt={p.nom} style={S.carteSprite} />
                    <span>{p.nom}</span>
                    <span style={{ color: '#7a87a0' }}>N.{p.niveau}</span>
                    {choisi && <span style={{ position: 'absolute', top: 4, right: 6, color: '#fcd34d', fontWeight: 800 }}>✓</span>}
                    {confirme && !choisi && <span style={{ position: 'absolute', top: 4, right: 6, color: '#7ee3a8', fontWeight: 800 }}>🧬</span>}
                  </button>
                )
              })}
              {liste.length === 0 && (
                <p style={{ color: '#7a87a0', fontSize: 13, gridColumn: '1 / -1' }}>
                  {scanGlobal ? 'Analyse en cours...' : pokeA ? `Aucun partenaire de fusion pour ${pokeA.nom} dans ta collection.` : 'Aucun Pokemon avec une fusion possible.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CentreFusion