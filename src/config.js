// Toutes les valeurs d'équilibrage du jeu au même endroit.

export const DIVISEUR_DEGATS_JOUEUR = 6
export const DIVISEUR_DEGATS_ENNEMI = 6
export const VITESSE_COMBAT = 1000
export const PAUSE_RESPAWN = 1200
export const FORCE_ENNEMIS = 0.8 // multiplie PV et attaque des ennemis (1 = normal, +grand = plus durs)

export const ENNEMIS_POSSIBLES = [
  'pidgey', 'rattata', 'caterpie', 'weedle', 'spearow', 'zubat',
]

export const GAIN_PAR_VICTOIRE = 10    // (ancien gain fixe — gardé pour compat, le gain est désormais dynamique)
export const GAIN_BASE_ENNEMI = 1      // argent gagné = somme sur l'équipe ennemie de (1 × niveau × multi_rareté)

// ===== MALUS D'OR ANTI-SURCLASSEMENT (Levier B, style jeux idle pro) =====
// Si ton équipe surclasse largement la zone (ex: niveau 60 en zone niveau 29),
// l'or gagné est réduit : farmer des ennemis trop faibles ne doit pas payer plein pot.
// Ça ne punit PAS le joueur qui progresse normalement (équipe ~niveau de la zone).
//   ratio = niveau_moyen_equipe / niveau_moyen_ennemis
//   - ratio <= SEUIL_OK       → plein or (×1)
//   - ratio >= SEUIL_MAX      → or plancher (×PLANCHER)
//   - entre les deux          → interpolation linéaire
export const SURCLASSEMENT_SEUIL_OK = 1.3    // jusqu'à +30% de niveau = encore plein or
export const SURCLASSEMENT_SEUIL_MAX = 2.5   // à partir de ×2.5 le niveau ennemi = or minimal
export const SURCLASSEMENT_PLANCHER = 0.15   // on garde au moins 15% de l'or (jamais 0)

// Renvoie le multiplicateur d'or (entre PLANCHER et 1) selon l'écart de niveau.
export function multiplicateurSurclassement(niveauMoyenEquipe, niveauMoyenEnnemis) {
  if (!niveauMoyenEnnemis || niveauMoyenEnnemis <= 0) return 1
  const ratio = niveauMoyenEquipe / niveauMoyenEnnemis
  if (ratio <= SURCLASSEMENT_SEUIL_OK) return 1
  if (ratio >= SURCLASSEMENT_SEUIL_MAX) return SURCLASSEMENT_PLANCHER
  // interpolation linéaire entre les deux seuils
  const t = (ratio - SURCLASSEMENT_SEUIL_OK) / (SURCLASSEMENT_SEUIL_MAX - SURCLASSEMENT_SEUIL_OK)
  return 1 - t * (1 - SURCLASSEMENT_PLANCHER)
}
export const PRIX_POKEBALL = 5
export const TAUX_CAPTURE = 0.5

// Équipe de départ du joueur (noms PokeAPI).
export const EQUIPE_DEPART = [
  'bulbasaur', 'charmander', 'squirtle', 'pikachu', 'machop', 'clefairy',
]
export const VITESSE_JAUGE = 0.3 // multiplie la vitesse → vitesse de remplissage des jauges
export const XP_PAR_VICTOIRE = 90      // (ancienne valeur fixe — plus utilisée, l'XP est calculée selon l'ennemi)
export const XP_BASE_ENNEMI = 6        // XP de base par niveau d'ennemi (ralenti 10→6 pour une run 10-20h)
export const BONUS_STAT_NIVEAU = 0.06  // +6% de stats par niveau (était 0.08, calmé pour des chiffres plus sains)
export const XP_BASE_NIVEAU = 20       // XP niveau 1→2 (courbe marathon : exposant 1.7 dans stats.js)
// Taux de capture de base selon la rareté du Pokémon.
// Légendaire à 4% : avec Hyper Ball (×2.5) = 10% → ~10 balls en moyenne (vrai défi, pas frustrant).
// MasterBall reste le luxe garanti (capture sûre) pour ne jamais rater un légendaire important.
export const TAUX_CAPTURE_RARETE = { commun: 0.35, rare: 0.20, tresRare: 0.10, legendaire: 0.04 }

// ===== PRIX DYNAMIQUES (style PokéClicker) =====
// Le prix d'un item (pierres, bonbons, objets — PAS les balls) monte à chaque
// achat et est plafonné. Il rebaisse d'un cran à chaque boss de zone vaincu.
//   prix = prixBase × FACTEUR_PRIX_DYNAMIQUE ^ (nb achats), plafonné à ×MAX
export const FACTEUR_PRIX_DYNAMIQUE = 1.6   // +60% par achat
export const PALIER_PRIX_MAX = 4            // plafond : le prix ne dépasse jamais ×4 le prix de base

// Calcule le prix actuel d'un item selon le nombre d'achats déjà faits.
export function prixDynamique(prixBase, nbAchats) {
  const mult = Math.min(PALIER_PRIX_MAX, Math.pow(FACTEUR_PRIX_DYNAMIQUE, nbAchats || 0))
  return Math.round(prixBase * mult)
}

// Les 4 types de Poké Balls : prix + multiplicateur de capture (Infinity = garanti).
// Prix FIXES (pas de prix dynamique sur les balls). Revus pour l'équilibrage.
// URL de base des sprites d'objets officiels (repo PokeAPI).
export const SPRITE_ITEM = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'

export const BALLS = {
  poke:   { nom: 'Poké Ball',   emoji: '🔴', sprite: SPRITE_ITEM + 'poke-ball.png',   prix: 20,      multi: 1 },
  super:  { nom: 'Super Ball',  emoji: '🔵', sprite: SPRITE_ITEM + 'great-ball.png',  prix: 2500,    multi: 1.5 },
  hyper:  { nom: 'Hyper Ball',  emoji: '🟡', sprite: SPRITE_ITEM + 'ultra-ball.png',  prix: 10000,   multi: 2.5 },
  master: { nom: 'Master Ball', emoji: '⚫', sprite: SPRITE_ITEM + 'master-ball.png', prix: 1000000, multi: Infinity },
}

// Quelle ball le mode auto choisit selon la rareté.
// Légendaire → hyper (PAS master) : l'auto ne gaspille plus les précieuses MasterBalls
// sur les légendaires normaux. La MasterBall se réserve manuellement (règles de capture)
// pour les légendaires importants ou les shiny qu'on ne veut pas risquer.
export const BALL_AUTO_PAR_RARETE = { commun: 'poke', rare: 'super', tresRare: 'hyper', legendaire: 'hyper' }
// Taux de chance qu'un Pokémon rencontré soit shiny, selon sa rareté.
// Plus le Pokémon est rare, plus son shiny est "accessible" (option B).
// Valeurs RÉDUITES (le shiny doit rester un vrai événement, même boosté par le Charme Chroma).
export const TAUX_SHINY = {
  commun: 1 / 8192,
  rare: 1 / 4000,
  tresRare: 1 / 1500,
  legendaire: 1 / 400,
}


// Les pierres d'évolution (clé = nom PokeAPI de l'objet).
// NE DROPPENT PLUS en combat : achetables UNIQUEMENT en boutique (prix dynamique).
// Prix de base relevés (ressource précieuse maintenant qu'elle ne tombe plus).
export const PIERRES = {
  'fire-stone':     { nom: 'Pierre Feu',    emoji: '🔥', sprite: SPRITE_ITEM + 'fire-stone.png',    prix: 400 },
  'water-stone':    { nom: 'Pierre Eau',    emoji: '💧', sprite: SPRITE_ITEM + 'water-stone.png',   prix: 400 },
  'thunder-stone':  { nom: 'Pierre Foudre', emoji: '⚡', sprite: SPRITE_ITEM + 'thunder-stone.png', prix: 400 },
  'leaf-stone':     { nom: 'Pierre Plante', emoji: '🍃', sprite: SPRITE_ITEM + 'leaf-stone.png',    prix: 400 },
  'moon-stone':     { nom: 'Pierre Lune',   emoji: '🌙', sprite: SPRITE_ITEM + 'moon-stone.png',    prix: 400 },
  'sun-stone':      { nom: 'Pierre Soleil', emoji: '☀️', sprite: SPRITE_ITEM + 'sun-stone.png',     prix: 400 },
  'shiny-stone':    { nom: 'Pierre Éclat',  emoji: '✨', sprite: SPRITE_ITEM + 'shiny-stone.png',   prix: 700 },
  'dusk-stone':     { nom: 'Pierre Nuit',   emoji: '🌑', sprite: SPRITE_ITEM + 'dusk-stone.png',    prix: 700 },
  'dawn-stone':     { nom: 'Pierre Aube',   emoji: '🌅', sprite: SPRITE_ITEM + 'dawn-stone.png',    prix: 700 },
  'ice-stone':      { nom: 'Pierre Glace',  emoji: '❄️', sprite: SPRITE_ITEM + 'ice-stone.png',     prix: 400 },
}

// Les bonbons (objets qui boostent un Pokémon).
export const BONBONS = {
  'bonbon': { nom: 'Bonbon', emoji: '🍬', sprite: SPRITE_ITEM + 'rare-candy.png', prix: 100, effet: 'xp', valeur: 50, description: '+50 XP à un Pokémon' },
  'super-bonbon': { nom: 'Super Bonbon', emoji: '🍫', sprite: SPRITE_ITEM + 'rare-candy.png', prix: 400, effet: 'niveau', valeur: 1, description: '+1 niveau direct' },
}