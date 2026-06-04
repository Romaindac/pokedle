// ============================================================
// OBJETS ÉQUIPABLES
// Chaque Pokémon peut équiper 1 objet (champ `objetEquipe` = id ou null).
// Les objets de stats sont appliqués dans statsFinales (stats.js).
// Les effets spéciaux (shiny/xp/argent) sont appliqués dans la boucle de combat.
// ============================================================

// effet :
//   - 'attaque' / 'pv' / 'vitesse' / 'defense' : multiplicateur sur la stat (valeur = +%)
//   - 'toutes' : multiplicateur sur toutes les stats
//   - 'shiny' / 'xp' / 'argent' : effet spécial (appliqué hors statsFinales)
// Les sprites viennent du repo officiel PokeAPI (sprites/items/<nom>.png).
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/'
export const OBJETS = {
  'muscle-band': { nom: 'Muscle Band', emoji: '💪', sprite: SPRITE_BASE + 'muscle-band.png', effet: 'attaque', valeur: 0.20, prix: 8000, desc: '+20% Attaque' },
  'ceinture-vie': { nom: 'Ceinture Vie', emoji: '❤️', sprite: SPRITE_BASE + 'leftovers.png', effet: 'pv', valeur: 0.25, prix: 8000, desc: '+25% PV max' },
  'bottes-rapides': { nom: 'Bottes Rapides', emoji: '👟', sprite: SPRITE_BASE + 'quick-powder.png', effet: 'vitesse', valeur: 0.20, prix: 8000, desc: '+20% Vitesse' },
  'bouclier-renforce': { nom: 'Bouclier Renforcé', emoji: '🛡️', sprite: SPRITE_BASE + 'assault-vest.png', effet: 'defense', valeur: 0.25, prix: 8000, desc: '+25% Défense' },
  'pierre-equilibre': { nom: 'Pierre Équilibre', emoji: '⚖️', sprite: SPRITE_BASE + 'metal-coat.png', effet: 'toutes', valeur: 0.10, prix: 15000, desc: '+10% à toutes les stats' },
  'charme-chroma': { nom: 'Charme Chroma', emoji: '🔮', sprite: SPRITE_BASE + 'shiny-charm.png', effet: 'shiny', valeur: 0.50, prix: 25000, desc: '+50% chance shiny (si en équipe)' },
  'loupe-savante': { nom: 'Loupe Savante', emoji: '📖', sprite: SPRITE_BASE + 'lucky-egg.png', effet: 'xp', valeur: 0.25, prix: 20000, desc: '+25% XP de ce Pokémon' },
  'porte-bonheur': { nom: 'Porte-Bonheur', emoji: '🍀', sprite: SPRITE_BASE + 'amulet-coin.png', effet: 'argent', valeur: 0.25, prix: 20000, desc: '+25% argent (si en équipe)' },
}

// Renvoie les multiplicateurs de stats apportés par un objet équipé.
// Utilisé dans statsFinales. Renvoie { pv, attaque, vitesse, defense } (1 = neutre).
export function bonusStatsObjet(idObjet) {
  const neutre = { pv: 1, attaque: 1, vitesse: 1, defense: 1 }
  if (!idObjet) return neutre
  const o = OBJETS[idObjet]
  if (!o) return neutre
  if (o.effet === 'toutes') {
    return { pv: 1 + o.valeur, attaque: 1 + o.valeur, vitesse: 1 + o.valeur, defense: 1 + o.valeur }
  }
  if (['pv', 'attaque', 'vitesse', 'defense'].includes(o.effet)) {
    return { ...neutre, [o.effet]: 1 + o.valeur }
  }
  return neutre // effet spécial (shiny/xp/argent) → pas de bonus de stat
}

// Liste des objets achetables en boutique (ceux qui ont un prix).
export function objetsAchetables() {
  return Object.entries(OBJETS).filter(([, o]) => o.prix).map(([id, o]) => ({ id, ...o }))
}

// Calcule les bonus d'effets spéciaux apportés par les objets équipés sur une équipe.
// equipe = tableau de Pokémon. Renvoie des multiplicateurs (1 = neutre).
// - shiny / argent : cumulés si plusieurs Pokémon de l'équipe portent l'objet.
// - xp : géré séparément par Pokémon (voir bonusXpObjet), pas ici.
export function effetsSpeciauxEquipe(equipe) {
  let shiny = 1
  let argent = 1
  for (const p of equipe || []) {
    const o = p && p.objetEquipe ? OBJETS[p.objetEquipe] : null
    if (!o) continue
    if (o.effet === 'shiny') shiny += o.valeur
    if (o.effet === 'argent') argent += o.valeur
  }
  return { shiny, argent }
}

// Bonus d'XP d'un Pokémon individuel selon son objet (1 = neutre).
export function bonusXpObjet(pokemon) {
  const o = pokemon && pokemon.objetEquipe ? OBJETS[pokemon.objetEquipe] : null
  if (o && o.effet === 'xp') return 1 + o.valeur
  return 1
}

// Table de loot des drops sur sauvages (poids). Stats fréquentes, spéciaux rares.
// Total = 100. Les objets de stats représentent ~85%, les spéciaux ~15%.
const TABLE_DROP = [
  { id: 'muscle-band', poids: 20 },
  { id: 'ceinture-vie', poids: 20 },
  { id: 'bottes-rapides', poids: 20 },
  { id: 'bouclier-renforce', poids: 20 },
  { id: 'pierre-equilibre', poids: 5 },   // un peu plus rare (boost global)
  { id: 'loupe-savante', poids: 6 },      // spéciaux : rares
  { id: 'porte-bonheur', poids: 6 },
  { id: 'charme-chroma', poids: 3 },      // le plus rare
]

// Tire un objet au hasard selon la table de loot (pour un drop).
export function tirerObjetDrop() {
  const total = TABLE_DROP.reduce((s, e) => s + e.poids, 0)
  let r = Math.random() * total
  for (const e of TABLE_DROP) {
    r -= e.poids
    if (r <= 0) return e.id
  }
  return TABLE_DROP[0].id
}