import { useState } from 'react'
import { BALLS, PIERRES, BONBONS } from './config'
import { OBJETS_BOSS, BONBONS_IV } from './ameliorations'

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

const NOM_STAT = { pv: 'PV', attaque: 'ATT', vitesse: 'VIT', defense: 'DEF' }

function SpriteMini({ poke }) {
  const src = poke.shiny && poke.spriteShiny ? poke.spriteShiny : (poke.sprite || poke.spriteNormal)
  return <img src={src} alt={poke.nom} className="btq-item-img"
    onError={(e) => { e.currentTarget.style.display = 'none' }} />
}

// ============================================================
// SAC complet :
//  - Balls : affichage des stocks
//  - Pierres : clic -> liste des Pokemon compatibles -> evolution
//  - Bonbons : classiques (XP/niveau) + bonbons IV -> clic -> choisir un Pokemon
//  - Objets de boss : affichage (avec le BON dictionnaire OBJETS_BOSS)
// ============================================================
function Sac({ balls = {}, pierres = {}, bonbons = {}, objetsBoss = {}, collection = [], onEvoluerPierre, onUtiliserBonbon, onUtiliserBonbonIV, onFermer }) {
  const [onglet, setOnglet] = useState('balls')
  const [pierreChoisie, setPierreChoisie] = useState(null)
  // Bonbon en cours d'utilisation : { genre: 'classique'|'iv', cle }
  const [bonbonChoisi, setBonbonChoisi] = useState(null)
  const [recherchePoke, setRecherchePoke] = useState('')

  const onglets = [
    { cle: 'balls', label: 'Poke Balls', icone: <img src={ICONES_BALLS.poke} alt="" className="btq-onglet-img" /> },
    { cle: 'pierres', label: 'Pierres', icone: '💎' },
    { cle: 'bonbons', label: 'Bonbons', icone: '🍬' },
    { cle: 'objets', label: 'Objets de boss', icone: '🏆' },
  ]

  function changerOnglet(cle) {
    setOnglet(cle); setPierreChoisie(null); setBonbonChoisi(null); setRecherchePoke('')
  }

  function LigneItem({ sprite, emoji, nom, sousTitre, quantite, onClick, cliquable }) {
    return (
      <div className={`btq-item ${cliquable ? 'btq-item-cliquable' : ''}`} onClick={cliquable ? onClick : undefined}
        style={cliquable ? { cursor: 'pointer' } : undefined}>
        <div className="btq-item-sprite">
          {sprite ? (
            <img src={sprite} alt={nom} className="btq-item-img" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          ) : emoji ? (
            <span style={{ fontSize: 24 }}>{emoji}</span>
          ) : null}
        </div>
        <div className="btq-item-texte">
          <span className="btq-item-nom">{nom}</span>
          {sousTitre && <span className="btq-item-sous">{sousTitre}</span>}
        </div>
        <span className="btq-stock-compte">×{quantite || 0}</span>
      </div>
    )
  }

  // Liste filtree des Pokemon pour le choix de cible.
  function pokemonsFiltres() {
    let liste = collection.filter((p) => p)
    const q = recherchePoke.trim().toLowerCase()
    if (q) liste = liste.filter((p) => (p.nom || '').toLowerCase().includes(q))
    return liste
  }

  // Pokemon de la collection qui peuvent evoluer avec la pierre choisie.
  function pokemonsPourPierre(pierre) {
    return collection.filter((p) =>
      (p.evolutionsPierre || []).some((e) => e.pierre === pierre)
    )
  }

  // Bonbons IV possedes (dans objetsBoss, definis par BONBONS_IV).
  const bonbonsIVPossedes = Object.entries(BONBONS_IV || {})
    .map(([cle, info]) => ({ cle, info, stock: objetsBoss[cle] || 0 }))
  // Objets de boss "purs" (hors bonbons IV).
  const objetsBossPurs = Object.entries(objetsBoss)
    .filter(([cle, q]) => (q || 0) > 0 && !(BONBONS_IV && BONBONS_IV[cle]))

  // ===== ECRAN DE CHOIX DE POKEMON (pour un bonbon) =====
  function EcranChoixPokemon() {
    const estIV = bonbonChoisi.genre === 'iv'
    const info = estIV ? BONBONS_IV[bonbonChoisi.cle] : BONBONS[bonbonChoisi.cle]
    if (!info) return null
    const stock = estIV ? (objetsBoss[bonbonChoisi.cle] || 0) : (bonbons[bonbonChoisi.cle] || 0)
    const liste = pokemonsFiltres()
    return (
      <div className="btq-liste">
        <button className="eqm-retour" onClick={() => { setBonbonChoisi(null); setRecherchePoke('') }}>← Retour aux bonbons</button>
        <p className="btq-info">
          {info.emoji} <strong>{info.nom}</strong> ×{stock} — choisis le Pokemon qui le recoit :
          {estIV && info.stat && <span> (+1 IV {NOM_STAT[info.stat] || info.stat}, max 31)</span>}
        </p>
        <input type="text" className="btq-recherche-poke" placeholder="🔍 Rechercher un Pokemon..."
          style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 10, border: '1px solid #2a3242', background: '#10151f', color: '#e8edf7', marginBottom: 8, fontSize: 13 }}
          value={recherchePoke} onChange={(e) => setRecherchePoke(e.target.value)} />
        {liste.length === 0 ? (
          <p className="btq-info" style={{ opacity: 0.7 }}>Aucun Pokemon trouve.</p>
        ) : (
          liste.map((poke) => {
            // Pour un bonbon IV : griser si l'IV de la stat est deja au max.
            const ivActuel = estIV && info.stat ? ((poke.iv && Number.isFinite(poke.iv[info.stat])) ? poke.iv[info.stat] : 0) : null
            const auMax = estIV && ivActuel != null && ivActuel >= 31
            const plusDeStock = stock <= 0
            const grise = auMax || plusDeStock
            return (
              <div key={poke.uid} className="btq-item btq-item-cliquable"
                style={{ cursor: grise ? 'not-allowed' : 'pointer', opacity: grise ? 0.35 : 1 }}
                onClick={() => {
                  if (grise) return
                  if (estIV) onUtiliserBonbonIV(poke.uid, bonbonChoisi.cle)
                  else onUtiliserBonbon(poke.uid, bonbonChoisi.cle)
                  // On reste sur l'ecran pour pouvoir enchainer (stock decremente au prochain rendu).
                }}>
                <div className="btq-item-sprite"><SpriteMini poke={poke} /></div>
                <div className="btq-item-texte">
                  <span className="btq-item-nom">{poke.nom} {poke.shiny ? '✨' : ''}</span>
                  <span className="btq-item-sous">
                    N.{poke.niveau || 1}
                    {estIV && info.stat && ` · IV ${NOM_STAT[info.stat] || info.stat} : ${ivActuel}/31${auMax ? ' (MAX)' : ''}`}
                  </span>
                </div>
                <span className="btq-stock-compte">{grise ? '—' : '▸'}</span>
              </div>
            )
          })
        )}
      </div>
    )
  }

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
              onClick={() => changerOnglet(o.cle)}>
              <span className="btq-onglet-icone">{o.icone}</span>
              <span className="btq-onglet-label">{o.label}</span>
            </button>
          ))}
        </div>

        {/* ===== BALLS ===== */}
        {onglet === 'balls' && (
          <div className="btq-liste">
            <p className="btq-info">🎯 Tes Poke Balls. Elles servent automatiquement a capturer selon tes regles de capture.</p>
            {Object.entries(BALLS).map(([type, info]) => (
              <LigneItem key={type} sprite={ICONES_BALLS[type]} nom={info.nom} quantite={balls[type]} />
            ))}
          </div>
        )}

        {/* ===== PIERRES ===== */}
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

        {/* ===== BONBONS (classiques + IV) ===== */}
        {onglet === 'bonbons' && !bonbonChoisi && (
          <div className="btq-liste">
            <p className="btq-info">🍬 Clique sur un bonbon que tu possedes, puis choisis le Pokemon qui le recoit.</p>

            {Object.entries(BONBONS).map(([type, info]) => {
              const q = bonbons[type] || 0
              return (
                <LigneItem key={type} sprite={ICONES_BONBONS[type]} emoji={info.emoji} nom={info.nom}
                  sousTitre={q > 0 ? (info.description || 'Clique pour utiliser') : 'Aucun en stock'}
                  quantite={q} cliquable={q > 0}
                  onClick={() => setBonbonChoisi({ genre: 'classique', cle: type })} />
              )
            })}

            <p className="btq-info" style={{ marginTop: 10 }}>🧪 <strong>Bonbons IV</strong> (gagnes sur les boss) : +1 IV permanent sur une stat.</p>
            {bonbonsIVPossedes.map(({ cle, info, stock }) => (
              <LigneItem key={cle} emoji={info.emoji} nom={info.nom}
                sousTitre={stock > 0 ? `+1 IV ${NOM_STAT[info.stat] || info.stat} — clique pour utiliser` : 'Aucun en stock'}
                quantite={stock} cliquable={stock > 0}
                onClick={() => setBonbonChoisi({ genre: 'iv', cle })} />
            ))}
          </div>
        )}

        {onglet === 'bonbons' && bonbonChoisi && EcranChoixPokemon()}

        {/* ===== OBJETS DE BOSS ===== */}
        {onglet === 'objets' && (
          <div className="btq-liste">
            <p className="btq-info">🏆 Objets rares obtenus sur les boss et en arene.</p>
            {objetsBossPurs.length === 0 ? (
              <p className="btq-info" style={{ opacity: 0.7 }}>Aucun objet de boss pour l'instant. Bats des boss pour en gagner !</p>
            ) : (
              objetsBossPurs.map(([cle, q]) => {
                const info = (OBJETS_BOSS && OBJETS_BOSS[cle]) || null
                return (
                  <LigneItem key={cle}
                    emoji={info?.emoji || '🏆'}
                    nom={info?.nom || cle}
                    sousTitre={info?.desc || info?.description}
                    quantite={q} />
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