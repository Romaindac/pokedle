import { useState, useMemo, useEffect } from 'react'
import { ROLES, compterRoles, COMPOSITION_REQUISE } from './roles'
import { etatRaid, tempsRestantRaid, formaterCooldown, spriteBossRaid } from './raids'
import { nomShowdown } from './pokedexNoms'

const ORDRE_RARETE = { legendaire: 0, tresRare: 1, rare: 2, commun: 3 }

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
    dps: (<g stroke={sombre} strokeWidth="1.8" strokeLinecap="round" fill="none"><line x1="4.5" y1="11.5" x2="11.5" y2="4.5" /><line x1="3" y1="9.5" x2="6.5" y2="13" /><line x1="10" y1="3" x2="13" y2="6" /></g>),
    eclaireur: (<path d="M9 1.5 L4 8.5 H7.5 L6.5 14.5 L12 7 H8.5 Z" fill={sombre} />),
    soutien: (<g fill={sombre}><rect x="6.5" y="2.5" width="3" height="11" rx="1" /><rect x="2.5" y="6.5" width="11" height="3" rx="1" /></g>),
  }
  return (<svg viewBox="0 0 16 16" width={taille} height={taille} aria-hidden="true">{formes[role] || null}</svg>)
}

function RecompenseRaid({ recompense }) {
  const parts = []
  if (recompense.argent) parts.push(<span className="arn-recomp-item" key="a"><IconePiece /> {recompense.argent.toLocaleString('fr-FR')}</span>)
  if (recompense.bonbons) parts.push(<span className="arn-recomp-item" key="b"><IconeBonbon /> {recompense.bonbons} super-bonbon{recompense.bonbons > 1 ? 's' : ''}</span>)
  if (parts.length === 0) return <span>Gloire !</span>
  return <>{parts}</>
}

function IndicateurCompoRaid({ equipe, valide }) {
  const compte = compterRoles(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div className={`arn-compo ${valide ? 'ok' : 'ko'}`}>
      <div className="arn-compo-titre">
        {valide ? '✓ Équipe de raid prête au combat' : 'Composition requise : 1 Tank · 1 Éclaireur · 2 Soutien · 2 DPS'}
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

function PanneauRaids({
  raids, nbZones, cooldowns, equipeRaid, equipeRaidIds, captures,
  onBasculerMembre, onLancer, compoValide = false, compoDiagnostic = [], onRetour,
}) {
  const equipePrete = compoValide
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

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
        <div className="arn-topbar-titre">🔥 Raids</div>
        <button className="arn-retour" onClick={onRetour}>← Retour au jeu</button>
      </header>

      <div className="arn-ecran">
        <p className="arn-intro">
          Les <strong>Raids</strong> sont le défi ultime : 3 vagues d'affilée (6 Pokémon, puis 2 mini-boss,
          puis un <strong>gros boss capturable</strong>). Tes PV sont conservés entre les vagues (soin partiel seulement).
          Chaque raid a son propre minuteur de récupération.
        </p>

        <h3 className="arn-section-titre">Ton équipe de raid ({equipeRaid.length}/6)</h3>
        <IndicateurCompoRaid equipe={equipeRaid} valide={compoValide} />
        {equipeRaid.length === 0 && (
          <p className="arn-vide">Aucun Pokémon sélectionné. Choisis-en dans ta collection ci-dessous.</p>
        )}
        <div className="arn-equipe">
          {equipeRaid.map((p) => (
            <button key={p.uid} className="arn-membre" onClick={() => onBasculerMembre(p.uid)} title="Retirer de l'équipe">
              <div className="arn-membre-zone"><SpritePoke poke={p} classe="arn-membre-sprite" /></div>
              <span className="arn-membre-niv">N.{p.niveau}</span>
              <span className="arn-membre-retirer">✕</span>
            </button>
          ))}
        </div>

        <h3 className="arn-section-titre">Choisir des Pokémon</h3>
        <button className={`arn-collection-toggle ${collectionOuverte ? 'ouverte' : ''}`} onClick={() => setCollectionOuverte((v) => !v)}>
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
                  const choisi = equipeRaidIds.includes(p.uid)
                  const infoRole = p.role ? ROLES[p.role] : null
                  return (
                    <button key={p.uid} className={`arn-collection-item ${choisi ? 'choisi' : ''}`}
                      onClick={() => onBasculerMembre(p.uid)}
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

        <h3 className="arn-section-titre">Raids disponibles</h3>
        <div className="arn-dresseurs">
          {raids.map((raid) => {
            const etat = etatRaid(raid, nbZones, cooldowns)
            const restant = tempsRestantRaid(raid, cooldowns)
            return (
              <div key={raid.id} className={`arn-dresseur arn-raid etat-${etat}`}>
                <div className="arn-dresseur-sprite-zone arn-raid-boss">
                  {etat === 'verrouille' ? (
                    <IconeCadenas />
                  ) : (
                    <img src={spriteBossRaid(raid.boss.id)} alt={raid.boss.nomFr} className="arn-dresseur-sprite"
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.textContent = raid.emoji }} />
                  )}
                </div>
                <div className="arn-dresseur-info">
                  <span className="arn-dresseur-nom">{raid.emoji} {raid.nom}</span>
                  <span className="arn-dresseur-titre">Boss : {raid.boss.nomFr}</span>
                  <span className="arn-dresseur-detail">Thème {raid.theme} · Niv. {raid.niveau} · 3 vagues</span>
                  <span className="arn-dresseur-recompense">
                    {etat === 'verrouille'
                      ? `Débloqué à ${raid.debloqueA} zones franchies`
                      : <RecompenseRaid recompense={raid.recompense} />}
                  </span>
                  {etat === 'cooldown' && (<span className="arn-raid-cooldown">⏳ Récupération : {formaterCooldown(restant)}</span>)}
                </div>
                {etat === 'disponible' && (
                  <button className="arn-combattre" onClick={() => onLancer(raid)} disabled={!equipePrete}
                    title={equipePrete ? 'Lancer le raid' : 'Compose une équipe 1 Tank / 1 Éclaireur / 2 Soutien / 2 DPS'}>
                    Lancer
                  </button>
                )}
                {etat === 'cooldown' && <span className="arn-dresseur-statut">En récup.</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PanneauRaids