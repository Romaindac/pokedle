// ============================================================
// tuto.js — Système de tutos contextuels (1re ouverture de chaque fenêtre).
// Stocke les tutos déjà vus dans localStorage. Chaque fenêtre a un id + un texte.
// ============================================================

const CLE_STORAGE = 'pokedle-tutos-vus'

// Textes des tutos, par id de fenêtre. Garde court et clair.
export const TUTOS = {
  equipe: {
    titre: '👥 Ton Équipe',
    lignes: [
      "Ici tu composes ton équipe de 6 Pokémon qui combattent automatiquement.",
      "Chaque Pokémon a un RÔLE (Tank, DPS, Éclaireur, Soutien) selon sa stat dominante — varie les rôles pour une équipe solide.",
      "Clique un Pokémon pour voir sa fiche : stats, IV, objet équipé et évolutions par pierre.",
    ],
  },
  boutique: {
    titre: '🛒 La Boutique',
    lignes: [
      "Achète des Poké Balls pour capturer, des pierres pour faire évoluer, et des objets à équiper.",
      "Plus la Ball est rare, plus elle capture facilement les Pokémon coriaces.",
      "L'argent se gagne en combattant : plus la zone est haute, plus ça paie.",
    ],
  },
  pokedex: {
    titre: '📕 Le Pokédex',
    lignes: [
      "Ton objectif : capturer les 1025 Pokémon ! Suis ta progression par génération.",
      "3 modes : Normal, Shiny, et Spéciaux (les méga/formes gagnées en raid et en arène).",
      "L'onglet Récompenses te donne des bonus permanents à chaque palier de complétion.",
    ],
  },
  sac: {
    titre: '🎒 Le Sac',
    lignes: [
      "Tous tes objets sont rangés ici : Balls, pierres d'évolution, objets équipables et bonbons.",
      "Les bonbons IV (gagnés en raid) augmentent les IV d'un Pokémon — clique pour les utiliser.",
    ],
  },
  routes: {
    titre: '🗺️ Les Routes',
    lignes: [
      "Voyage entre les 100 zones. Chaque zone a ses Pokémon et un boss légendaire tous les 25 combats.",
      "Tu peux cibler un boss/légendaire avec la Master Ball ⚫ pour une capture garantie au prochain combat.",
      "Les couleurs indiquent la rareté : communs, évolutions, et légendaires dorés.",
    ],
  },
  capture: {
    titre: '🎯 La Capture',
    lignes: [
      "Règle tes captures par catégorie : Shiny, Légendaire, Nouveau, Doublon — chacune sa Ball.",
      "Tu ne rates jamais une capture faute de la bonne Ball : le jeu prend la meilleure dispo.",
    ],
  },
  arene: {
    titre: '⚔️ Le Mode Arène',
    lignes: [
      "Affronte 75 dresseurs (dont 15 boss emblématiques) avec une équipe d'arène dédiée.",
      "Compo requise : 1 à 2 par rôle, les 4 rôles présents. Une victoire par dresseur.",
      "Battre un boss débloque un Pokémon SPÉCIAL (méga/forme) pour ta collection !",
    ],
  },
  raids: {
    titre: '🐉 Les Raids',
    lignes: [
      "Le défi ultime : 4 vagues d'affilée, tes PV sont conservés entre chaque (soin partiel).",
      "Compo stricte : 1 Tank, 1 Éclaireur, 2 Soutien, 2 DPS.",
      "1re fois → capture le boss spécial. Tu le refais → gagne des bonbons IV ! Chaque raid a un cooldown.",
    ],
  },
  pvp: {
    titre: '🏆 L\'Arène PvP',
    lignes: [
      "Compose une équipe de DÉFENSE (publie-la en ligne) et ATTAQUE les défenses des autres joueurs.",
      "En PvP, tous les Pokémon sont calibrés au niveau 50 : c'est la stratégie qui compte, pas le farm.",
      "Gagne des points ELO et grimpe les rangs : Bronze → Maître.",
    ],
  },
  oeufs: {
    titre: '🥚 L\'Élevage',
    lignes: [
      "Place tes œufs dans les incubateurs : ils éclosent en COMBATTANT (chaque victoire fait progresser l'incubation).",
      "C'est long (300 à 500 combats selon la rareté) mais ça progresse pendant que tu joues normalement.",
      "Les œufs ont une CHANCE DE SHINY accrue et donnent de bons IV. Trouve-en en combat, en battant des boss, ou achète-en.",
    ],
  },
}

// Renvoie l'ensemble des ids de tutos déjà vus.
export function tutosVus() {
  try {
    const brut = localStorage.getItem(CLE_STORAGE)
    return brut ? JSON.parse(brut) : []
  } catch {
    return []
  }
}

// Un tuto a-t-il déjà été vu ?
export function tutoEstVu(id) {
  return tutosVus().includes(id)
}

// Marque un tuto comme vu.
export function marquerTutoVu(id) {
  try {
    const vus = tutosVus()
    if (!vus.includes(id)) {
      vus.push(id)
      localStorage.setItem(CLE_STORAGE, JSON.stringify(vus))
    }
  } catch {
    // localStorage indisponible : on ignore (le tuto se réaffichera, pas grave)
  }
}

// Réinitialise tous les tutos (pour les revoir).
export function reinitialiserTutos() {
  try {
    localStorage.removeItem(CLE_STORAGE)
  } catch {
    // ignore
  }
}