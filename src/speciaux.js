// ============================================================
// POKÉMON SPÉCIAUX — récompenses des 15 boss d'arène
// Chaque boss spécial (tous les 5) débloque un Pokémon spécial unique.
// nom = identifier PokeAPI valide (chargeable via /pokemon/<nom>).
// id = numéro PokeAPI de la forme (>= 10000) pour le sprite du Pokédex.
// ============================================================

export const SPECIAUX = [
  { bossId: 'boss5', boss: 'Giovanni', nom: 'mewtwo-mega-x', nomFr: 'Mewtwo Méga X', id: 10043 },
  { bossId: 'boss10', boss: 'Archie', nom: 'kyogre-primal', nomFr: 'Kyogre Primal', id: 10077 },
  { bossId: 'boss15', boss: 'Maxie', nom: 'groudon-primal', nomFr: 'Groudon Primal', id: 10078 },
  { bossId: 'boss20', boss: 'Cyrus', nom: 'giratina-origin', nomFr: 'Giratina Origin', id: 10007 },
  { bossId: 'boss25', boss: 'Ghetsis', nom: 'kyurem-black', nomFr: 'Kyurem Noir', id: 10022 },
  { bossId: 'boss30', boss: 'Lysandre', nom: 'charizard-mega-y', nomFr: 'Dracaufeu Méga Y', id: 10035 },
  { bossId: 'boss35', boss: 'Brock', nom: 'aggron-mega', nomFr: 'Galeking Méga', id: 10053 },
  { bossId: 'boss40', boss: 'Erika', nom: 'venusaur-mega', nomFr: 'Florizarre Méga', id: 10033 },
  { bossId: 'boss45', boss: 'Sabrina', nom: 'gardevoir-mega', nomFr: 'Gardevoir Méga', id: 10051 },
  { bossId: 'boss50', boss: 'Lance', nom: 'rayquaza-mega', nomFr: 'Rayquaza Méga', id: 10079 },
  { bossId: 'boss55', boss: 'Steven', nom: 'metagross-mega', nomFr: 'Metalosse Méga', id: 10076 },
  { bossId: 'boss60', boss: 'Wallace', nom: 'gyarados-mega', nomFr: 'Léviator Méga', id: 10041 },
  { bossId: 'boss65', boss: 'Alder', nom: 'eternatus-eternamax', nomFr: 'Eternatus Eternamax', id: 10190 },
  { bossId: 'boss70', boss: 'Blue', nom: 'charizard-mega-x', nomFr: 'Dracaufeu Méga X', id: 10034 },
  { bossId: 'boss75', boss: 'Red', nom: 'mewtwo-mega-y', nomFr: 'Mewtwo Méga Y', id: 10044 },
]

// Trouve le spécial associé à un boss (ou null).
export function specialDuBoss(bossId) {
  return SPECIAUX.find((s) => s.bossId === bossId) || null
}

// URL du sprite d'un spécial (par id PokeAPI).
export function spriteSpecial(id, shiny = false) {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
  return base + (shiny ? 'shiny/' : '') + id + '.png'
}