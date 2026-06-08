import { useState, useMemo } from 'react'
import { ROUTES, routeDebloquee, routeParId } from './routes'
import { numeroParNom, nomShowdown } from './pokedexNoms'

const COULEUR_RARETE = {
  commun: '#9aa6c4', rare: '#5b8bdc', tresRare: '#b15bdc', legendaire: '#dcb15b',
}

const URL_SPRITE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'

function joliNom(nom) {
  return (nom || '').split('-').map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(' ')
}

// Carte-sprite : statique par défaut, animée Showdown au survol (si obtenu).
// `ciblable` (boss/légendaires) ajoute un bouton de ciblage Master Ball.
function CartePoke({ nom, vu, tableNoms, estBoss, rarete, ciblable, cible, onCibler }) {
  const numero = numeroParNom(tableNoms, nom)
  const nomSd = numero ? nomShowdown(numero) : (nom || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const urlStatique = numero ? `${URL_SPRITE}${numero}.png` : null
  const urlAnimee = nomSd ? `https://play.pokemonshowdown.com/sprites/ani/${nomSd}.gif` : null
  const survol = (e) => { if (vu && urlAnimee) e.currentTarget.src = urlAnimee }
  const sortie = (e) => { if (urlStatique) e.currentTarget.src = urlStatique }
  const couleur = rarete ? COULEUR_RARETE[rarete] : null
  return (
    <div className={`mrt-poke ${vu ? 'possede' : ''} ${estBoss ? 'boss' : ''} ${cible ? 'cible-mb' : ''}`}
      title={vu ? joliNom(nom) : '??? (pas encore obtenu)'}
      style={couleur ? { '--c-rarete': couleur } : undefined}>
      <div className="mrt-poke-cadre">
        {numero ? (
          <img src={urlStatique} alt={vu ? joliNom(nom) : '???'}
            className={`mrt-poke-sprite ${vu ? '' : 'silhouette'}`} loading="lazy"
            onMouseEnter={survol} onMouseLeave={sortie} />
        ) : (
          <span className="mrt-poke-inconnu">?</span>
        )}
        {vu && <span className="mrt-poke-check">✓</span>}
        {estBoss && <span className="mrt-poke-couronne">👑</span>}
        {ciblable && numero && (
          <button
            className={`mrt-poke-cibler ${cible ? 'actif' : ''}`}
            title={cible ? 'Ne plus cibler Master Ball' : 'Cibler pour la Master Ball'}
            onClick={(e) => { e.stopPropagation(); onCibler(numero, joliNom(nom)) }}>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png" alt="" className="mrt-poke-cibler-img" />
          </button>
        )}
      </div>
      <span className={`mrt-poke-nom ${vu ? '' : 'non-vu'}`}>{vu ? joliNom(nom) : '???'}</span>
    </div>
  )
}

function DetailZone({ route, numeroZone, debloquee, bossOk, victoiresRoute, estActive, vusSet, tableNoms, onChoisir, ciblesMasterBall = [], onCiblerMasterBall, tableNomsInv }) {
  if (!route) {
    return (
      <div className="mrt-vide">
        <span className="mrt-vide-emoji">🗺️</span>
        <p>Sélectionne une zone à gauche pour voir ses Pokémon.</p>
      </div>
    )
  }

  const pool = route.pool || {}
  const capturables = [...(pool.commun || []), ...(pool.rare || [])]
  const capturablesUniq = [...new Set(capturables)]
  const evolutions = [...new Set(pool.tresRare || [])]
  const legendaires = [...new Set(pool.legendaire || [])]
  const nomBoss = legendaires[0] || null
  const autresLeg = legendaires.slice(1)

  const nbPossede = capturablesUniq.filter((n) => vusSet.has(n)).length
  const pctCapture = capturablesUniq.length > 0 ? Math.round((nbPossede / capturablesUniq.length) * 100) : 0

  // Une espèce est-elle ciblée Master Ball ? (clé = numéro national).
  const estCible = (nom) => {
    const num = numeroParNom(tableNoms, nom)
    return num != null && ciblesMasterBall.some((c) => c.cle === `${num}`)
  }

  return (
    <div className="mrt-detail">
      <div className="mrt-detail-entete">
        <span className="mrt-detail-num">Zone {numeroZone}</span>
        <h3 className="mrt-detail-titre">{route.emoji} {route.nom}</h3>
        <p className="mrt-detail-desc">{route.description}</p>
        <div className="mrt-detail-meta">
          <span>Niveau ~{route.niveau}</span>
          <span>•</span>
          <span>Victoires : {victoiresRoute}</span>
          {bossOk && <span className="mrt-meta-ok">• Complétée 👑</span>}
        </div>
      </div>

      {!debloquee ? (
        <div className="mrt-verrou">
          <span className="mrt-verrou-emoji">🔒</span>
          <p>Zone verrouillée.<br />Bats le boss de <strong>{route.requisDe ? routeParId(route.requisDe).nom : '—'}</strong> pour la débloquer.</p>
        </div>
      ) : (
        <>
          <button className={`mrt-aller ${estActive ? 'active' : ''}`} onClick={() => onChoisir(route.id)} disabled={estActive}>
            {estActive ? '📍 Tu es dans cette zone' : '➡️ Aller dans cette zone'}
          </button>

          <div className="mrt-progress">
            <span className="mrt-progress-label">Capturés ici : {nbPossede}/{capturablesUniq.length}</span>
            <div className="mrt-progress-barre"><div className="mrt-progress-fill" style={{ width: `${pctCapture}%` }} /></div>
          </div>

          <div className="mrt-section">
            <span className="mrt-section-titre" style={{ color: COULEUR_RARETE.commun }}>🎯 Capturables ({capturablesUniq.length})</span>
            <div className="mrt-grille">
              {capturablesUniq.map((nom) => (<CartePoke key={nom} nom={nom} vu={vusSet.has(nom)} tableNoms={tableNoms} rarete="commun" />))}
            </div>
          </div>

          {evolutions.length > 0 && (
            <div className="mrt-section">
              <span className="mrt-section-titre" style={{ color: COULEUR_RARETE.tresRare }}>
                ✨ Évolutions ({evolutions.length}) <span className="mrt-section-note">— apparaissent, non capturables</span>
              </span>
              <div className="mrt-grille">
                {evolutions.map((nom) => (<CartePoke key={nom} nom={nom} vu={vusSet.has(nom)} tableNoms={tableNoms} rarete="tresRare" />))}
              </div>
            </div>
          )}

          {legendaires.length > 0 && (
            <div className="mrt-section">
              <span className="mrt-section-titre" style={{ color: COULEUR_RARETE.legendaire }}>👑 Boss & Légendaires</span>
              <p className="mrt-section-note mrt-mb-aide">Clique sur la Master Ball ⚫ pour cibler une capture garantie en combat.</p>
              <div className="mrt-grille">
                {nomBoss && <CartePoke nom={nomBoss} vu={vusSet.has(nomBoss)} tableNoms={tableNoms} rarete="legendaire" estBoss
                  ciblable cible={estCible(nomBoss)} onCibler={onCiblerMasterBall} />}
                {autresLeg.map((nom) => (<CartePoke key={nom} nom={nom} vu={vusSet.has(nom)} tableNoms={tableNoms} rarete="legendaire"
                  ciblable cible={estCible(nom)} onCibler={onCiblerMasterBall} />))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MenuRoutes({ routeActive, victoiresParRoute = {}, bossVaincus = {}, nomsVus, tableNoms, ciblesMasterBall = [], onCiblerMasterBall, onChoisir, onFermer }) {
  const vusSet = useMemo(() => new Set(nomsVus || []), [nomsVus])
  const [recherche, setRecherche] = useState('')
  const [zoneSelectionnee, setZoneSelectionnee] = useState(routeActive || (ROUTES[0] && ROUTES[0].id))

  const idProchaine = useMemo(() => {
    for (const route of ROUTES) {
      const debloquee = routeDebloquee(route, bossVaincus)
      if (!debloquee && route.requisDe && bossVaincus[route.requisDe] === true) return route.id
    }
    return null
  }, [bossVaincus])

  const routesAffichees = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return ROUTES.map((route, index) => ({ route, numeroZone: index + 1 }))
      .filter(({ route, numeroZone }) => {
        if (!q) return true
        return route.nom.toLowerCase().includes(q) || String(numeroZone).includes(q)
      })
  }, [recherche])

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

  const nbDebloquees = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="mrt-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="mrt-entete">
          <h2>🗺️ Routes — {nbDebloquees}/{ROUTES.length} zones</h2>
          <button className="mrt-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="mrt-corps">
          <div className="mrt-liste-col">
            <input type="text" className="mrt-recherche" placeholder="🔍 Chercher une zone (nom ou n°)…"
              value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            <div className="mrt-liste">
              {routesAffichees.map(({ route, numeroZone }) => {
                const debloquee = routeDebloquee(route, bossVaincus)
                const bossOk = bossVaincus[route.id] === true
                const estProchaine = route.id === idProchaine
                const estSel = route.id === zoneSelectionnee
                const estActive = routeActive === route.id
                return (
                  <button key={route.id}
                    className={`mrt-item ${estSel ? 'selectionnee' : ''} ${!debloquee ? 'verrouillee' : ''} ${estActive ? 'active' : ''} ${estProchaine ? 'prochaine' : ''}`}
                    onClick={() => setZoneSelectionnee(route.id)}>
                    <span className={`mrt-item-num ${bossOk ? 'termine' : ''}`}>{numeroZone}</span>
                    <span className="mrt-item-emoji">{debloquee ? route.emoji : '🔒'}</span>
                    <span className="mrt-item-nom">
                      {route.nom}
                      {estProchaine && <span className="mrt-badge">PROCHAINE</span>}
                      {estActive && <span className="mrt-badge actif">ICI</span>}
                    </span>
                    {bossOk && <span className="mrt-item-couronne">👑</span>}
                  </button>
                )
              })}
              {routesAffichees.length === 0 && (<p className="mrt-liste-vide">Aucune zone ne correspond.</p>)}
            </div>
          </div>

          <div className="mrt-detail-col">
            {detail ? (
              <DetailZone {...detail} vusSet={vusSet} tableNoms={tableNoms}
                ciblesMasterBall={ciblesMasterBall} onCiblerMasterBall={onCiblerMasterBall}
                onChoisir={(id) => { onChoisir(id) }} />
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