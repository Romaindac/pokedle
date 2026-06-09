// difficulte.js - Courbe de difficulte exponentielle des zones (boucle prestige).
// Les ennemis des zones hautes voient leurs stats multipliees par un facteur croissant.
// Cree des "murs" qu'on ne peut franchir qu'avec le bonus Puissance du prestige.
// Conception : 1er mur vers zone 18, puis murs reguliers -> ~12 prestiges sur 100 zones.

// Zone a partir de laquelle la difficulte commence a grimper (early tranquille avant).
const ZONE_DEBUT_MUR = 12
// Base exponentielle (1.038 = +3.8% de stats ennemi par zone au-dela du debut).
const BASE_EXPO = 1.038

// Multiplicateur applique aux stats des ennemis d'une zone (PV + attaque).
// numeroZone : 1..100 (position de la zone, pas son id).
export function multiplicateurDifficulte(numeroZone) {
  const z = numeroZone || 1
  if (z <= ZONE_DEBUT_MUR) return 1
  return Math.pow(BASE_EXPO, z - ZONE_DEBUT_MUR)
}

// Donne la position (1..100) d'une zone a partir de son index dans la liste des routes.
// (Helper : si on a deja l'index, on peut l'utiliser directement.)
export function positionZone(index) {
  return (index || 0) + 1
}