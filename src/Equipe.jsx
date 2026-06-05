import { useState } from 'react'
import { xpRequise, STAT_MAX_IV } from './stats'
import { XP_BASE_NIVEAU, PIERRES } from './config'
import { ROLES, determinerRole, passifDe, passifEffectif, passifsDuRole, passifPourMode, compterRoles, compterSpeciaux, compositionValide, COMPOSITION_REQUISE, MIN_PAR_ROLE, MAX_PAR_ROLE, MAX_SPECIAL, estJoker, roleEffectif, CASES_JOKER } from './roles'
import { OBJETS } from './objets'
import { PARCHEMINS } from './parchemins'

// Affiche le sprite officiel d'un objet (fallback emoji si l'image échoue).
function IconeObjet({ id, classe = 'icone-objet' }) {
  const o = OBJETS[id]
  if (!o) return null
  if (o.sprite) {
    return <img src={o.sprite} alt={o.nom} className={classe} onError={(e) => { e.target.replaceWith(Object.assign(document.createElement('span'), { textContent: o.emoji })) }} />
  }
  return <span>{o.emoji}</span>
}

// Petit badge de rôle (emoji) à afficher dans un coin d'une carte.
function BadgeRole({ pokemon }) {
  const role = pokemon.role || determinerRole(pokemon)
  const info = ROLES[role]
  if (!info) return null
  return <span className="badge-role" title={info.nom}>{info.emoji}</span>
}

// Indicateur de composition d'équipe : montre combien de chaque rôle, et si c'est valide.
// Règle souple : 1 à 2 par rôle (chaque rôle présent), + 1 spécial max.
function IndicateurCompo({ equipe }) {
  const compte = compterRoles(equipe)
  const valide = compositionValide(equipe)
  const nbSpeciaux = compterSpeciaux(equipe)
  const ordre = ['tank', 'eclaireur', 'soutien', 'dps']
  return (
    <div className={`compo-indicateur ${valide ? 'compo-ok' : 'compo-ko'}`}>
      <div className="compo-titre">
        {valide
          ? '✓ Composition valide — prête au combat'
          : `Compo : 1 à 2 par rôle (chaque rôle présent) · ${MAX_SPECIAL} spécial max`}
      </div>
      <div className="compo-roles">
        {ordre.map((role) => {
          const info = ROLES[role]
          const actuel = compte[role]
          const ok = actuel >= MIN_PAR_ROLE && actuel <= MAX_PAR_ROLE
          return (
            <span key={role} className={`compo-role ${ok ? 'role-ok' : 'role-ko'}`} style={{ borderColor: info.couleur }}>
              <span className="compo-role-emoji">{info.emoji}</span>
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

const ICONES_PIERRES = {
  'fire-stone': '/icons/fire-stone.png',
  'water-stone': '/icons/water-stone.png',
  'thunder-stone': '/icons/thunder-stone.png',
  'leaf-stone': '/icons/leaf-stone.png',
  'moon-stone': '/icons/moon-stone.png',
  'sun-stone': '/icons/sun-stone.png',
  'shiny-stone': '/icons/shiny-stone.png',
  'dusk-stone': '/icons/dusk-stone.png',
  'dawn-stone': '/icons/dawn-stone.png',
  'ice-stone': '/icons/ice-stone.png',
}

// Couleurs par type Pokémon (pour les badges).
const COULEURS_TYPE = {
  normal: '#9099a1', fire: '#ff9d55', water: '#4d90d5', electric: '#f4d23c',
  grass: '#63bb5b', ice: '#73cec0', fighting: '#ce4069', poison: '#ab6ac8',
  ground: '#d97746', flying: '#8fa8dd', psychic: '#fa7179', bug: '#90c12c',
  rock: '#c7b78b', ghost: '#5269ac', dragon: '#0b6dc3', dark: '#5a5366',
  steel: '#5a8ea1', fairy: '#ec8fe6',
}

// Une barre de stat visuelle.
function BarreStat({ label, valeur, pctMax, couleur }) {
  const pct = Math.max(8, Math.min(100, pctMax))
  return (
    <div className="stat-barre-ligne">
      <span className="stat-barre-label">{label}</span>
      <div className="stat-barre-piste">
        <div className="stat-barre-fill" style={{ width: `${pct}%`, background: couleur }}></div>
      </div>
      <span className="stat-barre-val">{valeur}</span>
    </div>
  )
}

// Une barre d'IV (sur STAT_MAX_IV = 31). Couleur selon la qualité de l'IV.
function BarreIV({ label, valeur }) {
  const v = Math.max(0, Math.min(STAT_MAX_IV, valeur || 0))
  const pct = (v / STAT_MAX_IV) * 100
  const couleur =
    v >= 28 ? '#5fbf60' :
    v >= 20 ? '#a4d24a' :
    v >= 12 ? '#f0c040' :
    v >= 6 ? '#f0a020' : '#e06060'
  return (
    <div className="iv-barre-ligne">
      <span className="iv-barre-label">{label}</span>
      <div className="iv-barre-piste">
        <div className="iv-barre-fill" style={{ width: `${Math.max(4, pct)}%`, background: couleur }}></div>
      </div>
      <span className="iv-barre-val">{v}/{STAT_MAX_IV}</span>
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

  // Rôle + passif.
  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]
  const types = pokemon.types || []

  // Joker : peut choisir sa CASE (le rôle qu'il occupe en combat).
  const joker = estJoker(pokemon)
  const caseActuelle = roleEffectif(pokemon) // la case occupée (tank/eclaireur/soutien/dps)

  // Choix de passif : les passifs proposés (3 du rôle, ou les 9 pour un Joker).
  const passifsChoix = passifsDuRole(role)
  // Passif effectif PAR MODE (Principal / Arène / PvP). On lit le champ dédié de chaque mode.
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

  const evosPierre = (pokemon.evolutionsPierre || []).filter(
    (e) => (pierres[e.pierre] || 0) > 0
  )

  return (
    <div className="fiche-v2">
      <button className="bouton-retour" onClick={onRetour}>← Retour</button>

      <div className="fiche-entete">
        <div className="fiche-sprite-cadre">
          <img src={pokemon.sprite} alt={pokemon.nom} className="fiche-sprite-v2" />
          {pokemon.shiny && <span className="fiche-shiny-badge">✨</span>}
        </div>
        <div className="fiche-identite">
          <div className="fiche-nom-ligne">
            <span className="fiche-nom-v2">{pokemon.nom}</span>
            <span className="fiche-niv-badge">N.{niv}</span>
          </div>
          <span className="fiche-num-v2">N°{String(pokemon.id).padStart(3, '0')}</span>
          <div className="fiche-types">
            {types.map((t) => (
              <span key={t} className="fiche-type-badge" style={{ background: COULEURS_TYPE[t] || '#777' }}>
                {t}
              </span>
            ))}
          </div>
          {infoRole && (
            <span className="fiche-role-v2" style={{ color: infoRole.couleur }}>
              {infoRole.emoji} {infoRole.nom}
            </span>
          )}
        </div>
      </div>

      {/* Changer le rôle via un PARCHEMIN (objet endgame). N'affiche que les parchemins possédés. */}
      {(() => {
        const possedes = Object.entries(PARCHEMINS).filter(([cle]) => (parchemins[cle] || 0) > 0)
        if (possedes.length === 0) return null
        const roleActuel = pokemon.roleForce || pokemon.role
        return (
          <div className="fiche-parchemins">
            <div className="fiche-objet-titre-v2">📜 Changer le rôle (parchemin)</div>
            <div className="fiche-parchemins-grille">
              {possedes.map(([cle, info]) => {
                const dejaCeRole = roleActuel === info.role
                return (
                  <button
                    key={cle}
                    className="fiche-parchemin-btn"
                    disabled={dejaCeRole}
                    title={dejaCeRole ? `Déjà ${ROLES[info.role]?.nom}` : info.description}
                    onClick={() => { if (onAppliquerParchemin) onAppliquerParchemin(pokemon.uid, cle) }}
                    style={{ borderColor: ROLES[info.role]?.couleur || '#888' }}
                  >
                    <span className="fiche-parchemin-emoji">{info.emoji}</span>
                    <span className="fiche-parchemin-nom">{ROLES[info.role]?.nom || info.role}</span>
                    <span className="fiche-parchemin-stock">×{parchemins[cle]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {/* Choix de la CASE du Joker (uniquement pour les Jokers) : 4 boutons de rôle */}
      {joker && (
        <div className="fiche-joker-case">
          <div className="fiche-objet-titre-v2">🃏 Case du Joker (rôle joué en combat)</div>
          <div className="joker-case-grille">
            {CASES_JOKER.map((cle) => {
              const info = ROLES[cle]
              const actif = cle === caseActuelle
              return (
                <button
                  key={cle}
                  className={`joker-case-btn ${actif ? 'actif' : ''}`}
                  onClick={() => { if (!actif && onChoisirCaseJoker) onChoisirCaseJoker(pokemon.uid, cle) }}
                  title={`Faire jouer ce Joker comme ${info.nom}`}
                  style={{ borderColor: actif ? info.couleur : 'transparent' }}
                >
                  <span className="joker-case-emoji">{info.emoji}</span>
                  <span className="joker-case-nom">{info.nom}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Choix du passif PAR MODE : 3 colonnes (Principal / Arène / PvP).
          Chaque mode garde son propre passif → on peut optimiser différemment selon le contexte. */}
      {passifsChoix.length > 0 && (
        <div className="fiche-passif-choix fiche-passif-modes">
          <div className="fiche-objet-titre-v2">
            ✨ Passifs {infoRole ? `— ${infoRole.nom}` : ''}
            {joker && <span className="passif-joker-note"> (Joker : tous les passifs disponibles)</span>}
          </div>
          <p className="passif-modes-aide">Choisis un passif par mode de jeu :</p>
          <div className="passif-modes-grille">
            {[
              { mode: 'principal', label: '🗺️ Principal' },
              { mode: 'arene', label: '⚔️ Arène' },
              { mode: 'pvp', label: '🥊 PvP' },
            ].map(({ mode, label }) => (
              <div key={mode} className="passif-mode-colonne">
                <div className="passif-mode-titre">{label}</div>
                <div className="passif-mode-liste">
                  {passifsChoix.map((p) => {
                    const actif = p.cle === passifParModeActuel[mode]
                    return (
                      <button
                        key={p.cle}
                        className={`passif-mode-carte ${actif ? 'actif' : ''}`}
                        onClick={() => { if (!actif && onChoisirPassif) onChoisirPassif(pokemon.uid, p.cle, mode) }}
                        title={p.description}
                        style={infoRole ? { borderColor: actif ? infoRole.couleur : 'transparent' } : undefined}
                      >
                        <span className="passif-mode-nom">{p.emoji} {p.nom}</span>
                        {actif && <span className="passif-mode-check">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* Légende : descriptions des passifs proposés (une fois, sous les colonnes). */}
          <div className="passif-modes-legende">
            {passifsChoix.map((p) => (
              <div key={p.cle} className="passif-legende-ligne">
                <span className="passif-legende-nom">{p.emoji} {p.nom}</span>
                <span className="passif-legende-desc">{p.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="fiche-xp-v2">
        <div className="fiche-xp-label-v2">XP {xp} / {requise}</div>
        <div className="barre-xp grande">
          <div className="barre-xp-remplissage" style={{ width: `${pourcentageXP}%` }}></div>
        </div>
      </div>

      <div className="fiche-stats-v2">
        <BarreStat label="PV" valeur={pvMax} pctMax={(pvMax / statMax) * 100} couleur="#5fbf60" />
        <BarreStat label="ATT" valeur={attaque} pctMax={(attaque / statMax) * 100} couleur="#f0a020" />
        <BarreStat label="VIT" valeur={vitesse} pctMax={(vitesse / statMax) * 100} couleur="#50a0e0" />
        <BarreStat label="DÉF" valeur={defense} pctMax={(defense / statMax) * 100} couleur="#c060c0" />
      </div>

      {/* 4 barres d'IV distinctes (PV / ATT / VIT / DÉF), chacune sur 31. */}
      {(() => {
        const total = (iv.pv || 0) + (iv.attaque || 0) + (iv.vitesse || 0) + (iv.defense || 0)
        const pctQualite = Math.round((total / (STAT_MAX_IV * 4)) * 100)
        const couleurQualite =
          pctQualite >= 80 ? '#5fbf60' :
          pctQualite >= 55 ? '#f0c040' :
          pctQualite >= 30 ? '#f0a020' : '#e06060'
        return (
          <div className="fiche-iv-detail">
            <div className="fiche-iv-detail-haut">
              <span className="fiche-iv-detail-titre">Potentiel (IV)</span>
              <span className="fiche-iv-detail-total" style={{ color: couleurQualite }}>
                {total}/{STAT_MAX_IV * 4} · {pctQualite}%
              </span>
            </div>
            <BarreIV label="PV" valeur={iv.pv} />
            <BarreIV label="ATT" valeur={iv.attaque} />
            <BarreIV label="VIT" valeur={iv.vitesse} />
            <BarreIV label="DÉF" valeur={iv.defense} />
          </div>
        )
      })()}

      <div className="fiche-objet-v2">
        <div className="fiche-objet-titre-v2">⚙️ Objet équipé</div>
        <div className="fiche-objet-slot-zone">
          <button
            className={`fiche-objet-slot ${objetEquipe ? 'rempli' : 'vide'}`}
            onClick={() => setGrilleOuverte((v) => !v)}
            title={objetEquipe ? 'Changer / retirer l\'objet' : 'Équiper un objet'}
          >
            {objetEquipe
              ? <IconeObjet id={pokemon.objetEquipe} classe="fiche-objet-slot-img" />
              : <span className="fiche-objet-slot-plus">+</span>}
          </button>
          <div className="fiche-objet-slot-txt">
            {objetEquipe ? (
              <>
                <span className="fiche-objet-nom">{objetEquipe.nom}</span>
                <span className="fiche-objet-effet-v2">{objetEquipe.desc}</span>
                <button className="bouton-retirer-objet-v2" onClick={() => onEquiperObjet(pokemon.uid, null)}>
                  Retirer
                </button>
              </>
            ) : (
              <span className="fiche-objet-vide-v2">Aucun objet — clique le slot pour en équiper un</span>
            )}
          </div>
        </div>

        {grilleOuverte && (
          <div className="fiche-objets-grille">
            {objetsDispo.length > 0 ? (
              objetsDispo.map(([id, n]) => (
                <button
                  key={id}
                  className="fiche-objet-case"
                  onClick={() => { onEquiperObjet(pokemon.uid, id); setGrilleOuverte(false) }}
                  title={`${OBJETS[id].nom} — ${OBJETS[id].desc}`}
                >
                  <IconeObjet id={id} classe="fiche-objet-case-img" />
                  <span className="fiche-objet-case-nom">{OBJETS[id].nom}</span>
                  <span className="fiche-objet-case-stock">×{n}</span>
                </button>
              ))
            ) : (
              <p className="fiche-objet-vide-v2">Aucun objet disponible dans ton sac.</p>
            )}
          </div>
        )}
      </div>

      {evosPierre.length > 0 && (
        <div className="fiche-pierres-v2">
          <div className="fiche-objet-titre-v2">💎 Évolution par pierre</div>
          {evosPierre.map((e) => {
            const infoPierre = PIERRES[e.pierre]
            return (
              <button
                key={e.pierre}
                className="bouton-pierre"
                onClick={() => onEvoluerPierre(pokemon.uid, e.evolueEn, e.pierre)}
                title={`Utiliser une ${infoPierre ? infoPierre.nom : e.pierre}`}
              >
                {ICONES_PIERRES[e.pierre] ? <img src={ICONES_PIERRES[e.pierre]} alt="" className="bouton-pierre-img" /> : (infoPierre ? infoPierre.emoji : '💎')} → {e.evolueEn} (x{pierres[e.pierre] || 0})
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
    if (shinyOnly) {
      resultat = resultat.filter((p) => p.shiny)
    }
    if (typeFiltre !== 'tous') {
      resultat = resultat.filter((p) => (p.types || []).includes(typeFiltre))
    }
    if (roleFiltre !== 'tous') {
      resultat = resultat.filter((p) => (p.role || determinerRole(p)) === roleFiltre)
    }
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
    <div className="banc-outils" onClick={(e) => e.stopPropagation()}>
      <input
        type="text"
        className="banc-recherche"
        placeholder="🔍 Rechercher..."
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="tri-filtre">
        <select className="tri-select" value={tri} onChange={(e) => setTri(e.target.value)} onClick={(e) => e.stopPropagation()}>
          <option value="numero">Tri : N°</option>
          <option value="niveau">Tri : Niveau</option>
          <option value="nom">Tri : Nom</option>
          <option value="rarete">Tri : Rareté</option>
        </select>
        <select className="tri-select" value={typeFiltre} onChange={(e) => setTypeFiltre(e.target.value)} onClick={(e) => e.stopPropagation()}>
          {typesDispo.map((t) => (
            <option key={t} value={t}>{t === 'tous' ? 'Type : tous' : `Type : ${t}`}</option>
          ))}
        </select>
        <select className="tri-select" value={roleFiltre} onChange={(e) => setRoleFiltre(e.target.value)} onClick={(e) => e.stopPropagation()}>
          <option value="tous">Rôle : tous</option>
          {Object.entries(ROLES).map(([cle, info]) => (
            <option key={cle} value={cle}>{info.emoji} {info.nom}</option>
          ))}
        </select>
        <button
          className={`tri-toggle ${shinyOnly ? 'actif' : ''}`}
          onClick={(e) => { e.stopPropagation(); setShinyOnly((v) => !v) }}
          title="Afficher seulement les shinies"
        >✨ Shiny</button>
      </div>
    </div>
  )

  if (ajoutEnCours) {
    const dispoBrut = collection.filter(
      (p) => !uidsEquipe.includes(p.uid) && !famillesEquipe.includes(p.familleId)
    )
    const dispo = trierFiltrer(dispoBrut)
    return (
      <div className="overlay" onClick={onFermer}>
        <div className="panneau-banc panneau-equipe-doree equipe-v2" onClick={(e) => e.stopPropagation()}>
          <div className="pokedex-entete">
            <h2>Ajouter à l'équipe</h2>
            <button className="bouton-fermer" onClick={() => setAjoutEnCours(false)}>✕</button>
          </div>
          <IndicateurCompo equipe={equipe} />
          {barreTriFiltre}
          <div className="banc-grille">
            {dispo.length === 0 ? (
              <p className="banc-vide">Aucun Pokémon disponible (vérifie les filtres).</p>
            ) : (
              dispo.map((poke) => (
                <button
                  key={poke.uid}
                  className="banc-carte cliquable"
                  onClick={() => {
                    onAjouterMembre(poke)
                    setAjoutEnCours(false)
                  }}
                >
                  {poke.shiny && <span className="banc-shiny-mark">✨</span>}
                  <BadgeRole pokemon={poke} />
                  <img src={poke.sprite} alt={poke.nom} className="banc-sprite" loading="lazy" />
                  <span className="banc-nom">{poke.nom}</span>
                  <span className="banc-iv">N.{poke.niveau || 1}</span>
                </button>
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
        <div className="panneau-banc panneau-equipe-doree equipe-v2" onClick={(e) => e.stopPropagation()}>
          <div className="pokedex-entete">
            <h2>Détails</h2>
            <button className="bouton-fermer" onClick={onFermer}>✕</button>
          </div>
          <Fiche
            pokemon={pokemonAJour}
            pierres={pierres}
            objets={objets}
            parchemins={parchemins}
            onEquiperObjet={onEquiperObjet}
            onEvoluerPierre={onEvoluerPierre}
            onChoisirPassif={onChoisirPassif}
            onChoisirCaseJoker={onChoisirCaseJoker}
            onAppliquerParchemin={onAppliquerParchemin}
            onRetour={() => setSelection(null)}
          />
        </div>
      </div>
    )
  }

  const collectionAffichee = trierFiltrer(collection)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-equipe-doree equipe-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>Mon équipe ({equipe.length}/{NB_SLOTS})</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <IndicateurCompo equipe={equipe} />
        <p className="banc-aide">Les changements s'appliquent au prochain combat.</p>
        <p className="banc-regle-compo">📋 Règle d'équipe : 1 à 2 Pokémon par rôle, les 4 rôles présents · 1 spécial max.</p>
        {onAutoEquipe && (
          <button className="bouton-auto-equipe" onClick={onAutoEquipe}>
            ⚡ Auto-équipe (compo idéale)
          </button>
        )}
        <div className="banc-grille">
          {equipe.map((poke, i) => (
            <div key={poke.uid} className="banc-carte">
              {poke.shiny && <span className="banc-shiny-mark">✨</span>}
              <BadgeRole pokemon={poke} />
              <img
                src={poke.sprite}
                alt={poke.nom}
                className="banc-sprite cliquable-img"
                onClick={() => setSelection(poke)}
              />
              <span className="banc-nom">{poke.nom}</span>
              <span className="banc-iv">N.{poke.niveau || 1}</span>
              {equipe.length > 1 && (
                <button className="bouton-retirer" onClick={() => onRetirerMembre(i)}>Retirer</button>
              )}
            </div>
          ))}
          {Array.from({ length: slotsVides }).map((_, i) => (
            <button key={`vide-${i}`} className="banc-carte slot-vide" onClick={() => setAjoutEnCours(true)}>
              <span className="slot-plus">+</span>
              <span className="banc-nom">Ajouter</span>
            </button>
          ))}
        </div>

        <h3 className="banc-titre reserve">📦 Collection ({collectionAffichee.length})</h3>
        {barreTriFiltre}
        <div className="banc-grille">
          {collectionAffichee.length === 0 ? (
            <p className="banc-vide">Aucun Pokémon ne correspond (vérifie les filtres).</p>
          ) : (
            collectionAffichee.map((poke) => (
              <button key={poke.uid} className="banc-carte cliquable" onClick={() => setSelection(poke)}>
                {poke.shiny && <span className="banc-shiny-mark">✨</span>}
                <BadgeRole pokemon={poke} />
                <img src={poke.sprite} alt={poke.nom} className="banc-sprite" loading="lazy" />
                <span className="banc-nom">{poke.nom}</span>
                <span className="banc-iv">N.{poke.niveau || 1}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Equipe