import { useState, useMemo } from 'react'
import { ROLES, compterRoles, COMPOSITION_REQUISE } from './roles'
import { PALIERS_RANG, infosRang, NIVEAU_MAX_PVP } from './apiPvp'

// --- Icône SVG du rôle (même style que PanneauArene, pas d'emoji) ---
function IconeRole({ role, taille = 14 }) {
  const sombre = '#15172a'
  const formes = {
    tank: (
      <path d="M8 1.5 L13 3.5 V8 C13 11 10.5 13.5 8 14.5 C5.5 13.5 3 11 3 8 V3.5 Z" fill={sombre} />
    ),
    dps: (
      <g stroke={sombre} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <line x1="4.5" y1="11.5" x2="11.5" y2="4.5" />
        <line x1="3" y1="9.5" x2="6.5" y2="13" />
        <line x1="10" y1="3" x2="13" y2="6" />
      </g>
    ),
    eclaireur: (
      <path d="M9 1.5 L4 8.5 H7.5 L6.5 14.5 L12 7 H8.5 Z" fill={sombre} />
    ),
    soutien: (
      <g fill={sombre}>
        <rect x="6.5" y="2.5" width="3" height="11" rx="1" />
        <rect x="2.5" y="6.5" width="11" height="3" rx="1" />
      </g>
    ),
  }
  return (
    <svg viewBox="0 0 16 16" width={taille} height={taille} aria-hidden="true">
      {formes[role] || null}
    </svg>
  )
}

// Petite pastille de rang colorée.
function BadgeRang({ points, rang }) {
  const info = infosRang(points)
  const nom = rang || info.rang
  return (
    <span className="pvp-rang-badge" style={{ borderColor: info.couleur, color: info.couleur }}>
      {nom} · {points} pts
    </span>
  )
}

// Indicateur de composition (1 Tank / 1 Éclaireur / 2 Soutien / 2 DPS).
function IndicateurCompo({ equipe, valide, label }) {
  const compte = compterRoles(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div className={`compo-indicateur ${valide ? 'compo-ok' : 'compo-ko'}`}>
      <div className="compo-titre">
        {valide ? `✓ ${label} prête` : 'Composition requise : 1 Tank · 1 Éclaireur · 2 Soutien · 2 DPS'}
      </div>
      <div className="compo-roles">
        {ordre.map((role) => {
          const info = ROLES[role]
          const actuel = compte[role]
          const requis = COMPOSITION_REQUISE[role]
          const ok = actuel === requis
          return (
            <span key={role} className={`compo-role ${ok ? 'role-ok' : 'role-ko'}`} style={{ borderColor: info.couleur }}>
              <span className="compo-role-emoji"><IconeRole role={role} taille={13} /></span>
              <span className="compo-role-txt">{info.nom}</span>
              <span className="compo-role-compte">{actuel}/{requis}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

// Sélecteur d'équipe réutilisable (équipe en cours + collection filtrable).
// `equipe` = Pokémon sélectionnés (objets), `equipeIds` = leurs uid,
// `onBasculer(uid)` ajoute/retire.
function SelecteurEquipe({ equipe, equipeIds, captures, onBasculer }) {
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('niveau')
  const [roleFiltre, setRoleFiltre] = useState('tous')

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
      <div className="arene-equipe">
        {equipe.length === 0 && (
          <p className="arene-vide">Aucun Pokémon sélectionné. Choisis-en dans ta collection ci-dessous.</p>
        )}
        {equipe.map((p) => (
          <button key={p.uid} className="arene-membre" onClick={() => onBasculer(p.uid)} title="Retirer">
            <img src={p.shiny ? (p.spriteShiny || p.sprite) : p.sprite} alt={p.nom} />
            <span className="arene-membre-niv">N.{p.niveau}</span>
            <span className="arene-membre-retirer">✕</span>
          </button>
        ))}
      </div>

      <div className="arene-outils">
        <input
          type="text"
          className="banc-recherche arene-recherche"
          placeholder="🔍 Rechercher un Pokémon…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
        />
        <select className="tri-select arene-tri" value={tri} onChange={(e) => setTri(e.target.value)}>
          <option value="niveau">Tri : Niveau ↓</option>
          <option value="nom">Tri : Nom (A-Z)</option>
          <option value="numero">Tri : N° Pokédex</option>
        </select>
      </div>

      <div className="arene-filtres-role">
        <button className={`filtre-role ${roleFiltre === 'tous' ? 'actif' : ''}`} onClick={() => setRoleFiltre('tous')}>Tous</button>
        {Object.entries(ROLES).map(([cle, info]) => (
          <button
            key={cle}
            className={`filtre-role filtre-role-${cle} ${roleFiltre === cle ? 'actif' : ''}`}
            onClick={() => setRoleFiltre(cle)}
            style={{ '--role-couleur': info.couleur }}
          >
            <IconeRole role={cle} taille={14} /> {info.nom}
          </button>
        ))}
      </div>

      <div className="arene-collection">
        {collectionFiltree.length === 0 ? (
          <p className="arene-vide" style={{ gridColumn: '1 / -1' }}>Aucun Pokémon ne correspond.</p>
        ) : (
          collectionFiltree.map((p) => {
            const choisi = equipeIds.includes(p.uid)
            const infoRole = p.role ? ROLES[p.role] : null
            return (
              <button
                key={p.uid}
                className={`arene-collection-item ${choisi ? 'choisi' : ''} ${p.role ? 'role-' + p.role : ''}`}
                onClick={() => onBasculer(p.uid)}
                title={choisi ? 'Retirer' : `${p.nom}${infoRole ? ' — ' + infoRole.nom : ''} — Ajouter`}
                style={infoRole ? { '--role-couleur': infoRole.couleur } : undefined}
              >
                <img src={p.shiny ? (p.spriteShiny || p.sprite) : p.sprite} alt={p.nom} />
                <span className="arene-collection-niv">N.{p.niveau}</span>
                {infoRole && (
                  <span className="arene-collection-pastille" title={infoRole.nom} style={{ background: infoRole.couleur }}>
                    <IconeRole role={p.role} taille={13} />
                  </span>
                )}
                {choisi && <span className="arene-collection-check">✓</span>}
              </button>
            )
          })
        )}
      </div>
    </>
  )
}

// Aperçu d'une défense adverse (mini-sprites).
function ApercuEquipe({ equipe }) {
  return (
    <div className="pvp-apercu">
      {(equipe || []).slice(0, 6).map((p, i) => (
        <img
          key={i}
          className="pvp-apercu-sprite"
          src={p.shiny ? (p.spriteShiny || p.spriteNormal) : p.spriteNormal}
          alt={p.nom}
          title={`${p.nom} N.${p.niveau}`}
        />
      ))}
    </div>
  )
}

// ÉCRAN PvP COMPLET.
function PanneauPvp({
  captures,
  // Défense
  equipeDefense, equipeDefenseIds, onBasculerDefense,
  defenseValide, onPublierDefense, defensePubliee, publicationEnCours,
  // Attaque
  equipeAttaque, equipeAttaqueIds, onBasculerAttaque, attaqueValide,
  // Adversaires + score
  adversaires, onAttaquer, chargementListe, onRafraichir,
  mesPoints, monRang,
  onRetour,
  message,
}) {
  const [onglet, setOnglet] = useState('attaquer') // 'attaquer' | 'defense'

  return (
    <div className="app app-layout">
      <header className="topbar">
        <div className="topbar-titre">⚔️ Arène PvP</div>
        <button className="bouton-retour-arene" onClick={onRetour}>← Retour au jeu</button>
      </header>

      <div className="arene-ecran arene-ecran-doree arene-v2 pvp-ecran pvp-v2">
        {/* Bandeau de score */}
        <div className="pvp-bandeau">
          <span className="pvp-bandeau-label">Ton classement PvP :</span>
          <BadgeRang points={mesPoints} rang={monRang} />
          <span className="pvp-niveau-max" title={`En PvP uniquement, les Pokémon au-dessus du niveau ${NIVEAU_MAX_PVP} combattent comme s'ils étaient niveau ${NIVEAU_MAX_PVP}. Ils gardent leur vrai niveau partout ailleurs et peuvent tout à fait être utilisés.`}>
            ⚡ Niveau max : {NIVEAU_MAX_PVP}
          </span>
        </div>

        {/* Explication du cap, pour éviter toute confusion */}
        <p className="pvp-explication-cap">
          ⚡ En PvP, les Pokémon de niveau supérieur à {NIVEAU_MAX_PVP} sont calibrés au niveau {NIVEAU_MAX_PVP} le temps du combat.
          Tu peux <strong>tout à fait les utiliser</strong> : ils ne perdent pas leur niveau et le gardent partout ailleurs dans le jeu.
          Ici, c'est la <strong>stratégie</strong> (compo, types, objets) qui fait la différence, pas le farm.
        </p>

        {message && <p className="pvp-message">{message}</p>}

        {/* Onglets internes */}
        <div className="pvp-onglets">
          <button className={`pvp-onglet ${onglet === 'attaquer' ? 'actif' : ''}`} onClick={() => setOnglet('attaquer')}>
            🗡️ Attaquer
          </button>
          <button className={`pvp-onglet ${onglet === 'defense' ? 'actif' : ''}`} onClick={() => setOnglet('defense')}>
            🛡️ Ma défense
          </button>
        </div>

        {/* ===== ONGLET ATTAQUER ===== */}
        {onglet === 'attaquer' && (
          <div className="pvp-section">
            <h3 className="arene-section-titre">Ton équipe d'attaque ({equipeAttaque.length}/6)</h3>
            <IndicateurCompo equipe={equipeAttaque} valide={attaqueValide} label="Équipe d'attaque" />
            <SelecteurEquipe
              equipe={equipeAttaque}
              equipeIds={equipeAttaqueIds}
              captures={captures}
              onBasculer={onBasculerAttaque}
            />

            <div className="pvp-adversaires-entete">
              <h3 className="arene-section-titre">Adversaires</h3>
              <button className="pvp-bouton-rafraichir" onClick={onRafraichir}>↻ Rafraîchir</button>
            </div>

            {chargementListe ? (
              <p className="arene-intro">Chargement des adversaires… ⏳</p>
            ) : adversaires.length === 0 ? (
              <p className="arene-vide">Aucun adversaire n'a encore posé de défense. Reviens plus tard, ou demande à un ami de jouer !</p>
            ) : (
              <div className="pvp-liste">
                {adversaires.map((a) => (
                  <div key={a.id} className="pvp-adversaire">
                    <div className="pvp-adversaire-info">
                      <span className="pvp-adversaire-pseudo">{a.pseudo}</span>
                      <BadgeRang points={a.points_pvp} rang={a.rang} />
                      <ApercuEquipe equipe={a.equipe} />
                    </div>
                    <button
                      className="bouton-combattre"
                      onClick={() => onAttaquer(a)}
                      disabled={!attaqueValide || !a.equipe || a.equipe.length === 0}
                      title={attaqueValide ? 'Lancer le combat' : 'Compose une équipe 1T / 1E / 2S / 2D pour attaquer'}
                    >
                      Attaquer
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== ONGLET DÉFENSE ===== */}
        {onglet === 'defense' && (
          <div className="pvp-section">
            <p className="arene-intro">
              Compose ton <strong>équipe de défense</strong>. Elle sera enregistrée en ligne et combattra automatiquement
              quand d'autres joueurs t'attaqueront. {defensePubliee ? '✓ Ta défense est publiée.' : 'Pas encore publiée.'}
            </p>
            <h3 className="arene-section-titre">Ton équipe de défense ({equipeDefense.length}/6)</h3>
            <IndicateurCompo equipe={equipeDefense} valide={defenseValide} label="Défense" />
            <SelecteurEquipe
              equipe={equipeDefense}
              equipeIds={equipeDefenseIds}
              captures={captures}
              onBasculer={onBasculerDefense}
            />
            <div className="pvp-publier-zone">
              <button
                className="bouton-combattre pvp-bouton-publier"
                onClick={onPublierDefense}
                disabled={!defenseValide || publicationEnCours}
                title={defenseValide ? 'Enregistrer ma défense en ligne' : 'Compose une équipe 1T / 1E / 2S / 2D'}
              >
                {publicationEnCours ? 'Publication…' : (defensePubliee ? 'Mettre à jour ma défense' : 'Publier ma défense')}
              </button>
            </div>
          </div>
        )}

        {/* Légende des rangs */}
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