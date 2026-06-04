// ============================================================
// RÔLES DES POKÉMON (système enrichi : 4 rôles × 3 passifs = 12 passifs)
//
// - Le RÔLE est déterminé par le TYPE du Pokémon (son "style"), pas ses stats brutes.
//   Ex: Rondoudou (Normal/Fée) = Support, même s'il a beaucoup de PV.
// - Une table ROLES_FORCES permet de corriger les cas spéciaux à la main.
// - Chaque rôle a 3 PASSIFS, choisis selon le type secondaire / le style.
// - Composition d'équipe imposée : 1 Tank, 1 Éclaireur, 2 Support, 2 DPS.
// ============================================================

// ---------- LES 4 RÔLES ----------
export const ROLES = {
  tank:       { nom: 'Tank',      emoji: '🛡️', couleur: '#5bc47f' },
  dps:        { nom: 'DPS',       emoji: '⚔️', couleur: '#ef7d57' },
  eclaireur:  { nom: 'Éclaireur', emoji: '⚡', couleur: '#ffcd75' },
  soutien:    { nom: 'Soutien',   emoji: '💚', couleur: '#41a6f6' },
}

// Composition d'équipe imposée (nombre de chaque rôle).
export const COMPOSITION_REQUISE = { tank: 1, eclaireur: 1, soutien: 2, dps: 2 }
export const TAILLE_EQUIPE = 6

// ---------- TYPE → RÔLE (la logique "style du Pokémon") ----------
// Chaque type Pokémon penche vers un rôle. On regarde le type principal d'abord.
const TYPE_VERS_ROLE = {
  // Tanks : robustes, défensifs, lourds
  rock: 'tank', steel: 'tank', ground: 'tank',
  // DPS : agressifs, puissants
  fighting: 'dps', dragon: 'dps', fire: 'dps', dark: 'dps',
  // Éclaireurs : rapides, aériens, vifs
  flying: 'eclaireur', electric: 'eclaireur', bug: 'eclaireur',
  // Supports : soigneurs, mystiques, polyvalents
  psychic: 'soutien', fairy: 'soutien', grass: 'soutien',
  water: 'soutien', normal: 'soutien', ghost: 'soutien',
  poison: 'tank', ice: 'eclaireur',
}

// ---------- TABLE D'EXCEPTIONS (à remplir à la main) ----------
// Force le rôle de certaines espèces (clé = nom PokeAPI en minuscules).
// Exemple : 'wigglytuff': 'soutien' (Grodoudou reste support malgré ses PV).
// Ajoute ici tous les Pokémon dont le rôle automatique ne te convient pas.
export const ROLES_FORCES = {
  // --- exemples (décommente / ajoute les tiens) ---
  // 'snorlax': 'tank',
  // 'wigglytuff': 'soutien',
  // 'machamp': 'dps',
  // 'alakazam': 'soutien',
}

// ---------- LES 12 PASSIFS (3 par rôle) ----------
// effet : décrit ce que le passif fait (lu par le moteur de combat).
export const PASSIFS = {
  // ===== TANK =====
  colosse: {
    nom: 'Colosse', role: 'tank', emoji: '🛡️',
    description: '+40% PV max et attire les coups',
    effet: { pvMult: 1.40, attireCoups: true },
  },
  carapace: {
    nom: 'Carapace', role: 'tank', emoji: '🐢',
    description: '+25% PV et réduit de 10% les dégâts subis par l\'équipe',
    effet: { pvMult: 1.25, attireCoups: true, reducDegatsEquipe: 0.10 },
  },
  provocateur: {
    nom: 'Provocateur', role: 'tank', emoji: '😤',
    description: 'Attire les coups et renvoie 15% des dégâts subis',
    effet: { pvMult: 1.20, attireCoups: true, renvoiDegats: 0.15 },
  },

  // ===== DPS =====
  bourrin: {
    nom: 'Bourrin', role: 'dps', emoji: '⚔️',
    description: '+30% de dégâts',
    effet: { degatsMult: 1.30 },
  },
  assassin: {
    nom: 'Assassin', role: 'dps', emoji: '🗡️',
    description: '+20% dégâts, +35% sur les cibles affaiblies (<30% PV)',
    effet: { degatsMult: 1.20, bonusExecution: 0.35 },
  },
  berserk: {
    nom: 'Berserk', role: 'dps', emoji: '🔥',
    description: '+15% dégâts, et davantage quand l\'équipe perd des membres',
    effet: { degatsMult: 1.15, degatsParAllieKO: 0.12 },
  },

  // ===== ÉCLAIREUR =====
  vif: {
    nom: 'Vif', role: 'eclaireur', emoji: '⚡',
    description: '+25% de vitesse de jauge pour toute l\'équipe',
    effet: { jaugeMult: 1.25, jaugeEquipe: 0.10 },
  },
  precurseur: {
    nom: 'Précurseur', role: 'eclaireur', emoji: '🏁',
    description: 'Commence le combat avec sa jauge à moitié pleine',
    effet: { jaugeMult: 1.20, jaugeDepart: 50 },
  },
  frenetique: {
    nom: 'Frénétique', role: 'eclaireur', emoji: '💨',
    description: '+15% vitesse, qui augmente à chaque attaque',
    effet: { jaugeMult: 1.15, jaugeMontante: 0.04 },
  },

  // ===== SOUTIEN =====
  guerisseur: {
    nom: 'Guérisseur', role: 'soutien', emoji: '💚',
    description: 'Régénère 3.5% des PV de toute l\'équipe à chaque attaque',
    effet: { regenEquipe: 0.035 },
  },
  tacticien: {
    nom: 'Tacticien', role: 'soutien', emoji: '🧠',
    description: 'Augmente de 15% les dégâts de toute l\'équipe',
    effet: { boostDegatsEquipe: 0.15 },
  },
  gardien: {
    nom: 'Gardien', role: 'soutien', emoji: '✨',
    description: 'Augmente de 20% les PV max de toute l\'équipe',
    effet: { boostPvEquipe: 0.20 },
  },
}

// ---------- TYPE → PASSIF (le "style" décide quel passif dans la classe) ----------
// Pour chaque rôle, on associe des types à un passif précis. Fallback = 1er passif du rôle.
const TYPE_VERS_PASSIF = {
  tank: {
    rock: 'carapace', steel: 'carapace',       // défensifs → réduction de dégâts
    ground: 'colosse', poison: 'provocateur',  // lourds → colosse, toxiques → provocateur
    ghost: 'provocateur',
  },
  dps: {
    fighting: 'bourrin', dragon: 'bourrin',    // force brute
    dark: 'assassin', poison: 'assassin',      // sournois → exécution
    fire: 'berserk',                           // rage
  },
  eclaireur: {
    flying: 'vif', electric: 'vif',            // vitesse d'équipe
    bug: 'precurseur',                         // démarre vite
    ice: 'frenetique', normal: 'frenetique',
  },
  soutien: {
    grass: 'guerisseur', water: 'guerisseur', fairy: 'guerisseur',  // soin
    psychic: 'tacticien',                                            // boost dégâts
    normal: 'gardien', ghost: 'gardien',                             // boost PV
  },
}

// Passif par défaut de chaque rôle (si aucun type ne matche).
const PASSIF_DEFAUT = { tank: 'colosse', dps: 'bourrin', eclaireur: 'vif', soutien: 'guerisseur' }

// ---------- FONCTIONS ----------

// Détermine le RÔLE d'un Pokémon : table d'exceptions d'abord, sinon par type.
export function determinerRole(pokemon) {
  if (!pokemon) return 'dps'
  // 1) Exception forcée par nom d'espèce ?
  const nom = (pokemon.nom || pokemon.nomEspece || '').toLowerCase()
  if (ROLES_FORCES[nom]) return ROLES_FORCES[nom]
  // 2) Par type principal.
  const types = pokemon.types || []
  for (const t of types) {
    if (TYPE_VERS_ROLE[t]) return TYPE_VERS_ROLE[t]
  }
  // 3) Fallback : DPS.
  return 'dps'
}

// Détermine le PASSIF d'un Pokémon (selon son rôle + son style/type).
export function determinerPassif(pokemon) {
  if (!pokemon) return 'bourrin'
  const role = pokemon.role || determinerRole(pokemon)
  const table = TYPE_VERS_PASSIF[role] || {}
  const types = pokemon.types || []
  for (const t of types) {
    if (table[t]) return table[t]
  }
  return PASSIF_DEFAUT[role] || 'bourrin'
}

// Renvoie l'objet passif complet (avec fallback neutre).
export function passifDe(pokemon) {
  if (!pokemon) return null
  const cle = pokemon.passif || determinerPassif(pokemon)
  return PASSIFS[cle] || null
}

// ---------- COMPATIBILITÉ avec l'ancien système (bonusDuRole) ----------
// L'ancien moteur appelait bonusDuRole(role) → on garde une version qui renvoie
// les multiplicateurs "de base" du rôle (sans passif). Le moteur enrichi utilisera
// plutôt bonusDuPassif (voir ci-dessous).
export const BONUS_ROLE = {
  tank:      { pvMult: 1.30, degatsMult: 1.0,  jaugeMult: 1.0,  regenEquipe: 0 },
  dps:       { pvMult: 1.0,  degatsMult: 1.25, jaugeMult: 1.0,  regenEquipe: 0 },
  eclaireur: { pvMult: 1.0,  degatsMult: 1.0,  jaugeMult: 1.20, regenEquipe: 0 },
  soutien:   { pvMult: 1.0,  degatsMult: 1.0,  jaugeMult: 1.0,  regenEquipe: 0.03 },
}
export function bonusDuRole(role) {
  return BONUS_ROLE[role] || { pvMult: 1, degatsMult: 1, jaugeMult: 1, regenEquipe: 0 }
}

// Renvoie l'effet chiffré du passif d'un Pokémon (fusionné avec des valeurs neutres).
// C'est CE QUE LE MOTEUR DE COMBAT DOIT UTILISER pour avoir les passifs variés.
export function bonusDuPassif(pokemon) {
  const neutre = {
    pvMult: 1, degatsMult: 1, jaugeMult: 1, regenEquipe: 0,
    attireCoups: false, reducDegatsEquipe: 0, renvoiDegats: 0,
    bonusExecution: 0, degatsParAllieKO: 0,
    jaugeEquipe: 0, jaugeDepart: 0, jaugeMontante: 0,
    boostDegatsEquipe: 0, boostPvEquipe: 0,
  }
  const p = passifDe(pokemon)
  if (!p) return neutre
  return { ...neutre, ...p.effet }
}

// ---------- HELPERS DE COMPOSITION D'ÉQUIPE ----------

// Compte les rôles présents dans une liste de Pokémon.
export function compterRoles(equipe) {
  const compte = { tank: 0, dps: 0, eclaireur: 0, soutien: 0 }
  for (const p of equipe) {
    if (!p) continue
    const role = p.role || determinerRole(p)
    if (compte[role] !== undefined) compte[role] += 1
  }
  return compte
}

// Vérifie si une équipe respecte la composition imposée (1T/1E/2S/2D).
// IMPORTANT : tant que l'équipe a MOINS de 6 Pokémon (début de partie, ex: 3 starters),
// on considère la compo valide → le joueur peut combattre librement. La règle stricte
// 1T/1E/2S/2D ne s'applique que sur une équipe complète de 6 membres.
export function compositionValide(equipe) {
  const membres = (equipe || []).filter(Boolean)
  if (membres.length < TAILLE_EQUIPE) return true // équipe incomplète → jeu libre
  const compte = compterRoles(membres)
  return (
    compte.tank === COMPOSITION_REQUISE.tank &&
    compte.eclaireur === COMPOSITION_REQUISE.eclaireur &&
    compte.soutien === COMPOSITION_REQUISE.soutien &&
    compte.dps === COMPOSITION_REQUISE.dps
  )
}

// Décrit ce qu'il manque/ce qui est en trop (pour l'UI).
// Renvoie un tableau de messages, vide si la compo est valide.
export function diagnostiqueComposition(equipe) {
  const membres = (equipe || []).filter(Boolean)
  // Équipe incomplète : pas de contrainte, on l'indique simplement.
  if (membres.length < TAILLE_EQUIPE) {
    return [`Équipe libre (${membres.length}/${TAILLE_EQUIPE}). La compo 1T/1E/2S/2D sera requise à 6 Pokémon.`]
  }
  const compte = compterRoles(membres)
  const messages = []
  for (const role of ['tank', 'eclaireur', 'soutien', 'dps']) {
    const requis = COMPOSITION_REQUISE[role]
    const actuel = compte[role]
    const labelRole = ROLES[role].nom
    if (actuel < requis) messages.push(`Il manque ${requis - actuel} ${labelRole}`)
    else if (actuel > requis) messages.push(`${actuel - requis} ${labelRole} en trop`)
  }
  return messages
}