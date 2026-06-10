import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  BookOpen, Users, Map as MapIcon, BarChart3, ShoppingBag, Backpack,
  Trophy, Zap, Swords, Flame, Crosshair, Medal, Save, HelpCircle, Trash2,
  Settings, Gauge, Boxes, ChevronLeft, ChevronRight, Coins, Target, Play, Pause,
  Sparkles, Crown, Plus, Repeat, Egg, MoreHorizontal,
} from 'lucide-react'
import { VITESSE_COMBAT, PAUSE_RESPAWN, GAIN_PAR_VICTOIRE, GAIN_BASE_ENNEMI, BONUS_STAT_NIVEAU, XP_BASE_NIVEAU, XP_BASE_ENNEMI, TAUX_CAPTURE_RARETE, BALLS, BALL_AUTO_PAR_RARETE, TAUX_SHINY, PIERRES, BONBONS, prixDynamique, multiplicateurSurclassement } from './config'
import { ticCombat, appliquerUltime } from './moteurCombat'
import { statutsActifs, STATUTS, reinitialiserStatuts } from './statuts'
import { ULTIMES, ultimeDuRole, COUT_ULTIME } from './ultimes'
import { genererIV, statsFinales, fusionnerIV, ajouterXP, xpRequise, normaliserIV } from './stats'
import { ROLES, determinerRole, determinerPassif, bonusDuPassif, compositionValide, diagnostiqueComposition, compterRoles, COMPOSITION_REQUISE, trierIdsParRole, passifParDefautDuRole, passifPourMode, champPassifDuMode } from './roles'
import { statsBaseOfficielles, niveauMinimalForme } from './donneesPokemon'
import { urlFusionDepuisNational, reparerFusions, appliquerGeneDominant } from './fusion'
import { ROUTES, routeParId, tirerPokemon, MULTI_XP_RARETE, bossDeLaRoute, COMBATS_AVANT_BOSS, FORCE_BOSS, routeDebloquee } from './routes'
import CartePokemon from './CartePokemon'
import SpriteCombattant from './SpriteCombattant'
import TutoFenetre from './TutoFenetre'
import { reinitialiserTutos } from './tuto'
import GuideInteractif from './GuideInteractif'
import { guideEstVu, reinitialiserGuides } from './guides'
import EcranConnexion from './EcranConnexion'
import { sessionActuelle, surChangementAuth, deconnecter } from './apiAuth'
import { chargerSlotsCloud, chargerSlotCloud, sauverSlotCloud, supprimerSlotCloud } from './apiAuth'
import PanneauOeufs from './PanneauOeufs'
import { creerOeuf, tirerRareteOeuf, pretAEclore, combatsRequis, NB_INCUBATEURS, NB_INCUBATEURS_DEPART, NB_INCUBATEURS_MAX, TAUX_DROP_OEUF, TYPES_OEUF, infoOeuf, JETONS_PAR_ECLOSION, JETONS_PAR_BOSS, CHANCE_JETON_COMBAT, tirerContenuOeuf, ivDepuisOeuf, shinyDepuisOeuf, ameliorationsParDefaut, prixAmelioration, prixIncubateur, NIVEAU_MAX_AMELIO, bonusChance, bonusRendement, nbIncubateurs } from './oeufs'
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
import MenuTitre from './MenuTitre'
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
import { medaillesGagnables, multiplicateursPrestige, totalInvesti, BONUS_PRESTIGE, ORDRE_BONUS_PRESTIGE, plafondNiveau, estAuPlafond, conditionsPrestige, coutAmeliorationPrestige } from './prestige'
import { multiplicateurDifficulte } from './difficulte'
import { chargerInfosEspece, corrigerNom } from './evolution'
import { SPECIAUX, specialDuBoss, estIdSpecial } from './speciaux'
import Classement from './Classement'
import ChoixPseudo from './ChoixPseudo'
import { chargerIdentite, envoyerScore, definirPseudo } from './apiClassement'
import { chargerTableNoms } from './pokedexNoms'
import { creerHorloge } from './horlogeWorker'
import PanneauTour from './PanneauTour'
import CentreFusion from './CentreFusion'
import AmbianceCombat from './AmbianceCombat'
import CombatTour from './CombatTour'
import { dropCarteTour, difficulteNiveau, niveauPokemonTour, tailleEquipeTour, bonusCompletionSet, ORDRE_SETS, typeNiveau, multiplicateurRareTour, estimerTauxCarte } from './tour'

const CLE_SAUVEGARDE_BASE = 'pokedex-idle-save-v11'
// Slot 1 = ancienne cle (migration auto). Slots 2 et 3 = cles dediees.
function cleSlot(n) { return n === 1 ? CLE_SAUVEGARDE_BASE : `${CLE_SAUVEGARDE_BASE}-slot${n}` }
const CLE_SLOT_ACTIF = 'pokedle-slot-actif'
const CLE_NOUVEAUTES = 'pokedle-nouveautes-vue-v12'
const VERSION_RESET_HISTOIRE = 2
const RESET_HISTOIRE_ACTIF = false
const VERSION_NETTOYAGE_DOUBLONS = 1
const VERSION_RESET_DEPART = 1
const RESET_DEPART_ACTIF = false
const COMBATS_REFARM_BOSS = 250

const TAUX_OBJET_BOSS = {
  zone:  { rouage: 0.0010, cristal: 0.0007, relique: 0.0005 },
  arene: { rouage: 0.0012, cristal: 0.0008, relique: 0.0005 },
  raid:  { rouage: 0.0015, cristal: 0.0010, relique: 0.0006 },
}
const TAUX_BONBON_IV = { zone: 0.06, arene: 0.08, raid: 0.10 }
const CLES_BONBON_IV = ['iv_pv', 'iv_attaque', 'iv_vitesse', 'iv_defense']

function ambianceDeZone(decor) {
  const d = (decor || '').toLowerCase()
  if (d.includes('neige') || d.includes('cristal') || d.includes('sommet')) return 'neige'
  if (d.includes('volcan') || d.includes('feu') || d.includes('forge')) return 'cendres'
  if (d.includes('desert') || d.includes('sable') || d.includes('plage')) return 'sable'
  if (d.includes('grotte') || d.includes('abysses') || d.includes('temple') || d.includes('marais')) return 'spores'
  if (d.includes('foret') || d.includes('prairie') || d.includes('jade') || d.includes('sanctuaire') || d.includes('dragon')) return 'feuilles'
  return 'poussiere'
}

const ICONES_BALLS = Object.fromEntries(Object.entries(BALLS).map(([k, v]) => [k, v.sprite]))
const ICONE_ARGENT = '/icons/argent.png'
const ICONE_COMBAT = '/icons/combat.png'
const ICONES_BONBONS = Object.fromEntries(Object.entries(BONBONS).map(([k, v]) => [k, v.sprite]))
const ICONES_PIERRES = Object.fromEntries(Object.entries(PIERRES).map(([k, v]) => [k, v.sprite]))

let compteurUid = 0
let compteurJournal = 0
let bonusShinyGlobal = 1
let bonusShinyObjets = 1
let bonusArgentObjets = 1
let bonusCompletionXP = 1
let bonusCompletionArgent = 1
let bonusSuccesXP = 1
let bonusSuccesArgent = 1
let bonusPrestigeXP = 1
let bonusPrestigeArgent = 1
let bonusPrestigeShiny = 1
let bonusPrestigePuissance = 1
let bonusTourXP = 1

function nouvelUid() {
  compteurUid += 1
  return `${Date.now()}-${compteurUid}-${Math.floor(Math.random() * 100000)}`
}

function formaterNombre(n) {
  if (n >= 1000000) { const v = n / 1000000; return (v % 1 === 0 ? v : v.toFixed(1)) + 'M' }
  if (n >= 1000) { const v = n / 1000; return (v % 1 === 0 ? v : v.toFixed(1)) + 'k' }
  return String(n)
}

function estSpecial(poke) {
  if (!poke) return false
  if (poke.estSpecial === true) return true
  return estIdSpecial(poke.id)
}

function compterSpeciaux(ids, collection) {
  return (ids || []).map((uid) => (collection || []).find((p) => p && p.uid === uid)).filter((p) => estSpecial(p)).length
}

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
  if (!reponse.ok) throw new Error(`Pokemon introuvable : ${nom}`)
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
        nom: dataEvo.name, id: dataEvo.id, ...statsBaseDepuis(dataEvo),
        types: dataEvo.types.map((t) => t.type.name),
        sprite: dataEvo.sprites.front_default, spriteNormal: dataEvo.sprites.front_default,
        spriteShiny: dataEvo.sprites.front_shiny, evolueEn: infosEvo.evolueEn, evolueNiveau: infosEvo.evolueNiveau,
      }
    } catch (err) { formeEvoluee = null }
  }
  const base = {
    uid: nouvelUid(), nom: data.name, id: data.id, ...statsBaseDepuis(data),
    types: data.types.map((t) => t.type.name),
    sprite: data.sprites.front_default, spriteNormal: data.sprites.front_default,
    spriteShiny: data.sprites.front_shiny, shiny: false, iv, niveau: 1, xp: 0,
    evolueEn: infos.evolueEn, evolueNiveau: infos.evolueNiveau,
    evolutionsPierre: infos.evolutionsPierre || [], formeEvoluee,
    estEvolution: infos.estEvolution, familleId: infos.familleId,
  }
  base.role = determinerRole(base)
  base.passif = determinerPassif(base)
  const finales = statsFinales(base, BONUS_STAT_NIVEAU)
  return { ...base, ...finales }
}

function appliquerBonusEquipe(equipe) {
  if (!equipe || equipe.length === 0) return equipe
  let boostPv = 0
  for (const p of equipe) { if (!p) continue; const eff = bonusDuPassif(p); boostPv += eff.boostPvEquipe || 0 }
  if (boostPv <= 0) return equipe
  const facteur = 1 + boostPv
  return equipe.map((p) => { if (!p) return p; return { ...p, pvMax: Math.max(1, Math.round(p.pvMax * facteur)) } })
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
      try { const p = await chargerPokemon(t.nom, false); return { ...p, rarete: t.rarete } }
      catch (err) { const p = await chargerPokemon('magikarp', false); return { ...p, rarete: t.rarete } }
    })
  )
  const parRole = { tank: [], eclaireur: [], soutien: [], dps: [] }
  for (const c of candidats) { const role = c.role || determinerRole(c); if (parRole[role]) parRole[role].push(c) }
  const reste = [...candidats]
  function prendre(role, n) {
    const choisis = []
    for (let k = 0; k < n; k++) {
      let p = parRole[role] && parRole[role].length ? parRole[role].shift() : null
      if (!p) p = reste.find(Boolean)
      if (p) { choisis.push(p); const idx = reste.indexOf(p); if (idx >= 0) reste.splice(idx, 1) }
    }
    return choisis
  }
  const equipe = [
    ...prendre('tank', COMPOSITION_REQUISE.tank), ...prendre('eclaireur', COMPOSITION_REQUISE.eclaireur),
    ...prendre('soutien', COMPOSITION_REQUISE.soutien), ...prendre('dps', COMPOSITION_REQUISE.dps),
  ]
  const handicap = route.handicapEnnemi || 1
  const positionZone = ROUTES.findIndex((r) => r.id === route.id) + 1
  const multiDiff = multiplicateurDifficulte(positionZone)
  const equipeFinale = equipe.map((p, i) => {
    const niveau = Math.max(1, route.niveau + Math.floor(Math.random() * 5) - 2)
    const rarete = p.rarete
    const tauxShiny = (TAUX_SHINY[rarete] ?? (1 / 4096)) * bonusShinyGlobal * bonusShinyObjets
    const estShiny = Math.random() < tauxShiny
    const avecNiveau = { ...p, niveau, rarete, shiny: estShiny, sprite: estShiny && p.spriteShiny ? p.spriteShiny : p.spriteNormal }
    const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
    return { ...avecNiveau, ...finales, uid: `enn-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`, pvMax: Math.max(1, Math.round(finales.pvMax * handicap * multiDiff)), attaque: Math.max(1, Math.round(finales.attaque * handicap * multiDiff)) }
  })
  return appliquerBonusEquipe(equipeFinale)
}

// ============================================================
// EQUIPE ENNEMIE DE LA TOUR INFINIE
// Toujours 6 ennemis. Mini-boss (niv 5,15,25...) et boss (niv 10,20...) :
// un des 6 devient un Pokemon RARE (stats + niveau boostes, marque visuellement).
// ============================================================
async function chargerEquipeTour(route, niveauTour, typeNiv) {
  // On part de la generation standard (renvoie 6 via COMPOSITION_REQUISE).
  let equipe = await chargerEquipeEnnemie(route)
  // Securite : garantir exactement 6 membres pleins.
  equipe = (equipe || []).filter(Boolean)
  while (equipe.length < 6 && equipe.length > 0) {
    // Duplique un membre existant si jamais il en manque (robustesse).
    const modele = equipe[equipe.length % equipe.length]
    equipe.push({ ...modele, uid: `${modele.uid || 'tour'}-dup-${equipe.length}` })
  }
  equipe = equipe.slice(0, 6)

  // Mini-boss / boss : booster UN membre au hasard pour en faire un "rare".
  const mult = multiplicateurRareTour(typeNiv)
  if (mult && equipe.length > 0) {
    const idx = Math.floor(Math.random() * equipe.length)
    const cible = equipe[idx]
    const niveauBoost = (cible.niveau || 1) + mult.niveauBonus
    const boostee = {
      ...cible,
      niveau: niveauBoost,
      rarete: mult.rarete,
      estRareTour: true, // marqueur visuel
      pvMax: Math.max(1, Math.round((cible.pvMax || 1) * mult.stats)),
      attaque: Math.max(1, Math.round((cible.attaque || 1) * mult.stats)),
    }
    equipe[idx] = boostee
  }
  return equipe
}

async function chargerEquipeDresseur(dresseur) {
  const noms = [...dresseur.equipe]
  if (dresseur.special) noms.push(dresseur.special)
  const equipe = await Promise.all(noms.map(async (nom) => {
    try { return await chargerPokemon(nom, false) }
    catch (err) { return await chargerPokemon('magikarp', false) }
  }))
  return equipe.map((p, index) => {
    const estSpe = dresseur.special && index === equipe.length - 1
    const niveauBase = estSpe ? dresseur.niveau + 15 : dresseur.niveau
    const niveau = Math.max(1, niveauBase + Math.floor(Math.random() * 5) - 2)
    const avecNiveau = { ...p, niveau, rarete: estSpe ? 'special' : 'commun', shiny: false, sprite: p.spriteNormal }
    const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
    return { ...avecNiveau, ...finales, uid: `dre-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}` }
  })
}

async function chargerEquipeRaid(raid) {
  const vagues = await Promise.all(raid.vagues.map(async (noms, indexVague) => {
    const estVagueBoss = indexVague === raid.vagues.length - 1
    const equipe = await Promise.all(noms.map(async (nom) => {
      try { return await chargerPokemon(nom, false) }
      catch (err) { return await chargerPokemon('magikarp', false) }
    }))
    return equipe.map((p, i) => {
      const dernier = raid.vagues.length - 1
      let niveau = raid.niveau
      if (!estVagueBoss && indexVague > 0) niveau = raid.niveau + indexVague * 6
      if (estVagueBoss) niveau = raid.niveau + 20
      niveau = Math.max(1, niveau + Math.floor(Math.random() * 5) - 2)
      const avecNiveau = { ...p, niveau, rarete: estVagueBoss ? 'legendaire' : (indexVague >= dernier - 1 ? 'tresRare' : 'commun'), shiny: false, sprite: p.spriteNormal, estBoss: estVagueBoss }
      const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
      if (estVagueBoss) return { ...avecNiveau, ...finales, pvMax: Math.max(1, Math.round(finales.pvMax * FORCE_BOSS_RAID_PV)), attaque: Math.max(1, Math.round(finales.attaque * FORCE_BOSS_RAID_ATK)) }
      return { ...avecNiveau, ...finales }
    })
  }))
  return vagues
}

async function chargerBoss(route) {
  const nomBoss = bossDeLaRoute(route)
  if (!nomBoss) return null
  let boss
  try { boss = await chargerPokemon(nomBoss, false) } catch (err) { return null }
  const niveau = route.niveau + 5
  const avecNiveau = { ...boss, niveau, rarete: 'legendaire', shiny: true, sprite: boss.spriteShiny || boss.spriteNormal, estBoss: true }
  const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
  const handicap = route.handicapEnnemi || 1
  return { ...avecNiveau, ...finales, pvMax: Math.max(1, Math.round(finales.pvMax * FORCE_BOSS * handicap)), attaque: Math.max(1, Math.round(finales.attaque * FORCE_BOSS * handicap)) }
}

// Calcule un resume leger d'un slot pour le menu titre, a partir de l'objet data
// (provenant du cloud). Renvoie null si le slot est vide.
function resumeDepuisData(data) {
  try {
    if (!data) return null
    const captures = data.captures || []
    if (captures.length === 0) return null
    const pokedexVus = data.pokedexVus || []
    const nbShiny = (data.pokedexShiny || []).length
    const bossVaincus = data.bossVaincus || {}
    const nbZones = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const pokedexPct = Math.round((pokedexVus.length / 1025) * 100)
    return { pokedexPct, zoneMax: nbZones, nbPokemon: captures.length, nbShiny }
  } catch { return null }
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
  const [reserveOeufs, setReserveOeufs] = useState([])
  const [oeufsIncubes, setOeufsIncubes] = useState(() => Array(NB_INCUBATEURS_DEPART).fill(null))
  const oeufsIncubesRef = useRef(oeufsIncubes)
  useEffect(() => { oeufsIncubesRef.current = oeufsIncubes }, [oeufsIncubes])
  const [jetonsElevage, setJetonsElevage] = useState(0)
  const [ameliorationsElevage, setAmeliorationsElevage] = useState(() => ameliorationsParDefaut())
  const ameliorationsElevageRef = useRef(ameliorationsElevage)
  useEffect(() => { ameliorationsElevageRef.current = ameliorationsElevage }, [ameliorationsElevage])

  // Tour Infinie
  const [tourOuverte, setTourOuverte] = useState(false)
  const [adnFusion, setAdnFusion] = useState(0)
  const [menuPlusOuvert, setMenuPlusOuvert] = useState(false)
  const [posMenuPlus, setPosMenuPlus] = useState({ top: 76, right: 20 })
  const boutonPlusRef = useRef(null)
  function ouvrirMenuPlus() {
    const btn = boutonPlusRef.current
    if (btn) {
      const r = btn.getBoundingClientRect()
      setPosMenuPlus({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) })
    }
    setMenuPlusOuvert((v) => !v)
  }
  const [niveauTourActuel, setNiveauTourActuel] = useState(1)
  const [meilleurNiveauTour, setMeilleurNiveauTour] = useState(0)
  const [collectionCartesTCG, setCollectionCartesTCG] = useState([])
  const [combatTourActif, setCombatTourActif] = useState(false)
  const [equipeEnnemieTour, setEquipeEnnemieTour] = useState([])
  const [carteDrop, setCarteDrop] = useState(null)
  const carteDropTimer = useRef(null)

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
  const [nbPrestiges, setNbPrestiges] = useState(0)
  const [raidsReussis, setRaidsReussis] = useState(0)
  const [investisPrestige, setInvestisPrestige] = useState({ puissance: 0, xp: 0, argent: 0, shiny: 0 })
  const [journal, setJournal] = useState([])
  const [vueOuverte, setVueOuverte] = useState(null)
  const [guideActif, setGuideActif] = useState(null)
  const [session, setSession] = useState(null)
  const [sessionVerifiee, setSessionVerifiee] = useState(false)
  const [identiteJoueur, setIdentiteJoueur] = useState(() => chargerIdentite())
  const [changerPseudoOuvert, setChangerPseudoOuvert] = useState(false)
  const [nouveautesOuvert, setNouveautesOuvert] = useState(() => {
    try { return localStorage.getItem(CLE_NOUVEAUTES) !== '1' } catch { return false }
  })
  function fermerNouveautes() {
    try { localStorage.setItem(CLE_NOUVEAUTES, '1') } catch {}
    setNouveautesOuvert(false)
  }
  const [modeJeu, setModeJeu] = useState('principal')
  const [tutoVu, setTutoVu] = useState(false)
  const [tutoPrestigeVu, setTutoPrestigeVu] = useState(false)
  const [tutoPrestigeOuvert, setTutoPrestigeOuvert] = useState(false)
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
  const [reglesCapture, setReglesCapture] = useState({ shiny: 'auto', legendaire: 'auto', nouveau: 'auto', doublon: 'auto', limiteBalls: 5 })
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
  const [choixPseudoSlotOuvert, setChoixPseudoSlotOuvert] = useState(false)
  const [pseudoSlotEnCours, setPseudoSlotEnCours] = useState('')
  const [menuTitreOuvert, setMenuTitreOuvert] = useState(true)
  const [slotActif, setSlotActif] = useState(null)
  const [resumesSlots, setResumesSlots] = useState([null, null, null])
  const slotActifRef = useRef(null)
  useEffect(() => { slotActifRef.current = slotActif }, [slotActif])
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
  const [ciblesMasterBall, setCiblesMasterBall] = useState([])
  const ciblesMasterBallRef = useRef([])
  useEffect(() => { ciblesMasterBallRef.current = ciblesMasterBall }, [ciblesMasterBall])
  const tentativesParEspeceRef = useRef({})
  const routeActiveRef = useRef('tutoriel')
  const combatBossRef = useRef(false)
  const autoZoneRef = useRef(false)
  const modeJeuRef = useRef('principal')
  const vueOuverteRef = useRef(null)
  const victoiresParRouteRef = useRef({})
  const bossVaincusRef = useRef({})
  const ameliorationsRef = useRef({})
  const investisPrestigeRef = useRef({ puissance: 0, xp: 0, argent: 0, shiny: 0 })
  const etat = useRef({ pvJ: [], jJ: [], pvE: [], jE: [] })

  useEffect(() => { ballsRef.current = balls }, [balls])
  useEffect(() => { equipeEnnemieRef.current = equipeEnnemie }, [equipeEnnemie])
  useEffect(() => { capturesRef.current = captures }, [captures])
  useEffect(() => { equipeIdsRef.current = equipeIds }, [equipeIds])

  useEffect(() => {
    if (!partieChargee) return
    const eq = equipeIds.map((uid) => capturesRef.current.find((p) => p.uid === uid)).filter(Boolean)
    const pvJ = eq.map((p) => p.pvMax)
    const jJ = eq.map(() => 0)
    setPvJoueur(pvJ); setJaugeJoueur(jJ)
    etat.current = { ...etat.current, pvJ, jJ }
  }, [equipeIds, partieChargee])

  useEffect(() => { pokedexShinyRef.current = pokedexShiny }, [pokedexShiny])
  useEffect(() => { reglesCaptureRef.current = reglesCapture }, [reglesCapture])
  useEffect(() => { routeActiveRef.current = routeActive }, [routeActive])
  useEffect(() => { combatBossRef.current = combatBoss }, [combatBoss])
  useEffect(() => { autoZoneRef.current = autoZone }, [autoZone])
  useEffect(() => { modeJeuRef.current = modeJeu }, [modeJeu])
  useEffect(() => { vueOuverteRef.current = vueOuverte }, [vueOuverte])

  // Lance le guide interactif a la 1re ouverture d'un menu (si pas deja vu).
  useEffect(() => {
    if (!partieChargee) return
    let cible = null
    if (vueOuverte === 'equipe') cible = 'equipe'
    else if (vueOuverte === 'oeufs') cible = 'oeufs'
    if (cible && !guideEstVu(cible)) {
      // Petit delai pour laisser le panneau se monter avant de cibler ses elements.
      const t = setTimeout(() => setGuideActif(cible), 350)
      return () => clearTimeout(t)
    }
  }, [vueOuverte, partieChargee])

  // Guides des modes plein ecran (arene / raids) : declenchement sur modeJeu.
  useEffect(() => {
    if (!partieChargee) return
    let cible = null
    if (modeJeu === 'arene') cible = 'arene'
    else if (modeJeu === 'raid') cible = 'raids'
    if (cible && !guideEstVu(cible)) {
      const t = setTimeout(() => setGuideActif(cible), 450)
      return () => clearTimeout(t)
    }
  }, [modeJeu, partieChargee])

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
        ajouterAuJournal(`Trop lent ! Le boss s'est enfui.`, 'echec')
        setVictoiresParRoute((v) => { const maj = { ...v, [routePerdue]: 0 }; victoiresParRouteRef.current = maj; return maj })
        setCombatBoss(false); combatBossRef.current = false
        transitionEnCours.current = true
        if (lancerCombatSuivantRef.current) lancerCombatSuivantRef.current()
      }
    }, 100)
    return () => clearInterval(tic)
  }, [combatBoss])

  useEffect(() => {
    if (partieChargee && !tutoVu && tutoMode === null) setTutoMode('bienvenue')
  }, [partieChargee, tutoVu])

  // Tuto prestige : s'ouvre tout seul la 1ere fois que l'equipe atteint le plafond.
  useEffect(() => {
    if (!partieChargee || tutoPrestigeVu) return
    const cap = plafondNiveau(investisPrestige)
    const membres = equipeIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    if (membres.length > 0 && membres.every((p) => (p.niveau || 1) >= cap)) {
      setTutoPrestigeOuvert(true)
      setTutoPrestigeVu(true)
    }
  }, [partieChargee, tutoPrestigeVu, captures, equipeIds, investisPrestige])

  useEffect(() => {
    if (modeJeu !== 'pvp') return
    let annule = false
    setPvpChargementListe(true)
    ;(async () => {
      try {
        const maDef = await chargerMaDefense()
        if (!annule && maDef) { setPvpPoints(maDef.points_pvp); setPvpRang(maDef.rang); setPvpDefensePubliee(maDef.equipe && maDef.equipe.length > 0) }
        const { lignes } = await listerDefenses(50)
        if (!annule) setPvpAdversaires(lignes)
      } catch (err) { console.warn('Chargement PvP echoue', err) }
      if (!annule) setPvpChargementListe(false)
    })()
    return () => { annule = true }
  }, [modeJeu])

  useEffect(() => {
    const equipe = equipeIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const eff = effetsSpeciauxEquipe(equipe)
    bonusShinyObjets = eff.shiny; bonusArgentObjets = eff.argent
  }, [equipeIds, captures])

  useEffect(() => { victoiresParRouteRef.current = victoiresParRoute }, [victoiresParRoute])
  useEffect(() => { bossVaincusRef.current = bossVaincus }, [bossVaincus])
  useEffect(() => { ameliorationsRef.current = ameliorations; bonusShinyGlobal = multiplicateur(ameliorations, 'chroma') }, [ameliorations])

  useEffect(() => {
    let bonusXP = 0, bonusArgent = 0
    const reclamees = new Set(recompensesReclamees)
    const tousPaliers = [...PALIERS_GLOBAUX, ...PALIERS_GENERATION]
    for (const p of tousPaliers) {
      if (!reclamees.has(p.id)) continue
      for (const g of p.gains) {
        if (g.type === 'bonus' && g.stat === 'xp') bonusXP += g.valeur
        if (g.type === 'bonus' && g.stat === 'argent') bonusArgent += g.valeur
      }
    }
    bonusCompletionXP = 1 + bonusXP; bonusCompletionArgent = 1 + bonusArgent
  }, [recompensesReclamees])

  useEffect(() => {
    let bxp = 0, barg = 0
    const obtenus = new Set(succesDebloques)
    for (const s of SUCCES) {
      if (!obtenus.has(s.id)) continue
      const r = s.recompense
      if (r && r.type === 'bonus') { if (r.stat === 'xp') bxp += r.valeur; if (r.stat === 'argent') barg += r.valeur }
    }
    bonusSuccesXP = 1 + bxp; bonusSuccesArgent = 1 + barg
  }, [succesDebloques])

  useEffect(() => {
    investisPrestigeRef.current = investisPrestige
    const m = multiplicateursPrestige(investisPrestige)
    bonusPrestigeXP = m.xp; bonusPrestigeArgent = m.argent; bonusPrestigeShiny = m.shiny; bonusPrestigePuissance = m.puissance
    bonusShinyGlobal = multiplicateur(ameliorationsRef.current, 'chroma') * m.shiny
  }, [investisPrestige])

  // Bonus XP Tour (mis a jour quand la collection de cartes change)
  useEffect(() => {
    bonusTourXP = 1 + ORDRE_SETS.reduce((total, sid) => total + bonusCompletionSet(collectionCartesTCG, sid).totalBonus, 0)
  }, [collectionCartesTCG])

  useEffect(() => { chargerTableNoms().then((table) => setTableNoms(table)) }, [])

  useEffect(() => {
    if (!partieChargee) return
    const etatSucces = {
      nbCaptures: captures.length, nbShiny: pokedexShiny.length, nbVus: pokedexVus.length,
      totalDex: 1025, nbVaincus: vaincus, nbBoss: Object.values(bossVaincus).filter(Boolean).length,
      nbDresseurs: Object.keys(dresseursVaincus).length, nbZones: ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length,
      nbSpeciaux: pokedexSpeciaux.length,
    }
    const nouveaux = SUCCES.filter((s) => !succesDebloques.includes(s.id) && s.condition(etatSucces))
    if (nouveaux.length > 0) {
      nouveaux.forEach((s) => {
        const r = s.recompense
        if (r.type === 'argent') { setPokeDollars((a) => a + r.montant); ajouterAuJournal(`Succes ${s.nom} ! (+${r.montant})`, 'victoire') }
        else if (r.type === 'ball') { setBalls((b) => ({ ...b, [r.ball]: b[r.ball] + r.quantite })); ajouterAuJournal(`Succes ${s.nom} !`, 'victoire') }
        else if (r.type === 'pierre') { setPierres((p) => ({ ...p, [r.pierre]: (p[r.pierre] || 0) + r.quantite })); ajouterAuJournal(`Succes ${s.nom} !`, 'victoire') }
        else if (r.type === 'bonus') { ajouterAuJournal(`Succes ${s.nom} ! (+${Math.round(r.valeur * 100)}% permanent !)`, 'victoire') }
      })
      setSuccesDebloques((d) => [...d, ...nouveaux.map((s) => s.id)])
    }
  }, [partieChargee, captures, pokedexShiny, pokedexVus, vaincus, bossVaincus, succesDebloques, dresseursVaincus, pokedexSpeciaux])

  // Fusionne les doublons d'espece (meme id + meme statut shiny) en gardant
  // le plus HAUT niveau et en combinant les IV. Remappe les equipes vers le garde.
  // Renvoie { captures, equipeIds, equipeAreneIds, equipeRaidIds, equipeDefenseIds, equipeAttaqueIds, nbFusions }.
  function fusionnerDoublonsCollection(liste, equipes) {
    const cle = (p) => `${p.id}-${p.shiny ? 's' : 'n'}`
    const groupes = {}
    for (const p of (liste || [])) {
      if (!p) continue
      const k = cle(p)
      if (!groupes[k]) groupes[k] = []
      groupes[k].push(p)
    }
    const gardes = []
    const remap = {}
    let nbFusions = 0
    for (const k in groupes) {
      const g = groupes[k]
      if (g.length === 1) { gardes.push(g[0]); remap[g[0].uid] = g[0].uid; continue }
      let garde = g[0]
      for (const p of g) { if ((p.niveau || 1) > (garde.niveau || 1)) garde = p }
      let ivFusionnes = garde.iv
      for (const p of g) { if (p.uid !== garde.uid) ivFusionnes = fusionnerIV(ivFusionnes, p.iv) }
      const gardeMaj = { ...garde, iv: ivFusionnes }
      const gardeFinal = { ...gardeMaj, ...statsFinales(gardeMaj, BONUS_STAT_NIVEAU) }
      gardes.push(gardeFinal)
      for (const p of g) { remap[p.uid] = garde.uid; if (p.uid !== garde.uid) nbFusions++ }
    }
    const remapEquipe = (ids) => {
      const vus = new Set(); const out = []
      for (const uid of (ids || [])) {
        const nouveau = remap[uid] || uid
        if (!gardes.some((p) => p.uid === nouveau)) continue
        if (vus.has(nouveau)) continue
        vus.add(nouveau); out.push(nouveau)
      }
      return out
    }
    const eqMaj = {}
    for (const nom in (equipes || {})) eqMaj[nom] = remapEquipe(equipes[nom])
    return { captures: gardes, equipes: eqMaj, nbFusions }
  }

  function ajouterAuJournal(texte, type = 'info') {
    setJournal((lignes) => { compteurJournal += 1; const nouvelle = { texte, type, id: `j-${compteurJournal}` }; return [...lignes, nouvelle].slice(-6) })
  }

  function journalFuite() {
    setJournal((lignes) => {
      const derniere = lignes[lignes.length - 1]
      if (derniere && derniere.type === 'fuite') {
        const compte = (derniere.compte || 1) + 1
        return [...lignes.slice(0, -1), { ...derniere, compte, texte: `${compte} Pokemon enfuis faute de Ball` }]
      }
      compteurJournal += 1
      return [...lignes, { texte: `1 Pokemon enfui faute de Ball`, type: 'fuite', compte: 1, id: `j-${compteurJournal}` }].slice(-6)
    })
  }

  const captureTimer = useRef(null)
  function montrerCapture(ennemi) {
    setCaptureRecente({ nom: ennemi.nom, sprite: ennemi.sprite, shiny: ennemi.shiny ?? false, cle: Date.now() })
    if (captureTimer.current) clearTimeout(captureTimer.current)
    captureTimer.current = setTimeout(() => setCaptureRecente(null), 2200)
  }

  const dropTimer = useRef(null)
  function montrerDrop(cleObjet) {
    const info = OBJETS_BOSS[cleObjet]
    if (!info) return
    setDropRecent({ nom: info.nom, sprite: info.sprite, emoji: info.emoji, legendaire: cleObjet === 'relique', cle: Date.now() })
    if (dropTimer.current) clearTimeout(dropTimer.current)
    dropTimer.current = setTimeout(() => setDropRecent(null), 2600)
  }

  function tirerObjetsBoss(typeBoss) {
    const taux = TAUX_OBJET_BOSS[typeBoss] || TAUX_OBJET_BOSS.zone
    const gagnes = {}
    for (const cle of ['rouage', 'cristal', 'relique']) { if (Math.random() < taux[cle]) gagnes[cle] = (gagnes[cle] || 0) + 1 }
    const tauxIV = TAUX_BONBON_IV[typeBoss] ?? TAUX_BONBON_IV.zone
    if (Math.random() < tauxIV) { const cleIV = CLES_BONBON_IV[Math.floor(Math.random() * CLES_BONBON_IV.length)]; gagnes[cleIV] = (gagnes[cleIV] || 0) + 1 }
    const cles = Object.keys(gagnes)
    if (cles.length === 0) return
    setObjetsBoss((stock) => { const maj = { ...stock }; for (const cle of cles) maj[cle] = (maj[cle] || 0) + gagnes[cle]; return maj })
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
    // On ignore les coups "rate" (juste informatifs) pour ne pas afficher "0".
    const coupsVisibles = coups.filter((c) => c.type !== 'rate')
    if (coupsVisibles.length === 0) return
    const nouveaux = coupsVisibles.map((c) => { compteurChiffre.current += 1; const dx = Math.round((Math.random() - 0.5) * 30); return { id: `c-${compteurChiffre.current}`, montant: c.montant, type: c.type, camp: c.camp, index: c.cible, dx, emoji: c.emoji || null, statut: c.statut || null } })
    setChiffresFlottants((liste) => [...liste, ...nouveaux])
    const ids = new Set(nouveaux.map((n) => n.id))
    setTimeout(() => { setChiffresFlottants((liste) => liste.filter((c) => !ids.has(c.id))) }, 1100)
  }

  function marquerVu(id) { setPokedexVus((vus) => (vus.includes(id) ? vus : [...vus, id])) }
  function marquerShiny(id) { setPokedexShiny((vus) => (vus.includes(id) ? vus : [...vus, id])) }

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
          formeEvoluee = { nom: dataEvo.name, id: dataEvo.id, ...statsBaseDepuis(dataEvo), types: dataEvo.types.map((t) => t.type.name), sprite: dataEvo.sprites.front_default, spriteNormal: dataEvo.sprites.front_default, spriteShiny: dataEvo.sprites.front_shiny, evolueEn: infosEvo.evolueEn, evolueNiveau: infosEvo.evolueNiveau }
        }
        const maj = { evolueEn: infos.evolueEn ?? pkm.evolueEn ?? null, evolueNiveau: infos.evolueNiveau ?? pkm.evolueNiveau ?? null, evolutionsPierre: infos.evolutionsPierre || [], formeEvoluee: formeEvoluee ?? null, evoV2: true }
        capturesRef.current = capturesRef.current.map((p) => (p.uid === pkm.uid ? { ...p, ...maj } : p))
        setCaptures(capturesRef.current)
      } catch (err) { capturesRef.current = capturesRef.current.map((p) => (p.uid === pkm.uid ? { ...p, evoV2: true } : p)) }
      await new Promise((r) => setTimeout(r, 120))
    }
  }

  function appliquerEvolution(poke) {
    const fe = poke.formeEvoluee
    if (!fe) return poke
    const base = {
      uid: poke.uid, nom: fe.nom, id: fe.id, pvBase: fe.pvBase, attaqueBase: fe.attaqueBase, vitesseBase: fe.vitesseBase,
      defBase: fe.defBase ?? poke.defBase ?? 50, types: fe.types,
      sprite: poke.shiny && fe.spriteShiny ? fe.spriteShiny : (fe.spriteNormal ?? fe.sprite),
      spriteNormal: fe.spriteNormal ?? fe.sprite, spriteShiny: fe.spriteShiny ?? null,
      shiny: poke.shiny ?? false, iv: poke.iv, niveau: poke.niveau, xp: poke.xp,
      evolueEn: fe.evolueEn, evolueNiveau: fe.evolueNiveau, evolutionsPierre: [], formeEvoluee: null,
      estEvolution: true, familleId: poke.familleId ?? null,
    }
    base.role = poke.roleForce || poke.role || determinerRole(base)
    base.roleForce = poke.roleForce; base.passifChoisi = poke.passifChoisi; base.jokerCase = poke.jokerCase
    base.objetEquipe = poke.objetEquipe; base.passif = determinerPassif(base)
    return { ...base, ...statsFinales(base, BONUS_STAT_NIVEAU) }
  }

  async function completerEvolution(uid, evolueEn) {
    try {
      const repEvo = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(evolueEn)}`)
      const dataEvo = await repEvo.json()
      const infosEvo = await chargerInfosEspece(dataEvo.id)
      const formeEvoluee = { nom: dataEvo.name, id: dataEvo.id, ...statsBaseDepuis(dataEvo), types: dataEvo.types.map((t) => t.type.name), sprite: dataEvo.sprites.front_default, spriteNormal: dataEvo.sprites.front_default, spriteShiny: dataEvo.sprites.front_shiny, evolueEn: infosEvo.evolueEn, evolueNiveau: infosEvo.evolueNiveau }
      setCaptures((liste) => liste.map((p) => (p.uid === uid ? { ...p, formeEvoluee } : p)))
    } catch (err) {}
  }

  async function evoluerParPierre(uid, evolueEn, pierre) {
    if (!pierres[pierre] || pierres[pierre] <= 0) return
    try {
      const repEvo = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(evolueEn)}`)
      const dataEvo = await repEvo.json()
      const pokeAvant = capturesRef.current.find((p) => p.uid === uid)
      const shinyVise = pokeAvant?.shiny ?? false
      const dejaPossede = capturesRef.current.some((p) => p.uid !== uid && p.id === dataEvo.id && (p.shiny ?? false) === shinyVise)
      if (dejaPossede) { ajouterAuJournal(`Tu possedes deja ${dataEvo.name} — evolution annulee.`, 'info'); return }
      const infosEvo = await chargerInfosEspece(dataEvo.id)
      setPierres((p) => ({ ...p, [pierre]: p[pierre] - 1 }))
      let pokeShiny = false
      setCaptures((liste) => liste.map((poke) => {
        if (poke.uid !== uid) return poke
        pokeShiny = poke.shiny ?? false
        const base = { uid: poke.uid, nom: dataEvo.name, id: dataEvo.id, ...statsBaseDepuis(dataEvo), types: dataEvo.types.map((t) => t.type.name), sprite: poke.shiny && dataEvo.sprites.front_shiny ? dataEvo.sprites.front_shiny : dataEvo.sprites.front_default, spriteNormal: dataEvo.sprites.front_default, spriteShiny: dataEvo.sprites.front_shiny, shiny: poke.shiny ?? false, iv: poke.iv, niveau: poke.niveau, xp: poke.xp, evolueEn: infosEvo.evolueEn, evolueNiveau: infosEvo.evolueNiveau, evolutionsPierre: infosEvo.evolutionsPierre || [], formeEvoluee: null, estEvolution: true, familleId: poke.familleId ?? infosEvo.familleId ?? null }
        base.role = poke.roleForce || poke.role || determinerRole(base); base.roleForce = poke.roleForce; base.passifChoisi = poke.passifChoisi; base.jokerCase = poke.jokerCase; base.objetEquipe = poke.objetEquipe; base.passif = determinerPassif(base)
        return { ...base, ...statsFinales(base, BONUS_STAT_NIVEAU) }
      }))
      ajouterAuJournal(`Evolution obtenue : ${evolueEn} !`, 'victoire')
      marquerVu(dataEvo.id); if (pokeShiny) marquerShiny(dataEvo.id)
    } catch (err) { console.error('Erreur evolution pierre :', err) }
  }

  function distribuerXP(xpTotale) {
    const messages = []
    const idsEquipe = equipeIdsRef.current
    const collectionActuelle = capturesRef.current
    const membres = idsEquipe.map((uid) => collectionActuelle.find((p) => p.uid === uid)).filter(Boolean)
    const niveauMoyen = membres.length > 0 ? membres.reduce((s, p) => s + (p.niveau || 1), 0) / membres.length : 1
    function poidsRattrapage(niv) { if (niv >= niveauMoyen) return 1; const ratio = niveauMoyen / Math.max(1, niv); return Math.min(2, ratio) }
    const totalPoids = membres.reduce((s, p) => s + poidsRattrapage(p.niveau || 1), 0) || 1
    const partParUid = {}
    membres.forEach((p) => { partParUid[p.uid] = Math.round(xpTotale * poidsRattrapage(p.niveau || 1) / totalPoids) })
    const capNiveau = plafondNiveau(investisPrestigeRef.current)
    setCaptures((collection) => collection.map((poke) => {
      if (!idsEquipe.includes(poke.uid)) return poke
      // PLAFOND DE NIVEAU (mur prestige) : un Pokémon au cap ne gagne plus d'XP.
      if ((poke.niveau || 1) >= capNiveau) return poke
      const partBase = partParUid[poke.uid] ?? Math.round(xpTotale / 6)
      const part = Math.round(partBase * bonusXpObjet(poke))
      const { pokemon, niveauxGagnes } = ajouterXP(poke, part, XP_BASE_NIVEAU, BONUS_STAT_NIVEAU)
      let pkm = { ...pokemon, uid: poke.uid, evolueEn: pokemon.evolueEn ?? poke.evolueEn ?? null, evolueNiveau: pokemon.evolueNiveau ?? poke.evolueNiveau ?? null, evolutionsPierre: pokemon.evolutionsPierre ?? poke.evolutionsPierre ?? [], formeEvoluee: pokemon.formeEvoluee ?? poke.formeEvoluee ?? null, estEvolution: pokemon.estEvolution ?? poke.estEvolution ?? false, familleId: pokemon.familleId ?? poke.familleId ?? null, shiny: pokemon.shiny ?? poke.shiny ?? false, spriteNormal: pokemon.spriteNormal ?? poke.spriteNormal ?? null, spriteShiny: pokemon.spriteShiny ?? poke.spriteShiny ?? null }
      // On ne dépasse jamais le plafond.
      if ((pkm.niveau || 1) > capNiveau) { pkm.niveau = capNiveau; pkm.xp = 0 }
      if (niveauxGagnes > 0) {
        messages.push(`${pkm.nom} monte niveau ${pkm.niveau} !`)
        // Evolution par niveau : UN SEUL cran par montee (jamais de saut de stade).
        // On verifie que la forme evoluee chargee correspond bien a evolueEn (coherence),
        // pour eviter qu'un Pokemon saute directement au stade final.
        // ANTI-DOUBLON : pas d'evolution si la forme cible (meme statut shiny) est
        // deja possedee — ca permet de garder toute la lignee (ex Reptincel + Dracaufeu).
        if (pkm.evolueEn && pkm.evolueNiveau && pkm.niveau >= pkm.evolueNiveau
            && pkm.formeEvoluee && pkm.formeEvoluee.nom === pkm.evolueEn
            && !capturesRef.current.some((p) => p.uid !== pkm.uid && p.id === pkm.formeEvoluee.id && (p.shiny ?? false) === (pkm.shiny ?? false))) {
          const ancienNom = pkm.nom
          const niveauEvoAvant = pkm.evolueNiveau
          pkm = appliquerEvolution(pkm)
          messages.push(`${ancienNom} evolue en ${pkm.nom} !`)
          const nouvelId = pkm.id; const estShiny = pkm.shiny
          setTimeout(() => { marquerVu(nouvelId); if (estShiny) marquerShiny(nouvelId) }, 0)
          // Securite : si la forme suivante evoluerait au MEME niveau (donnees incoherentes),
          // on neutralise pour empecher une re-evolution immediate au prochain tick.
          if (pkm.evolueNiveau && pkm.evolueNiveau <= niveauEvoAvant) {
            pkm.evolueNiveau = niveauEvoAvant + 20
          }
          // Recharge la forme suivante (Dracaufeu) en async, pour la prochaine evolution.
          if (pkm.evolueEn) { const uidEvo = pkm.uid; const prochaineEvo = pkm.evolueEn; setTimeout(() => completerEvolution(uidEvo, prochaineEvo), 0) }
        }
      }
      return pkm
    }))
    messages.forEach((m) => ajouterAuJournal(m, 'victoire'))
  }

  function ballAuto(rarete) {
    const stocks = ballsRef.current
    const ideale = BALL_AUTO_PAR_RARETE[rarete] || 'poke'
    const ordre = ['master', 'hyper', 'super', 'poke']
    const indexIdeal = ordre.indexOf(ideale)
    for (let i = indexIdeal; i < ordre.length; i++) { if (stocks[ordre[i]] > 0) return ordre[i] }
    return null
  }

  function cleCible(ennemi) { return `${ennemi.id}${ennemi.shiny ? '-shiny' : ''}` }

  function basculerCibleMasterBall(ennemi) {
    if (!ennemi || ennemi.estBoss || ennemi.estEvolution) return
    const cle = cleCible(ennemi)
    const dejaCiblee = ciblesMasterBallRef.current.some((c) => c.cle === cle)
    setCiblesMasterBall((liste) => {
      const maj = dejaCiblee ? liste.filter((c) => c.cle !== cle) : [...liste, { cle, id: ennemi.id, nom: ennemi.nom, shiny: ennemi.shiny ?? false, sprite: (ennemi.shiny && ennemi.spriteShiny) ? ennemi.spriteShiny : (ennemi.spriteNormal ?? ennemi.sprite) }]
      ciblesMasterBallRef.current = maj; return maj
    })
    ajouterAuJournal(!dejaCiblee ? `${ennemi.nom}${ennemi.shiny ? ' shiny' : ''} cible Master Ball.` : `${ennemi.nom} n'est plus cible.`, 'info')
  }

  function categorieEnnemi(ennemi) {
    if (ennemi.shiny === true) return 'shiny'
    if ((ennemi.rarete || 'commun') === 'legendaire') return 'legendaire'
    return capturesRef.current.some((p) => p.id === ennemi.id) ? 'doublon' : 'nouveau'
  }

  function choisirBall(ennemi) {
    const regles = reglesCaptureRef.current; const categorie = categorieEnnemi(ennemi); const regle = regles[categorie] || 'auto'
    if (regle === 'rien') return 'rien'
    const rarete = ennemi.rarete || 'commun'
    if (regle === 'auto') return ballAuto(rarete)
    const stocks = ballsRef.current; if (stocks[regle] > 0) return regle; return ballAuto(rarete)
  }

  function tenterCapture(indexEnnemi) {
    const ennemi = equipeEnnemieRef.current[indexEnnemi]
    if (!ennemi || ennemi.estBoss || ennemi.estEvolution) return
    const estShiny = ennemi.shiny === true
    if (estShiny && pokedexShinyRef.current.includes(ennemi.id)) return
    const cle = cleCible(ennemi)
    const estCibleeMasterBall = ciblesMasterBallRef.current.some((c) => c.cle === cle)
    const limite = reglesCaptureRef.current.limiteBalls ?? 5
    if (!estCibleeMasterBall && limite !== 'infini' && Number.isFinite(limite)) {
      const dejaTente = tentativesParEspeceRef.current[ennemi.id] || 0
      if (dejaTente >= limite) return
    }
    let ball
    if (estCibleeMasterBall) { ball = (ballsRef.current.master || 0) > 0 ? 'master' : choisirBall(ennemi) }
    else { ball = choisirBall(ennemi) }
    if (ball === 'rien') return
    if (!ball) { journalFuite(); return }
    if (!estCibleeMasterBall) tentativesParEspeceRef.current[ennemi.id] = (tentativesParEspeceRef.current[ennemi.id] || 0) + 1
    const rarete = ennemi.rarete || 'commun'
    setBalls((b) => ({ ...b, [ball]: b[ball] - 1 })); ballsRef.current = { ...ballsRef.current, [ball]: ballsRef.current[ball] - 1 }
    const tauxBase = TAUX_CAPTURE_RARETE[rarete] ?? 0.5; const multi = BALLS[ball].multi
    const bonusCapture = multiplicateur(ameliorationsRef.current, 'dressage')
    const reussite = estShiny ? true : (multi === Infinity ? true : Math.random() < tauxBase * multi * bonusCapture)
    if (!reussite) { ajouterAuJournal(`${ennemi.nom} s'est echappe !`, 'echec'); return }
    if (estCibleeMasterBall) { setCiblesMasterBall((liste) => { const maj = liste.filter((c) => c.cle !== cle); ciblesMasterBallRef.current = maj; return maj }) }
    const familleCible = ennemi.familleId ?? null
    const memeFamille = (p) => familleCible != null ? p.familleId === familleCible : p.id === ennemi.id
    // ANTI-DOUBLON PAR ESPECE : on bloque seulement si la MEME espece (meme id)
    // avec le meme statut shiny est deja possedee. Les autres membres de la famille
    // peuvent coexister (Salameche + Reptincel + Dracaufeu en meme temps).
    const existantMemeStatut = capturesRef.current.find((p) => p.id === ennemi.id && (p.shiny ?? false) === (ennemi.shiny ?? false))
    const familleEnCollection = capturesRef.current.some((p) => memeFamille(p))
    if (ennemi.shiny && familleEnCollection && !existantMemeStatut) {
      ajouterAuJournal(`${ennemi.nom} SHINY capturé ! Famille dorée !`, 'capture')
      marquerVu(ennemi.id); marquerShiny(ennemi.id)
      const idsFamille = new Set(capturesRef.current.filter((p) => memeFamille(p)).map((p) => p.id))
      idsFamille.forEach((id) => { marquerVu(id); marquerShiny(id) }); montrerCapture(ennemi)
      let majListe = capturesRef.current.map((p) => {
        if (!memeFamille(p)) return p
        const spriteShinyMembre = p.spriteShiny ?? (p.id === ennemi.id ? ennemi.spriteShiny : null) ?? p.sprite
        const maj = { ...p, shiny: true, iv: fusionnerIV(p.iv, ennemi.iv), sprite: spriteShinyMembre, spriteShiny: p.spriteShiny ?? (p.id === ennemi.id ? ennemi.spriteShiny : p.spriteShiny), spriteNormal: p.spriteNormal ?? (p.id === ennemi.id ? ennemi.spriteNormal : p.sprite) }
        return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
      })
      // Si l'ESPECE exacte n'etait pas encore en collection, on l'ajoute aussi
      // (sinon le Pokemon capture "disparaitrait" dans l'upgrade familial).
      const especeEnCollection = capturesRef.current.some((p) => p.id === ennemi.id)
      if (!especeEnCollection) {
        const nouvelUidCapture = nouvelUid()
        const captureBase = { uid: nouvelUidCapture, nom: ennemi.nom, id: ennemi.id, pvBase: ennemi.pvBase, attaqueBase: ennemi.attaqueBase, vitesseBase: ennemi.vitesseBase, defBase: ennemi.defBase ?? 50, types: ennemi.types, sprite: ennemi.sprite, iv: ennemi.iv, spriteNormal: ennemi.spriteNormal ?? ennemi.sprite, spriteShiny: ennemi.spriteShiny ?? null, shiny: true, rarete: ennemi.rarete ?? 'commun', niveau: 1, xp: 0, evolueEn: ennemi.evolueEn ?? null, evolueNiveau: ennemi.evolueNiveau ?? null, evolutionsPierre: ennemi.evolutionsPierre ?? [], formeEvoluee: null, estEvolution: ennemi.estEvolution ?? false, familleId: ennemi.familleId ?? null, ...(statsBaseOfficielles(ennemi.id) || {}) }
        const nouveau = { ...captureBase, ...statsFinales(captureBase, BONUS_STAT_NIVEAU) }
        majListe = [...majListe, nouveau]
        if (ennemi.evolueEn) setTimeout(() => completerEvolution(nouvelUidCapture, ennemi.evolueEn), 0)
      }
      capturesRef.current = majListe; setCaptures(majListe); return
    }
    if (!existantMemeStatut) {
      ajouterAuJournal(`${ennemi.nom} capture !${ennemi.shiny ? ' SHINY !' : ''}`, 'capture')
      marquerVu(ennemi.id); if (ennemi.shiny) marquerShiny(ennemi.id); montrerCapture(ennemi)
      const nouvelUidCapture = nouvelUid()
      const captureBase = { uid: nouvelUidCapture, nom: ennemi.nom, id: ennemi.id, pvBase: ennemi.pvBase, attaqueBase: ennemi.attaqueBase, vitesseBase: ennemi.vitesseBase, defBase: ennemi.defBase ?? 50, types: ennemi.types, sprite: ennemi.sprite, iv: ennemi.iv, spriteNormal: ennemi.spriteNormal ?? ennemi.sprite, spriteShiny: ennemi.spriteShiny ?? null, shiny: ennemi.shiny ?? false, rarete: ennemi.rarete ?? 'commun', niveau: 1, xp: 0, evolueEn: ennemi.evolueEn ?? null, evolueNiveau: ennemi.evolueNiveau ?? null, evolutionsPierre: ennemi.evolutionsPierre ?? [], formeEvoluee: null, estEvolution: ennemi.estEvolution ?? false, familleId: ennemi.familleId ?? null, ...(statsBaseOfficielles(ennemi.id) || {}) }
      const nouveau = { ...captureBase, ...statsFinales(captureBase, BONUS_STAT_NIVEAU) }
      capturesRef.current = [...capturesRef.current, nouveau]; setCaptures((liste) => [...liste, nouveau])
      if (ennemi.evolueEn) setTimeout(() => completerEvolution(nouvelUidCapture, ennemi.evolueEn), 0)
      return
    }
    {
      let auMoinsUnAmeliore = false
      const majListe = capturesRef.current.map((p) => {
        if (p.id !== ennemi.id || (p.shiny ?? false) !== (ennemi.shiny ?? false)) return p
        const nouveauxIV = fusionnerIV(p.iv, ennemi.iv)
        if (JSON.stringify(nouveauxIV) !== JSON.stringify(p.iv)) auMoinsUnAmeliore = true
        const maj = { ...p, iv: nouveauxIV }; return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
      })
      ajouterAuJournal(auMoinsUnAmeliore ? `${ennemi.nom} : IV ameliores !` : `${ennemi.nom} capture (pas mieux).`, 'capture')
      capturesRef.current = majListe; setCaptures(majListe)
    }
  }

  async function lancerCombatSuivant() {
    try {
      const route = routeParId(routeActiveRef.current)
      const victoiresZone = (victoiresParRouteRef.current[route.id] || 0)
      const reduc = niveauAmelioration(ameliorationsRef.current, 'strategie')
      const dejaVaincu = !!bossVaincusRef.current[route.id]
      const seuil = dejaVaincu ? COMBATS_REFARM_BOSS : Math.max(10, COMBATS_AVANT_BOSS - reduc)
      const cestLeBoss = victoiresZone >= seuil
      let nouveaux
      if (cestLeBoss) {
        let boss = null
        try { boss = await chargerBoss(route) } catch (err) { boss = null }
        if (boss) { nouveaux = [boss]; setCombatBoss(true); combatBossRef.current = true; ajouterAuJournal(`BOSS : ${boss.nom} apparait !`, 'echec') }
        else { nouveaux = await chargerEquipeEnnemie(route); setCombatBoss(false); combatBossRef.current = false }
      } else { nouveaux = await chargerEquipeEnnemie(route); setCombatBoss(false); combatBossRef.current = false }
      if (!nouveaux || nouveaux.length === 0) { nouveaux = await chargerEquipeEnnemie(route); setCombatBoss(false); combatBossRef.current = false }
      setEquipeEnnemie(nouveaux); equipeEnnemieRef.current = nouveaux
      // Purge les statuts entre les combats (l'equipe du joueur est persistante).
      const eqAPurger = equipeIdsRef.current.map((uid) => capturesRef.current.find((p) => p.uid === uid)).filter(Boolean)
      reinitialiserStatuts(eqAPurger)
      reinitialiserStatuts(nouveaux)
      tentativesParEspeceRef.current = {}; debutCombatRef.current = Date.now()
      ultimeLanceRef.current = [false, false, false, false, false, false]
      ultimeLanceEnnemiRef.current = [false, false, false, false, false, false, false]
      setUltimeLanceJoueur([false, false, false, false, false, false])
      setUltimeLanceEnnemiAff([false, false, false, false, false, false, false])
      bouclierTicsRef.current = 0; bouclierTicsEnnemiRef.current = 0
      const pvE = nouveaux.map((p) => p.pvMax); const jE = nouveaux.map(() => 0)
      const eq = equipeIdsRef.current.map((uid) => capturesRef.current.find((p) => p.uid === uid)).filter(Boolean)
      const pvJ = eq.map((p) => p.pvMax); const jJ = eq.map(() => 0)
      setPvJoueur(pvJ); setJaugeJoueur(jJ); etat.current = { pvJ, jJ, pvE, jE }; setPvEnnemis(pvE); setJaugeEnnemis(jE)
    } catch (err) { console.error('Erreur lancerCombatSuivant :', err) }
    finally { transitionEnCours.current = false }
  }
  lancerCombatSuivantRef.current = lancerCombatSuivant

  // ===== CHARGEMENT D'UN SLOT (ex-init, lit cleSlot(n)) =====
  async function chargerSlot(n) {
    setSlotActif(n); slotActifRef.current = n
    try { localStorage.setItem(CLE_SLOT_ACTIF, String(n)) } catch {}
    setMenuTitreOuvert(false)
    setChargement(true)
    try {
      const data = await chargerSlotCloud(n)
      if (data) {
        // Restaure le pseudo de CE slot (pour le classement).
        if (data.pseudoSlot) {
          setPseudoSlotEnCours(data.pseudoSlot)
          try { const id = definirPseudo(data.pseudoSlot); setIdentiteJoueur(id) } catch {}
        }
        // --- RESET DE DEPART (garde collection + pokedex, reset le reste) ---
        if (RESET_DEPART_ACTIF && data.resetDepart !== VERSION_RESET_DEPART) {
          data.captures = (data.captures || []).map((p) => p ? { ...p, niveau: 1, xp: 0, objetEquipe: null } : p)
          data.equipeIds = []
          data.equipeAreneIds = []; data.equipeRaidIds = []; data.equipeDefenseIds = []; data.equipeAttaqueIds = []
          data.vaincus = 0
          data.pokeDollars = 0
          data.balls = { poke: 10, super: 0, hyper: 0, master: 0 }
          data.pierres = {}; data.bonbons = {}; data.objets = {}; data.parchemins = {}
          data.objetsBoss = { rouage: 0, cristal: 0, relique: 0, iv_pv: 0, iv_attaque: 0, iv_vitesse: 0, iv_defense: 0 }
          data.achatsItems = {}
          data.medailles = 0; data.nbPrestiges = 0; data.raidsReussis = 0
          data.investisPrestige = { puissance: 0, xp: 0, argent: 0, shiny: 0 }
          data.victoiresParRoute = {}; data.bossVaincus = {}
          data.routeActive = 'tutoriel'
          data.ameliorations = {}
          data.reserveOeufs = []; data.oeufsIncubes = []; data.jetonsElevage = 0
          data.ameliorationsElevage = ameliorationsParDefaut()
          data.meilleurNiveauTour = 0; data.adnFusion = 0; data.collectionCartesTCG = []
          data.dresseursVaincus = {}; data.raidsCooldowns = {}
          data.succesDebloques = []
          data.recompensesReclamees = []
          data.resetDepart = VERSION_RESET_DEPART
          setTimeout(() => ajouterAuJournal('Nouveau depart ! Tes Pokemon sont conserves, le reste repart a zero.', 'victoire'), 1800)
        }
        let capturesRecalc = reparerFusions(data.captures || []).map((p) => { if (!p) return p; if (p.estFusion) { const urlF = (p.teteId && p.corpsId) ? urlFusionDepuisNational(p.teteId, p.corpsId) : null; return urlF ? { ...p, sprite: urlF, spriteNormal: urlF, spriteShiny: urlF } : p } const off = statsBaseOfficielles(p.id); const base = off ? { ...p, ...off } : p; const nivMin = niveauMinimalForme(base.id); const repare = (typeof base.id === 'number' && (base.niveau || 1) < nivMin) ? { ...base, niveau: nivMin, xp: 0 } : base; return { ...repare, iv: normaliserIV(repare.iv), role: determinerRole(repare), passif: determinerPassif(repare) } })
        for (let i = 0; i < capturesRecalc.length; i++) { const p = capturesRecalc[i]; if (p) capturesRecalc[i] = { ...p, ...statsFinales(p, BONUS_STAT_NIVEAU) } }
        const stockObjets = { ...(data.objets || {}) }; const compteObjet = {}; let nbDesequipes = 0
        for (let i = 0; i < capturesRecalc.length; i++) {
          const p = capturesRecalc[i]; if (!p || !p.objetEquipe) continue
          const id = p.objetEquipe; compteObjet[id] = (compteObjet[id] || 0) + 1
          if (compteObjet[id] > 2) { capturesRecalc[i] = { ...p, objetEquipe: null }; stockObjets[id] = (stockObjets[id] || 0) + 1; nbDesequipes += 1 }
        }
        data.captures = capturesRecalc
        const cleFamille = (p) => (p.familleId != null ? `f${p.familleId}` : `i${p.id}`)
        const famillesShiny = new Set()
        for (const p of capturesRecalc) { if (p && p.shiny) famillesShiny.add(cleFamille(p)) }
        let nbShinyRattrapes = 0; const idsShinyRattrapes = new Set()
        if (famillesShiny.size > 0) {
          for (let i = 0; i < capturesRecalc.length; i++) {
            const p = capturesRecalc[i]; if (!p || p.shiny) continue
            if (famillesShiny.has(cleFamille(p))) {
              const spriteShinyMembre = p.spriteShiny ?? p.sprite
              const maj = { ...p, shiny: true, sprite: spriteShinyMembre, spriteNormal: p.spriteNormal ?? p.sprite }
              capturesRecalc[i] = { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
              idsShinyRattrapes.add(p.id); nbShinyRattrapes += 1
            }
          }
        }
        data.captures = capturesRecalc
        // --- Nettoyage des doublons d'espece (une seule fois, protege par flag) ---
        let equipeIdsInit = data.equipeIds || []
        let equipeAreneInit = data.equipeAreneIds || []
        let equipeRaidInit = data.equipeRaidIds || []
        let equipeDefenseInit = data.equipeDefenseIds || []
        let equipeAttaqueInit = data.equipeAttaqueIds || []
        if (data.nettoyageDoublons !== VERSION_NETTOYAGE_DOUBLONS) {
          const res = fusionnerDoublonsCollection(capturesRecalc, {
            eq: equipeIdsInit, ar: equipeAreneInit, ra: equipeRaidInit,
            de: equipeDefenseInit, at: equipeAttaqueInit,
          })
          if (res.nbFusions > 0) {
            capturesRecalc = res.captures
            data.captures = capturesRecalc
            equipeIdsInit = res.equipes.eq
            equipeAreneInit = res.equipes.ar
            equipeRaidInit = res.equipes.ra
            equipeDefenseInit = res.equipes.de
            equipeAttaqueInit = res.equipes.at
            setEquipeAreneIds(equipeAreneInit)
            setEquipeRaidIds(equipeRaidInit)
            setEquipeDefenseIds(equipeDefenseInit)
            setEquipeAttaqueIds(equipeAttaqueInit)
            setTimeout(() => ajouterAuJournal(`${res.nbFusions} doublon(s) fusionne(s) -> IV combines.`, 'capture'), 2000)
          }
        }
        setCaptures(capturesRecalc); setEquipeIds(trierIdsParRole(equipeIdsInit, capturesRecalc))
        setPokedexVus(data.pokedexVus || [])
        if (data.pokedexSpeciaux) setPokedexSpeciaux(data.pokedexSpeciaux)
        { const baseShiny = data.pokedexShiny || []; const fusion = new Set(baseShiny); idsShinyRattrapes.forEach((id) => fusion.add(id)); setPokedexShiny([...fusion]) }
        if (nbShinyRattrapes > 0) setTimeout(() => ajouterAuJournal(`${nbShinyRattrapes} Pokemon shiny mis a jour.`, 'capture'), 1800)
        setVaincus(data.vaincus || 0); setPokeDollars(data.pokeDollars || 0)
        setBalls(data.balls || { poke: 0, super: 0, hyper: 0, master: 0 })
        setPierres(data.pierres || {}); setBonbons(data.bonbons || {}); setObjets(stockObjets)
        if (nbDesequipes > 0) setTimeout(() => ajouterAuJournal(`${nbDesequipes} objet(s) desequipe(s). Rendus au sac.`, 'info'), 1500)
        if (data.objetsBoss) setObjetsBoss({ rouage: 0, cristal: 0, relique: 0, iv_pv: 0, iv_attaque: 0, iv_vitesse: 0, iv_defense: 0, ...data.objetsBoss })
        if (data.parchemins) setParchemins(data.parchemins)
        setAchatsItems(data.achatsItems || {}); setRecompensesReclamees(data.recompensesReclamees || [])
        if (typeof data.medailles === 'number') setMedailles(data.medailles)
        if (typeof data.nbPrestiges === 'number') setNbPrestiges(data.nbPrestiges)
        if (typeof data.raidsReussis === 'number') setRaidsReussis(data.raidsReussis)
        if (data.investisPrestige) setInvestisPrestige(data.investisPrestige)
        if (data.equipeAreneIds) setEquipeAreneIds(data.equipeAreneIds)
        if (data.raidsCooldowns) setRaidsCooldowns(data.raidsCooldowns)
        if (data.equipeRaidIds) setEquipeRaidIds(data.equipeRaidIds)
        if (Array.isArray(data.reserveOeufs)) setReserveOeufs(data.reserveOeufs)
        if (typeof data.jetonsElevage === 'number') setJetonsElevage(data.jetonsElevage)
        const amElevageCharge = { ...ameliorationsParDefaut(), ...(data.ameliorationsElevage || {}) }
        setAmeliorationsElevage(amElevageCharge)
        const nbInc = amElevageCharge.incubateurs || NB_INCUBATEURS_DEPART
        if (Array.isArray(data.oeufsIncubes)) {
          const slots = Array(Math.max(nbInc, data.oeufsIncubes.length)).fill(null)
          data.oeufsIncubes.forEach((o, i) => { slots[i] = o || null }); setOeufsIncubes(slots)
        } else { setOeufsIncubes(Array(nbInc).fill(null)) }
        if (data.equipeDefenseIds) setEquipeDefenseIds(data.equipeDefenseIds)
        if (data.equipeAttaqueIds) setEquipeAttaqueIds(data.equipeAttaqueIds)
        if (data.tutoVu) setTutoVu(true)
        if (data.tutoPrestigeVu) setTutoPrestigeVu(true)
        if (typeof data.meilleurNiveauTour === 'number') setMeilleurNiveauTour(data.meilleurNiveauTour)
        if (typeof data.adnFusion === 'number') setAdnFusion(data.adnFusion)
        if (Array.isArray(data.collectionCartesTCG)) setCollectionCartesTCG(data.collectionCartesTCG)
        if (data.dresseursVaincus && !Array.isArray(data.dresseursVaincus)) setDresseursVaincus(data.dresseursVaincus)
        const histoireDejaReset = !RESET_HISTOIRE_ACTIF || data.resetHistoire === VERSION_RESET_HISTOIRE
        setVictoiresParRoute(histoireDejaReset ? (data.victoiresParRoute || {}) : {}); setBossVaincus(histoireDejaReset ? (data.bossVaincus || {}) : {})
        setSuccesDebloques(data.succesDebloques || []); setAmeliorations(data.ameliorations || {})
        ameliorationsRef.current = data.ameliorations || {}; bonusShinyGlobal = multiplicateur(data.ameliorations || {}, 'chroma')
        if (data.vitesse) setVitesse(Math.min(4, data.vitesse))
        if (data.reglesCapture) { const rc = { limiteBalls: 5, ...data.reglesCapture }; setReglesCapture(rc); reglesCaptureRef.current = rc }
        if (data.ciblesMasterBall) {
          const cibles = data.ciblesMasterBall.map((c) => { if (typeof c === 'string') { const shiny = c.endsWith('-shiny'); const id = parseInt(c, 10); return { cle: c, id, nom: `#${id}`, shiny, sprite: null } } return c }).filter((c) => c && c.cle)
          setCiblesMasterBall(cibles); ciblesMasterBallRef.current = cibles
        }
        if (histoireDejaReset && data.routeActive) { setRouteActive(data.routeActive); routeActiveRef.current = data.routeActive }
        else { setRouteActive('tutoriel'); routeActiveRef.current = 'tutoriel' }
        capturesRef.current = data.captures || []
        victoiresParRouteRef.current = histoireDejaReset ? (data.victoiresParRoute || {}) : {}
        bossVaincusRef.current = histoireDejaReset ? (data.bossVaincus || {}) : {}
        ajouterAuJournal('Partie chargee.', 'info')
        const eq = (data.equipeIds || []).map((uid) => (data.captures || []).find((p) => p.uid === uid)).filter(Boolean)
        const pvJ = eq.map((p) => p.pvMax); const jJ = eq.map(() => 0); setPvJoueur(pvJ); setJaugeJoueur(jJ)
        const routeInit = routeParId(routeActiveRef.current)
        const ennemis = await chargerEquipeEnnemie(routeInit); setEquipeEnnemie(ennemis)
        const pvE = ennemis.map((p) => p.pvMax); const jE = ennemis.map(() => 0); setPvEnnemis(pvE); setJaugeEnnemis(jE)
        etat.current = { pvJ, jJ, pvE, jE }; setChargement(false); setPartieChargee(true)
        setTimeout(() => { reparerEvolutionsSave() }, 2500)
      } else { setChoixStarterRequis(true); setChargement(false) }
    } catch (err) { console.error('Erreur chargement slot :', err); setChargement(false) }
  }

  // ===== AUTH : verifie la session au demarrage + ecoute login/logout =====
  useEffect(() => {
    let monte = true
    sessionActuelle().then((s) => { if (monte) { setSession(s); setSessionVerifiee(true) } })
    // On ne reagit qu'a un VRAI changement d'utilisateur (login/logout),
    // pas aux rafraichissements de token (qui surviennent au retour d'onglet).
    const desabonner = surChangementAuth((s) => {
      if (!monte) return
      setSession((ancienne) => {
        const ancienId = ancienne?.user?.id || null
        const nouvelId = s?.user?.id || null
        if (ancienId === nouvelId) return ancienne // meme user -> on ne change rien
        return s
      })
    })
    return () => { monte = false; desabonner() }
  }, [])

  // Au demarrage (une fois connecte) : lit les 3 slots DU CLOUD et affiche le menu titre.
  // Ne se declenche qu'UNE fois par utilisateur (pas a chaque retour d'onglet).
  const slotsChargesRef = useRef(false)
  useEffect(() => {
    if (!session) { slotsChargesRef.current = false; return }
    if (slotsChargesRef.current) return // deja charge pour cet utilisateur
    slotsChargesRef.current = true
    let monte = true
    setChargement(true)
    chargerSlotsCloud().then((slotsData) => {
      if (!monte) return
      const resumes = slotsData.map((d) => resumeDepuisData(d))
      setResumesSlots(resumes)
      setMenuTitreOuvert(true)
      setChargement(false)
    })
    return () => { monte = false }
  }, [session])

  // ===== ACTIONS DU MENU TITRE =====
  function jouerSlot(index) { chargerSlot(index + 1) }
  function nouvellePartieSlot(index) {
    const n = index + 1
    setSlotActif(n); slotActifRef.current = n
    try { localStorage.setItem(CLE_SLOT_ACTIF, String(n)) } catch {}
    setMenuTitreOuvert(false)
    // Nouvelle partie : on demande d'abord le pseudo, PUIS le starter.
    setPseudoSlotEnCours('')
    setChoixPseudoSlotOuvert(true)
  }
  // Apres validation du pseudo de slot -> on passe au choix du starter.
  function validerPseudoSlot(pseudo) {
    setPseudoSlotEnCours(pseudo)
    setChoixPseudoSlotOuvert(false)
    // Definir l'identite classement avec ce pseudo (garde l'id unique de l'appareil).
    try { const id = definirPseudo(pseudo); setIdentiteJoueur(id) } catch {}
    setChoixStarterRequis(true)
  }
  async function supprimerSlot(index) {
    const n = index + 1
    if (!confirm(`Supprimer definitivement la partie du slot ${n} ? Cette action est irreversible.`)) return
    await supprimerSlotCloud(n)
    const slotsData = await chargerSlotsCloud()
    setResumesSlots(slotsData.map((d) => resumeDepuisData(d)))
  }
  function retourMenuTitre() { window.location.reload() }

  const donneesSauvegardeRef = useRef(null)
  const dernierePushCloudRef = useRef(0)
  const pushCloudTimerRef = useRef(null)
  useEffect(() => {
    if (!partieChargee || captures.length === 0) return
    if (!slotActifRef.current) return
    const data = { resetHistoire: VERSION_RESET_HISTOIRE, nettoyageDoublons: VERSION_NETTOYAGE_DOUBLONS, resetDepart: VERSION_RESET_DEPART, pseudoSlot: pseudoSlotEnCours, captures, equipeIds, pokedexVus, pokedexShiny, pokedexSpeciaux, vaincus, pokeDollars, balls, pierres, bonbons, objets, objetsBoss, parchemins, achatsItems, recompensesReclamees, medailles, nbPrestiges, raidsReussis, investisPrestige, equipeAreneIds, equipeDefenseIds, equipeAttaqueIds, dresseursVaincus, routeActive, victoiresParRoute, bossVaincus, succesDebloques, ameliorations, vitesse, reglesCapture, ciblesMasterBall, tutoVu, tutoPrestigeVu, raidsCooldowns, equipeRaidIds, reserveOeufs, oeufsIncubes, jetonsElevage, ameliorationsElevage, meilleurNiveauTour, collectionCartesTCG, adnFusion }
    donneesSauvegardeRef.current = data
    // Sauvegarde CLOUD debouncee : on n'ecrit pas a chaque micro-changement.
    // On garde une copie locale de secours, et on pousse au cloud au max toutes les 10s.
    try { localStorage.setItem(cleSlot(slotActifRef.current), JSON.stringify(data)) } catch {}
    const slot = slotActifRef.current
    if (pushCloudTimerRef.current) clearTimeout(pushCloudTimerRef.current)
    const maintenant = Date.now()
    const depuisDernier = maintenant - dernierePushCloudRef.current
    const delai = depuisDernier > 10000 ? 400 : 10000 - depuisDernier
    pushCloudTimerRef.current = setTimeout(() => {
      dernierePushCloudRef.current = Date.now()
      sauverSlotCloud(slot, donneesSauvegardeRef.current)
    }, delai)
  }, [partieChargee, captures, equipeIds, pokedexVus, pokedexShiny, pokedexSpeciaux, vaincus, pokeDollars, balls, pierres, bonbons, objets, objetsBoss, parchemins, achatsItems, recompensesReclamees, medailles, investisPrestige, equipeAreneIds, equipeDefenseIds, equipeAttaqueIds, dresseursVaincus, routeActive, victoiresParRoute, bossVaincus, succesDebloques, ameliorations, vitesse, reglesCapture, ciblesMasterBall, tutoVu, raidsCooldowns, equipeRaidIds, meilleurNiveauTour, collectionCartesTCG])

  // Sauvegarde de securite quand on quitte/recharge la page (push cloud immediat).
  useEffect(() => {
    function avantFermeture() {
      const slot = slotActifRef.current
      if (slot && donneesSauvegardeRef.current) {
        try { sauverSlotCloud(slot, donneesSauvegardeRef.current) } catch {}
      }
    }
    window.addEventListener('beforeunload', avantFermeture)
    return () => window.removeEventListener('beforeunload', avantFermeture)
  }, [])

  useEffect(() => {
    let versionInitiale = null; let arrete = false
    async function lireVersion() { try { const rep = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' }); if (!rep.ok) return null; const j = await rep.json(); return j && j.version != null ? String(j.version) : null } catch { return null } }
    async function verifier() {
      if (arrete) return; const v = await lireVersion(); if (!v) return
      if (versionInitiale === null) { versionInitiale = v; return }
      if (v !== versionInitiale) {
        if (combatBossRef.current || modeJeuRef.current === 'arene') return
        // Pousse la sauvegarde au cloud avant de recharger.
        if (donneesSauvegardeRef.current && slotActifRef.current) {
          try { await sauverSlotCloud(slotActifRef.current, donneesSauvegardeRef.current) } catch {}
        }
        arrete = true; window.location.reload()
      }
    }
    verifier(); const id = setInterval(verifier, 5 * 60 * 1000); return () => { arrete = true; clearInterval(id) }
  }, [])

  function statsClassement() {
    const nbShiny = captures.filter((p) => p.shiny).length
    const nbZones = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    // Carte la plus rare possedee = plus grand "1 sur X" (taux estime).
    let carteRare = 0
    for (const c of collectionCartesTCG) {
      const taux = estimerTauxCarte(c, { poidsCarte: c._poidsCarte, poidsTotal: c._poidsTotal, nbCartesRarete: c._nbRarete })
      if (taux && taux > carteRare) carteRare = taux
    }
    return { pokemonCaptures: pokedexVus.length, nbShiny, zones: nbZones, scorePvp: 0, rangPvp: 'Non classe', carteRare, nbPrestiges }
  }
  const statsClassementRef = useRef(statsClassement())
  useEffect(() => { statsClassementRef.current = statsClassement() }, [captures, pokedexVus, bossVaincus, collectionCartesTCG, nbPrestiges])

  const dernierEnvoiScore = useRef(0)
  function envoyerScoreThrottle(forcer = false) {
    if (!identiteJoueur) return; const maintenant = Date.now()
    if (!forcer && maintenant - dernierEnvoiScore.current < 15000) return
    dernierEnvoiScore.current = maintenant; envoyerScore(statsClassementRef.current)
  }
  const envoyerScoreThrottleRef = useRef(envoyerScoreThrottle)
  useEffect(() => { envoyerScoreThrottleRef.current = envoyerScoreThrottle })

  useEffect(() => {
    if (!partieChargee || !identiteJoueur) return
    envoyerScore(statsClassementRef.current); dernierEnvoiScore.current = Date.now()
    const horloge = setInterval(() => { envoyerScore(statsClassementRef.current); dernierEnvoiScore.current = Date.now() }, 120000)
    return () => clearInterval(horloge)
  }, [partieChargee, identiteJoueur])

  useEffect(() => {
    if (vueOuverte === 'classement' && identiteJoueur) { envoyerScore(statsClassementRef.current); dernierEnvoiScore.current = Date.now() }
  }, [vueOuverte])

  useEffect(() => {
    if (chargement) return
    let dernierTic = Date.now()
    let respawnA = 0
    const horloge = creerHorloge(() => {
      const maintenant = Date.now()
      if (respawnA > 0 && maintenant >= respawnA) { respawnA = 0; lancerCombatSuivant(); dernierTic = Date.now(); return }
      if (respawnA > 0) return
      const intervalleCombat = VITESSE_COMBAT / (vitesse * multiplicateur(ameliorationsRef.current, 'frenesie'))
      if (maintenant - dernierTic < intervalleCombat) return
      dernierTic = maintenant
      if (transitionEnCours.current) return
      if (modeJeuRef.current === 'arene') return
      if (modeJeuRef.current === 'raid') return
      if (vueOuverteRef.current !== null) return
      const bonusPuissance = multiplicateur(ameliorationsRef.current, 'puissance') * bonusPrestigePuissance
      let equipeJoueur = equipeIdsRef.current.map((uid) => capturesRef.current.find((p) => p.uid === uid)).filter(Boolean)
        .map((p) => bonusPuissance === 1 ? p : { ...p, pvMax: Math.round(p.pvMax * bonusPuissance), attaque: Math.round(p.attaque * bonusPuissance), defense: Math.round((p.defense || 50) * bonusPuissance) })
      equipeJoueur = preparerEquipe(equipeJoueur, 'principal'); equipeJoueur = appliquerBonusEquipe(equipeJoueur)
      const equipeEnnemie = equipeEnnemieRef.current
      if (equipeJoueur.length === 0 || equipeEnnemie.length === 0) return
      if (!compositionValideRef.current) return
      if (debutCombatRef.current === 0) debutCombatRef.current = Date.now()
      let e = etat.current
      if (e.pvJ.length !== equipeJoueur.length) { const pvJ = equipeJoueur.map((p) => p.pvMax); const jJ = equipeJoueur.map(() => 0); e = { ...e, pvJ, jJ }; etat.current = e }
      if (e.pvE.length !== equipeEnnemie.length) { const pvE = equipeEnnemie.map((p) => p.pvMax); const jE = equipeEnnemie.map(() => 0); e = { ...e, pvE, jE }; etat.current = e }
      const tempsEcoule = debutCombatRef.current > 0 ? (Date.now() - debutCombatRef.current) : 0
      if (tempsEcoule >= DELAI_ULTIME_MS) {
        const lances = ultimeLanceRef.current; let majJoueur = false
        for (let k = 0; k < equipeJoueur.length; k++) {
          if (!lances[k] && equipeJoueur[k] && e.pvJ[k] > 0) {
            const ult = ultimeDuRole(equipeJoueur[k].role || 'dps')
            const res = appliquerUltime(k, ult, equipeJoueur, e.pvJ, e.jJ, equipeEnnemie, e.pvE)
            if (res.bouclierTics > 0) bouclierTicsRef.current = res.bouclierTics
            if (res.coups && res.coups.length) ajouterChiffres(res.coups)
            if (ult) ajouterAuJournal(`${ult.emoji} ${equipeJoueur[k].nom} declenche ${ult.nom} !`, 'victoire')
            lances[k] = true; majJoueur = true
          }
        }
        if (majJoueur) setUltimeLanceJoueur([...lances])
        const lancesE = ultimeLanceEnnemiRef.current; let majEnnemi = false
        for (let k = 0; k < equipeEnnemie.length; k++) {
          if (!lancesE[k] && equipeEnnemie[k] && e.pvE[k] > 0) {
            const ultE = ultimeDuRole(equipeEnnemie[k].role || 'dps')
            const resE = appliquerUltime(k, ultE, equipeEnnemie, e.pvE, e.jE, equipeJoueur, e.pvJ, 'ennemi')
            if (resE.bouclierTics > 0) bouclierTicsEnnemiRef.current = resE.bouclierTics
            if (resE.coups && resE.coups.length) ajouterChiffres(resE.coups)
            if (ultE) ajouterAuJournal(`${ultE.emoji} ${equipeEnnemie[k].nom} (ennemi) declenche ${ultE.nom} !`, 'echec')
            lancesE[k] = true; majEnnemi = true
          }
        }
        if (majEnnemi) setUltimeLanceEnnemiAff([...lancesE])
      }
      const bouclierActif = bouclierTicsRef.current > 0; const bouclierActifE = bouclierTicsEnnemiRef.current > 0
      const optionsTic = { bouclierJoueur: bouclierActif ? 0.5 : 0, bouclierEnnemi: bouclierActifE ? 0.5 : 0 }
      if (bouclierTicsRef.current > 0) bouclierTicsRef.current -= 1
      if (bouclierTicsEnnemiRef.current > 0) bouclierTicsEnnemiRef.current -= 1
      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, equipeEnnemie, e.pvE, e.jE, optionsTic)
      etat.current = { pvJ: r.pvJoueur, jJ: r.jaugeJoueur, pvE: r.pvEnnemis, jE: r.jaugeEnnemis }
      setPvJoueur(r.pvJoueur); setJaugeJoueur(r.jaugeJoueur); setPvEnnemis(r.pvEnnemis); setJaugeEnnemis(r.jaugeEnnemis)
      if (r.coups && r.coups.length) ajouterChiffres(r.coups)
      r.ennemisTombes.forEach((index) => {
        const ennemi = equipeEnnemieRef.current[index]
        if (ennemi) {
          const multi = MULTI_XP_RARETE[ennemi.rarete] || 1
          const eqJ = equipeIdsRef.current.map((id) => capturesRef.current[id]).filter(Boolean)
          const nivMoyEq = eqJ.length ? eqJ.reduce((s, p) => s + (p.niveau || 1), 0) / eqJ.length : 1
          const nivMoyEnn = equipeEnnemieRef.current.length ? equipeEnnemieRef.current.reduce((s, e) => s + (e.niveau || 1), 0) / equipeEnnemieRef.current.length : 1
          const multiSurcl = multiplicateurSurclassement(nivMoyEq, nivMoyEnn)
          const xp = XP_BASE_ENNEMI * (ennemi.niveau || 1) * multi * multiSurcl * multiplicateur(ameliorationsRef.current, 'mentor') * bonusCompletionXP * bonusPrestigeXP * bonusSuccesXP * bonusTourXP
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
            const bossDejaVaincu = !!bossVaincusRef.current[routeGagnee]
            const gainBoss = Math.round((boss?.niveau || 1) * 30 * multiplicateur(ameliorationsRef.current, 'fortune') * bonusCompletionArgent * bonusPrestigeArgent * bonusArgentObjets * bonusSuccesArgent)
            setPokeDollars((a) => a + gainBoss); setBossVaincus((b) => ({ ...b, [routeGagnee]: true }))
            setVictoiresParRoute((v) => { const maj = { ...v, [routeGagnee]: 0 }; victoiresParRouteRef.current = maj; return maj })
            setAchatsItems((a) => { const reduit = {}; for (const k in a) reduit[k] = Math.max(0, a[k] - 1); return reduit })
            const chanceBonbon = 0.10 * multiplicateur(ameliorationsRef.current, 'gourmandise')
            const bonbonsBoss = Math.random() < chanceBonbon ? 1 : 0
            if (bonbonsBoss > 0) setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + bonbonsBoss }))
            tirerObjetsBoss('zone')
            const jetonsGagnes = bossDejaVaincu ? 1 : JETONS_PAR_BOSS; setJetonsElevage((j) => j + jetonsGagnes)
            if (boss) ajouterAuJournal(`BOSS VAINCU ! ${boss.nom} terrasse ! (+${gainBoss} +${jetonsGagnes} jetons)`, 'victoire')
            ajouterAuJournal(`Zone suivante debloquee !`, 'victoire')
            setCombatBoss(false); combatBossRef.current = false
            if (autoZoneRef.current) {
              const bossVaincusMaj = { ...bossVaincusRef.current, [routeGagnee]: true }
              const debloquees = ROUTES.filter((rt) => routeDebloquee(rt, bossVaincusMaj))
              const idxActuel = debloquees.findIndex((rt) => rt.id === routeGagnee)
              const suivante = idxActuel >= 0 ? debloquees[idxActuel + 1] : null
              if (suivante) { setRouteActive(suivante.id); routeActiveRef.current = suivante.id; ajouterAuJournal(`Auto : direction ${suivante.nom} !`, 'info') }
              else { setAutoZone(false); autoZoneRef.current = false; ajouterAuJournal(`Auto zone arrete.`, 'info') }
            }
            setTimeout(() => envoyerScoreThrottleRef.current(true), 0)
          } else {
            setVaincus((n) => n + 1)
            const gainBrut = equipeEnnemieRef.current.reduce((total, e) => total + GAIN_BASE_ENNEMI * (e.niveau || 1) * (MULTI_XP_RARETE[e.rarete] || 1), 0)
            const eqJoueur = equipeIdsRef.current.map((id) => capturesRef.current[id]).filter(Boolean)
            const nivMoyenJoueur = eqJoueur.length ? eqJoueur.reduce((s, p) => s + (p.niveau || 1), 0) / eqJoueur.length : 1
            const nivMoyenEnnemis = equipeEnnemieRef.current.length ? equipeEnnemieRef.current.reduce((s, e) => s + (e.niveau || 1), 0) / equipeEnnemieRef.current.length : 1
            const multiSurclassement = multiplicateurSurclassement(nivMoyenJoueur, nivMoyenEnnemis)
            const gainArgent = Math.max(1, Math.round(gainBrut * multiSurclassement * multiplicateur(ameliorationsRef.current, 'fortune') * bonusCompletionArgent * bonusPrestigeArgent * bonusArgentObjets * bonusSuccesArgent))
            setPokeDollars((a) => a + gainArgent)
            const chanceObjet = 0.003 * multiplicateur(ameliorationsRef.current, 'chineur')
            if (Math.random() < chanceObjet) { const objetDrop = tirerObjetDrop(); setObjets((o) => ({ ...o, [objetDrop]: (o[objetDrop] || 0) + 1 })); ajouterAuJournal(`Objet trouve : ${OBJETS[objetDrop].nom} !`, 'capture') }
            const amElevage = ameliorationsElevageRef.current
            if (oeufsIncubesRef.current.some((o) => o && !pretAEclore(o, amElevage))) {
              setOeufsIncubes((slots) => slots.map((o) => (o && o.progression < combatsRequis(o, amElevage)) ? { ...o, progression: o.progression + 1 } : o))
            }
            if (Math.random() < CHANCE_JETON_COMBAT + bonusRendement(amElevage)) setJetonsElevage((j) => j + 1)
            if (Math.random() < TAUX_DROP_OEUF + bonusChance(amElevage)) { const nouvelOeuf = creerOeuf(tirerRareteOeuf()); setReserveOeufs((r) => [...r, nouvelOeuf]); ajouterAuJournal(`Oeuf trouve !`, 'capture') }
            setVictoiresParRoute((v) => ({ ...v, [routeGagnee]: (v[routeGagnee] || 0) + 1 }))
            ajouterAuJournal(`Equipe ennemie vaincue ! (+${gainArgent})`, 'victoire')
            setTimeout(() => envoyerScoreThrottleRef.current(false), 0)
          }
        } else {
          if (combatBossRef.current) {
            const routePerdue = routeActiveRef.current
            ajouterAuJournal('Le boss vous a vaincus !', 'echec')
            setVictoiresParRoute((v) => ({ ...v, [routePerdue]: 0 })); setCombatBoss(false); combatBossRef.current = false
          } else { ajouterAuJournal('Equipe K.O. ! On recommence...', 'echec') }
        }
        respawnA = Date.now() + (PAUSE_RESPAWN / vitesse)
      }
    })
    horloge.start(40)
    return () => horloge.detruire()
  }, [chargement, vitesse])

  async function choisirStarters(noms) {
    setChargement(true); setChoixStarterRequis(false)
    const starters = await Promise.all(noms.map((nom) => chargerPokemon(nom)))
    setCaptures(starters); capturesRef.current = starters
    setEquipeIds(trierIdsParRole(starters.map((s) => s.uid), starters))
    setPokedexVus(starters.map((s) => s.id))
    setBalls({ poke: 10, super: 0, hyper: 0, master: 0 }); setPokeDollars(50)
    const pvJ = starters.map((s) => s.pvMax); const jJ = starters.map(() => 0); setPvJoueur(pvJ); setJaugeJoueur(jJ)
    const routeInit = routeParId(routeActiveRef.current)
    const ennemis = await chargerEquipeEnnemie(routeInit); setEquipeEnnemie(ennemis)
    const pvE = ennemis.map((p) => p.pvMax); const jE = ennemis.map(() => 0); setPvEnnemis(pvE); setJaugeEnnemis(jE)
    etat.current = { pvJ, jJ, pvE, jE }
    ajouterAuJournal(`Ton equipe de depart : ${starters.map((s) => s.nom).join(', ')} !`, 'victoire')
    setChargement(false); setPartieChargee(true)
  }

  function acheterBall(type, quantite = 1) {
    const coutTotal = BALLS[type].prix * quantite
    if (pokeDollars >= coutTotal) { setPokeDollars((a) => a - coutTotal); setBalls((b) => ({ ...b, [type]: b[type] + quantite })) }
  }
  function prixAvecNegociateur(prixBase, nbAchats) {
    const plein = prixDynamique(prixBase, nbAchats); const majoration = plein - prixBase
    return Math.round(prixBase + majoration * facteurNegociateur(ameliorations))
  }
  function acheterPierre(type, quantite = 1) {
    const prixUnitaire = prixAvecNegociateur(PIERRES[type].prix, achatsItems[type] || 0); const coutTotal = prixUnitaire * quantite
    if (pokeDollars >= coutTotal) { setPokeDollars((a) => a - coutTotal); setPierres((p) => ({ ...p, [type]: (p[type] || 0) + quantite })); setAchatsItems((a) => ({ ...a, [type]: (a[type] || 0) + quantite })) }
  }
  function acheterBonbon(type, quantite = 1) {
    const coutTotal = BONBONS[type].prix * quantite
    if (pokeDollars >= coutTotal) { setPokeDollars((a) => a - coutTotal); setBonbons((b) => ({ ...b, [type]: (b[type] || 0) + quantite })) }
  }

  function placerOeuf(oeuf) {
    const libre = oeufsIncubesRef.current.findIndex((o) => !o)
    if (libre === -1) { ajouterAuJournal('Tous les incubateurs sont occupes.', 'info'); return }
    setOeufsIncubes((slots) => { const maj = [...slots]; maj[libre] = oeuf; return maj })
    setReserveOeufs((r) => r.filter((o) => o.id !== oeuf.id))
  }
  function acheterOeuf(cle) {
    const info = infoOeuf(cle); const prix = info.prix
    if (!prix || jetonsElevage < prix) return
    setJetonsElevage((j) => j - prix); const nouvelOeuf = creerOeuf(cle); setReserveOeufs((r) => [...r, nouvelOeuf])
    ajouterAuJournal(`${info.nom} achete ! (-${prix} jetons)`, 'info')
  }
  function ameliorerElevage(cle) {
    const niveauActuel = ameliorationsElevageRef.current[cle] || 0; const prix = prixAmelioration(cle, niveauActuel)
    if (prix == null || jetonsElevage < prix) return
    setJetonsElevage((j) => j - prix); setAmeliorationsElevage((a) => ({ ...a, [cle]: (a[cle] || 0) + 1 }))
    ajouterAuJournal(`Elevage ameliore : ${cle} niveau ${niveauActuel + 1} ! (-${prix} jetons)`, 'info')
  }
  function acheterIncubateur() {
    const nbActuel = nbIncubateurs(ameliorationsElevageRef.current); const prix = prixIncubateur(nbActuel)
    if (prix == null || jetonsElevage < prix) return
    setJetonsElevage((j) => j - prix); setAmeliorationsElevage((a) => ({ ...a, incubateurs: nbActuel + 1 }))
    setOeufsIncubes((slots) => { const maj = [...slots]; while (maj.length < nbActuel + 1) maj.push(null); return maj })
    ajouterAuJournal(`Nouvel incubateur debloque ! (${nbActuel + 1} au total, -${prix} jetons)`, 'info')
  }
  async function eclore(oeuf) {
    if (!pretAEclore(oeuf, ameliorationsElevageRef.current)) return
    setOeufsIncubes((slots) => slots.map((o) => (o && o.id === oeuf.id ? null : o)))
    const contenu = tirerContenuOeuf(oeuf)
    try {
      const pkmn = await chargerPokemon(String(contenu.numero))
      const shiny = shinyDepuisOeuf(oeuf, ameliorationsElevageRef.current)
      const ivBonifie = ivDepuisOeuf(oeuf, ameliorationsElevageRef.current)
      const base = { ...pkmn, shiny, sprite: shiny ? (pkmn.spriteShiny || pkmn.sprite) : (pkmn.spriteNormal || pkmn.sprite), iv: ivBonifie }
      const finales = statsFinales(base, BONUS_STAT_NIVEAU); const nouveau = { ...base, ...finales }
      const mention = contenu.estLegendaire ? ' LEGENDAIRE' : (contenu.estBebe ? ' bebe' : '')
      const existant = capturesRef.current.find((p) => p.id === nouveau.id && (p.shiny ?? false) === shiny)
      if (existant) {
        const ivFusionnes = fusionnerIV(existant.iv, nouveau.iv)
        setCaptures((c) => c.map((p) => { if (p.uid !== existant.uid) return p; const maj = { ...p, iv: ivFusionnes }; return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) } }))
        marquerVu(nouveau.id); if (shiny) marquerShiny(nouveau.id)
        ajouterAuJournal(`Oeuf eclos : ${nouveau.nom}${mention} (doublon) -> IV ameliores !`, 'capture')
      } else {
        setCaptures((c) => [...c, nouveau]); marquerVu(nouveau.id); if (shiny) marquerShiny(nouveau.id)
        ajouterAuJournal(`Ton oeuf a eclos : ${nouveau.nom}${mention}${shiny ? ' SHINY' : ''} !`, 'capture'); montrerCapture(nouveau)
      }
      setJetonsElevage((j) => j + JETONS_PAR_ECLOSION)
    } catch (err) {
      ajouterAuJournal("L'oeuf n'a pas pu eclore (erreur reseau).", 'echec')
      setOeufsIncubes((slots) => { const libre = slots.findIndex((o) => !o); if (libre === -1) return slots; const maj = [...slots]; maj[libre] = oeuf; return maj })
    }
  }

  function acheterObjet(id, quantite = 1) {
    const info = OBJETS[id]; if (!info || !info.prix) return
    const prixUnitaire = prixAvecNegociateur(info.prix, achatsItems[id] || 0); const coutTotal = prixUnitaire * quantite
    if (pokeDollars >= coutTotal) { setPokeDollars((a) => a - coutTotal); setObjets((o) => ({ ...o, [id]: (o[id] || 0) + quantite })); setAchatsItems((a) => ({ ...a, [id]: (a[id] || 0) + quantite })) }
  }
  function acheterParchemin(cle, quantite = 1) {
    const info = PARCHEMINS[cle]; if (!info) return; const coutTotal = info.prix * quantite
    if (pokeDollars >= coutTotal) { setPokeDollars((a) => a - coutTotal); setParchemins((pp) => ({ ...pp, [cle]: (pp[cle] || 0) + quantite })) }
  }

  function utiliserBonbon(uid, type) {
    if (!bonbons[type] || bonbons[type] <= 0) return
    const info = BONBONS[type]; setBonbons((b) => ({ ...b, [type]: b[type] - 1 }))
    setCaptures((liste) => liste.map((poke) => {
      if (poke.uid !== uid) return poke
      let pkm = { ...poke }
      if (info.effet === 'xp') { const { pokemon } = ajouterXP(pkm, info.valeur, XP_BASE_NIVEAU, BONUS_STAT_NIVEAU); pkm = { ...pokemon, uid: poke.uid } }
      else if (info.effet === 'niveau') { const manque = Math.max(1, xpRequise(pkm.niveau, XP_BASE_NIVEAU) - (pkm.xp || 0)); const { pokemon } = ajouterXP(pkm, manque, XP_BASE_NIVEAU, BONUS_STAT_NIVEAU); pkm = { ...pokemon, uid: poke.uid } }
      pkm = { ...pkm, evolueEn: poke.evolueEn ?? null, evolueNiveau: poke.evolueNiveau ?? null, evolutionsPierre: poke.evolutionsPierre ?? [], formeEvoluee: poke.formeEvoluee ?? null, estEvolution: poke.estEvolution ?? false, familleId: poke.familleId ?? null, shiny: poke.shiny ?? false, spriteNormal: poke.spriteNormal ?? null, spriteShiny: poke.spriteShiny ?? null }
      return pkm
    }))
    ajouterAuJournal(`${info.emoji} ${info.nom} utilise !`, 'victoire')
  }

  function utiliserBonbonIV(uidPokemon, cleBonbon) {
    const info = BONBONS_IV[cleBonbon]; if (!info) return
    if ((objetsBoss[cleBonbon] || 0) <= 0) { ajouterAuJournal(`Tu n'as pas de ${info.nom} en stock.`, 'info'); return }
    const poke = capturesRef.current.find((p) => p.uid === uidPokemon); if (!poke) return
    const stat = info.stat; const ivActuel = (poke.iv && Number.isFinite(poke.iv[stat])) ? poke.iv[stat] : 0
    if (ivActuel >= 31) { ajouterAuJournal(`${poke.nom} : IV deja au max (31).`, 'info'); return }
    setObjetsBoss((stock) => ({ ...stock, [cleBonbon]: (stock[cleBonbon] || 0) - 1 }))
    const nouvelleCollection = capturesRef.current.map((p) => { if (p.uid !== uidPokemon) return p; const ivMaj = { ...(p.iv || {}), [stat]: Math.min(31, ivActuel + 1) }; const maj = { ...p, iv: ivMaj }; return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) } })
    capturesRef.current = nouvelleCollection; setCaptures(nouvelleCollection)
    ajouterAuJournal(`${info.emoji} ${poke.nom} : IV ${stat} -> ${Math.min(31, ivActuel + 1)}/31 !`, 'victoire')
  }

  function acheterAmelioration(cle) {
    const niveau = ameliorations[cle] || 0; if (niveau >= PALIER_MAX) return
    const cout = coutAmelioration(cle, niveau)
    if (pokeDollars >= cout) { setPokeDollars((a) => a - cout); setAmeliorations((am) => ({ ...am, [cle]: (am[cle] || 0) + 1 })) }
  }
  function acheterAmeliorationEndgame(cleEg) {
    const niveau = ameliorations[cleEg] || 0; if (niveau >= PALIER_MAX) return
    if (!endgameDebloque(ameliorations, cleEg)) return
    const cout = coutEndgame(niveau); if (!peutPayerEndgame(objetsBoss, cout)) return
    setObjetsBoss((stock) => ({ rouage: (stock.rouage || 0) - cout.rouage, cristal: (stock.cristal || 0) - cout.cristal, relique: (stock.relique || 0) - cout.relique }))
    setAmeliorations((am) => ({ ...am, [cleEg]: (am[cleEg] || 0) + 1 })); ajouterAuJournal(`Amelioration endgame renforcee !`, 'victoire')
  }

  function reclamerRecompense(palier) {
    if (!palier || recompensesReclamees.includes(palier.id)) return
    const clesPierres = Object.keys(PIERRES); const resume = []
    for (const g of palier.gains) {
      if (g.type === 'argent') { setPokeDollars((a) => a + g.montant); resume.push(`${g.montant}`) }
      else if (g.type === 'ball') { setBalls((b) => ({ ...b, [g.ball]: (b[g.ball] || 0) + g.quantite })); resume.push(`${g.quantite}x ${BALLS[g.ball]?.nom || g.ball}`) }
      else if (g.type === 'pierre_aleatoire') { setPierres((p) => { const copie = { ...p }; for (let i = 0; i < g.quantite; i++) { const pierre = clesPierres[Math.floor(Math.random() * clesPierres.length)]; copie[pierre] = (copie[pierre] || 0) + 1 } return copie }); resume.push(`${g.quantite} pierre(s)`) }
      else if (g.type === 'bonus') { resume.push(`+${Math.round(g.valeur * 100)}% ${g.stat === 'xp' ? 'XP' : 'Argent'}`) }
    }
    setRecompensesReclamees((liste) => [...liste, palier.id]); ajouterAuJournal(`Recompense : ${palier.nom} (${resume.join(', ')})`, 'victoire')
  }

  function choisirPassif(uidPokemon, clePassif, mode = 'principal') {
    const champ = champPassifDuMode(mode)
    setCaptures((liste) => liste.map((p) => { if (p.uid !== uidPokemon) return p; const maj = { ...p, [champ]: clePassif }; if (champ === 'passifChoisi') return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }; return maj }))
  }
  function choisirCaseJoker(uidPokemon, caseRole) {
    const nouvelleCollection = capturesRef.current.map((p) => p.uid === uidPokemon ? { ...p, jokerCase: caseRole } : p)
    capturesRef.current = nouvelleCollection; setCaptures(nouvelleCollection)
    if (equipeIdsRef.current.includes(uidPokemon)) { const triee = trierIdsParRole(equipeIdsRef.current, nouvelleCollection); equipeIdsRef.current = triee; setEquipeIds(triee) }
  }
  function appliquerParchemin(uidPokemon, cleParchemin) {
    if (!parchemins[cleParchemin] || parchemins[cleParchemin] <= 0) return
    const info = PARCHEMINS[cleParchemin]; if (!info) return; const nouveauRole = info.role
    const poke = capturesRef.current.find((p) => p.uid === uidPokemon); if (!poke) return
    if (poke.roleForce === nouveauRole) { ajouterAuJournal(`${poke.nom} a deja le role ${ROLES[nouveauRole]?.nom || nouveauRole}.`, 'info'); return }
    setParchemins((pp) => ({ ...pp, [cleParchemin]: (pp[cleParchemin] || 0) - 1 }))
    const nouvelleCollection = capturesRef.current.map((p) => {
      if (p.uid !== uidPokemon) return p
      const maj = { ...p, roleForce: nouveauRole, role: nouveauRole, passifChoisi: passifParDefautDuRole(nouveauRole) }
      if (nouveauRole === 'joker' && !maj.jokerCase) maj.jokerCase = 'dps'
      return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
    })
    capturesRef.current = nouvelleCollection; setCaptures(nouvelleCollection)
    if (equipeIdsRef.current.includes(uidPokemon)) { const triee = trierIdsParRole(equipeIdsRef.current, nouvelleCollection); equipeIdsRef.current = triee; setEquipeIds(triee) }
    ajouterAuJournal(`${info.emoji} ${poke.nom} devient ${ROLES[nouveauRole]?.nom || nouveauRole} !`, 'victoire')
  }
  function equiperObjet(uidPokemon, idObjet) {
    const poke = captures.find((p) => p.uid === uidPokemon); if (!poke) return
    const ancienObjet = poke.objetEquipe || null; if (idObjet === ancienObjet) return
    if (idObjet && (objets[idObjet] || 0) <= 0) { ajouterAuJournal(`Tu n'as pas de ${OBJETS[idObjet]?.nom || 'cet objet'} en stock.`, 'info'); return }
    if (idObjet) { const dejaEquipes = captures.filter((p) => p.uid !== uidPokemon && p.objetEquipe === idObjet).length; if (dejaEquipes >= 2) { ajouterAuJournal(`Limite : ${OBJETS[idObjet]?.nom} max 2 Pokemon.`, 'info'); return } }
    setObjets((stock) => { const nouveau = { ...stock }; if (idObjet) nouveau[idObjet] = (nouveau[idObjet] || 0) - 1; if (ancienObjet) nouveau[ancienObjet] = (nouveau[ancienObjet] || 0) + 1; return nouveau })
    setCaptures((liste) => liste.map((p) => { if (p.uid !== uidPokemon) return p; const maj = { ...p, objetEquipe: idObjet }; return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) } }))
    if (idObjet) ajouterAuJournal(`${OBJETS[idObjet].emoji} ${poke.nom} equipe ${OBJETS[idObjet].nom} !`, 'info')
    else if (ancienObjet) ajouterAuJournal(`${poke.nom} retire son objet.`, 'info')
  }

  function composerAutoEquipe() {
    const ROLES4 = ['tank', 'eclaireur', 'soutien', 'dps']; const MIN = 1, MAX = 2, MAX_SPE = 1, TAILLE = 6
    // Score de PUISSANCE REELLE : base sur les stats finales du Pokemon.
    // L'attaque compte double (c'est ce qui tue vite), + bonus defense/vitesse.
    // On recalcule les stats finales pour etre sur d'avoir la vraie valeur a jour.
    const puissance = (p) => {
      const s = { ...p, ...statsFinales(p, BONUS_STAT_NIVEAU) }
      const pv = s.pvMax || 1
      const atk = s.attaque || 1
      const def = s.defense || 0
      const vit = s.vitesse || 0
      return pv + atk * 2 + def + vit * 0.5
    }
    const tries = [...captures].sort((a, b) => puissance(b) - puissance(a))
    const choisis = []; const famillesPrises = new Set(); const compteRole = { tank: 0, eclaireur: 0, soutien: 0, dps: 0 }; let nbSpe = 0
    const peutPrendre = (poke, role) => { const fam = poke.familleId ?? poke.id; if (famillesPrises.has(fam)) return false; if (compteRole[role] === undefined || compteRole[role] >= MAX) return false; if (estSpecial(poke) && nbSpe >= MAX_SPE) return false; return true }
    const prendre = (poke, role) => { famillesPrises.add(poke.familleId ?? poke.id); if (estSpecial(poke)) nbSpe += 1; compteRole[role] += 1; choisis.push(poke.uid) }
    for (const role of ROLES4) { const best = tries.find((p) => (p.role || determinerRole(p)) === role && !choisis.includes(p.uid) && peutPrendre(p, role)); if (best) prendre(best, role) }
    for (const poke of tries) { if (choisis.length >= TAILLE) break; if (choisis.includes(poke.uid)) continue; const role = poke.role || determinerRole(poke); if (peutPrendre(poke, role)) prendre(poke, role) }
    const manquants = ROLES4.filter((r) => compteRole[r] < MIN); const complet = manquants.length === 0 && choisis.length === TAILLE
    return { choisis, complet, manquants }
  }
  function autoEquipe() {
    const { choisis, complet, manquants } = composerAutoEquipe()
    if (!complet) { if (manquants.length > 0) alert(`Impossible : il te manque un Pokemon de role ${manquants.map((r) => ROLES[r].nom).join(', ')}.`); else alert(`Impossible : il te faut plus de variete de roles.`); return }
    if (!confirm(`Composer automatiquement une equipe valide ?`)) return
    const triee = trierIdsParRole(choisis, captures); setEquipeIds(triee); equipeIdsRef.current = triee; ajouterAuJournal(`Equipe equilibree composee.`, 'info')
  }

  function faireePrestige() {
    const nbVus = pokedexVus.length; const nbZones = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const gain = medaillesGagnables(nbVus, nbZones)
    if (gain <= 0) { ajouterAuJournal(`Pas encore assez de progres pour prestiger.`, 'info'); return }
    // Conditions de prestige (obligatoires à partir du 2e).
    const etatConditions = {
      dresseursVaincus: Object.keys(dresseursVaincus).length,
      zoneMax: nbZones,
      raidsReussis: raidsReussis,
      pokedexVus: nbVus,
      niveauTour: meilleurNiveauTour,
    }
    const conds = conditionsPrestige(nbPrestiges, etatConditions)
    const nonRemplies = conds.filter((c) => !c.remplie)
    if (nonRemplies.length > 0) {
      const liste = nonRemplies.map((c) => `${c.emoji} ${c.nom} : ${c.valeurActuelle}/${c.seuil}`).join('\n')
      alert(`Conditions de prestige non remplies :\n\n${liste}\n\nReviens quand tu les auras toutes validees !`)
      return
    }
    if (!confirm(`PRESTIGE ?\n\nTu gagnes ${gain} medailles.\nTu GARDES : Pokedex, shinies, medailles, recompenses, elevage.\nTu PERDS : niveaux, zones, argent.\n\nContinuer ?`)) return
    setCaptures((liste) => liste.map((p) => { const remis = { ...p, niveau: 1, xp: 0 }; return { ...remis, ...statsFinales(remis, BONUS_STAT_NIVEAU) } }))
    setRouteActive('tutoriel'); routeActiveRef.current = 'tutoriel'; setVictoiresParRoute({}); victoiresParRouteRef.current = {}
    setBossVaincus({}); bossVaincusRef.current = {}; setPokeDollars(0); setMedailles((m) => m + gain)
    setNbPrestiges((n) => n + 1)
    ajouterAuJournal(`PRESTIGE ! +${gain} medailles.`, 'victoire'); setVueOuverte(null)
  }
  function investirMedaille(categorie) {
    const niveauActuel = investisPrestige[categorie] || 0
    const cout = coutAmeliorationPrestige(niveauActuel)
    if (medailles < cout) { ajouterAuJournal(`Il te faut ${cout} medailles pour ce niveau.`, 'info'); return }
    setMedailles((m) => m - cout)
    setInvestisPrestige((inv) => ({ ...inv, [categorie]: (inv[categorie] || 0) + 1 }))
  }

  // ===== TOUR INFINIE =====
  async function lancerTour() {
    const route = routeParId(routeActiveRef.current)
    setNiveauTourActuel(1); setCombatTourActif(true)
    try {
      const ennemis = await chargerEquipeTour({ ...route, niveau: niveauPokemonTour(1), handicapEnnemi: difficulteNiveau(1), pool: route.pool }, 1, typeNiveau(1))
      setEquipeEnnemieTour(ennemis.slice(0, 6))
    } catch (err) { console.warn('Erreur chargement tour', err); setCombatTourActif(false) }
  }
  async function victoireTour() {
    const niveau = niveauTourActuel
    // ADN de Fusion en battant un mini-boss (niv 5,15...) ou un boss (niv 10,20...).
    const typeNiv = typeNiveau(niveau)
    if (typeNiv === 'boss') { setAdnFusion((a) => a + 3); ajouterAuJournal(`Boss vaincu : +3 ADN de Fusion 🧬`, 'capture') }
    else if (typeNiv === 'miniboss') { setAdnFusion((a) => a + 1); ajouterAuJournal(`Mini-boss vaincu : +1 ADN de Fusion 🧬`, 'info') }
    // Drop de carte EN ARRIERE-PLAN (ne bloque pas la transition vers le niveau suivant).
    dropCarteTour(niveau).then((carte) => {
      if (carte) {
        setCollectionCartesTCG((c) => [...c, carte]); setCarteDrop(carte)
        if (carteDropTimer.current) clearTimeout(carteDropTimer.current)
        carteDropTimer.current = setTimeout(() => setCarteDrop(null), 3500)
        const mentionFin = carte.finition === 'prismatique' ? ' [PRISMATIQUE]' : carte.finition === 'brillante' ? ' [Brillante]' : ''
        const mentionCote = (carte.cote || 0) >= 100 ? ' *** GRAAL ***' : (carte.cote || 0) >= 20 ? ' (carte chere !)' : ''
        const estRare = carte.finition !== 'normale' || (carte.cote || 0) >= 20
        ajouterAuJournal(`Carte obtenue : ${carte.nom} (${carte.rarete})${mentionFin}${mentionCote} !`, estRare ? 'capture' : 'info')
      } else {
        ajouterAuJournal(`Carte non recuperee (reseau). On continue !`, 'info')
      }
    }).catch((err) => { console.warn('Drop carte echoue', err) })
    // Niveau suivant (immediat, sans attendre la carte).
    const prochainNiveau = niveau + 1; setNiveauTourActuel(prochainNiveau)
    if (prochainNiveau - 1 > meilleurNiveauTour) setMeilleurNiveauTour(prochainNiveau - 1)
    try {
      const route = routeParId(routeActiveRef.current)
      const ennemis = await chargerEquipeTour({ ...route, niveau: niveauPokemonTour(prochainNiveau), handicapEnnemi: difficulteNiveau(prochainNiveau), pool: route.pool }, prochainNiveau, typeNiveau(prochainNiveau))
      setEquipeEnnemieTour(ennemis.slice(0, 6))
    } catch (err) { console.warn('Erreur niveau suivant', err); setCombatTourActif(false) }
  }
  function defaiteTour() {
    const niveau = niveauTourActuel
    if (niveau - 1 > meilleurNiveauTour) setMeilleurNiveauTour(niveau - 1)
    ajouterAuJournal(`Tour : run terminee au niveau ${niveau}.`, 'echec')
    setCombatTourActif(false); setNiveauTourActuel(1); setEquipeEnnemieTour([])
  }

  function changerGeneDominant(uid) {
    const poke = capturesRef.current.find((p) => p.uid === uid)
    if (!poke || !poke.estFusion) return
    const gene = poke.geneDominant === 'corps' ? 'tete' : 'corps'
    const maj = appliquerGeneDominant(poke, gene)
    const nouvelleCollection = capturesRef.current.map((p) => (p.uid === uid ? maj : p))
    capturesRef.current = nouvelleCollection; setCaptures(nouvelleCollection)
    if (equipeIdsRef.current.includes(uid)) { const triee = trierIdsParRole(equipeIdsRef.current, nouvelleCollection); equipeIdsRef.current = triee; setEquipeIds(triee) }
    ajouterAuJournal(`Gene ${gene === 'tete' ? 'TETE' : 'CORPS'} dominant pour ${poke.nom} !`, 'victoire')
  }

  // Fusionne deux Pokemon : consomme les deux, ajoute la fusion, deduit l'ADN.
  function fusionner(pokeA, pokeB, fusion, cout) {
    if (!pokeA || !pokeB || !fusion) return
    if (adnFusion < cout) { ajouterAuJournal(`Pas assez d'ADN de Fusion.`, 'echec'); return }
    // Retire les deux parents de la collection et de l'equipe.
    const uidsConso = new Set([pokeA.uid, pokeB.uid])
    setCaptures((liste) => {
      const sansParents = liste.filter((p) => p && !uidsConso.has(p.uid))
      const maj = [...sansParents, fusion]
      capturesRef.current = maj
      return maj
    })
    // Retire les parents de l'equipe s'ils y etaient.
    setEquipeIds((ids) => {
      const maj = ids.filter((uid) => !uidsConso.has(uid))
      equipeIdsRef.current = maj
      return maj
    })
    setAdnFusion((a) => a - cout)
    ajouterAuJournal(`Fusion reussie : ${fusion.nom} est ne ! (-${cout} ADN 🧬)`, 'capture')
  }

  async function reinitialiser() {
    if (confirm('Effacer la sauvegarde de ce slot et revenir au menu ?')) {
      const slot = slotActifRef.current
      if (slot) {
        try { localStorage.removeItem(cleSlot(slot)) } catch {}
        try { await supprimerSlotCloud(slot) } catch {}
      }
      window.location.reload()
    }
  }

  // --- AUTH : porte d'entree. Connexion obligatoire avant tout. ---
  if (!sessionVerifiee) {
    // On attend de savoir si une session existe deja (evite un flash de l'ecran connexion).
    return (
      <div className="ecran-chargement">
        <div className="chargement-contenu">
          <div className="pokeball-spinner" aria-label="Chargement"><div className="pokeball-spinner-haut"></div><div className="pokeball-spinner-bas"></div><div className="pokeball-spinner-centre"></div></div>
          <p className="chargement-texte">Connexion...</p>
        </div>
      </div>
    )
  }
  if (!session) {
    return <EcranConnexion onConnecte={(s) => setSession(s)} />
  }

  if (menuTitreOuvert) {
    return <MenuTitre slots={resumesSlots} onJouer={jouerSlot} onNouvellePartie={nouvellePartieSlot} onSupprimer={supprimerSlot} />
  }

  if (chargement) {
    return (
      <div className="ecran-chargement">
        <div className="chargement-contenu">
          <img src="/logo-titre.png" alt="Pokedle" className="chargement-logo" onError={(e) => { e.currentTarget.style.display = 'none'; const t = e.currentTarget.nextElementSibling; if (t) t.style.display = 'block' }} />
          <h1 className="chargement-titre" style={{ display: 'none' }}>Pokedle</h1>
          <div className="pokeball-spinner" aria-label="Chargement"><div className="pokeball-spinner-haut"></div><div className="pokeball-spinner-bas"></div><div className="pokeball-spinner-centre"></div></div>
          <p className="chargement-texte">Chargement...</p>
        </div>
      </div>
    )
  }

  if (choixPseudoSlotOuvert) return <ChoixPseudo pourSlot valeurInitiale={pseudoSlotEnCours} onValide={validerPseudoSlot} />
  if (choixStarterRequis) return <ChoixStarter onChoisir={choisirStarters} />

  const numZone = ROUTES.findIndex((r) => r.id === routeActive) + 1
  const victoiresZone = victoiresParRoute[routeActive] || 0
  const bossOk = bossVaincus[routeActive] === true
  const seuilBoss = bossOk ? COMBATS_REFARM_BOSS : Math.max(10, COMBATS_AVANT_BOSS - niveauAmelioration(ameliorations, 'strategie'))
  const combatActuel = Math.min(victoiresZone + 1, seuilBoss)
  const progression = Math.min(100, (victoiresZone / seuilBoss) * 100)
  const pctPokedex = Math.round((pokedexVus.length / 1025) * 100)
  const zonesDebloquees = ROUTES.filter((r) => routeDebloquee(r, bossVaincus))
  const indexZoneActive = zonesDebloquees.findIndex((r) => r.id === routeActive)

  function changerZoneRapide(delta) {
    const nouvelIndex = indexZoneActive + delta
    if (nouvelIndex < 0 || nouvelIndex >= zonesDebloquees.length) return
    const nouvelleZone = zonesDebloquees[nouvelIndex]
    setRouteActive(nouvelleZone.id); routeActiveRef.current = nouvelleZone.id; ajouterAuJournal(`Direction ${nouvelleZone.nom} !`, 'info')
  }

  const nbRecompensesDispo = recompensesDisponibles(new Set(pokedexVus), recompensesReclamees).length
  const nbZonesPrestige = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
  const gainPrestige = medaillesGagnables(pokedexVus.length, nbZonesPrestige)
  const multisPrestige = multiplicateursPrestige(investisPrestige)
  // Mur de prestige : l'équipe est-elle bloquée au plafond de niveau ?
  const capActuel = plafondNiveau(investisPrestige)
  const equipeAuPlafond = equipeJoueur.length > 0 && equipeJoueur.every((p) => (p.niveau || 1) >= capActuel)

  // Rendu des badges de statut actifs au-dessus d'un combattant.
  function rendreBadgesStatut(poke) {
    const actifs = statutsActifs(poke)
    if (!actifs || actifs.length === 0) return null
    return (
      <div className="statuts-badges">
        {actifs.map((cle) => {
          const def = STATUTS[cle]
          if (!def) return null
          return <span key={cle} className={`statut-badge statut-${def.type}`} title={`${def.nom} : ${def.description}`} style={{ '--c-statut': def.couleur }}>{def.emoji}</span>
        })}
      </div>
    )
  }

  // Rendu d'un chiffre flottant (dégâts, soin, crit, statut, application de statut).
  function rendreChiffre(c) {
    let texte, classe = c.type
    if (c.type === 'applique-statut') {
      // Apparition d'un statut sur la cible : on montre juste l'icône.
      const emojiStatut = { brulure: '🔥', poison: '☠️', gel: '❄️', paralysie: '⚡', rage: '💢', garde: '🛡️', hate: '🌀' }
      texte = emojiStatut[c.statut] || '✦'
    } else if (c.type === 'statut') {
      texte = `${c.emoji || ''} ${c.montant}`.trim()
    } else if (c.type === 'crit') {
      texte = `${c.montant} !`
    } else if (c.type === 'soin') {
      texte = `+${c.montant}`
    } else {
      texte = c.montant
    }
    return (<span key={c.id} className={`chiffre-flottant ${classe}`} style={{ left: `calc(50% + ${c.dx}px)` }}>{texte}</span>)
  }

  const renduTutoriel = tutoMode ? (
    <Tutoriel mode={tutoMode} onLancerVisite={() => setTutoMode('visite')} onOuvrirGuide={() => setTutoMode('guide')} onTerminerVisite={() => { setTutoMode(null); setTutoVu(true) }} onFermer={() => { setTutoMode(null); setTutoVu(true) }} />
  ) : null

  if (modeJeu === 'pvp') {
    const equipeDefense = equipeDefenseIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const equipeAttaque = equipeAttaqueIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const defenseValide = equipeComplete(equipeDefense); const attaqueValide = equipeComplete(equipeAttaque)
    function basculerDefense(uid) {
      setEquipeDefenseIds((ids) => { if (ids.includes(uid)) return ids.filter((x) => x !== uid); if (ids.length >= 6) return ids; const poke = captures.find((p) => p.uid === uid); if (estSpecial(poke) && compterSpeciaux(ids, captures) >= 1) { alert('Un seul Pokemon special par equipe.'); return ids } return trierIdsParRole([...ids, uid], captures) })
    }
    function basculerAttaque(uid) {
      setEquipeAttaqueIds((ids) => { if (ids.includes(uid)) return ids.filter((x) => x !== uid); if (ids.length >= 6) return ids; const poke = captures.find((p) => p.uid === uid); if (estSpecial(poke) && compterSpeciaux(ids, captures) >= 1) { alert('Un seul Pokemon special par equipe.'); return ids } return trierIdsParRole([...ids, uid], captures) })
    }
    async function rafraichirPvp() {
      setPvpChargementListe(true)
      try { const maDef = await chargerMaDefense(); if (maDef) { setPvpPoints(maDef.points_pvp); setPvpRang(maDef.rang); setPvpDefensePubliee(maDef.equipe && maDef.equipe.length > 0) } const { lignes } = await listerDefenses(50); setPvpAdversaires(lignes) } catch (err) { console.warn('rafraichirPvp echoue', err) }
      setPvpChargementListe(false)
    }
    async function publierMaDefense() {
      if (!defenseValide) return; setPvpPublicationEnCours(true)
      const r = await publierDefense(preparerEquipe(equipeDefense, 'pvp')); setPvpPublicationEnCours(false)
      if (r.ok) { setPvpDefensePubliee(true); setPvpMessage('Defense publiee !'); setTimeout(() => setPvpMessage(''), 3000) } else setPvpMessage('Erreur publication : ' + (r.raison || 'inconnue'))
    }
    function attaquerAdversaire(adversaire) {
      if (!attaqueValide) return
      const equipeAdverse = reconstruireEquipeSnapshot(adversaire.equipe)
      if (!equipeAdverse || equipeAdverse.length === 0) { setPvpMessage('Cet adversaire n\'a pas de defense valide.'); return }
      const equipeJoueurCapee = capperEquipePvp(preparerEquipe(equipeAttaque, 'pvp'))
      setPvpCombat({ adversaire, equipeJoueur: equipeJoueurCapee, equipeAdverse })
    }
    async function terminerCombatPvp(resultat) {
      const combat = pvpCombat; setPvpCombat(null); if (!combat) return
      const gagne = resultat === 'victoire'; const r = await appliquerResultatPvp(combat.adversaire, gagne)
      if (r.ok) { setPvpPoints(r.mesNouveauxPoints); setPvpRang(r.monRang); const signe = r.deltaMoi >= 0 ? '+' : ''; setPvpMessage((gagne ? 'Victoire ! ' : 'Defaite. ') + `${signe}${r.deltaMoi} pts (${r.mesNouveauxPoints}, ${r.monRang}).`); const { lignes } = await listerDefenses(50); setPvpAdversaires(lignes) } else setPvpMessage('Erreur enregistrement.')
    }
    if (pvpCombat) {
      return (<><CombatPvp pseudoAdversaire={pvpCombat.adversaire.pseudo} equipeJoueur={pvpCombat.equipeJoueur} equipeAdverse={pvpCombat.equipeAdverse} vitesse={vitesse} onTermine={terminerCombatPvp} onQuitter={() => setPvpCombat(null)} />{renduTutoriel}</>)
    }
    return (
      <><TutoFenetre id="pvp" />
        <PanneauPvp captures={captures} equipeDefense={equipeDefense} equipeDefenseIds={equipeDefenseIds} onBasculerDefense={basculerDefense} defenseValide={defenseValide} onPublierDefense={publierMaDefense} defensePubliee={pvpDefensePubliee} publicationEnCours={pvpPublicationEnCours} equipeAttaque={equipeAttaque} equipeAttaqueIds={equipeAttaqueIds} onBasculerAttaque={basculerAttaque} attaqueValide={attaqueValide} adversaires={pvpAdversaires} onAttaquer={attaquerAdversaire} chargementListe={pvpChargementListe} onRafraichir={rafraichirPvp} mesPoints={pvpPoints} monRang={pvpRang} onRetour={() => setModeJeu('principal')} message={pvpMessage} />
        {renduTutoriel}</>
    )
  }

  if (modeJeu === 'raid') {
    const nbZonesRaid = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const equipeRaid = equipeRaidIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const equipeRaidValide = compositionValide(equipeRaid); const equipeRaidDiagnostic = diagnostiqueComposition(equipeRaid)
    function basculerMembreRaid(uid) {
      setEquipeRaidIds((ids) => { if (ids.includes(uid)) return ids.filter((x) => x !== uid); if (ids.length >= 6) return ids; const poke = captures.find((p) => p.uid === uid); if (estSpecial(poke) && compterSpeciaux(ids, captures) >= 1) { alert('Un seul Pokemon special par equipe.'); return ids } return trierIdsParRole([...ids, uid], captures) })
    }
    async function lancerRaid(raid) {
      if (!compositionValide(equipeRaid)) { alert('Ton equipe de raid doit respecter la compo.'); return }
      if (tempsRestantRaid(raid, raidsCooldowns) > 0) { alert('Ce raid est en recuperation.'); return }
      setChargementRaid(true); setRaidActif(raid)
      try { const vagues = await chargerEquipeRaid(raid); setVaguesRaid(vagues) } catch (err) { console.warn('Echec chargement raid', err); setRaidActif(null) }
      setChargementRaid(false)
    }
    async function terminerRaid(resultat) {
      if (resultat === 'victoire' && raidActif) {
        const r = raidActif.recompense || {}
        if (r.argent) setPokeDollars((a) => a + r.argent)
        if (r.bonbons && Math.random() < 0.10) setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + r.bonbons }))
        ajouterAuJournal(`Raid ${raidActif.nom} reussi ! +${r.argent || 0}`, 'victoire'); tirerObjetsBoss('raid'); setRaidsReussis((n) => n + 1)
        const boss = raidActif.boss; const dejaPossede = pokedexSpeciaux.includes(boss.id)
        if (dejaPossede) {
          const nb = bonbonsIvRefarm(raidActif); const clesIv = ['iv_pv', 'iv_attaque', 'iv_vitesse', 'iv_defense']; const gagnes = {}
          for (let k = 0; k < nb; k++) { const cle = clesIv[Math.floor(Math.random() * clesIv.length)]; gagnes[cle] = (gagnes[cle] || 0) + 1 }
          setObjetsBoss((b) => { const maj = { ...b }; for (const cle of Object.keys(gagnes)) maj[cle] = (maj[cle] || 0) + gagnes[cle]; return maj })
          const detail = Object.entries(gagnes).map(([cle, n]) => `${n}x ${BONBONS_IV[cle] ? BONBONS_IV[cle].nom : cle}`).join(', ')
          ajouterAuJournal(`Refarm de ${boss.nomFr} : ${detail} !`, 'capture')
        } else {
          const ordreBall = ['master', 'hyper', 'super', 'poke']; const ballDispo = ordreBall.find((b) => (balls[b] || 0) > 0)
          if (!ballDispo) ajouterAuJournal(`${boss.nomFr} s'est enfui : aucune Ball !`, 'echec')
          else {
            setBalls((bb) => ({ ...bb, [ballDispo]: (bb[ballDispo] || 0) - 1 }))
            const taux = TAUX_CAPTURE_BOSS_RAID[ballDispo] ?? 0.02
            if (Math.random() < taux) { try { const pkmn = await chargerPokemon(boss.nom, false); const avecNiv = { ...pkmn, niveau: raidActif.niveau, xp: 0, rarete: 'special', estSpecial: true }; const finales = statsFinales(avecNiv, BONUS_STAT_NIVEAU); const nouveau = { ...avecNiv, ...finales, uid: `special-${boss.id}-${Date.now()}` }; setCaptures((c) => [...c, nouveau]); setPokedexSpeciaux((s) => s.includes(boss.id) ? s : [...s, boss.id]); ajouterAuJournal(`CAPTURE ! ${boss.nomFr} rejoint ta collection !`, 'capture') } catch (err) { console.warn('Echec chargement boss raid', boss.nom, err) } }
            else ajouterAuJournal(`${boss.nomFr} s'est libere ! Reviens apres le cooldown.`, 'echec')
          }
        }
        setRaidsCooldowns((cd) => ({ ...cd, [raidActif.id]: Date.now() + raidActif.cooldownMs }))
      } else if (resultat === 'defaite' && raidActif) ajouterAuJournal(`Raid ${raidActif.nom} echoue.`, 'echec')
      setRaidActif(null); setVaguesRaid(null)
    }
    if (raidActif && vaguesRaid && equipeRaid.length > 0) {
      return (<><CombatRaid raid={raidActif} equipeJoueur={equipeRaid} vagues={vaguesRaid} vitesse={vitesse} onTermine={terminerRaid} onQuitter={() => { setRaidActif(null); setVaguesRaid(null) }} />{renduTutoriel}</>)
    }
    if (chargementRaid) {
      return (<div className="app app-layout"><header className="topbar"><div className="topbar-titre">Raid</div></header><div className="arene-ecran"><p className="arene-intro">Preparation du raid...</p></div></div>)
    }
    return (<><TutoFenetre id="raids" /><PanneauRaids raids={RAIDS} nbZones={nbZonesRaid} cooldowns={raidsCooldowns} equipeRaid={equipeRaid} equipeRaidIds={equipeRaidIds} captures={captures} onBasculerMembre={basculerMembreRaid} onLancer={lancerRaid} compoValide={equipeRaidValide} compoDiagnostic={equipeRaidDiagnostic} onRetour={() => setModeJeu('principal')} /><GuideInteractif id={guideActif} actif={!!guideActif} onTermine={() => setGuideActif(null)} />{renduTutoriel}</>)
  }

  if (modeJeu === 'arene') {
    const nbZonesArene = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const listeDresseurs = etatsDresseursAvecReset(nbZonesArene, dresseursVaincus)
    const equipeArene = equipeAreneIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const equipeAreneValide = compositionValide(equipeArene); const equipeAreneDiagnostic = diagnostiqueComposition(equipeArene)
    function basculerMembreArene(uid) {
      setEquipeAreneIds((ids) => { if (ids.includes(uid)) return ids.filter((x) => x !== uid); if (ids.length >= 6) return ids; const poke = captures.find((p) => p.uid === uid); if (estSpecial(poke) && compterSpeciaux(ids, captures) >= 1) { alert('Un seul Pokemon special par equipe.'); return ids } return trierIdsParRole([...ids, uid], captures) })
    }
    function autoEquipeArene() {
      const { choisis, complet, manquants } = composerAutoEquipe()
      if (!complet) { if (manquants.length > 0) alert(`Impossible : il te manque un Pokemon de role ${manquants.map((r) => ROLES[r].nom).join(', ')}.`); else alert(`Impossible : plus de variete de roles.`); return }
      if (!confirm(`Composer automatiquement ton equipe d'arene ?`)) return
      const triee = trierIdsParRole(choisis, captures); setEquipeAreneIds(triee)
    }
    async function lancerCombatArene(dresseur) {
      if (!compositionValide(equipeArene)) { alert('Ton equipe d\'arene doit respecter la compo.'); return }
      setChargementArene(true); setDresseurActif(dresseur)
      try { const equipe = await chargerEquipeDresseur(dresseur); setEquipeDresseur(equipe) } catch (err) { console.warn('Echec chargement dresseur', err); setDresseurActif(null) }
      setChargementArene(false)
    }
    async function terminerCombatArene(resultat) {
      if (resultat === 'victoire' && dresseurActif) {
        const r = dresseurActif.recompense
        if (r.argent) setPokeDollars((a) => a + Math.round(r.argent * multiplicateur(ameliorationsRef.current, 'champion')))
        if (r.bonbon && Math.random() < 0.10) setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + r.bonbon }))
        if (r.objet) setObjets((o) => ({ ...o, [r.objet]: (o[r.objet] || 0) + 1 }))
        tirerObjetsBoss('arene'); const creneau = creneauActuel(); const dejaVaincu = dresseursVaincus[dresseurActif.id] === creneau
        setDresseursVaincus((v) => ({ ...v, [dresseurActif.id]: creneau }))
        ajouterAuJournal(`Arene : ${dresseurActif.nom} vaincu ! ${decrireRecompenseDresseur(r)}`, 'victoire')
        const special = specialDuBoss(dresseurActif.id)
        if (special && !dejaVaincu && !pokedexSpeciaux.includes(special.id)) {
          try { const pkmn = await chargerPokemon(special.nom, false); const avecNiv = { ...pkmn, niveau: 1, xp: 0, rarete: 'special', estSpecial: true }; const finales = statsFinales(avecNiv, BONUS_STAT_NIVEAU); const nouveau = { ...avecNiv, ...finales, uid: `special-${special.id}-${Date.now()}` }; setCaptures((c) => [...c, nouveau]); setPokedexSpeciaux((s) => s.includes(special.id) ? s : [...s, special.id]); ajouterAuJournal(`POKEMON SPECIAL DEBLOQUE : ${special.nomFr} !`, 'capture') } catch (err) { console.warn('Echec chargement special', special.nom, err) }
        }
      } else if (resultat === 'defaite' && dresseurActif) {
        ajouterAuJournal(`Arene : defaite contre ${dresseurActif.nom}.`, 'echec')
        if (autoArene) { setAutoArene(false); ajouterAuJournal(`Auto dresseur arrete (defaite).`, 'info') }
        setDresseurActif(null); setEquipeDresseur(null); return
      }
      if (resultat === 'victoire' && autoArene && dresseurActif) {
        const creneau = creneauActuel(); const vaincusMaj = { ...dresseursVaincus, [dresseurActif.id]: creneau }
        const liste = etatsDresseursAvecReset(nbZonesArene, vaincusMaj); const prochainDresseur = liste.find((d) => d.etat === 'disponible') || null
        setDresseurActif(null); setEquipeDresseur(null)
        if (prochainDresseur && prochainDresseur.equipe) { ajouterAuJournal(`Auto : prochain dresseur, ${prochainDresseur.nom} !`, 'info'); setTimeout(() => lancerCombatArene(prochainDresseur), 600) }
        else { setAutoArene(false); ajouterAuJournal(`Auto dresseur arrete : plus de dresseur.`, 'info') }
        return
      }
      setDresseurActif(null); setEquipeDresseur(null)
    }
    if (dresseurActif && equipeDresseur && equipeArene.length > 0) {
      return (<><CombatArene dresseur={dresseurActif} equipeJoueur={preparerEquipe(equipeArene, 'arene')} equipeDresseur={equipeDresseur} vitesse={vitesse} onTermine={terminerCombatArene} onQuitter={() => { setDresseurActif(null); setEquipeDresseur(null) }} />{renduTutoriel}</>)
    }
    if (chargementArene) {
      return (<div className="app app-layout"><header className="topbar"><div className="topbar-titre">Mode Arene</div></header><div className="arene-ecran"><p className="arene-intro">Preparation du combat...</p></div></div>)
    }
    return (<><TutoFenetre id="arene" /><PanneauArene listeDresseurs={listeDresseurs} equipeArene={equipeArene} equipeAreneIds={equipeAreneIds} captures={captures} onBasculerMembre={basculerMembreArene} onAutoEquipe={autoEquipeArene} onCombattre={lancerCombatArene} decrireRecompense={decrireRecompenseDresseur} compoValide={equipeAreneValide} compoDiagnostic={equipeAreneDiagnostic} autoArene={autoArene} onToggleAuto={() => { if (!equipeAreneValide) { alert('Compose d\'abord une equipe d\'arene valide.'); return } setAutoArene((v) => !v) }} onRetour={() => { setAutoArene(false); setModeJeu('principal') }} /><GuideInteractif id={guideActif} actif={!!guideActif} onTermine={() => setGuideActif(null)} />{renduTutoriel}</>)
  }

  return (
    <div className="app app-layout">
      <header className="topbar-moderne">
        <div className="tbm-marque">
          <img src="https://play.pokemonshowdown.com/sprites/ani/mew.gif" alt="" className="tbm-mascotte tbm-mascotte-gauche" onError={(e) => { e.currentTarget.style.display = 'none' }} />
          <img src="/logo-titre.png" alt="Pokedle" className="tbm-logo" onError={(e) => { e.currentTarget.style.display = 'none'; const t = e.currentTarget.nextElementSibling; if (t) t.style.display = 'inline' }} />
          <span className="tbm-marque-texte" style={{ display: 'none' }}>Pokedle</span>
          <img src="https://play.pokemonshowdown.com/sprites/ani/mewtwo.gif" alt="" className="tbm-mascotte tbm-mascotte-droite" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        </div>
        <nav className="tbm-menu">
          <button className="tbm-item" onClick={() => setVueOuverte('pokedex')} title="Pokedex">{nbRecompensesDispo > 0 && <span className="tbm-pastille">{nbRecompensesDispo}</span>}<BookOpen size={17} /><span>Pokedex</span></button>
          <button className="tbm-item" data-tuto="equipe" onClick={() => setVueOuverte('equipe')} title="Mon equipe"><Users size={17} /><span>Equipe</span></button>
          <button className="tbm-item" data-tuto="routes" onClick={() => setVueOuverte('routes')} title="Routes"><MapIcon size={17} /><span>Routes</span></button>
          <button className="tbm-item" onClick={() => setVueOuverte('boutique')} title="Boutique"><ShoppingBag size={17} /><span>Shop</span></button>
          <button className="tbm-item" onClick={() => setVueOuverte('sac')} title="Sac"><Backpack size={17} /><span>Sac</span></button>
          <button className="tbm-item" data-tuto="oeufs" onClick={() => setVueOuverte('oeufs')} title="Elevage / Oeufs"><Egg size={17} /><span>Oeufs</span></button>
          <button className="tbm-item" onClick={() => setVueOuverte('ameliorations')} title="Ameliorations"><Zap size={17} /><span>Boost</span></button>
          <button className="tbm-item tbm-item-combat" onClick={() => setModeJeu('arene')} title="Mode Arene"><Swords size={17} /><span>Arene</span></button>
          <button className="tbm-item tbm-item-combat" onClick={() => setModeJeu('raid')} title="Raids (endgame)"><Flame size={17} /><span>Raids</span></button>
          <button className="tbm-item tbm-item-combat" onClick={() => setTourOuverte(true)} title="Tour Infinie - Cartes TCG"><Boxes size={17} /><span>Tour</span></button>
          <button className={`tbm-item ${nbPrestiges < 3 ? 'tbm-item-verrouille' : ''}`} onClick={() => { if (nbPrestiges < 3) { alert('Le Centre de Fusion se debloque apres 3 prestiges.'); return } setVueOuverte('fusion') }} title={nbPrestiges < 3 ? 'Centre de Fusion (debloque apres 3 prestiges)' : 'Centre de Fusion'}>{nbPrestiges < 3 && <span className="tbm-cadenas">🔒</span>}<Sparkles size={17} /><span>Fusion</span>{nbPrestiges >= 3 && adnFusion > 0 && <span className="tbm-pastille">{adnFusion}</span>}</button>
          <button className="tbm-item tbm-item-combat" data-tuto="pvp" onClick={() => setModeJeu('pvp')} title="Arene PvP en ligne"><Crosshair size={17} /><span>PvP</span></button>
          <button className="tbm-item" onClick={() => setVueOuverte('prestige')} title="Prestige"><Crown size={17} /><span>Prestige</span>{medailles > 0 && <span className="tbm-pastille">{medailles}</span>}</button>
          <div className="tbm-plus-conteneur">
            <button ref={boutonPlusRef} className={`tbm-item ${menuPlusOuvert ? 'actif' : ''}`} onClick={ouvrirMenuPlus} title="Plus"><MoreHorizontal size={17} /><span>Plus</span></button>
            {menuPlusOuvert && (
              <>
                <div className="tbm-plus-fond" onClick={() => setMenuPlusOuvert(false)}></div>
                <div className="tbm-plus-menu" style={{ top: `${posMenuPlus.top}px`, right: `${posMenuPlus.right}px` }}>
                  <button className="tbm-plus-item" onClick={() => { setVueOuverte('stats'); setMenuPlusOuvert(false) }}><BarChart3 size={16} /><span>Statistiques</span></button>
                  <button className="tbm-plus-item" onClick={() => { setVueOuverte('succes'); setMenuPlusOuvert(false) }}><Trophy size={16} /><span>Succes</span></button>
                  <button className="tbm-plus-item" onClick={() => { setVueOuverte('classement'); setMenuPlusOuvert(false) }}><Medal size={16} /><span>Classement</span></button>
                  <button className="tbm-plus-item" onClick={() => { setVueOuverte('sauvegarde'); setMenuPlusOuvert(false) }}><Save size={16} /><span>Sauvegarde</span></button>
                  <button className="tbm-plus-item" onClick={() => { setTutoMode('guide'); setMenuPlusOuvert(false) }}><HelpCircle size={16} /><span>Aide</span></button>
                  <button className="tbm-plus-item" onClick={() => { setMenuPlusOuvert(false); retourMenuTitre() }}><Save size={16} /><span>Menu titre</span></button>
                  <button className="tbm-plus-item" onClick={async () => { setMenuPlusOuvert(false); await deconnecter(); window.location.reload() }}><ChevronLeft size={16} /><span>Deconnexion</span></button>
                  <button className="tbm-plus-item tbm-plus-danger" onClick={() => { setMenuPlusOuvert(false); reinitialiser() }}><Trash2 size={16} /><span>Reinitialiser</span></button>
                </div>
              </>
            )}
          </div>
        </nav>
        <div className="tbm-ressources">
          <span className="tbm-stat tbm-stat-argent" title="Poke Dollars"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/nugget.png" alt="" className="tbm-stat-sprite" onError={(e) => { e.currentTarget.style.display = 'none' }} />{Number(pokeDollars).toLocaleString('fr-FR')}</span>
          <span className="tbm-stat tbm-stat-dex" title="Completion du Pokedex"><img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="" className="tbm-stat-sprite" onError={(e) => { e.currentTarget.style.display = 'none' }} />{pctPokedex}%</span>
        </div>
      </header>

      <div className="grille-jeu">
        <aside className="colonne colonne-gauche">
          <div className="panneau">
            <div className="panneau-titre"><img src="/icons/equipe.png" alt="" className="panneau-icone" /> Equipe</div>
            <div className="apercu-equipe">
              {equipeJoueur.map((poke, i) => {
                const pv = pvJoueur[i] ?? poke.pvMax; const pct = Math.max(0, Math.min(100, (pv / poke.pvMax) * 100))
                return (<button key={poke.uid} className="mini-poke" onClick={() => setVueOuverte('equipe')} title={`${poke.nom} N.${poke.niveau}`}><img src={poke.sprite} alt={poke.nom} className="mini-poke-sprite" /><span className="mini-poke-nom">{poke.nom}</span><span className="mini-poke-niv">N.{poke.niveau}</span><span className="mini-barre"><span className="mini-barre-fill" style={{ width: `${pct}%` }}></span></span></button>)
              })}
            </div>
            <button className="bouton-gerer" onClick={() => setVueOuverte('equipe')}>Gerer l'equipe</button>
          </div>
          <div className="panneau">
            <div className="panneau-titre"><img src="/icons/routes.png" alt="" className="panneau-icone" /> Zone rapide</div>
            <div className="zone-rapide-nom">{routeParId(routeActive).emoji} {routeParId(routeActive).nom}</div>
            <div className="zone-rapide-nav">
              <button className="zone-rapide-btn" onClick={() => changerZoneRapide(-1)} disabled={indexZoneActive <= 0}>Prec.</button>
              <span className="zone-rapide-compteur">{indexZoneActive + 1}/{zonesDebloquees.length}</span>
              <button className="zone-rapide-btn" onClick={() => changerZoneRapide(1)} disabled={indexZoneActive >= zonesDebloquees.length - 1}>Suiv.</button>
            </div>
          </div>
          <div className="panneau" data-tuto="achat">
            <div className="panneau-titre"><img src="/icons/boutique.png" alt="" className="panneau-icone" /> Achat rapide</div>
            {['poke', 'super', 'hyper', 'master'].map((type) => (
              <div key={type} className="achat-rapide-ligne">
                <div className="achat-rapide-info"><img src={ICONES_BALLS[type]} alt="" className="achat-rapide-ball-img" /><span className="achat-rapide-prix">{formaterNombre(BALLS[type].prix)}<span className="achat-rapide-devise">$</span></span></div>
                <div className="achat-rapide-boutons">{[1, 10, 100].map((lot) => (<button key={lot} className="achat-rapide-btn" onClick={() => acheterBall(type, lot)} disabled={pokeDollars < BALLS[type].prix * lot}>+{lot}</button>))}</div>
              </div>
            ))}
          </div>
          <div className="panneau">
            <div className="panneau-titre"><img src="/icons/pokedex.png" alt="" className="panneau-icone" /> Pokedex</div>
            <div className="stat-mini-ligne"><span>Vus</span><span className="stat-mini-val">{pokedexVus.length}/1025</span></div>
            <div className="mini-barre" style={{ height: '8px', margin: '6px 0' }}><span className="mini-barre-fill" style={{ width: `${pctPokedex}%`, background: 'var(--jaune)' }}></span></div>
            <div className="stat-mini-ligne"><span>Shinies</span><span className="stat-mini-val">{pokedexShiny.length}</span></div>
          </div>
        </aside>

        <main className="colonne colonne-centre" data-tuto="arene">
          <div className="bandeau-zone">
            <span className="bandeau-zone-nom">{routeParId(routeActive).nom}</span>
            <span className="bandeau-zone-num">
              <span className="bandeau-zone-numtxt">Zone {numZone}-{combatActuel}</span>
              {combatBoss ? (<span className="bandeau-badge bandeau-badge-boss">BOSS</span>) : (
                <span className="boss-jauge" title={bossOk ? `Le boss revient tous les ${seuilBoss} combats` : `Victoires avant le boss : ${Math.min(victoiresZone, seuilBoss)}/${seuilBoss}`}>
                  <span className="boss-jauge-piste"><span className="boss-jauge-fill" style={{ width: `${progression}%` }}><span className="boss-jauge-brillance"></span></span></span>
                  <span className="boss-jauge-txt">{Math.min(victoiresZone, seuilBoss)}/{seuilBoss} <span className="boss-jauge-couronne">👑</span></span>
                </span>
              )}
            </span>
          </div>
          {combatBoss && (<div className="bandeau-boss-timer"><p className="bandeau-boss">COMBAT DE BOSS</p><TimerAnneau tempsRestant={tempsBossZone} tempsTotal={45} taille={58} /></div>)}
          {!compoValide && (<div className="alerte-compo"><p className="alerte-compo-titre">Composition d'equipe invalide</p><p className="alerte-compo-sous">Le combat est en pause. Compo : 1 a 2 par role, les 4 roles, 1 special max.</p><ul className="alerte-compo-liste">{compoDiagnostic.map((m, i) => <li key={i}>{m}</li>)}</ul></div>)}
          {equipeAuPlafond && (<div className="alerte-plafond"><p className="alerte-plafond-titre">👑 Plafond de niveau atteint (Niv. {capActuel})</p><p className="alerte-plafond-sous">Ton equipe ne peut plus monter de niveau. Pour devenir plus fort et franchir les zones suivantes, fais un PRESTIGE et investis en Puissance pour debloquer plus de niveaux.</p><button className="alerte-plafond-btn" onClick={() => setVueOuverte('prestige')}>Ouvrir le Prestige</button></div>)}
          <div className={`arene arene-terrain ${combatBoss ? 'arene-boss' : ''}`} style={{ backgroundImage: `url(${routeParId(routeActive).decor})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <AmbianceCombat decor={routeParId(routeActive).decor} estBoss={combatBoss} />
            <div className="terrain-rangee terrain-ennemis">
              {equipeEnnemie.map((poke, i) => {
                const marqueeMaster = ciblesMasterBall.some((c) => c.cle === `${poke.id}${poke.shiny ? '-shiny' : ''}`); const ciblable = !poke.estBoss && !poke.estEvolution
                return (<div className="terrain-slot" key={`${poke.uid || 'enn'}-${i}`}><SpriteCombattant pokemon={poke} pvActuels={pvEnnemis[i]} jauge={jaugeEnnemis[i]} camp="ennemi" ultimeLance={ultimeLanceEnnemiAff[i] || false} ultimeEnnemi marqueeMaster={marqueeMaster} ciblableMaster={ciblable} onCiblerMaster={() => basculerCibleMasterBall(poke)} />{rendreBadgesStatut(poke)}<div className="chiffres-couche">{chiffresFlottants.filter((c) => c.camp === 'ennemi' && c.index === i).map((c) => rendreChiffre(c))}</div></div>)
              })}
            </div>
            <div className="terrain-vs"><img src={ICONE_COMBAT} alt="VS" className="vs-img" /></div>
            <div className="terrain-rangee terrain-joueur">
              {equipeJoueur.map((poke, i) => (<div className="terrain-slot" key={poke.uid}><SpriteCombattant pokemon={poke} pvActuels={pvJoueur[i]} jauge={jaugeJoueur[i]} camp="joueur" ultimeLance={ultimeLanceJoueur[i] || false} plafond={capActuel} />{rendreBadgesStatut(poke)}<div className="chiffres-couche">{chiffresFlottants.filter((c) => c.camp === 'joueur' && c.index === i).map((c) => rendreChiffre(c))}</div></div>))}
            </div>
          </div>
          <div className="console">
            {journal.length === 0 ? (<p className="console-vide">Le combat commence...</p>) : (journal.map((ligne) => (<p key={ligne.id} className={`console-ligne ${ligne.type}`}>{ligne.texte}</p>)))}
          </div>
        </main>

        <aside className="colonne colonne-droite" data-tuto="capture">
          <div className="panneau panneau-capture-v2">
            <div className="panneau-titre panneau-titre-capture"><span><img src="/icons/capture.png" alt="" className="panneau-icone" /> Capture</span><span className="capture-limite-badge" title="Balls max par espece et par combat">max {reglesCapture.limiteBalls === 'infini' ? 'inf' : (reglesCapture.limiteBalls ?? 5)}</span></div>
            <button className="bouton-regles-capture" onClick={() => setVueOuverte('regles')}><Settings size={14} style={{ verticalAlign: '-2px', marginRight: '5px' }} /> Regles de capture</button>
            {(() => {
              const labelBall = { auto: 'Auto', poke: 'Poke', super: 'Super', hyper: 'Hyper', master: 'Master', rien: 'X' }
              const categories = [{ cle: 'shiny', Icone: Sparkles, couleur: 'var(--m-or)', nom: 'Shiny' }, { cle: 'legendaire', Icone: Crown, couleur: 'var(--m-violet-clair)', nom: 'Legendaire' }, { cle: 'nouveau', Icone: Plus, couleur: 'var(--m-vert)', nom: 'Nouveau' }, { cle: 'doublon', Icone: Repeat, couleur: 'var(--m-texte-3)', nom: 'Doublon' }]
              const ballsResume = [{ cle: 'poke', nom: 'Poke Ball' }, { cle: 'super', nom: 'Super Ball' }, { cle: 'hyper', nom: 'Hyper Ball' }, { cle: 'master', nom: 'Master Ball' }]
              const classeBall = (c) => c === 'rien' ? 'rien' : (c === 'master' ? 'master' : (c === 'hyper' ? 'hyper' : 'auto'))
              return (<>
                <div className="capture-regles-grille">{categories.map((c) => { const Ic = c.Icone; return (<div key={c.cle} className="capture-regle-case" title={c.nom}><span className="capture-regle-emoji" style={{ color: c.couleur }}><Ic size={14} /></span><span className={`capture-regle-ball ball-${classeBall(reglesCapture[c.cle] || 'auto')}`}>{labelBall[reglesCapture[c.cle]] || 'Auto'}</span></div>) })}</div>
                {ciblesMasterBall.length > 0 && (<div className="capture-cibles"><img src={ICONES_BALLS.master} alt="Master Ball" className="capture-cibles-icone" /><div className="capture-cibles-liste">{ciblesMasterBall.map((c) => (<button key={c.cle} className={`capture-cible-pastille ${c.shiny ? 'shiny' : ''}`} title={`${c.nom}${c.shiny ? ' shiny' : ''} - clic pour retirer`} onClick={() => { const maj = ciblesMasterBall.filter((x) => x.cle !== c.cle); ciblesMasterBallRef.current = maj; setCiblesMasterBall(maj) }}>{c.sprite ? <img src={c.sprite} alt={c.nom} className="capture-cible-sprite" /> : <span className="capture-cible-nom">{c.nom}</span>}<span className="capture-cible-x">x</span></button>))}</div></div>)}
                <div className="capture-balls-grille">{ballsResume.map((b) => { const n = balls[b.cle] ?? 0; return (<div key={b.cle} className={`capture-ball-case ${n === 0 ? 'vide' : ''}`} title={b.nom}>{ICONES_BALLS[b.cle] && <img src={ICONES_BALLS[b.cle]} alt="" className="capture-ball-img" />}<span className="capture-ball-nb">{n}</span></div>) })}</div>
              </>)
            })()}
          </div>
          <div className="panneau">
            <div className="panneau-titre"><img src="/icons/vitesse.png" alt="" className="panneau-icone" /> Vitesse</div>
            <div className="ctrl-rangee"><button className={`mode-btn ${vitesse === 1 ? 'actif' : ''}`} onClick={() => setVitesse(1)}>x1</button><button className={`mode-btn ${vitesse === 2 ? 'actif' : ''}`} onClick={() => setVitesse(2)}>x2</button><button className={`mode-btn ${vitesse === 4 ? 'actif' : ''}`} onClick={() => setVitesse(4)}>x4</button></div>
          </div>
          <div className="panneau">
            <div className="panneau-titre"><span className="panneau-icone-emoji">⚡</span> Ultimes</div>
            <p className="ultime-aide">Chaque Pokemon declenche automatiquement son ultime environ 7 secondes apres le debut du combat.</p>
          </div>
          <div className="panneau">
            <div className="panneau-titre"><img src="/icons/routes.png" alt="" className="panneau-icone" /> Mode auto</div>
            <button className={`bouton-auto ${autoZone ? 'actif' : ''}`} onClick={() => setAutoZone((v) => !v)} title="Passe automatiquement a la zone suivante apres chaque boss vaincu">{autoZone ? 'Auto zone : ON' : 'Auto zone : OFF'}</button>
            <p className="bouton-auto-aide">Passe a la zone suivante des qu'un boss est vaincu.</p>
          </div>
          <div className="panneau">
            <div className="panneau-titre"><img src="/icons/objets.png" alt="" className="panneau-icone" /> Ressources</div>
            <div className="res-section"><span className="res-section-titre">Poke Balls</span><div className="ressources-balls"><span className="res-item"><img src={ICONES_BALLS.poke} alt="" className="res-ball-img" /> {balls.poke}</span><span className="res-item"><img src={ICONES_BALLS.super} alt="" className="res-ball-img" /> {balls.super}</span><span className="res-item"><img src={ICONES_BALLS.hyper} alt="" className="res-ball-img" /> {balls.hyper}</span><span className="res-item"><img src={ICONES_BALLS.master} alt="" className="res-ball-img" /> {balls.master}</span></div></div>
            {(objetsBoss.rouage > 0 || objetsBoss.cristal > 0 || objetsBoss.relique > 0) && (<div className="res-section"><span className="res-section-titre">Objets de boss</span><div className="ressources-objets">{objetsBoss.rouage > 0 && (<span className="res-item" title={OBJETS_BOSS.rouage.nom}><img src={OBJETS_BOSS.rouage.sprite} alt="" className="res-ball-img" onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.rouage.emoji)) }} /> {objetsBoss.rouage}</span>)}{objetsBoss.cristal > 0 && (<span className="res-item" title={OBJETS_BOSS.cristal.nom}><img src={OBJETS_BOSS.cristal.sprite} alt="" className="res-ball-img" onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.cristal.emoji)) }} /> {objetsBoss.cristal}</span>)}{objetsBoss.relique > 0 && (<span className="res-item" title={OBJETS_BOSS.relique.nom}><img src={OBJETS_BOSS.relique.sprite} alt="" className="res-ball-img" onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(OBJETS_BOSS.relique.emoji)) }} /> {objetsBoss.relique}</span>)}</div></div>)}
            {Object.entries(pierres).filter(([, n]) => n > 0).length > 0 && (<div className="res-section"><span className="res-section-titre">Pierres</span><div className="ressources-objets">{Object.entries(pierres).filter(([, n]) => n > 0).map(([cle, n]) => (<span key={cle} className="res-item" title={PIERRES[cle]?.nom || cle}>{ICONES_PIERRES[cle] ? <img src={ICONES_PIERRES[cle]} alt="" className="res-ball-img" /> : (PIERRES[cle]?.emoji || '💎')} {n}</span>))}</div></div>)}
            {Object.entries(bonbons).filter(([, n]) => n > 0).length > 0 && (<div className="res-section"><span className="res-section-titre">Bonbons</span><div className="ressources-objets">{Object.entries(bonbons).filter(([, n]) => n > 0).map(([cle, n]) => (<span key={cle} className="res-item" title={BONBONS[cle]?.nom || cle}>{ICONES_BONBONS[cle] ? <img src={ICONES_BONBONS[cle]} alt="" className="res-ball-img" /> : (BONBONS[cle]?.emoji || '🍬')} {n}</span>))}</div></div>)}
            <div className="ressources-compteurs"><span><img src={ICONE_COMBAT} alt="" className="icone-inline" /> {vaincus}</span><span>🎯 {captures.length}</span></div>
          </div>
        </aside>
      </div>

      {captureRecente && (<div className="encart-capture" key={captureRecente.cle}><div className={`encart-capture-boite ${captureRecente.shiny ? 'shiny' : ''}`}><img src={captureRecente.sprite} alt={captureRecente.nom} className="encart-capture-sprite" /><div className="encart-capture-texte"><span className="encart-capture-titre">{captureRecente.shiny ? 'SHINY capture !' : 'Capture !'}</span><span className="encart-capture-nom">{captureRecente.nom}</span></div></div></div>)}
      {dropRecent && (<div className="encart-drop" key={dropRecent.cle}><div className={`encart-drop-boite ${dropRecent.legendaire ? 'legendaire' : ''}`}><img src={dropRecent.sprite} alt={dropRecent.nom} className="encart-drop-sprite" onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(dropRecent.emoji)) }} /><div className="encart-drop-texte"><span className="encart-drop-titre">{dropRecent.legendaire ? 'Butin legendaire !' : 'Butin de boss !'}</span><span className="encart-drop-nom">{dropRecent.nom}</span></div></div></div>)}

      {!identiteJoueur && (<ChoixPseudo onValide={(identite) => setIdentiteJoueur(identite)} />)}
      {nouveautesOuvert && (<PanneauNouveautes onFermer={fermerNouveautes} />)}
      {identiteJoueur && changerPseudoOuvert && (<ChoixPseudo onValide={(identite) => { setIdentiteJoueur(identite); setChangerPseudoOuvert(false); setTimeout(() => envoyerScore(statsClassementRef.current), 0); ajouterAuJournal(`Pseudo change : ${identite.pseudo}`, 'info') }} onAnnuler={() => setChangerPseudoOuvert(false)} />)}
      {vueOuverte === 'classement' && (<><TutoFenetre id="classement" /><Classement onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'pokedex' && (<><TutoFenetre id="pokedex" /><Pokedex captures={captures} pokedexVus={pokedexVus} pokedexShiny={pokedexShiny} pokedexSpeciaux={pokedexSpeciaux} recompensesReclamees={recompensesReclamees} onReclamer={reclamerRecompense} onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'equipe' && (<><TutoFenetre id="equipe" /><Equipe equipe={equipeJoueur} collection={captures} pierres={pierres} objets={objets} onEquiperObjet={equiperObjet} onEvoluerPierre={evoluerParPierre} onChoisirPassif={choisirPassif} onChoisirCaseJoker={choisirCaseJoker} parchemins={parchemins} onAppliquerParchemin={appliquerParchemin} onAjouterMembre={(poke) => { if (equipeIds.length >= 6) return; if (equipeIds.includes(poke.uid)) return; if (estSpecial(poke) && compterSpeciaux(equipeIds, captures) >= 1) { alert('Un seul Pokemon special par equipe.'); return } const nouveaux = trierIdsParRole([...equipeIds, poke.uid], captures); setEquipeIds(nouveaux); equipeIdsRef.current = nouveaux; ajouterAuJournal(`${poke.nom} rejoint l'equipe au prochain combat.`, 'info') }} onRetirerMembre={(index) => { const nouveaux = trierIdsParRole(equipeIds.filter((_, i) => i !== index), captures); setEquipeIds(nouveaux); equipeIdsRef.current = nouveaux; ajouterAuJournal(`Pokemon retire de l'equipe.`, 'info') }} onAutoEquipe={autoEquipe} onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'routes' && (<><TutoFenetre id="routes" /><MenuRoutes routeActive={routeActive} victoiresParRoute={victoiresParRoute} bossVaincus={bossVaincus} nomsVus={captures.map((p) => p.nom)} tableNoms={tableNoms} ciblesMasterBall={ciblesMasterBall} onCiblerMasterBall={(numero, nom) => { const cle = `${numero}`; const dejaCiblee = ciblesMasterBallRef.current.some((c) => c.cle === cle); setCiblesMasterBall((liste) => { const maj = dejaCiblee ? liste.filter((c) => c.cle !== cle) : [...liste, { cle, id: numero, nom, shiny: false, sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png` }]; ciblesMasterBallRef.current = maj; return maj }); ajouterAuJournal(!dejaCiblee ? `${nom} cible pour la Master Ball.` : `${nom} n'est plus cible.`, 'info') }} onChoisir={(id) => { setRouteActive(id); routeActiveRef.current = id; ajouterAuJournal(`Direction ${routeParId(id).nom} !`, 'info'); setVueOuverte(null) }} onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'prestige' && (<><TutoFenetre id="prestige" /><PanneauPrestige medailles={medailles} investis={investisPrestige} gainPotentiel={gainPrestige} multiplicateurs={multisPrestige} conditions={conditionsPrestige(nbPrestiges, { dresseursVaincus: Object.keys(dresseursVaincus).length, zoneMax: ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length, raidsReussis, pokedexVus: pokedexVus.length, niveauTour: meilleurNiveauTour })} nbPrestiges={nbPrestiges} onInvestir={investirMedaille} coutAmelioration={coutAmeliorationPrestige} onPrestige={faireePrestige} onFermer={() => setVueOuverte(null)} /></>)}
      {tutoPrestigeOuvert && (
        <div className="overlay" onClick={() => setTutoPrestigeOuvert(false)} style={{ zIndex: 500 }}>
          <div className="tuto-prestige" onClick={(e) => e.stopPropagation()}>
            <div className="tuto-prestige-couronne">👑</div>
            <h2 className="tuto-prestige-titre">Tu as atteint le Mur !</h2>
            <p className="tuto-prestige-txt">Tes Pokemon ont atteint leur <strong>niveau maximum</strong> ({plafondNiveau(investisPrestige)}). Ils ne peuvent plus monter de niveau, peu importe combien tu combats.</p>
            <p className="tuto-prestige-txt">Pour devenir plus fort et continuer ta progression, tu dois faire un <strong>PRESTIGE</strong> :</p>
            <ul className="tuto-prestige-liste">
              <li>🔄 Tu <strong>recommences</strong> la progression (niveaux, zones, argent remis a zero)</li>
              <li>🏅 Tu gagnes des <strong>Medailles</strong> selon ton avancee</li>
              <li>⚔️ Investies en <strong>Puissance</strong>, elles augmentent tes stats ET <strong>debloquent +12 niveaux max</strong> par point</li>
              <li>📦 Tu <strong>gardes</strong> ton Pokedex, tes shinies, ton elevage et tes medailles</li>
            </ul>
            <p className="tuto-prestige-txt tuto-prestige-final">C'est le coeur du jeu : chaque prestige te rend durablement plus fort et te permet de franchir les murs suivants !</p>
            <p className="tuto-prestige-txt" style={{ fontSize: '12px', opacity: 0.85 }}>📌 Note : a partir du 2e prestige, des <strong>conditions</strong> s'ajoutent (battre des dresseurs d'arene, atteindre une zone, reussir des raids...). Plus tu prestiges, plus il y a de defis a relever avant de pouvoir recommencer.</p>
            <div className="tuto-prestige-boutons">
              <button className="tuto-prestige-btn-principal" onClick={() => { setTutoPrestigeOuvert(false); setVueOuverte('prestige') }}>Ouvrir le Prestige</button>
              <button className="tuto-prestige-btn-secondaire" onClick={() => setTutoPrestigeOuvert(false)}>Plus tard</button>
            </div>
          </div>
        </div>
      )}
      {vueOuverte === 'regles' && (<ReglesCapture regles={reglesCapture} balls={balls} icones={ICONES_BALLS} onChanger={(categorie, choix) => { setReglesCapture((r) => { const nouvelles = { ...r, [categorie]: choix }; reglesCaptureRef.current = nouvelles; return nouvelles }) }} onChangerLimite={(val) => { setReglesCapture((r) => { const nouvelles = { ...r, limiteBalls: val }; reglesCaptureRef.current = nouvelles; return nouvelles }) }} onFermer={() => setVueOuverte(null)} />)}
      {vueOuverte === 'stats' && (<><TutoFenetre id="stats" /><PanneauStats vaincus={vaincus} captures={captures} pokedexVus={pokedexVus} pokedexShiny={pokedexShiny} pokeDollars={pokeDollars} nbBoss={Object.values(bossVaincus).filter(Boolean).length} nbDresseurs={Object.keys(dresseursVaincus).length} nbSpeciaux={pokedexSpeciaux.length} nbZones={ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length} totalZones={ROUTES.length} totalDresseurs={DRESSEURS.length} totalSpeciaux={SPECIAUX.length} pseudoActuel={identiteJoueur?.pseudo || ''} onChangerPseudo={() => setChangerPseudoOuvert(true)} onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'boutique' && (<><TutoFenetre id="boutique" /><Boutique pokeDollars={pokeDollars} balls={balls} pierres={pierres} bonbons={bonbons} objets={objets} parchemins={parchemins} achatsItems={achatsItems} onAcheterBall={acheterBall} onAcheterPierre={acheterPierre} onAcheterBonbon={acheterBonbon} onAcheterObjet={acheterObjet} onAcheterParchemin={acheterParchemin} onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'sac' && (<><TutoFenetre id="sac" /><Sac balls={balls} pierres={pierres} bonbons={bonbons} objetsBoss={objetsBoss} collection={captures} onEvoluerPierre={evoluerParPierre} onUtiliserBonbon={utiliserBonbon} onUtiliserBonbonIV={utiliserBonbonIV} onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'succes' && (<><TutoFenetre id="succes" /><PanneauSucces succesDebloques={succesDebloques} etatSucces={{ nbCaptures: captures.length, nbShiny: pokedexShiny.length, nbVus: pokedexVus.length, totalDex: 1025, nbVaincus: vaincus, nbBoss: Object.values(bossVaincus).filter(Boolean).length, nbDresseurs: Object.keys(dresseursVaincus).length, nbZones: ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length, nbSpeciaux: pokedexSpeciaux.length }} onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'ameliorations' && (<><TutoFenetre id="boost" /><PanneauAmeliorations ameliorations={ameliorations} pokeDollars={pokeDollars} objetsBoss={objetsBoss} onAcheter={acheterAmelioration} onAcheterEndgame={acheterAmeliorationEndgame} onFermer={() => setVueOuverte(null)} /></>)}
      {vueOuverte === 'sauvegarde' && (<><TutoFenetre id="sauvegarde" /><PanneauSauvegarde onFermer={() => setVueOuverte(null)} onRevoirTutos={() => { reinitialiserTutos(); reinitialiserGuides(); ajouterAuJournal('Tutos reinitialises.', 'info') }} /></>)}
      {vueOuverte === 'oeufs' && (<><TutoFenetre id="oeufs" /><PanneauOeufs oeufsIncubes={oeufsIncubes} reserveOeufs={reserveOeufs} jetonsElevage={jetonsElevage} ameliorations={ameliorationsElevage} onPlacerOeuf={placerOeuf} onEclore={eclore} onAcheterOeuf={acheterOeuf} onAmeliorer={ameliorerElevage} onAcheterIncubateur={acheterIncubateur} onFermer={() => setVueOuverte(null)} /></>)}

      {combatTourActif && equipeEnnemieTour.length > 0 && (<CombatTour key={niveauTourActuel} niveauTour={niveauTourActuel} equipeJoueur={equipeJoueur} equipeEnnemie={equipeEnnemieTour} vitesse={vitesse} onVictoire={victoireTour} onDefaite={defaiteTour} onQuitter={() => { setCombatTourActif(false); setNiveauTourActuel(1) }} />)}
      {tourOuverte && !combatTourActif && (<PanneauTour collectionCartes={collectionCartesTCG} meilleurNiveau={meilleurNiveauTour} onLancer={() => { setTourOuverte(false); lancerTour() }} enCours={combatTourActif} onFermer={() => setTourOuverte(false)} />)}
      {vueOuverte === 'fusion' && (<CentreFusion collection={captures} adnFusion={adnFusion} onFusionner={fusionner} onChangerGene={changerGeneDominant} onFermer={() => setVueOuverte(null)} />)}
      {carteDrop && (<div className={`tcg-drop-encart fin-${carteDrop.finition || 'normale'}`}><div className="tcg-drop-carte-mini">{carteDrop.imageSmall && <img src={carteDrop.imageSmall} alt={carteDrop.nom} />}{carteDrop.finition === 'brillante' && <div className="tcg-fx-brillante" aria-hidden="true" />}{carteDrop.finition === 'prismatique' && <div className="tcg-fx-prismatique" aria-hidden="true" />}</div><div className="tcg-drop-texte"><span className="tcg-drop-titre">{carteDrop.finition === 'prismatique' ? '🌈 Carte PRISMATIQUE !' : carteDrop.finition === 'brillante' ? '✨ Carte brillante !' : 'Carte obtenue !'}</span><span className="tcg-drop-nom">{carteDrop.nom}</span><span className="tcg-drop-rarete">{carteDrop.rarete} - {carteDrop.setNom}</span></div></div>)}

      <GuideInteractif id={guideActif} actif={!!guideActif} onTermine={() => setGuideActif(null)} />

      {renduTutoriel}
    </div>
  )
}

export default App