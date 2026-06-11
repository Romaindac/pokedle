// difficulte.js - Facteur de stats des ennemis ("stuff ennemi").
//
// PHILOSOPHIE (rework equilibrage profond) :
// Le joueur cumule beaucoup de bonus (Puissance prestige+boutique, IV,
// objets, passifs, synergies) -> un Pokemon full-stuff a ~x2.3 les stats
// de base de son niveau. Les ENNEMIS n'avaient pas l'equivalent, donc
// l'ecart de niveau ne comptait plus (on battait des niv 150 avec des 96).
//
// SOLUTION : les ennemis recoivent un "facteur stuff" qui imite le stuff
// moyen d'un joueur de leur niveau (~x2.0). Ainsi :
//   - un ennemi a TON niveau = vrai defi (combat serre)
//   - l'ecart de NIVEAU redevient determinant (+25 niveaux = tu perds)
//   - chaque zone reste coherente avec ta progression
//
// Centralise l'equilibrage de TOUS les modes : Histoire, Arene, Raids.

// ===== HISTOIRE (zones) =====
// Facteur stuff de base (zone 1). Legerement en faveur du joueur au debut.
const FACTEUR_BASE = 1.85
// Montee par zone (+0.6% de stats ennemi par zone).
const FACTEUR_PAR_ZONE = 0.006
// Plafond dur : les ennemis ne depassent jamais x2.4 (pas de mur infini).
const FACTEUR_PLAFOND = 2.4

// Multiplicateur de stats applique aux ennemis d'une zone (PV + attaque).
// numeroZone : 1..100 (position de la zone, pas son id).
export function multiplicateurDifficulte(numeroZone) {
  const z = numeroZone || 1
  return Math.min(FACTEUR_PLAFOND, FACTEUR_BASE + z * FACTEUR_PAR_ZONE)
}

// Donne la position (1..100) d'une zone a partir de son index dans la liste des routes.
export function positionZone(index) {
  return (index || 0) + 1
}

// ===== ARENE (dresseurs) =====
// Les dresseurs d'arene n'ont pas de "zone". On leur donne un facteur
// stuff fixe, equilibre serre (~x2.0) pour que le combat depende du
// niveau et de l'optimisation, comme l'Histoire. Le Pokemon "special"
// du dresseur (dernier de l'equipe) est deja booste en niveau (+15)
// cote App.jsx, donc il reste le plus dur sans bonus supplementaire ici.
const FACTEUR_STUFF_ARENE = 2.0

export function facteurStuffArene() {
  return FACTEUR_STUFF_ARENE
}

// ===== RAIDS (contenu coop endgame) =====
// Les raids sont du contenu difficile, censes se faire avec une bonne
// equipe. Les vagues normales recoivent un facteur stuff un peu plus
// eleve que l'Histoire (x2.1). Le BOSS de raid garde son systeme propre
// (FORCE_BOSS_RAID_PV/ATK cote raids.js) et recoit en plus ce facteur
// pour rester un mur d'equipe coherent.
const FACTEUR_STUFF_RAID = 2.1

export function facteurStuffRaid() {
  return FACTEUR_STUFF_RAID
}