import { useState, useMemo, useEffect } from 'react'
import { ROLES, compterRoles, COMPOSITION_REQUISE } from './roles'
import { etatRaid, tempsRestantRaid, formaterCooldown, spriteBossRaid } from './raids'

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

// Récompense d'un raid avec icônes SVG.
function RecompenseRaid({ recompense }) {
  const parts = []
  if (recompense.argent) parts.push(<span className="arene-recomp-item" key="a"><IconePiece /> {recompense.argent.toLocaleString('fr-FR')}</span>)
  if (recompense.bonbons) parts.push(<span className="arene-recomp-item" key="b"><IconeBonbon /> {recompense.bonbons} super-bonbon{recompense.bonbons > 1 ? 's' : ''}</span>)
  if (parts.length === 0) return <span>Gloire !</span>
  return <>{parts}</>
}

// Indicateur de composition d'équipe (1 Tank / 1 Éclaireur / 2 Soutien / 2 DPS).
function IndicateurCompoRaid({ equipe, valide }) {
  const compte = compterRoles(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div className={`compo-indicateur ${valide ? 'compo-ok' : 'compo-ko'}`}>
      <div className="compo-titre">
        {valide ? '✓ Équipe de raid prête au combat' : 'Composition requise : 1 Tank · 1 Éclaireur · 2 Soutien · 2 DPS'}
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

// Écran du Mode Raid : sélection de l'équipe de raid + liste des raids.
function PanneauRaids({
  raids,
  nbZones,
  cooldowns,
  equipeRaid,
  equipeRaidIds,
  captures,
  onBasculerMembre,
  onLancer,
  compoValide = false,
  compoDiagnostic = [],
  onRetour,
}) {
  const equipePrete = compoValide

  // Rafraîchit l'affichage chaque seconde pour faire défiler les minuteurs de cooldown.
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // --- Recherche + tri + filtre rôle de la collection ---
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
        case 'rarete': {
          const ra = ORDRE_RARETE[a.rarete] ?? 9
          const rb = ORDRE_RARETE[b.rarete] ?? 9
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
      <header className="topbar">
        <div className="topbar-titre">🔥 Raids</div>
        <button className="bouton-retour-arene" onClick={onRetour}>
          ← Retour au jeu
        </button>
      </header>

      <div className="arene-ecran arene-ecran-doree">
        <p className="arene-intro">
          Les <strong>Raids</strong> sont le défi ultime : 3 vagues d'affilée (6 Pokémon, puis 2 mini-boss,
          puis un <strong>gros boss capturable</strong>). Tes PV sont conservés entre les vagues (soin partiel seulement).
          Chaque raid a son propre minuteur de récupération.
        </p>

        {/* ===== Équipe de raid ===== */}
        <h3 className="arene-section-titre">Ton équipe de raid ({equipeRaid.length}/6)</h3>
        <IndicateurCompoRaid equipe={equipeRaid} valide={compoValide} />

        {equipeRaid.length === 0 && (
          <p className="arene-vide">Aucun Pokémon sélectionné. Choisis-en dans ta collection ci-dessous.</p>
        )}
        <div className="arene-equipe">
          {equipeRaid.map((p) => (
            <button key={p.uid} className="arene-membre" onClick={() => onBasculerMembre(p.uid)} title="Retirer de l'équipe">
              <img src={p.shiny ? (p.spriteShiny || p.sprite) : p.sprite} alt={p.nom} />
              <span className="arene-membre-niv">N.{p.niveau}</span>
              <span className="arene-membre-retirer">✕</span>
            </button>
          ))}
        </div>

        {/* ===== Collection ===== */}
        <h3 className="arene-section-titre">Ta collection</h3>
        <div className="arene-outils">
          <input
            type="text"
            className="banc-recherche arene-recherche"
            placeholder="🔍 Rechercher un Pokémon…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
          <select className="tri-select arene-tri" value={tri} onChange={(e) => setTri(e.target.value)} title="Trier la collection">
            <option value="niveau">Tri : Niveau ↓</option>
            <option value="rarete">Tri : Rareté</option>
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
            <p className="arene-vide" style={{ gridColumn: '1 / -1' }}>Aucun Pokémon ne correspond à ta recherche.</p>
          ) : (
            collectionFiltree.map((p) => {
              const choisi = equipeRaidIds.includes(p.uid)
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

        {/* ===== Liste des raids ===== */}
        <h3 className="arene-section-titre">Raids disponibles</h3>
        <div className="arene-dresseurs raids-liste">
          {raids.map((raid) => {
            const etat = etatRaid(raid, nbZones, cooldowns)
            const restant = tempsRestantRaid(raid, cooldowns)
            return (
              <div key={raid.id} className={`arene-dresseur raid-carte etat-${etat}`}>
                <div className="arene-dresseur-emoji raid-boss-sprite-zone">
                  {etat === 'verrouille' ? (
                    <IconeCadenas />
                  ) : (
                    <img
                      src={spriteBossRaid(raid.boss.id)}
                      alt={raid.boss.nomFr}
                      className="arene-dresseur-sprite raid-boss-sprite"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = raid.emoji }}
                    />
                  )}
                </div>
                <div className="arene-dresseur-info">
                  <span className="arene-dresseur-nom">
                    {raid.emoji} {raid.nom}
                  </span>
                  <span className="arene-dresseur-titre">Boss : {raid.boss.nomFr}</span>
                  <span className="arene-dresseur-detail">
                    Thème {raid.theme} · Niv. {raid.niveau} · 3 vagues
                  </span>
                  <span className="arene-dresseur-recompense">
                    {etat === 'verrouille'
                      ? `Débloqué à ${raid.debloqueA} zones franchies`
                      : <RecompenseRaid recompense={raid.recompense} />}
                  </span>
                  {etat === 'cooldown' && (
                    <span className="raid-cooldown">⏳ Récupération : {formaterCooldown(restant)}</span>
                  )}
                </div>
                {etat === 'disponible' && (
                  <button
                    className="bouton-combattre"
                    onClick={() => onLancer(raid)}
                    disabled={!equipePrete}
                    title={equipePrete ? 'Lancer le raid' : 'Compose une équipe 1 Tank / 1 Éclaireur / 2 Soutien / 2 DPS'}
                  >
                    Lancer
                  </button>
                )}
                {etat === 'cooldown' && <span className="arene-dresseur-statut">En récup.</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PanneauRaids