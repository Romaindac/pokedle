// ============================================================
// ULTIMES — une capacité spéciale par RÔLE (4 ultimes).
//
// La jauge d'ultime d'un Pokémon se remplit quand il ATTAQUE.
// Pleine après COUT_ULTIME attaques. Déclenchement au choix (auto ou clic).
//
// Chaque ultime a un EFFET appliqué dans le moteur de combat :
//   - tank      → 'bouclier'   : réduit les dégâts subis par l'équipe pendant X tics
//   - dps       → 'deflagration': gros dégâts immédiats sur l'ennemi actif
//   - eclaireur → 'tempo'      : remplit les jauges ATB de toute l'équipe
//   - soutien   → 'soin'       : gros soin immédiat à toute l'équipe
// ============================================================

// Nombre d'attaques pour remplir la jauge d'ultime.
export const COUT_ULTIME = 8

// Durée (en tics de combat) de l'effet de bouclier du Tank.
export const DUREE_BOUCLIER = 30

export const ULTIMES = {
  tank: {
    nom: 'Rempart',
    emoji: '🛡️',
    role: 'tank',
    description: 'Réduit fortement les dégâts subis par toute l\'équipe pendant un moment.',
    effet: 'bouclier',
    reduction: 0.5,        // -50% dégâts subis
    duree: DUREE_BOUCLIER,
    couleur: '#41a6f6',
  },
  dps: {
    nom: 'Déflagration',
    emoji: '💥',
    role: 'dps',
    description: 'Inflige immédiatement de gros dégâts à l\'ennemi actif.',
    effet: 'deflagration',
    multiplicateur: 4,     // ×4 l'attaque, d'un coup
    couleur: '#ef7d57',
  },
  eclaireur: {
    nom: 'Tempo',
    emoji: '⚡',
    role: 'eclaireur',
    description: 'Remplit instantanément les jauges d\'action de toute l\'équipe.',
    effet: 'tempo',
    couleur: '#ffcd75',
  },
  soutien: {
    nom: 'Vague de soin',
    emoji: '💚',
    role: 'soutien',
    description: 'Rend immédiatement une grande partie des PV à toute l\'équipe.',
    effet: 'soin',
    soin: 0.5,             // +50% PV max à chacun
    couleur: '#5bc47f',
  },
}

// Renvoie l'ultime correspondant à un rôle (ou null).
export function ultimeDuRole(role) {
  return ULTIMES[role] || null
}

// Renvoie l'ultime d'un Pokémon (selon son rôle effectif fourni).
export function ultimeDePokemon(pokemon, role) {
  const r = role || (pokemon && pokemon.role) || 'dps'
  return ULTIMES[r] || null
}