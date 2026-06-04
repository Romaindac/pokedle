import { useState, useEffect, useRef } from 'react'
import './App.css'
import { VITESSE_COMBAT, PAUSE_RESPAWN, GAIN_PAR_VICTOIRE, GAIN_BASE_ENNEMI, BONUS_STAT_NIVEAU, XP_BASE_NIVEAU, XP_BASE_ENNEMI, TAUX_CAPTURE_RARETE, BALLS, BALL_AUTO_PAR_RARETE, TAUX_SHINY, PIERRES, BONBONS, prixDynamique, multiplicateurSurclassement } from './config'
import { ticCombat } from './moteurCombat'
import { genererIV, statsFinales, fusionnerIV, ajouterXP, xpRequise } from './stats'
import { ROUTES, routeParId, tirerPokemon, MULTI_XP_RARETE, bossDeLaRoute, COMBATS_AVANT_BOSS, FORCE_BOSS, routeDebloquee } from './routes'
import { ROLES, determinerRole, determinerPassif, bonusDuPassif, compositionValide, diagnostiqueComposition, compterRoles, COMPOSITION_REQUISE, trierIdsParRole, passifParDefautDuRole } from './roles'
import CartePokemon from './CartePokemon'
import TimerAnneau from './TimerAnneau'
import Pokedex from './Pokedex'
import Equipe from './Equipe'
import ReglesCapture from './ReglesCapture'
import PanneauPrestige from './PanneauPrestige'
import PanneauArene from './PanneauArene'
import CombatArene from './CombatArene'
import PanneauRaids from './PanneauRaids'
import CombatRaid from './CombatRaid'
import { RAIDS, raidParId, etatRaid, tempsRestantRaid, COOLDOWN_RAID_MS, FORCE_BOSS_RAID_PV, FORCE_BOSS_RAID_ATK, TAUX_CAPTURE_BOSS_RAID } from './raids'
import { PARCHEMINS, roleDuParchemin } from './parchemins'
import PanneauPvp from './PanneauPvp'
import CombatPvp from './CombatPvp'
import Tutoriel from './Tutoriel'
import { publierDefense, chargerMaDefense, listerDefenses, appliquerResultatPvp, reconstruireEquipeSnapshot, capperEquipePvp, equipeComplete, NIVEAU_MAX_PVP, rangDepuisPoints, POINTS_DEPART } from './apiPvp'
import { dresseursDebloques, etatsDresseurs, decrireRecompenseDresseur, DRESSEURS } from './arene'
import { OBJETS, bonusStatsObjet, objetsAchetables, effetsSpeciauxEquipe, bonusXpObjet, tirerObjetDrop } from './objets'
import MenuRoutes from './MenuRoutes'
import ChoixStarter from './ChoixStarter'
import PanneauStats from './PanneauStats'
import Boutique from './Boutique'
import Sac from './Sac'
import PanneauSucces from './PanneauSucces'
import { SUCCES } from './succes'
import PanneauAmeliorations from './PanneauAmeliorations'
import { coutAmelioration, multiplicateur, niveauAmelioration, PALIER_MAX, facteurNegociateur } from './ameliorations'
import { recompensesDisponibles, PALIERS_GLOBAUX, PALIERS_GENERATION, GENERATIONS as GENS_RECOMP } from './recompenses'
import { medaillesGagnables, multiplicateursPrestige, totalInvesti, BONUS_PRESTIGE } from './prestige'
import { chargerInfosEspece, corrigerNom } from './evolution'
import { SPECIAUX, specialDuBoss } from './speciaux'
import Classement from './Classement'
import ChoixPseudo from './ChoixPseudo'
import { chargerIdentite, envoyerScore } from './apiClassement'
import { chargerTableNoms } from './pokedexNoms'

const CLE_SAUVEGARDE = 'pokedex-idle-save-v11'

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
        pvBase: dataEvo.stats[0].base_stat,
        attaqueBase: dataEvo.stats[1].base_stat,
        vitesseBase: dataEvo.stats[5].base_stat,
        defBase: Math.max(dataEvo.stats[2].base_stat, dataEvo.stats[4].base_stat),
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
    pvBase: data.stats[0].base_stat,
    attaqueBase: data.stats[1].base_stat,
    vitesseBase: data.stats[5].base_stat,
    defBase: Math.max(data.stats[2].base_stat, data.stats[4].base_stat),
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
  // Rôle + passif FIXES, déterminés par le type/style du Pokémon (pas ses stats).
  base.role = determinerRole(base)
  base.passif = determinerPassif(base)
  const finales = statsFinales(base, BONUS_STAT_NIVEAU)
  return { ...base, ...finales }
}

// Applique les bonus de passif qui dépendent de TOUTE l'équipe (ex: Gardien = +20% PV
// max de l'équipe). Appelé après la construction d'une équipe (joueur ou ennemie).
// Renvoie une nouvelle équipe avec pvMax ajusté. Robuste : ne touche pas aux PV courants.
function appliquerBonusEquipe(equipe) {
  if (!equipe || equipe.length === 0) return equipe
  // Cumul des bonus PV d'équipe (gardien) parmi les membres présents.
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

async function chargerEquipeEnnemie(route) {
  // On veut une équipe ennemie qui respecte la compo 1 Tank / 1 Éclaireur / 2 Soutien / 2 DPS.
  // Le rôle dépend du type (connu après chargement), donc on tire un LARGE vivier de
  // candidats, on les charge, puis on sélectionne selon les rôles voulus.
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

  // Range les candidats par rôle.
  const parRole = { tank: [], eclaireur: [], soutien: [], dps: [] }
  for (const c of candidats) {
    const role = c.role || determinerRole(c)
    if (parRole[role]) parRole[role].push(c)
  }
  // Sélectionne selon la compo requise ; si un rôle manque, pioche dans le reste.
  const reste = [...candidats]
  function prendre(role, n) {
    const choisis = []
    for (let k = 0; k < n; k++) {
      let p = parRole[role] && parRole[role].length ? parRole[role].shift() : null
      if (!p) p = reste.find(Boolean) // fallback : n'importe quel candidat restant
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
  // Liste des Pokémon : l'équipe normale + le spécial en dernier (boss emblématiques).
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
    // Le dernier Pokémon d'un boss avec special = sa "star" : plus haut niveau (+15).
    const estSpecial = dresseur.special && index === equipe.length - 1
    const niveauBase = estSpecial ? dresseur.niveau + 15 : dresseur.niveau
    const niveau = Math.max(1, niveauBase + Math.floor(Math.random() * 5) - 2)
    const avecNiveau = { ...p, niveau, rarete: estSpecial ? 'special' : 'commun', shiny: false, sprite: p.spriteNormal }
    const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
    return { ...avecNiveau, ...finales }
  })
}

// Charge les 3 vagues d'un raid. Renvoie un tableau de 3 tableaux de Pokémon prêts au combat.
// Vague 1 = 6 petits, vague 2 = 2 mini-boss, vague 3 = [gros boss renforcé].
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
        // Mini-boss (vague 2) : +8 niveaux. Gros boss (vague 3) : +20 niveaux + renforcé.
        let niveau = raid.niveau
        if (indexVague === 1) niveau = raid.niveau + 8
        if (estVagueBoss) niveau = raid.niveau + 20
        niveau = Math.max(1, niveau + Math.floor(Math.random() * 5) - 2)
        const avecNiveau = {
          ...p, niveau,
          rarete: estVagueBoss ? 'legendaire' : (indexVague === 1 ? 'tresRare' : 'commun'),
          shiny: false, sprite: p.spriteNormal,
          estBoss: estVagueBoss,
        }
        const finales = statsFinales(avecNiveau, BONUS_STAT_NIVEAU)
        if (estVagueBoss) {
          // Le gros boss : très tanky (PV ×5) mais attaque modérée (×3) → pas de one-shot.
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
  const [pokedexSpeciaux, setPokedexSpeciaux] = useState([]) // ids des spéciaux débloqués (via boss d'arène)
  const [tableNoms, setTableNoms] = useState({})

  const [pvJoueur, setPvJoueur] = useState([])
  const [jaugeJoueur, setJaugeJoueur] = useState([])
  const [equipeEnnemie, setEquipeEnnemie] = useState([])
  const [pvEnnemis, setPvEnnemis] = useState([])
  const [jaugeEnnemis, setJaugeEnnemis] = useState([])
  const [chargement, setChargement] = useState(true)
  const [vaincus, setVaincus] = useState(0)
  const [pokeDollars, setPokeDollars] = useState(0)
  const [balls, setBalls] = useState({ poke: 0, super: 0, hyper: 0, master: 0 })
  const [pierres, setPierres] = useState({})
  const [bonbons, setBonbons] = useState({})
  // Inventaire d'objets équipables (stock par id, comme les pierres).
  const [objets, setObjets] = useState({})
  // Stock de parchemins de rôle (endgame) : { [cleParchemin]: quantité }.
  const [parchemins, setParchemins] = useState({})
  // Compteur d'achats par item (pour le prix dynamique des pierres/objets).
  const [achatsItems, setAchatsItems] = useState({})
  const [recompensesReclamees, setRecompensesReclamees] = useState([])
  // Prestige : médailles disponibles + points investis par catégorie de bonus.
  const [medailles, setMedailles] = useState(0)
  const [investisPrestige, setInvestisPrestige] = useState({ xp: 0, argent: 0, shiny: 0 })
  const [journal, setJournal] = useState([])
  const [vueOuverte, setVueOuverte] = useState(null)
  // Classement en ligne : identité du joueur (pseudo). null si pas encore choisi.
  const [identiteJoueur, setIdentiteJoueur] = useState(() => chargerIdentite())
  // Mode de jeu : 'principal' (exploration/captures) ou 'arene' (combats de dresseurs).
  const [modeJeu, setModeJeu] = useState('principal')
  // --- Tutoriel ---
  const [tutoVu, setTutoVu] = useState(false)          // true une fois la bienvenue passée (sauvegardé)
  const [tutoMode, setTutoMode] = useState(null)       // null | 'bienvenue' | 'visite' | 'guide'
  // --- PvP ---
  const [equipeDefenseIds, setEquipeDefenseIds] = useState([])   // équipe de défense (uid)
  const [equipeAttaqueIds, setEquipeAttaqueIds] = useState([])   // équipe d'attaque (uid)
  const [pvpPoints, setPvpPoints] = useState(POINTS_DEPART)       // mes points PvP
  const [pvpRang, setPvpRang] = useState('Bronze')               // mon rang PvP
  const [pvpDefensePubliee, setPvpDefensePubliee] = useState(false)
  const [pvpAdversaires, setPvpAdversaires] = useState([])       // défenses des autres
  const [pvpChargementListe, setPvpChargementListe] = useState(false)
  const [pvpPublicationEnCours, setPvpPublicationEnCours] = useState(false)
  const [pvpMessage, setPvpMessage] = useState('')               // message d'info (ELO gagné/perdu…)
  const [pvpCombat, setPvpCombat] = useState(null)               // { adversaire, equipeJoueur, equipeAdverse } pendant un combat
  // Équipe dédiée à l'arène (uid des Pokémon), séparée de l'équipe principale.
  const [equipeAreneIds, setEquipeAreneIds] = useState([])
  // Dresseurs déjà vaincus en arène (ids) — une seule victoire par dresseur, pas de farm.
  const [dresseursVaincus, setDresseursVaincus] = useState([])
  // Dresseur actuellement sélectionné / affronté en arène.
  const [dresseurActif, setDresseurActif] = useState(null)
  // Équipe du dresseur chargée (Pokémon prêts au combat) + état de chargement.
  const [equipeDresseur, setEquipeDresseur] = useState(null)
  const [chargementArene, setChargementArene] = useState(false)
  // ===== RAIDS (endgame) =====
  // Équipe dédiée aux raids (uid), séparée des autres modes.
  const [equipeRaidIds, setEquipeRaidIds] = useState([])
  // Cooldowns par raid : { [raidId]: timestamp de prochaine dispo }.
  const [raidsCooldowns, setRaidsCooldowns] = useState({})
  // Raid actuellement sélectionné / en cours + ses 3 vagues chargées.
  const [raidActif, setRaidActif] = useState(null)
  const [vaguesRaid, setVaguesRaid] = useState(null)  // [[pkm...], [pkm...], [pkm boss]]
  const [chargementRaid, setChargementRaid] = useState(false)
  const [partieChargee, setPartieChargee] = useState(false)
  // Règles de capture : pour chaque catégorie, quelle ball utiliser.
  // Valeurs possibles : 'auto' | 'poke' | 'super' | 'hyper' | 'master' | 'rien'
  // Priorité d'application : shiny > legendaire > nouveau > doublon.
  const [reglesCapture, setReglesCapture] = useState({
    shiny: 'auto',
    legendaire: 'auto',
    nouveau: 'auto',
    doublon: 'auto',
  })
  const [routeActive, setRouteActive] = useState('tutoriel')
  const [victoiresParRoute, setVictoiresParRoute] = useState({})
  const [bossVaincus, setBossVaincus] = useState({})
  const [succesDebloques, setSuccesDebloques] = useState([])
  const [ameliorations, setAmeliorations] = useState({})
  const [combatBoss, setCombatBoss] = useState(false)
  const [tempsBossZone, setTempsBossZone] = useState(45) // timer du boss de zone (sec)
  const [vitesse, setVitesse] = useState(1)
  const [choixStarterRequis, setChoixStarterRequis] = useState(false)
  const [captureRecente, setCaptureRecente] = useState(null)

  const equipeJoueur = equipeIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
  // Validité de la composition d'équipe (1 Tank / 1 Éclaireur / 2 Soutien / 2 DPS).
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
  const reglesCaptureRef = useRef({ shiny: 'auto', legendaire: 'auto', nouveau: 'auto', doublon: 'auto' })
  const routeActiveRef = useRef('tutoriel')
  const combatBossRef = useRef(false)
  const modeJeuRef = useRef('principal')
  const victoiresParRouteRef = useRef({})
  const bossVaincusRef = useRef({})
  const ameliorationsRef = useRef({})
  const etat = useRef({ pvJ: [], jJ: [], pvE: [], jE: [] })

  useEffect(() => { ballsRef.current = balls }, [balls])
  useEffect(() => { equipeEnnemieRef.current = equipeEnnemie }, [equipeEnnemie])
  useEffect(() => { capturesRef.current = captures }, [captures])
  useEffect(() => { equipeIdsRef.current = equipeIds }, [equipeIds])

  // Quand l'équipe change (ajout/retrait de Pokémon), on resynchronise l'état de
  // combat du joueur : PV au max de la nouvelle équipe, jauges à zéro.
  // Évite les décalages "HP 500/100" et les plantages quand on change d'équipe en plein combat.
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

  // Timer du boss de zone : 45s pour le vaincre, sinon il s'enfuit (refarm des 25 victoires).
  useEffect(() => {
    if (!combatBoss) { setTempsBossZone(45); return }
    const TEMPS = 45
    setTempsBossZone(TEMPS)
    const debut = Date.now()
    const tic = setInterval(() => {
      const reste = Math.max(0, TEMPS - (Date.now() - debut) / 1000)
      setTempsBossZone(reste)
      if (reste <= 0) {
        // Temps écoulé : le boss s'enfuit, on remet le compteur de victoires à zéro
        // ET on relance un combat normal (sinon le boss reste affiché à l'écran).
        clearInterval(tic)
        const routePerdue = routeActiveRef.current
        ajouterAuJournal(`⏱️ Trop lent ! Le boss s'est enfui. Il faut refaire les ${COMBATS_AVANT_BOSS} victoires.`, 'echec')
        // Mise à jour state + ref immédiate (lancerCombatSuivant lit la ref).
        setVictoiresParRoute((v) => {
          const maj = { ...v, [routePerdue]: 0 }
          victoiresParRouteRef.current = maj
          return maj
        })
        setCombatBoss(false)
        combatBossRef.current = false
        // Relance un combat normal : fait disparaître le boss et charge des ennemis.
        transitionEnCours.current = true
        if (lancerCombatSuivantRef.current) {
          lancerCombatSuivantRef.current()
        }
      }
    }, 100)
    return () => clearInterval(tic)
  }, [combatBoss])
  useEffect(() => { modeJeuRef.current = modeJeu }, [modeJeu])
  // Affiche la bienvenue une seule fois, quand la partie est chargée et le tuto jamais vu.
  useEffect(() => {
    if (partieChargee && !tutoVu && tutoMode === null) {
      setTutoMode('bienvenue')
    }
  }, [partieChargee, tutoVu])
  // Quand on entre dans le PvP : charger mes infos + la liste des adversaires.
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

  // Recalcule les effets spéciaux des objets équipés sur l'équipe active (shiny, argent).
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

  // Recalcule les bonus permanents de complétion à partir des récompenses réclamées.
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

  // Recalcule les bonus permanents gagnés via les succès débloqués (type 'bonus').
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

  // Recalcule les multiplicateurs permanents du prestige quand les points investis changent.
  useEffect(() => {
    const m = multiplicateursPrestige(investisPrestige)
    bonusPrestigeXP = m.xp
    bonusPrestigeArgent = m.argent
    bonusPrestigeShiny = m.shiny
    // Le bonus shiny du prestige se combine avec celui des améliorations (chroma).
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
      nbDresseurs: dresseursVaincus.length,
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
          // Bonus permanent (XP ou argent) : appliqué via le useEffect dédié ci-dessous.
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

  // Journal anti-spam pour les fuites : regroupe les "X s'enfuit faute de Ball"
  // en une seule ligne avec compteur, tant qu'elles s'enchaînent.
  function journalFuite() {
    setJournal((lignes) => {
      const derniere = lignes[lignes.length - 1]
      if (derniere && derniere.type === 'fuite') {
        // On incrémente le compteur de la dernière ligne de fuite.
        const compte = (derniere.compte || 1) + 1
        const maj = { ...derniere, compte, texte: `💨 ${compte} Pokémon enfuis faute de Ball` }
        return [...lignes.slice(0, -1), maj]
      }
      // Première fuite d'une série : nouvelle ligne.
      compteurJournal += 1
      const nouvelle = { texte: `💨 1 Pokémon enfui faute de Ball`, type: 'fuite', compte: 1, id: `j-${compteurJournal}` }
      return [...lignes, nouvelle].slice(-6)
    })
  }

  // Affiche l'encart de capture (sprite qui pop) puis le retire tout seul.
  const captureTimer = useRef(null)
  function montrerCapture(ennemi) {
    setCaptureRecente({
      nom: ennemi.nom,
      sprite: ennemi.sprite,
      shiny: ennemi.shiny ?? false,
      cle: Date.now(), // force le redéclenchement de l'animation
    })
    if (captureTimer.current) clearTimeout(captureTimer.current)
    captureTimer.current = setTimeout(() => setCaptureRecente(null), 2200)
  }

  function marquerVu(id) {
    setPokedexVus((vus) => (vus.includes(id) ? vus : [...vus, id]))
  }

  function marquerShiny(id) {
    setPokedexShiny((vus) => (vus.includes(id) ? vus : [...vus, id]))
  }

  // Répare en ARRIÈRE-PLAN les évolutions des Pokémon déjà présents dans la save :
  // - recharge la formeEvoluee manquante (Pokémon qui ont evolueEn mais formeEvoluee null
  //   → réparait Reptincel bloqué qui ne pouvait pas devenir Dracaufeu) ;
  // - recharge evolutionsPierre avec la nouvelle logique (évolutions exotiques type Noctali/
  //   Mentali désormais possibles par pierre).
  // Marqueur evoV2 : on ne répare chaque Pokémon qu'UNE seule fois (jamais en boucle).
  async function reparerEvolutionsSave() {
    const liste = capturesRef.current || []
    // Cibles : ceux pas encore migrés en V2.
    const aReparer = liste.filter((p) => !p.evoV2)
    if (aReparer.length === 0) return
    for (const pkm of aReparer) {
      try {
        const infos = await chargerInfosEspece(pkm.id)
        // Recharger la formeEvoluee si une évolution par niveau existe et qu'elle manque.
        let formeEvoluee = pkm.formeEvoluee
        if (infos.evolueEn && infos.evolueNiveau && !formeEvoluee) {
          const repEvo = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(infos.evolueEn)}`)
          const dataEvo = await repEvo.json()
          const infosEvo = await chargerInfosEspece(dataEvo.id)
          formeEvoluee = {
            nom: dataEvo.name,
            id: dataEvo.id,
            pvBase: dataEvo.stats[0].base_stat,
            attaqueBase: dataEvo.stats[1].base_stat,
            vitesseBase: dataEvo.stats[5].base_stat,
            defBase: Math.max(dataEvo.stats[2].base_stat, dataEvo.stats[4].base_stat),
            types: dataEvo.types.map((t) => t.type.name),
            sprite: dataEvo.sprites.front_default,
            spriteNormal: dataEvo.sprites.front_default,
            spriteShiny: dataEvo.sprites.front_shiny,
            evolueEn: infosEvo.evolueEn,
            evolueNiveau: infosEvo.evolueNiveau,
          }
        }
        // Mise à jour du Pokémon : evolueEn/Niveau, evolutionsPierre (nouvelle logique),
        // formeEvoluee rechargée, et marqueur evoV2.
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
        // On marque quand même pour ne pas réessayer en boucle sur une espèce qui échoue.
        capturesRef.current = capturesRef.current.map((p) => (p.uid === pkm.uid ? { ...p, evoV2: true } : p))
      }
      // Petite pause pour ne pas marteler l'API (réparation douce en fond).
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
    // Rôle + passif recalculés/conservés sur la forme évoluée (évite un rôle "undefined"
    // après évolution, qui pourrait fausser la composition d'équipe).
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
        pvBase: dataEvo.stats[0].base_stat,
        attaqueBase: dataEvo.stats[1].base_stat,
        vitesseBase: dataEvo.stats[5].base_stat,
        defBase: Math.max(dataEvo.stats[2].base_stat, dataEvo.stats[4].base_stat),
        types: dataEvo.types.map((t) => t.type.name),
        sprite: dataEvo.sprites.front_default,
        spriteNormal: dataEvo.sprites.front_default,
        spriteShiny: dataEvo.sprites.front_shiny,
        evolueEn: infosEvo.evolueEn,
        evolueNiveau: infosEvo.evolueNiveau,
      }
      setCaptures((liste) => liste.map((p) => (p.uid === uid ? { ...p, formeEvoluee } : p)))
    } catch (err) {
      // tant pis
    }
  }

  async function evoluerParPierre(uid, evolueEn, pierre) {
    if (!pierres[pierre] || pierres[pierre] <= 0) return
    try {
      const repEvo = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(evolueEn)}`)
      const dataEvo = await repEvo.json()

      // Anti-doublon : on refuse si l'espèce cible existe déjà avec le même statut shiny.
      // (un shiny et un normal de la même espèce restent autorisés séparément)
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
            pvBase: dataEvo.stats[0].base_stat,
            attaqueBase: dataEvo.stats[1].base_stat,
            vitesseBase: dataEvo.stats[5].base_stat,
            defBase: Math.max(dataEvo.stats[2].base_stat, dataEvo.stats[4].base_stat),
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
          // Conserve rôle/passif/objet du Pokémon d'origine (évite rôle undefined).
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
    // On utilise la ref (toujours à jour) et pas equipeIds figé dans la closure de la boucle.
    const idsEquipe = equipeIdsRef.current
    const collectionActuelle = capturesRef.current

    // --- XP de rattrapage (option A, plafond ×2, XP redistribuée) ---
    // Les Pokémon sous-levelés (en retard vs la moyenne de l'équipe) reçoivent
    // une part plus grosse, plafonnée à ×2. L'XP totale reste la même (redistribuée).
    const membres = idsEquipe
      .map((uid) => collectionActuelle.find((p) => p.uid === uid))
      .filter(Boolean)
    const niveauMoyen = membres.length > 0
      ? membres.reduce((s, p) => s + (p.niveau || 1), 0) / membres.length
      : 1

    function poidsRattrapage(niv) {
      if (niv >= niveauMoyen) return 1
      const ratio = niveauMoyen / Math.max(1, niv)
      return Math.min(2, ratio) // plafond ×2
    }

    const totalPoids = membres.reduce((s, p) => s + poidsRattrapage(p.niveau || 1), 0) || 1
    // Part d'XP par uid (pondérée)
    const partParUid = {}
    membres.forEach((p) => {
      partParUid[p.uid] = Math.round(xpTotale * poidsRattrapage(p.niveau || 1) / totalPoids)
    })

    setCaptures((collection) =>
      collection.map((poke) => {
        if (!idsEquipe.includes(poke.uid)) return poke
        const partBase = partParUid[poke.uid] ?? Math.round(xpTotale / 6)
        // Bonus d'XP individuel de l'objet équipé (ex: Loupe Savante +25%).
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
            // La nouvelle forme (ex: Reptincel) connaît son evolueEn (Dracaufeu) mais
            // pas encore sa formeEvoluee (mise à null après évolution). On la recharge
            // pour permettre la 2e évolution (sinon elle s'arrête au 2e palier).
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

  // Choisit la meilleure ball dispo en mode "auto" selon la rareté (de l'idéale vers la plus basse).
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

  // Détermine la catégorie du Pokémon selon la priorité shiny > legendaire > nouveau > doublon.
  function categorieEnnemi(ennemi) {
    if (ennemi.shiny === true) return 'shiny'
    if ((ennemi.rarete || 'commun') === 'legendaire') return 'legendaire'
    const aDejaEspece = capturesRef.current.some((p) => p.id === ennemi.id)
    return aDejaEspece ? 'doublon' : 'nouveau'
  }

  // Choisit la ball à utiliser selon la règle de la catégorie (avec fallback auto si épuisée).
  function choisirBall(ennemi) {
    const regles = reglesCaptureRef.current
    const categorie = categorieEnnemi(ennemi)
    const regle = regles[categorie] || 'auto'
    if (regle === 'rien') return 'rien'

    const rarete = ennemi.rarete || 'commun'
    if (regle === 'auto') return ballAuto(rarete)

    // Une ball précise est demandée : on l'utilise si dispo, sinon fallback auto.
    const stocks = ballsRef.current
    if (stocks[regle] > 0) return regle
    return ballAuto(rarete) // fallback : prend ce qu'il y a (ne jamais rater un shiny)
  }

  function tenterCapture(indexEnnemi) {
    const ennemi = equipeEnnemieRef.current[indexEnnemi]
    if (!ennemi) return
    if (ennemi.estBoss) return
    if (ennemi.estEvolution) return

    const estShiny = ennemi.shiny === true
    const aDejaShiny = pokedexShinyRef.current.includes(ennemi.id)

    // Un shiny déjà possédé en shiny : inutile de le recapturer.
    if (estShiny && aDejaShiny) return

    const ball = choisirBall(ennemi)
    if (ball === 'rien') return // règle de la catégorie = ne pas capturer
    if (!ball) {
      journalFuite()
      return
    }

    const rarete = ennemi.rarete || 'commun'
    setBalls((b) => ({ ...b, [ball]: b[ball] - 1 }))
    ballsRef.current = { ...ballsRef.current, [ball]: ballsRef.current[ball] - 1 }

    const tauxBase = TAUX_CAPTURE_RARETE[rarete] ?? 0.5
    const multi = BALLS[ball].multi
    const bonusCapture = multiplicateur(ameliorationsRef.current, 'dressage') // +3%/niveau
    const reussite = estShiny ? true : (multi === Infinity ? true : Math.random() < tauxBase * multi * bonusCapture)

    if (!reussite) {
      ajouterAuJournal(`${ennemi.nom} s'est échappé ! 💨 (${BALLS[ball].emoji})`, 'echec')
      return
    }

    // On détermine le cas AVANT de modifier l'état (effets de bord hors du setState,
    // sinon React peut les exécuter 2 fois → message en double).
    const existantActuel = capturesRef.current.find((p) => p.id === ennemi.id)

    if (!existantActuel) {
      // --- Nouvelle espèce capturée ---
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
    } else if (ennemi.shiny && !existantActuel.shiny) {
      // --- On possède déjà l'espèce, mais on capture sa version shiny ---
      ajouterAuJournal(`${ennemi.nom} ✨ SHINY capturé ! Skin doré débloqué ! 🎉`, 'capture')
      marquerVu(ennemi.id)
      marquerShiny(ennemi.id)
      montrerCapture(ennemi)
      const majListe = capturesRef.current.map((p) => {
        if (p.id !== ennemi.id) return p
        const maj = {
          ...p,
          shiny: true,
          sprite: ennemi.spriteShiny ?? p.sprite,
          spriteShiny: ennemi.spriteShiny ?? p.spriteShiny,
          spriteNormal: ennemi.spriteNormal ?? p.spriteNormal,
        }
        return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
      })
      capturesRef.current = majListe
      setCaptures(majListe)
    } else {
      // --- Doublon : on améliore les IV de TOUTE LA FAMILLE si meilleurs ---
      // On ne capture que des Pokémon de base, mais leurs évolutions (Reptincel, Dracaufeu…)
      // appartiennent à la même famille (familleId). Un doublon de Salamèche doit donc
      // aussi améliorer les IV de Reptincel/Dracaufeu. On cible par familleId (fallback id),
      // et seulement les exemplaires du même statut shiny (normal/shiny restent séparés).
      const familleCible = ennemi.familleId ?? null
      const memeFamille = (p) =>
        (familleCible != null ? p.familleId === familleCible : p.id === ennemi.id) &&
        (p.shiny === ennemi.shiny)

      let auMoinsUnAmeliore = false
      const majListe = capturesRef.current.map((p) => {
        if (!memeFamille(p)) return p
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
    // ============================================================================
    // FIX BUG « combat figé sur boss » : cette fonction est désormais INCREVABLE.
    // Le drapeau transitionEnCours.current est rebaissé dans le finally QUOI QU'IL
    // ARRIVE. Avant, si un chargement (boss/ennemis via PokeAPI) échouait, le drapeau
    // restait coincé à true → la boucle de combat faisait toujours demi-tour sur
    // `if (transitionEnCours.current) return` → aucune jauge ne bougeait (combat gelé),
    // et ça persistait après actualisation. Le try/catch/finally règle ça pour de bon.
    // ============================================================================
    try {
      const route = routeParId(routeActiveRef.current)
      const victoiresZone = (victoiresParRouteRef.current[route.id] || 0)
      // Stratégie : -1 victoire requise par niveau, jamais sous 10.
      const reduc = niveauAmelioration(ameliorationsRef.current, 'strategie')
      const combatsAvantBoss = Math.max(10, COMBATS_AVANT_BOSS - reduc)
      const cestLeBoss = victoiresZone >= combatsAvantBoss && !bossVaincusRef.current[route.id]

      let nouveaux
      if (cestLeBoss) {
        // Le chargement du boss peut échouer (API PokeAPI). Si ça arrive, on NE reste
        // PAS bloqué : on retombe proprement sur un combat normal.
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

      // Sécurité : si pour une raison quelconque l'équipe ennemie est vide, on évite
      // de figer le combat (sinon la boucle return sur length === 0). On retente un
      // combat normal une fois.
      if (!nouveaux || nouveaux.length === 0) {
        console.warn('Équipe ennemie vide, nouvelle tentative de combat normal.')
        nouveaux = await chargerEquipeEnnemie(route)
        setCombatBoss(false)
        combatBossRef.current = false
      }

      setEquipeEnnemie(nouveaux)
      equipeEnnemieRef.current = nouveaux
      const pvE = nouveaux.map((p) => p.pvMax)
      const jE = nouveaux.map(() => 0)
      const eq = equipeIds.map((uid) => capturesRef.current.find((p) => p.uid === uid)).filter(Boolean)
      const pvJ = eq.map((p) => p.pvMax)
      const jJ = eq.map(() => 0)
      setPvJoueur(pvJ); setJaugeJoueur(jJ)
      etat.current = { pvJ, jJ, pvE, jE }
      setPvEnnemis(pvE); setJaugeEnnemis(jE)
    } catch (err) {
      // Filet de sécurité ultime : on log, mais on ne laisse JAMAIS le combat figé.
      console.error('Erreur dans lancerCombatSuivant :', err)
    } finally {
      // CLÉ DU FIX : le drapeau de transition redescend TOUJOURS, même en cas d'erreur.
      transitionEnCours.current = false
    }
  }
  // On garde une référence vers la fonction pour pouvoir l'appeler depuis
  // d'autres effets (ex: expiration du timer de boss) sans souci d'ordre de définition.
  lancerCombatSuivantRef.current = lancerCombatSuivant

  useEffect(() => {
    async function init() {
      try {
        const sauvegarde = localStorage.getItem(CLE_SAUVEGARDE)
        if (sauvegarde) {
          const data = JSON.parse(sauvegarde)
          // ÉTAPE 1 : on recalcule le rôle + passif de chaque Pokémon de la save,
          // pour appliquer la nouvelle logique de rôles (par numéro de Pokédex).
          const capturesRecalc = (data.captures || []).map((p) =>
            p ? { ...p, role: determinerRole(p), passif: determinerPassif(p) } : p
          )
          data.captures = capturesRecalc
          setCaptures(capturesRecalc)
          // ÉTAPE 2 : on trie l'équipe chargée dans l'ordre Tank→Éclaireur→DPS→Soutien.
          setEquipeIds(trierIdsParRole(data.equipeIds || [], capturesRecalc))
          setPokedexVus(data.pokedexVus || [])
          if (data.pokedexSpeciaux) setPokedexSpeciaux(data.pokedexSpeciaux)
          setPokedexShiny(data.pokedexShiny || [])
          setVaincus(data.vaincus || 0)
          setPokeDollars(data.pokeDollars || 0)
          setBalls(data.balls || { poke: 0, super: 0, hyper: 0, master: 0 })
          setPierres(data.pierres || {})
          setBonbons(data.bonbons || {})
          setObjets(data.objets || {})
          if (data.parchemins) setParchemins(data.parchemins)
          setAchatsItems(data.achatsItems || {})
          setRecompensesReclamees(data.recompensesReclamees || [])
          if (typeof data.medailles === 'number') setMedailles(data.medailles)
          if (data.investisPrestige) setInvestisPrestige(data.investisPrestige)
          if (data.equipeAreneIds) setEquipeAreneIds(data.equipeAreneIds)
          if (data.raidsCooldowns) setRaidsCooldowns(data.raidsCooldowns)
          if (data.equipeRaidIds) setEquipeRaidIds(data.equipeRaidIds)
          if (data.equipeDefenseIds) setEquipeDefenseIds(data.equipeDefenseIds)
          if (data.equipeAttaqueIds) setEquipeAttaqueIds(data.equipeAttaqueIds)
          if (data.tutoVu) setTutoVu(true)
          if (data.dresseursVaincus) setDresseursVaincus(data.dresseursVaincus)
          setVictoiresParRoute(data.victoiresParRoute || {})
          setBossVaincus(data.bossVaincus || {})
          setSuccesDebloques(data.succesDebloques || [])
          setAmeliorations(data.ameliorations || {})
          ameliorationsRef.current = data.ameliorations || {}
          bonusShinyGlobal = multiplicateur(data.ameliorations || {}, 'chroma')
          if (data.vitesse) setVitesse(data.vitesse)
          if (data.reglesCapture) { setReglesCapture(data.reglesCapture); reglesCaptureRef.current = data.reglesCapture }
          if (data.routeActive) { setRouteActive(data.routeActive); routeActiveRef.current = data.routeActive }
          capturesRef.current = data.captures || []
          victoiresParRouteRef.current = data.victoiresParRoute || {}
          bossVaincusRef.current = data.bossVaincus || {}
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
          // Réparation des évolutions en arrière-plan (formeEvoluee manquante + evolutionsPierre
          // exotiques). Lancée après un court délai pour ne pas ralentir le démarrage.
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

  useEffect(() => {
    if (!partieChargee || captures.length === 0) return
    const data = { captures, equipeIds, pokedexVus, pokedexShiny, pokedexSpeciaux, vaincus, pokeDollars, balls, pierres, bonbons, objets, parchemins, achatsItems, recompensesReclamees, medailles, investisPrestige, equipeAreneIds, equipeDefenseIds, equipeAttaqueIds, dresseursVaincus, routeActive, victoiresParRoute, bossVaincus, succesDebloques, ameliorations, vitesse, reglesCapture, tutoVu, raidsCooldowns, equipeRaidIds }
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(data))
  }, [partieChargee, captures, equipeIds, pokedexVus, pokedexShiny, pokedexSpeciaux, vaincus, pokeDollars, balls, pierres, bonbons, objets, parchemins, achatsItems, recompensesReclamees, medailles, investisPrestige, equipeAreneIds, equipeDefenseIds, equipeAttaqueIds, dresseursVaincus, routeActive, victoiresParRoute, bossVaincus, succesDebloques, ameliorations, vitesse, reglesCapture, tutoVu, raidsCooldowns, equipeRaidIds])

  // --- Envoi du score au classement en ligne ---
  // Calcule les stats du joueur pour le classement.
  function statsClassement() {
    const nbShiny = captures.filter((p) => p.shiny).length
    const nbZones = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    return {
      pokemonCaptures: pokedexVus.length,
      nbShiny,
      zones: nbZones,
      scorePvp: 0,            // PvP pas encore implémenté
      rangPvp: 'Non classé',
    }
  }

  // Ref toujours à jour des stats du classement. C'est ELLE que lit l'intervalle,
  // pas la closure figée — sinon on renvoyait en boucle les vieilles stats du début.
  const statsClassementRef = useRef(statsClassement())
  useEffect(() => {
    statsClassementRef.current = statsClassement()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captures, pokedexVus, bossVaincus])

  // Envoi throttlé : au plus un envoi toutes les 15 s (évite de spammer Supabase
  // à chaque victoire tout en gardant le score réactif).
  const dernierEnvoiScore = useRef(0)
  function envoyerScoreThrottle(forcer = false) {
    if (!identiteJoueur) return
    const maintenant = Date.now()
    if (!forcer && maintenant - dernierEnvoiScore.current < 15000) return
    dernierEnvoiScore.current = maintenant
    envoyerScore(statsClassementRef.current)
  }
  // Ref vers le helper pour l'appeler depuis la boucle de combat (closure stable).
  const envoyerScoreThrottleRef = useRef(envoyerScoreThrottle)
  useEffect(() => { envoyerScoreThrottleRef.current = envoyerScoreThrottle })

  // Envoie le score quand le joueur a un pseudo : périodiquement + à l'ouverture du classement.
  useEffect(() => {
    if (!partieChargee || !identiteJoueur) return
    // Envoi immédiat (léger) au montage / quand l'identité est définie.
    envoyerScore(statsClassementRef.current)
    dernierEnvoiScore.current = Date.now()
    // Puis toutes les 2 minutes tant que la partie tourne (lit la ref à jour).
    const horloge = setInterval(() => {
      envoyerScore(statsClassementRef.current)
      dernierEnvoiScore.current = Date.now()
    }, 120000)
    return () => clearInterval(horloge)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partieChargee, identiteJoueur])

  // Envoi ponctuel quand on ouvre le classement (pour voir son score à jour).
  useEffect(() => {
    if (vueOuverte === 'classement' && identiteJoueur) {
      envoyerScore(statsClassementRef.current)
      dernierEnvoiScore.current = Date.now()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vueOuverte])

  useEffect(() => {
    if (chargement) return

    const horloge = setInterval(() => {
      if (transitionEnCours.current) return
      if (modeJeuRef.current === 'arene') return // combat principal en pause pendant l'arène
      if (modeJeuRef.current === 'raid') return // combat principal en pause pendant un raid
      // On reconstruit les équipes depuis les refs (stables) à chaque tic.
      const bonusPuissance = multiplicateur(ameliorationsRef.current, 'puissance') // +2%/niveau PV & ATT
      let equipeJoueur = equipeIdsRef.current
        .map((uid) => capturesRef.current.find((p) => p.uid === uid))
        .filter(Boolean)
        .map((p) => bonusPuissance === 1 ? p : {
          ...p,
          pvMax: Math.round(p.pvMax * bonusPuissance),
          attaque: Math.round(p.attaque * bonusPuissance),
        })
      // Bonus d'équipe (Gardien = +PV équipe) appliqué à l'équipe joueur en combat.
      equipeJoueur = appliquerBonusEquipe(equipeJoueur)
      const equipeEnnemie = equipeEnnemieRef.current
      if (equipeJoueur.length === 0 || equipeEnnemie.length === 0) return
      // BLOCAGE DE COMPO : le combat principal ne tourne que si l'équipe respecte
      // 1 Tank / 1 Éclaireur / 2 Soutien / 2 DPS. Sinon on met le combat en pause.
      if (!compositionValideRef.current) return
      let e = etat.current
      // Sécurité : si les tableaux de PV/jauge ne correspondent plus aux équipes
      // (ex: changement d'équipe en cours), on resynchronise avant de combattre.
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
      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, equipeEnnemie, e.pvE, e.jE)

      etat.current = { pvJ: r.pvJoueur, jJ: r.jaugeJoueur, pvE: r.pvEnnemis, jE: r.jaugeEnnemis }
      setPvJoueur(r.pvJoueur); setJaugeJoueur(r.jaugeJoueur)
      setPvEnnemis(r.pvEnnemis); setJaugeEnnemis(r.jaugeEnnemis)

      r.ennemisTombes.forEach((index) => {
        const ennemi = equipeEnnemieRef.current[index]
        if (ennemi) {
          const multi = MULTI_XP_RARETE[ennemi.rarete] || 1
          // Malus de surclassement (même logique que l'or) : si l'équipe surclasse
          // largement la zone, l'XP gagnée baisse → farmer du trop faible ne fait
          // plus monter, on est incité à avancer. (N'affecte pas l'XP de rattrapage
          // interne, qui se base sur l'écart entre membres de l'équipe.)
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
            const gainBoss = Math.round((boss?.niveau || 1) * 30 * multiplicateur(ameliorationsRef.current, 'fortune') * bonusCompletionArgent * bonusPrestigeArgent * bonusArgentObjets * bonusSuccesArgent)
            setPokeDollars((a) => a + gainBoss)
            setBossVaincus((b) => ({ ...b, [routeGagnee]: true }))
            // Battre un boss fait rebaisser tous les prix dynamiques d'un cran.
            setAchatsItems((a) => {
              const reduit = {}
              for (const k in a) reduit[k] = Math.max(0, a[k] - 1)
              return reduit
            })
            // Récompense de boss : 1 super-bonbon garanti (loot rare).
            // Gourmandise : chance d'un 2e super-bonbon bonus.
            const bonbonsBoss = 1 + (Math.random() < (multiplicateur(ameliorationsRef.current, 'gourmandise') - 1) ? 1 : 0)
            setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + bonbonsBoss }))
            if (boss) {
              ajouterAuJournal(`👑 BOSS VAINCU ! ${boss.nom} ✨ terrassé ! (+${gainBoss} 💰)`, 'victoire')
            }
            ajouterAuJournal(`${BONBONS['super-bonbon'].emoji} Butin de boss : ${bonbonsBoss} ${BONBONS['super-bonbon'].nom}${bonbonsBoss > 1 ? 's' : ''} !`, 'capture')
            ajouterAuJournal(`🔓 Zone suivante débloquée !`, 'victoire')
            setCombatBoss(false)
            combatBossRef.current = false
            // Le nombre de zones a changé : on pousse le score au classement tout de suite.
            setTimeout(() => envoyerScoreThrottleRef.current(true), 0)
          } else {
            setVaincus((n) => n + 1)
            // Gain dynamique : somme sur l'équipe ennemie de (base × niveau × multi_rareté).
            const gainBrut = equipeEnnemieRef.current.reduce((total, e) => {
              const m = MULTI_XP_RARETE[e.rarete] || 1
              return total + GAIN_BASE_ENNEMI * (e.niveau || 1) * m
            }, 0)
            // Levier B : malus si l'équipe surclasse la zone (farmer du trop faible paie moins).
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
            // Drop d'objet rare (base 0.3%, augmenté par le Chineur).
            const chanceObjet = 0.003 * multiplicateur(ameliorationsRef.current, 'chineur')
            if (Math.random() < chanceObjet) {
              const objetDrop = tirerObjetDrop()
              setObjets((o) => ({ ...o, [objetDrop]: (o[objetDrop] || 0) + 1 }))
              ajouterAuJournal(`⚙️ Objet trouvé : ${OBJETS[objetDrop].nom} ! (rare)`, 'capture')
            }
            setVictoiresParRoute((v) => ({ ...v, [routeGagnee]: (v[routeGagnee] || 0) + 1 }))
            ajouterAuJournal(`Équipe ennemie vaincue ! (+${gainArgent} 💰)`, 'victoire')
            // Pousse le score au classement (throttlé à 15s : pas de spam Supabase).
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
        setTimeout(lancerCombatSuivant, PAUSE_RESPAWN / vitesse)
      }
    }, VITESSE_COMBAT / (vitesse * multiplicateur(ameliorationsRef.current, 'frenesie')))

    return () => clearInterval(horloge)
  }, [chargement, vitesse])

  async function choisirStarters(noms) {
    setChargement(true)
    setChoixStarterRequis(false)
    // Charge les 3 starters choisis.
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

  // Prix dynamique réduit par le Négociateur : la majoration (part au-dessus du
  // prix de base) est atténuée selon le niveau de l'amélioration.
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

  // Achat d'un parchemin de rôle (endgame, prix fixe en millions, pas de prix dynamique).
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
          // +1 niveau direct : on ajoute exactement l'XP qui manque pour le niveau suivant,
          // calculée avec la VRAIE courbe (xpRequise), sinon le niveau ne monte pas.
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

  function acheterAmelioration(cle) {
    const niveau = ameliorations[cle] || 0
    if (niveau >= PALIER_MAX) return
    const cout = coutAmelioration(cle, niveau)
    if (pokeDollars >= cout) {
      setPokeDollars((a) => a - cout)
      setAmeliorations((am) => ({ ...am, [cle]: (am[cle] || 0) + 1 }))
    }
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

  // Enregistre le passif choisi par le joueur pour un Pokémon (champ passifChoisi).
  // Le passif effectif est recalculé à la lecture (passifEffectif dans roles.js),
  // donc il suffit de stocker le choix ; statsFinales recalcule l'effet au combat.
  function choisirPassif(uidPokemon, clePassif) {
    setCaptures((liste) => liste.map((p) => {
      if (p.uid !== uidPokemon) return p
      const maj = { ...p, passifChoisi: clePassif }
      // Recalcul des stats : certains passifs modifient les PV max (Colosse, etc.).
      return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
    }))
  }

  // Enregistre la CASE choisie pour un Joker (champ jokerCase = tank/eclaireur/soutien/dps).
  // Comme la case change le rôle EFFECTIF du Joker, on re-trie l'équipe active ensuite
  // (l'ordre Tank→Éclaireur→DPS→Soutien doit refléter la nouvelle case).
  function choisirCaseJoker(uidPokemon, caseRole) {
    // 1) On met à jour le Pokémon dans la collection.
    const nouvelleCollection = capturesRef.current.map((p) =>
      p.uid === uidPokemon ? { ...p, jokerCase: caseRole } : p
    )
    capturesRef.current = nouvelleCollection
    setCaptures(nouvelleCollection)
    // 2) Si ce Joker est dans l'équipe active, on re-trie selon les rôles effectifs.
    if (equipeIdsRef.current.includes(uidPokemon)) {
      const triee = trierIdsParRole(equipeIdsRef.current, nouvelleCollection)
      equipeIdsRef.current = triee
      setEquipeIds(triee)
    }
  }

  // Applique un PARCHEMIN DE RÔLE (objet endgame) sur un Pokémon : force son rôle.
  // - Pose roleForce + écrase role (pour que tout le code, qui lit pokemon.role, suive).
  // - Reset le passif choisi au défaut du nouveau rôle (un Tank→DPS ne garde pas Colosse).
  // - Pour le Sceau du Joker : met une case par défaut (DPS) que le joueur pourra changer.
  // - Recalcule les stats, re-trie l'équipe active, et consomme le parchemin.
  function appliquerParchemin(uidPokemon, cleParchemin) {
    if (!parchemins[cleParchemin] || parchemins[cleParchemin] <= 0) return
    const info = PARCHEMINS[cleParchemin]
    if (!info) return
    const nouveauRole = info.role // 'tank' | 'dps' | 'eclaireur' | 'soutien' | 'joker'

    const poke = capturesRef.current.find((p) => p.uid === uidPokemon)
    if (!poke) return

    // Sécurité : si le Pokémon a déjà ce rôle forcé, on ne gaspille pas le parchemin.
    if (poke.roleForce === nouveauRole) {
      ajouterAuJournal(`${poke.nom} a déjà le rôle ${ROLES[nouveauRole]?.nom || nouveauRole}.`, 'info')
      return
    }

    // Consomme le parchemin.
    setParchemins((pp) => ({ ...pp, [cleParchemin]: (pp[cleParchemin] || 0) - 1 }))

    const nouvelleCollection = capturesRef.current.map((p) => {
      if (p.uid !== uidPokemon) return p
      const maj = {
        ...p,
        roleForce: nouveauRole,
        role: nouveauRole, // écrase le rôle stocké pour que tout le code suive
        passifChoisi: passifParDefautDuRole(nouveauRole), // reset passif au défaut du rôle
      }
      // Pour un Joker, on initialise une case par défaut (modifiable ensuite dans la fiche).
      if (nouveauRole === 'joker' && !maj.jokerCase) maj.jokerCase = 'dps'
      return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
    })
    capturesRef.current = nouvelleCollection
    setCaptures(nouvelleCollection)

    // Re-trie l'équipe active si le Pokémon en fait partie (son rôle a changé).
    if (equipeIdsRef.current.includes(uidPokemon)) {
      const triee = trierIdsParRole(equipeIdsRef.current, nouvelleCollection)
      equipeIdsRef.current = triee
      setEquipeIds(triee)
    }

    ajouterAuJournal(`${info.emoji} ${poke.nom} devient ${ROLES[nouveauRole]?.nom || nouveauRole} !`, 'victoire')
  }

  // Équipe (ou déséquipe si idObjet=null) un objet sur un Pokémon.
  // Gère le stock : l'objet équipé sort du stock, l'ancien y retourne.
  function equiperObjet(uidPokemon, idObjet) {
    const poke = captures.find((p) => p.uid === uidPokemon)
    if (!poke) return
    const ancienObjet = poke.objetEquipe || null
    if (idObjet === ancienObjet) return // rien à changer

    // Vérifier le stock si on équipe un nouvel objet.
    if (idObjet && (objets[idObjet] || 0) <= 0) {
      ajouterAuJournal(`Tu n'as pas de ${OBJETS[idObjet]?.nom || 'cet objet'} en stock.`, 'info')
      return
    }

    // Mise à jour du stock : -1 pour le nouvel objet, +1 pour l'ancien rendu.
    setObjets((stock) => {
      const nouveau = { ...stock }
      if (idObjet) nouveau[idObjet] = (nouveau[idObjet] || 0) - 1
      if (ancienObjet) nouveau[ancienObjet] = (nouveau[ancienObjet] || 0) + 1
      return nouveau
    })

    // Mise à jour du Pokémon + recalcul de ses stats.
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

  function autoEquipe() {
    const ordreRarete = { legendaire: 4, tresRare: 3, rare: 2, commun: 1 }
    // Trie les Pokémon par rareté puis niveau (les meilleurs d'abord).
    const tries = [...captures].sort((a, b) => {
      const rA = ordreRarete[a.rarete] || 0
      const rB = ordreRarete[b.rarete] || 0
      if (rB !== rA) return rB - rA
      return (b.niveau || 1) - (a.niveau || 1)
    })
    // On compose la team EN RESPECTANT la compo : 1 Tank, 1 Éclaireur, 2 Soutien, 2 DPS.
    const besoin = { ...COMPOSITION_REQUISE } // {tank:1, eclaireur:1, soutien:2, dps:2}
    const choisis = []
    const famillesPrises = new Set()
    for (const poke of tries) {
      const role = poke.role || determinerRole(poke)
      if (!besoin[role] || besoin[role] <= 0) continue // ce rôle est déjà complet
      const fam = poke.familleId ?? poke.id
      if (famillesPrises.has(fam)) continue
      famillesPrises.add(fam)
      choisis.push(poke.uid)
      besoin[role] -= 1
    }
    const manquants = Object.entries(besoin).filter(([, n]) => n > 0)
    if (manquants.length > 0) {
      const details = manquants.map(([r, n]) => `${n} ${ROLES[r].nom}`).join(', ')
      alert(`Impossible de composer une équipe complète : il te manque ${details} dans ta collection.\n\nCapture plus de Pokémon de ces rôles !`)
      return
    }
    if (!confirm(`Composer automatiquement une équipe équilibrée (1 Tank, 1 Éclaireur, 2 Soutien, 2 DPS) avec tes meilleurs Pokémon ?`)) return
    setEquipeIds(choisis)
    equipeIdsRef.current = choisis
    ajouterAuJournal(`⚡ Équipe équilibrée composée (1T/1E/2S/2D).`, 'info')
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

    // Reset des niveaux : tous les Pokémon repassent niveau 1, stats recalculées.
    setCaptures((liste) => liste.map((p) => {
      const remis = { ...p, niveau: 1, xp: 0 }
      return { ...remis, ...statsFinales(remis, BONUS_STAT_NIVEAU) }
    }))
    // Reset de la progression de zones, argent, victoires.
    setRouteActive('tutoriel')
    routeActiveRef.current = 'tutoriel'
    setVictoiresParRoute({})
    victoiresParRouteRef.current = {}
    setBossVaincus({})
    bossVaincusRef.current = {}
    setPokeDollars(0)
    // Gain de médailles (cumulées).
    setMedailles((m) => m + gain)
    ajouterAuJournal(`🏅 PRESTIGE ! +${gain} médailles. Bonne chance pour la remontée !`, 'victoire')
    setVueOuverte(null)
  }

  // Investit 1 médaille dans un bonus permanent (xp / argent / shiny).
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
          {/* Logo Midjourney s'il existe, sinon titre texte doré (fallback) */}
          <img
            src="/logo-titre.png"
            alt="Pokédle"
            className="chargement-logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; const t = e.currentTarget.nextElementSibling; if (t) t.style.display = 'block' }}
          />
          <h1 className="chargement-titre" style={{ display: 'none' }}>Pokédle</h1>

          {/* Pokéball CSS qui tourne (spinner) */}
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

  // Si la partie est prête mais que le joueur n'a pas encore de pseudo (classement en ligne),
  // on lui demande une fois. Il peut être affiché par-dessus le jeu (overlay).
  // (On ne bloque pas le jeu : c'est un overlay, mais on le montre en priorité au 1er lancement.)

  const numZone = ROUTES.findIndex((r) => r.id === routeActive) + 1
  const victoiresZone = victoiresParRoute[routeActive] || 0
  const bossOk = bossVaincus[routeActive] === true
  // Seuil de victoires avant boss, réduit par l'amélioration Stratégie (plancher 10).
  const seuilBoss = Math.max(10, COMBATS_AVANT_BOSS - niveauAmelioration(ameliorations, 'strategie'))
  const combatActuel = Math.min(victoiresZone + 1, seuilBoss)
  const progression = Math.min(100, (victoiresZone / seuilBoss) * 100)
  const pctPokedex = Math.round((pokedexVus.length / 1025) * 100)

  // --- Zones débloquées + navigation rapide ---
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

  // Nombre de récompenses de complétion disponibles (pour la pastille du HUD).
  const nbRecompensesDispo = recompensesDisponibles(new Set(pokedexVus), recompensesReclamees).length

  // Données prestige pour le panneau.
  const nbZonesPrestige = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
  const gainPrestige = medaillesGagnables(pokedexVus.length, nbZonesPrestige)
  const multisPrestige = multiplicateursPrestige(investisPrestige)

  // Le tuto (rendu commun, par-dessus tout écran principal) — défini une fois, réutilisé.
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
        return trierIdsParRole([...ids, uid], captures)
      })
    }
    function basculerAttaque(uid) {
      setEquipeAttaqueIds((ids) => {
        if (ids.includes(uid)) return ids.filter((x) => x !== uid)
        if (ids.length >= 6) return ids
        return trierIdsParRole([...ids, uid], captures)
      })
    }

    // Charger mes infos PvP + la liste des adversaires.
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

    // Publier (ou mettre à jour) ma défense.
    async function publierMaDefense() {
      if (!defenseValide) return
      setPvpPublicationEnCours(true)
      const r = await publierDefense(equipeDefense)
      setPvpPublicationEnCours(false)
      if (r.ok) {
        setPvpDefensePubliee(true)
        setPvpMessage('✓ Défense publiée !')
        setTimeout(() => setPvpMessage(''), 3000)
      } else {
        setPvpMessage('Erreur lors de la publication : ' + (r.raison || 'inconnue'))
      }
    }

    // Lancer un combat contre un adversaire.
    function attaquerAdversaire(adversaire) {
      if (!attaqueValide) return
      const equipeAdverse = reconstruireEquipeSnapshot(adversaire.equipe)
      if (!equipeAdverse || equipeAdverse.length === 0) {
        setPvpMessage('Cet adversaire n\'a pas de défense valide.')
        return
      }
      // Cap PvP : mon équipe d'attaque est ramenée à niveau 50 max (la défense l'est déjà).
      const equipeJoueurCapee = capperEquipePvp(equipeAttaque)
      setPvpCombat({ adversaire, equipeJoueur: equipeJoueurCapee, equipeAdverse })
    }

    // Fin du combat PvP : applique l'ELO et met à jour l'affichage.
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
        // Recharger la liste pour refléter les nouveaux points.
        const { lignes } = await listerDefenses(50)
        setPvpAdversaires(lignes)
      } else {
        setPvpMessage('Erreur d\'enregistrement du résultat.')
      }
    }

    // Combat en cours : on affiche l'écran de combat.
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

  // ===== ÉCRAN MODE RAID (endgame, remplace l'écran principal) =====
  if (modeJeu === 'raid') {
    const nbZonesRaid = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const equipeRaid = equipeRaidIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    const equipeRaidValide = compositionValide(equipeRaid)
    const equipeRaidDiagnostic = diagnostiqueComposition(equipeRaid)

    function basculerMembreRaid(uid) {
      setEquipeRaidIds((ids) => {
        if (ids.includes(uid)) return ids.filter((x) => x !== uid)
        if (ids.length >= 6) return ids
        return trierIdsParRole([...ids, uid], captures)
      })
    }

    // Lance un raid : vérifie compo + cooldown, charge les 3 vagues, bascule en combat.
    async function lancerRaid(raid) {
      if (!compositionValide(equipeRaid)) {
        alert('Ton équipe de raid doit être composée de 1 Tank, 1 Éclaireur, 2 Soutien et 2 DPS.')
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

    // Fin du raid : victoire → tente la capture du boss + récompenses + lance le cooldown.
    async function terminerRaid(resultat) {
      if (resultat === 'victoire' && raidActif) {
        const r = raidActif.recompense || {}
        if (r.argent) setPokeDollars((a) => a + r.argent)
        if (r.bonbons) setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + r.bonbons }))
        ajouterAuJournal(`🏆 Raid « ${raidActif.nom} » réussi ! +${r.argent || 0} 💰`, 'victoire')

        // Tentative de capture du gros boss (au taux du raid, faut une ball).
        const boss = raidActif.boss
        const dejaPossede = pokedexSpeciaux.includes(boss.id)
        // Choisit la meilleure ball dispo (master > hyper > super > poke).
        const ordreBall = ['master', 'hyper', 'super', 'poke']
        const ballDispo = ordreBall.find((b) => (balls[b] || 0) > 0)
        if (!ballDispo) {
          ajouterAuJournal(`💥 ${boss.nomFr} s'est enfui : aucune Ball pour le capturer !`, 'echec')
        } else {
          // Consomme la ball.
          setBalls((bb) => ({ ...bb, [ballDispo]: (bb[ballDispo] || 0) - 1 }))
          // Taux de capture FIXE selon la ball (Poké 2% / Super 3% / Hyper 5% / Master 100%).
          const taux = TAUX_CAPTURE_BOSS_RAID[ballDispo] ?? 0.02
          if (Math.random() < taux) {
            try {
              const pkmn = await chargerPokemon(boss.nom, false)
              const avecNiv = { ...pkmn, niveau: raidActif.niveau, xp: 0, rarete: 'special', estSpecial: true }
              const finales = statsFinales(avecNiv, BONUS_STAT_NIVEAU)
              const nouveau = { ...avecNiv, ...finales, uid: `special-${boss.id}-${Date.now()}` }
              setCaptures((c) => [...c, nouveau])
              if (!dejaPossede) setPokedexSpeciaux((s) => s.includes(boss.id) ? s : [...s, boss.id])
              ajouterAuJournal(`🌟 CAPTURE ! ${boss.nomFr} (niv ${raidActif.niveau}) rejoint ta collection !`, 'capture')
            } catch (err) {
              console.warn('Échec chargement boss raid', boss.nom, err)
            }
          } else {
            ajouterAuJournal(`💢 ${boss.nomFr} s'est libéré de la ${BALLS[ballDispo].nom} ! Reviens après le cooldown.`, 'echec')
          }
        }

        // Lance le cooldown de CE raid (1h).
        setRaidsCooldowns((cd) => ({ ...cd, [raidActif.id]: Date.now() + raidActif.cooldownMs }))
      } else if (resultat === 'defaite' && raidActif) {
        ajouterAuJournal(`💀 Raid « ${raidActif.nom} » échoué. Pas de cooldown, réessaie !`, 'echec')
      }
      setRaidActif(null)
      setVaguesRaid(null)
    }

    // Combat en cours.
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

  // ===== ÉCRAN MODE ARÈNE (remplace l'écran principal) =====
  if (modeJeu === 'arene') {
    const nbZonesArene = ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length
    const listeDresseurs = etatsDresseurs(nbZonesArene, dresseursVaincus)
    const equipeArene = equipeAreneIds.map((uid) => captures.find((p) => p.uid === uid)).filter(Boolean)
    // L'équipe d'arène doit aussi respecter la compo 1T/1E/2S/2D pour combattre.
    const equipeAreneValide = compositionValide(equipeArene)
    const equipeAreneDiagnostic = diagnostiqueComposition(equipeArene)

    function basculerMembreArene(uid) {
      setEquipeAreneIds((ids) => {
        if (ids.includes(uid)) return ids.filter((x) => x !== uid)
        if (ids.length >= 6) return ids // max 6
        return trierIdsParRole([...ids, uid], captures)
      })
    }

    // Lance un combat : charge l'équipe du dresseur puis bascule en combat.
    async function lancerCombatArene(dresseur) {
      // Sécurité : refuse si la compo d'arène n'est pas valide.
      if (!compositionValide(equipeArene)) {
        alert('Ton équipe d\'arène doit être composée de 1 Tank, 1 Éclaireur, 2 Soutien et 2 DPS pour combattre.')
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

    // Fin du combat : applique les récompenses si victoire, puis retour à la liste.
    async function terminerCombatArene(resultat) {
      if (resultat === 'victoire' && dresseurActif) {
        const r = dresseurActif.recompense
        // Champion : bonus de PokéDollars gagnés en Arène.
        if (r.argent) setPokeDollars((a) => a + Math.round(r.argent * multiplicateur(ameliorationsRef.current, 'champion')))
        if (r.bonbon) setBonbons((b) => ({ ...b, 'super-bonbon': (b['super-bonbon'] || 0) + r.bonbon }))
        if (r.objet) setObjets((o) => ({ ...o, [r.objet]: (o[r.objet] || 0) + 1 }))
        // Marquer le dresseur comme vaincu (une seule fois, débloque le suivant).
        const dejaVaincu = dresseursVaincus.includes(dresseurActif.id)
        setDresseursVaincus((v) => v.includes(dresseurActif.id) ? v : [...v, dresseurActif.id])
        ajouterAuJournal(`🏆 Arène : ${dresseurActif.nom} vaincu ! Récompense : ${decrireRecompenseDresseur(r)}`, 'victoire')
        // Pokémon spécial (boss) : débloqué la 1re fois qu'on bat ce boss.
        const special = specialDuBoss(dresseurActif.id)
        if (special && !dejaVaincu && !pokedexSpeciaux.includes(special.id)) {
          try {
            const pkmn = await chargerPokemon(special.nom, false)
            // Le spécial arrive NIVEAU 1 (à monter soi-même), comme une capture normale.
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
      }
      setDresseurActif(null)
      setEquipeDresseur(null)
    }

    // Combat en cours : on affiche l'arène de combat.
    if (dresseurActif && equipeDresseur && equipeArene.length > 0) {
      return (
        <>
          <CombatArene
            dresseur={dresseurActif}
            equipeJoueur={equipeArene}
            equipeDresseur={equipeDresseur}
            vitesse={vitesse}
            onTermine={terminerCombatArene}
            onQuitter={() => { setDresseurActif(null); setEquipeDresseur(null) }}
          />
          {renduTutoriel}
        </>
      )
    }

    // Chargement de l'équipe du dresseur.
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
        <PanneauArene
          listeDresseurs={listeDresseurs}
          equipeArene={equipeArene}
          equipeAreneIds={equipeAreneIds}
          captures={captures}
          onBasculerMembre={basculerMembreArene}
          onCombattre={lancerCombatArene}
          decrireRecompense={decrireRecompenseDresseur}
          compoValide={equipeAreneValide}
          compoDiagnostic={equipeAreneDiagnostic}
          onRetour={() => setModeJeu('principal')}
        />
        {renduTutoriel}
      </>
    )
  }

  return (
    <div className="app app-layout">

      {/* ===== TOPBAR (pleine largeur) ===== */}
      <header className="topbar">
        <div className="topbar-titre">
          <img
            src="/logo-titre.png"
            alt="Pokédle"
            className="topbar-logo"
            onError={(e) => { e.currentTarget.style.display = 'none'; const t = e.currentTarget.nextElementSibling; if (t) t.style.display = 'inline' }}
          />
          <span className="topbar-titre-texte" style={{ display: 'none' }}>Pokédle</span>
        </div>

        <div className="hud">
          <button className="hud-icone hud-icone-relative" onClick={() => setVueOuverte('pokedex')} title="Pokédex">
            {nbRecompensesDispo > 0 && <span className="hud-pastille">{nbRecompensesDispo}</span>}
            <img src="/icons/pokedex.png" alt="Pokédex" />
            <span className="hud-label">Pokédex</span>
          </button>
          <button className="hud-icone" data-tuto="equipe" onClick={() => setVueOuverte('equipe')} title="Mon équipe">
            <img src="/icons/equipe.png" alt="Équipe" />
            <span className="hud-label">Équipe</span>
          </button>
          <button className="hud-icone" data-tuto="routes" onClick={() => setVueOuverte('routes')} title="Routes">
            <img src="/icons/routes.png" alt="Routes" />
            <span className="hud-label">Routes</span>
          </button>
          <button className="hud-icone" onClick={() => setVueOuverte('stats')} title="Statistiques">
            <img src="/icons/stats.png" alt="Stats" />
            <span className="hud-label">Stats</span>
          </button>
          <button className="hud-icone" onClick={() => setVueOuverte('boutique')} title="Boutique">
            <img src="/icons/boutique.png" alt="Boutique" />
            <span className="hud-label">Shop</span>
          </button>
          <button className="hud-icone" onClick={() => setVueOuverte('sac')} title="Sac">
            <img src="/icons/sac.png" alt="Sac" />
            <span className="hud-label">Sac</span>
          </button>
          <button className="hud-icone" onClick={() => setVueOuverte('succes')} title="Succès">
            <img src="/icons/succes.png" alt="Succès" />
            <span className="hud-label">Succès</span>
          </button>
          <button className="hud-icone" onClick={() => setVueOuverte('ameliorations')} title="Améliorations">
            <img src="/icons/ameliorations.png" alt="Améliorations" />
            <span className="hud-label">Boost</span>
          </button>
          <button className="hud-icone hud-icone-relative" onClick={() => setModeJeu('arene')} title="Mode Arène">
            <span className="hud-emoji-icone">⚔️</span>
            <span className="hud-label">Arène</span>
          </button>
          <button className="hud-icone hud-icone-relative" onClick={() => setModeJeu('raid')} title="Raids (endgame)">
            <span className="hud-emoji-icone">🔥</span>
            <span className="hud-label">Raids</span>
          </button>
          <button className="hud-icone hud-icone-relative" data-tuto="pvp" onClick={() => setModeJeu('pvp')} title="Arène PvP en ligne">
            <span className="hud-emoji-icone">🥊</span>
            <span className="hud-label">PvP</span>
          </button>
          <button className="hud-icone hud-icone-relative" onClick={() => setVueOuverte('classement')} title="Classement en ligne">
            <span className="hud-emoji-icone">🏆</span>
            <span className="hud-label">Classement</span>
          </button>
          {/* PRESTIGE MASQUÉ — pour le réactiver, décommente ce bloc (retire cette ligne et la ligne de fermeture du commentaire plus bas).
          <button className="hud-icone hud-icone-relative" onClick={() => setVueOuverte('prestige')} title="Rang de Dresseur (Prestige)">
            {medailles > 0 && <span className="hud-pastille">{medailles}</span>}
            <span className="hud-emoji-icone">🏅</span>
            <span className="hud-label">Prestige</span>
          </button>
          */}
          <button className="hud-icone hud-icone-relative" onClick={() => setTutoMode('guide')} title="Aide / Guide du jeu">
            <span className="hud-emoji-icone">❓</span>
            <span className="hud-label">Aide</span>
          </button>
          <button className="hud-icone hud-reset" onClick={reinitialiser} title="Réinitialiser">
            <img src="/icons/reset.png" alt="Reset" />
            <span className="hud-label">Reset</span>
          </button>
        </div>

        <div className="topbar-infos">
          <span className="topbar-argent"><img src={ICONE_ARGENT} alt="" className="icone-inline" /> {pokeDollars}</span>
          <span className="topbar-dex">📖 {pctPokedex}%</span>
        </div>
      </header>

      {/* ===== GRILLE 3 COLONNES ===== */}
      <div className="grille-jeu">

        {/* --- COLONNE GAUCHE : aperçu équipe --- */}
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

          {/* --- QOL : Zones rapides --- */}
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

          {/* --- QOL : Achat rapide de balls --- */}
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

          {/* --- Bloc pokédex --- */}
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

        {/* --- COLONNE CENTRE : zone + arène + journal --- */}
        <main className="colonne colonne-centre" data-tuto="arene">
          <div className="bandeau-zone">
            <span className="bandeau-zone-nom">{routeParId(routeActive).nom}</span>
            <span className="bandeau-zone-num">
              <span className="bandeau-zone-numtxt">Zone {numZone}-{combatActuel}</span>
              {bossOk && <span className="bandeau-badge bandeau-badge-ok">Zone complétée</span>}
              {!bossOk && combatBoss && <span className="bandeau-badge bandeau-badge-boss">BOSS</span>}
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
              <p className="alerte-compo-sous">Le combat est en pause. Il faut exactement 1 Tank, 1 Éclaireur, 2 Soutien et 2 DPS.</p>
              <ul className="alerte-compo-liste">
                {compoDiagnostic.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          <div className={`arene ${combatBoss ? 'arene-boss' : ''}`} style={{
            backgroundImage: `url(${routeParId(routeActive).decor})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <div className="equipe-joueur">
              {equipeJoueur.map((poke, i) => (
                <CartePokemon key={poke.uid} pokemon={poke} pvActuels={pvJoueur[i]} jauge={jaugeJoueur[i]} niveau={poke.niveau} compact />
              ))}
            </div>

            <div className="vs"><img src={ICONE_COMBAT} alt="VS" className="vs-img" /></div>

            <div className="equipe-ennemie">
              {equipeEnnemie.map((poke, i) => (
                <CartePokemon key={i} pokemon={poke} pvActuels={pvEnnemis[i]} jauge={jaugeEnnemis[i]} niveau={poke.niveau} compact />
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

        {/* --- COLONNE DROITE : contrôles + ressources --- */}
        <aside className="colonne colonne-droite" data-tuto="capture">
          <div className="panneau">
            <div className="panneau-titre">
              <img src="/icons/capture.png" alt="" className="panneau-icone" /> Capture
            </div>
            <button className="bouton-regles-capture" onClick={() => setVueOuverte('regles')}>
              ⚙️ Règles de capture
            </button>
            {(() => {
              // Libellé court de chaque réglage de ball.
              const labelBall = {
                auto: 'Auto', poke: 'Poké', super: 'Super',
                hyper: 'Hyper', master: 'Master', rien: '✕ Aucune',
              }
              // Sprites officiels PokeAPI pour illustrer chaque catégorie.
              const SPR = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'
              const categories = [
                { cle: 'shiny', nom: 'Shiny', sprite: SPR + 'shiny-charm.png', emoji: '✨' },
                { cle: 'legendaire', nom: 'Légend.', sprite: SPR + 'comet-shard.png', emoji: '⭐' },
                { cle: 'nouveau', nom: 'Nouveau', sprite: SPR + 'lucky-egg.png', emoji: '🆕' },
                { cle: 'doublon', nom: 'Doublon', sprite: SPR + 'big-pearl.png', emoji: '♻️' },
              ]
              const ballsResume = [
                { cle: 'poke', nom: 'Poké Ball' },
                { cle: 'super', nom: 'Super Ball' },
                { cle: 'hyper', nom: 'Hyper Ball' },
                { cle: 'master', nom: 'Master Ball' },
              ]
              return (
                <div className="capture-resume">
                  {categories.map((c) => (
                    <div key={c.cle} className="capture-resume-ligne">
                      <span className="capture-resume-cat">
                        <img
                          src={c.sprite}
                          alt=""
                          className="capture-resume-icone"
                          onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(c.emoji)) }}
                        />
                        {c.nom}
                      </span>
                      <span className={`capture-resume-ball ${reglesCapture[c.cle] === 'rien' ? 'aucune' : ''}`}>
                        {labelBall[reglesCapture[c.cle]] || 'Auto'}
                      </span>
                    </div>
                  ))}
                  <div className="capture-resume-stock">
                    {ballsResume.map((b) => (
                      <span key={b.cle} className="capture-stock-item" title={b.nom}>
                        {ICONES_BALLS[b.cle]
                          ? <img src={ICONES_BALLS[b.cle]} alt="" className="capture-resume-icone" />
                          : null}
                        {balls[b.cle] ?? 0}
                      </span>
                    ))}
                  </div>
                </div>
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

          {!bossOk && (
            <div className="panneau">
              <div className="panneau-titre">
                <img src="/icons/progression.png" alt="" className="panneau-icone" /> Progression
              </div>
              <div className="zone-progression-barre">
                <div className="zone-progression-fill" style={{ width: `${progression}%` }}></div>
                <span className="zone-progression-texte">{Math.min(victoiresZone, seuilBoss)}/{seuilBoss} → 👑</span>
              </div>
            </div>
          )}

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

      {/* ===== ENCART DE CAPTURE (animation) ===== */}
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

      {/* ===== POP-UPS (inchangés) ===== */}
      {!identiteJoueur && (
        <ChoixPseudo onValide={(identite) => setIdentiteJoueur(identite)} />
      )}
      {vueOuverte === 'classement' && (
        <Classement onFermer={() => setVueOuverte(null)} />
      )}
      {vueOuverte === 'pokedex' && (
        <Pokedex
          pokedexVus={pokedexVus}
          pokedexShiny={pokedexShiny}
          pokedexSpeciaux={pokedexSpeciaux}
          recompensesReclamees={recompensesReclamees}
          onReclamer={reclamerRecompense}
          onFermer={() => setVueOuverte(null)}
        />
      )}
      {vueOuverte === 'equipe' && (
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
      )}
      {vueOuverte === 'routes' && (
        <MenuRoutes
          routeActive={routeActive}
          victoiresParRoute={victoiresParRoute}
          bossVaincus={bossVaincus}
          nomsVus={captures.map((p) => p.nom)}
          tableNoms={tableNoms}
          onChoisir={(id) => {
            setRouteActive(id)
            routeActiveRef.current = id
            ajouterAuJournal(`Direction ${routeParId(id).nom} ! 🗺️`, 'info')
            setVueOuverte(null)
          }}
          onFermer={() => setVueOuverte(null)}
        />
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
          nbDresseurs={dresseursVaincus.length}
          nbSpeciaux={pokedexSpeciaux.length}
          nbZones={ROUTES.filter((r) => routeDebloquee(r, bossVaincus)).length}
          totalZones={ROUTES.length}
          totalDresseurs={DRESSEURS.length}
          totalSpeciaux={SPECIAUX.length}
          onFermer={() => setVueOuverte(null)}
        />
      )}
      {vueOuverte === 'boutique' && (
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
      )}
      {vueOuverte === 'sac' && (
        <Sac
          balls={balls}
          pierres={pierres}
          bonbons={bonbons}
          collection={captures}
          onEvoluerPierre={evoluerParPierre}
          onUtiliserBonbon={utiliserBonbon}
          onFermer={() => setVueOuverte(null)}
        />
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
            nbDresseurs: dresseursVaincus.length,
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
          onAcheter={acheterAmelioration}
          onFermer={() => setVueOuverte(null)}
        />
      )}

      {/* ===== TUTORIEL (par-dessus tout) ===== */}
      {renduTutoriel}
    </div>
  )
}

export default App