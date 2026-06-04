import { useState, useMemo } from 'react'
import { ROUTES, routeDebloquee, routeParId } from './routes'
import { numeroParNom } from './pokedexNoms'

// ============================================================
// MENU ROUTES — refonte "liste + détail".
//   - Colonne GAUCHE : les 100 zones (cherchables), avec état (active / débloquée /
//     verrouillée / complétée / prochaine) et progression de capture.
//   - Colonne DROITE : détail de la zone sélectionnée → Pokémon capturables
//     (commun + rare), boss + légendaires, chacun avec sprite et marqueur "possédé" (✓).
//   - Bouton "Aller dans cette zone" conservé.
// Sprites : PokeAPI officiels par numéro (numeroParNom via tableNoms).
// Possession : basée sur nomsVus (noms des Pokémon capturés/vus).
// ============================================================

const COULEUR_RARETE = {
  commun: '#9aa6c4',
  rare: '#5b8bdc',
  tresRare: '#b15bdc',
  legendaire: '#dcb15b',
}
const LABEL_RARETE = {
  commun: 'Communs',
  rare: 'Rares',
  tresRare: 'Très rares (évolutions)',
  legendaire: 'Boss & Légendaires',
}

const URL_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

// Met un nom PokeAPI en forme lisible : "tapu-fini" → "Tapu Fini".
function joliNom(nom) {
  return (nom || '')
    .split('-')
    .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
    .join(' ')
}

// Une carte-sprite de Pokémon (réutilisée pour capturables et boss/légendaires).
function CartePoke({ nom, vu, tableNoms, estBoss }) {
  const numero = numeroParNom(tableNoms, nom)
  return (
    <div className={`zoneD-poke ${vu ? 'possede' : ''} ${estBoss ? 'boss' : ''}`} title={vu ? joliNom(nom) : '??? (pas encore obtenu)'}>
      <div className="zoneD-poke-cadre">
        {numero ? (
          <img
            src={`${URL_SPRITE}${numero}.png`}
            alt={vu ? joliNom(nom) : '???'}
            className={`zoneD-poke-sprite ${vu ? '' : 'silhouette'}`}
            loading="lazy"
          />
        ) : (
          <span className="zoneD-poke-inconnu">?</span>
        )}
        {vu && <span className="zoneD-poke-check">✓</span>}
        {estBoss && <span className="zoneD-poke-couronne">👑</span>}
      </div>
      <span className={`zoneD-poke-nom ${vu ? '' : 'non-vu'}`}>{vu ? joliNom(nom) : '???'}</span>
    </div>
  )
}

// Panneau de DÉTAIL d'une zone (colonne droite).
function DetailZone({ route, numeroZone, debloquee, bossOk, victoiresRoute, estActive, vusSet, tableNoms, onChoisir }) {
  if (!route) {
    return (
      <div className="zoneD-vide">
        <span className="zoneD-vide-emoji">🗺️</span>
        <p>Sélectionne une zone à gauche pour voir ses Pokémon.</p>
      </div>
    )
  }

  const pool = route.pool || {}
  const capturables = [...(pool.commun || []), ...(pool.rare || [])]
  // Dédoublonne en gardant l'ordre.
  const capturablesUniq = [...new Set(capturables)]
  const evolutions = [...new Set(pool.tresRare || [])]
  const legendaires = [...new Set(pool.legendaire || [])]
  const nomBoss = legendaires[0] || null
  const autresLeg = legendaires.slice(1)

  // Compte de possession parmi les capturables (pour la barre de progression).
  const nbPossede = capturablesUniq.filter((n) => vusSet.has(n)).length
  const pctCapture = capturablesUniq.length > 0 ? Math.round((nbPossede / capturablesUniq.length) * 100) : 0

  return (
    <div className="zoneD">
      {/* En-tête de la zone */}
      <div className="zoneD-entete">
        <span className="zoneD-num">Zone {numeroZone}</span>
        <h3 className="zoneD-titre">{route.emoji} {route.nom}</h3>
        <p className="zoneD-desc">{route.description}</p>
        <div className="zoneD-meta">
          <span>Niveau ~{route.niveau}</span>
          <span>•</span>
          <span>Victoires : {victoiresRoute}</span>
          {bossOk && <span className="zoneD-meta-ok">• Complétée 👑</span>}
        </div>
      </div>

      {!debloquee ? (
        <div className="zoneD-verrou">
          <span className="zoneD-verrou-emoji">🔒</span>
          <p>Zone verrouillée.<br />Bats le boss de <strong>{route.requisDe ? routeParId(route.requisDe).nom : '—'}</strong> pour la débloquer.</p>
        </div>
      ) : (
        <>
          {/* Bouton aller dans la zone */}
          <button
            className={`zoneD-aller ${estActive ? 'active' : ''}`}
            onClick={() => onChoisir(route.id)}
            disabled={estActive}
          >
            {estActive ? '📍 Tu es dans cette zone' : '➡️ Aller dans cette zone'}
          </button>

          {/* Progression de capture des bases */}
          <div className="zoneD-progress">
            <span className="zoneD-progress-label">Capturés ici : {nbPossede}/{capturablesUniq.length}</span>
            <div className="zoneD-progress-barre">
              <div className="zoneD-progress-fill" style={{ width: `${pctCapture}%` }} />
            </div>
          </div>

          {/* Capturables */}
          <div className="zoneD-section">
            <span className="zoneD-section-titre" style={{ color: COULEUR_RARETE.commun }}>
              🎯 Capturables ({capturablesUniq.length})
            </span>
            <div className="zoneD-grille">
              {capturablesUniq.map((nom) => (
                <CartePoke key={nom} nom={nom} vu={vusSet.has(nom)} tableNoms={tableNoms} />
              ))}
            </div>
          </div>

          {/* Évolutions (apparaissent mais non capturables) */}
          {evolutions.length > 0 && (
            <div className="zoneD-section">
              <span className="zoneD-section-titre" style={{ color: COULEUR_RARETE.tresRare }}>
                ✨ Évolutions ({evolutions.length}) <span className="zoneD-section-note">— apparaissent, non capturables</span>
              </span>
              <div className="zoneD-grille">
                {evolutions.map((nom) => (
                  <CartePoke key={nom} nom={nom} vu={vusSet.has(nom)} tableNoms={tableNoms} />
                ))}
              </div>
            </div>
          )}

          {/* Boss + légendaires */}
          {legendaires.length > 0 && (
            <div className="zoneD-section">
              <span className="zoneD-section-titre" style={{ color: COULEUR_RARETE.legendaire }}>
                👑 Boss & Légendaires
              </span>
              <div className="zoneD-grille">
                {nomBoss && <CartePoke nom={nomBoss} vu={vusSet.has(nomBoss)} tableNoms={tableNoms} estBoss />}
                {autresLeg.map((nom) => (
                  <CartePoke key={nom} nom={nom} vu={vusSet.has(nom)} tableNoms={tableNoms} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MenuRoutes({ routeActive, victoiresParRoute = {}, bossVaincus = {}, nomsVus, tableNoms, onChoisir, onFermer }) {
  const vusSet = useMemo(() => new Set(nomsVus || []), [nomsVus])
  const [recherche, setRecherche] = useState('')
  // Zone sélectionnée pour le détail (par défaut : la zone active).
  const [zoneSelectionnee, setZoneSelectionnee] = useState(routeActive || (ROUTES[0] && ROUTES[0].id))

  // "Prochaine zone" = première route verrouillée dont le prérequis est battu.
  const idProchaine = useMemo(() => {
    for (const route of ROUTES) {
      const debloquee = routeDebloquee(route, bossVaincus)
      if (!debloquee && route.requisDe && bossVaincus[route.requisDe] === true) return route.id
    }
    return null
  }, [bossVaincus])

  // Liste filtrée par la recherche (nom ou numéro de zone).
  const routesAffichees = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return ROUTES.map((route, index) => ({ route, numeroZone: index + 1 }))
      .filter(({ route, numeroZone }) => {
        if (!q) return true
        return route.nom.toLowerCase().includes(q) || String(numeroZone).includes(q)
      })
  }, [recherche])

  // Données de la zone sélectionnée pour le détail.
  const indexSel = ROUTES.findIndex((r) => r.id === zoneSelectionnee)
  const routeSel = indexSel >= 0 ? ROUTES[indexSel] : null
  const detail = routeSel ? {
    route: routeSel,
    numeroZone: indexSel + 1,
    debloquee: routeDebloquee(routeSel, bossVaincus),
    bossOk: bossVaincus[routeSel.id] === true,
    victoiresRoute: victoiresParRoute[routeSel.id] || 0,
    estActive: routeActive === routeSel.id,
  } : null

  // Compte de zones débloquées (pour l'en-tête).
  const nbDebloquees = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-routes-doree routes-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🗺️ Routes — {nbDebloquees}/{ROUTES.length} zones</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="routes-v2-corps">
          {/* ----- COLONNE GAUCHE : liste des zones ----- */}
          <div className="routes-v2-liste-col">
            <input
              type="text"
              className="routes-v2-recherche"
              placeholder="🔍 Chercher une zone (nom ou n°)…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            <div className="routes-v2-liste">
              {routesAffichees.map(({ route, numeroZone }) => {
                const debloquee = routeDebloquee(route, bossVaincus)
                const bossOk = bossVaincus[route.id] === true
                const estProchaine = route.id === idProchaine
                const estSel = route.id === zoneSelectionnee
                const estActive = routeActive === route.id
                return (
                  <button
                    key={route.id}
                    className={`routes-v2-item ${estSel ? 'selectionnee' : ''} ${!debloquee ? 'verrouillee' : ''} ${estActive ? 'active' : ''} ${estProchaine ? 'prochaine' : ''}`}
                    onClick={() => setZoneSelectionnee(route.id)}
                  >
                    <span className={`routes-v2-num ${bossOk ? 'termine' : ''}`}>{numeroZone}</span>
                    <span className="routes-v2-emoji">{debloquee ? route.emoji : '🔒'}</span>
                    <span className="routes-v2-nom">
                      {route.nom}
                      {estProchaine && <span className="routes-v2-badge">PROCHAINE</span>}
                      {estActive && <span className="routes-v2-badge actif">ICI</span>}
                    </span>
                    {bossOk && <span className="routes-v2-couronne">👑</span>}
                  </button>
                )
              })}
              {routesAffichees.length === 0 && (
                <p className="routes-v2-vide">Aucune zone ne correspond.</p>
              )}
            </div>
          </div>

          {/* ----- COLONNE DROITE : détail ----- */}
          <div className="routes-v2-detail-col">
            {detail ? (
              <DetailZone
                {...detail}
                vusSet={vusSet}
                tableNoms={tableNoms}
                onChoisir={(id) => { onChoisir(id); }}
              />
            ) : (
              <DetailZone route={null} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuRoutes