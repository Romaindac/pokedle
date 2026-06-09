import { useState, useEffect, useRef } from 'react'
import { creerFusion, trouverSpriteFusion, nomFusion, statsFusion, typesFusion, coutFusion } from './fusion'

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

function PastilleType({ type }) {
  return (
    <span className="cf-type" style={{ background: COULEUR_TYPE[type] || '#888' }}>
      {NOM_TYPE_FR[type] || type}
    </span>
  )
}

function CentreFusion({
  collection = [],   // captures du joueur
  adnFusion = 0,     // jetons ADN dispo
  onFusionner,       // (pokeA, pokeB, fusion, cout) => void
  onFermer,
}) {
  const [choixA, setChoixA] = useState(null) // uid
  const [choixB, setChoixB] = useState(null) // uid
  const [recherche, setRecherche] = useState('')
  const [apercu, setApercu] = useState(null)     // { url, teteId, corpsId } | null
  const [chargement, setChargement] = useState(false)
  const [erreurSprite, setErreurSprite] = useState(false)
  const [inverse, setInverse] = useState(false)  // force l'inversion tete/corps
  const demandeRef = useRef(0)

  const pokeA = collection.find((p) => p.uid === choixA) || null
  const pokeB = collection.find((p) => p.uid === choixB) || null

  // Quand les deux sont choisis (ou qu'on inverse), on cherche le sprite custom.
  useEffect(() => {
    if (!pokeA || !pokeB) { setApercu(null); setErreurSprite(false); return }
    const demande = ++demandeRef.current
    setChargement(true); setErreurSprite(false); setApercu(null)
    const a = inverse ? pokeB : pokeA
    const b = inverse ? pokeA : pokeB
    trouverSpriteFusion(a.id, b.id).then((trouve) => {
      if (demande !== demandeRef.current) return // resultat perime
      setChargement(false)
      if (trouve) setApercu(trouve)
      else { setApercu(null); setErreurSprite(true) }
    })
  }, [choixA, choixB, inverse])

  const cout = pokeA && pokeB ? coutFusion(pokeA, pokeB) : 0
  const assezAdn = adnFusion >= cout
  const peutFusionner = pokeA && pokeB && apercu && !chargement && assezAdn

  // Apercu calcule (nom, stats, types) selon le sens trouve.
  let apercuNom = '', apercuStats = null, apercuTypes = []
  if (apercu && pokeA && pokeB) {
    const tete  = apercu.teteId === pokeA.id ? pokeA : pokeB
    const corps = apercu.teteId === pokeA.id ? pokeB : pokeA
    apercuNom = nomFusion(tete.nom, corps.nom)
    apercuStats = statsFusion(pokeA, pokeB)
    apercuTypes = typesFusion(tete, corps)
  }

  function choisir(uid) {
    if (uid === choixA) { setChoixA(null); return }
    if (uid === choixB) { setChoixB(null); return }
    if (!choixA) { setChoixA(uid); return }
    if (!choixB) { setChoixB(uid); return }
    // Les deux pris : on remplace le premier.
    setChoixA(uid)
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
    // Reset apres fusion.
    setChoixA(null); setChoixB(null); setApercu(null); setInverse(false)
  }

  const liste = collection
    .filter((p) => p && !p.estFusion) // pas refusionner une fusion (option : autoriser plus tard)
    .filter((p) => !recherche || (p.nom || '').toLowerCase().includes(recherche.toLowerCase()))

  return (
    <div className="cf-overlay" onClick={onFermer}>
      <div className="cf-fenetre" onClick={(e) => e.stopPropagation()}>
        <div className="cf-header">
          <h2 className="cf-titre">🧬 Centre de Fusion</h2>
          <div className="cf-adn">🧬 {adnFusion} ADN</div>
          <button className="cf-fermer" onClick={onFermer}>✕</button>
        </div>

        <p className="cf-intro">
          Fusionne deux Pokemon en un seul ! La fusion <strong>consomme les deux Pokemon</strong> et
          cree un nouvel etre unique (sprite dessine main, stats = le meilleur des deux, double-type).
        </p>

        <div className="cf-corps">
          {/* Zone d'apercu central */}
          <div className="cf-apercu">
            <div className="cf-slots">
              <div className={`cf-slot ${pokeA ? 'rempli' : ''}`}>
                {pokeA ? (
                  <>
                    <img src={pokeA.spriteNormal || pokeA.sprite} alt={pokeA.nom} className="cf-slot-sprite" />
                    <span className="cf-slot-nom">{pokeA.nom}</span>
                    <button className="cf-slot-retirer" onClick={() => setChoixA(null)}>✕</button>
                  </>
                ) : <span className="cf-slot-vide">Pokemon 1</span>}
              </div>

              <button
                className="cf-inverser"
                disabled={!pokeA || !pokeB}
                onClick={() => setInverse((v) => !v)}
                title="Inverser tete / corps (change le sprite)"
              >↔</button>

              <div className={`cf-slot ${pokeB ? 'rempli' : ''}`}>
                {pokeB ? (
                  <>
                    <img src={pokeB.spriteNormal || pokeB.sprite} alt={pokeB.nom} className="cf-slot-sprite" />
                    <span className="cf-slot-nom">{pokeB.nom}</span>
                    <button className="cf-slot-retirer" onClick={() => setChoixB(null)}>✕</button>
                  </>
                ) : <span className="cf-slot-vide">Pokemon 2</span>}
              </div>
            </div>

            {/* Resultat de la fusion */}
            <div className="cf-resultat">
              {!pokeA || !pokeB ? (
                <p className="cf-hint">Choisis deux Pokemon ci-dessous pour voir la fusion.</p>
              ) : chargement ? (
                <p className="cf-hint">Recherche du sprite de fusion...</p>
              ) : erreurSprite ? (
                <div className="cf-erreur">
                  <p>😕 Pas de sprite dessine pour cette fusion.</p>
                  <p className="cf-erreur-sous">Essaie le bouton ↔ pour inverser, ou une autre paire.</p>
                </div>
              ) : apercu ? (
                <div className="cf-fusion-preview">
                  <img src={apercu.url} alt={apercuNom} className="cf-fusion-sprite" />
                  <div className="cf-fusion-infos">
                    <span className="cf-fusion-nom">{apercuNom}</span>
                    <div className="cf-fusion-types">
                      {apercuTypes.map((t) => <PastilleType key={t} type={t} />)}
                    </div>
                    {apercuStats && (
                      <div className="cf-fusion-stats">
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

            {/* Bouton fusionner */}
            {pokeA && pokeB && (
              <div className="cf-action">
                <div className={`cf-cout ${assezAdn ? '' : 'manque'}`}>
                  Cout : 🧬 {cout} ADN {!assezAdn && <span className="cf-cout-manque">(il t'en manque {cout - adnFusion})</span>}
                </div>
                <button className="cf-bouton-fusion" disabled={!peutFusionner} onClick={lancerFusion}>
                  ⚡ Fusionner
                </button>
              </div>
            )}
          </div>

          {/* Liste de la collection */}
          <div className="cf-collection">
            <input
              className="cf-recherche"
              type="text"
              placeholder="Rechercher un Pokemon..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            <div className="cf-grille">
              {liste.map((p) => {
                const choisi = p.uid === choixA || p.uid === choixB
                return (
                  <button
                    key={p.uid}
                    className={`cf-carte ${choisi ? 'choisi' : ''}`}
                    onClick={() => choisir(p.uid)}
                  >
                    <img src={p.spriteNormal || p.sprite} alt={p.nom} className="cf-carte-sprite" />
                    <span className="cf-carte-nom">{p.nom}</span>
                    <span className="cf-carte-niv">N.{p.niveau}</span>
                    {choisi && <span className="cf-carte-check">✓</span>}
                  </button>
                )
              })}
              {liste.length === 0 && <p className="cf-vide">Aucun Pokemon trouve.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CentreFusion