import { useState, memo } from 'react'
import { xpRequise, STAT_MAX_IV } from './stats'
import { XP_BASE_NIVEAU, PIERRES } from './config'
import { ROLES, determinerRole, passifDe, passifEffectif, passifsDuRole, passifPourMode, compterRoles, compterSpeciaux, compositionValide, COMPOSITION_REQUISE, MIN_PAR_ROLE, MAX_PAR_ROLE, MAX_SPECIAL, estJoker, roleEffectif, CASES_JOKER } from './roles'
import { OBJETS } from './objets'
import { PARCHEMINS } from './parchemins'
import { SYNERGIES, synergiesActives, manquePourSynergie } from './synergies'

// Conversion d'un nom PokeAPI vers l'identifiant de sprite Showdown.
// Les formes speciales (Mega, Primal...) : "mewtwo-mega-x" -> fichier "mewtwo-megax.gif"
// (on garde le PREMIER tiret, on supprime les suivants). Inoffensif pour les noms simples.
function nomSpriteShowdown(nomBrut) {
  let n = (nomBrut || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  const i = n.indexOf('-')
  if (i !== -1) n = n.slice(0, i + 1) + n.slice(i + 1).replace(/-/g, '')
  return n
}

// Sprite de Pokémon avec cascade : animé Showdown -> artwork HD -> sprite normal.
function SpritePoke({ poke, classe = 'eqm-sprite', anime = true }) {
  const nom = nomSpriteShowdown(poke.nom)
  const shiny = !!poke.shiny
  const dossierAnime = shiny ? 'ani-shiny' : 'ani'
  const urlAnime = `https://play.pokemonshowdown.com/sprites/${dossierAnime}/${nom}.gif`
  const dossierHd = shiny ? 'official-artwork/shiny' : 'official-artwork'
  const urlHd = poke.id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${dossierHd}/${poke.id}.png` : null
  const fallback = poke.sprite
  const onError = (e) => {
    const img = e.currentTarget
    const etape = parseInt(img.dataset.etape || '0', 10)
    if (etape === 0 && urlHd) { img.dataset.etape = '1'; img.src = urlHd }
    else if (etape <= 1 && fallback) { img.dataset.etape = '2'; img.src = fallback }
  }
  return (
    <img
      src={anime ? urlAnime : (fallback || urlHd)}
      alt={poke.nom}
      className={classe}
      data-etape="0"
      loading="lazy"
      onError={onError}
    />
  )
}

function BadgeRole({ pokemon }) {
  const role = pokemon.role || determinerRole(pokemon)
  const info = ROLES[role]
  if (!info) return null
  return <span className="eqm-badge-role" title={info.nom}>{info.emoji}</span>
}

function IndicateurCompo({ equipe }) {
  const compte = compterRoles(equipe)
  const valide = compositionValide(equipe)
  const nbSpeciaux = compterSpeciaux(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div className={`eqm-compo ${valide ? 'eqm-compo-ok' : 'eqm-compo-ko'}`}>
      <div className="eqm-compo-titre">
        {valide
          ? '✓ Composition valide — prête au combat'
          : `Compo : 1 à 2 par rôle (chaque rôle présent) · ${MAX_SPECIAL} spécial max`}
      </div>
      <div className="eqm-compo-roles">
        {ordre.map((role) => {
          const info = ROLES[role]
          const actuel = compte[role]
          const ok = actuel >= MIN_PAR_ROLE && actuel <= MAX_PAR_ROLE
          return (
            <span key={role} className={`eqm-compo-role ${ok ? 'eqm-role-ok' : 'eqm-role-ko'}`} style={{ '--c-role': info.couleur }}>
              <span className="eqm-compo-role-emoji">{info.emoji}</span>
              <span className="eqm-compo-role-txt">{info.nom}</span>
              <span className="eqm-compo-role-compte">{actuel}/{MAX_PAR_ROLE}</span>
            </span>
          )
        })}
        {nbSpeciaux > 0 && (
          <span className={`eqm-compo-role ${nbSpeciaux <= MAX_SPECIAL ? 'eqm-role-ok' : 'eqm-role-ko'}`} style={{ '--c-role': '#d986ff' }}>
            <span className="eqm-compo-role-emoji">🌟</span>
            <span className="eqm-compo-role-txt">Spécial</span>
            <span className="eqm-compo-role-compte">{nbSpeciaux}/{MAX_SPECIAL}</span>
          </span>
        )}
      </div>
    </div>
  )
}

// Popup explicative du fonctionnement des synergies.
function PopupSynergies({ onFermer }) {
  return (
    <div className="overlay" onClick={onFermer} style={{ zIndex: 400 }}>
      <div className="eqm-syn-popup" onClick={(e) => e.stopPropagation()}>
        <button className="eqm-fermer" onClick={onFermer}>✕</button>
        <h3 className="eqm-syn-popup-titre">⚡ Comment marchent les synergies ?</h3>
        <p className="eqm-syn-popup-intro">
          Les synergies sont des <strong>bonus automatiques</strong> qui s'activent selon les <strong>rôles</strong> des Pokémon de ton équipe. Tu n'as rien à cliquer : dès que ta composition remplit la condition, le bonus s'applique en combat !
        </p>
        <p className="eqm-syn-popup-exemple">
          <strong>Exemple :</strong> si tu mets 2 Éclaireurs et 1 DPS dans ton équipe, la synergie <strong>⚡ Blitz</strong> s'active toute seule et booste la vitesse et les dégâts de toute l'équipe.
        </p>
        <div className="eqm-syn-popup-liste">
          {Object.keys(SYNERGIES).map((cle) => {
            const s = SYNERGIES[cle]
            return (
              <div key={cle} className="eqm-syn-popup-ligne" style={{ '--c-syn': s.couleur }}>
                <span className="eqm-syn-popup-emoji">{s.emoji}</span>
                <div>
                  <span className="eqm-syn-popup-nom">{s.nom}</span>
                  <span className="eqm-syn-popup-desc">{s.description}</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="eqm-syn-popup-astuce">💡 Astuce : tu peux changer le rôle d'un Pokémon avec un parchemin, ou utiliser un Joker qui s'adapte au rôle dont tu as besoin.</p>
      </div>
    </div>
  )
}

// Encart des synergies d'équipe : compact par défaut (pastilles actives), dépliable.
function IndicateurSynergies({ equipe }) {
  const [popup, setPopup] = useState(false)
  const [deplie, setDeplie] = useState(false)
  const actives = synergiesActives(equipe)
  const clesActives = new Set(actives.map((s) => s.cle))
  const inactives = Object.keys(SYNERGIES).map((cle) => ({ cle, ...SYNERGIES[cle] })).filter((s) => !clesActives.has(s.cle))

  return (
    <div className="eqm-syn">
      <div className="eqm-syn-titre">
        <span>⚡ Synergies</span>
        {actives.length > 0
          ? <span className="eqm-syn-compteur">{actives.length} active{actives.length > 1 ? 's' : ''}</span>
          : <span className="eqm-syn-compteur eqm-syn-compteur-vide">0 active</span>}
        <button className="eqm-syn-aide-btn" onClick={() => setPopup(true)} title="Comment ça marche ?">?</button>
      </div>

      {/* Pastilles des synergies ACTIVES (compact) */}
      {actives.length > 0 ? (
        <div className="eqm-syn-pastilles">
          {actives.map((s) => (
            <span key={s.cle} className="eqm-syn-pastille" style={{ '--c-syn': s.couleur }} title={s.description}>
              <span className="eqm-syn-pastille-emoji">{s.emoji}</span>
              <span className="eqm-syn-pastille-nom">{s.nom}</span>
            </span>
          ))}
        </div>
      ) : (
        <p className="eqm-syn-vide-txt">Aucune synergie active. Combine les rôles pour en débloquer (le « ? » explique tout).</p>
      )}

      {/* Bouton déplier / replier */}
      <button className="eqm-syn-toggle" onClick={() => setDeplie((v) => !v)}>
        {deplie ? '▲ Masquer les autres' : `▼ Voir toutes les synergies (${inactives.length} à débloquer)`}
      </button>

      {/* Liste complète des inactives (dépliable) */}
      {deplie && (
        <div className="eqm-syn-liste">
          {inactives.map((s) => {
            const manque = manquePourSynergie(equipe, s.cle)
            return (
              <div key={s.cle} className="eqm-syn-carte inactive" style={{ '--c-syn': s.couleur }} title={s.description}>
                <span className="eqm-syn-emoji">{s.emoji}</span>
                <span className="eqm-syn-nom">{s.nom}</span>
                <span className="eqm-syn-desc">{s.description}</span>
                <span className="eqm-syn-manque">{manque}</span>
              </div>
            )
          })}
        </div>
      )}

      {popup && <PopupSynergies onFermer={() => setPopup(false)} />}
    </div>
  )
}

function IconeObjet({ id, classe = 'eqm-icone-objet' }) {
  const o = OBJETS[id]
  if (!o) return null
  if (o.sprite) {
    return <img src={o.sprite} alt={o.nom} className={classe} onError={(e) => { e.target.replaceWith(Object.assign(document.createElement('span'), { textContent: o.emoji })) }} />
  }
  return <span>{o.emoji}</span>
}

const ICONES_PIERRES = {
  'fire-stone': '/icons/fire-stone.png', 'water-stone': '/icons/water-stone.png',
  'thunder-stone': '/icons/thunder-stone.png', 'leaf-stone': '/icons/leaf-stone.png',
  'moon-stone': '/icons/moon-stone.png', 'sun-stone': '/icons/sun-stone.png',
  'shiny-stone': '/icons/shiny-stone.png', 'dusk-stone': '/icons/dusk-stone.png',
  'dawn-stone': '/icons/dawn-stone.png', 'ice-stone': '/icons/ice-stone.png',
}

const COULEURS_TYPE = {
  normal: '#9099a1', fire: '#ff9d55', water: '#4d90d5', electric: '#f4d23c',
  grass: '#63bb5b', ice: '#73cec0', fighting: '#ce4069', poison: '#ab6ac8',
  ground: '#d97746', flying: '#8fa8dd', psychic: '#fa7179', bug: '#90c12c',
  rock: '#c7b78b', ghost: '#5269ac', dragon: '#0b6dc3', dark: '#5a5366',
  steel: '#5a8ea1', fairy: '#ec8fe6',
}

function BarreStat({ label, valeur, pctMax, couleur }) {
  const pct = Math.max(8, Math.min(100, pctMax))
  return (
    <div className="eqm-stat-ligne">
      <span className="eqm-stat-label">{label}</span>
      <div className="eqm-stat-piste"><div className="eqm-stat-fill" style={{ width: `${pct}%`, background: couleur }}></div></div>
      <span className="eqm-stat-val">{valeur}</span>
    </div>
  )
}

function BarreIV({ label, valeur }) {
  const v = Math.max(0, Math.min(STAT_MAX_IV, valeur || 0))
  const pct = (v / STAT_MAX_IV) * 100
  const couleur = v >= 28 ? '#34d399' : v >= 20 ? '#a3e635' : v >= 12 ? '#fcd34d' : v >= 6 ? '#fb923c' : '#ef6868'
  return (
    <div className="eqm-iv-ligne">
      <span className="eqm-iv-label">{label}</span>
      <div className="eqm-iv-piste"><div className="eqm-iv-fill" style={{ width: `${Math.max(4, pct)}%`, background: couleur }}></div></div>
      <span className="eqm-iv-val">{v}/{STAT_MAX_IV}</span>
    </div>
  )
}

function Fiche({ pokemon, pierres, objets = {}, parchemins = {}, onEquiperObjet, onEvoluerPierre, onChoisirPassif, onChoisirCaseJoker, onAppliquerParchemin, onRetour }) {
  const [grilleOuverte, setGrilleOuverte] = useState(false)
  const iv = pokemon.iv || { pv: 0, attaque: 0, vitesse: 0, defense: 0 }
  const niv = pokemon.niveau || 1
  const requise = xpRequise(niv, XP_BASE_NIVEAU)
  const xp = pokemon.xp || 0
  const pourcentageXP = Math.min(100, (xp / requise) * 100)

  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]
  const types = pokemon.types || []

  const joker = estJoker(pokemon)
  const caseActuelle = roleEffectif(pokemon)
  const passifsChoix = passifsDuRole(role)
  const passifParModeActuel = {
    principal: passifPourMode(pokemon, 'principal'),
    arene: passifPourMode(pokemon, 'arene'),
    pvp: passifPourMode(pokemon, 'pvp'),
  }

  const pvMax = pokemon.pvMax ?? 0
  const attaque = pokemon.attaque ?? 0
  const vitesse = pokemon.vitesse ?? 0
  const defense = pokemon.defense ?? 0
  const statMax = Math.max(pvMax, attaque, vitesse, defense, 1)

  const objetEquipe = pokemon.objetEquipe && OBJETS[pokemon.objetEquipe] ? OBJETS[pokemon.objetEquipe] : null
  const objetsDispo = Object.entries(objets).filter(([id, n]) => n > 0 && id !== pokemon.objetEquipe && OBJETS[id])
  const evosPierre = (pokemon.evolutionsPierre || []).filter((e) => (pierres[e.pierre] || 0) > 0)

  return (
    <div className="eqm-fiche">
      <button className="eqm-retour" onClick={onRetour}>← Retour</button>

      <div className="eqm-fiche-entete">
        <div className="eqm-fiche-sprite-cadre">
          <SpritePoke poke={pokemon} classe="eqm-fiche-sprite" />
          {pokemon.shiny && <span className="eqm-fiche-shiny">✨</span>}
        </div>
        <div className="eqm-fiche-identite">
          <div className="eqm-fiche-nom-ligne">
            <span className="eqm-fiche-nom">{pokemon.nom}</span>
            <span className="eqm-fiche-niv">N.{niv}</span>
          </div>
          <span className="eqm-fiche-num">N°{String(pokemon.id).padStart(3, '0')}</span>
          <div className="eqm-fiche-types">
            {types.map((t) => (
              <span key={t} className="eqm-type-badge" style={{ background: COULEURS_TYPE[t] || '#777' }}>{t}</span>
            ))}
          </div>
          {infoRole && (
            <span className="eqm-fiche-role" style={{ color: infoRole.couleur }}>{infoRole.emoji} {infoRole.nom}</span>
          )}
        </div>
      </div>

      {(() => {
        const possedes = Object.entries(PARCHEMINS).filter(([cle]) => (parchemins[cle] || 0) > 0)
        if (possedes.length === 0) return null
        const roleActuel = pokemon.roleForce || pokemon.role
        return (
          <div className="eqm-section">
            <div className="eqm-section-titre">📜 Changer le rôle (parchemin)</div>
            <div className="eqm-parchemins-grille">
              {possedes.map(([cle, info]) => {
                const dejaCeRole = roleActuel === info.role
                return (
                  <button key={cle} className="eqm-parchemin-btn" disabled={dejaCeRole}
                    title={dejaCeRole ? `Déjà ${ROLES[info.role]?.nom}` : info.description}
                    onClick={() => { if (onAppliquerParchemin) onAppliquerParchemin(pokemon.uid, cle) }}
                    style={{ '--c-role': ROLES[info.role]?.couleur || '#888' }}>
                    <span className="eqm-parchemin-emoji">{info.emoji}</span>
                    <span className="eqm-parchemin-nom">{ROLES[info.role]?.nom || info.role}</span>
                    <span className="eqm-parchemin-stock">×{parchemins[cle]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {joker && (
        <div className="eqm-section">
          <div className="eqm-section-titre">🃏 Case du Joker (rôle joué en combat)</div>
          <div className="eqm-joker-grille">
            {CASES_JOKER.map((cle) => {
              const info = ROLES[cle]
              const actif = cle === caseActuelle
              return (
                <button key={cle} className={`eqm-joker-btn ${actif ? 'actif' : ''}`}
                  onClick={() => { if (!actif && onChoisirCaseJoker) onChoisirCaseJoker(pokemon.uid, cle) }}
                  title={`Faire jouer ce Joker comme ${info.nom}`}
                  style={{ '--c-role': info.couleur }}>
                  <span className="eqm-joker-emoji">{info.emoji}</span>
                  <span className="eqm-joker-nom">{info.nom}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {passifsChoix.length > 0 && (
        <div className="eqm-section">
          <div className="eqm-section-titre">
            ✨ Passifs {infoRole ? `— ${infoRole.nom}` : ''}
            {joker && <span className="eqm-passif-note"> (Joker : tous les passifs)</span>}
          </div>
          <p className="eqm-passif-aide">Choisis un passif par mode de jeu :</p>
          <div className="eqm-passif-modes">
            {[
              { mode: 'principal', label: '🗺️ Principal' },
              { mode: 'arene', label: '⚔️ Arène' },
              { mode: 'pvp', label: '🥊 PvP' },
            ].map(({ mode, label }) => (
              <div key={mode} className="eqm-passif-col">
                <div className="eqm-passif-col-titre">{label}</div>
                <div className="eqm-passif-liste">
                  {passifsChoix.map((p) => {
                    const actif = p.cle === passifParModeActuel[mode]
                    return (
                      <button key={p.cle} className={`eqm-passif-carte ${actif ? 'actif' : ''}`}
                        onClick={() => { if (!actif && onChoisirPassif) onChoisirPassif(pokemon.uid, p.cle, mode) }}
                        title={p.description}
                        style={infoRole ? { '--c-role': infoRole.couleur } : undefined}>
                        <span className="eqm-passif-nom">{p.emoji} {p.nom}</span>
                        {actif && <span className="eqm-passif-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="eqm-passif-legende">
            {passifsChoix.map((p) => (
              <div key={p.cle} className="eqm-passif-legende-ligne">
                <span className="eqm-passif-legende-nom">{p.emoji} {p.nom}</span>
                <span className="eqm-passif-legende-desc">{p.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="eqm-section eqm-xp">
        <div className="eqm-xp-label">XP {xp} / {requise}</div>
        <div className="eqm-xp-piste"><div className="eqm-xp-fill" style={{ width: `${pourcentageXP}%` }}></div></div>
      </div>

      <div className="eqm-section eqm-stats">
        <BarreStat label="PV" valeur={pvMax} pctMax={(pvMax / statMax) * 100} couleur="#34d399" />
        <BarreStat label="ATT" valeur={attaque} pctMax={(attaque / statMax) * 100} couleur="#fb923c" />
        <BarreStat label="VIT" valeur={vitesse} pctMax={(vitesse / statMax) * 100} couleur="#60a5fa" />
        <BarreStat label="DÉF" valeur={defense} pctMax={(defense / statMax) * 100} couleur="#a78bfa" />
      </div>

      {(() => {
        const total = (iv.pv || 0) + (iv.attaque || 0) + (iv.vitesse || 0) + (iv.defense || 0)
        const pctQualite = Math.round((total / (STAT_MAX_IV * 4)) * 100)
        const couleurQualite = pctQualite >= 80 ? '#34d399' : pctQualite >= 55 ? '#fcd34d' : pctQualite >= 30 ? '#fb923c' : '#ef6868'
        return (
          <div className="eqm-section eqm-iv">
            <div className="eqm-iv-haut">
              <span className="eqm-section-titre">Potentiel (IV)</span>
              <span className="eqm-iv-total" style={{ color: couleurQualite }}>{total}/{STAT_MAX_IV * 4} · {pctQualite}%</span>
            </div>
            <BarreIV label="PV" valeur={iv.pv} />
            <BarreIV label="ATT" valeur={iv.attaque} />
            <BarreIV label="VIT" valeur={iv.vitesse} />
            <BarreIV label="DÉF" valeur={iv.defense} />
          </div>
        )
      })()}

      <div className="eqm-section eqm-objet">
        <div className="eqm-section-titre">⚙️ Objet équipé</div>
        <div className="eqm-objet-zone">
          <button className={`eqm-objet-slot ${objetEquipe ? 'rempli' : 'vide'}`}
            onClick={() => setGrilleOuverte((v) => !v)}
            title={objetEquipe ? 'Changer / retirer' : 'Équiper un objet'}>
            {objetEquipe ? <IconeObjet id={pokemon.objetEquipe} classe="eqm-objet-slot-img" /> : <span className="eqm-objet-plus">+</span>}
          </button>
          <div className="eqm-objet-txt">
            {objetEquipe ? (
              <>
                <span className="eqm-objet-nom">{objetEquipe.nom}</span>
                <span className="eqm-objet-effet">{objetEquipe.desc}</span>
                <button className="eqm-objet-retirer" onClick={() => onEquiperObjet(pokemon.uid, null)}>Retirer</button>
              </>
            ) : (
              <span className="eqm-objet-vide-txt">Aucun objet — clique le slot pour en équiper un</span>
            )}
          </div>
        </div>
        {grilleOuverte && (
          <div className="eqm-objets-grille">
            {objetsDispo.length > 0 ? (
              objetsDispo.map(([id, n]) => (
                <button key={id} className="eqm-objet-case"
                  onClick={() => { onEquiperObjet(pokemon.uid, id); setGrilleOuverte(false) }}
                  title={`${OBJETS[id].nom} — ${OBJETS[id].desc}`}>
                  <IconeObjet id={id} classe="eqm-objet-case-img" />
                  <span className="eqm-objet-case-nom">{OBJETS[id].nom}</span>
                  <span className="eqm-objet-case-stock">×{n}</span>
                </button>
              ))
            ) : (
              <p className="eqm-objet-vide-txt">Aucun objet disponible dans ton sac.</p>
            )}
          </div>
        )}
      </div>

      {evosPierre.length > 0 && (
        <div className="eqm-section eqm-pierres">
          <div className="eqm-section-titre">💎 Évolution par pierre</div>
          {evosPierre.map((e) => {
            const infoPierre = PIERRES[e.pierre]
            return (
              <button key={e.pierre} className="eqm-pierre-btn"
                onClick={() => onEvoluerPierre(pokemon.uid, e.evolueEn, e.pierre)}
                title={`Utiliser une ${infoPierre ? infoPierre.nom : e.pierre}`}>
                {ICONES_PIERRES[e.pierre] ? <img src={ICONES_PIERRES[e.pierre]} alt="" className="eqm-pierre-img" /> : (infoPierre ? infoPierre.emoji : '💎')} → {e.evolueEn} (x{pierres[e.pierre] || 0})
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Equipe({ equipe, collection, pierres = {}, objets = {}, parchemins = {}, onEquiperObjet, onEvoluerPierre, onChoisirPassif, onChoisirCaseJoker, onAppliquerParchemin, onAjouterMembre, onRetirerMembre, onAutoEquipe, onFermer }) {
  const [selection, setSelection] = useState(null)
  const [ajoutEnCours, setAjoutEnCours] = useState(false)
  const [tri, setTri] = useState('numero')
  const [typeFiltre, setTypeFiltre] = useState('tous')
  const [roleFiltre, setRoleFiltre] = useState('tous')
  const [recherche, setRecherche] = useState('')
  const [shinyOnly, setShinyOnly] = useState(false)

  const uidsEquipe = equipe.map((p) => p.uid)
  const famillesEquipe = equipe.map((p) => p.familleId).filter((f) => f != null)
  const NB_SLOTS = 6
  const slotsVides = NB_SLOTS - equipe.length
  const typesDispo = ['tous', ...Array.from(new Set(collection.flatMap((p) => p.types || []))).sort()]

  function trierFiltrer(liste) {
    let resultat = [...liste]
    if (recherche.trim() !== '') {
      const q = recherche.trim().toLowerCase()
      resultat = resultat.filter((p) => (p.nom || '').toLowerCase().includes(q))
    }
    if (shinyOnly) resultat = resultat.filter((p) => p.shiny)
    if (typeFiltre !== 'tous') resultat = resultat.filter((p) => (p.types || []).includes(typeFiltre))
    if (roleFiltre !== 'tous') resultat = resultat.filter((p) => (p.role || determinerRole(p)) === roleFiltre)
    if (tri === 'numero') resultat.sort((a, b) => a.id - b.id)
    else if (tri === 'niveau') resultat.sort((a, b) => (b.niveau || 1) - (a.niveau || 1))
    else if (tri === 'nom') resultat.sort((a, b) => a.nom.localeCompare(b.nom))
    else if (tri === 'rarete') {
      const ordreRarete = { legendaire: 4, tresRare: 3, rare: 2, commun: 1 }
      resultat.sort((a, b) => (ordreRarete[b.rarete] || 0) - (ordreRarete[a.rarete] || 0))
    }
    return resultat
  }

  const barreTriFiltre = (
    <div className="eqm-outils" onClick={(e) => e.stopPropagation()}>
      <input type="text" className="eqm-recherche" placeholder="🔍 Rechercher..."
        value={recherche} onChange={(e) => setRecherche(e.target.value)} onClick={(e) => e.stopPropagation()} />
      <div className="eqm-filtres">
        <select className="eqm-select" value={tri} onChange={(e) => setTri(e.target.value)} onClick={(e) => e.stopPropagation()}>
          <option value="numero">Tri : N°</option>
          <option value="niveau">Tri : Niveau</option>
          <option value="nom">Tri : Nom</option>
          <option value="rarete">Tri : Rareté</option>
        </select>
        <select className="eqm-select" value={typeFiltre} onChange={(e) => setTypeFiltre(e.target.value)} onClick={(e) => e.stopPropagation()}>
          {typesDispo.map((t) => (<option key={t} value={t}>{t === 'tous' ? 'Type : tous' : `Type : ${t}`}</option>))}
        </select>
        <select className="eqm-select" value={roleFiltre} onChange={(e) => setRoleFiltre(e.target.value)} onClick={(e) => e.stopPropagation()}>
          <option value="tous">Rôle : tous</option>
          {Object.entries(ROLES).map(([cle, info]) => (<option key={cle} value={cle}>{info.emoji} {info.nom}</option>))}
        </select>
        <button className={`eqm-shiny-toggle ${shinyOnly ? 'actif' : ''}`}
          onClick={(e) => { e.stopPropagation(); setShinyOnly((v) => !v) }} title="Afficher seulement les shinies">✨ Shiny</button>
      </div>
    </div>
  )

  function CartePoke({ poke, onClick, retirable, indexRetrait }) {
    const role = poke.role || determinerRole(poke)
    const infoRole = ROLES[role]
    return (
      <div className={`eqm-carte ${poke.shiny ? 'shiny' : ''}`} style={infoRole ? { '--c-role': infoRole.couleur } : undefined}>
        {poke.shiny && <span className="eqm-carte-shiny">✨</span>}
        <BadgeRole pokemon={poke} />
        <button className="eqm-carte-corps" onClick={onClick}>
          <div className="eqm-carte-sprite-zone"><SpritePoke poke={poke} classe="eqm-sprite" /></div>
          <span className="eqm-carte-nom">{poke.nom}</span>
          <span className="eqm-carte-niv">N.{poke.niveau || 1}</span>
        </button>
        {retirable && (
          <button className="eqm-carte-retirer" onClick={() => onRetirerMembre(indexRetrait)}>Retirer</button>
        )}
      </div>
    )
  }

  if (ajoutEnCours) {
    const dispoBrut = collection.filter((p) => !uidsEquipe.includes(p.uid) && !famillesEquipe.includes(p.familleId))
    const dispo = trierFiltrer(dispoBrut)
    return (
      <div className="overlay" onClick={onFermer}>
        <div className="eqm-panneau" onClick={(e) => e.stopPropagation()}>
          <div className="eqm-entete">
            <h2>Ajouter à l'équipe</h2>
            <button className="eqm-fermer" onClick={() => setAjoutEnCours(false)}>✕</button>
          </div>
          <IndicateurCompo equipe={equipe} />
          {barreTriFiltre}
          <div className="eqm-grille">
            {dispo.length === 0 ? (
              <p className="eqm-vide">Aucun Pokémon disponible (vérifie les filtres).</p>
            ) : (
              dispo.map((poke) => (
                <CartePoke key={poke.uid} poke={poke} onClick={() => { onAjouterMembre(poke); setAjoutEnCours(false) }} />
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  if (selection) {
    const pokemonAJour = collection.find((p) => p.uid === selection.uid) || selection
    return (
      <div className="overlay" onClick={onFermer}>
        <div className="eqm-panneau" onClick={(e) => e.stopPropagation()}>
          <div className="eqm-entete">
            <h2>Détails</h2>
            <button className="eqm-fermer" onClick={onFermer}>✕</button>
          </div>
          <Fiche pokemon={pokemonAJour} pierres={pierres} objets={objets} parchemins={parchemins}
            onEquiperObjet={onEquiperObjet} onEvoluerPierre={onEvoluerPierre} onChoisirPassif={onChoisirPassif}
            onChoisirCaseJoker={onChoisirCaseJoker} onAppliquerParchemin={onAppliquerParchemin}
            onRetour={() => setSelection(null)} />
        </div>
      </div>
    )
  }

  const collectionAffichee = trierFiltrer(collection)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="eqm-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="eqm-entete">
          <h2>Mon équipe ({equipe.length}/{NB_SLOTS})</h2>
          <button className="eqm-fermer" onClick={onFermer}>✕</button>
        </div>

        <IndicateurCompo equipe={equipe} />
        <IndicateurSynergies equipe={equipe} />
        <p className="eqm-aide">Les changements s'appliquent au prochain combat. Règle : 1 à 2 Pokémon par rôle, les 4 rôles présents · 1 spécial max.</p>
        {onAutoEquipe && (
          <button className="eqm-auto" onClick={onAutoEquipe}>⚡ Auto-équipe (compo idéale)</button>
        )}

        <div className="eqm-grille eqm-grille-equipe">
          {equipe.map((poke, i) => (
            <CartePoke key={poke.uid} poke={poke} onClick={() => setSelection(poke)} retirable={equipe.length > 1} indexRetrait={i} />
          ))}
          {Array.from({ length: slotsVides }).map((_, i) => (
            <button key={`vide-${i}`} className="eqm-carte eqm-slot-vide" onClick={() => setAjoutEnCours(true)}>
              <span className="eqm-slot-plus">+</span>
              <span className="eqm-carte-nom">Ajouter</span>
            </button>
          ))}
        </div>

        <h3 className="eqm-collection-titre">📦 Collection ({collectionAffichee.length})</h3>
        {barreTriFiltre}
        <div className="eqm-grille">
          {collectionAffichee.length === 0 ? (
            <p className="eqm-vide">Aucun Pokémon ne correspond (vérifie les filtres).</p>
          ) : (
            collectionAffichee.map((poke) => (
              <CartePoke key={poke.uid} poke={poke} onClick={() => setSelection(poke)} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function equipePropsEgales(prev, next) {
  if (prev.collection !== next.collection) return false
  if (prev.equipe !== next.equipe) return false
  if (prev.pierres !== next.pierres) return false
  if (prev.objets !== next.objets) return false
  if (prev.parchemins !== next.parchemins) return false
  return true
}

export default memo(Equipe, equipePropsEgales)