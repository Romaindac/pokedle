import { useState } from 'react'
import { ROUTES, routeDebloquee, routeParId } from './routes'
import { numeroParNom } from './pokedexNoms'

const COULEUR_RARETE = {
  commun: '#9aa6c4',
  rare: '#5b8bdc',
  tresRare: '#b15bdc',
  legendaire: '#dcb15b',
}
const LABEL_RARETE = {
  commun: 'Communs',
  rare: 'Rares',
  tresRare: 'Très rares',
  legendaire: 'Légendaires',
}

// Sélectionne jusqu'à 3 Pokémon représentatifs d'une zone pour l'aperçu
// (priorité : communs, puis rares, puis très rares).
function apercuPokemons(pool) {
  const ordre = ['commun', 'rare', 'tresRare']
  const noms = []
  for (const rarete of ordre) {
    for (const nom of pool[rarete] || []) {
      if (!noms.includes(nom)) noms.push(nom)
      if (noms.length >= 3) return noms
    }
  }
  return noms
}

function ListePokemon({ pool, nomsVus, tableNoms }) {
  return (
    <div className="zone-pokemons" onClick={(e) => e.stopPropagation()}>
      {['commun', 'rare', 'tresRare', 'legendaire'].map((rarete) => {
        const liste = pool[rarete] || []
        if (liste.length === 0) return null
        return (
          <div key={rarete} className="zone-rarete-groupe">
            <span className="zone-rarete-label" style={{ color: COULEUR_RARETE[rarete] }}>
              {LABEL_RARETE[rarete]}
            </span>
            <div className="zone-pokemons-liste">
              {liste.map((nom) => {
                const vu = nomsVus.has(nom)
                const numero = numeroParNom(tableNoms, nom)
                return (
                  <div
                    key={nom}
                    className="zone-poke-carte"
                    title={vu ? nom : '??? (pas encore rencontré)'}
                  >
                    {numero ? (
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`}
                        alt={vu ? nom : '???'}
                        className={`zone-poke-sprite ${vu ? '' : 'silhouette'}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="zone-poke-inconnu">?</div>
                    )}
                    <span className={`zone-poke-nom ${vu ? '' : 'non-vu'}`}>
                      {vu ? nom : '???'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Mini-aperçu de 3 sprites (visibles si zone débloquée, silhouettes sinon)
function ApercuMini({ pool, debloquee, tableNoms }) {
  const noms = apercuPokemons(pool)
  if (noms.length === 0) return null
  return (
    <div className="route-apercu" onClick={(e) => e.stopPropagation()}>
      {noms.map((nom) => {
        const numero = numeroParNom(tableNoms, nom)
        return (
          <div key={nom} className="route-apercu-case" title={debloquee ? nom : '???'}>
            {numero ? (
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`}
                alt=""
                className={`route-apercu-sprite ${debloquee ? '' : 'silhouette'}`}
                loading="lazy"
              />
            ) : (
              <span className="route-apercu-inconnu">?</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function MenuRoutes({ routeActive, victoiresParRoute, bossVaincus = {}, nomsVus, tableNoms, onChoisir, onFermer }) {
  const [zoneDepliee, setZoneDepliee] = useState(null)
  const vusSet = new Set(nomsVus || [])

  // "Prochaine zone" = première route verrouillée dont le prérequis est battu
  // (celle qu'on peut débloquer juste après → à mettre en avant).
  const idProchaine = (() => {
    for (const route of ROUTES) {
      const debloquee = routeDebloquee(route, bossVaincus)
      if (!debloquee && route.requisDe && bossVaincus[route.requisDe] === true) {
        return route.id
      }
    }
    return null
  })()

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-routes-doree" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>Choisir une route</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="routes-liste">
          {ROUTES.map((route, index) => {
            const numeroZone = index + 1
            const debloquee = routeDebloquee(route, bossVaincus)
            const victoiresRoute = victoiresParRoute[route.id] || 0
            const bossOk = bossVaincus[route.id] === true
            const estDepliee = zoneDepliee === route.id
            const estProchaine = route.id === idProchaine
            return (
              <div key={route.id} className="route-bloc">
                <button
                  className={`route-carte ${routeActive === route.id ? 'active' : ''} ${!debloquee ? 'verrouillee' : ''} ${estProchaine ? 'prochaine' : ''}`}
                  onClick={() => debloquee && onChoisir(route.id)}
                  disabled={!debloquee}
                >
                  {/* Pastille numéro de zone */}
                  <span className={`route-numero ${bossOk ? 'termine' : ''}`}>{numeroZone}</span>

                  <span className="route-emoji">{debloquee ? route.emoji : '🔒'}</span>
                  <div className="route-infos">
                    <span className="route-nom">
                      {route.nom}
                      {estProchaine && <span className="route-badge-prochaine">PROCHAINE</span>}
                    </span>
                    {debloquee ? (
                      <>
                        <span className="route-desc">{route.description}</span>
                        <span className="route-diff">
                          Niveau ~{route.niveau} &nbsp;|&nbsp; Victoires : {victoiresRoute}
                          {bossOk ? ' 👑' : ''}
                        </span>
                      </>
                    ) : (
                      <span className="route-desc">
                        🔒 Bats le boss de {routeParId(route.requisDe).nom} pour débloquer
                      </span>
                    )}
                  </div>

                  {/* Mini-aperçu 3 Pokémon (visibles si débloquée, silhouettes sinon) */}
                  <ApercuMini pool={route.pool} debloquee={debloquee} tableNoms={tableNoms} />

                  {routeActive === route.id && debloquee && <span className="route-check">✓</span>}
                </button>

                {debloquee && (
                  <button
                    className="route-voir-pokemons"
                    onClick={(e) => {
                      e.stopPropagation()
                      setZoneDepliee(estDepliee ? null : route.id)
                    }}
                  >
                    {estDepliee ? '▲ Masquer les Pokémon' : '▼ Voir les Pokémon'}
                  </button>
                )}

                {estDepliee && debloquee && (
                  <ListePokemon pool={route.pool} nomsVus={vusSet} tableNoms={tableNoms} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MenuRoutes