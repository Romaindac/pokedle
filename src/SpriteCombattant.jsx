import { useState, useEffect, useRef } from 'react'
import { ROLES, determinerRole } from './roles'
import { nomShowdown } from './pokedexNoms'
import { xpRequise } from './stats'
import { XP_BASE_NIVEAU } from './config'
import { statutsActifs } from './statuts'
import AuraPokemon from './AuraPokemon'

// ============================================================
// Conversion d'un nom PokeAPI vers l'identifiant de sprite Showdown.
// Les formes speciales (Mega, Primal, Origin...) ont un nom PokeAPI du type
// "mewtwo-mega-x" alors que le fichier Showdown s'appelle "mewtwo-megax.gif" :
// on garde le PREMIER tiret (espece-forme) et on supprime les suivants.
// Exemples : mewtwo-mega-x -> mewtwo-megax | charizard-mega-y -> charizard-megay
//            kyogre-primal -> kyogre-primal (inchange) | gyarados-mega -> idem
// ============================================================
function nomSpriteShowdown(pokemon) {
  const num = pokemon.id || pokemon.numero
  // Numero national connu : la table officielle des noms.
  if (typeof num === 'number' && num >= 1 && num <= 1025) {
    const n = nomShowdown(num)
    if (n) return n
  }
  // Forme speciale (Mega, Primal...) ou id inconnu : conversion du nom.
  let n = (pokemon.nom || '').toLowerCase().replace(/[^a-z0-9-]/g, '')
  const i = n.indexOf('-')
  if (i !== -1) n = n.slice(0, i + 1) + n.slice(i + 1).replace(/-/g, '')
  return n
}

// Sprite de combat "champ de bataille" : sprite animé sur le décor + plaque de combat.
// - camp 'joueur'  → sprite de DOS (ani-back → back → ani → stocké)
// - camp 'ennemi'  → sprite de FACE (ani → artwork HD → stocké)
// Garde : barre de PV colorée, nom + niveau, liseré de jauge ATB, barre d'XP doree,
// halo de rôle, flash de coup, badge d'ultime, ciblage Master Ball (ennemis).
// AURA CANVAS : vraies particules par TYPE, transformees par STATUT (AuraPokemon).
// plafond : niveau max (level cap prestige) — affiche "MAX" quand atteint.
function SpriteCombattant({
  pokemon, pvActuels, jauge = 0, camp = 'joueur',
  ultimeLance = false, ultimeEnnemi = false,
  marqueeMaster = false, ciblableMaster = false, onCiblerMaster = null,
  plafond = null,
}) {
  const pvMax = pokemon.pvMax || 1
  const pourcentageVie = Math.max(0, Math.min(100, (pvActuels / pvMax) * 100))
  const ko = pvActuels <= 0
  const estJoueur = camp === 'joueur'

  // Couleur de la barre de PV selon le pourcentage (vert → orange → rouge).
  const couleurPv = pourcentageVie > 50 ? '#34d399' : pourcentageVie > 22 ? '#fbbf24' : '#ef4444'

  // --- XP : pourcentage vers le niveau suivant + état "MAX" ---
  const niveau = pokemon.niveau || 1
  const auMax = plafond != null && niveau >= plafond
  const xpReq = xpRequise(niveau, XP_BASE_NIVEAU) || 1
  const xpAct = pokemon.xp || 0
  const pourcentageXp = auMax ? 100 : Math.max(0, Math.min(100, (xpAct / xpReq) * 100))

  // --- Cascade d'URLs de sprite selon le camp ---
  const num = pokemon.id || pokemon.numero
  const nomSd = nomSpriteShowdown(pokemon)
  const shiny = !!pokemon.shiny
  const dossierAni = shiny ? 'ani-shiny' : 'ani'
  const dossierAniBack = shiny ? 'ani-back-shiny' : 'ani-back'
  const base = 'https://play.pokemonshowdown.com/sprites/'
  const repoBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
  const numValide = typeof num === 'number'

  let sources
  if (estJoueur) {
    sources = [
      nomSd ? `${base}${dossierAniBack}/${nomSd}.gif` : null,
      numValide ? `${repoBase}back/${shiny ? 'shiny/' : ''}${num}.png` : null,
      nomSd ? `${base}${dossierAni}/${nomSd}.gif` : null,
      pokemon.shiny ? (pokemon.spriteShiny || pokemon.sprite) : pokemon.sprite,
    ].filter(Boolean)
  } else {
    sources = [
      nomSd ? `${base}${dossierAni}/${nomSd}.gif` : null,
      numValide ? `${repoBase}other/${shiny ? 'official-artwork/shiny' : 'official-artwork'}/${num}.png` : null,
      pokemon.shiny ? (pokemon.spriteShiny || pokemon.sprite) : pokemon.sprite,
    ].filter(Boolean)
  }
  const onError = (e) => {
    const img = e.currentTarget
    const etape = parseInt(img.dataset.etape || '0', 10)
    const suivante = etape + 1
    if (suivante < sources.length) {
      img.dataset.etape = String(suivante)
      img.src = sources[suivante]
    }
  }

  // --- Flash de coup (baisse de PV) ---
  const pvPrec = useRef(pvActuels)
  const [prendCoup, setPrendCoup] = useState(false)
  useEffect(() => {
    if (pvActuels < pvPrec.current && pvActuels >= 0) {
      setPrendCoup(true)
      const t = setTimeout(() => setPrendCoup(false), 320)
      pvPrec.current = pvActuels
      return () => clearTimeout(t)
    }
    pvPrec.current = pvActuels
  }, [pvActuels])

  // --- Bond d'attaque (la jauge ATB retombe = le Pokémon vient d'agir) ---
  const jaugePrec = useRef(jauge)
  const bondRef = useRef(null)
  const bondEnCours = useRef(false)
  useEffect(() => {
    if (jauge < jaugePrec.current - 25 && !ko && bondRef.current && !bondEnCours.current) {
      const dx = estJoueur ? 14 : -14
      const dy = estJoueur ? -8 : 8
      try {
        bondEnCours.current = true
        const anim = bondRef.current.animate(
          [
            { transform: 'translate(0,0)' },
            { transform: `translate(${dx}px, ${dy}px)`, offset: 0.35 },
            { transform: 'translate(0,0)' },
          ],
          { duration: 360, easing: 'ease-out', fill: 'none' }
        )
        anim.onfinish = () => { bondEnCours.current = false }
        anim.oncancel = () => { bondEnCours.current = false }
      } catch {
        bondEnCours.current = false
      }
    }
    jaugePrec.current = jauge
  }, [jauge, ko, estJoueur])

  const role = pokemon.role || determinerRole(pokemon)
  const infoRole = ROLES[role]
  // Statuts actifs (pour l'aura). Lu à chaque rendu (l'objet est muté par le moteur).
  const statuts = ko ? [] : statutsActifs(pokemon)
  // Pokemon rare de la Tour (mini-boss / boss) : marquage visuel.
  const estRare = !!pokemon.estRareTour
  // Aura selon la rarete du Pokemon (commun = rien, pour faire ressortir les rares).
  // shiny et special priment (aura prismatique).
  const rarete = pokemon.rarete || 'commun'
  let niveauAura = ''
  if (pokemon.shiny) niveauAura = 'prismatique'
  else if (rarete === 'special') niveauAura = 'prismatique'
  else if (rarete === 'legendaire') niveauAura = 'legendaire'
  else if (rarete === 'tresRare' || rarete === 'tres_rare') niveauAura = 'tresrare'
  else if (rarete === 'rare') niveauAura = 'rare'
  // commun / peuCommun : pas d'aura

  return (
    <div className={`cbt-slot ${estJoueur ? 'cbt-joueur' : 'cbt-ennemi'} ${ko ? 'cbt-ko' : ''} ${prendCoup ? 'cbt-coup' : ''} ${pokemon.shiny ? 'cbt-shiny' : ''} ${marqueeMaster ? 'cbt-cible-master' : ''} ${estRare ? 'cbt-rare' : ''} ${niveauAura ? 'cbt-aura-' + niveauAura : ''}`}>
      {/* Plaque de combat (nom + niveau + barre PV + barre XP) */}
      <div className="cbt-plaque">
        <div className="cbt-plaque-haut">
          {infoRole && <span className="cbt-role" title={infoRole.nom}>{infoRole.emoji}</span>}
          <span className="cbt-nom">{pokemon.nom}</span>
          <span className={`cbt-niv ${auMax ? 'cbt-niv-max' : ''}`}>{auMax ? `N.${niveau} MAX` : `N.${niveau}`}</span>
          {pokemon.shiny && <span className="cbt-shiny-badge" title="Shiny">✨</span>}
        </div>
        <div className="cbt-barre-pv">
          <div className="cbt-barre-pv-fill" style={{ width: `${pourcentageVie}%`, background: couleurPv }}></div>
        </div>
        <div className="cbt-barre-atb">
          <div className="cbt-barre-atb-fill" style={{ width: `${ko ? 0 : jauge}%` }}></div>
        </div>
        {/* Barre d'XP doree animee (seulement pour le joueur) */}
        {estJoueur && (
          <div className={`cbt-barre-xp ${auMax ? 'cbt-barre-xp-max' : ''}`} title={auMax ? 'Niveau maximum atteint' : `XP : ${xpAct} / ${xpReq}`}>
            <div className="cbt-barre-xp-fill" style={{ width: `${pourcentageXp}%` }}>
              <span className="cbt-barre-xp-brillance"></span>
            </div>
          </div>
        )}
        <span className="cbt-pv-txt">{Math.max(0, pvActuels)} / {pvMax}</span>
      </div>

      {/* Sprite sur le terrain */}
      <div className="cbt-sprite-zone" style={{ position: 'relative' }}>
        {/* Couronne du Pokemon rare (mini-boss / boss de la Tour) */}
        {estRare && !ko && <span className="cbt-couronne-rare" title="Pokemon rare">👑</span>}
        {/* Aura doree du rare */}
        {estRare && !ko && <div className="cbt-aura-rare"></div>}
        {/* Halo / aura de role au sol */}
        {!ko && infoRole && <div className="cbt-aura-role" style={{ '--c-role': infoRole.couleur }}></div>}
        {/* Aura de rarete (halo + anneau autour du sprite rare/legendaire/shiny) */}
        {!ko && niveauAura && (
          <div className={`cbt-rarete-aura cbt-rarete-${niveauAura}`}>
            <span className="cbt-rarete-halo"></span>
            <span className="cbt-rarete-anneau"></span>
            {(niveauAura === 'legendaire' || niveauAura === 'prismatique') && (
              <>
                <span className="cbt-rarete-etincelle e0"></span>
                <span className="cbt-rarete-etincelle e1"></span>
                <span className="cbt-rarete-etincelle e2"></span>
                <span className="cbt-rarete-etincelle e3"></span>
              </>
            )}
          </div>
        )}
        {/* Ombre portee sous le Pokemon (profondeur) */}
        {!ko && <div className="cbt-ombre-sol"></div>}
        {ciblableMaster && onCiblerMaster && (
          <button type="button"
            className={`cbt-cible-master ${marqueeMaster ? 'actif' : ''}`}
            title={marqueeMaster ? 'Master Ball ciblée (clic pour annuler)' : 'Cibler pour une Master Ball'}
            onClick={(e) => { e.stopPropagation(); onCiblerMaster() }}
            style={{ position: 'relative', zIndex: 3 }}>
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/master-ball.png"
              alt="Master Ball" className="cbt-cible-master-img"
              onError={(e) => { e.currentTarget.replaceWith(document.createTextNode('⚫')) }} />
          </button>
        )}
        <div className="cbt-sprite-bond" ref={bondRef}>
          {/* Boss : sprite agrandi (+28%), ancre au sol, presence massive */}
          <div style={pokemon.estBoss ? { transform: 'scale(1.28)', transformOrigin: 'bottom center' } : undefined}>
            <img
              src={sources[0]}
              alt={pokemon.nom}
              className="cbt-sprite"
              data-etape="0"
              onError={onError}
            />
          </div>
        </div>
        {/* AURA CANVAS : particules par type, transformees par statut, or si shiny, terrifiante si boss */}
        <AuraPokemon types={pokemon.types || []} statuts={statuts} shiny={shiny} ko={ko} boss={!!pokemon.estBoss} />
      </div>
    </div>
  )
}

export default SpriteCombattant