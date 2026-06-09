// ============================================================
// tuto.js — Systeme de tutos de Pokedle (refondu).
// - TUTOS : bulles contextuelles a la 1re ouverture de chaque fenetre.
// - COUPS_DE_POUCE : conseils declenches par un evenement de jeu.
// Tout est memorise dans localStorage (vu une seule fois).
// Textes volontairement TRES simples (clairs pour un grand debutant).
// Chaque tuto a un sprite Pokemon thematique (anime Showdown + repli PokeAPI).
// ============================================================

const CLE_STORAGE = 'pokedle-tutos-vus'

// Helpers sprites : anime (Showdown) avec repli fixe (PokeAPI).
function showdown(nom) { return `https://play.pokemonshowdown.com/sprites/ani/${nom}.gif` }
function pokeapi(id) { return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png` }

// ------------------------------------------------------------
// 1) BULLES CONTEXTUELLES (1re ouverture d'une fenetre)
//    Chaque entree : titre + lignes courtes + sprite thematique.
// ------------------------------------------------------------
export const TUTOS = {
  equipe: {
    titre: 'Ton Equipe',
    emoji: '👥',
    sprite: showdown('lucario'), spriteRepli: pokeapi(448),
    lignes: [
      "Ton equipe, c'est 6 Pokemon qui se battent tout seuls pour toi.",
      "Chaque Pokemon a un ROLE : Tank (encaisse), DPS (frappe fort), Eclaireur (rapide), Soutien (soigne).",
      "Le bon melange : 1 Tank, 1 Eclaireur, 2 Soutien, 2 DPS. Le bouton Auto le fait pour toi !",
      "Clique un Pokemon pour voir ses details et le faire evoluer.",
    ],
  },
  boutique: {
    titre: 'La Boutique',
    emoji: '🛒',
    sprite: showdown('meowth'), spriteRepli: pokeapi(52),
    lignes: [
      "C'est ici que tu depenses ton argent.",
      "Achete des Poke Balls pour capturer, des pierres pour faire evoluer, et des objets a porter.",
      "Plus une Ball est rare, plus elle attrape facilement les Pokemon difficiles.",
    ],
  },
  pokedex: {
    titre: 'Le Pokedex',
    emoji: '📕',
    sprite: showdown('rotom'), spriteRepli: pokeapi(479),
    lignes: [
      "Ton grand objectif : attraper les 1025 Pokemon !",
      "Tu peux voir ta progression generation par generation.",
      "L'onglet Recompenses te donne des bonus permanents quand tu en attrapes beaucoup.",
    ],
  },
  sac: {
    titre: 'Le Sac',
    emoji: '🎒',
    sprite: showdown('delibird'), spriteRepli: pokeapi(225),
    lignes: [
      "Tous tes objets sont ranges ici : Balls, pierres, objets a porter, bonbons.",
      "Les bonbons donnent de l'XP ou montent un niveau d'un coup.",
      "Les bonbons IV (gagnes en raid) ameliorent la qualite d'un Pokemon.",
    ],
  },
  routes: {
    titre: 'Les Routes',
    emoji: '🗺️',
    sprite: showdown('pidgeot'), spriteRepli: pokeapi(18),
    lignes: [
      "Voyage entre les 100 zones du jeu. Chaque zone a ses Pokemon.",
      "Apres assez de victoires, un BOSS apparait. Le battre debloque la zone suivante.",
      "Tu peux viser un boss avec la Master Ball pour une capture garantie.",
    ],
  },
  capture: {
    titre: 'La Capture',
    emoji: '🎯',
    sprite: showdown('machamp'), spriteRepli: pokeapi(68),
    lignes: [
      "Tu choisis quoi attraper : Shiny, Legendaire, Nouveau, Doublon.",
      "Pour chaque categorie, tu dis quelle Ball utiliser (ou de ne pas capturer).",
      "Tu ne rates jamais une capture : si la Ball manque, le jeu prend la meilleure dispo.",
    ],
  },
  arene: {
    titre: 'Le Mode Arene',
    emoji: '⚔️',
    sprite: showdown('machamp'), spriteRepli: pokeapi(68),
    lignes: [
      "Affronte 75 dresseurs, du plus faible au plus fort, avec une equipe dediee.",
      "Il faut une equipe valide : 1 a 2 par role, les 4 roles presents.",
      "Battre un boss d'arene debloque un Pokemon SPECIAL pour ta collection !",
    ],
  },
  raids: {
    titre: 'Les Raids',
    emoji: '🐉',
    sprite: showdown('rayquaza'), spriteRepli: pokeapi(384),
    lignes: [
      "Le defi ultime : 4 vagues d'affilee sans tout soigner entre chaque.",
      "Compo stricte : 1 Tank, 1 Eclaireur, 2 Soutien, 2 DPS.",
      "1re fois = tu peux capturer le boss. Ensuite = des bonbons IV. Chaque raid a un temps de recharge.",
    ],
  },
  pvp: {
    titre: "L'Arene PvP",
    emoji: '🏆',
    sprite: showdown('mewtwo'), spriteRepli: pokeapi(150),
    lignes: [
      "Tu poses une equipe de DEFENSE, et tu ATTAQUES celles des autres joueurs.",
      "Tous les Pokemon sont mis au niveau 50 : c'est la strategie qui compte, pas le farm.",
      "Gagne des points et grimpe les rangs : Bronze jusqu'a Maitre.",
    ],
  },
  oeufs: {
    titre: "L'Elevage",
    emoji: '🥚',
    sprite: showdown('togepi'), spriteRepli: pokeapi(175),
    lignes: [
      "Mets un oeuf dans un incubateur : il eclot en COMBATTANT (chaque victoire le fait avancer).",
      "C'est long, mais ca avance pendant que tu joues normalement.",
      "Les oeufs ont plus de chance de donner un shiny et de bons IV.",
      "Tu en trouves en combat, en battant des boss, ou tu en achetes avec des jetons.",
    ],
  },
  // ---- Nouvelles features (ajoutees a la refonte) ----
  tour: {
    titre: 'La Tour Infinie',
    emoji: '🗼',
    sprite: showdown('dragonite'), spriteRepli: pokeapi(149),
    lignes: [
      "Monte les etages de la Tour : chaque etage est un combat de plus en plus dur.",
      "Tu gagnes des CARTES a collectionner (certaines tres rares !) et de l'ADN de Fusion.",
      "Si tu perds, tu recommences en bas, mais tu gardes tes cartes. Jusqu'ou iras-tu ?",
    ],
  },
  fusion: {
    titre: 'Le Centre de Fusion',
    emoji: '✨',
    sprite: showdown('mew'), spriteRepli: pokeapi(151),
    lignes: [
      "Combine deux Pokemon pour en creer une FUSION unique, avec les meilleures stats des deux.",
      "Ca coute de l'ADN de Fusion, gagne dans la Tour Infinie.",
      "Se debloque apres 3 prestiges. Les fusions ont des sprites faits main !",
    ],
  },
  prestige: {
    titre: 'Le Prestige',
    emoji: '👑',
    sprite: showdown('arceus'), spriteRepli: pokeapi(493),
    lignes: [
      "Quand tes Pokemon n'avancent plus, le Prestige te fait recommencer... mais plus fort !",
      "Tu repars a zero (niveaux, zones, argent) MAIS tu gardes ton Pokedex et tes shinies.",
      "Tu gagnes des Medailles a investir en bonus permanents (puissance, XP, argent, shiny).",
      "Investir en Puissance debloque aussi plus de niveaux max. C'est le coeur du jeu !",
    ],
  },
  boost: {
    titre: 'Les Ameliorations',
    emoji: '⚡',
    sprite: showdown('ampharos'), spriteRepli: pokeapi(181),
    lignes: [
      "Achete des bonus PERMANENTS avec ton argent.",
      "Plus d'XP, plus d'argent, captures plus faciles, combats plus rapides...",
      "Chaque amelioration a 10 niveaux : monte celles qui collent a ton style de jeu.",
      "C'est le meilleur moyen d'accelerer ta progression sur le long terme.",
    ],
  },
  stats: {
    titre: 'Tes Statistiques',
    emoji: '📊',
    sprite: showdown('porygon'), spriteRepli: pokeapi(137),
    lignes: [
      "Un resume de toute ta progression : Pokemon attrapes, shinies, boss battus, zones...",
      "Tu vois aussi tes dresseurs d'arene vaincus et tes Pokemon speciaux obtenus.",
      "Pratique pour voir d'un coup d'oeil ou tu en es. C'est aussi ici que tu changes ton pseudo.",
    ],
  },
  succes: {
    titre: 'Les Succes',
    emoji: '🏆',
    sprite: showdown('victini'), spriteRepli: pokeapi(494),
    lignes: [
      "Des objectifs a accomplir (attraper X Pokemon, battre des boss, explorer des zones...).",
      "Chaque succes te donne une recompense : argent, Balls, pierres, ou bonus permanents.",
      "Ils se valident tout seuls des que tu remplis la condition. Vise-les pour booster ta partie !",
    ],
  },
  classement: {
    titre: 'Le Classement',
    emoji: '🥇',
    sprite: showdown('alakazam'), spriteRepli: pokeapi(65),
    lignes: [
      "Compare-toi aux autres joueurs en ligne : Pokemon attrapes, shinies, zones, points PvP.",
      "Ton score s'envoie tout seul pendant que tu joues.",
      "Choisis un pseudo (menu Stats) et grimpe le classement !",
    ],
  },
  sauvegarde: {
    titre: 'La Sauvegarde',
    emoji: '💾',
    sprite: showdown('magnezone'), spriteRepli: pokeapi(462),
    lignes: [
      "Ta partie se sauvegarde toute seule dans ton navigateur, en continu.",
      "Chaque slot a sa propre sauvegarde : tu peux mener 3 aventures en parallele.",
      "Ici tu peux aussi revoir tous les tutos depuis le debut si tu veux te rafraichir la memoire.",
    ],
  },
}

// ------------------------------------------------------------
// 2) VISITE GUIDEE COURTE (au tout debut, l'essentiel seulement)
//    Le reste est explique en contextuel (bulles ci-dessus).
//    cible = valeur data-tuto a surligner (null = pas de surlignage).
// ------------------------------------------------------------
export const VISITE_COURTE = [
  {
    cible: 'arene',
    titre: 'Bienvenue, Dresseur !',
    texte: "Ici, ton equipe se bat TOUTE SEULE contre les Pokemon sauvages. Tu n'as rien a faire : regarde les barres de vie descendre ! A chaque victoire, tu gagnes de l'XP et de l'argent.",
  },
  {
    cible: 'capture',
    titre: 'Attrape-les !',
    texte: "Quand un Pokemon sauvage est battu, tu peux le capturer avec une Ball. Ici tu regles quoi attraper. Pas de panique : si tu manques de la bonne Ball, le jeu prend la meilleure dispo automatiquement.",
  },
  {
    cible: 'achat',
    titre: 'Achete des Balls',
    texte: "Pas de Balls = pas de captures. Ici, tu en achetes vite (+1, +10, +100) avec ton argent gagne au combat.",
  },
  {
    cible: 'equipe',
    titre: 'Ton equipe',
    texte: "Tes 6 combattants sont la. Ouvre le menu Equipe pour les changer, voir leurs stats et les faire evoluer. Astuce : le bouton Auto compose une bonne equipe pour toi.",
  },
  {
    cible: 'routes',
    titre: 'Change de zone',
    texte: "Quand tu te sens pret, va dans les Routes pour explorer de nouvelles zones. Apres assez de victoires, un BOSS apparait : bats-le pour debloquer la zone suivante !",
  },
  {
    cible: null,
    titre: 'A toi de jouer !',
    texte: "C'est parti ! Laisse ton equipe combattre, attrape tes premiers Pokemon, et explore les menus a ton rythme. Les autres options (Arene, Tour, Elevage...) te seront expliquees quand tu les ouvriras. Tu peux revoir tout ca via le bouton Aide. Bonne aventure !",
  },
]

// ------------------------------------------------------------
// 3) COUPS DE POUCE (conseils declenches par un evenement)
//    id : identifiant unique (memorise comme vu).
//    titre + texte : le conseil. emoji : illustration.
//    Le declenchement se fait dans App.jsx (Lot 2).
// ------------------------------------------------------------
export const COUPS_DE_POUCE = {
  premier_boss: {
    id: 'cp_premier_boss',
    emoji: '⚠️',
    titre: 'Un Boss approche !',
    texte: "Tu as fait assez de victoires : le BOSS de la zone va apparaitre. Il est costaud et tu as un temps limite pour le battre. Gagne pour debloquer la zone suivante !",
  },
  premier_shiny: {
    id: 'cp_premier_shiny',
    emoji: '✨',
    titre: 'Un Shiny !',
    texte: "Felicitations, tu as un Pokemon SHINY (version doree, tres rare) ! Ils sont magnifiques et comptent a part dans ton Pokedex. Garde-les precieusement.",
  },
  plafond_niveau: {
    id: 'cp_plafond_niveau',
    emoji: '👑',
    titre: 'Tu as atteint le Mur !',
    texte: "Tes Pokemon ne peuvent plus monter de niveau. Pour devenir plus fort, fais un PRESTIGE : tu recommences mais tu gagnes des Medailles qui te rendent durablement plus puissant.",
  },
  premiere_evolution: {
    id: 'cp_premiere_evolution',
    emoji: '🌟',
    titre: 'Evolution !',
    texte: "Un de tes Pokemon a evolue ! Il devient plus fort et garde ses IV. Certains evoluent au niveau, d'autres avec une pierre (a acheter en boutique).",
  },
  premier_oeuf: {
    id: 'cp_premier_oeuf',
    emoji: '🥚',
    titre: 'Tu as trouve un oeuf !',
    texte: "Direction le Centre d'Elevage : place-le dans un incubateur. Il eclora au fil de tes combats et pourra donner un shiny avec de bons IV !",
  },
}

// ============================================================
// API de memorisation (inchangee : compatible avec l'existant)
// ============================================================

// Renvoie l'ensemble des ids deja vus.
export function tutosVus() {
  try {
    const brut = localStorage.getItem(CLE_STORAGE)
    return brut ? JSON.parse(brut) : []
  } catch {
    return []
  }
}

// Un tuto / coup de pouce a-t-il deja ete vu ?
export function tutoEstVu(id) {
  return tutosVus().includes(id)
}

// Marque un tuto / coup de pouce comme vu.
export function marquerTutoVu(id) {
  try {
    const vus = tutosVus()
    if (!vus.includes(id)) {
      vus.push(id)
      localStorage.setItem(CLE_STORAGE, JSON.stringify(vus))
    }
  } catch {
    // localStorage indisponible : on ignore
  }
}

// Reinitialise tous les tutos (pour les revoir).
export function reinitialiserTutos() {
  try {
    localStorage.removeItem(CLE_STORAGE)
  } catch {
    // ignore
  }
}