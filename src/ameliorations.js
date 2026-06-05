// Les améliorations permanentes. Chaque niveau acheté augmente un multiplicateur global.
export const AMELIORATIONS = {
  fortune: {
    nom: 'Fortune', emoji: '💰',
    description: '+6% de PokéDollars par victoire',
    bonusParNiveau: 0.06,
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
    description: '+1,5% de chance de shiny',
    bonusParNiveau: 0.015,
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
    bonusParNiveau: 0.02,
    coutBase: 1200,
  },
  dressage: {
    nom: 'Dressage', emoji: '🎓',
    description: '+3% de chance de capture',
    bonusParNiveau: 0.03,
    coutBase: 1500,
  },
  strategie: {
    nom: 'Stratégie', emoji: '🧠',
    description: '-1 victoire requise avant le boss (palier)',
    bonusParNiveau: 1,
    coutBase: 2500,
  },

  // ===== NOUVEAUX BOOSTS (liés à l'économie & au contenu actuels) =====
  negociateur: {
    nom: 'Négociateur', emoji: '🪙',
    description: 'Les prix de boutique montent 8% moins vite',
    bonusParNiveau: 0.08,
    coutBase: 1000,
  },
  chineur: {
    nom: 'Chineur', emoji: '⚙️',
    description: '+0,15% de chance de trouver un objet en combat',
    bonusParNiveau: 0.0015,
    coutBase: 1800,
  },
  gourmandise: {
    nom: 'Gourmandise', emoji: '🍬',
    description: '+8% de chance d\'un Super Bonbon bonus en battant un boss',
    bonusParNiveau: 0.08,
    coutBase: 2000,
  },
  champion: {
    nom: 'Champion', emoji: '🏟️',
    description: '+6% de PokéDollars gagnés en Arène',
    bonusParNiveau: 0.06,
    coutBase: 1500,
  },
}

export const PALIER_MAX = 10
export const FACTEUR_COUT = 1.6

/* ============================================================
   OBJETS DE BOSS (monnaie des améliorations endgame)
   Droppés par tous les types de boss (zone/arène/raid), jamais
   garantis. Les % de drop sont définis côté App.jsx par type de boss.
   ============================================================ */
export const OBJETS_BOSS = {
  rouage: {
    nom: 'Rouage de Maître', emoji: '🔩', rarete: 'commun',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/gear.png',
  },
  cristal: {
    nom: 'Cristal de Boss', emoji: '💎', rarete: 'rare',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/rare-bone.png',
  },
  relique: {
    nom: 'Relique Légendaire', emoji: '👑', rarete: 'legendaire',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/relic-crown.png',
  },
}

/* ============================================================
   BONBONS D'IV (drops de boss, séparés de la monnaie endgame)
   Chacun augmente de +1 l'IV d'une stat d'un Pokémon (plafond 31).
   Stockés dans le même state objetsBoss, mais sous leurs propres clés
   → ils n'interfèrent PAS avec coutEndgame/peutPayerEndgame (qui ne
   lisent que rouage/cristal/relique).
   ============================================================ */
export const BONBONS_IV = {
  iv_pv: {
    nom: 'Bonbon PV', emoji: '❤️', stat: 'pv',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/hp-up.png',
  },
  iv_attaque: {
    nom: 'Bonbon Attaque', emoji: '⚔️', stat: 'attaque',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/protein.png',
  },
  iv_vitesse: {
    nom: 'Bonbon Vitesse', emoji: '⚡', stat: 'vitesse',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/carbos.png',
  },
  iv_defense: {
    nom: 'Bonbon Défense', emoji: '🛡️', stat: 'defense',
    sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/iron.png',
  },
}

/* ============================================================
   AMÉLIORATIONS ENDGAME
   Mêmes effets que les normales mais bonus/palier renforcé (~×1,33).
   Débloquées individuellement quand la version normale est à 10/10.
   Payées UNIQUEMENT en objets de boss (pas d'argent).
   La clé endgame = clé normale + suffixe SUFFIXE_EG.
   On saute 'strategie' (effet entier non-multiplicatif).
   ============================================================ */
export const SUFFIXE_EG = '_eg'

const CLES_ENDGAME = Object.keys(AMELIORATIONS).filter((c) => c !== 'strategie')

function arrondiPropre(x) {
  return Math.round(x * 100000) / 100000
}

function pct(v) {
  const p = v * 100
  return (Math.round(p * 100) / 100).toString().replace('.', ',')
}

function descriptionEndgame(cle, base, bonusEg) {
  switch (cle) {
    case 'fortune': return `+${pct(bonusEg)}% de PokéDollars par victoire`
    case 'mentor': return `+${pct(bonusEg)}% d'XP gagnée`
    case 'chroma': return `+${pct(bonusEg)}% de chance de shiny`
    case 'frenesie': return `Combats ${pct(bonusEg)}% plus rapides`
    case 'puissance': return `+${pct(bonusEg)}% PV & Attaque de l'équipe`
    case 'dressage': return `+${pct(bonusEg)}% de chance de capture`
    case 'negociateur': return `Prix de boutique encore réduits (palier ${pct(bonusEg)}%)`
    case 'chineur': return `+${pct(bonusEg)}% de chance de trouver un objet`
    case 'gourmandise': return `+${pct(bonusEg)}% de chance d'un Super Bonbon bonus`
    case 'champion': return `+${pct(bonusEg)}% de PokéDollars gagnés en Arène`
    default: return base.description
  }
}

export const AMELIORATIONS_ENDGAME = Object.fromEntries(
  CLES_ENDGAME.map((cle) => {
    const base = AMELIORATIONS[cle]
    const bonusEg = arrondiPropre(base.bonusParNiveau * (4 / 3))
    return [
      cle + SUFFIXE_EG,
      {
        nom: base.nom + ' ★',
        emoji: base.emoji,
        description: descriptionEndgame(cle, base, bonusEg),
        bonusParNiveau: bonusEg,
        cleNormale: cle,
      },
    ]
  })
)

/* ============================================================
   COÛTS ENDGAME (en objets de boss)
   Niveaux 1-5  : 1 Rouage + 1 Cristal
   Niveaux 6-10 : 2 Rouages + 2 Cristaux + 1 Relique
   ============================================================ */
export function coutEndgame(niveauActuel) {
  const prochainNiveau = niveauActuel + 1
  if (prochainNiveau <= 5) {
    return { rouage: 1, cristal: 1, relique: 0 }
  }
  return { rouage: 2, cristal: 2, relique: 1 }
}

export function peutPayerEndgame(stock, cout) {
  return (stock.rouage || 0) >= cout.rouage
    && (stock.cristal || 0) >= cout.cristal
    && (stock.relique || 0) >= cout.relique
}

export function endgameDebloque(ameliorations, cleEndgame) {
  const info = AMELIORATIONS_ENDGAME[cleEndgame]
  if (!info) return false
  return (ameliorations[info.cleNormale] || 0) >= PALIER_MAX
}

export function coutAmelioration(cle, niveauActuel) {
  const base = AMELIORATIONS[cle].coutBase
  return Math.round(base * Math.pow(FACTEUR_COUT, niveauActuel))
}

// Multiplicateur total : combine AUTO normal + endgame.
export function multiplicateur(ameliorations, cle) {
  const info = AMELIORATIONS[cle]
  if (!info) return 1
  const nivNormal = (ameliorations && ameliorations[cle]) || 0
  const cleEg = cle + SUFFIXE_EG
  const infoEg = AMELIORATIONS_ENDGAME[cleEg]
  const nivEg = (ameliorations && ameliorations[cleEg]) || 0
  let bonus = info.bonusParNiveau * nivNormal
  if (infoEg) bonus += infoEg.bonusParNiveau * nivEg
  return 1 + bonus
}

export function niveauAmelioration(ameliorations, cle) {
  return (ameliorations && ameliorations[cle]) || 0
}

export function facteurNegociateur(ameliorations) {
  const nivNormal = (ameliorations && ameliorations.negociateur) || 0
  const nivEg = (ameliorations && ameliorations['negociateur' + SUFFIXE_EG]) || 0
  const reduc = 0.08 * nivNormal + (AMELIORATIONS_ENDGAME['negociateur' + SUFFIXE_EG]?.bonusParNiveau || 0) * nivEg
  return Math.max(0, 1 - reduc)
}