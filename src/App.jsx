import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  BookOpen, Users, Map as MapIcon, BarChart3, ShoppingBag, Backpack,
  Trophy, Zap, Swords, Flame, Crosshair, Medal, Save, HelpCircle, Trash2,
  Settings, Gauge, Boxes, ChevronLeft, ChevronRight, Coins, Target, Play, Pause,
  Sparkles, Crown, Plus, Repeat, Egg,
} from 'lucide-react'
import { VITESSE_COMBAT, PAUSE_RESPAWN, GAIN_PAR_VICTOIRE, GAIN_BASE_ENNEMI, BONUS_STAT_NIVEAU, XP_BASE_NIVEAU, XP_BASE_ENNEMI, TAUX_CAPTURE_RARETE, BALLS, BALL_AUTO_PAR_RARETE, TAUX_SHINY, PIERRES, BONBONS, prixDynamique, multiplicateurSurclassement } from './config'
import { ticCombat, appliquerUltime } from './moteurCombat'
import { ULTIMES, ultimeDuRole, COUT_ULTIME } from './ultimes'
import { genererIV, statsFinales, fusionnerIV, ajouterXP, xpRequise, normaliserIV } from './stats'
import { ROLES, determinerRole, determinerPassif, bonusDuPassif, compositionValide, diagnostiqueComposition, compterRoles, COMPOSITION_REQUISE, trierIdsParRole, passifParDefautDuRole, passifPourMode, champPassifDuMode } from './roles'
import { ROUTES, routeParId, tirerPokemon, MULTI_XP_RARETE, bossDeLaRoute, COMBATS_AVANT_BOSS, FORCE_BOSS, routeDebloquee } from './routes'
import CartePokemon from './CartePokemon'
import SpriteCombattant from './SpriteCombattant'
import TutoFenetre from './TutoFenetre'
import { reinitialiserTutos } from './tuto'
import PanneauOeufs from './PanneauOeufs'
import { creerOeuf, tirerRareteOeuf, pretAEclore, combatsRequis, NB_INCUBATEURS, TAUX_DROP_OEUF, TYPES_OEUF, infoOeuf, JETONS_PAR_ECLOSION, JETONS_PAR_BOSS, CHANCE_JETON_COMBAT, tirerContenuOeuf, ivDepuisOeuf, shinyDepuisOeuf } from './oeufs'
import TimerAnneau from './TimerAnneau'
import Pokedex from './Pokedex'
import Equipe from './Equipe'
import ReglesCapture from './ReglesCapture'
import PanneauPrestige from './PanneauPrestige'
import PanneauArene from './PanneauArene'
import CombatArene from './CombatArene'
import PanneauRaids from './PanneauRaids'
import CombatRaid from './CombatRaid'
import { RAIDS, raidParId, etatRaid, tempsRestantRaid, COOLDOWN_RAID_MS, FORCE_BOSS_RAID_PV, FORCE_BOSS_RAID_ATK, TAUX_CAPTURE_BOSS_RAID, bonbonsIvRefarm } from './raids'
import { PARCHEMINS, roleDuParchemin } from './parchemins'
import PanneauPvp from './PanneauPvp'
import CombatPvp from './CombatPvp'
import Tutoriel from './Tutoriel'
import { publierDefense, chargerMaDefense, listerDefenses, appliquerResultatPvp, reconstruireEquipeSnapshot, capperEquipePvp, equipeComplete, NIVEAU_MAX_PVP, rangDepuisPoints, POINTS_DEPART } from './apiPvp'
import { dresseursDebloques, etatsDresseurs, etatsDresseursAvecReset, creneauActuel, decrireRecompenseDresseur, DRESSEURS } from './arene'
import { OBJETS, bonusStatsObjet, objetsAchetables, effetsSpeciauxEquipe, bonusXpObjet, tirerObjetDrop } from './objets'
import MenuRoutes from './MenuRoutes'
import ChoixStarter from './ChoixStarter'
import PanneauStats from './PanneauStats'
import Boutique from './Boutique'
import Sac from './Sac'
import PanneauSucces from './PanneauSucces'
import { SUCCES } from './succes'
import PanneauAmeliorations from './PanneauAmeliorations'
import PanneauSauvegarde from './PanneauSauvegarde'
import PanneauNouveautes from './PanneauNouveautes'
import { coutAmelioration, multiplicateur, niveauAmelioration, PALIER_MAX, facteurNegociateur, OBJETS_BOSS, BONBONS_IV, coutEndgame, peutPayerEndgame, endgameDebloque } from './ameliorations'
import { recompensesDisponibles, PALIERS_GLOBAUX, PALIERS_GENERATION, GENERATIONS as GENS_RECOMP } from './recompenses'
import { medaillesGagnables, multiplicateursPrestige, totalInvesti, BONUS_PRESTIGE } from './prestige'
import { chargerInfosEspece, corrigerNom } from './evolution'
import { SPECIAUX, specialDuBoss, estIdSpecial } from './speciaux'
import Classement from './Classement'
import ChoixPseudo from './ChoixPseudo'
import { chargerIdentite, envoyerScore } from './apiClassement'
import { chargerTableNoms } from './pokedexNoms'
import { creerHorloge } from './horlogeWorker'


const CLE_SAUVEGARDE = 'pokedex-idle-save-v11'

// Clé qui mémorise que le joueur a vu le pop-up de nouveautés (incrémenter à chaque gros patch).
const CLE_NOUVEAUTES = 'pokedle-nouveautes-vue-v12'
// Reset d'histoire forcé (une fois pour tous) : si la save n'a pas ce numéro,
// on remet la progression d'histoire à zéro au chargement (zones, victoires, boss).
//
// ⚠️ INTERRUPTEUR : mettre RESET_HISTOIRE_ACTIF à false = AUCUN reset auto (état normal).
// Pour reforcer un reset pour tout le monde plus tard :
//   1. incrémenter VERSION_RESET_HISTOIRE (3, 4, ...)
//   2. remettre RESET_HISTOIRE_ACTIF à true
//   3. pousser. Une fois tout le monde reset, repasser RESET_HISTOIRE_ACTIF à false.
const VERSION_RESET_HISTOIRE = 2
const RESET_HISTOIRE_ACTIF = false

// --- Drops d'objets de boss (monnaie endgame) ---
// Probabilités par type de boss. Jamais garanti. Sous les plafonds voulus.
// Refarm des boss : une fois le boss d'une zone vaincu une 1ère fois, il revient
// tous les COMBATS_REFARM_BOSS combats gagnés dans cette zone.
const COMBATS_REFARM_BOSS = 250

const TAUX_OBJET_BOSS = {
  zone:  { rouage: 0.0010, cristal: 0.0007, relique: 0.0005 },
  arene: { rouage: 0.0012, cristal: 0.0008, relique: 0.0005 },
  raid:  { rouage: 0.0015, cristal: 0.0010, relique: 0.0006 },
}

// Drop des bonbons d'IV (utiles tout de suite → bien plus fréquents que la monnaie endgame).
// Probabilité qu'un bonbon d'IV tombe, par type de boss. Si ça tombe, la stat est tirée au hasard.
const TAUX_BONBON_IV = { zone: 0.06, arene: 0.08, raid: 0.10 }
const CLES_BONBON_IV = ['iv_pv', 'iv_attaque', 'iv_vitesse', 'iv_defense']

// Déduit le type d'ambiance de particules à partir du nom du fichier de décor.
// Renvoie une classe CSS : 'feuilles' | 'neige' | 'cendres' | 'sable' | 'spores' | 'poussiere'.
function ambianceDeZone(decor) {
  const d = (decor || '').toLowerCase()
  if (d.includes('neige') || d.includes('cristal') || d.includes('sommet')) return 'neige'
  if (d.includes('volcan') || d.includes('feu') || d.includes('forge')) return 'cendres'
  if (d.includes('desert') || d.includes('sable') || d.includes('plage')) return 'sable'
  if (d.includes('grotte') || d.includes('abysses') || d.includes('temple') || d.includes('marais')) return 'spores'
  if (d.includes('foret') || d.includes('prairie') || d.includes('jade') || d.includes('sanctuaire') || d.includes('dragon')) return 'feuilles'
  return 'poussiere'
}

// Correspondance type de ball -> icône image (sans toucher à config.js)
// Icônes = sprites officiels PokeAPI (dérivés de config.js). Look authentique Pokémon.
const ICONES_BALLS = Object.fromEntries(Object.entries(BALLS).map(([k, v]) => [k, v.sprite]))
const ICONE_ARGENT = '/icons/argent.png'
const ICONE_COMBAT = '/icons/combat.png'
const ICONES_BONBONS = Object.fromEntries(Object.entries(BONBONS).map(([k, v]) => [k, v.sprite]))
const ICONES_PIERRES = Object.fromEntries(Object.entries(PIERRES).map(([k, v]) => [k, v.sprite]))

let compteurUid = 0
let compteurJournal = 0
let bonusShinyGlobal = 1
// Effets spéciaux des objets équipés sur l'équipe active (recalculés quand l'équipe change).
let bonusShinyObjets = 1
let bonusArgentObjets = 1
// Bonus permanents de complétion du Pokédex (1 = aucun bonus, 1.15 = +15%).
let bonusCompletionXP = 1
let bonusCompletionArgent = 1
// Bonus permanents gagnés via les succès (1 = aucun bonus).
let bonusSuccesXP = 1
let bonusSuccesArgent = 1
// Multiplicateurs permanents du prestige (1 = aucun bonus).
let bonusPrestigeXP = 1
let bonusPrestigeArgent = 1
let bonusPrestigeShiny = 1
function nouvelUid() {
  compteurUid += 1
  return `${Date.now()}-${compteurUid}-${Math.floor(Math.random() * 100000)}`
}

// Formate un nombre en version compacte pour l'affichage (1000000 → "1M", 10000 → "10k", 2500 → "2.5k").
function formaterNombre(n) {
  if (n >= 1000000) {
    const v = n / 1000000
    return (v % 1 === 0 ? v : v.toFixed(1)) + 'M'
  }
  if (n >= 1000) {
    const v = n / 1000
    return (v % 1 === 0 ? v : v.toFixed(1)) + 'k'
  }
  return String(n)
}

// --- Limite « 1 Pokémon spécial par équipe » ---
function estSpecial(poke) {
  if (!poke) return false
  if (poke.estSpecial === true) return true
  return estIdSpecial(poke.id)
}

// Compte les spéciaux présents dans une équipe (liste d'uid + collection).
function compterSpeciaux(ids, collection) {
  return (ids || [])
    .map((uid) => (collection || []).find((p) => p && p.uid === uid))
    .filter((p) => estSpecial(p)).length
}

// --- Lecture sûre des stats PokeAPI ---
function statBase(data, nom, repli = 50) {
  const stats = (data && data.stats) || []
  const trouve = stats.find((s) => s && s.stat && s.stat.name === nom)
  const val = trouve ? trouve.base_stat : undefined
  return Number.isFinite(val) ? val : repli
}
function statsBaseDepuis(data) {
  return {
    pvBase: statBase(data, 'hp'),
    attaqueBase: statBase(data, 'attack'),
    vitesseBase: statBase(data, 'speed'),
    defBase: Math.max(statBase(data, 'defense'), statBase(data, 'special-defense')),
  }
}

async function chargerPokemon(nom, avecPrechargement = true) {
  const reponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(nom)}`)
  if (!reponse.ok) throw new Error(`Pokémon introuvable : ${nom}`)
  const data = await reponse.json()
  const iv = genererIV()
  const infos = await chargerInfosEspece(data.id)

  let formeEvoluee = null
  if (avecPrechargement && infos.evolueEn) {
    try {
      const repEvo = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(infos.evolueEn)}`)
      const dataEvo = await repEvo.json()
      const infosEvo = await chargerInfosEspece(dataEvo.id)
      formeEvoluee = {
        nom: dataEvo.name,
        id: dataEvo.id,
        ...statsBaseDepuis(dataEvo),
        types: dataEvo.types.map((t) => t.type.name),
        sprite: dataEvo.sprites.front_default,
        spriteNormal: dataEvo.sprites.front_default,
        spriteShiny: dataEvo.sprites.front_shiny,
        evolueEn: infosEvo.evolueEn,
        evolueNiveau: infosEvo.evolueNiveau,
      }
    } catch (err) {
      formeEvoluee = null
    }
  }

  const base = {
    uid: nouvelUid(),
    nom: data.name,
    id: data.id,
    ...statsBaseDepuis(data),
    types: data.types.map((t) => t.type.name),
    sprite: data.sprites.front_default,
    spriteNormal: data.sprites.front_default,
    spriteShiny: data.sprites.front_shiny,
    shiny: false,
    iv,
    niveau: 1,
    xp: 0,
    evolueEn: infos.evolueEn,
    evolueNiveau: infos.evolueNiveau,
    evolutionsPierre: infos.evolutionsPierre || [],
    formeEvoluee,
    estEvolution: infos.estEvolution,
    familleId: infos.familleId,
  }
  base.role = determinerRole(base)
  base.passif = determinerPassif(base)
  const finales = statsFinales(base, BONUS_STAT_NIVEAU)
  return { ...base, ...finales }
}

function appliquerBonusEquipe(equipe) {
  if (!equipe || equipe.length === 0) return equipe
  let boostPv = 0
  for (const p of equipe) {
    if (!p) continue
    const eff = bonusDuPassif(p)
    boostPv += eff.boostPvEquipe || 0
  }
  if (boostPv <= 0) return equipe
  const facteur = 1 + boostPv
  return equipe.map((p) => {
    if (!p) return p
    return { ...p, pvMax: Math.max(1, Math.round(p.pvMax * facteur)) }
  })
}

function preparerEquipe(equipe, mode = 'principal') {
  if (!equipe || equipe.length === 0) return equipe
  return equipe.map((p) => {
    if (!p) return p
    const passifMode = passifPourMode(p, mode)
    if (p.passifChoisi === passifMode) return p
    const maj = { ...p, passifChoisi: passifMode }
    return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
  })
}

async function chargerEquipeEnnemie(route) {
  const NB_CANDIDATS = 18
  const tirage = Array.from({ length: NB_CANDIDATS }, () => tirerPokemon(route.pool))
  const candidats = await Promise.all(
    tirage.map(async (t) => {
      try {
        const p = await chargerPokemon(t.nom, false)
        return { ...p, rarete: t.rarete }
      } catch (err) {
        console.warn(`Échec chargement "${t.nom}", remplacé par magikarp.`, err)
        const p = await chargerPokemon('magikarp', false)
        return { ...p, rarete: t.rarete }
      }
    })
  )

  const parRole = { tank: [], eclaireur: [], soutien: [], dps: [] }
  for (const c of candidats) {
    const role = c.role || determinerRole(c)
    if (parRole[role]) parRole[role].push(c)
  }
  const reste = [...candidats]
  function prendre(role, n) {
    const choisis = []
    for (let k = 0; k < n; k++) {
      let p = parRole[role] && parRole[role].length ? parRole[role].shift() : null
      if (!p) p = reste.find(Boolean)
      if (p) {
        choisis.push(p)
        const idx = reste.indexOf(p)
        if (idx >= 0) reste.splice(idx, 1)
      }
    }
    return choisis
  }
  const equipe = [
    ...prendre('tank', COMPOSITION_REQUISE.tank),
    ...prendre('eclaireur', COMPOSITION_REQUISE.eclaireur),
    ...prendre('soutien', COMPOSITION_REQUISE.soutien),
    ...prendre('dps', COMPOSITION_REQUISE.dps),
  ]

  const handicap = route.handicapEnnemi || 1
  const equipeFinale = equipe.map((p) => {
    const niveau = Math.max(1, route.niveau + Math.floor(Math.random() * 5) - 2)
    const rarete = p.rarete
    const tauxShiny = (TAUX_SHINY[rarete] ?? (1 / 4096)) * bonusShinyGlobal * bonusShinyObjets
    const estShiny = Math.random() < tauxShiny
    const avecNiveau = {
      ...p,
      niveau,
      rarete,
      shiny: estShiny,
      sprite: estShiny && p.spriteShiny ? p.spriteShiny : p.spriteNormal,
    }
    const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
    return {
      ...avecNiveau,
      ...finales,
      pvMax: Math.max(1, Math.round(finales.pvMax * handicap)),
      attaque: Math.max(1, Math.round(finales.attaque * handicap)),
    }
  })
  return appliquerBonusEquipe(equipeFinale)
}

async function chargerEquipeDresseur(dresseur) {
  const noms = [...dresseur.equipe]
  if (dresseur.special) noms.push(dresseur.special)
  const equipe = await Promise.all(
    noms.map(async (nom) => {
      try {
        return await chargerPokemon(nom, false)
      } catch (err) {
        console.warn(`Échec chargement dresseur "${nom}", remplacé par magikarp.`, err)
        return await chargerPokemon('magikarp', false)
      }
    })
  )
  return equipe.map((p, index) => {
    const estSpecial = dresseur.special && index === equipe.length - 1
    const niveauBase = estSpecial ? dresseur.niveau + 15 : dresseur.niveau
    const niveau = Math.max(1, niveauBase + Math.floor(Math.random() * 5) - 2)
    const avecNiveau = { ...p, niveau, rarete: estSpecial ? 'special' : 'commun', shiny: false, sprite: p.spriteNormal }
    const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
    return { ...avecNiveau, ...finales }
  })
}

async function chargerEquipeRaid(raid) {
  const vagues = await Promise.all(
    raid.vagues.map(async (noms, indexVague) => {
      const estVagueBoss = indexVague === raid.vagues.length - 1
      const equipe = await Promise.all(
        noms.map(async (nom) => {
          try {
            return await chargerPokemon(nom, false)
          } catch (err) {
            console.warn(`Échec chargement raid "${nom}", remplacé par magikarp.`, err)
            return await chargerPokemon('magikarp', false)
          }
        })
      )
      return equipe.map((p, i) => {
        // Niveau progressif selon la vague : +0, puis paliers, boss = +20.
        // Fonctionne pour un nombre de vagues quelconque (3, 4, 5...).
        const dernier = raid.vagues.length - 1
        let niveau = raid.niveau
        if (!estVagueBoss && indexVague > 0) niveau = raid.niveau + indexVague * 6
        if (estVagueBoss) niveau = raid.niveau + 20
        niveau = Math.max(1, niveau + Math.floor(Math.random() * 5) - 2)
        const avecNiveau = {
          ...p, niveau,
          rarete: estVagueBoss ? 'legendaire' : (indexVague >= dernier - 1 ? 'tresRare' : 'commun'),
          shiny: false, sprite: p.spriteNormal,
          estBoss: estVagueBoss,
        }
        const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
        if (estVagueBoss) {
          return {
            ...avecNiveau, ...finales,
            pvMax: Math.max(1, Math.round(finales.pvMax * FORCE_BOSS_RAID_PV)),
            attaque: Math.max(1, Math.round(finales.attaque * FORCE_BOSS_RAID_ATK)),
          }
        }
        return { ...avecNiveau, ...finales }
      })
    })
  )
  return vagues
}

async function chargerBoss(route) {
  const nomBoss = bossDeLaRoute(route)
  if (!nomBoss) return null
  let boss
  try {
    boss = await chargerPokemon(nomBoss, false)
  } catch (err) {
    return null
  }
  const niveau = route.niveau + 5
  const avecNiveau = {
    ...boss,
    niveau,
    rarete: 'legendaire',
    shiny: true,
    sprite: boss.spriteShiny || boss.spriteNormal,
    estBoss: true,
  }
  const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
  const handicap = route.handicapEnnemi || 1
  return {
    ...avecNiveau,
    ...finales,
    pvMax: Math.max(1, Math.round(finales.pvMax * FORCE_BOSS * handicap)),
    attaque: Math.max(1, Math.round(finales.attaque * FORCE_BOSS * handicap)),
  }
}

function App() {
  const [captures, setCaptures] = useState([])
  const [equipeIds, setEquipeIds] = useState([])
  const [pokedexVus, setPokedexVus] = useState([])
  const [pokedexShiny, setPokedexShiny] = useState([])
  const [pokedexSpeciaux, setPokedexSpeciaux] = useState([])
  const [tableNoms, setTableNoms] = useState({})

  const [pvJoueur, setPvJoueur] = useState([])
  const [jaugeJoueur, setJaugeJoueur] = useState([])
  const [equipeEnnemie, setEquipeEnnemie] = useState([])
  const [pvEnnemis, setPvEnnemis] = useState([])
  const [jaugeEnnemis, setJaugeEnnemis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [vaincus, setVaincus] = useState(0)
  // Œufs : réserve (en attente) + incubateurs (tableau de NB_INCUBATEURS, null = libre).
  const [reserveOeufs, setReserveOeufs] = useState([])
  const [oeufsIncubes, setOeufsIncubes] = useState(() => Array(NB_INCUBATEURS).fill(null))
  const oeufsIncubesRef = useRef(oeufsIncubes)
  useEffect(() => { oeufsIncubesRef.current = oeufsIncubes }, [oeufsIncubes])
  // Jetons d'élevage : monnaie dédiée aux œufs.
  const [jetonsElevage, setJetonsElevage] = useState(0)
  const [pokeDollars, setPokeDollars] = useState(0)
  const [balls, setBalls] = useState({ poke: 0, super: 0, hyper: 0, master: 0 })
  const [pierres, setPierres] = useState({})
  const [bonbons, setBonbons] = useState({})
  const [objets, setObjets] = useState({})
  const [objetsBoss, setObjetsBoss] = useState({ rouage: 0, cristal: 0, relique: 0, iv_pv: 0, iv_attaque: 0, iv_vitesse: 0, iv_defense: 0 })
  const [parchemins, setParchemins] = useState({})
  const [achatsItems, setAchatsItems] = useState({})
  const [recompensesReclamees, setRecompensesReclamees] = useState([])
  const [medailles, setMedailles] = useState(0)
  const [investisPrestige, setInvestisPrestige] = useState({ xp: 0, argent: 0, shiny: 0 })
  const [journal, setJournal] = useState([])
  const [vueOuverte, setVueOuverte] = useState(null)
  const [identiteJoueur, setIdentiteJoueur] = useState(() => chargerIdentite())
  const [changerPseudoOuvert, setChangerPseudoOuvert] = useState(false)
  // Pop-up de nouveautés : ouvert automatiquement si le joueur ne l'a pas encore vu.
  const [nouveautesOuvert, setNouveautesOuvert] = useState(() => {
    try { return localStorage.getItem(CLE_NOUVEAUTES) !== '1' } catch { return false }
  })
  function fermerNouveautes() {
    try { localStorage.setItem(CLE_NOUVEAUTES, '1') } catch {}
    setNouveautesOuvert(false)
  }
  const [modeJeu, setModeJeu] = useState('principal')
  const [tutoVu, setTutoVu] = useState(false)
  const [tutoMode, setTutoMode] = useState(null)
  const [equipeDefenseIds, setEquipeDefenseIds] = useState([])
  const [equipeAttaqueIds, setEquipeAttaqueIds] = useState([])
  const [pvpPoints, setPvpPoints] = useState(POINTS_DEPART)
  const [pvpRang, setPvpRang] = useState('Bronze')
  const [pvpDefensePubliee, setPvpDefensePubliee] = useState(false)
  const [pvpAdversaires, setPvpAdversaires] = useState([])
  const [pvpChargementListe, setPvpChargementListe] = useState(false)
  const [pvpPublicationEnCours, setPvpPublicationEnCours] = useState(false)
  const [pvpMessage, setPvpMessage] = useState('')
  const [pvpCombat, setPvpCombat] = useState(null)
  const [equipeAreneIds, setEquipeAreneIds] = useState([])
  const [dresseursVaincus, setDresseursVaincus] = useState({})
  const [dresseurActif, setDresseurActif] = useState(null)
  const [equipeDresseur, setEquipeDresseur] = useState(null)
  const [chargementArene, setChargementArene] = useState(false)
  const [equipeRaidIds, setEquipeRaidIds] = useState([])
  const [raidsCooldowns, setRaidsCooldowns] = useState({})
  const [raidActif, setRaidActif] = useState(null)
  const [vaguesRaid, setVaguesRaid] = useState(null)
  const [chargementRaid, setChargementRaid] = useState(false)
  const [partieChargee, setPartieChargee] = useState(false)
  const [reglesCapture, setReglesCapture] = useState({
    shiny: 'auto',
    legendaire: 'auto',
    nouveau: 'auto',
    doublon: 'auto',
    limiteBalls: 5,
  })
  const [routeActive, setRouteActive] = useState('tutoriel')
  const [victoiresParRoute, setVictoiresParRoute] = useState({})
  const [bossVaincus, setBossVaincus] = useState({})
  const [succesDebloques, setSuccesDebloques] = useState([])
  const [ameliorations, setAmeliorations] = useState({})
  const [combatBoss, setCombatBoss] = useState(false)
  const [tempsBossZone, setTempsBossZone] = useState(45)
  const [autoZone, setAutoZone] = useState(false)
  const [autoArene, setAutoArene] = useState(false)
  const [vitesse, setVitesse] = useState(1)
  const [choixStarterRequis, setChoixStarterRequis] = useState(false)
  const [captureRecente, setCaptureRecente] = useState(null)
  const [dropRecent, setDropRecent] = useState(null)
  const [chiffresFlottants, setChiffresFlottants] = useState([])
  const DELAI_ULTIME_MS = 7000
  const debutCombatRef = useRef(0)
  const ultimeLanceRef = useRef([false, false, false, false, false, false])
  const ultimeLanceEnnemiRef = useRef([false, false, false, false, false, false, false])
  const [ultimeLanceJoueur, setUltimeLanceJoueur] = useState([false, false, false, false, false, false])
  const [ultimeLanceEnnemiAff, setUltimeLanceEnnemiAff] = useState([false, false, false, false, false, false, false])
  const bouclierTicsRef = useRef(0)
  const bouclierTicsEnnemiRef = useRef(0)

  const equipeJoueur = equipeIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
  const compoValide = compositionValide(equipeJoueur)
  const compoDiagnostic = diagnostiqueComposition(equipeJoueur)
  const compositionValideRef = useRef(true)
  useEffect(() => { compositionValideRef.current = compoValide }, [compoValide])

  const transitionEnCours = useRef(false)
  const lancerCombatSuivantRef = useRef(null)
  const ballsRef = useRef({ poke: 0, super: 0, hyper: 0, master: 0 })
  const equipeEnnemieRef = useRef([])
  const capturesRef = useRef([])
  const equipeIdsRef = useRef([])
  const pokedexShinyRef = useRef([])
  const reglesCaptureRef = useRef({ shiny: 'auto', legendaire: 'auto', nouveau: 'auto', doublon: 'auto', limiteBalls: 5 })
  // Cibles Master Ball : clés "id" (ex "143") ou "id-shiny" (ex "143-shiny") cliquées par le joueur.
  // Persiste jusqu'à capture réussie de l'espèce (dans le bon statut shiny).
  const [ciblesMasterBall, setCiblesMasterBall] = useState([])
  const ciblesMasterBallRef = useRef([])
  useEffect(() => { ciblesMasterBallRef.current = ciblesMasterBall }, [ciblesMasterBall])
  // Compteur de tentatives de capture par espèce, remis à zéro à chaque nouveau combat.
  const tentativesParEspeceRef = useRef({})
  const routeActiveRef = useRef('tutoriel')
  const combatBossRef = useRef(false)
  const autoZoneRef = useRef(false)
  const modeJeuRef = useRef('principal')
  const victoiresParRouteRef = useRef({})
  const bossVaincusRef = useRef({})
  const ameliorationsRef = useRef({})
  const etat = useRef({ pvJ: [], jJ: [], pvE: [], jE: [] })

  useEffect(() => { ballsRef.current = balls }, [balls])
  useEffect(() => { equipeEnnemieRef.current = equipeEnnemie }, [equipeEnnemie])
  useEffect(() => { capturesRef.current = captures }, [captures])
  useEffect(() => { equipeIdsRef.current = equipeIds }, [equipeIds])

  useEffect(() => {
    if (!partieChargee) return
    const eq = equipeIds
      .map((uid) => capturesRef.current.find((p) => p.uid === uid))
      .filter(Boolean)
    const pvJ = eq.map((p) => p.pvMax)
    const jJ = eq.map(() => 0)
    setPvJoueur(pvJ)
    setJaugeJoueur(jJ)
    etat.current = { ...etat.current, pvJ, jJ }
  }, [equipeIds, partieChargee])
  useEffect(() => { pokedexShinyRef.current = pokedexShiny }, [pokedexShiny])
  useEffect(() => { reglesCaptureRef.current = reglesCapture }, [reglesCapture])
  useEffect(() => { routeActiveRef.current = routeActive }, [routeActive])
  useEffect(() => { combatBossRef.current = combatBoss }, [combatBoss])
  useEffect(() => { autoZoneRef.current = autoZone }, [autoZone])

  useEffect(() => {
    if (!combatBoss) { setTempsBossZone(45); return }
    const TEMPS = 45
    setTempsBossZone(TEMPS)
    const debut = Date.now()
    const tic = setInterval(() => {
      const reste = Math.max(0, TEMPS - (Date.now() - debut) / 1000)
      setTempsBossZone(reste)
      if (reste <= 0) {
        clearInterval(tic)
        const routePerdue = routeActiveRef.current
        ajouterAuJournal(`⏱️ Trop lent ! Le boss s'est enfui. Il faut refaire les ${COMBATS_AVANT_BOSS} victoires.`, 'echec')
        setVictoiresParRoute((v) => {
          const maj = { ...v, [routePerdue]: 0 }
          victoiresParRouteRef.current = maj
          return maj
        })
        setCombatBoss(false)
        combatBossRef.current = false
        transitionEnCours.current = true
        if (lancerCombatSuivantRef.current) {
          lancerCombatSuivantRef.current()
        }
      }
    }, 100)
    return () => clearInterval(tic)
  }, [combatBoss])
  useEffect(() => { modeJeuRef.current = modeJeu }, [modeJeu])
  useEffect(() => {
    if (partieChargee && !tutoVu && tutoMode === null) {
      setTutoMode('bienvenue')
    }
  }, [partieChargee, tutoVu])
  useEffect(() => {
    if (modeJeu !== 'pvp') return
    let annule = false
    setPvpChargementListe(true)
    ;(async () => {
      try {
        const maDef = await chargerMaDefense()
        if (!annule && maDef) {
          setPvpPoints(maDef.points_pvp)
          setPvpRang(maDef.rang)
          setPvpDefensePubliee(maDef.equipe && maDef.equipe.length > 0)
        }
        const { lignes } = await listerDefenses(50)
        if (!annule) setPvpAdversaires(lignes)
      } catch (err) {
        console.warn('Chargement PvP échoué', err)
      }
      if (!annule) setPvpChargementListe(false)
    })()
    return () => { annule = true }
  }, [modeJeu])

  useEffect(() => {
    const equipe = equipeIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const eff = effetsSpeciauxEquipe(equipe)
    bonusShinyObjets = eff.shiny
    bonusArgentObjets = eff.argent
  }, [equipeIds, captures])
  useEffect(() => { victoiresParRouteRef.current = victoiresParRoute }, [victoiresParRoute])
  useEffect(() => { bossVaincusRef.current = bossVaincus }, [bossVaincus])
  useEffect(() => {
    ameliorationsRef.current = ameliorations
    bonusShinyGlobal = multiplicateur(ameliorations, 'chroma')
  }, [ameliorations])

  useEffect(() => {
    let bonusXP = 0
    let bonusArgent = 0
    const reclamees = new Set(recompensesReclamees)
    const tousPaliers = [...PALIERS_GLOBAUX, ...PALIERS_GENERATION]
    for (const p of tousPaliers) {
      if (!reclamees.has(p.id)) continue
      for (const g of p.gains) {
        if (g.type === 'bonus' && g.stat === 'xp') bonusXP += g.valeur
        if (g.type === 'bonus' && g.stat === 'argent') bonusArgent += g.valeur
      }
    }
    bonusCompletionXP = 1 + bonusXP
    bonusCompletionArgent = 1 + bonusArgent
  }, [recompensesReclamees])

  useEffect(() => {
    let bxp = 0
    let barg = 0
    const obtenus = new Set(succesDebloques)
    for (const s of SUCCES) {
      if (!obtenus.has(s.id)) continue
      const r = s.recompense
      if (r && r.type === 'bonus') {
        if (r.stat === 'xp') bxp += r.valeur
        if (r.stat === 'argent') barg += r.valeur
      }
    }
    bonusSuccesXP = 1 + bxp
    bonusSuccesArgent = 1 + barg
  }, [succesDebloques])

  useEffect(() => {
    const m = multiplicateursPrestige(investisPrestige)
    bonusPrestigeXP = m.xp
    bonusPrestigeArgent = m.argent
    bonusPrestigeShiny = m.shiny
    bonusShinyGlobal = multiplicateur(ameliorationsRef.current, 'chroma') * m.shiny
  }, [investisPrestige])

  useEffect(() => {
    chargerTableNoms().then((table) => setTableNoms(table))
  }, [])

  useEffect(() => {
    if (!partieChargee) return
    const etatSucces = {
      nbCaptures: captures.length,
      nbShiny: pokedexShiny.length,
      nbVus: pokedexVus.length,
      totalDex: 1025,
      nbVaincus: vaincus,
      nbBoss: Object.values(bossVaincus).filter(Boolean).length,
      nbDresseurs: Object.keys(dresseursVaincus).length,
      nbZones: ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length,
      nbSpeciaux: pokedexSpeciaux.length,
    }
    const nouveaux = SUCCES.filter(
      (s) => !succesDebloques.includes(s.id) && s.condition(etatSucces)
    )
    if (nouveaux.length > 0) {
      nouveaux.forEach((s) => {
        const r = s.recompense
        if (r.type === 'argent') {
          setPokeDollars((a) => a + r.montant)
          ajouterAuJournal(`🏆 ${s.nom} ! (+${r.montant} 💰)`, 'victoire')
        } else if (r.type === 'ball') {
          setBalls((b) => ({ ...b, [r.ball]: b[r.ball] + r.quantite }))
          ajouterAuJournal(`🏆 ${s.nom} ! (+${r.quantite} ${BALLS[r.ball].emoji})`, 'victoire')
        } else if (r.type === 'pierre') {
          setPierres((p) => ({ ...p, [r.pierre]: (p[r.pierre] || 0) + r.quantite }))
          ajouterAuJournal(`🏆 ${s.nom} ! (+${r.quantite} ${PIERRES[r.pierre].emoji})`, 'victoire')
        } else if (r.type === 'bonus') {
          const nom = r.stat === 'xp' ? 'XP' : 'argent'
          ajouterAuJournal(`🏆 ${s.nom} ! (+${Math.round(r.valeur * 100)}% ${nom} permanent !)`, 'victoire')
        }
      })
      setSuccesDebloques((d) => [...d, ...nouveaux.map((s) => s.id)])
    }
  }, [partieChargee, captures, pokedexShiny, pokedexVus, vaincus, bossVaincus, succesDebloques, dresseursVaincus, pokedexSpeciaux])

  function ajouterAuJournal(texte, type = 'info') {
    setJournal((lignes) => {
      compteurJournal += 1
      const nouvelle = { texte, type, id: `j-${compteurJournal}` }
      return [...lignes, nouvelle].slice(-6)
    })
  }

  function journalFuite() {
    setJournal((lignes) => {
      const derniere = lignes[lignes.length - 1]
      if (derniere && derniere.type === 'fuite') {
        const compte = (derniere.compte || 1) + 1
        const maj = { ...derniere, compte, texte: `💨 ${compte} Pokémon enfuis faute de Ball` }
        return [...lignes.slice(0, -1), maj]
      }
      compteurJournal += 1
      const nouvelle = { texte: `💨 1 Pokémon enfui faute de Ball`, type: 'fuite', compte: 1, id: `j-${compteurJournal}` }
      return [...lignes, nouvelle].slice(-6)
    })
  }

  const captureTimer = useRef(null)
  function montrerCapture(ennemi) {
    setCaptureRecente({
      nom: ennemi.nom,
      sprite: ennemi.sprite,
      shiny: ennemi.shiny ?? false,
      cle: Date.now(),
    })
    if (captureTimer.current) clearTimeout(captureTimer.current)
    captureTimer.current = setTimeout(() => setCaptureRecente(null), 2200)
  }

  // Encart de drop d'objet de boss (Cristal / Relique uniquement).
  const dropTimer = useRef(null)
  function montrerDrop(cleObjet) {
    const info = OBJETS_BOSS[cleObjet]
    if (!info) return
    setDropRecent({
      nom: info.nom,
      sprite: info.sprite,
      emoji: info.emoji,
      legendaire: cleObjet === 'relique',
      cle: Date.now(),
    })
    if (dropTimer.current) clearTimeout(dropTimer.current)
    dropTimer.current = setTimeout(() => setDropRecent(null), 2600)
  }

  // Tire les drops d'objets de boss selon le type de boss ('zone' | 'arene' | 'raid').
  // Ajoute au stock, journalise, et montre l'encart pour cristal/relique.
  function tirerObjetsBoss(typeBoss) {
    const taux = TAUX_OBJET_BOSS[typeBoss] || TAUX_OBJET_BOSS.zone
    const gagnes = {}
    for (const cle of ['rouage', 'cristal', 'relique']) {
      if (Math.random() < taux[cle]) gagnes[cle] = (gagnes[cle] || 0) + 1
    }
    // Bonbon d'IV : une chance qu'un bonbon tombe, stat tirée au hasard.
    const tauxIV = TAUX_BONBON_IV[typeBoss] ?? TAUX_BONBON_IV.zone
    if (Math.random() < tauxIV) {
      const cleIV = CLES_BONBON_IV[Math.floor(Math.random() * CLES_BONBON_IV.length)]
      gagnes[cleIV] = (gagnes[cleIV] || 0) + 1
    }
    const cles = Object.keys(gagnes)
    if (cles.length === 0) return
    setObjetsBoss((stock) => {
      const maj = { ...stock }
      for (const cle of cles) maj[cle] = (maj[cle] || 0) + gagnes[cle]
      return maj
    })
    for (const cle of cles) {
      const info = OBJETS_BOSS[cle] || BONBONS_IV[cle]
      if (!info) continue
      ajouterAuJournal(`${info.emoji} Butin de boss : ${info.nom} !`, 'capture')
      if (cle === 'cristal' || cle === 'relique') montrerDrop(cle)
    }
  }

  const compteurChiffre = useRef(0)
  function ajouterChiffres(coups) {
    if (!coups || coups.length === 0) return
    const nouveaux = coups.map((c) => {
      compteurChiffre.current += 1
      const dx = Math.round((Math.random() - 0.5) * 30)
      return { id: `c-${compteurChiffre.current}`, montant: c.montant, type: c.type, camp: c.camp, index: c.cible, dx }
    })
    setChiffresFlottants((liste) => [...liste, ...nouveaux])
    const ids = new Set(nouveaux.map((n) => n.id))
    setTimeout(() => {
      setChiffresFlottants((liste) => liste.filter((c) => !ids.has(c.id)))
    }, 900)
  }

  function marquerVu(id) {
    setPokedexVus((vus) => (vus.includes(id) ? vus : [...vus, id]))
  }

  function marquerShiny(id) {
    setPokedexShiny((vus) => (vus.includes(id) ? vus : [...vus, id]))
  }

  async function reparerEvolutionsSave() {
    const liste = capturesRef.current || []
    const aReparer = liste.filter((p) => !p.evoV2)
    if (aReparer.length === 0) return
    for (const pkm of aReparer) {
      try {
        const infos = await chargerInfosEspece(pkm.id)
        let formeEvoluee = pkm.formeEvoluee
        if (infos.evolueEn && infos.evolueNiveau && !formeEvoluee) {
          const repEvo = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(infos.evolueEn)}`)
          const dataEvo = await repEvo.json()
          const infosEvo = await chargerInfosEspece(dataEvo.id)
          formeEvoluee = {
            nom: dataEvo.name,
            id: dataEvo.id,
            ...statsBaseDepuis(dataEvo),
            types: dataEvo.types.map((t) => t.type.name),
            sprite: dataEvo.sprites.front_default,
            spriteNormal: dataEvo.sprites.front_default,
            spriteShiny: dataEvo.sprites.front_shiny,
            evolueEn: infosEvo.evolueEn,
            evolueNiveau: infosEvo.evolueNiveau,
          }
        }
        const maj = {
          evolueEn: infos.evolueEn ?? pkm.evolueEn ?? null,
          evolueNiveau: infos.evolueNiveau ?? pkm.evolueNiveau ?? null,
          evolutionsPierre: infos.evolutionsPierre || [],
          formeEvoluee: formeEvoluee ?? null,
          evoV2: true,
        }
        capturesRef.current = capturesRef.current.map((p) => (p.uid === pkm.uid ? { ...p, ...maj } : p))
        setCaptures(capturesRef.current)
      } catch (err) {
        capturesRef.current = capturesRef.current.map((p) => (p.uid === pkm.uid ? { ...p, evoV2: true } : p))
      }
      await new Promise((r) => setTimeout(r, 120))
    }
  }

  function appliquerEvolution(poke) {
    const fe = poke.formeEvoluee
    if (!fe) return poke
    const base = {
      uid: poke.uid,
      nom: fe.nom,
      id: fe.id,
      pvBase: fe.pvBase,
      attaqueBase: fe.attaqueBase,
      vitesseBase: fe.vitesseBase,
      defBase: fe.defBase ?? poke.defBase ?? 50,
      types: fe.types,
      sprite: poke.shiny && fe.spriteShiny ? fe.spriteShiny : (fe.spriteNormal ?? fe.sprite),
      spriteNormal: fe.spriteNormal ?? fe.sprite,
      spriteShiny: fe.spriteShiny ?? null,
      shiny: poke.shiny ?? false,
      iv: poke.iv,
      niveau: poke.niveau,
      xp: poke.xp,
      evolueEn: fe.evolueEn,
      evolueNiveau: fe.evolueNiveau,
      evolutionsPierre: [],
      formeEvoluee: null,
      estEvolution: true,
      familleId: poke.familleId ?? null,
    }
    base.role = poke.roleForce || poke.role || determinerRole(base)
    base.roleForce = poke.roleForce
    base.passifChoisi = poke.passifChoisi
    base.jokerCase = poke.jokerCase
    base.objetEquipe = poke.objetEquipe
    base.passif = determinerPassif(base)
    return { ...base, ...statsFinales(base, BONUS_STAT_NIVEAU) }
  }

  async function completerEvolution(uid, evolueEn) {
    try {
      const repEvo = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(evolueEn)}`)
      const dataEvo = await repEvo.json()
      const infosEvo = await chargerInfosEspece(dataEvo.id)
      const formeEvoluee = {
        nom: dataEvo.name,
        id: dataEvo.id,
        ...statsBaseDepuis(dataEvo),
        types: dataEvo.types.map((t) => t.type.name),
        sprite: dataEvo.sprites.front_default,
        spriteNormal: dataEvo.sprites.front_default,
        spriteShiny: dataEvo.sprites.front_shiny,
        evolueEn: infosEvo.evolueEn,
        evolueNiveau: infosEvo.evolueNiveau,
      }
      setCaptures((liste) => liste.map((p) => (p.uid === uid ? { ...p, formeEvoluee } : p)))
    } catch (err) {
    }
  }

  async function evoluerParPierre(uid, evolueEn, pierre) {
    if (!pierres[pierre] || pierres[pierre] <= 0) return
    try {
      const repEvo = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(evolueEn)}`)
      const dataEvo = await repEvo.json()

      const pokeAvant = capturesRef.current.find((p) => p.uid === uid)
      const shinyVise = pokeAvant?.shiny ?? false
      const dejaPossede = capturesRef.current.some(
        (p) => p.uid !== uid && p.id === dataEvo.id && (p.shiny ?? false) === shinyVise
      )
      if (dejaPossede) {
        ajouterAuJournal(`Tu possèdes déjà ${dataEvo.name} — évolution annulée (pierre conservée).`, 'info')
        return
      }

      const infosEvo = await chargerInfosEspece(dataEvo.id)
      setPierres((p) => ({ ...p, [pierre]: p[pierre] - 1 }))
      let pokeShiny = false
      setCaptures((liste) =>
        liste.map((poke) => {
          if (poke.uid !== uid) return poke
          pokeShiny = poke.shiny ?? false
          const base = {
            uid: poke.uid,
            nom: dataEvo.name,
            id: dataEvo.id,
            ...statsBaseDepuis(dataEvo),
            types: dataEvo.types.map((t) => t.type.name),
            sprite: poke.shiny && dataEvo.sprites.front_shiny ? dataEvo.sprites.front_shiny : dataEvo.sprites.front_default,
            spriteNormal: dataEvo.sprites.front_default,
            spriteShiny: dataEvo.sprites.front_shiny,
            shiny: poke.shiny ?? false,
            iv: poke.iv,
            niveau: poke.niveau,
            xp: poke.xp,
            evolueEn: infosEvo.evolueEn,
            evolueNiveau: infosEvo.evolueNiveau,
            evolutionsPierre: infosEvo.evolutionsPierre || [],
            formeEvoluee: null,
            estEvolution: true,
            familleId: poke.familleId ?? infosEvo.familleId ?? null,
          }
          base.role = poke.roleForce || poke.role || determinerRole(base)
          base.roleForce = poke.roleForce
          base.passifChoisi = poke.passifChoisi
          base.jokerCase = poke.jokerCase
          base.objetEquipe = poke.objetEquipe
          base.passif = determinerPassif(base)
          return { ...base, ...statsFinales(base, BONUS_STAT_NIVEAU) }
        })
      )
      ajouterAuJournal(`💎 ${evolueEn} obtenu par évolution !`, 'victoire')
      marquerVu(dataEvo.id)
      if (pokeShiny) marquerShiny(dataEvo.id)
    } catch (err) {
      console.error('Erreur évolution pierre :', err)
    }
  }

  function distribuerXP(xpTotale) {
    const messages = []
    const idsEquipe = equipeIdsRef.current
    const collectionActuelle = capturesRef.current

    const membres = idsEquipe
      .map((uid) => collectionActuelle.find((p) => p.uid === uid))
      .filter(Boolean)
    const niveauMoyen = membres.length > 0
      ? membres.reduce((s, p) => s + (p.niveau || 1), 0) / membres.length
      : 1

    function poidsRattrapage(niv) {
      if (niv >= niveauMoyen) return 1
      const ratio = niveauMoyen / Math.max(1, niv)
      return Math.min(2, ratio)
    }

    const totalPoids = membres.reduce((s, p) => s + poidsRattrapage(p.niveau || 1), 0) || 1
    const partParUid = {}
    membres.forEach((p) => {
      partParUid[p.uid] = Math.round(xpTotale * poidsRattrapage(p.niveau || 1) / totalPoids)
    })

    setCaptures((collection) =>
      collection.map((poke) => {
        if (!idsEquipe.includes(poke.uid)) return poke
        const partBase = partParUid[poke.uid] ?? Math.round(xpTotale / 6)
        const part = Math.round(partBase * bonusXpObjet(poke))
        const { pokemon, niveauxGagnes } = ajouterXP(poke, part, XP_BASE_NIVEAU, BONUS_STAT_NIVEAU)
        let pkm = {
          ...pokemon,
          uid: poke.uid,
          evolueEn: pokemon.evolueEn ?? poke.evolueEn ?? null,
          evolueNiveau: pokemon.evolueNiveau ?? poke.evolueNiveau ?? null,
          evolutionsPierre: pokemon.evolutionsPierre ?? poke.evolutionsPierre ?? [],
          formeEvoluee: pokemon.formeEvoluee ?? poke.formeEvoluee ?? null,
          estEvolution: pokemon.estEvolution ?? poke.estEvolution ?? false,
          familleId: pokemon.familleId ?? poke.familleId ?? null,
          shiny: pokemon.shiny ?? poke.shiny ?? false,
          spriteNormal: pokemon.spriteNormal ?? poke.spriteNormal ?? null,
          spriteShiny: pokemon.spriteShiny ?? poke.spriteShiny ?? null,
        }
        if (niveauxGagnes > 0) {
          messages.push(`${pkm.nom} monte niveau ${pkm.niveau} ! 📈`)
          if (pkm.evolueEn && pkm.evolueNiveau && pkm.niveau >= pkm.evolueNiveau && pkm.formeEvoluee) {
            const ancienNom = pkm.nom
            pkm = appliquerEvolution(pkm)
            messages.push(`✨ ${ancienNom} évolue en ${pkm.nom} !`)
            const nouvelId = pkm.id
            const estShiny = pkm.shiny
            setTimeout(() => { marquerVu(nouvelId); if (estShiny) marquerShiny(nouvelId) }, 0)
            if (pkm.evolueEn) {
              const uidEvo = pkm.uid
              const prochaineEvo = pkm.evolueEn
              setTimeout(() => completerEvolution(uidEvo, prochaineEvo), 0)
            }
          }
        }
        return pkm
      })
    )
    messages.forEach((m) => ajouterAuJournal(m, 'victoire'))
  }

  function ballAuto(rarete) {
    const stocks = ballsRef.current
    const ideale = BALL_AUTO_PAR_RARETE[rarete] || 'poke'
    const ordre = ['master', 'hyper', 'super', 'poke']
    const indexIdeal = ordre.indexOf(ideale)
    for (let i = indexIdeal; i < ordre.length; i++) {
      if (stocks[ordre[i]] > 0) return ordre[i]
    }
    return null
  }

  // Clé d'identification d'une cible Master Ball : espèce + statut shiny.
  function cleCible(ennemi) {
    return `${ennemi.id}${ennemi.shiny ? '-shiny' : ''}`
  }

  // Le joueur (dé)marque un ennemi cliqué en combat pour la Master Ball.
  // Cible l'espèce + le statut shiny ; persiste jusqu'à capture réussie.
  // On stocke un objet {cle, id, nom, sprite, shiny} pour pouvoir afficher le sprite dans le panneau.
  function basculerCibleMasterBall(ennemi) {
    if (!ennemi || ennemi.estBoss || ennemi.estEvolution) return
    const cle = cleCible(ennemi)
    const dejaCiblee = ciblesMasterBallRef.current.some((c) => c.cle === cle)
    setCiblesMasterBall((liste) => {
      const maj = dejaCiblee
        ? liste.filter((c) => c.cle !== cle)
        : [...liste, {
            cle,
            id: ennemi.id,
            nom: ennemi.nom,
            shiny: ennemi.shiny ?? false,
            sprite: (ennemi.shiny && ennemi.spriteShiny) ? ennemi.spriteShiny : (ennemi.spriteNormal ?? ennemi.sprite),
          }]
      ciblesMasterBallRef.current = maj
      return maj
    })
    ajouterAuJournal(
      !dejaCiblee
        ? `⚫ ${ennemi.nom}${ennemi.shiny ? ' ✨' : ''} ciblé pour la Master Ball.`
        : `${ennemi.nom} n'est plus ciblé Master Ball.`,
      'info'
    )
  }

  function categorieEnnemi(ennemi) {
    if (ennemi.shiny === true) return 'shiny'
    if ((ennemi.rarete || 'commun') === 'legendaire') return 'legendaire'
    const aDejaEspece = capturesRef.current.some((p) => p.id === ennemi.id)
    return aDejaEspece ? 'doublon' : 'nouveau'
  }

  function choisirBall(ennemi) {
    const regles = reglesCaptureRef.current
    const categorie = categorieEnnemi(ennemi)
    const regle = regles[categorie] || 'auto'
    if (regle === 'rien') return 'rien'
    const rarete = ennemi.rarete || 'commun'
    if (regle === 'auto') return ballAuto(rarete)
    const stocks = ballsRef.current
    if (stocks[regle] > 0) return regle
    return ballAuto(rarete)
  }

  function tenterCapture(indexEnnemi) {
    const ennemi = equipeEnnemieRef.current[indexEnnemi]
    if (!ennemi) return
    if (ennemi.estBoss) return
    if (ennemi.estEvolution) return

    const estShiny = ennemi.shiny === true
    const aDejaShiny = pokedexShinyRef.current.includes(ennemi.id)
    if (estShiny && aDejaShiny) return

    // Cette espèce est-elle ciblée pour la Master Ball (clic du joueur) ?
    const cle = cleCible(ennemi)
    const estCibleeMasterBall = ciblesMasterBallRef.current.some((c) => c.cle === cle)

    // --- Anti-spam : limite de tentatives par espèce et par combat ---
    // (ne s'applique PAS si l'espèce est ciblée Master Ball : on veut la capturer à coup sûr)
    const limite = reglesCaptureRef.current.limiteBalls ?? 5
    if (!estCibleeMasterBall && limite !== 'infini' && Number.isFinite(limite)) {
      const dejaTente = tentativesParEspeceRef.current[ennemi.id] || 0
      if (dejaTente >= limite) return // on a assez essayé sur cette espèce ce combat
    }

    // Choix de la ball : Master Ball forcée si l'espèce est ciblée, sinon règles normales.
    let ball
    if (estCibleeMasterBall) {
      if ((ballsRef.current.master || 0) > 0) {
        ball = 'master'
      } else {
        // Plus de Master Ball : on retombe sur les règles normales (et on prévient).
        ball = choisirBall(ennemi)
      }
    } else {
      ball = choisirBall(ennemi)
    }
    if (ball === 'rien') return
    if (!ball) {
      journalFuite()
      return
    }

    // Incrémente le compteur de tentatives pour cette espèce (sauf cible Master Ball).
    if (!estCibleeMasterBall) {
      tentativesParEspeceRef.current[ennemi.id] = (tentativesParEspeceRef.current[ennemi.id] || 0) + 1
    }

    const rarete = ennemi.rarete || 'commun'
    setBalls((b) => ({ ...b, [ball]: b[ball] - 1 }))
    ballsRef.current = { ...ballsRef.current, [ball]: ballsRef.current[ball] - 1 }

    const tauxBase = TAUX_CAPTURE_RARETE[rarete] ?? 0.5
    const multi = BALLS[ball].multi
    const bonusCapture = multiplicateur(ameliorationsRef.current, 'dressage')
    const reussite = estShiny ? true : (multi === Infinity ? true : Math.random() < tauxBase * multi * bonusCapture)

    if (!reussite) {
      ajouterAuJournal(`${ennemi.nom} s'est échappé ! 💨 (${BALLS[ball].emoji})`, 'echec')
      return
    }

    // Capture réussie : si l'espèce était ciblée Master Ball, on retire le marquage.
    if (estCibleeMasterBall) {
      setCiblesMasterBall((liste) => {
        const maj = liste.filter((c) => c.cle !== cle)
        ciblesMasterBallRef.current = maj
        return maj
      })
    }

    const familleCible = ennemi.familleId ?? null
    const memeFamille = (p) =>
      familleCible != null ? p.familleId === familleCible : p.id === ennemi.id

    // On possède déjà au moins un membre de la famille dans le bon statut (shiny voulu) ?
    const existantMemeStatut = capturesRef.current.find(
      (p) => memeFamille(p) && (p.shiny ?? false) === (ennemi.shiny ?? false)
    )
    // On possède au moins un membre de la famille (peu importe le statut shiny) ?
    const familleEnCollection = capturesRef.current.some((p) => memeFamille(p))

    // CAS 1 : shiny capturé alors qu'on a la famille en non-shiny → toute la famille devient shiny.
    if (ennemi.shiny && familleEnCollection && !existantMemeStatut) {
      ajouterAuJournal(`${ennemi.nom} ✨ SHINY capturé ! Toute la famille passe en doré ! 🎉`, 'capture')
      marquerVu(ennemi.id)
      marquerShiny(ennemi.id)
      // Marque aussi au Pokédex shiny toutes les espèces de la famille déjà possédées.
      const idsFamille = new Set(capturesRef.current.filter((p) => memeFamille(p)).map((p) => p.id))
      idsFamille.forEach((id) => { marquerVu(id); marquerShiny(id) })
      montrerCapture(ennemi)
      const majListe = capturesRef.current.map((p) => {
        if (!memeFamille(p)) return p
        // Chaque membre garde SON propre sprite shiny (Dardargnan → shiny de Dardargnan).
        const spriteShinyMembre = p.spriteShiny ?? (p.id === ennemi.id ? ennemi.spriteShiny : null) ?? p.sprite
        const maj = {
          ...p,
          shiny: true,
          iv: fusionnerIV(p.iv, ennemi.iv),
          sprite: spriteShinyMembre,
          spriteShiny: p.spriteShiny ?? (p.id === ennemi.id ? ennemi.spriteShiny : p.spriteShiny),
          spriteNormal: p.spriteNormal ?? (p.id === ennemi.id ? ennemi.spriteNormal : p.sprite),
        }
        return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
      })
      capturesRef.current = majListe
      setCaptures(majListe)
      return
    }

    // CAS 2 : on ne possède pas encore ce statut pour la famille → nouvelle entrée.
    if (!existantMemeStatut) {
      const messageShiny = ennemi.shiny ? ' ✨ SHINY !' : ''
      ajouterAuJournal(`${ennemi.nom} capturé ! 🎉${messageShiny} ${BALLS[ball].emoji} (IV: ${ennemi.iv.pv}/${ennemi.iv.attaque}/${ennemi.iv.vitesse})`, 'capture')
      marquerVu(ennemi.id)
      if (ennemi.shiny) marquerShiny(ennemi.id)
      montrerCapture(ennemi)
      const nouvelUidCapture = nouvelUid()
      const captureBase = {
        uid: nouvelUidCapture,
        nom: ennemi.nom, id: ennemi.id,
        pvBase: ennemi.pvBase, attaqueBase: ennemi.attaqueBase, vitesseBase: ennemi.vitesseBase,
        defBase: ennemi.defBase ?? 50,
        types: ennemi.types, sprite: ennemi.sprite, iv: ennemi.iv,
        spriteNormal: ennemi.spriteNormal ?? ennemi.sprite,
        spriteShiny: ennemi.spriteShiny ?? null,
        shiny: ennemi.shiny ?? false,
        rarete: ennemi.rarete ?? 'commun',
        niveau: 1, xp: 0,
        evolueEn: ennemi.evolueEn ?? null,
        evolueNiveau: ennemi.evolueNiveau ?? null,
        evolutionsPierre: ennemi.evolutionsPierre ?? [],
        formeEvoluee: null,
        estEvolution: ennemi.estEvolution ?? false,
        familleId: ennemi.familleId ?? null,
      }
      const nouveau = { ...captureBase, ...statsFinales(captureBase, BONUS_STAT_NIVEAU) }
      capturesRef.current = [...capturesRef.current, nouveau]
      setCaptures((liste) => [...liste, nouveau])
      if (ennemi.evolueEn) {
        setTimeout(() => completerEvolution(nouvelUidCapture, ennemi.evolueEn), 0)
      }
      return
    }

    // CAS 3 : on possède déjà ce statut → on améliore les IV de la famille (même statut).
    {
      let auMoinsUnAmeliore = false
      const majListe = capturesRef.current.map((p) => {
        if (!memeFamille(p) || (p.shiny ?? false) !== (ennemi.shiny ?? false)) return p
        const nouveauxIV = fusionnerIV(p.iv, ennemi.iv)
        if (JSON.stringify(nouveauxIV) !== JSON.stringify(p.iv)) auMoinsUnAmeliore = true
        const maj = { ...p, iv: nouveauxIV }
        return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
      })
      ajouterAuJournal(
        auMoinsUnAmeliore ? `${ennemi.nom} : IV de la famille améliorés ! ✨` : `${ennemi.nom} capturé (pas mieux).`,
        'capture'
      )
      capturesRef.current = majListe
      setCaptures(majListe)
    }
  }

  async function lancerCombatSuivant() {
    try {
      const route = routeParId(routeActiveRef.current)
      const victoiresZone = (victoiresParRouteRef.current[route.id] || 0)
      const reduc = niveauAmelioration(ameliorationsRef.current, 'strategie')
      const dejaVaincu = !!bossVaincusRef.current[route.id]
      // 1er boss à 25 victoires (moins réduction stratégie). Ensuite, refarm tous les 250.
      const seuil = dejaVaincu
        ? COMBATS_REFARM_BOSS
        : Math.max(10, COMBATS_AVANT_BOSS - reduc)
      const cestLeBoss = victoiresZone >= seuil

      let nouveaux
      if (cestLeBoss) {
        let boss = null
        try {
          boss = await chargerBoss(route)
        } catch (err) {
          console.warn('Échec chargement boss, repli sur combat normal.', err)
          boss = null
        }
        if (boss) {
          nouveaux = [boss]
          setCombatBoss(true)
          combatBossRef.current = true
          ajouterAuJournal(`⚠️ BOSS : ${boss.nom} ✨ apparaît ! Préparez-vous !`, 'echec')
        } else {
          nouveaux = await chargerEquipeEnnemie(route)
          setCombatBoss(false)
          combatBossRef.current = false
        }
      } else {
        nouveaux = await chargerEquipeEnnemie(route)
        setCombatBoss(false)
        combatBossRef.current = false
      }

      if (!nouveaux || nouveaux.length === 0) {
        console.warn('Équipe ennemie vide, nouvelle tentative de combat normal.')
        nouveaux = await chargerEquipeEnnemie(route)
        setCombatBoss(false)
        combatBossRef.current = false
      }

      setEquipeEnnemie(nouveaux)
      equipeEnnemieRef.current = nouveaux
      tentativesParEspeceRef.current = {} // reset anti-spam à chaque nouveau combat
      debutCombatRef.current = Date.now()
      ultimeLanceRef.current = [false, false, false, false, false, false]
      ultimeLanceEnnemiRef.current = [false, false, false, false, false, false, false]
      setUltimeLanceJoueur([false, false, false, false, false, false])
      setUltimeLanceEnnemiAff([false, false, false, false, false, false, false])
      bouclierTicsRef.current = 0
      bouclierTicsEnnemiRef.current = 0
      const pvE = nouveaux.map((p) => p.pvMax)
      const jE = nouveaux.map(() => 0)
      const eq = equipeIds.map((uid) => capturesRef.current.find((p) => p.uid === uid)).filter(Boolean)
      const pvJ = eq.map((p) => p.pvMax)
      const jJ = eq.map(() => 0)
      setPvJoueur(pvJ); setJaugeJoueur(jJ)
      etat.current = { pvJ, jJ, pvE, jE }
      setPvEnnemis(pvE); setJaugeEnnemis(jE)
    } catch (err) {
      console.error('Erreur dans lancerCombatSuivant :', err)
    } finally {
      transitionEnCours.current = false
    }
  }
  lancerCombatSuivantRef.current = lancerCombatSuivant

  useEffect(() => {
    async function init() {
      try {
        const sauvegarde = localStorage.getItem(CLE_SAUVEGARDE)
        if (sauvegarde) {
          const data = JSON.parse(sauvegarde)
          const capturesRecalc = (data.captures || []).map((p) =>
            p ? { ...p, iv: normaliserIV(p.iv), role: determinerRole(p), passif: determinerPassif(p) } : p
          )
          // Recalcule les stats finales après normalisation des IV (la défense a maintenant un IV).
          for (let i = 0; i < capturesRecalc.length; i++) {
            const p = capturesRecalc[i]
            if (p) capturesRecalc[i] = { ...p, ...statsFinales(p, BONUS_STAT_NIVEAU) }
          }
          // Limite 2 exemplaires/objet : déséquipe les excédentaires et rend les objets au stock.
          const stockObjets = { ...(data.objets || {}) }
          const compteObjet = {}
          let nbDesequipes = 0
          for (let i = 0; i < capturesRecalc.length; i++) {
            const p = capturesRecalc[i]
            if (!p || !p.objetEquipe) continue
            const id = p.objetEquipe
            compteObjet[id] = (compteObjet[id] || 0) + 1
            if (compteObjet[id] > 2) {
              capturesRecalc[i] = { ...p, objetEquipe: null }
              stockObjets[id] = (stockObjets[id] || 0) + 1
              nbDesequipes += 1
            }
          }
          data.captures = capturesRecalc

          // Passe rétroactive shiny : si une espèce d'une famille est shiny,
          // tous les membres possédés de cette famille deviennent shiny aussi.
          const cleFamille = (p) => (p.familleId != null ? `f${p.familleId}` : `i${p.id}`)
          const famillesShiny = new Set()
          for (const p of capturesRecalc) {
            if (p && p.shiny) famillesShiny.add(cleFamille(p))
          }
          let nbShinyRattrapes = 0
          const idsShinyRattrapes = new Set()
          if (famillesShiny.size > 0) {
            for (let i = 0; i < capturesRecalc.length; i++) {
              const p = capturesRecalc[i]
              if (!p || p.shiny) continue
              if (famillesShiny.has(cleFamille(p))) {
                const spriteShinyMembre = p.spriteShiny ?? p.sprite
                const maj = {
                  ...p,
                  shiny: true,
                  sprite: spriteShinyMembre,
                  spriteNormal: p.spriteNormal ?? p.sprite,
                }
                capturesRecalc[i] = { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
                idsShinyRattrapes.add(p.id)
                nbShinyRattrapes += 1
              }
            }
          }
          data.captures = capturesRecalc

          setCaptures(capturesRecalc)
          setEquipeIds(trierIdsParRole(data.equipeIds || [], capturesRecalc))
          setPokedexVus(data.pokedexVus || [])
          if (data.pokedexSpeciaux) setPokedexSpeciaux(data.pokedexSpeciaux)
          // Complète le Pokédex shiny avec les espèces rattrapées.
          {
            const baseShiny = data.pokedexShiny || []
            const fusion = new Set(baseShiny)
            idsShinyRattrapes.forEach((id) => fusion.add(id))
            setPokedexShiny([...fusion])
          }
          if (nbShinyRattrapes > 0) {
            setTimeout(() => ajouterAuJournal(`✨ ${nbShinyRattrapes} Pokémon de familles shiny mis à jour en doré.`, 'capture'), 1800)
          }
          setVaincus(data.vaincus || 0)
          setPokeDollars(data.pokeDollars || 0)
          setBalls(data.balls || { poke: 0, super: 0, hyper: 0, master: 0 })
          setPierres(data.pierres || {})
          setBonbons(data.bonbons || {})
          setObjets(stockObjets)
          if (nbDesequipes > 0) {
            setTimeout(() => ajouterAuJournal(`${nbDesequipes} objet(s) en double déséquipé(s) (limite : 2 par objet). Rendus au sac.`, 'info'), 1500)
          }
          if (data.objetsBoss) setObjetsBoss({ rouage: 0, cristal: 0, relique: 0, iv_pv: 0, iv_attaque: 0, iv_vitesse: 0, iv_defense: 0, ...data.objetsBoss })
          if (data.parchemins) setParchemins(data.parchemins)
          setAchatsItems(data.achatsItems || {})
          setRecompensesReclamees(data.recompensesReclamees || [])
          if (typeof data.medailles === 'number') setMedailles(data.medailles)
          if (data.investisPrestige) setInvestisPrestige(data.investisPrestige)
          if (data.equipeAreneIds) setEquipeAreneIds(data.equipeAreneIds)
          if (data.raidsCooldowns) setRaidsCooldowns(data.raidsCooldowns)
          if (data.equipeRaidIds) setEquipeRaidIds(data.equipeRaidIds)
          if (Array.isArray(data.reserveOeufs)) setReserveOeufs(data.reserveOeufs)
          if (typeof data.jetonsElevage === 'number') setJetonsElevage(data.jetonsElevage)
          if (Array.isArray(data.oeufsIncubes)) {
            const slots = Array(NB_INCUBATEURS).fill(null)
            data.oeufsIncubes.forEach((o, i) => { if (i < NB_INCUBATEURS) slots[i] = o || null })
            setOeufsIncubes(slots)
          }
          if (data.equipeDefenseIds) setEquipeDefenseIds(data.equipeDefenseIds)
          if (data.equipeAttaqueIds) setEquipeAttaqueIds(data.equipeAttaqueIds)
          if (data.tutoVu) setTutoVu(true)
          if (data.dresseursVaincus && !Array.isArray(data.dresseursVaincus)) {
            setDresseursVaincus(data.dresseursVaincus)
          }
          // Si l'interrupteur est désactivé, on charge TOUJOURS l'histoire (zéro reset).
          const histoireDejaReset = !RESET_HISTOIRE_ACTIF || data.resetHistoire === VERSION_RESET_HISTOIRE
          setVictoiresParRoute(histoireDejaReset ? (data.victoiresParRoute || {}) : {})
          setBossVaincus(histoireDejaReset ? (data.bossVaincus || {}) : {})
          setSuccesDebloques(data.succesDebloques || [])
          setAmeliorations(data.ameliorations || {})
          ameliorationsRef.current = data.ameliorations || {}
          bonusShinyGlobal = multiplicateur(data.ameliorations || {}, 'chroma')
          if (data.vitesse) setVitesse(data.vitesse)
          if (data.reglesCapture) {
            const rc = { limiteBalls: 5, ...data.reglesCapture }
            setReglesCapture(rc); reglesCaptureRef.current = rc
          }
          if (data.ciblesMasterBall) {
            // Migration : anciennes saves stockaient des chaînes ("143-shiny") ; on passe aux objets.
            const cibles = data.ciblesMasterBall
              .map((c) => {
                if (typeof c === 'string') {
                  const shiny = c.endsWith('-shiny')
                  const id = parseInt(c, 10)
                  return { cle: c, id, nom: `#${id}`, shiny, sprite: null }
                }
                return c
              })
              .filter((c) => c && c.cle)
            setCiblesMasterBall(cibles); ciblesMasterBallRef.current = cibles
          }
          if (histoireDejaReset && data.routeActive) {
            setRouteActive(data.routeActive); routeActiveRef.current = data.routeActive
          } else {
            setRouteActive('tutoriel'); routeActiveRef.current = 'tutoriel'
          }
          capturesRef.current = data.captures || []
          victoiresParRouteRef.current = histoireDejaReset ? (data.victoiresParRoute || {}) : {}
          bossVaincusRef.current = histoireDejaReset ? (data.bossVaincus || {}) : {}
          ajouterAuJournal('Partie chargée. 💾', 'info')

          const eq = (data.equipeIds || []).map((uid) => (data.captures || []).find((p) => p.uid === uid)).filter(Boolean)
          const pvJ = eq.map((p) => p.pvMax)
          const jJ = eq.map(() => 0)
          setPvJoueur(pvJ); setJaugeJoueur(jJ)

          const routeInit = routeParId(routeActiveRef.current)
          const ennemis = await chargerEquipeEnnemie(routeInit)
          setEquipeEnnemie(ennemis)
          const pvE = ennemis.map((p) => p.pvMax)
          const jE = ennemis.map(() => 0)
          setPvEnnemis(pvE); setJaugeEnnemis(jE)

          etat.current = { pvJ, jJ, pvE, jE }
          setChargement(false)
          setPartieChargee(true)
          setTimeout(() => { reparerEvolutionsSave() }, 2500)
        } else {
          setChoixStarterRequis(true)
          setChargement(false)
        }
      } catch (err) {
        console.error('Erreur init :', err)
        setChargement(false)
      }
    }
    init()
  }, [])

  const donneesSauvegardeRef = useRef(null)
  useEffect(() => {
    if (!partieChargee || captures.length === 0) return
    const data = { resetHistoire: VERSION_RESET_HISTOIRE, captures, equipeIds, pokedexVus, pokedexShiny, pokedexSpeciaux, vaincus, pokeDollars, balls, pierres, bonbons, objets, objetsBoss, parchemins, achatsItems, recompensesReclamees, medailles, investisPrestige, equipeAreneIds, equipeDefenseIds, equipeAttaqueIds, dresseursVaincus, routeActive, victoiresParRoute, bossVaincus, succesDebloques, ameliorations, vitesse, reglesCapture, ciblesMasterBall, tutoVu, raidsCooldowns, equipeRaidIds, reserveOeufs, oeufsIncubes, jetonsElevage }
    donneesSauvegardeRef.current = data
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(data))
  }, [partieChargee, captures, equipeIds, pokedexVus, pokedexShiny, pokedexSpeciaux, vaincus, pokeDollars, balls, pierres, bonbons, objets, objetsBoss, parchemins, achatsItems, recompensesReclamees, medailles, investisPrestige, equipeAreneIds, equipeDefenseIds, equipeAttaqueIds, dresseursVaincus, routeActive, victoiresParRoute, bossVaincus, succesDebloques, ameliorations, vitesse, reglesCapture, ciblesMasterBall, tutoVu, raidsCooldowns, equipeRaidIds])

  // Détection de nouvelle version déployée : recharge automatiquement la page.
  // Lit public/version.json toutes les 5 min ; si le numéro a changé, sauvegarde puis reload.
  // Évite de recharger en plein combat de boss ou en mode arène (frustrant).
  useEffect(() => {
    let versionInitiale = null
    let arrete = false

    async function lireVersion() {
      try {
        const rep = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' })
        if (!rep.ok) return null
        const j = await rep.json()
        return j && j.version != null ? String(j.version) : null
      } catch {
        return null
      }
    }

    async function verifier() {
      if (arrete) return
      const v = await lireVersion()
      if (!v) return
      if (versionInitiale === null) {
        versionInitiale = v
        return
      }
      if (v !== versionInitiale) {
        // Ne pas couper un combat de boss ou une session d'arène.
        if (combatBossRef.current || modeJeuRef.current === 'arene') return
        // Sauvegarde de sécurité avant le reload.
        try {
          if (donneesSauvegardeRef.current) {
            localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(donneesSauvegardeRef.current))
          }
        } catch {}
        arrete = true
        window.location.reload()
      }
    }

    verifier() // lecture initiale (mémorise la version courante)
    const id = setInterval(verifier, 5 * 60 * 1000)
    return () => { arrete = true; clearInterval(id) }
  }, [])

  function statsClassement() {
    const nbShiny = captures.filter((p) => p.shiny).length
    const nbZones = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    return {
      pokemonCaptures: pokedexVus.length,
      nbShiny,
      zones: nbZones,
      scorePvp: 0,
      rangPvp: 'Non classé',
    }
  }

  const statsClassementRef = useRef(statsClassement())
  useEffect(() => {
    statsClassementRef.current = statsClassement()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captures, pokedexVus, bossVaincus])

  const dernierEnvoiScore = useRef(0)
  function envoyerScoreThrottle(forcer = false) {
    if (!identiteJoueur) return
    const maintenant = Date.now()
    if (!forcer && maintenant - dernierEnvoiScore.current < 15000) return
    dernierEnvoiScore.current = maintenant
    envoyerScore(statsClassementRef.current)
  }
  const envoyerScoreThrottleRef = useRef(envoyerScoreThrottle)
  useEffect(() => { envoyerScoreThrottleRef.current = envoyerScoreThrottle })

  useEffect(() => {
    if (!partieChargee || !identiteJoueur) return
    envoyerScore(statsClassementRef.current)
    dernierEnvoiScore.current = Date.now()
    const horloge = setInterval(() => {
      envoyerScore(statsClassementRef.current)
      dernierEnvoiScore.current = Date.now()
    }, 120000)
    return () => clearInterval(horloge)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partieChargee, identiteJoueur])

  useEffect(() => {
    if (vueOuverte === 'classement' && identiteJoueur) {
      envoyerScore(statsClassementRef.current)
      dernierEnvoiScore.current = Date.now()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vueOuverte])

  useEffect(() => {
    if (chargement) return

    let dernierTic = Date.now()
    let respawnA = 0 // timestamp auquel relancer le combat (0 = pas de respawn en attente)

    const horloge = creerHorloge(() => {
      const maintenant = Date.now()

      // Respawn différé géré par horodatage (pas de setTimeout, non throttlé).
      if (respawnA > 0 && maintenant >= respawnA) {
        respawnA = 0
        lancerCombatSuivant()
        dernierTic = Date.now()
        return
      }
      if (respawnA > 0) return

      // Cadence d'un tic de combat selon la vitesse et la frénésie.
      const intervalleCombat = VITESSE_COMBAT / (vitesse * multiplicateur(ameliorationsRef.current, 'frenesie'))
      if (maintenant - dernierTic < intervalleCombat) return
      dernierTic = maintenant

      if (transitionEnCours.current) return
      if (modeJeuRef.current === 'arene') return
      if (modeJeuRef.current === 'raid') return
      const bonusPuissance = multiplicateur(ameliorationsRef.current, 'puissance')
      let equipeJoueur = equipeIdsRef.current
        .map((uid) => capturesRef.current.find((p) => p.uid === uid))
        .filter(Boolean)
        .map((p) => bonusPuissance === 1 ? p : {
          ...p,
          pvMax: Math.round(p.pvMax * bonusPuissance),
          attaque: Math.round(p.attaque * bonusPuissance),
        })
      equipeJoueur = preparerEquipe(equipeJoueur, 'principal')
      equipeJoueur = appliquerBonusEquipe(equipeJoueur)
      const equipeEnnemie = equipeEnnemieRef.current
      if (equipeJoueur.length === 0 || equipeEnnemie.length === 0) return
      if (!compositionValideRef.current) return
      if (debutCombatRef.current === 0) debutCombatRef.current = Date.now()
      let e = etat.current
      if (e.pvJ.length !== equipeJoueur.length) {
        const pvJ = equipeJoueur.map((p) => p.pvMax)
        const jJ = equipeJoueur.map(() => 0)
        e = { ...e, pvJ, jJ }
        etat.current = e
      }
      if (e.pvE.length !== equipeEnnemie.length) {
        const pvE = equipeEnnemie.map((p) => p.pvMax)
        const jE = equipeEnnemie.map(() => 0)
        e = { ...e, pvE, jE }
        etat.current = e
      }
      const tempsEcoule = debutCombatRef.current > 0 ? (Date.now() - debutCombatRef.current) : 0
      if (tempsEcoule >= DELAI_ULTIME_MS) {
        const lances = ultimeLanceRef.current
        let majJoueur = false
        for (let k = 0; k < equipeJoueur.length; k++) {
          if (!lances[k] && equipeJoueur[k] && e.pvJ[k] > 0) {
            const ult = ultimeDuRole(equipeJoueur[k].role || 'dps')
            const res = appliquerUltime(k, ult, equipeJoueur, e.pvJ, e.jJ, equipeEnnemie, e.pvE)
            if (res.bouclierTics > 0) bouclierTicsRef.current = res.bouclierTics
            if (res.coups && res.coups.length) ajouterChiffres(res.coups)
            if (ult) ajouterAuJournal(`${ult.emoji} ${equipeJoueur[k].nom} déclenche ${ult.nom} !`, 'victoire')
            lances[k] = true
            majJoueur = true
          }
        }
        if (majJoueur) setUltimeLanceJoueur([...lances])

        const lancesE = ultimeLanceEnnemiRef.current
        let majEnnemi = false
        for (let k = 0; k < equipeEnnemie.length; k++) {
          if (!lancesE[k] && equipeEnnemie[k] && e.pvE[k] > 0) {
            const ultE = ultimeDuRole(equipeEnnemie[k].role || 'dps')
            const resE = appliquerUltime(k, ultE, equipeEnnemie, e.pvE, e.jE, equipeJoueur, e.pvJ, 'ennemi')
            if (resE.bouclierTics > 0) bouclierTicsEnnemiRef.current = resE.bouclierTics
            if (resE.coups && resE.coups.length) ajouterChiffres(resE.coups)
            if (ultE) ajouterAuJournal(`${ultE.emoji} ${equipeEnnemie[k].nom} (ennemi) déclenche ${ultE.nom} !`, 'echec')
            lancesE[k] = true
            majEnnemi = true
          }
        }
        if (majEnnemi) setUltimeLanceEnnemiAff([...lancesE])
      }

      const bouclierActif = bouclierTicsRef.current > 0
      const bouclierActifE = bouclierTicsEnnemiRef.current > 0
      const optionsTic = {
        bouclierJoueur: bouclierActif ? 0.5 : 0,
        bouclierEnnemi: bouclierActifE ? 0.5 : 0,
      }
      if (bouclierTicsRef.current > 0) bouclierTicsRef.current -= 1
      if (bouclierTicsEnnemiRef.current > 0) bouclierTicsEnnemiRef.current -= 1

      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, equipeEnnemie, e.pvE, e.jE, optionsTic)

      etat.current = { pvJ: r.pvJoueur, jJ: r.jaugeJoueur, pvE: r.pvEnnemis, jE: r.jaugeEnnemis }
      setPvJoueur(r.pvJoueur); setJaugeJoueur(r.jaugeJoueur)
      setPvEnnemis(r.pvEnnemis); setJaugeEnnemis(r.jaugeEnnemis)
      if (r.coups && r.coups.length) ajouterChiffres(r.coups)

      r.ennemisTombes.forEach((index) => {
        const ennemi = equipeEnnemieRef.current[index]
        if (ennemi) {
          const multi = MULTI_XP_RARETE[ennemi.rarete] || 1
          const eqJ = equipeIdsRef.current.map((id) => capturesRef.current[id]).filter(Boolean)
          const nivMoyEq = eqJ.length ? eqJ.reduce((s, p) => s + (p.niveau || 1), 0) / eqJ.length : 1
          const nivMoyEnn = equipeEnnemieRef.current.length
            ? equipeEnnemieRef.current.reduce((s, e) => s + (e.niveau || 1), 0) / equipeEnnemieRef.current.length
            : 1
          const multiSurcl = multiplicateurSurclassement(nivMoyEq, nivMoyEnn)
          const xp = XP_BASE_ENNEMI * (ennemi.niveau || 1) * multi * multiSurcl * multiplicateur(ameliorationsRef.current, 'mentor') * bonusCompletionXP * bonusPrestigeXP * bonusSuccesXP
          distribuerXP(xp)
        }
        tenterCapture(index)
      })

      if (r.resultat !== 'en_cours' && !transitionEnCours.current) {
        transitionEnCours.current = true
        if (r.resultat === 'victoire') {
          const routeGagnee = routeActiveRef.current
          if (combatBossRef.current) {
            const boss = equipeEnnemieRef.current[0]
            // Refarm ? (boss déjà vaincu une fois sur cette zone) → beaucoup moins de jetons.
            const bossDejaVaincu = !!bossVaincusRef.current[routeGagnee]
            const gainBoss = Math.round((boss?.niveau || 1) * 30 * multiplicateur(ameliorationsRef.current, 'fortune') * bonusCompletionArgent * bonusPrestigeArgent * bonusArgentObjets * bonusSuccesArgent)
            setPokeDollars((a) => a + gainBoss)
            setBossVaincus((b) => ({ ...b, [routeGagnee]: true }))
            // Reset du compteur de la zone : le prochain boss (refarm) revient après 250 combats.
            setVictoiresParRoute((v) => {
              const maj = { ...v, [routeGagnee]: 0 }
              victoiresParRouteRef.current = maj
              return maj
            })
            setAchatsItems((a) => {
              const reduit = {}
              for (const k in a) reduit[k] = Math.max(0, a[k] - 1)
              return reduit
            })
            const chanceBonbon = 0.10 * multiplicateur(ameliorationsRef.current, 'gourmandise')
            const bonbonsBoss = Math.random() < chanceBonbon ? 1 : 0
            if (bonbonsBoss > 0) {
              setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + bonbonsBoss }))
            }
            tirerObjetsBoss('zone')
            // Jetons d'élevage : 5 à la première victoire, 1 seulement au refarm (anti-spam).
            const jetonsGagnes = bossDejaVaincu ? 1 : JETONS_PAR_BOSS
            setJetonsElevage((j) => j + jetonsGagnes)
            if (boss) {
              ajouterAuJournal(`👑 BOSS VAINCU ! ${boss.nom} ✨ terrassé ! (+${gainBoss} 💰, +${jetonsGagnes} jeton${jetonsGagnes > 1 ? 's' : ''} d'élevage)`, 'victoire')
            }
            if (bonbonsBoss > 0) {
              ajouterAuJournal(`${BONBONS['super-bonbon'].emoji} Butin de boss : ${bonbonsBoss} ${BONBONS['super-bonbon'].nom} !`, 'capture')
            }
            ajouterAuJournal(`🔓 Zone suivante débloquée !`, 'victoire')
            setCombatBoss(false)
            combatBossRef.current = false
            // Mode auto zone : on avance vers la zone suivante débloquée.
            if (autoZoneRef.current) {
              const bossVaincusMaj = { ...bossVaincusRef.current, [routeGagnee]: true }
              const debloquees = ROUTES.filter((rt) => routeDebloquee(rt, bossVaincusMaj))
              const idxActuel = debloquees.findIndex((rt) => rt.id === routeGagnee)
              const suivante = idxActuel >= 0 ? debloquees[idxActuel + 1] : null
              if (suivante) {
                setRouteActive(suivante.id)
                routeActiveRef.current = suivante.id
                ajouterAuJournal(`➡️ Auto : direction ${suivante.nom} !`, 'info')
              } else {
                setAutoZone(false)
                autoZoneRef.current = false
                ajouterAuJournal(`🏁 Auto zone arrêté : dernière zone disponible atteinte.`, 'info')
              }
            }
            setTimeout(() => envoyerScoreThrottleRef.current(true), 0)
          } else {
            setVaincus((n) => n + 1)
            const gainBrut = equipeEnnemieRef.current.reduce((total, e) => {
              const m = MULTI_XP_RARETE[e.rarete] || 1
              return total + GAIN_BASE_ENNEMI * (e.niveau || 1) * m
            }, 0)
            const eqJoueur = equipeIdsRef.current.map((id) => capturesRef.current[id]).filter(Boolean)
            const nivMoyenJoueur = eqJoueur.length
              ? eqJoueur.reduce((s, p) => s + (p.niveau || 1), 0) / eqJoueur.length
              : 1
            const nivMoyenEnnemis = equipeEnnemieRef.current.length
              ? equipeEnnemieRef.current.reduce((s, e) => s + (e.niveau || 1), 0) / equipeEnnemieRef.current.length
              : 1
            const multiSurclassement = multiplicateurSurclassement(nivMoyenJoueur, nivMoyenEnnemis)
            const gainArgent = Math.max(1, Math.round(gainBrut * multiSurclassement * multiplicateur(ameliorationsRef.current, 'fortune') * bonusCompletionArgent * bonusPrestigeArgent * bonusArgentObjets * bonusSuccesArgent))
            setPokeDollars((a) => a + gainArgent)
            const chanceObjet = 0.003 * multiplicateur(ameliorationsRef.current, 'chineur')
            if (Math.random() < chanceObjet) {
              const objetDrop = tirerObjetDrop()
              setObjets((o) => ({ ...o, [objetDrop]: (o[objetDrop] || 0) + 1 }))
              ajouterAuJournal(`⚙️ Objet trouvé : ${OBJETS[objetDrop].nom} ! (rare)`, 'capture')
            }
            // Incubation : chaque œuf en incubateur progresse d'un combat.
            if (oeufsIncubesRef.current.some((o) => o && !pretAEclore(o))) {
              setOeufsIncubes((slots) => slots.map((o) =>
                (o && o.progression < combatsRequis(o)) ? { ...o, progression: o.progression + 1 } : o
              ))
            }
            // Jeton d'élevage (petit drop régulier).
            if (Math.random() < CHANCE_JETON_COMBAT) {
              setJetonsElevage((j) => j + 1)
            }
            // Drop d'œuf gratuit (rare).
            if (Math.random() < TAUX_DROP_OEUF) {
              const nouvelOeuf = creerOeuf(tirerRareteOeuf())
              setReserveOeufs((r) => [...r, nouvelOeuf])
              ajouterAuJournal(`🥚 Tu as trouvé un ${infoOeuf(nouvelOeuf.rarete).nom} !`, 'capture')
            }
            setVictoiresParRoute((v) => ({ ...v, [routeGagnee]: (v[routeGagnee] || 0) + 1 }))
            ajouterAuJournal(`Équipe ennemie vaincue ! (+${gainArgent} 💰)`, 'victoire')
            setTimeout(() => envoyerScoreThrottleRef.current(false), 0)
          }
        } else {
          if (combatBossRef.current) {
            const routePerdue = routeActiveRef.current
            ajouterAuJournal('Le boss vous a vaincus ! 💀 Progression de la zone remise à zéro...', 'echec')
            setVictoiresParRoute((v) => ({ ...v, [routePerdue]: 0 }))
            setCombatBoss(false)
            combatBossRef.current = false
          } else {
            ajouterAuJournal('Ton équipe est K.O. ! 💀 On recommence...', 'echec')
          }
        }
        respawnA = Date.now() + (PAUSE_RESPAWN / vitesse)
      }
    })

    // Le worker tique vite (40ms) ; le cadençage réel se fait par horodatage ci-dessus.
    horloge.start(40)

    return () => horloge.detruire()
  }, [chargement, vitesse])

  async function choisirStarters(noms) {
    setChargement(true)
    setChoixStarterRequis(false)
    const starters = await Promise.all(noms.map((nom) => chargerPokemon(nom)))
    setCaptures(starters)
    capturesRef.current = starters
    setEquipeIds(trierIdsParRole(starters.map((s) => s.uid), starters))
    setPokedexVus(starters.map((s) => s.id))
    setBalls({ poke: 10, super: 0, hyper: 0, master: 0 })
    setPokeDollars(50)
    const pvJ = starters.map((s) => s.pvMax)
    const jJ = starters.map(() => 0)
    setPvJoueur(pvJ); setJaugeJoueur(jJ)

    const routeInit = routeParId(routeActiveRef.current)
    const ennemis = await chargerEquipeEnnemie(routeInit)
    setEquipeEnnemie(ennemis)
    const pvE = ennemis.map((p) => p.pvMax)
    const jE = ennemis.map(() => 0)
    setPvEnnemis(pvE); setJaugeEnnemis(jE)

    etat.current = { pvJ, jJ, pvE, jE }
    const nomsList = starters.map((s) => s.nom).join(', ')
    ajouterAuJournal(`Ton équipe de départ : ${nomsList} ! 🌟`, 'victoire')
    setChargement(false)
    setPartieChargee(true)
  }

  function acheterBall(type, quantite = 1) {
    const prixUnitaire = BALLS[type].prix
    const coutTotal = prixUnitaire * quantite
    if (pokeDollars >= coutTotal) {
      setPokeDollars((argent) => argent - coutTotal)
      setBalls((b) => ({ ...b, [type]: b[type] + quantite }))
    }
  }

  function prixAvecNegociateur(prixBase, nbAchats) {
    const plein = prixDynamique(prixBase, nbAchats)
    const majoration = plein - prixBase
    const facteur = facteurNegociateur(ameliorations)
    return Math.round(prixBase + majoration * facteur)
  }

  function acheterPierre(type, quantite = 1) {
    const prixUnitaire = prixAvecNegociateur(PIERRES[type].prix, achatsItems[type] || 0)
    const coutTotal = prixUnitaire * quantite
    if (pokeDollars >= coutTotal) {
      setPokeDollars((argent) => argent - coutTotal)
      setPierres((p) => ({ ...p, [type]: (p[type] || 0) + quantite }))
      setAchatsItems((a) => ({ ...a, [type]: (a[type] || 0) + quantite }))
    }
  }

  function acheterBonbon(type, quantite = 1) {
    const prixUnitaire = BONBONS[type].prix
    const coutTotal = prixUnitaire * quantite
    if (pokeDollars >= coutTotal) {
      setPokeDollars((argent) => argent - coutTotal)
      setBonbons((b) => ({ ...b, [type]: (b[type] || 0) + quantite }))
    }
  }

  // ===== ŒUFS / ÉLEVAGE =====
  // Place un œuf de la réserve dans le premier incubateur libre.
  function placerOeuf(oeuf) {
    const libre = oeufsIncubesRef.current.findIndex((o) => !o)
    if (libre === -1) {
      ajouterAuJournal('Tous les incubateurs sont occupés.', 'info')
      return
    }
    setOeufsIncubes((slots) => {
      const maj = [...slots]
      maj[libre] = oeuf
      return maj
    })
    setReserveOeufs((r) => r.filter((o) => o.id !== oeuf.id))
  }

  // Achète un œuf avec des jetons d'élevage (boutique intégrée au panneau).
  function acheterOeuf(cle) {
    const info = infoOeuf(cle)
    const prix = info.prix
    if (!prix || jetonsElevage < prix) return
    setJetonsElevage((j) => j - prix)
    const nouvelOeuf = creerOeuf(cle)
    setReserveOeufs((r) => [...r, nouvelOeuf])
    ajouterAuJournal(`🥚 ${info.nom} acheté ! (-${prix} jetons)`, 'info')
  }

  // Fait éclore un œuf prêt selon son type (contenu, IV, shiny dépendent du type d'œuf).
  async function eclore(oeuf) {
    if (!pretAEclore(oeuf)) return
    // Libère l'incubateur tout de suite (évite double-clic).
    setOeufsIncubes((slots) => slots.map((o) => (o && o.id === oeuf.id ? null : o)))
    // Contenu : numéro de Pokémon (base aléatoire, ou bébé/légendaire pour l'œuf mystère).
    const contenu = tirerContenuOeuf(oeuf)
    try {
      // PokeAPI accepte l'ID numérique directement (ex: /pokemon/25).
      const pkmn = await chargerPokemon(String(contenu.numero))
      // Shiny et IV selon le TYPE d'œuf.
      const shiny = shinyDepuisOeuf(oeuf)
      const ivBonifie = ivDepuisOeuf(oeuf)
      const base = {
        ...pkmn,
        shiny,
        sprite: shiny ? (pkmn.spriteShiny || pkmn.sprite) : (pkmn.spriteNormal || pkmn.sprite),
        iv: ivBonifie,
      }
      const finales = statsFinales(base, BONUS_STAT_NIVEAU)
      const nouveau = { ...base, ...finales }
      // Mention spéciale dans le journal selon le contenu.
      const mention = contenu.estLegendaire ? ' 🌟 LÉGENDAIRE' : (contenu.estBebe ? ' 🍼 bébé' : '')

      // Doublon ? Si on possède déjà cette espèce avec le même statut shiny,
      // on fusionne les IV sur l'existant (comme une capture normale) — pas de doublon en collection.
      const existant = capturesRef.current.find(
        (p) => p.id === nouveau.id && (p.shiny ?? false) === shiny
      )
      if (existant) {
        const ivFusionnes = fusionnerIV(existant.iv, nouveau.iv)
        setCaptures((c) => c.map((p) => {
          if (p.uid !== existant.uid) return p
          const maj = { ...p, iv: ivFusionnes }
          return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
        }))
        marquerVu(nouveau.id)
        if (shiny) marquerShiny(nouveau.id)
        ajouterAuJournal(`✦ Œuf éclos : ${nouveau.nom}${mention} (doublon) → IV améliorés sur le tien !`, 'capture')
      } else {
        setCaptures((c) => [...c, nouveau])
        marquerVu(nouveau.id)
        if (shiny) marquerShiny(nouveau.id)
        ajouterAuJournal(`✦ Ton œuf a éclos : ${nouveau.nom}${mention}${shiny ? ' ✨ SHINY' : ''} (niv 1) !`, 'capture')
        montrerCapture(nouveau)
      }
      // Petite relance : l'éclosion rapporte quelques jetons d'élevage.
      setJetonsElevage((j) => j + JETONS_PAR_ECLOSION)
    } catch (err) {
      console.warn('Échec éclosion œuf', err)
      ajouterAuJournal("L'œuf n'a pas pu éclore (erreur réseau). Réessaie.", 'echec')
      // Remet l'œuf prêt dans un incubateur libre.
      setOeufsIncubes((slots) => {
        const libre = slots.findIndex((o) => !o)
        if (libre === -1) return slots
        const maj = [...slots]; maj[libre] = oeuf; return maj
      })
    }
  }

  function acheterObjet(id, quantite = 1) {
    const info = OBJETS[id]
    if (!info || !info.prix) return
    const prixUnitaire = prixAvecNegociateur(info.prix, achatsItems[id] || 0)
    const coutTotal = prixUnitaire * quantite
    if (pokeDollars >= coutTotal) {
      setPokeDollars((argent) => argent - coutTotal)
      setObjets((o) => ({ ...o, [id]: (o[id] || 0) + quantite }))
      setAchatsItems((a) => ({ ...a, [id]: (a[id] || 0) + quantite }))
    }
  }

  function acheterParchemin(cle, quantite = 1) {
    const info = PARCHEMINS[cle]
    if (!info) return
    const coutTotal = info.prix * quantite
    if (pokeDollars >= coutTotal) {
      setPokeDollars((argent) => argent - coutTotal)
      setParchemins((pp) => ({ ...pp, [cle]: (pp[cle] || 0) + quantite }))
    }
  }

  function utiliserBonbon(uid, type) {
    if (!bonbons[type] || bonbons[type] <= 0) return
    const info = BONBONS[type]
    setBonbons((b) => ({ ...b, [type]: b[type] - 1 }))
    setCaptures((liste) =>
      liste.map((poke) => {
        if (poke.uid !== uid) return poke
        let pkm = { ...poke }
        if (info.effet === 'xp') {
          const { pokemon } = ajouterXP(pkm, info.valeur, XP_BASE_NIVEAU, BONUS_STAT_NIVEAU)
          pkm = { ...pokemon, uid: poke.uid }
        } else if (info.effet === 'niveau') {
          const manque = Math.max(1, xpRequise(pkm.niveau, XP_BASE_NIVEAU) - (pkm.xp || 0))
          const { pokemon } = ajouterXP(pkm, manque, XP_BASE_NIVEAU, BONUS_STAT_NIVEAU)
          pkm = { ...pokemon, uid: poke.uid }
        }
        pkm = {
          ...pkm,
          evolueEn: poke.evolueEn ?? null,
          evolueNiveau: poke.evolueNiveau ?? null,
          evolutionsPierre: poke.evolutionsPierre ?? [],
          formeEvoluee: poke.formeEvoluee ?? null,
          estEvolution: poke.estEvolution ?? false,
          familleId: poke.familleId ?? null,
          shiny: poke.shiny ?? false,
          spriteNormal: poke.spriteNormal ?? null,
          spriteShiny: poke.spriteShiny ?? null,
        }
        return pkm
      })
    )
    ajouterAuJournal(`${info.emoji} ${info.nom} utilisé !`, 'victoire')
  }

  // Utilise un bonbon d'IV (+1 sur l'IV d'une stat, plafond 31) sur un Pokémon.
  function utiliserBonbonIV(uidPokemon, cleBonbon) {
    const info = BONBONS_IV[cleBonbon]
    if (!info) return
    if ((objetsBoss[cleBonbon] || 0) <= 0) {
      ajouterAuJournal(`Tu n'as pas de ${info.nom} en stock.`, 'info')
      return
    }
    const poke = capturesRef.current.find((p) => p.uid === uidPokemon)
    if (!poke) return
    const stat = info.stat
    const ivActuel = (poke.iv && Number.isFinite(poke.iv[stat])) ? poke.iv[stat] : 0
    if (ivActuel >= 31) {
      ajouterAuJournal(`${poke.nom} : IV ${info.nom.replace('Bonbon ', '')} déjà au max (31).`, 'info')
      return
    }
    setObjetsBoss((stock) => ({ ...stock, [cleBonbon]: (stock[cleBonbon] || 0) - 1 }))
    const nouvelleCollection = capturesRef.current.map((p) => {
      if (p.uid !== uidPokemon) return p
      const ivMaj = { ...(p.iv || {}), [stat]: Math.min(31, ivActuel + 1) }
      const maj = { ...p, iv: ivMaj }
      return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
    })
    capturesRef.current = nouvelleCollection
    setCaptures(nouvelleCollection)
    ajouterAuJournal(`${info.emoji} ${poke.nom} : IV ${stat} → ${Math.min(31, ivActuel + 1)}/31 !`, 'victoire')
  }

  function acheterAmelioration(cle) {
    const niveau = ameliorations[cle] || 0
    if (niveau >= PALIER_MAX) return
    const cout = coutAmelioration(cle, niveau)
    if (pokeDollars >= cout) {
      setPokeDollars((a) => a - cout)
      setAmeliorations((am) => ({ ...am, [cle]: (am[cle] || 0) + 1 }))
    }
  }

  // Achat d'un niveau d'amélioration ENDGAME (payé en objets de boss).
  function acheterAmeliorationEndgame(cleEg) {
    const niveau = ameliorations[cleEg] || 0
    if (niveau >= PALIER_MAX) return
    if (!endgameDebloque(ameliorations, cleEg)) return
    const cout = coutEndgame(niveau)
    if (!peutPayerEndgame(objetsBoss, cout)) return
    setObjetsBoss((stock) => ({
      rouage: (stock.rouage || 0) - cout.rouage,
      cristal: (stock.cristal || 0) - cout.cristal,
      relique: (stock.relique || 0) - cout.relique,
    }))
    setAmeliorations((am) => ({ ...am, [cleEg]: (am[cleEg] || 0) + 1 }))
    ajouterAuJournal(`★ Amélioration endgame renforcée !`, 'victoire')
  }

  function reclamerRecompense(palier) {
    if (!palier || recompensesReclamees.includes(palier.id)) return
    const clésPierres = Object.keys(PIERRES)
    const resume = []
    for (const g of palier.gains) {
      if (g.type === 'argent') {
        setPokeDollars((a) => a + g.montant)
        resume.push(`${g.montant} 💰`)
      } else if (g.type === 'ball') {
        setBalls((b) => ({ ...b, [g.ball]: (b[g.ball] || 0) + g.quantite }))
        resume.push(`${g.quantite}× ${BALLS[g.ball]?.nom || g.ball}`)
      } else if (g.type === 'pierre_aleatoire') {
        setPierres((p) => {
          const copie = { ...p }
          for (let i = 0; i < g.quantite; i++) {
            const pierre = clésPierres[Math.floor(Math.random() * clésPierres.length)]
            copie[pierre] = (copie[pierre] || 0) + 1
          }
          return copie
        })
        resume.push(`${g.quantite} pierre(s)`)
      } else if (g.type === 'bonus') {
        const nom = g.stat === 'xp' ? 'XP' : 'Argent'
        resume.push(`+${Math.round(g.valeur * 100)}% ${nom}`)
      }
    }
    setRecompensesReclamees((liste) => [...liste, palier.id])
    ajouterAuJournal(`🎁 Récompense réclamée : ${palier.nom} (${resume.join(', ')})`, 'victoire')
  }

  function choisirPassif(uidPokemon, clePassif, mode = 'principal') {
    const champ = champPassifDuMode(mode)
    setCaptures((liste) => liste.map((p) => {
      if (p.uid !== uidPokemon) return p
      const maj = { ...p, [champ]: clePassif }
      if (champ === 'passifChoisi') {
        return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
      }
      return maj
    }))
  }

  function choisirCaseJoker(uidPokemon, caseRole) {
    const nouvelleCollection = capturesRef.current.map((p) =>
      p.uid === uidPokemon ? { ...p, jokerCase: caseRole } : p
    )
    capturesRef.current = nouvelleCollection
    setCaptures(nouvelleCollection)
    if (equipeIdsRef.current.includes(uidPokemon)) {
      const triee = trierIdsParRole(equipeIdsRef.current, nouvelleCollection)
      equipeIdsRef.current = triee
      setEquipeIds(triee)
    }
  }

  function appliquerParchemin(uidPokemon, cleParchemin) {
    if (!parchemins[cleParchemin] || parchemins[cleParchemin] <= 0) return
    const info = PARCHEMINS[cleParchemin]
    if (!info) return
    const nouveauRole = info.role

    const poke = capturesRef.current.find((p) => p.uid === uidPokemon)
    if (!poke) return

    if (poke.roleForce === nouveauRole) {
      ajouterAuJournal(`${poke.nom} a déjà le rôle ${ROLES[nouveauRole]?.nom || nouveauRole}.`, 'info')
      return
    }

    setParchemins((pp) => ({ ...pp, [cleParchemin]: (pp[cleParchemin] || 0) - 1 }))

    const nouvelleCollection = capturesRef.current.map((p) => {
      if (p.uid !== uidPokemon) return p
      const maj = {
        ...p,
        roleForce: nouveauRole,
        role: nouveauRole,
        passifChoisi: passifParDefautDuRole(nouveauRole),
      }
      if (nouveauRole === 'joker' && !maj.jokerCase) maj.jokerCase = 'dps'
      return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
    })
    capturesRef.current = nouvelleCollection
    setCaptures(nouvelleCollection)

    if (equipeIdsRef.current.includes(uidPokemon)) {
      const triee = trierIdsParRole(equipeIdsRef.current, nouvelleCollection)
      equipeIdsRef.current = triee
      setEquipeIds(triee)
    }

    ajouterAuJournal(`${info.emoji} ${poke.nom} devient ${ROLES[nouveauRole]?.nom || nouveauRole} !`, 'victoire')
  }

  function equiperObjet(uidPokemon, idObjet) {
    const poke = captures.find((p) => p.uid === uidPokemon)
    if (!poke) return
    const ancienObjet = poke.objetEquipe || null
    if (idObjet === ancienObjet) return

    if (idObjet && (objets[idObjet] || 0) <= 0) {
      ajouterAuJournal(`Tu n'as pas de ${OBJETS[idObjet]?.nom || 'cet objet'} en stock.`, 'info')
      return
    }

    // Limite : 2 exemplaires max du même objet équipés sur toute la collection.
    if (idObjet) {
      const dejaEquipes = captures.filter((p) => p.uid !== uidPokemon && p.objetEquipe === idObjet).length
      if (dejaEquipes >= 2) {
        ajouterAuJournal(`Limite atteinte : ${OBJETS[idObjet]?.nom || 'cet objet'} ne peut être équipé que sur 2 Pokémon.`, 'info')
        return
      }
    }

    setObjets((stock) => {
      const nouveau = { ...stock }
      if (idObjet) nouveau[idObjet] = (nouveau[idObjet] || 0) - 1
      if (ancienObjet) nouveau[ancienObjet] = (nouveau[ancienObjet] || 0) + 1
      return nouveau
    })

    setCaptures((liste) => liste.map((p) => {
      if (p.uid !== uidPokemon) return p
      const maj = { ...p, objetEquipe: idObjet }
      return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
    }))

    if (idObjet) {
      ajouterAuJournal(`${OBJETS[idObjet].emoji} ${poke.nom} équipe ${OBJETS[idObjet].nom} !`, 'info')
    } else if (ancienObjet) {
      ajouterAuJournal(`${poke.nom} retire son objet.`, 'info')
    }
  }

  // Calcule une équipe valide (1 à 2 par rôle, 4 rôles présents, 1 spécial max)
  // à partir de la collection, en prenant les meilleurs (rareté puis niveau).
  function composerAutoEquipe() {
    const ordreRarete = { legendaire: 4, tresRare: 3, rare: 2, commun: 1 }
    const ROLES4 = ['tank', 'eclaireur', 'soutien', 'dps']
    const MIN = 1, MAX = 2, MAX_SPE = 1, TAILLE = 6

    const tries = [...captures].sort((a, b) => {
      const rA = ordreRarete[a.rarete] || 0
      const rB = ordreRarete[b.rarete] || 0
      if (rB !== rA) return rB - rA
      return (b.niveau || 1) - (a.niveau || 1)
    })

    const choisis = []
    const famillesPrises = new Set()
    const compteRole = { tank: 0, eclaireur: 0, soutien: 0, dps: 0 }
    let nbSpe = 0

    const peutPrendre = (poke, role) => {
      const fam = poke.familleId ?? poke.id
      if (famillesPrises.has(fam)) return false
      if (compteRole[role] === undefined || compteRole[role] >= MAX) return false
      if (estSpecial(poke) && nbSpe >= MAX_SPE) return false
      return true
    }
    const prendre = (poke, role) => {
      famillesPrises.add(poke.familleId ?? poke.id)
      if (estSpecial(poke)) nbSpe += 1
      compteRole[role] += 1
      choisis.push(poke.uid)
    }

    for (const role of ROLES4) {
      const best = tries.find(
        (p) => (p.role || determinerRole(p)) === role && !choisis.includes(p.uid) && peutPrendre(p, role)
      )
      if (best) prendre(best, role)
    }
    for (const poke of tries) {
      if (choisis.length >= TAILLE) break
      if (choisis.includes(poke.uid)) continue
      const role = poke.role || determinerRole(poke)
      if (peutPrendre(poke, role)) prendre(poke, role)
    }

    const manquants = ROLES4.filter((r) => compteRole[r] < MIN)
    const complet = manquants.length === 0 && choisis.length === TAILLE
    return { choisis, complet, manquants }
  }

  function autoEquipe() {
    const { choisis, complet, manquants } = composerAutoEquipe()
    if (!complet) {
      if (manquants.length > 0) {
        const details = manquants.map((r) => ROLES[r].nom).join(', ')
        alert(`Impossible de composer une équipe complète : il te manque un Pokémon de rôle ${details} dans ta collection.\n\nCapture plus de Pokémon de ces rôles !`)
      } else {
        alert(`Impossible de composer une équipe complète de 6 : avec la règle « 2 maximum par rôle », il te faut plus de variété de rôles dans ta collection.`)
      }
      return
    }
    if (!confirm(`Composer automatiquement une équipe valide avec tes meilleurs Pokémon (1 à 2 par rôle, les 4 rôles présents, 1 spécial max) ?`)) return
    const triee = trierIdsParRole(choisis, captures)
    setEquipeIds(triee)
    equipeIdsRef.current = triee
    ajouterAuJournal(`⚡ Équipe équilibrée composée automatiquement.`, 'info')
  }

  function faireePrestige() {
    const nbVus = pokedexVus.length
    const nbZones = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const gain = medaillesGagnables(nbVus, nbZones)
    if (gain <= 0) {
      ajouterAuJournal(`Pas encore assez de progrès pour prestiger.`, 'info')
      return
    }
    if (!confirm(
      `PRESTIGE ?\n\nTu gagnes ${gain} médailles 🏅 (à investir en bonus permanents).\n\n` +
      `Tu GARDES : ton Pokédex, tes shinies, tes médailles, tes récompenses.\n` +
      `Tu PERDS : niveaux de tes Pokémon (→ niv 1), zones débloquées, argent.\n\nContinuer ?`
    )) return

    setCaptures((liste) => liste.map((p) => {
      const remis = { ...p, niveau: 1, xp: 0 }
      return { ...remis, ...statsFinales(remis, BONUS_STAT_NIVEAU) }
    }))
    setRouteActive('tutoriel')
    routeActiveRef.current = 'tutoriel'
    setVictoiresParRoute({})
    victoiresParRouteRef.current = {}
    setBossVaincus({})
    bossVaincusRef.current = {}
    setPokeDollars(0)
    setMedailles((m) => m + gain)
    ajouterAuJournal(`🏅 PRESTIGE ! +${gain} médailles. Bonne chance pour la remontée !`, 'victoire')
    setVueOuverte(null)
  }

  function investirMedaille(categorie) {
    if (medailles <= 0) return
    setMedailles((m) => m - 1)
    setInvestisPrestige((inv) => {
      const nouveau = { ...inv, [categorie]: (inv[categorie] || 0) + 1 }
      return nouveau
    })
  }

  function reinitialiser() {
    if (confirm('Effacer la sauvegarde et recommencer ?')) {
      localStorage.removeItem(CLE_SAUVEGARDE)
      window.location.reload()
    }
  }

  if (chargement) {
    return (
      <div className="ecran-chargement">
        <div className="chargement-contenu">
          <img
            src="/logo-titre.png"
            alt="Pokédle"
            className="chargement-logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; const t = e.currentTarget.nextElementSibling; if (t) t.style.display = 'block' }}
          />
          <h1 className="chargement-titre" style={{ display: 'none' }}>Pokédle</h1>
          <div className="pokeball-spinner" aria-label="Chargement">
            <div className="pokeball-spinner-haut"></div>
            <div className="pokeball-spinner-bas"></div>
            <div className="pokeball-spinner-centre"></div>
          </div>
          <p className="chargement-texte">Chargement…</p>
        </div>
      </div>
    )
  }

  if (choixStarterRequis) {
    return <ChoixStarter onChoisir={choisirStarters} />
  }

  const numZone = ROUTES.findIndex((r) => r.id === routeActive) + 1
  const victoiresZone = victoiresParRoute[routeActive] || 0
  const bossOk = bossVaincus[routeActive] === true
  // Seuil dynamique : 1er boss à 25 (moins stratégie), puis refarm tous les 250.
  const seuilBoss = bossOk
    ? COMBATS_REFARM_BOSS
    : Math.max(10, COMBATS_AVANT_BOSS - niveauAmelioration(ameliorations, 'strategie'))
  const combatActuel = Math.min(victoiresZone + 1, seuilBoss)
  const progression = Math.min(100, (victoiresZone / seuilBoss) * 100)
  const pctPokedex = Math.round((pokedexVus.length / 1025) * 100)

  const zonesDebloquees = ROUTES.filter((r) => routeDebloquee(r, bossVaincus))
  const indexZoneActive = zonesDebloquees.findIndex((r) => r.id === routeActive)

  function changerZoneRapide(delta) {
    const nouvelIndex = indexZoneActive + delta
    if (nouvelIndex < 0 || nouvelIndex >= zonesDebloquees.length) return
    const nouvelleZone = zonesDebloquees[nouvelIndex]
    setRouteActive(nouvelleZone.id)
    routeActiveRef.current = nouvelleZone.id
    ajouterAuJournal(`Direction ${nouvelleZone.nom} ! 🗺️`, 'info')
  }

  const nbRecompensesDispo = recompensesDisponibles(new Set(pokedexVus), recompensesReclamees).length

  const nbZonesPrestige = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
  const gainPrestige = medaillesGagnables(pokedexVus.length, nbZonesPrestige)
  const multisPrestige = multiplicateursPrestige(investisPrestige)

  const renduTutoriel = tutoMode ? (
    <Tutoriel
      mode={tutoMode}
      onLancerVisite={() => setTutoMode('visite')}
      onOuvrirGuide={() => setTutoMode('guide')}
      onTerminerVisite={() => { setTutoMode(null); setTutoVu(true) }}
      onFermer={() => { setTutoMode(null); setTutoVu(true) }}
    />
  ) : null

  // ======================= MODE PvP =======================
  if (modeJeu === 'pvp') {
    const equipeDefense = equipeDefenseIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const equipeAttaque = equipeAttaqueIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const defenseValide = equipeComplete(equipeDefense)
    const attaqueValide = equipeComplete(equipeAttaque)

    function basculerDefense(uid) {
      setEquipeDefenseIds((ids) => {
        if (ids.includes(uid)) return ids.filter((x) => x !== uid)
        if (ids.length >= 6) return ids
        const poke = captures.find((p) => p.uid === uid)
        if (estSpecial(poke) && compterSpeciaux(ids, captures) >= 1) {
          alert('Un seul Pokémon spécial autorisé par équipe.')
          return ids
        }
        return trierIdsParRole([...ids, uid], captures)
      })
    }
    function basculerAttaque(uid) {
      setEquipeAttaqueIds((ids) => {
        if (ids.includes(uid)) return ids.filter((x) => x !== uid)
        if (ids.length >= 6) return ids
        const poke = captures.find((p) => p.uid === uid)
        if (estSpecial(poke) && compterSpeciaux(ids, captures) >= 1) {
          alert('Un seul Pokémon spécial autorisé par équipe.')
          return ids
        }
        return trierIdsParRole([...ids, uid], captures)
      })
    }

    async function rafraichirPvp() {
      setPvpChargementListe(true)
      try {
        const maDef = await chargerMaDefense()
        if (maDef) {
          setPvpPoints(maDef.points_pvp)
          setPvpRang(maDef.rang)
          setPvpDefensePubliee(maDef.equipe && maDef.equipe.length > 0)
        }
        const { lignes } = await listerDefenses(50)
        setPvpAdversaires(lignes)
      } catch (err) {
        console.warn('rafraichirPvp échoué', err)
      }
      setPvpChargementListe(false)
    }

    async function publierMaDefense() {
      if (!defenseValide) return
      setPvpPublicationEnCours(true)
      const r = await publierDefense(preparerEquipe(equipeDefense, 'pvp'))
      setPvpPublicationEnCours(false)
      if (r.ok) {
        setPvpDefensePubliee(true)
        setPvpMessage('✓ Défense publiée !')
        setTimeout(() => setPvpMessage(''), 3000)
      } else {
        setPvpMessage('Erreur lors de la publication : ' + (r.raison || 'inconnue'))
      }
    }

    function attaquerAdversaire(adversaire) {
      if (!attaqueValide) return
      const equipeAdverse = reconstruireEquipeSnapshot(adversaire.equipe)
      if (!equipeAdverse || equipeAdverse.length === 0) {
        setPvpMessage('Cet adversaire n\'a pas de défense valide.')
        return
      }
      const equipeAttaquePreparee = preparerEquipe(equipeAttaque, 'pvp')
      const equipeJoueurCapee = capperEquipePvp(equipeAttaquePreparee)
      setPvpCombat({ adversaire, equipeJoueur: equipeJoueurCapee, equipeAdverse })
    }

    async function terminerCombatPvp(resultat) {
      const combat = pvpCombat
      setPvpCombat(null)
      if (!combat) return
      const gagne = resultat === 'victoire'
      const r = await appliquerResultatPvp(combat.adversaire, gagne)
      if (r.ok) {
        setPvpPoints(r.mesNouveauxPoints)
        setPvpRang(r.monRang)
        const signe = r.deltaMoi >= 0 ? '+' : ''
        setPvpMessage(
          (gagne ? '🏆 Victoire ! ' : '💀 Défaite. ') +
          `${signe}${r.deltaMoi} pts (tu es à ${r.mesNouveauxPoints}, ${r.monRang}).`
        )
        const { lignes } = await listerDefenses(50)
        setPvpAdversaires(lignes)
      } else {
        setPvpMessage('Erreur d\'enregistrement du résultat.')
      }
    }

    if (pvpCombat) {
      return (
        <>
          <CombatPvp
            pseudoAdversaire={pvpCombat.adversaire.pseudo}
            equipeJoueur={pvpCombat.equipeJoueur}
            equipeAdverse={pvpCombat.equipeAdverse}
            vitesse={vitesse}
            onTermine={terminerCombatPvp}
            onQuitter={() => setPvpCombat(null)}
          />
          {renduTutoriel}
        </>
      )
    }

    return (
      <>
        <TutoFenetre id="pvp" />
        <PanneauPvp
          captures={captures}
          equipeDefense={equipeDefense}
          equipeDefenseIds={equipeDefenseIds}
          onBasculerDefense={basculerDefense}
          defenseValide={defenseValide}
          onPublierDefense={publierMaDefense}
          defensePubliee={pvpDefensePubliee}
          publicationEnCours={pvpPublicationEnCours}
          equipeAttaque={equipeAttaque}
          equipeAttaqueIds={equipeAttaqueIds}
          onBasculerAttaque={basculerAttaque}
          attaqueValide={attaqueValide}
          adversaires={pvpAdversaires}
          onAttaquer={attaquerAdversaire}
          chargementListe={pvpChargementListe}
          onRafraichir={rafraichirPvp}
          mesPoints={pvpPoints}
          monRang={pvpRang}
          onRetour={() => setModeJeu('principal')}
          message={pvpMessage}
        />
        {renduTutoriel}
      </>
    )
  }

  // ===== ÉCRAN MODE RAID =====
  if (modeJeu === 'raid') {
    const nbZonesRaid = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const equipeRaid = equipeRaidIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const equipeRaidValide = compositionValide(equipeRaid)
    const equipeRaidDiagnostic = diagnostiqueComposition(equipeRaid)

    function basculerMembreRaid(uid) {
      setEquipeRaidIds((ids) => {
        if (ids.includes(uid)) return ids.filter((x) => x !== uid)
        if (ids.length >= 6) return ids
        const poke = captures.find((p) => p.uid === uid)
        if (estSpecial(poke) && compterSpeciaux(ids, captures) >= 1) {
          alert('Un seul Pokémon spécial autorisé par équipe.')
          return ids
        }
        return trierIdsParRole([...ids, uid], captures)
      })
    }

    async function lancerRaid(raid) {
      if (!compositionValide(equipeRaid)) {
        alert('Ton équipe de raid doit respecter la compo : 1 à 2 par rôle, les 4 rôles présents, 1 spécial max.')
        return
      }
      if (tempsRestantRaid(raid, raidsCooldowns) > 0) {
        alert('Ce raid est encore en récupération. Reviens quand le minuteur est écoulé.')
        return
      }
      setChargementRaid(true)
      setRaidActif(raid)
      try {
        const vagues = await chargerEquipeRaid(raid)
        setVaguesRaid(vagues)
      } catch (err) {
        console.warn('Échec chargement raid', err)
        setRaidActif(null)
      }
      setChargementRaid(false)
    }

    async function terminerRaid(resultat) {
      if (resultat === 'victoire' && raidActif) {
        const r = raidActif.recompense || {}
        if (r.argent) setPokeDollars((a) => a + r.argent)
        if (r.bonbons && Math.random() < 0.10) setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + r.bonbons }))
        ajouterAuJournal(`🏆 Raid « ${raidActif.nom} » réussi ! +${r.argent || 0} 💰`, 'victoire')
        tirerObjetsBoss('raid')

        const boss = raidActif.boss
        const dejaPossede = pokedexSpeciaux.includes(boss.id)

        if (dejaPossede) {
          // REFARM : le boss est déjà dans le Pokédex spécial → récompense en bonbons IV
          // (répartis aléatoirement sur les 4 stats), au lieu d'une nouvelle capture.
          const nb = bonbonsIvRefarm(raidActif)
          const clesIv = ['iv_pv', 'iv_attaque', 'iv_vitesse', 'iv_defense']
          const gagnes = {}
          for (let k = 0; k < nb; k++) {
            const cle = clesIv[Math.floor(Math.random() * clesIv.length)]
            gagnes[cle] = (gagnes[cle] || 0) + 1
          }
          setObjetsBoss((b) => {
            const maj = { ...b }
            for (const cle of Object.keys(gagnes)) maj[cle] = (maj[cle] || 0) + gagnes[cle]
            return maj
          })
          const detail = Object.entries(gagnes)
            .map(([cle, n]) => `${n}× ${BONBONS_IV[cle] ? BONBONS_IV[cle].nom : cle}`)
            .join(', ')
          ajouterAuJournal(`🍬 Refarm de ${boss.nomFr} : ${detail} !`, 'capture')
        } else {
          // PREMIÈRE FOIS : tentative de capture du boss (rejoint la collection + Pokédex spécial).
          const ordreBall = ['master', 'hyper', 'super', 'poke']
          const ballDispo = ordreBall.find((b) => (balls[b] || 0) > 0)
          if (!ballDispo) {
            ajouterAuJournal(`💥 ${boss.nomFr} s'est enfui : aucune Ball pour le capturer !`, 'echec')
          } else {
            setBalls((bb) => ({ ...bb, [ballDispo]: (bb[ballDispo] || 0) - 1 }))
            const taux = TAUX_CAPTURE_BOSS_RAID[ballDispo] ?? 0.02
            if (Math.random() < taux) {
              try {
                const pkmn = await chargerPokemon(boss.nom, false)
                const avecNiv = { ...pkmn, niveau: raidActif.niveau, xp: 0, rarete: 'special', estSpecial: true }
                const finales = statsFinales(avecNiv, BONUS_STAT_NIVEAU)
                const nouveau = { ...avecNiv, ...finales, uid: `special-${boss.id}-${Date.now()}` }
                setCaptures((c) => [...c, nouveau])
                setPokedexSpeciaux((s) => s.includes(boss.id) ? s : [...s, boss.id])
                ajouterAuJournal(`🌟 CAPTURE ! ${boss.nomFr} (niv ${raidActif.niveau}) rejoint ta collection !`, 'capture')
              } catch (err) {
                console.warn('Échec chargement boss raid', boss.nom, err)
              }
            } else {
              ajouterAuJournal(`💢 ${boss.nomFr} s'est libéré de la ${BALLS[ballDispo].nom} ! Reviens après le cooldown.`, 'echec')
            }
          }
        }

        setRaidsCooldowns((cd) => ({ ...cd, [raidActif.id]: Date.now() + raidActif.cooldownMs }))
      } else if (resultat === 'defaite' && raidActif) {
        ajouterAuJournal(`💀 Raid « ${raidActif.nom} » échoué. Pas de cooldown, réessaie !`, 'echec')
      }
      setRaidActif(null)
      setVaguesRaid(null)
    }

    if (raidActif && vaguesRaid && equipeRaid.length > 0) {
      return (
        <>
          <CombatRaid
            raid={raidActif}
            equipeJoueur={equipeRaid}
            vagues={vaguesRaid}
            vitesse={vitesse}
            onTermine={terminerRaid}
            onQuitter={() => { setRaidActif(null); setVaguesRaid(null) }}
          />
          {renduTutoriel}
        </>
      )
    }

    if (chargementRaid) {
      return (
        <div className="app app-layout">
          <header className="topbar">
            <div className="topbar-titre">⚔️ Raid</div>
          </header>
          <div className="arene-ecran">
            <p className="arene-intro">Préparation du raid... ⏳</p>
          </div>
        </div>
      )
    }

    return (
      <>
        <TutoFenetre id="raids" />
        <PanneauRaids
          raids={RAIDS}
          nbZones={nbZonesRaid}
          cooldowns={raidsCooldowns}
          equipeRaid={equipeRaid}
          equipeRaidIds={equipeRaidIds}
          captures={captures}
          onBasculerMembre={basculerMembreRaid}
          onLancer={lancerRaid}
          compoValide={equipeRaidValide}
          compoDiagnostic={equipeRaidDiagnostic}
          onRetour={() => setModeJeu('principal')}
        />
        {renduTutoriel}
      </>
    )
  }

  // ===== ÉCRAN MODE ARÈNE =====
  if (modeJeu === 'arene') {
    const nbZonesArene = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const listeDresseurs = etatsDresseursAvecReset(nbZonesArene, dresseursVaincus)
    const equipeArene = equipeAreneIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const equipeAreneValide = compositionValide(equipeArene)
    const equipeAreneDiagnostic = diagnostiqueComposition(equipeArene)

    function basculerMembreArene(uid) {
      setEquipeAreneIds((ids) => {
        if (ids.includes(uid)) return ids.filter((x) => x !== uid)
        if (ids.length >= 6) return ids
        const poke = captures.find((p) => p.uid === uid)
        if (estSpecial(poke) && compterSpeciaux(ids, captures) >= 1) {
          alert('Un seul Pokémon spécial autorisé par équipe.')
          return ids
        }
        return trierIdsParRole([...ids, uid], captures)
      })
    }

    // Auto-équipe pour l'arène : même règle que l'équipe principale.
    function autoEquipeArene() {
      const { choisis, complet, manquants } = composerAutoEquipe()
      if (!complet) {
        if (manquants.length > 0) {
          const details = manquants.map((r) => ROLES[r].nom).join(', ')
          alert(`Impossible de composer une équipe d'arène complète : il te manque un Pokémon de rôle ${details} dans ta collection.\n\nCapture plus de Pokémon de ces rôles !`)
        } else {
          alert(`Impossible de composer une équipe d'arène complète de 6 : avec la règle « 2 maximum par rôle », il te faut plus de variété de rôles.`)
        }
        return
      }
      if (!confirm(`Composer automatiquement ton équipe d'arène avec tes meilleurs Pokémon (1 à 2 par rôle, les 4 rôles présents, 1 spécial max) ?`)) return
      const triee = trierIdsParRole(choisis, captures)
      setEquipeAreneIds(triee)
    }

    async function lancerCombatArene(dresseur) {
      if (!compositionValide(equipeArene)) {
        alert('Ton équipe d\'arène doit respecter la compo : 1 à 2 par rôle, les 4 rôles présents, 1 spécial max.')
        return
      }
      setChargementArene(true)
      setDresseurActif(dresseur)
      try {
        const equipe = await chargerEquipeDresseur(dresseur)
        setEquipeDresseur(equipe)
      } catch (err) {
        console.warn('Échec chargement équipe dresseur', err)
        setDresseurActif(null)
      }
      setChargementArene(false)
    }

    async function terminerCombatArene(resultat) {
      if (resultat === 'victoire' && dresseurActif) {
        const r = dresseurActif.recompense
        if (r.argent) setPokeDollars((a) => a + Math.round(r.argent * multiplicateur(ameliorationsRef.current, 'champion')))
        if (r.bonbon && Math.random() < 0.10) setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + r.bonbon }))
        if (r.objet) setObjets((o) => ({ ...o, [r.objet]: (o[r.objet] || 0) + 1 }))
        tirerObjetsBoss('arene')
        const creneau = creneauActuel()
        const dejaVaincu = dresseursVaincus[dresseurActif.id] === creneau
        setDresseursVaincus((v) => ({ ...v, [dresseurActif.id]: creneau }))
        ajouterAuJournal(`🏆 Arène : ${dresseurActif.nom} vaincu ! Récompense : ${decrireRecompenseDresseur(r)}`, 'victoire')
        const special = specialDuBoss(dresseurActif.id)
        if (special && !dejaVaincu && !pokedexSpeciaux.includes(special.id)) {
          try {
            const pkmn = await chargerPokemon(special.nom, false)
            const avecNiv = { ...pkmn, niveau: 1, xp: 0, rarete: 'special', estSpecial: true }
            const finales = statsFinales(avecNiv, BONUS_STAT_NIVEAU)
            const nouveau = { ...avecNiv, ...finales, uid: `special-${special.id}-${Date.now()}` }
            setCaptures((c) => [...c, nouveau])
            setPokedexSpeciaux((s) => s.includes(special.id) ? s : [...s, special.id])
            ajouterAuJournal(`🌟 POKÉMON SPÉCIAL DÉBLOQUÉ : ${special.nomFr} rejoint ta collection !`, 'capture')
          } catch (err) {
            console.warn('Échec chargement spécial', special.nom, err)
          }
        }
      } else if (resultat === 'defaite' && dresseurActif) {
        ajouterAuJournal(`💀 Arène : défaite contre ${dresseurActif.nom}. Réessaie !`, 'echec')
        if (autoArene) {
          setAutoArene(false)
          ajouterAuJournal(`⏸️ Auto dresseur arrêté (défaite).`, 'info')
        }
        setDresseurActif(null)
        setEquipeDresseur(null)
        return
      }

      // Victoire : si auto dresseur actif, on enchaîne le prochain dresseur disponible.
      if (resultat === 'victoire' && autoArene && dresseurActif) {
        const creneau = creneauActuel()
        const vaincusMaj = { ...dresseursVaincus, [dresseurActif.id]: creneau }
        const liste = etatsDresseursAvecReset(nbZonesArene, vaincusMaj)
        const prochainDresseur = liste.find((d) => d.etat === 'disponible') || null
        setDresseurActif(null)
        setEquipeDresseur(null)
        if (prochainDresseur && prochainDresseur.equipe) {
          ajouterAuJournal(`➡️ Auto : prochain dresseur, ${prochainDresseur.nom} !`, 'info')
          setTimeout(() => lancerCombatArene(prochainDresseur), 600)
        } else {
          setAutoArene(false)
          ajouterAuJournal(`🏁 Auto dresseur arrêté : plus de dresseur disponible.`, 'info')
        }
        return
      }

      setDresseurActif(null)
      setEquipeDresseur(null)
    }

    if (dresseurActif && equipeDresseur && equipeArene.length > 0) {
      return (
        <>
          <CombatArene
            dresseur={dresseurActif}
            equipeJoueur={preparerEquipe(equipeArene, 'arene')}
            equipeDresseur={equipeDresseur}
            vitesse={vitesse}
            onTermine={terminerCombatArene}
            onQuitter={() => { setDresseurActif(null); setEquipeDresseur(null) }}
          />
          {renduTutoriel}
        </>
      )
    }

    if (chargementArene) {
      return (
        <div className="app app-layout">
          <header className="topbar">
            <div className="topbar-titre">⚔️ Mode Arène</div>
          </header>
          <div className="arene-ecran">
            <p className="arene-intro">Préparation du combat... ⏳</p>
          </div>
        </div>
      )
    }

    return (
      <>
        <TutoFenetre id="arene" />
        <PanneauArene
          listeDresseurs={listeDresseurs}
          equipeArene={equipeArene}
          equipeAreneIds={equipeAreneIds}
          captures={captures}
          onBasculerMembre={basculerMembreArene}
          onAutoEquipe={autoEquipeArene}
          onCombattre={lancerCombatArene}
          decrireRecompense={decrireRecompenseDresseur}
          compoValide={equipeAreneValide}
          compoDiagnostic={equipeAreneDiagnostic}
          autoArene={autoArene}
          onToggleAuto={() => {
            if (!equipeAreneValide) {
              alert('Compose d\'abord une équipe d\'arène valide avant d\'activer le mode auto.')
              return
            }
            setAutoArene((v) => !v)
          }}
          onRetour={() => { setAutoArene(false); setModeJeu('principal') }}
        />
        {renduTutoriel}
      </>
    )
  }

  return (
    <div className="app app-layout">

      <header className="topbar-moderne">
        <div className="tbm-marque">
          <img
            src="https://play.pokemonshowdown.com/sprites/ani/mew.gif"
            alt=""
            className="tbm-mascotte tbm-mascotte-gauche"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <img
            src="/logo-titre.png"
            alt="Pokédle"
            className="tbm-logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; const t = e.currentTarget.nextElementSibling; if (t) t.style.display = 'inline' }}
          />
          <span className="tbm-marque-texte" style={{ display: 'none' }}>Pokédle</span>
          <img
            src="https://play.pokemonshowdown.com/sprites/ani/mewtwo.gif"
            alt=""
            className="tbm-mascotte tbm-mascotte-droite"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>

        <nav className="tbm-menu">
          <button className="tbm-item" onClick={() => setVueOuverte('pokedex')} title="Pokédex">
            {nbRecompensesDispo > 0 && <span className="tbm-pastille">{nbRecompensesDispo}</span>}
            <BookOpen size={17} /><span>Pokédex</span>
          </button>
          <button className="tbm-item" data-tuto="equipe" onClick={() => setVueOuverte('equipe')} title="Mon équipe">
            <Users size={17} /><span>Équipe</span>
          </button>
          <button className="tbm-item" data-tuto="routes" onClick={() => setVueOuverte('routes')} title="Routes">
            <MapIcon size={17} /><span>Routes</span>
          </button>
          <button className="tbm-item" onClick={() => setVueOuverte('stats')} title="Statistiques">
            <BarChart3 size={17} /><span>Stats</span>
          </button>
          <button className="tbm-item" onClick={() => setVueOuverte('boutique')} title="Boutique">
            <ShoppingBag size={17} /><span>Shop</span>
          </button>
          <button className="tbm-item" onClick={() => setVueOuverte('sac')} title="Sac">
            <Backpack size={17} /><span>Sac</span>
          </button>
          <button className="tbm-item" data-tuto="oeufs" onClick={() => setVueOuverte('oeufs')} title="Élevage / Œufs">
            <Egg size={17} /><span>Œufs</span>
          </button>
          <button className="tbm-item" onClick={() => setVueOuverte('succes')} title="Succès">
            <Trophy size={17} /><span>Succès</span>
          </button>
          <button className="tbm-item" onClick={() => setVueOuverte('ameliorations')} title="Améliorations">
            <Zap size={17} /><span>Boost</span>
          </button>
          <button className="tbm-item tbm-item-combat" onClick={() => setModeJeu('arene')} title="Mode Arène">
            <Swords size={17} /><span>Arène</span>
          </button>
          <button className="tbm-item tbm-item-combat" onClick={() => setModeJeu('raid')} title="Raids (endgame)">
            <Flame size={17} /><span>Raids</span>
          </button>
          <button className="tbm-item tbm-item-combat" data-tuto="pvp" onClick={() => setModeJeu('pvp')} title="Arène PvP en ligne">
            <Crosshair size={17} /><span>PvP</span>
          </button>
          <button className="tbm-item" onClick={() => setVueOuverte('classement')} title="Classement en ligne">
            <Medal size={17} /><span>Rang</span>
          </button>
          {/* PRESTIGE MASQUÉ */}
          <button className="tbm-item" onClick={() => setVueOuverte('sauvegarde')} title="Sauvegarde (transfert tel/PC)">
            <Save size={17} /><span>Save</span>
          </button>
          <button className="tbm-item" onClick={() => setTutoMode('guide')} title="Aide / Guide du jeu">
            <HelpCircle size={17} /><span>Aide</span>
          </button>
          <button className="tbm-item tbm-item-danger" onClick={reinitialiser} title="Réinitialiser">
            <Trash2 size={17} /><span>Reset</span>
          </button>
        </nav>

        <div className="tbm-ressources">
          <span className="tbm-stat tbm-stat-argent" title="Poké Dollars">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nugget.png" alt="" className="tbm-stat-sprite" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            {Number(pokeDollars).toLocaleString('fr-FR')}
          </span>
          <span className="tbm-stat tbm-stat-dex" title="Complétion du Pokédex">
            <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="" className="tbm-stat-sprite" onError={(e) => { e.currentTarget.style.display = 'none' }} />
            {pctPokedex}%
          </span>
        </div>
      </header>

      <div className="grille-jeu">

        <aside className="colonne colonne-gauche">
          <div className="panneau">
            <div className="panneau-titre">
              <img src="/icons/equipe.png" alt="" className="panneau-icone" /> Équipe
            </div>
            <div className="apercu-equipe">
              {equipeJoueur.map((poke, i) => {
                const pv = pvJoueur[i] ?? poke.pvMax
                const pct = Math.max(0, Math.min(100, (pv / poke.pvMax) * 100))
                return (
                  <button
                    key={poke.uid}
                    className="mini-poke"
                    onClick={() => setVueOuverte('equipe')}
                    title={`${poke.nom} N.${poke.niveau}`}
                  >
                    <img src={poke.sprite} alt={poke.nom} className="mini-poke-sprite" />
                    <span className="mini-poke-nom">{poke.nom}</span>
                    <span className="mini-poke-niv">N.{poke.niveau}</span>
                    <span className="mini-barre"><span className="mini-barre-fill" style={{ width: `${pct}%` }}></span></span>
                  </button>
                )
              })}
            </div>
            <button className="bouton-gerer" onClick={() => setVueOuverte('equipe')}>Gérer l'équipe</button>
          </div>

          <div className="panneau">
            <div className="panneau-titre">
              <img src="/icons/routes.png" alt="" className="panneau-icone" /> Zone rapide
            </div>
            <div className="zone-rapide-nom">{routeParId(routeActive).emoji} {routeParId(routeActive).nom}</div>
            <div className="zone-rapide-nav">
              <button
                className="zone-rapide-btn"
                onClick={() => changerZoneRapide(-1)}
                disabled={indexZoneActive <= 0}
              >◀ Préc.</button>
              <span className="zone-rapide-compteur">{indexZoneActive + 1}/{zonesDebloquees.length}</span>
              <button
                className="zone-rapide-btn"
                onClick={() => changerZoneRapide(1)}
                disabled={indexZoneActive >= zonesDebloquees.length - 1}
              >Suiv. ▶</button>
            </div>
          </div>

          <div className="panneau" data-tuto="achat">
            <div className="panneau-titre">
              <img src="/icons/boutique.png" alt="" className="panneau-icone" /> Achat rapide
            </div>
            {['poke', 'super', 'hyper', 'master'].map((type) => (
              <div key={type} className="achat-rapide-ligne">
                <div className="achat-rapide-info">
                  <img src={ICONES_BALLS[type]} alt="" className="achat-rapide-ball-img" />
                  <span className="achat-rapide-prix">{formaterNombre(BALLS[type].prix)}<span className="achat-rapide-devise">₽</span></span>
                </div>
                <div className="achat-rapide-boutons">
                  {[1, 10, 100].map((lot) => (
                    <button
                      key={lot}
                      className="achat-rapide-btn"
                      onClick={() => acheterBall(type, lot)}
                      disabled={pokeDollars < BALLS[type].prix * lot}
                    >+{lot}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="panneau">
            <div className="panneau-titre">
              <img src="/icons/pokedex.png" alt="" className="panneau-icone" /> Pokédex
            </div>
            <div className="stat-mini-ligne"><span>Vus</span><span className="stat-mini-val">{pokedexVus.length}/1025</span></div>
            <div className="mini-barre" style={{ height: '8px', margin: '6px 0' }}>
              <span className="mini-barre-fill" style={{ width: `${pctPokedex}%`, background: 'var(--jaune)' }}></span>
            </div>
            <div className="stat-mini-ligne"><span>Shinies ✨</span><span className="stat-mini-val">{pokedexShiny.length}</span></div>
          </div>
        </aside>

        <main className="colonne colonne-centre" data-tuto="arene">
          <div className="bandeau-zone">
            <span className="bandeau-zone-nom">{routeParId(routeActive).nom}</span>
            <span className="bandeau-zone-num">
              <span className="bandeau-zone-numtxt">Zone {numZone}-{combatActuel}</span>
              {combatBoss ? (
                <span className="bandeau-badge bandeau-badge-boss">BOSS</span>
              ) : (
                <span className="boss-jauge" title={bossOk ? `Le boss revient tous les ${seuilBoss} combats` : `Victoires avant le boss : ${Math.min(victoiresZone, seuilBoss)}/${seuilBoss}`}>
                  <span className="boss-jauge-piste">
                    <span className="boss-jauge-fill" style={{ width: `${progression}%` }}>
                      <span className="boss-jauge-brillance"></span>
                    </span>
                  </span>
                  <span className="boss-jauge-txt">{Math.min(victoiresZone, seuilBoss)}/{seuilBoss} <span className="boss-jauge-couronne">👑</span></span>
                </span>
              )}
            </span>
          </div>

          {combatBoss && (
            <div className="bandeau-boss-timer">
              <p className="bandeau-boss">⚠️ COMBAT DE BOSS ⚠️</p>
              <TimerAnneau tempsRestant={tempsBossZone} tempsTotal={45} taille={58} />
            </div>
          )}

          {!compoValide && (
            <div className="alerte-compo">
              <p className="alerte-compo-titre">⚠️ Composition d'équipe invalide</p>
              <p className="alerte-compo-sous">Le combat est en pause. Compo : 1 à 2 Pokémon par rôle, les 4 rôles présents, 1 spécial max.</p>
              <ul className="alerte-compo-liste">
                {compoDiagnostic.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          <div className={`arene arene-terrain ${combatBoss ? 'arene-boss' : ''}`} style={{
            backgroundImage: `url(${routeParId(routeActive).decor})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            {/* Particules d'ambiance (varie selon la zone : feuilles, neige, cendres...) */}
            <div className={`terrain-particules ambiance-${ambianceDeZone(routeParId(routeActive).decor)}`} aria-hidden="true">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className={`particule particule-${i % 7}`}></span>
              ))}
            </div>

            <div className="terrain-rangee terrain-ennemis">
              {equipeEnnemie.map((poke, i) => {
                const marqueeMaster = ciblesMasterBall.some((c) => c.cle === `${poke.id}${poke.shiny ? '-shiny' : ''}`)
                const ciblable = !poke.estBoss && !poke.estEvolution
                return (
                <div className="terrain-slot" key={i}>
                  <SpriteCombattant
                    pokemon={poke}
                    pvActuels={pvEnnemis[i]}
                    jauge={jaugeEnnemis[i]}
                    camp="ennemi"
                    ultimeLance={ultimeLanceEnnemiAff[i] || false}
                    ultimeEnnemi
                    marqueeMaster={marqueeMaster}
                    ciblableMaster={ciblable}
                    onCiblerMaster={() => basculerCibleMasterBall(poke)}
                  />
                  <div className="chiffres-couche">
                    {chiffresFlottants.filter((c) => c.camp === 'ennemi' && c.index === i).map((c) => (
                      <span key={c.id} className={`chiffre-flottant ${c.type}`} style={{ left: `calc(50% + ${c.dx}px)` }}>
                        {c.type === 'crit' ? `${c.montant} !` : c.type === 'soin' ? `+${c.montant}` : c.montant}
                      </span>
                    ))}
                  </div>
                </div>
                )
              })}
            </div>

            <div className="terrain-vs"><img src={ICONE_COMBAT} alt="VS" className="vs-img" /></div>

            {/* Équipe du joueur (en bas, de dos) */}
            <div className="terrain-rangee terrain-joueur">
              {equipeJoueur.map((poke, i) => (
                <div className="terrain-slot" key={poke.uid}>
                  <SpriteCombattant
                    pokemon={poke}
                    pvActuels={pvJoueur[i]}
                    jauge={jaugeJoueur[i]}
                    camp="joueur"
                    ultimeLance={ultimeLanceJoueur[i] || false}
                  />
                  <div className="chiffres-couche">
                    {chiffresFlottants.filter((c) => c.camp === 'joueur' && c.index === i).map((c) => (
                      <span key={c.id} className={`chiffre-flottant ${c.type}`} style={{ left: `calc(50% + ${c.dx}px)` }}>
                        {c.type === 'crit' ? `${c.montant} !` : c.type === 'soin' ? `+${c.montant}` : c.montant}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="console">
            {journal.length === 0 ? (
              <p className="console-vide">Le combat commence...</p>
            ) : (
              journal.map((ligne) => (
                <p key={ligne.id} className={`console-ligne ${ligne.type}`}>{ligne.texte}</p>
              ))
            )}
          </div>
        </main>

        <aside className="colonne colonne-droite" data-tuto="capture">
          <div className="panneau panneau-capture-v2">
            <div className="panneau-titre panneau-titre-capture">
              <span><img src="/icons/capture.png" alt="" className="panneau-icone" /> Capture</span>
              <span className="capture-limite-badge" title="Balls max dépensées par espèce et par combat">
                max {reglesCapture.limiteBalls === 'infini' ? '∞' : (reglesCapture.limiteBalls ?? 5)}
              </span>
            </div>

            <button className="bouton-regles-capture" onClick={() => setVueOuverte('regles')}>
              <Settings size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} /> Règles de capture
            </button>

            {(() => {
              const labelBall = {
                auto: 'Auto', poke: 'Poké', super: 'Super',
                hyper: 'Hyper', master: 'Master', rien: '✕',
              }
              const categories = [
                { cle: 'shiny', Icone: Sparkles, couleur: 'var(--m-or)', nom: 'Shiny' },
                { cle: 'legendaire', Icone: Crown, couleur: 'var(--m-violet-clair)', nom: 'Légendaire' },
                { cle: 'nouveau', Icone: Plus, couleur: 'var(--m-vert)', nom: 'Nouveau' },
                { cle: 'doublon', Icone: Repeat, couleur: 'var(--m-texte-3)', nom: 'Doublon' },
              ]
              const ballsResume = [
                { cle: 'poke', nom: 'Poké Ball' },
                { cle: 'super', nom: 'Super Ball' },
                { cle: 'hyper', nom: 'Hyper Ball' },
                { cle: 'master', nom: 'Master Ball' },
              ]
              const classeBall = (c) => c === 'rien' ? 'rien' : (c === 'master' ? 'master' : (c === 'hyper' ? 'hyper' : 'auto'))
              return (
                <>
                  {/* Règles actives : grille 2×2, icône + ball choisie */}
                  <div className="capture-regles-grille">
                    {categories.map((c) => {
                      const Ic = c.Icone
                      return (
                      <div key={c.cle} className="capture-regle-case" title={c.nom}>
                        <span className="capture-regle-emoji" style={{ color: c.couleur }}><Ic size={14} /></span>
                        <span className={`capture-regle-ball ball-${classeBall(reglesCapture[c.cle] || 'auto')}`}>
                          {labelBall[reglesCapture[c.cle]] || 'Auto'}
                        </span>
                      </div>
                      )
                    })}
                  </div>

                  {/* Cibles Master Ball : sprites cliquables (× pour retirer). Caché si vide. */}
                  {ciblesMasterBall.length > 0 && (
                    <div className="capture-cibles">
                      <img
                        src={ICONES_BALLS.master}
                        alt="Master Ball"
                        className="capture-cibles-icone"
                      />
                      <div className="capture-cibles-liste">
                        {ciblesMasterBall.map((c) => (
                          <button
                            key={c.cle}
                            className={`capture-cible-pastille ${c.shiny ? 'shiny' : ''}`}
                            title={`${c.nom}${c.shiny ? ' ✨' : ''} — clic pour retirer`}
                            onClick={() => {
                              const maj = ciblesMasterBall.filter((x) => x.cle !== c.cle)
                              ciblesMasterBallRef.current = maj
                              setCiblesMasterBall(maj)
                            }}
                          >
                            {c.sprite
                              ? <img src={c.sprite} alt={c.nom} className="capture-cible-sprite" />
                              : <span className="capture-cible-nom">{c.nom}</span>}
                            <span className="capture-cible-x">×</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stock de balls : grille 4 colonnes, alerte rouge à 0 */}
                  <div className="capture-balls-grille">
                    {ballsResume.map((b) => {
                      const n = balls[b.cle] ?? 0
                      return (
                        <div key={b.cle} className={`capture-ball-case ${n === 0 ? 'vide' : ''}`} title={b.nom}>
                          {ICONES_BALLS[b.cle] && <img src={ICONES_BALLS[b.cle]} alt="" className="capture-ball-img" />}
                          <span className="capture-ball-nb">{n}</span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>

          <div className="panneau">
            <div className="panneau-titre">
              <img src="/icons/vitesse.png" alt="" className="panneau-icone" /> Vitesse
            </div>
            <div className="ctrl-rangee">
              <button className={`mode-btn ${vitesse === 1 ? 'actif' : ''}`} onClick={() => setVitesse(1)}>×1</button>
              <button className={`mode-btn ${vitesse === 2 ? 'actif' : ''}`} onClick={() => setVitesse(2)}>×2</button>
              <button className={`mode-btn ${vitesse === 4 ? 'actif' : ''}`} onClick={() => setVitesse(4)}>×4</button>
              <button className={`mode-btn ${vitesse === 8 ? 'actif' : ''}`} onClick={() => setVitesse(8)}>×8</button>
            </div>
          </div>

          <div className="panneau">
            <div className="panneau-titre">
              <span className="panneau-icone-emoji">⚡</span> Ultimes
            </div>
            <p className="ultime-aide">
              Chaque Pokémon déclenche automatiquement son ultime environ 7 secondes après le début du combat (une fois par combat).
            </p>
          </div>

          <div className="panneau">
            <div className="panneau-titre">
              <img src="/icons/routes.png" alt="" className="panneau-icone" /> Mode auto
            </div>
            <button
              className={`bouton-auto ${autoZone ? 'actif' : ''}`}
              onClick={() => setAutoZone((v) => !v)}
              title="Passe automatiquement à la zone suivante après chaque boss vaincu"
            >
              {autoZone ? '⏸️ Auto zone : ON' : '▶️ Auto zone : OFF'}
            </button>
            <p className="bouton-auto-aide">
              Passe à la zone suivante dès qu'un boss est vaincu. S'arrête à la dernière zone.
            </p>
          </div>

          <div className="panneau">
            <div className="panneau-titre">
              <img src="/icons/objets.png" alt="" className="panneau-icone" /> Ressources
            </div>

            <div className="res-section">
              <span className="res-section-titre">Poké Balls</span>
              <div className="ressources-balls">
                <span className="res-item"><img src={ICONES_BALLS.poke} alt="" className="res-ball-img" /> {balls.poke}</span>
                <span className="res-item"><img src={ICONES_BALLS.super} alt="" className="res-ball-img" /> {balls.super}</span>
                <span className="res-item"><img src={ICONES_BALLS.hyper} alt="" className="res-ball-img" /> {balls.hyper}</span>
                <span className="res-item"><img src={ICONES_BALLS.master} alt="" className="res-ball-img" /> {balls.master}</span>
              </div>
            </div>

            {(objetsBoss.rouage > 0 || objetsBoss.cristal > 0 || objetsBoss.relique > 0) && (
              <div className="res-section">
                <span className="res-section-titre">Objets de boss</span>
                <div className="ressources-objets">
                  {objetsBoss.rouage > 0 && (
                    <span className="res-item" title={OBJETS_BOSS.rouage.nom}>
                      <img src={OBJETS_BOSS.rouage.sprite} alt="" className="res-ball-img"
                        onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.rouage.emoji)) }} /> {objetsBoss.rouage}
                    </span>
                  )}
                  {objetsBoss.cristal > 0 && (
                    <span className="res-item" title={OBJETS_BOSS.cristal.nom}>
                      <img src={OBJETS_BOSS.cristal.sprite} alt="" className="res-ball-img"
                        onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.cristal.emoji)) }} /> {objetsBoss.cristal}
                    </span>
                  )}
                  {objetsBoss.relique > 0 && (
                    <span className="res-item" title={OBJETS_BOSS.relique.nom}>
                      <img src={OBJETS_BOSS.relique.sprite} alt="" className="res-ball-img"
                        onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.relique.emoji)) }} /> {objetsBoss.relique}
                    </span>
                  )}
                </div>
              </div>
            )}

            {Object.entries(pierres).filter(([, n]) => n > 0).length > 0 && (
              <div className="res-section">
                <span className="res-section-titre">Pierres</span>
                <div className="ressources-objets">
                  {Object.entries(pierres).filter(([, n]) => n > 0).map(([cle, n]) => (
                    <span key={cle} className="res-item" title={PIERRES[cle]?.nom || cle}>
                      {ICONES_PIERRES[cle] ? <img src={ICONES_PIERRES[cle]} alt="" className="res-ball-img" /> : (PIERRES[cle]?.emoji || '💎')} {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.entries(bonbons).filter(([, n]) => n > 0).length > 0 && (
              <div className="res-section">
                <span className="res-section-titre">Bonbons</span>
                <div className="ressources-objets">
                  {Object.entries(bonbons).filter(([, n]) => n > 0).map(([cle, n]) => (
                    <span key={cle} className="res-item" title={BONBONS[cle]?.nom || cle}>
                      {ICONES_BONBONS[cle] ? <img src={ICONES_BONBONS[cle]} alt="" className="res-ball-img" /> : (BONBONS[cle]?.emoji || '🍬')} {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="ressources-compteurs">
              <span><img src={ICONE_COMBAT} alt="" className="icone-inline" /> {vaincus}</span>
              <span>🎯 {captures.length}</span>
            </div>
          </div>
        </aside>

      </div>

      {captureRecente && (
        <div className="encart-capture" key={captureRecente.cle}>
          <div className={`encart-capture-boite ${captureRecente.shiny ? 'shiny' : ''}`}>
            <img src={captureRecente.sprite} alt={captureRecente.nom} className="encart-capture-sprite" />
            <div className="encart-capture-texte">
              <span className="encart-capture-titre">{captureRecente.shiny ? '✨ SHINY capturé !' : 'Capturé !'}</span>
              <span className="encart-capture-nom">{captureRecente.nom}</span>
            </div>
          </div>
        </div>
      )}

      {dropRecent && (
        <div className="encart-drop" key={dropRecent.cle}>
          <div className={`encart-drop-boite ${dropRecent.legendaire ? 'legendaire' : ''}`}>
            <img
              src={dropRecent.sprite}
              alt={dropRecent.nom}
              className="encart-drop-sprite"
              onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(dropRecent.emoji)) }}
            />
            <div className="encart-drop-texte">
              <span className="encart-drop-titre">{dropRecent.legendaire ? '👑 Butin légendaire !' : 'Butin de boss !'}</span>
              <span className="encart-drop-nom">{dropRecent.nom}</span>
            </div>
          </div>
        </div>
      )}

      {!identiteJoueur && (
        <ChoixPseudo onValide={(identite) => setIdentiteJoueur(identite)} />
      )}
      {nouveautesOuvert && (
        <PanneauNouveautes onFermer={fermerNouveautes} />
      )}
      {identiteJoueur && changerPseudoOuvert && (
        <ChoixPseudo
          onValide={(identite) => {
            setIdentiteJoueur(identite)
            setChangerPseudoOuvert(false)
            // Renvoie le score sous le nouveau pseudo (même ligne Supabase, l'id ne change pas).
            setTimeout(() => envoyerScore(statsClassementRef.current), 0)
            ajouterAuJournal(`Pseudo changé : ${identite.pseudo} 🏆`, 'info')
          }}
          onAnnuler={() => setChangerPseudoOuvert(false)}
        />
      )}
      {vueOuverte === 'classement' && (
        <Classement onFermer={() => setVueOuverte(null)} />
      )}
      {vueOuverte === 'pokedex' && (
        <>
        <TutoFenetre id="pokedex" />
        <Pokedex
          pokedexVus={pokedexVus}
          pokedexShiny={pokedexShiny}
          pokedexSpeciaux={pokedexSpeciaux}
          recompensesReclamees={recompensesReclamees}
          onReclamer={reclamerRecompense}
          onFermer={() => setVueOuverte(null)}
        />
        </>
      )}
      {vueOuverte === 'equipe' && (
        <>
        <TutoFenetre id="equipe" />
        <Equipe
          equipe={equipeJoueur}
          collection={captures}
          pierres={pierres}
          objets={objets}
          onEquiperObjet={equiperObjet}
          onEvoluerPierre={evoluerParPierre}
          onChoisirPassif={choisirPassif}
          onChoisirCaseJoker={choisirCaseJoker}
          parchemins={parchemins}
          onAppliquerParchemin={appliquerParchemin}
          onAjouterMembre={(poke) => {
            if (equipeIds.length >= 6) return
            if (equipeIds.includes(poke.uid)) return
            if (estSpecial(poke) && compterSpeciaux(equipeIds, captures) >= 1) {
              alert('Un seul Pokémon spécial autorisé par équipe. Retire d\'abord celui qui est déjà dans l\'équipe.')
              return
            }
            const nouveaux = trierIdsParRole([...equipeIds, poke.uid], captures)
            setEquipeIds(nouveaux)
            equipeIdsRef.current = nouveaux
            ajouterAuJournal(`${poke.nom} rejoint l'équipe au prochain combat.`, 'info')
          }}
          onRetirerMembre={(index) => {
            const nouveaux = trierIdsParRole(equipeIds.filter((_, i) => i !== index), captures)
            setEquipeIds(nouveaux)
            equipeIdsRef.current = nouveaux
            ajouterAuJournal(`Pokémon retiré de l'équipe.`, 'info')
          }}
          onAutoEquipe={autoEquipe}
          onFermer={() => setVueOuverte(null)}
        />
        </>
      )}
      {vueOuverte === 'routes' && (
        <>
        <TutoFenetre id="routes" />
        <MenuRoutes
          routeActive={routeActive}
          victoiresParRoute={victoiresParRoute}
          bossVaincus={bossVaincus}
          nomsVus={captures.map((p) => p.nom)}
          tableNoms={tableNoms}
          ciblesMasterBall={ciblesMasterBall}
          onCiblerMasterBall={(numero, nom) => {
            // Cible une ESPÈCE (version normale) pour la Master Ball depuis le menu Routes.
            const cle = `${numero}`
            const dejaCiblee = ciblesMasterBallRef.current.some((c) => c.cle === cle)
            setCiblesMasterBall((liste) => {
              const maj = dejaCiblee
                ? liste.filter((c) => c.cle !== cle)
                : [...liste, {
                    cle,
                    id: numero,
                    nom,
                    shiny: false,
                    sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`,
                  }]
              ciblesMasterBallRef.current = maj
              return maj
            })
            ajouterAuJournal(
              !dejaCiblee
                ? `⚫ ${nom} ciblé pour la Master Ball.`
                : `${nom} n'est plus ciblé Master Ball.`,
              'info'
            )
          }}
          onChoisir={(id) => {
            setRouteActive(id)
            routeActiveRef.current = id
            ajouterAuJournal(`Direction ${routeParId(id).nom} ! 🗺️`, 'info')
            setVueOuverte(null)
          }}
          onFermer={() => setVueOuverte(null)}
        />
        </>
      )}
      {vueOuverte === 'prestige' && (
        <PanneauPrestige
          medailles={medailles}
          investis={investisPrestige}
          gainPotentiel={gainPrestige}
          multiplicateurs={multisPrestige}
          onInvestir={investirMedaille}
          onPrestige={faireePrestige}
          onFermer={() => setVueOuverte(null)}
        />
      )}
      {vueOuverte === 'regles' && (
        <ReglesCapture
          regles={reglesCapture}
          balls={balls}
          icones={ICONES_BALLS}
          onChanger={(categorie, choix) => {
            setReglesCapture((r) => {
              const nouvelles = { ...r, [categorie]: choix }
              reglesCaptureRef.current = nouvelles
              return nouvelles
            })
          }}
          onChangerLimite={(val) => {
            setReglesCapture((r) => {
              const nouvelles = { ...r, limiteBalls: val }
              reglesCaptureRef.current = nouvelles
              return nouvelles
            })
          }}
          onFermer={() => setVueOuverte(null)}
        />
      )}
      {vueOuverte === 'stats' && (
        <PanneauStats
          vaincus={vaincus}
          captures={captures}
          pokedexVus={pokedexVus}
          pokedexShiny={pokedexShiny}
          pokeDollars={pokeDollars}
          nbBoss={Object.values(bossVaincus).filter(Boolean).length}
          nbDresseurs={Object.keys(dresseursVaincus).length}
          nbSpeciaux={pokedexSpeciaux.length}
          nbZones={ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length}
          totalZones={ROUTES.length}
          totalDresseurs={DRESSEURS.length}
          totalSpeciaux={SPECIAUX.length}
          pseudoActuel={identiteJoueur?.pseudo || ''}
          onChangerPseudo={() => setChangerPseudoOuvert(true)}
          onFermer={() => setVueOuverte(null)}
        />
      )}
      {vueOuverte === 'boutique' && (
        <>
        <TutoFenetre id="boutique" />
        <Boutique
          pokeDollars={pokeDollars}
          balls={balls}
          pierres={pierres}
          bonbons={bonbons}
          objets={objets}
          parchemins={parchemins}
          achatsItems={achatsItems}
          onAcheterBall={acheterBall}
          onAcheterPierre={acheterPierre}
          onAcheterBonbon={acheterBonbon}
          onAcheterObjet={acheterObjet}
          onAcheterParchemin={acheterParchemin}
          onFermer={() => setVueOuverte(null)}
        />
        </>
      )}
      {vueOuverte === 'sac' && (
        <>
        <TutoFenetre id="sac" />
        <Sac
          balls={balls}
          pierres={pierres}
          bonbons={bonbons}
          objetsBoss={objetsBoss}
          collection={captures}
          onEvoluerPierre={evoluerParPierre}
          onUtiliserBonbon={utiliserBonbon}
          onUtiliserBonbonIV={utiliserBonbonIV}
          onFermer={() => setVueOuverte(null)}
        />
        </>
      )}
      {vueOuverte === 'succes' && (
        <PanneauSucces
          succesDebloques={succesDebloques}
          etatSucces={{
            nbCaptures: captures.length,
            nbShiny: pokedexShiny.length,
            nbVus: pokedexVus.length,
            totalDex: 1025,
            nbVaincus: vaincus,
            nbBoss: Object.values(bossVaincus).filter(Boolean).length,
            nbDresseurs: Object.keys(dresseursVaincus).length,
            nbZones: ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length,
            nbSpeciaux: pokedexSpeciaux.length,
          }}
          onFermer={() => setVueOuverte(null)}
        />
      )}
      {vueOuverte === 'ameliorations' && (
        <PanneauAmeliorations
          ameliorations={ameliorations}
          pokeDollars={pokeDollars}
          objetsBoss={objetsBoss}
          onAcheter={acheterAmelioration}
          onAcheterEndgame={acheterAmeliorationEndgame}
          onFermer={() => setVueOuverte(null)}
        />
      )}

      {vueOuverte === 'sauvegarde' && (
        <PanneauSauvegarde onFermer={() => setVueOuverte(null)} onRevoirTutos={() => {
          reinitialiserTutos()
          ajouterAuJournal('Tutos réinitialisés : ils réapparaîtront en ouvrant chaque fenêtre.', 'info')
        }} />
      )}

      {vueOuverte === 'oeufs' && (
        <>
        <TutoFenetre id="oeufs" />
        <PanneauOeufs
          oeufsIncubes={oeufsIncubes}
          reserveOeufs={reserveOeufs}
          jetonsElevage={jetonsElevage}
          onPlacerOeuf={placerOeuf}
          onEclore={eclore}
          onAcheterOeuf={acheterOeuf}
          onFermer={() => setVueOuverte(null)}
        />
        </>
      )}

      {renduTutoriel}
    </div>
  )
}

export default App