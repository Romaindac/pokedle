import { useState, useMemo, useEffect } from 'react'
import { ROLES, compterRoles, compterSpeciaux, COMPOSITION_REQUISE, MIN_PAR_ROLE, MAX_PAR_ROLE, MAX_SPECIAL } from './roles'
import { tempsAvantResetMs, formaterTempsReset } from './arene'
import { nomShowdown } from './pokedexNoms'

const ORDRE_RARETE = { legendaire: 0, tresRare: 1, rare: 2, commun: 3 }

// Sprite Pokémon animé Showdown (gestion shiny + repli).
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

const IconePiece = () => (
  <svg className="arn-ico" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="#fcd34d" stroke="#a87810" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="4.2" fill="none" stroke="#a87810" strokeWidth="1.2" />
    <text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#a87810">¥</text>
  </svg>
)
const IconeBonbon = () => (
  <svg className="arn-ico" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="4" y="4" width="8" height="8" rx="2" fill="#7ec8ff" stroke="#3a78b0" strokeWidth="1" transform="rotate(45 8 8)" />
    <path d="M2 8 L4.5 6 L4.5 10 Z" fill="#7ec8ff" stroke="#3a78b0" strokeWidth="0.8" />
    <path d="M14 8 L11.5 6 L11.5 10 Z" fill="#7ec8ff" stroke="#3a78b0" strokeWidth="0.8" />
    <circle cx="8" cy="8" r="1.6" fill="#fff" opacity="0.8" />
  </svg>
)
const IconeObjet = () => (
  <svg className="arn-ico" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="2.5" y="6" width="11" height="7" rx="1" fill="#d4a017" stroke="#a87810" strokeWidth="1" />
    <path d="M2.5 7 Q8 2 13.5 7" fill="none" stroke="#fcd34d" strokeWidth="1.4" />
    <rect x="7" y="8" width="2" height="3" rx="0.5" fill="#7a5810" />
  </svg>
)
const IconeCadenas = () => (
  <svg className="arn-ico" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M5 7 V5 a3 3 0 0 1 6 0 V7" fill="none" stroke="#9099a1" strokeWidth="1.5" />
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" fill="#9099a1" stroke="#5f5e5a" strokeWidth="1" />
    <circle cx="8" cy="10" r="1.2" fill="#5f5e5a" />
  </svg>
)

function IconeRole({ role, taille = 14 }) {
  const sombre = '#0d1117'
  const formes = {
    tank: (<path d="M8 1.5 L13 3.5 V8 C13 11 10.5 13.5 8 14.5 C5.5 13.5 3 11 3 8 V3.5 Z" fill={sombre} />),
    dps: (
      <g stroke={sombre} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <line x1="4.5" y1="11.5" x2="11.5" y2="4.5" /><line x1="3" y1="9.5" x2="6.5" y2="13" /><line x1="10" y1="3" x2="13" y2="6" />
      </g>
    ),
    eclaireur: (<path d="M9 1.5 L4 8.5 H7.5 L6.5 14.5 L12 7 H8.5 Z" fill={sombre} />),
    soutien: (<g fill={sombre}><rect x="6.5" y="2.5" width="3" height="11" rx="1" /><rect x="2.5" y="6.5" width="11" height="3" rx="1" /></g>),
  }
  return (<svg viewBox="0 0 16 16" width={taille} height={taille} aria-hidden="true">{formes[role] || null}</svg>)
}

function MinuteurReset() {
  const [ms, setMs] = useState(() => tempsAvantResetMs())
  useEffect(() => {
    const t = setInterval(() => setMs(tempsAvantResetMs()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="arn-reset" title="Tous les dresseurs redeviennent disponibles à intervalles fixes de 3 h.">
      <svg className="arn-ico" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8.5" r="6" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
        <path d="M8 4.8 V8.5 L10.5 10" fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 1.5 H10" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>Reset des dresseurs dans <strong>{formaterTempsReset(ms)}</strong></span>
    </div>
  )
}

function RecompenseDresseur({ recompense }) {
  const parts = []
  if (recompense.argent) parts.push(<span className="arn-recomp-item" key="a"><IconePiece /> {recompense.argent}</span>)
  if (recompense.bonbon) parts.push(<span className="arn-recomp-item" key="b"><IconeBonbon /> {recompense.bonbon} super-bonbon{recompense.bonbon > 1 ? 's' : ''}</span>)
  if (recompense.objet) parts.push(<span className="arn-recomp-item" key="o"><IconeObjet /> 1 objet rare</span>)
  if (parts.length === 0) return <span>Gloire !</span>
  return <>{parts}</>
}

function IndicateurCompoArene({ equipe, valide }) {
  const compte = compterRoles(equipe)
  const nbSpeciaux = compterSpeciaux(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div className={`arn-compo ${valide ? 'ok' : 'ko'}`}>
      <div className="arn-compo-titre">
        {valide ? "✓ Équipe d'arène prête au combat" : `Compo : 1 à 2 par rôle (chaque rôle présent) · ${MAX_SPECIAL} spécial max`}
      </div>
      <div className="arn-compo-roles">
        {ordre.map((role) => {
          const info = ROLES[role]
          const actuel = compte[role]
          const ok = actuel >= MIN_PAR_ROLE && actuel <= MAX_PAR_ROLE
          return (
            <span key={role} className={`arn-compo-role ${ok ? 'ok' : 'ko'}`} style={{ '--c-role': info.couleur }}>
              <span className="arn-compo-role-ico"><IconeRole role={role} taille={13} /></span>
              <span className="arn-compo-role-txt">{info.nom}</span>
              <span className="arn-compo-role-compte">{actuel}/{MAX_PAR_ROLE}</span>
            </span>
          )
        })}
        {nbSpeciaux > 0 && (
          <span className={`arn-compo-role ${nbSpeciaux <= MAX_SPECIAL ? 'ok' : 'ko'}`} style={{ '--c-role': '#d986ff' }}>
            <span className="arn-compo-role-ico">🌟</span>
            <span className="arn-compo-role-txt">Spécial</span>
            <span className="arn-compo-role-compte">{nbSpeciaux}/{MAX_SPECIAL}</span>
          </span>
        )}
      </div>
    </div>
  )
}

function PanneauArene({
  listeDresseurs, equipeArene, equipeAreneIds, captures,
  onBasculerMembre, onAutoEquipe, onCombattre, decrireRecompense,
  compoValide = false, compoDiagnostic = [], autoArene = false, onToggleAuto, onRetour,
}) {
  const equipePrete = compoValide
  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('niveau')
  const [roleFiltre, setRoleFiltre] = useState('tous')
  const [collectionOuverte, setCollectionOuverte] = useState(false)

  const collectionFiltree = useMemo(() => {
    let liste = [...captures]
    const q = recherche.trim().toLowerCase()
    if (q) liste = liste.filter((p) => (p.nom || '').toLowerCase().includes(q))
    if (roleFiltre !== 'tous') liste = liste.filter((p) => p.role === roleFiltre)
    liste.sort((a, b) => {
      switch (tri) {
        case 'niveau': return (b.niveau || 0) - (a.niveau || 0)
        case 'rarete': {
          const ra = ORDRE_RARETE[a.rarete] ?? 9, rb = ORDRE_RARETE[b.rarete] ?? 9
          if (ra !== rb) return ra - rb
          return (b.niveau || 0) - (a.niveau || 0)
        }
        case 'nom': return (a.nom || '').localeCompare(b.nom || '')
        case 'numero': return (a.numero || 0) - (b.numero || 0)
        default: return 0
      }
    })
    return liste
  }, [captures, recherche, tri, roleFiltre])

  return (
    <div className="app app-layout">
      <header className="arn-topbar">
        <div className="arn-topbar-titre">⚔️ Mode Arène</div>
        <button className="arn-retour" onClick={onRetour}>← Retour au jeu</button>
      </header>

      <div className="arn-ecran">
        <p className="arn-intro">
          Compose ton <strong>équipe d'arène</strong> (1 à 2 Pokémon par rôle, les 4 rôles présents · 1 spécial max), puis défie les dresseurs.
          Ils deviennent plus coriaces à mesure que tu progresses !
        </p>

        <MinuteurReset />

        <h3 className="arn-section-titre">Ton équipe d'arène ({equipeArene.length}/6)</h3>
        {onAutoEquipe && (
          <button className="arn-auto-equipe" onClick={onAutoEquipe}>⚡ Équipe auto</button>
        )}
        <IndicateurCompoArene equipe={equipeArene} valide={compoValide} />

        {equipeArene.length === 0 && (
          <p className="arn-vide">Aucun Pokémon sélectionné. Choisis-en dans ta collection ci-dessous.</p>
        )}
        <div className="arn-equipe">
          {equipeArene.map((p) => (
            <button key={p.uid} className="arn-membre" onClick={() => onBasculerMembre(p.uid)} title="Retirer de l'équipe">
              <div className="arn-membre-zone"><SpritePoke poke={p} classe="arn-membre-sprite" /></div>
              <span className="arn-membre-niv">N.{p.niveau}</span>
              <span className="arn-membre-retirer">✕</span>
            </button>
          ))}
        </div>

        <h3 className="arn-section-titre">Choisir des Pokémon</h3>
        <button
          className={`arn-collection-toggle ${collectionOuverte ? 'ouverte' : ''}`}
          onClick={() => setCollectionOuverte((v) => !v)}>
          <span>Ta collection ({captures.length})</span>
          <span className="arn-collection-chevron">{collectionOuverte ? '▲' : '▼'}</span>
        </button>

        {collectionOuverte && (
          <div className="arn-collection-zone-deroulee">
            <div className="arn-outils">
              <input type="text" className="arn-recherche" placeholder="🔍 Rechercher un Pokémon…"
                value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              <select className="arn-tri" value={tri} onChange={(e) => setTri(e.target.value)} title="Trier la collection">
                <option value="niveau">Tri : Niveau ↓</option>
                <option value="rarete">Tri : Rareté</option>
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
                <p className="arn-vide" style={{ gridColumn: '1 / -1' }}>Aucun Pokémon ne correspond à ta recherche.</p>
              ) : (
                collectionFiltree.map((p) => {
                  const choisi = equipeAreneIds.includes(p.uid)
                  const role = p.role
                  const infoRole = role ? ROLES[role] : null
                  return (
                    <button key={p.uid}
                      className={`arn-collection-item ${choisi ? 'choisi' : ''}`}
                      onClick={() => onBasculerMembre(p.uid)}
                      title={choisi ? 'Retirer' : `${p.nom}${infoRole ? ' — ' + infoRole.nom : ''} — Ajouter`}
                      style={infoRole ? { '--c-role': infoRole.couleur } : undefined}>
                      <div className="arn-collection-zone"><SpritePoke poke={p} classe="arn-collection-sprite" /></div>
                      <span className="arn-collection-niv">N.{p.niveau}</span>
                      {infoRole && (
                        <span className="arn-collection-pastille" title={infoRole.nom} style={{ background: infoRole.couleur }}>
                          <IconeRole role={role} taille={13} />
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

        <h3 className="arn-section-titre">Dresseurs ({listeDresseurs.filter((d) => d.etat === 'vaincu').length}/{listeDresseurs.length} vaincus)</h3>

        {onToggleAuto && (
          <div className="arn-auto-barre">
            <button className={`arn-auto ${autoArene ? 'actif' : ''}`} onClick={onToggleAuto} disabled={!equipePrete}
              title={equipePrete ? 'Enchaîne automatiquement le dresseur suivant après chaque victoire' : "Compose d'abord une équipe valide"}>
              {autoArene ? '⏸️ Auto dresseur : ON' : '▶️ Auto dresseur : OFF'}
            </button>
            <span className="arn-auto-aide">Enchaîne le dresseur suivant après chaque victoire. S'arrête en cas de défaite.</span>
          </div>
        )}

        <div className="arn-dresseurs">
          {listeDresseurs.map((d) => (
            <div key={d.id} className={`arn-dresseur etat-${d.etat} ${d.estBoss ? 'est-boss' : ''}`}>
              <div className="arn-dresseur-sprite-zone">
                {d.etat === 'verrouille' ? (
                  <IconeCadenas />
                ) : d.sprite ? (
                  <img src={d.sprite} alt={d.nom} className="arn-dresseur-sprite"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = d.emoji }} />
                ) : (d.emoji)}
              </div>
              <div className="arn-dresseur-info">
                <span className="arn-dresseur-nom">
                  {d.estBoss && d.etat !== 'verrouille' && <span className="arn-badge-boss">★ BOSS</span>} {d.nom} {d.etat === 'vaincu' && <span className="arn-badge-vaincu">✓</span>}
                </span>
                <span className="arn-dresseur-titre">{d.titre}</span>
                <span className="arn-dresseur-detail">Thème {d.theme} · Niv. {d.niveau} · {d.equipe.length} Pokémon</span>
                <span className="arn-dresseur-recompense">
                  {d.etat === 'verrouille'
                    ? (!d.assezDeZones ? "Avance dans l'aventure pour débloquer" : 'Bats le dresseur précédent')
                    : <RecompenseDresseur recompense={d.recompense} />}
                </span>
              </div>
              {d.etat === 'disponible' && (
                <button className="arn-combattre" onClick={() => onCombattre(d)} disabled={!equipePrete}
                  title={equipePrete ? 'Lancer le combat' : 'Compose une équipe : 1 à 2 par rôle, les 4 rôles présents · 1 spécial max'}>
                  Combattre
                </button>
              )}
              {d.etat === 'vaincu' && <span className="arn-dresseur-statut">Vaincu</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PanneauArene