import { useState, useMemo } from 'react'
import { ROLES, compterRoles, COMPOSITION_REQUISE } from './roles'
import { PALIERS_RANG, infosRang, NIVEAU_MAX_PVP } from './apiPvp'
import { nomShowdown } from './pokedexNoms'

function SpritePoke({ poke, classe = 'arn-sprite' }) {
  const num = poke.id || poke.numero
  const nomSd = num ? nomShowdown(num) : (poke.nom || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const shiny = !!poke.shiny
  const urlAnime = nomSd ? `https://play.pokemonshowdown.com/sprites/${shiny ? 'ani-shiny' : 'ani'}/${nomSd}.gif` : null
  const fallback = poke.shiny ? (poke.spriteShiny || poke.sprite) : poke.sprite
  const urlHd = num ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${shiny ? 'official-artwork/shiny' : 'official-artwork'}/${num}.png` : null
  const onError = (e) => {
    const img = e.currentTarget
    const etape = parseInt(img.dataset.etape || '0', 10)
    if (etape === 0 && fallback) { img.dataset.etape = '1'; img.src = fallback }
    else if (etape <= 1 && urlHd) { img.dataset.etape = '2'; img.src = urlHd }
  }
  return <img src={urlAnime || fallback || urlHd} alt={poke.nom} className={classe} data-etape="0" loading="lazy" onError={onError} />
}

function IconeRole({ role, taille = 14 }) {
  const sombre = '#0d1117'
  const formes = {
    tank: (<path d="M8 1.5 L13 3.5 V8 C13 11 10.5 13.5 8 14.5 C5.5 13.5 3 11 3 8 V3.5 Z" fill={sombre} />),
    dps: (<g stroke={sombre} strokeWidth="1.8" strokeLinecap="round" fill="none"><line x1="4.5" y1="11.5" x2="11.5" y2="4.5" /><line x1="3" y1="9.5" x2="6.5" y2="13" /><line x1="10" y1="3" x2="13" y2="6" /></g>),
    eclaireur: (<path d="M9 1.5 L4 8.5 H7.5 L6.5 14.5 L12 7 H8.5 Z" fill={sombre} />),
    soutien: (<g fill={sombre}><rect x="6.5" y="2.5" width="3" height="11" rx="1" /><rect x="2.5" y="6.5" width="11" height="3" rx="1" /></g>),
  }
  return (<svg viewBox="0 0 16 16" width={taille} height={taille} aria-hidden="true">{formes[role] || null}</svg>)
}

function BadgeRang({ points, rang }) {
  const info = infosRang(points)
  const nom = rang || info.rang
  return (
    <span className="pvp-rang-badge" style={{ borderColor: info.couleur, color: info.couleur }}>
      {nom} · {points} pts
    </span>
  )
}

function IndicateurCompo({ equipe, valide, label }) {
  const compte = compterRoles(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div className={`arn-compo ${valide ? 'ok' : 'ko'}`}>
      <div className="arn-compo-titre">
        {valide ? `✓ ${label} prête` : 'Composition requise : 1 Tank · 1 Éclaireur · 2 Soutien · 2 DPS'}
      </div>
      <div className="arn-compo-roles">
        {ordre.map((role) => {
          const info = ROLES[role]
          const actuel = compte[role]
          const requis = COMPOSITION_REQUISE[role]
          const ok = actuel === requis
          return (
            <span key={role} className={`arn-compo-role ${ok ? 'ok' : 'ko'}`} style={{ '--c-role': info.couleur }}>
              <span className="arn-compo-role-ico"><IconeRole role={role} taille={13} /></span>
              <span className="arn-compo-role-txt">{info.nom}</span>
              <span className="arn-compo-role-compte">{actuel}/{requis}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function SelecteurEquipe({ equipe, equipeIds, captures, onBasculer }) {
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('niveau')
  const [roleFiltre, setRoleFiltre] = useState('tous')
  const [ouverte, setOuverte] = useState(false)

  const collectionFiltree = useMemo(() => {
    let liste = [...captures]
    const q = recherche.trim().toLowerCase()
    if (q) liste = liste.filter((p) => (p.nom || '').toLowerCase().includes(q))
    if (roleFiltre !== 'tous') liste = liste.filter((p) => p.role === roleFiltre)
    liste.sort((a, b) => {
      switch (tri) {
        case 'niveau': return (b.niveau || 0) - (a.niveau || 0)
        case 'nom': return (a.nom || '').localeCompare(b.nom || '')
        case 'numero': return (a.id || 0) - (b.id || 0)
        default: return 0
      }
    })
    return liste
  }, [captures, recherche, tri, roleFiltre])

  return (
    <>
      <div className="arn-equipe">
        {equipe.length === 0 && (
          <p className="arn-vide">Aucun Pokémon sélectionné. Choisis-en dans ta collection ci-dessous.</p>
        )}
        {equipe.map((p) => (
          <button key={p.uid} className="arn-membre" onClick={() => onBasculer(p.uid)} title="Retirer">
            <div className="arn-membre-zone"><SpritePoke poke={p} classe="arn-membre-sprite" /></div>
            <span className="arn-membre-niv">N.{p.niveau}</span>
            <span className="arn-membre-retirer">✕</span>
          </button>
        ))}
      </div>

      <button className={`arn-collection-toggle ${ouverte ? 'ouverte' : ''}`} onClick={() => setOuverte((v) => !v)}>
        <span>Ta collection ({captures.length})</span>
        <span className="arn-collection-chevron">{ouverte ? '▲' : '▼'}</span>
      </button>

      {ouverte && (
        <div className="arn-collection-zone-deroulee">
          <div className="arn-outils">
            <input type="text" className="arn-recherche" placeholder="🔍 Rechercher un Pokémon…"
              value={recherche} onChange={(e) => setRecherche(e.target.value)} />
            <select className="arn-tri" value={tri} onChange={(e) => setTri(e.target.value)}>
              <option value="niveau">Tri : Niveau ↓</option>
              <option value="nom">Tri : Nom (A-Z)</option>
              <option value="numero">Tri : N° Pokédex</option>
            </select>
          </div>
          <div className="arn-filtres-role">
            <button className={`arn-filtre ${roleFiltre === 'tous' ? 'actif' : ''}`} onClick={() => setRoleFiltre('tous')}>Tous</button>
            {Object.entries(ROLES).map(([cle, info]) => (
              <button key={cle} className={`arn-filtre ${roleFiltre === cle ? 'actif' : ''}`}
                onClick={() => setRoleFiltre(cle)} style={{ '--c-role': info.couleur }}>
                <IconeRole role={cle} taille={14} /> {info.nom}
              </button>
            ))}
          </div>
          <div className="arn-collection">
            {collectionFiltree.length === 0 ? (
              <p className="arn-vide" style={{ gridColumn: '1 / -1' }}>Aucun Pokémon ne correspond.</p>
            ) : (
              collectionFiltree.map((p) => {
                const choisi = equipeIds.includes(p.uid)
                const infoRole = p.role ? ROLES[p.role] : null
                return (
                  <button key={p.uid} className={`arn-collection-item ${choisi ? 'choisi' : ''}`}
                    onClick={() => onBasculer(p.uid)}
                    title={choisi ? 'Retirer' : `${p.nom}${infoRole ? ' — ' + infoRole.nom : ''} — Ajouter`}
                    style={infoRole ? { '--c-role': infoRole.couleur } : undefined}>
                    <div className="arn-collection-zone"><SpritePoke poke={p} classe="arn-collection-sprite" /></div>
                    <span className="arn-collection-niv">N.{p.niveau}</span>
                    {infoRole && (
                      <span className="arn-collection-pastille" title={infoRole.nom} style={{ background: infoRole.couleur }}>
                        <IconeRole role={p.role} taille={13} />
                      </span>
                    )}
                    {choisi && <span className="arn-collection-check">✓</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </>
  )
}

function ApercuEquipe({ equipe }) {
  return (
    <div className="pvp-apercu">
      {(equipe || []).slice(0, 6).map((p, i) => (
        <img key={i} className="pvp-apercu-sprite"
          src={p.shiny ? (p.spriteShiny || p.spriteNormal) : p.spriteNormal}
          alt={p.nom} title={`${p.nom} N.${p.niveau}`} />
      ))}
    </div>
  )
}

function PanneauPvp({
  captures,
  equipeDefense, equipeDefenseIds, onBasculerDefense,
  defenseValide, onPublierDefense, defensePubliee, publicationEnCours,
  equipeAttaque, equipeAttaqueIds, onBasculerAttaque, attaqueValide,
  adversaires, onAttaquer, chargementListe, onRafraichir,
  mesPoints, monRang, onRetour, message,
}) {
  const [onglet, setOnglet] = useState('attaquer')

  return (
    <div className="app app-layout">
      <header className="arn-topbar">
        <div className="arn-topbar-titre">⚔️ Arène PvP</div>
        <button className="arn-retour" onClick={onRetour}>← Retour au jeu</button>
      </header>

      <div className="arn-ecran pvp-ecran">
        <div className="pvp-bandeau">
          <span className="pvp-bandeau-label">Ton classement PvP :</span>
          <BadgeRang points={mesPoints} rang={monRang} />
          <span className="pvp-niveau-max" title={`En PvP uniquement, les Pokémon au-dessus du niveau ${NIVEAU_MAX_PVP} combattent comme s'ils étaient niveau ${NIVEAU_MAX_PVP}.`}>
            ⚡ Niveau max : {NIVEAU_MAX_PVP}
          </span>
        </div>

        <p className="pvp-explication-cap">
          ⚡ En PvP, les Pokémon de niveau supérieur à {NIVEAU_MAX_PVP} sont calibrés au niveau {NIVEAU_MAX_PVP} le temps du combat.
          Tu peux <strong>tout à fait les utiliser</strong> : ils gardent leur niveau partout ailleurs.
          Ici, c'est la <strong>stratégie</strong> (compo, types, objets) qui fait la différence, pas le farm.
        </p>

        {message && <p className="pvp-message">{message}</p>}

        <div className="pvp-onglets">
          <button className={`pvp-onglet ${onglet === 'attaquer' ? 'actif' : ''}`} onClick={() => setOnglet('attaquer')}>🗡️ Attaquer</button>
          <button className={`pvp-onglet ${onglet === 'defense' ? 'actif' : ''}`} onClick={() => setOnglet('defense')}>🛡️ Ma défense</button>
        </div>

        {onglet === 'attaquer' && (
          <div className="pvp-section">
            <h3 className="arn-section-titre">Ton équipe d'attaque ({equipeAttaque.length}/6)</h3>
            <IndicateurCompo equipe={equipeAttaque} valide={attaqueValide} label="Équipe d'attaque" />
            <SelecteurEquipe equipe={equipeAttaque} equipeIds={equipeAttaqueIds} captures={captures} onBasculer={onBasculerAttaque} />

            <div className="pvp-adversaires-entete">
              <h3 className="arn-section-titre">Adversaires</h3>
              <button className="pvp-rafraichir" onClick={onRafraichir}>↻ Rafraîchir</button>
            </div>

            {chargementListe ? (
              <p className="arn-intro">Chargement des adversaires… ⏳</p>
            ) : adversaires.length === 0 ? (
              <p className="arn-vide">Aucun adversaire n'a encore posé de défense. Reviens plus tard, ou demande à un ami de jouer !</p>
            ) : (
              <div className="pvp-liste">
                {adversaires.map((a) => (
                  <div key={a.id} className="pvp-adversaire">
                    <div className="pvp-adversaire-info">
                      <span className="pvp-adversaire-pseudo">{a.pseudo}</span>
                      <BadgeRang points={a.points_pvp} rang={a.rang} />
                      <ApercuEquipe equipe={a.equipe} />
                    </div>
                    <button className="arn-combattre" onClick={() => onAttaquer(a)}
                      disabled={!attaqueValide || !a.equipe || a.equipe.length === 0}
                      title={attaqueValide ? 'Lancer le combat' : 'Compose une équipe 1T / 1E / 2S / 2D pour attaquer'}>
                      Attaquer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {onglet === 'defense' && (
          <div className="pvp-section">
            <p className="arn-intro">
              Compose ton <strong>équipe de défense</strong>. Elle sera enregistrée en ligne et combattra automatiquement
              quand d'autres joueurs t'attaqueront. {defensePubliee ? '✓ Ta défense est publiée.' : 'Pas encore publiée.'}
            </p>
            <h3 className="arn-section-titre">Ton équipe de défense ({equipeDefense.length}/6)</h3>
            <IndicateurCompo equipe={equipeDefense} valide={defenseValide} label="Défense" />
            <SelecteurEquipe equipe={equipeDefense} equipeIds={equipeDefenseIds} captures={captures} onBasculer={onBasculerDefense} />
            <div className="pvp-publier-zone">
              <button className="arn-combattre pvp-publier" onClick={onPublierDefense}
                disabled={!defenseValide || publicationEnCours}
                title={defenseValide ? 'Enregistrer ma défense en ligne' : 'Compose une équipe 1T / 1E / 2S / 2D'}>
                {publicationEnCours ? 'Publication…' : (defensePubliee ? 'Mettre à jour ma défense' : 'Publier ma défense')}
              </button>
            </div>
          </div>
        )}

        <div className="pvp-rangs-legende">
          {PALIERS_RANG.map((p) => (
            <span key={p.rang} className="pvp-rang-chip" style={{ borderColor: p.couleur, color: p.couleur }}>
              {p.rang} <small>{p.min}+</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PanneauPvp