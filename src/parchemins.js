// ============================================================
// PARCHEMINS DE RÔLE — objets endgame (consommables, très chers)
// Utilisés sur un Pokémon pour FORCER son rôle (pokemon.roleForce).
// - 4 Parchemins : forcent Tank / DPS / Éclaireur / Soutien.
// - 1 Sceau du Joker : transforme le Pokémon en Joker (rôle flexible), le plus cher.
// Sources : boutique (prix en millions) + drop rare en raid.
// ============================================================

import { SPRITE_ITEM } from './config'

export const PARCHEMINS = {
  'parchemin-tank': {
    nom: 'Parchemin du Gardien', emoji: '🛡️', role: 'tank',
    sprite: SPRITE_ITEM + 'adamant-orb.png',
    prix: 7500000,
    description: 'Transforme définitivement le rôle d\'un Pokémon en Tank.',
  },
  'parchemin-dps': {
    nom: 'Parchemin du Bourreau', emoji: '⚔️', role: 'dps',
    sprite: SPRITE_ITEM + 'comet-shard.png',
    prix: 7500000,
    description: 'Transforme définitivement le rôle d\'un Pokémon en DPS.',
  },
  'parchemin-eclaireur': {
    nom: 'Parchemin du Vent', emoji: '⚡', role: 'eclaireur',
    sprite: SPRITE_ITEM + 'lustrous-orb.png',
    prix: 7500000,
    description: 'Transforme définitivement le rôle d\'un Pokémon en Éclaireur.',
  },
  'parchemin-soutien': {
    nom: 'Parchemin du Sage', emoji: '💚', role: 'soutien',
    sprite: SPRITE_ITEM + 'soul-dew.png',
    prix: 7500000,
    description: 'Transforme définitivement le rôle d\'un Pokémon en Soutien.',
  },
  'sceau-joker': {
    nom: 'Sceau du Joker', emoji: '🃏', role: 'joker',
    sprite: SPRITE_ITEM + 'relic-crown.png',
    prix: 30000000,
    description: 'Transforme un Pokémon en JOKER : il peut occuper n\'importe quelle case et accède aux passifs Joker.',
  },
}

// Liste pratique (avec la clé) pour l'affichage en boutique.
export function listeParchemins() {
  return Object.entries(PARCHEMINS).map(([cle, p]) => ({ cle, ...p }))
}

// Le rôle forcé par un parchemin (ou null si la clé est inconnue).
export function roleDuParchemin(cle) {
  return PARCHEMINS[cle] ? PARCHEMINS[cle].role : null
}

// Formatte un prix en millions pour l'affichage (ex: "7,5 M").
export function formaterPrixParchemin(prix) {
  if (prix >= 1000000) {
    const m = prix / 1000000
    return `${m.toString().replace('.', ',')} M`
  }
  return prix.toLocaleString('fr-FR')
}