import { useState } from 'react'
import { BALLS, PIERRES, BONBONS } from './config'
import { OBJETS } from './objets'

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

// Sprite simple avec repli.
function SpriteMini({ poke }) {
  const fallback = poke.shiny && poke.spriteShiny ? poke.spriteShiny : (poke.sprite || poke.spriteNormal)
  return <img src={fallback} alt={poke.nom} className="btq-item-img"
    onError={(e) => { e.currentTarget.style.display = 'none' }} />
}

// Sac = inventaire. Onglet Pierres : cliquer une pierre -> choisir un Pokemon compatible -> evolution.
function Sac({ balls = {}, pierres = {}, bonbons = {}, objetsBoss = {}, collection = [], onEvoluerPierre, onUtiliserBonbon, onUtiliserBonbonIV, onFermer }) {
  const [onglet, setOnglet] = useState('balls')
  // Pierre selectionnee pour laquelle on choisit un Pokemon a faire evoluer.
  const [pierreChoisie, setPierreChoisie] = useState(null)

  const onglets = [
    { cle: 'balls', label: 'Poke Balls', icone: <img src={ICONES_BALLS.poke} alt="" className="btq-onglet-img" /> },
    { cle: 'pierres', label: 'Pierres', icone: '💎' },
    { cle: 'bonbons', label: 'Bonbons', icone: '🍬' },
    { cle: 'objets', label: 'Objets de boss', icone: '🏆' },
  ]

  function LigneItem({ sprite, sansImage, nom, sousTitre, quantite, onClick, cliquable }) {
    return (
      <div className={`btq-item ${cliquable ? 'btq-item-cliquable' : ''}`} onClick={cliquable ? onClick : undefined}
        style={cliquable ? { cursor: 'pointer' } : undefined}>
        <div className="btq-item-sprite">
          {sprite && !sansImage && <img src={sprite} alt={nom} className="btq-item-img"
            onError={(e) => { e.currentTarget.style.display = 'none' }} />}
        </div>
        <div className="btq-item-texte">
          <span className="btq-item-nom">{nom}</span>
          {sousTitre && <span className="btq-item-sous">{sousTitre}</span>}
        </div>
        <span className="btq-stock-compte">×{quantite || 0}</span>
      </div>
    )
  }

  // Pokemon de la collection qui peuvent evoluer avec la pierre choisie.
  function pokemonsPourPierre(pierre) {
    return collection.filter((p) =>
      (p.evolutionsPierre || []).some((e) => e.pierre === pierre)
    )
  }

  const entreesObjetsBoss = Object.entries(objetsBoss).filter(([, q]) => (q || 0) > 0)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="btq-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="btq-entete">
          <h2>🎒 Sac</h2>
          <button className="btq-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="btq-onglets">
          {onglets.map((o) => (
            <button key={o.cle} className={`btq-onglet ${onglet === o.cle ? 'actif' : ''}`}
              onClick={() => { setOnglet(o.cle); setPierreChoisie(null) }}>
              <span className="btq-onglet-icone">{o.icone}</span>
              <span className="btq-onglet-label">{o.label}</span>
            </button>
          ))}
        </div>

        {onglet === 'balls' && (
          <div className="btq-liste">
            <p className="btq-info">🎯 Tes Poke Balls. Elles servent automatiquement a capturer selon tes regles de capture.</p>
            {Object.entries(BALLS).map(([type, info]) => (
              <LigneItem key={type} sprite={ICONES_BALLS[type]} nom={info.nom} quantite={balls[type]} />
            ))}
          </div>
        )}

        {onglet === 'pierres' && !pierreChoisie && (
          <div className="btq-liste">
            <p className="btq-info">💎 Clique sur une pierre que tu possedes pour voir les Pokemon qui peuvent evoluer avec.</p>
            {Object.entries(PIERRES).map(([type, info]) => {
              const q = pierres[type] || 0
              const cliquable = q > 0
              return (
                <LigneItem key={type} sprite={ICONES_PIERRES[type]} nom={info.nom}
                  sousTitre={cliquable ? 'Clique pour utiliser' : 'Aucune en stock'}
                  quantite={q} cliquable={cliquable}
                  onClick={() => setPierreChoisie(type)} />
              )
            })}
          </div>
        )}

        {onglet === 'pierres' && pierreChoisie && (() => {
          const info = PIERRES[pierreChoisie]
          const candidats = pokemonsPourPierre(pierreChoisie)
          return (
            <div className="btq-liste">
              <button className="eqm-retour" onClick={() => setPierreChoisie(null)}>← Retour aux pierres</button>
              <p className="btq-info">
                {ICONES_PIERRES[pierreChoisie] && <img src={ICONES_PIERRES[pierreChoisie]} alt="" style={{ width: 20, verticalAlign: '-4px', marginRight: 6 }} />}
                {info ? info.nom : pierreChoisie} ×{pierres[pierreChoisie] || 0} — choisis un Pokemon a faire evoluer :
              </p>
              {candidats.length === 0 ? (
                <p className="btq-info" style={{ opacity: 0.7 }}>Aucun de tes Pokemon ne peut evoluer avec cette pierre.</p>
              ) : (
                candidats.map((poke) => {
                  const evo = (poke.evolutionsPierre || []).find((e) => e.pierre === pierreChoisie)
                  return (
                    <div key={poke.uid} className="btq-item btq-item-cliquable" style={{ cursor: 'pointer' }}
                      onClick={() => { onEvoluerPierre(poke.uid, evo.evolueEn, pierreChoisie); setPierreChoisie(null) }}>
                      <div className="btq-item-sprite"><SpriteMini poke={poke} /></div>
                      <div className="btq-item-texte">
                        <span className="btq-item-nom">{poke.nom} {poke.shiny ? '✨' : ''}</span>
                        <span className="btq-item-sous">N.{poke.niveau || 1} → evolue en {evo.evolueEn}</span>
                      </div>
                      <span className="btq-stock-compte">▸</span>
                    </div>
                  )
                })
              )}
            </div>
          )
        })()}

        {onglet === 'bonbons' && (
          <div className="btq-liste">
            <p className="btq-info">🍬 Tes bonbons (gagnes sur les boss). Pour les utiliser, ouvre la fiche d'un Pokemon dans l'onglet Equipe.</p>
            {Object.entries(BONBONS).map(([type, info]) => (
              <LigneItem key={type} sprite={ICONES_BONBONS[type]} nom={info.nom} sousTitre={info.description} quantite={bonbons[type]} />
            ))}
          </div>
        )}

        {onglet === 'objets' && (
          <div className="btq-liste">
            <p className="btq-info">🏆 Objets rares obtenus sur les boss et en arene.</p>
            {entreesObjetsBoss.length === 0 ? (
              <p className="btq-info" style={{ opacity: 0.7 }}>Aucun objet de boss pour l'instant. Bats des boss pour en gagner !</p>
            ) : (
              entreesObjetsBoss.map(([id, q]) => {
                const info = OBJETS[id]
                return (
                  <LigneItem key={id} sprite={info?.sprite} sansImage={!info?.sprite}
                    nom={info?.nom || id} sousTitre={info?.desc} quantite={q} />
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Sac