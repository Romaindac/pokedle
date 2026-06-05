import { useState, useMemo, useEffect } from 'react'
import { ROLES, compterRoles, compterSpeciaux, COMPOSITION_REQUISE, MIN_PAR_ROLE, MAX_PAR_ROLE, MAX_SPECIAL } from './roles'
import { tempsAvantResetMs, formaterTempsReset } from './arene'

// Ordre de rareté pour le tri (du plus rare au plus commun)
const ORDRE_RARETE = { legendaire: 0, tresRare: 1, rare: 2, commun: 3 }

// --- Petites icônes SVG dorées (pas d'emoji, dans la DA) ---
const IconePiece = () => (
  <svg className="arene-ico" viewBox="0 0 16 16" aria-hidden="true">
    <circle cx="8" cy="8" r="7" fill="#ffcd75" stroke="#a87810" strokeWidth="1.5" />
    <circle cx="8" cy="8" r="4.2" fill="none" stroke="#a87810" strokeWidth="1.2" />
    <text x="8" y="11" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#a87810">¥</text>
  </svg>
)
const IconeBonbon = () => (
  <svg className="arene-ico" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="4" y="4" width="8" height="8" rx="2" fill="#7ec8ff" stroke="#3a78b0" strokeWidth="1" transform="rotate(45 8 8)" />
    <path d="M2 8 L4.5 6 L4.5 10 Z" fill="#7ec8ff" stroke="#3a78b0" strokeWidth="0.8" />
    <path d="M14 8 L11.5 6 L11.5 10 Z" fill="#7ec8ff" stroke="#3a78b0" strokeWidth="0.8" />
    <circle cx="8" cy="8" r="1.6" fill="#fff" opacity="0.8" />
  </svg>
)
const IconeObjet = () => (
  <svg className="arene-ico" viewBox="0 0 16 16" aria-hidden="true">
    <rect x="2.5" y="6" width="11" height="7" rx="1" fill="#d4a017" stroke="#a87810" strokeWidth="1" />
    <path d="M2.5 7 Q8 2 13.5 7" fill="none" stroke="#ffcd75" strokeWidth="1.4" />
    <rect x="7" y="8" width="2" height="3" rx="0.5" fill="#7a5810" />
  </svg>
)
const IconeCadenas = () => (
  <svg className="arene-ico" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M5 7 V5 a3 3 0 0 1 6 0 V7" fill="none" stroke="#ffcd75" strokeWidth="1.5" />
    <rect x="3.5" y="7" width="9" height="6.5" rx="1.2" fill="#ffcd75" stroke="#a87810" strokeWidth="1" />
    <circle cx="8" cy="10" r="1.2" fill="#a87810" />
  </svg>
)

// Icône SVG du rôle (sans emoji, dans la DA). La forme dépend du rôle.
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

// --- Minuteur de reset d'arène : « Reset dans 1h23 ». Se met à jour chaque seconde. ---
function MinuteurReset() {
  const [ms, setMs] = useState(() => tempsAvantResetMs())
  useEffect(() => {
    const t = setInterval(() => setMs(tempsAvantResetMs()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="arene-reset-bandeau" title="Tous les dresseurs redeviennent disponibles à intervalles fixes de 3 h.">
      <svg className="arene-ico" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8.5" r="6" fill="none" stroke="#a87810" strokeWidth="1.5" />
        <path d="M8 4.8 V8.5 L10.5 10" fill="none" stroke="#a87810" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M6 1.5 H10" stroke="#a87810" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <span>Reset des dresseurs dans <strong>{formaterTempsReset(ms)}</strong></span>
    </div>
  )
}

// Construit la ligne de récompense avec des icônes SVG (au lieu d'emojis)
function RecompenseDresseur({ recompense }) {
  const parts = []
  if (recompense.argent) parts.push(<span className="arene-recomp-item" key="a"><IconePiece /> {recompense.argent}</span>)
  if (recompense.bonbon) parts.push(<span className="arene-recomp-item" key="b"><IconeBonbon /> {recompense.bonbon} super-bonbon{recompense.bonbon > 1 ? 's' : ''}</span>)
  if (recompense.objet) parts.push(<span className="arene-recomp-item" key="o"><IconeObjet /> 1 objet rare</span>)
  if (parts.length === 0) return <span>Gloire !</span>
  return <>{parts}</>
}

// Indicateur de composition d'équipe d'arène (souple : 1 à 2 par rôle, 1 spécial max).
function IndicateurCompoArene({ equipe, valide }) {
  const compte = compterRoles(equipe)
  const nbSpeciaux = compterSpeciaux(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div className={`compo-indicateur ${valide ? 'compo-ok' : 'compo-ko'}`}>
      <div className="compo-titre">
        {valide
          ? '✓ Équipe d\'arène prête au combat'
          : `Compo : 1 à 2 par rôle (chaque rôle présent) · ${MAX_SPECIAL} spécial max`}
      </div>
      <div className="compo-roles">
        {ordre.map((role) => {
          const info = ROLES[role]
          const actuel = compte[role]
          const ok = actuel >= MIN_PAR_ROLE && actuel <= MAX_PAR_ROLE
          return (
            <span key={role} className={`compo-role ${ok ? 'role-ok' : 'role-ko'}`} style={{ borderColor: info.couleur }}>
              <span className="compo-role-emoji"><IconeRole role={role} taille={13} /></span>
              <span className="compo-role-txt">{info.nom}</span>
              <span className="compo-role-compte">{actuel}/{MAX_PAR_ROLE}</span>
            </span>
          )
        })}
        {nbSpeciaux > 0 && (
          <span className={`compo-role ${nbSpeciaux <= MAX_SPECIAL ? 'role-ok' : 'role-ko'}`} style={{ borderColor: '#d986ff' }}>
            <span className="compo-role-emoji">🌟</span>
            <span className="compo-role-txt">Spécial</span>
            <span className="compo-role-compte">{nbSpeciaux}/{MAX_SPECIAL}</span>
          </span>
        )}
      </div>
    </div>
  )
}

// Écran du Mode Arène : sélection de l'équipe d'arène + liste des dresseurs à affronter.
function PanneauArene({
  listeDresseurs,
  equipeArene,
  equipeAreneIds,
  captures,
  onBasculerMembre,
  onAutoEquipe,
  onCombattre,
  decrireRecompense,
  compoValide = false,
  compoDiagnostic = [],
  autoArene = false,
  onToggleAuto,
  onRetour,
}) {
  const equipePrete = compoValide

  const [recherche, setRecherche] = useState('')
  const [tri, setTri] = useState('niveau')
  const [roleFiltre, setRoleFiltre] = useState('tous')

  const collectionFiltree = useMemo(() => {
    let liste = [...captures]
    const q = recherche.trim().toLowerCase()
    if (q) {
      liste = liste.filter((p) => (p.nom || '').toLowerCase().includes(q))
    }
    if (roleFiltre !== 'tous') {
      liste = liste.filter((p) => p.role === roleFiltre)
    }
    liste.sort((a, b) => {
      switch (tri) {
        case 'niveau':
          return (b.niveau || 0) - (a.niveau || 0)
        case 'rarete': {
          const ra = ORDRE_RARETE[a.rarete] ?? 9
          const rb = ORDRE_RARETE[b.rarete] ?? 9
          if (ra !== rb) return ra - rb
          return (b.niveau || 0) - (a.niveau || 0)
        }
        case 'nom':
          return (a.nom || '').localeCompare(b.nom || '')
        case 'numero':
          return (a.numero || 0) - (b.numero || 0)
        default:
          return 0
      }
    })
    return liste
  }, [captures, recherche, tri, roleFiltre])

  return (
    <div className="app app-layout">
      <header className="topbar">
        <div className="topbar-titre">⚔️ Mode Arène</div>
        <button className="bouton-retour-arene" onClick={onRetour}>
          ← Retour au jeu
        </button>
      </header>

      <div className="arene-ecran arene-ecran-doree arene-v2">
        <p className="arene-intro">
          Compose ton <strong>équipe d'arène</strong> (1 à 2 Pokémon par rôle, les 4 rôles présents · 1 spécial max), puis défie les dresseurs.
          Ils deviennent plus coriaces à mesure que tu progresses !
        </p>

        {/* Minuteur de reset (les dresseurs redeviennent dispo toutes les 3 h) */}
        <MinuteurReset />

        {/* ===== Équipe d'arène ===== */}
        <h3 className="arene-section-titre">Ton équipe d'arène ({equipeArene.length}/6)</h3>

        {onAutoEquipe && (
          <button className="bouton-auto-equipe arene-auto-equipe" onClick={onAutoEquipe}>
            ⚡ Équipe auto
          </button>
        )}

        <IndicateurCompoArene equipe={equipeArene} valide={compoValide} />

        {equipeArene.length === 0 && (
          <p className="arene-vide">Aucun Pokémon sélectionné. Choisis-en dans ta collection ci-dessous.</p>
        )}
        <div className="arene-equipe">
          {equipeArene.map((p) => (
            <button
              key={p.uid}
              className="arene-membre"
              onClick={() => onBasculerMembre(p.uid)}
              title="Retirer de l'équipe"
            >
              <img src={p.shiny ? (p.spriteShiny || p.sprite) : p.sprite} alt={p.nom} />
              <span className="arene-membre-niv">N.{p.niveau}</span>
              <span className="arene-membre-retirer">✕</span>
            </button>
          ))}
        </div>

        {/* ===== Collection (pour choisir) ===== */}
        <h3 className="arene-section-titre">Ta collection</h3>

        <div className="arene-outils">
          <input
            type="text"
            className="banc-recherche arene-recherche"
            placeholder="🔍 Rechercher un Pokémon…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <select
            className="tri-select arene-tri"
            value={tri}
            onChange={(e) => setTri(e.target.value)}
            title="Trier la collection"
          >
            <option value="niveau">Tri : Niveau ↓</option>
            <option value="rarete">Tri : Rareté</option>
            <option value="nom">Tri : Nom (A-Z)</option>
            <option value="numero">Tri : N° Pokédex</option>
          </select>
        </div>

        <div className="arene-filtres-role">
          <button
            className={`filtre-role ${roleFiltre === 'tous' ? 'actif' : ''}`}
            onClick={() => setRoleFiltre('tous')}
          >Tous</button>
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
            <p className="arene-vide" style={{ gridColumn: '1 / -1' }}>
              Aucun Pokémon ne correspond à ta recherche.
            </p>
          ) : (
            collectionFiltree.map((p) => {
              const choisi = equipeAreneIds.includes(p.uid)
              const role = p.role
              const infoRole = role ? ROLES[role] : null
              return (
                <button
                  key={p.uid}
                  className={`arene-collection-item ${choisi ? 'choisi' : ''} ${role ? 'role-' + role : ''}`}
                  onClick={() => onBasculerMembre(p.uid)}
                  title={choisi ? 'Retirer' : `${p.nom}${infoRole ? ' — ' + infoRole.nom : ''} — Ajouter`}
                  style={infoRole ? { '--role-couleur': infoRole.couleur } : undefined}
                >
                  <img src={p.shiny ? (p.spriteShiny || p.sprite) : p.sprite} alt={p.nom} />
                  <span className="arene-collection-niv">N.{p.niveau}</span>
                  {infoRole && (
                    <span className="arene-collection-pastille" title={infoRole.nom} style={{ background: infoRole.couleur }}>
                      <IconeRole role={role} taille={13} />
                    </span>
                  )}
                  {choisi && <span className="arene-collection-check">✓</span>}
                </button>
              )
            })
          )}
        </div>

        {/* ===== Liste des dresseurs ===== */}
        <h3 className="arene-section-titre">Dresseurs ({listeDresseurs.filter((d) => d.etat === 'vaincu').length}/{listeDresseurs.length} vaincus)</h3>

        {onToggleAuto && (
          <div className="arene-auto-barre">
            <button
              className={`bouton-auto ${autoArene ? 'actif' : ''}`}
              onClick={onToggleAuto}
              disabled={!equipePrete}
              title={equipePrete ? 'Enchaîne automatiquement le dresseur suivant après chaque victoire' : 'Compose d\'abord une équipe valide'}
            >
              {autoArene ? '⏸️ Auto dresseur : ON' : '▶️ Auto dresseur : OFF'}
            </button>
            <span className="arene-auto-aide">
              Enchaîne le dresseur suivant après chaque victoire. S'arrête en cas de défaite.
            </span>
          </div>
        )}

        <div className="arene-dresseurs">
          {listeDresseurs.map((d) => (
            <div key={d.id} className={`arene-dresseur etat-${d.etat} ${d.estBoss ? 'est-boss' : ''}`}>
              <div className="arene-dresseur-emoji">
                {d.etat === 'verrouille' ? (
                  <IconeCadenas />
                ) : d.sprite ? (
                  <img
                    src={d.sprite}
                    alt={d.nom}
                    className="arene-dresseur-sprite"
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = d.emoji }}
                  />
                ) : (
                  d.emoji
                )}
              </div>
              <div className="arene-dresseur-info">
                <span className="arene-dresseur-nom">
                  {d.estBoss && d.etat !== 'verrouille' && <span className="arene-badge-boss">★ BOSS</span>} {d.nom} {d.etat === 'vaincu' && <span className="arene-badge-vaincu">✓</span>}
                </span>
                <span className="arene-dresseur-titre">{d.titre}</span>
                <span className="arene-dresseur-detail">
                  Thème {d.theme} · Niv. {d.niveau} · {d.equipe.length} Pokémon
                </span>
                <span className="arene-dresseur-recompense">
                  {d.etat === 'verrouille'
                    ? (!d.assezDeZones ? 'Avance dans l\'aventure pour débloquer' : 'Bats le dresseur précédent')
                    : <RecompenseDresseur recompense={d.recompense} />}
                </span>
              </div>
              {d.etat === 'disponible' && (
                <button
                  className="bouton-combattre"
                  onClick={() => onCombattre(d)}
                  disabled={!equipePrete}
                  title={equipePrete ? 'Lancer le combat' : 'Compose une équipe : 1 à 2 par rôle, les 4 rôles présents · 1 spécial max'}
                >
                  Combattre
                </button>
              )}
              {d.etat === 'vaincu' && <span className="arene-dresseur-statut">Vaincu</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PanneauArene