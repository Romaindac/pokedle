import { useState } from 'react'
import { BALLS, PIERRES, BONBONS } from './config'
import { BONBONS_IV } from './ameliorations'
import { nomShowdown } from './pokedexNoms'

const ICONES_BALLS = {
  poke: '/icons/ball-poke.png',
  super: '/icons/ball-super.png',
  hyper: '/icons/ball-hyper.png',
  master: '/icons/ball-master.png',
}
const ICONES_BONBONS = {
  'bonbon': '/icons/bonbon.png',
  'super-bonbon': '/icons/super-bonbon.png',
}
const ICONES_PIERRES = {
  'fire-stone': '/icons/fire-stone.png',
  'water-stone': '/icons/water-stone.png',
  'thunder-stone': '/icons/thunder-stone.png',
  'leaf-stone': '/icons/leaf-stone.png',
  'moon-stone': '/icons/moon-stone.png',
  'sun-stone': '/icons/sun-stone.png',
  'shiny-stone': '/icons/shiny-stone.png',
  'dusk-stone': '/icons/dusk-stone.png',
  'dawn-stone': '/icons/dawn-stone.png',
  'ice-stone': '/icons/ice-stone.png',
}

function imageObjet(info, fallback) {
  return (info && info.sprite) || fallback || null
}

// Sprite Pokémon animé Showdown (avec gestion shiny + repli).
function SpritePoke({ poke, classe = 'sac-m-poke-sprite' }) {
  const num = poke.id
  const nomSd = num ? nomShowdown(num) : (poke.nom || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const shiny = !!poke.shiny
  const urlAnime = nomSd ? `https://play.pokemonshowdown.com/sprites/${shiny ? 'ani-shiny' : 'ani'}/${nomSd}.gif` : null
  const urlHd = num ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${shiny ? 'official-artwork/shiny' : 'official-artwork'}/${num}.png` : null
  const fallback = poke.sprite
  const onError = (e) => {
    const img = e.currentTarget
    const etape = parseInt(img.dataset.etape || '0', 10)
    if (etape === 0 && urlHd) { img.dataset.etape = '1'; img.src = urlHd }
    else if (etape <= 1 && fallback) { img.dataset.etape = '2'; img.src = fallback }
  }
  return <img src={urlAnime || fallback || urlHd} alt={poke.nom} className={classe} data-etape="0" loading="lazy" onError={onError} />
}

function Sac({ balls, pierres, bonbons = {}, objetsBoss = {}, collection, onEvoluerPierre, onUtiliserBonbon, onUtiliserBonbonIV, onFermer }) {
  const [onglet, setOnglet] = useState('balls')
  const [pierreSelectionnee, setPierreSelectionnee] = useState(null)
  const [bonbonSelectionne, setBonbonSelectionne] = useState(null)
  const [bonbonIVSelectionne, setBonbonIVSelectionne] = useState(null)
  const [rechercheIV, setRechercheIV] = useState('')

  const pokemonsPourPierre = pierreSelectionnee
    ? collection.filter((p) => (p.evolutionsPierre || []).some((e) => e.pierre === pierreSelectionnee))
    : []

  function changerOnglet(o) {
    setOnglet(o)
    setPierreSelectionnee(null)
    setBonbonSelectionne(null)
    setBonbonIVSelectionne(null)
    setRechercheIV('')
  }

  const collectionIV = (() => {
    const q = rechercheIV.trim().toLowerCase()
    if (!q) return collection
    return collection.filter((p) => (p.nom || '').toLowerCase().includes(q))
  })()

  function ivDuPoke(poke, cleBonbon) {
    const stat = BONBONS_IV[cleBonbon]?.stat
    if (!stat || !poke.iv) return 0
    return Number.isFinite(poke.iv[stat]) ? poke.iv[stat] : 0
  }

  // Item d'inventaire (case carrée).
  function CaseItem({ img, emoji, nom, desc, qte, onClick, disabled, title }) {
    const Tag = onClick ? 'button' : 'div'
    return (
      <Tag
        className={`sac-m-item ${qte === 0 ? 'vide' : ''} ${onClick ? 'cliquable' : ''}`}
        onClick={onClick} disabled={disabled} title={title}>
        <div className="sac-m-item-sprite">
          {img ? <img src={img} alt={nom} className="sac-m-item-img" /> : <span className="sac-m-item-emoji">{emoji}</span>}
        </div>
        <span className="sac-m-item-nom">{nom}{desc && <span className="sac-m-item-desc"> {desc}</span>}</span>
        <span className="sac-m-item-qte">×{qte}</span>
      </Tag>
    )
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="sac-m-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="sac-m-entete">
          <h2>🎒 Sac</h2>
          <button className="sac-m-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="sac-m-onglets">
          <button className={`sac-m-onglet ${onglet === 'balls' ? 'actif' : ''}`} onClick={() => changerOnglet('balls')}>
            <img src={imageObjet(BALLS.poke, ICONES_BALLS.poke)} alt="" className="sac-m-onglet-img" /> Balls
          </button>
          <button className={`sac-m-onglet ${onglet === 'pierres' ? 'actif' : ''}`} onClick={() => changerOnglet('pierres')}>💎 Pierres</button>
          <button className={`sac-m-onglet ${onglet === 'objets' ? 'actif' : ''}`} onClick={() => changerOnglet('objets')}>🍬 Objets</button>
          <button className={`sac-m-onglet ${onglet === 'iv' ? 'actif' : ''}`} onClick={() => changerOnglet('iv')}>✨ Bonbons IV</button>
        </div>

        {/* Balls */}
        {onglet === 'balls' && (
          <div className="sac-m-grille">
            {Object.entries(BALLS).map(([type, info]) => (
              <CaseItem key={type} img={imageObjet(info, ICONES_BALLS[type])} emoji={info.emoji || '◓'} nom={info.nom} qte={balls[type] || 0} />
            ))}
          </div>
        )}

        {/* Pierres */}
        {onglet === 'pierres' && !pierreSelectionnee && (
          <div className="sac-m-grille">
            {Object.entries(PIERRES).map(([type, info]) => {
              const qte = pierres[type] || 0
              return (
                <CaseItem key={type} img={imageObjet(info, ICONES_PIERRES[type])} emoji={info.emoji} nom={info.nom} qte={qte}
                  onClick={() => setPierreSelectionnee(type)} disabled={qte === 0}
                  title={qte === 0 ? "Tu n'en as pas" : 'Voir les Pokémon qui évoluent'} />
              )
            })}
          </div>
        )}

        {onglet === 'pierres' && pierreSelectionnee && (
          <div className="sac-m-detail">
            <button className="sac-m-retour" onClick={() => setPierreSelectionnee(null)}>← Retour</button>
            <h3 className="sac-m-detail-titre">
              {(() => { const img = imageObjet(PIERRES[pierreSelectionnee], ICONES_PIERRES[pierreSelectionnee]); return img ? <img src={img} alt="" className="sac-m-detail-icone" /> : PIERRES[pierreSelectionnee].emoji })()} {PIERRES[pierreSelectionnee].nom} (×{pierres[pierreSelectionnee] || 0})
            </h3>
            <p className="sac-m-aide">Clique sur un Pokémon pour le faire évoluer :</p>
            <div className="sac-m-poke-grille">
              {pokemonsPourPierre.length === 0 ? (
                <p className="sac-m-vide">Aucun de tes Pokémon n'évolue avec cette pierre.</p>
              ) : (
                pokemonsPourPierre.map((poke) => {
                  const evo = (poke.evolutionsPierre || []).find((e) => e.pierre === pierreSelectionnee)
                  return (
                    <button key={poke.uid} className="sac-m-poke" onClick={() => { onEvoluerPierre(poke.uid, evo.evolueEn, pierreSelectionnee); setPierreSelectionnee(null) }}>
                      <div className="sac-m-poke-zone"><SpritePoke poke={poke} /></div>
                      <span className="sac-m-poke-nom">{poke.nom}</span>
                      <span className="sac-m-poke-info">→ {evo.evolueEn}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* Objets (bonbons) */}
        {onglet === 'objets' && !bonbonSelectionne && (
          <div className="sac-m-grille">
            {Object.entries(BONBONS).map(([type, info]) => {
              const qte = bonbons[type] || 0
              return (
                <CaseItem key={type} img={imageObjet(info, ICONES_BONBONS[type])} emoji={info.emoji} nom={info.nom} desc={`(${info.description})`} qte={qte}
                  onClick={() => setBonbonSelectionne(type)} disabled={qte === 0}
                  title={qte === 0 ? "Tu n'en as pas" : 'Choisir un Pokémon'} />
              )
            })}
          </div>
        )}

        {onglet === 'objets' && bonbonSelectionne && (
          <div className="sac-m-detail">
            <button className="sac-m-retour" onClick={() => setBonbonSelectionne(null)}>← Retour</button>
            <h3 className="sac-m-detail-titre">
              {(() => { const img = imageObjet(BONBONS[bonbonSelectionne], ICONES_BONBONS[bonbonSelectionne]); return img ? <img src={img} alt="" className="sac-m-detail-icone" /> : BONBONS[bonbonSelectionne].emoji })()} {BONBONS[bonbonSelectionne].nom} (×{bonbons[bonbonSelectionne] || 0})
            </h3>
            <p className="sac-m-aide">Clique sur un Pokémon pour lui donner :</p>
            <div className="sac-m-poke-grille">
              {collection.length === 0 ? (
                <p className="sac-m-vide">Aucun Pokémon.</p>
              ) : (
                collection.map((poke) => (
                  <button key={poke.uid} className="sac-m-poke" onClick={() => { onUtiliserBonbon(poke.uid, bonbonSelectionne) }}>
                    <div className="sac-m-poke-zone"><SpritePoke poke={poke} /></div>
                    <span className="sac-m-poke-nom">{poke.nom}</span>
                    <span className="sac-m-poke-info">N.{poke.niveau || 1}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bonbons IV */}
        {onglet === 'iv' && !bonbonIVSelectionne && (
          <>
            <p className="sac-m-aide">Les bonbons d'IV (butin de boss) augmentent de +1 l'IV d'une stat d'un Pokémon (max 31).</p>
            <div className="sac-m-grille">
              {Object.entries(BONBONS_IV).map(([cle, info]) => {
                const qte = objetsBoss[cle] || 0
                return (
                  <CaseItem key={cle} img={info.sprite} emoji={info.emoji} nom={info.nom} qte={qte}
                    onClick={() => setBonbonIVSelectionne(cle)} disabled={qte === 0}
                    title={qte === 0 ? "Tu n'en as pas (butin de boss)" : 'Choisir un Pokémon'} />
                )
              })}
            </div>
          </>
        )}

        {onglet === 'iv' && bonbonIVSelectionne && (
          <div className="sac-m-detail">
            <button className="sac-m-retour" onClick={() => { setBonbonIVSelectionne(null); setRechercheIV('') }}>← Retour</button>
            <h3 className="sac-m-detail-titre">
              {(() => { const info = BONBONS_IV[bonbonIVSelectionne]; return info.sprite ? <img src={info.sprite} alt="" className="sac-m-detail-icone" /> : info.emoji })()} {BONBONS_IV[bonbonIVSelectionne].nom} (×{objetsBoss[bonbonIVSelectionne] || 0})
            </h3>
            <p className="sac-m-aide">Clique sur un Pokémon pour +1 IV {BONBONS_IV[bonbonIVSelectionne].stat} (max 31) :</p>
            <input type="text" className="sac-m-recherche" placeholder="🔍 Rechercher un Pokémon..."
              value={rechercheIV} onChange={(e) => setRechercheIV(e.target.value)} />
            <div className="sac-m-poke-grille">
              {collectionIV.length === 0 ? (
                <p className="sac-m-vide">Aucun Pokémon ne correspond.</p>
              ) : (
                collectionIV.map((poke) => {
                  const ivVal = ivDuPoke(poke, bonbonIVSelectionne)
                  const auMax = ivVal >= 31
                  return (
                    <button key={poke.uid} className={`sac-m-poke ${auMax ? 'au-max' : ''}`} disabled={auMax}
                      title={auMax ? 'IV déjà au max (31)' : `IV ${BONBONS_IV[bonbonIVSelectionne].stat} : ${ivVal}/31`}
                      onClick={() => { if (!auMax) onUtiliserBonbonIV(poke.uid, bonbonIVSelectionne) }}>
                      {poke.shiny && <span className="sac-m-poke-shiny">✨</span>}
                      <div className="sac-m-poke-zone"><SpritePoke poke={poke} /></div>
                      <span className="sac-m-poke-nom">{poke.nom}</span>
                      <span className="sac-m-poke-info">{auMax ? 'MAX' : `${ivVal}/31`}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sac