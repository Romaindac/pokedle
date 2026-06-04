// Les améliorations permanentes. Chaque niveau acheté augmente un multiplicateur global.
export const AMELIORATIONS = {
  fortune: {
    nom: 'Fortune', emoji: '💰',
    description: '+10% de PokéDollars par victoire',
    bonusParNiveau: 0.10,
    coutBase: 500,
  },
  mentor: {
    nom: 'Mentor', emoji: '📈',
    description: '+10% d\'XP gagnée',
    bonusParNiveau: 0.10,
    coutBase: 500,
  },
  chroma: {
    nom: 'Charme Chroma', emoji: '✨',
    description: '+20% de chance de shiny',
    bonusParNiveau: 0.20,
    coutBase: 2000,
  },
  frenesie: {
    nom: 'Frénésie', emoji: '⚡',
    description: 'Combats 5% plus rapides',
    bonusParNiveau: 0.05,
    coutBase: 1500,
  },

  // ===== EFFETS DE COMBAT / CAPTURE =====
  puissance: {
    nom: 'Entraînement', emoji: '💪',
    description: '+2% PV & Attaque de l\'équipe',
    bonusParNiveau: 0.02,   // +20% max à niveau 10 — modéré, juste pour passer des paliers
    coutBase: 1200,
  },
  dressage: {
    nom: 'Dressage', emoji: '🎓',
    description: '+3% de chance de capture',
    bonusParNiveau: 0.03,   // +30% max à niveau 10 — aide à compléter le Pokédex
    coutBase: 1500,
  },
  strategie: {
    nom: 'Stratégie', emoji: '🧠',
    description: '-1 victoire requise avant le boss (palier)',
    bonusParNiveau: 1,      // -1 victoire/niveau, plafonné dans le code (jamais sous 10)
    coutBase: 2500,
  },

  // ===== NOUVEAUX BOOSTS (liés à l'économie & au contenu actuels) =====
  negociateur: {
    nom: 'Négociateur', emoji: '🪙',
    description: 'Les prix de boutique montent 8% moins vite',
    bonusParNiveau: 0.08,   // niveau 10 = -80% de la majoration dynamique (le prix de base reste)
    coutBase: 1000,
  },
  chineur: {
    nom: 'Chineur', emoji: '⚙️',
    description: '+0,15% de chance de trouver un objet en combat',
    bonusParNiveau: 0.0015, // base 0.3% → jusqu'à +1.5% à niveau 10 (×6 le drop d'objet)
    coutBase: 1800,
  },
  gourmandise: {
    nom: 'Gourmandise', emoji: '🍬',
    description: '+8% de chance d\'un Super Bonbon bonus en battant un boss',
    bonusParNiveau: 0.08,   // niveau 10 = +80% de chance d'un 2e bonbon de boss
    coutBase: 2000,
  },
  champion: {
    nom: 'Champion', emoji: '🏟️',
    description: '+10% de PokéDollars gagnés en Arène',
    bonusParNiveau: 0.10,
    coutBase: 1500,
  },
}

export const PALIER_MAX = 10
export const FACTEUR_COUT = 1.6

// Coût pour passer du niveau actuel au suivant.
export function coutAmelioration(cle, niveauActuel) {
  const base = AMELIORATIONS[cle].coutBase
  return Math.round(base * Math.pow(FACTEUR_COUT, niveauActuel))
}

// Multiplicateur total d'une amélioration (1 + bonus × niveau).
export function multiplicateur(ameliorations, cle) {
  const niv = (ameliorations && ameliorations[cle]) || 0
  const info = AMELIORATIONS[cle]
  if (!info) return 1
  return 1 + info.bonusParNiveau * niv
}

// Niveau brut d'une amélioration (pour les effets non-multiplicatifs comme 'strategie').
export function niveauAmelioration(ameliorations, cle) {
  return (ameliorations && ameliorations[cle]) || 0
}

// Réduction de la majoration des prix dynamiques (Négociateur).
// Renvoie un facteur 0→1 appliqué à la PART qui dépasse le prix de base.
// niveau 0 = 1 (majoration pleine), niveau 10 = 0.2 (majoration réduite de 80%).
export function facteurNegociateur(ameliorations) {
  const niv = (ameliorations && ameliorations.negociateur) || 0
  return Math.max(0, 1 - 0.08 * niv)
}