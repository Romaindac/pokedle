// ============================================================
// TOUR INFINIE — Configuration
// Roguelike : repart niveau 1 à chaque session.
// Niveau 5 = mini-boss, niveau 10 = boss, puis cycle.
// Combats TOUJOURS 6v6. Mini-boss/boss : 1 Pokemon rare booste parmi les 6.
// Drops : cartes TCG officielles via pokemontcg.io
// + systeme de FINITIONS (normale / brillante / prismatique)
// ============================================================

// Sets TCG utilisés (pokemontcg.io set IDs)
export const SETS_TCG = {
  base1:   { nom: 'Set de Base',  emoji: '🔴', couleur: '#e53935', total: 102 },
  jungle:  { nom: 'Jungle',       emoji: '🌿', couleur: '#43a047', total: 64 },
  fossil:  { nom: 'Fossil',       emoji: '🦴', couleur: '#8d6e63', total: 62 },
}
export const ORDRE_SETS = ['base1', 'jungle', 'fossil']

// Raretés TCG officielles
export const RARETE_TCG = {
  'Common':        { label: 'Commune',    emoji: '⚪', couleur: '#9e9e9e', niveauMin: 1  },
  'Uncommon':      { label: 'Peu commune',emoji: '🟢', couleur: '#43a047', niveauMin: 5  },
  'Rare':          { label: 'Rare',       emoji: '🔵', couleur: '#1e88e5', niveauMin: 10 },
  'Rare Holo':     { label: 'Holo Rare',  emoji: '💎', couleur: '#8e24aa', niveauMin: 20 },
  'Rare Holo EX':  { label: 'Holo EX',    emoji: '⭐', couleur: '#f4511e', niveauMin: 30 },
}

// ============================================================
// FINITIONS — variante visuelle qui s'ajoute a la rarete TCG.
// ============================================================
export const FINITIONS = {
  normale:     { label: 'Normale',     emoji: '',   couleur: '#9e9e9e', rang: 0 },
  brillante:   { label: 'Brillante',   emoji: '✨', couleur: '#4fc3f7', rang: 1 },
  prismatique: { label: 'Prismatique', emoji: '🌈', couleur: '#ffd54f', rang: 2 },
}

// Tire une finition au hasard. Les boss/miniboss ont de meilleures chances.
export function tirerFinition(typeNiv) {
  const r = Math.random()
  if (typeNiv === 'boss') {
    if (r < 0.04) return 'prismatique'
    if (r < 0.22) return 'brillante'
    return 'normale'
  }
  if (typeNiv === 'miniboss') {
    if (r < 0.015) return 'prismatique'
    if (r < 0.12) return 'brillante'
    return 'normale'
  }
  if (r < 0.004) return 'prismatique'
  if (r < 0.05) return 'brillante'
  return 'normale'
}

// Difficulté de la tour (handicap general applique aux ennemis).
// RADOUCIE : montee plus progressive qu'avant (ancien exposant 1.8 -> 1.6, /10 -> /15).
export function difficulteNiveau(niveau) {
  return Math.round(1 + (niveau - 1) * 0.10 + Math.pow(niveau / 15, 1.6))
}

// Type de niveau : 'normal' | 'miniboss' | 'boss'
export function typeNiveau(niveau) {
  if (niveau % 10 === 0) return 'boss'
  if (niveau % 5 === 0) return 'miniboss'
  return 'normal'
}

// ============================================================
// NIVEAU DES POKEMON ENNEMIS
// Scale sur le PLAFOND de niveau du joueur (passe en 2e argument) :
// la Tour grandit avec ta progression Prestige.
//  - etage 1   -> ~niveau 4
//  - etage ~60 -> atteint TON plafond (cap)
//  - au-dela   -> reste au cap : c'est l'optimisation (objets, compo,
//    passifs) et les boss qui font la difference, pas le niveau brut.
// Retro-compatible : si cap absent, on retombe sur un cap de 100.
// ============================================================
export function niveauPokemonTour(niveauTour, cap) {
  const plafond = (typeof cap === 'number' && cap > 4) ? cap : 100
  const ETAGE_PLAFOND = 60 // etage ou les ennemis atteignent ton niveau max
  const frac = Math.min(1, (niveauTour - 1) / (ETAGE_PLAFOND - 1))
  const niv = 4 + (plafond - 4) * Math.pow(frac, 0.92)
  return Math.min(plafond, Math.max(1, Math.round(niv)))
}

// Nombre de Pokémon ennemis : TOUJOURS 6 (combats 6v6 complets).
export function tailleEquipeTour(niveauTour) {
  return 6
}

// ============================================================
// MULTIPLICATEUR DU POKEMON RARE (mini-boss / boss)
// Un des 6 ennemis devient "rare" : stats et niveau boostes.
// REEQUILIBRE : boost de stats reduit (avant 2.4/1.7 -> 1.55/1.3) pour
// que les boss soient DURS mais pas absurdes. Le bonus de niveau reste
// pour qu'ils restent un vrai mur en fin de Tour.
// ============================================================
export function multiplicateurRareTour(typeNiv) {
  if (typeNiv === 'boss')     return { stats: 1.55, niveauBonus: 8, rarete: 'legendaire' }
  if (typeNiv === 'miniboss') return { stats: 1.30, niveauBonus: 4, rarete: 'tresRare' }
  return null
}

// ============================================================
// RARETE TCG du drop
// ============================================================
export function rareteDropTour(niveauTour) {
  const type = typeNiveau(niveauTour)
  const r = Math.random()
  if (type === 'boss') {
    if (niveauTour >= 30 && r < 0.08) return 'Rare Holo EX'
    if (r < 0.30) return 'Rare Holo'
    if (r < 0.70) return 'Rare'
    return 'Uncommon'
  }
  if (type === 'miniboss') {
    if (r < 0.06) return 'Rare Holo'
    if (r < 0.40) return 'Rare'
    return 'Uncommon'
  }
  if (r < 0.72) return 'Common'
  if (r < 0.96) return 'Uncommon'
  return 'Rare'
}

// Choisit un set selon le niveau
export function setDropTour(niveauTour) {
  if (niveauTour >= 30) {
    const r = Math.random()
    if (r < 0.33) return 'fossil'
    if (r < 0.66) return 'jungle'
    return 'base1'
  }
  if (niveauTour >= 15) {
    return Math.random() < 0.5 ? 'jungle' : 'base1'
  }
  return 'base1'
}

const TAUX_USD_EUR = 0.92
function coteCarte(carte) {
  let prix = 0
  const cm = carte?.cardmarket?.prices
  if (cm) prix = cm.averageSellPrice || cm.trendPrice || cm.avg7 || 0
  if (!prix) {
    const tp = carte?.tcgplayer?.prices
    if (tp) {
      const variant = tp.holofoil || tp.reverseHolofoil || tp.normal || tp['1stEditionHolofoil'] || Object.values(tp)[0]
      if (variant) {
        const prixUsd = variant.market || variant.mid || variant.low || 0
        prix = prixUsd * TAUX_USD_EUR
      }
    }
  }
  return Math.max(0.10, prix || 0.10)
}

export function formaterPrix(p) {
  if (p == null) return '?'
  if (p < 1) return '<1 €'
  if (p < 10) return `~${Math.round(p)} €`
  if (p < 100) return `~${Math.round(p / 5) * 5} €`
  if (p < 1000) return `~${Math.round(p / 10) * 10} €`
  return `~${(Math.round(p / 100) * 100 / 1000).toFixed(1).replace('.0', '')}k €`
}

const EXPOSANT_COTE = 1.0
function tirerPondereParCote(cartes) {
  if (cartes.length === 0) return null
  const poids = cartes.map((c) => 1 / Math.pow(coteCarte(c), EXPOSANT_COTE))
  const total = poids.reduce((a, b) => a + b, 0)
  if (total <= 0) return cartes[Math.floor(Math.random() * cartes.length)]
  let tirage = Math.random() * total
  for (let i = 0; i < cartes.length; i++) {
    tirage -= poids[i]
    if (tirage <= 0) return cartes[i]
  }
  return cartes[cartes.length - 1]
}

const POIDS_TYPE_MOYEN = { normal: 0.85, miniboss: 0.10, boss: 0.05 }
const PROBA_RARETE_PAR_TYPE = {
  normal:   { Common: 0.72, Uncommon: 0.24, Rare: 0.04, 'Rare Holo': 0, 'Rare Holo EX': 0 },
  miniboss: { Common: 0, Uncommon: 0.60, Rare: 0.34, 'Rare Holo': 0.06, 'Rare Holo EX': 0 },
  boss:     { Common: 0, Uncommon: 0.30, Rare: 0.40, 'Rare Holo': 0.22, 'Rare Holo EX': 0.08 },
}
export function probaRareteMoyenne(rarete) {
  let p = 0
  for (const type of ['normal', 'miniboss', 'boss']) {
    const parType = PROBA_RARETE_PAR_TYPE[type][rarete] || 0
    p += POIDS_TYPE_MOYEN[type] * parType
  }
  return p
}

export function probaFinitionMoyenne(finition) {
  const parType = {
    normale:     { normal: 0.946, miniboss: 0.885, boss: 0.78 },
    brillante:   { normal: 0.046, miniboss: 0.105, boss: 0.18 },
    prismatique: { normal: 0.004, miniboss: 0.015, boss: 0.04 },
  }
  const t = parType[finition] || parType.normale
  return POIDS_TYPE_MOYEN.normal * t.normal + POIDS_TYPE_MOYEN.miniboss * t.miniboss + POIDS_TYPE_MOYEN.boss * t.boss
}

export function estimerTauxCarte(carte, infosPool) {
  const probaRarete = probaRareteMoyenne(carte.rarete) || 0.001
  const probaFin = probaFinitionMoyenne(carte.finition || 'normale')
  let partDansRarete = 1 / (infosPool?.nbCartesRarete || 20)
  if (infosPool?.poidsCarte && infosPool?.poidsTotal) {
    partDansRarete = infosPool.poidsCarte / infosPool.poidsTotal
  }
  const probaGlobale = probaRarete * partDansRarete * probaFin
  if (probaGlobale <= 0) return null
  return Math.round(1 / probaGlobale)
}

export function formaterTaux(x) {
  if (!x || x < 1) return '?'
  if (x < 1000) return `1 sur ${x}`
  if (x < 1000000) return `1 sur ${(x / 1000).toFixed(1).replace('.0', '')}k`
  return `1 sur ${(x / 1000000).toFixed(1).replace('.0', '')}M`
}

export async function tirerCarteTCG(setId, rarete) {
  try {
    const q = encodeURIComponent(`set.id:${setId} rarity:"${rarete}" supertype:Pokémon`)
    const url = `https://api.pokemontcg.io/v2/cards?q=${q}&pageSize=50`
    const controleur = new AbortController()
    const minuteur = setTimeout(() => controleur.abort(), 6000)
    const rep = await fetch(url, { signal: controleur.signal })
    clearTimeout(minuteur)
    if (!rep.ok) throw new Error('API TCG indisponible')
    const data = await rep.json()
    const cartes = data.data || []
    if (cartes.length === 0) {
      if (rarete === 'Rare Holo EX') return tirerCarteTCG(setId, 'Rare Holo')
      if (rarete === 'Rare Holo')    return tirerCarteTCG(setId, 'Rare')
      if (rarete === 'Rare')         return tirerCarteTCG(setId, 'Uncommon')
      return tirerCarteTCG(setId, 'Common')
    }
    const carte = tirerPondereParCote(cartes)
    const cote = coteCarte(carte)
    const poidsToutes = cartes.map((c) => 1 / Math.pow(coteCarte(c), EXPOSANT_COTE))
    const poidsTotal = poidsToutes.reduce((a, b) => a + b, 0)
    const poidsCarte = 1 / Math.pow(cote, EXPOSANT_COTE)
    return {
      id: carte.id,
      nom: carte.name,
      set: setId,
      setNom: SETS_TCG[setId]?.nom || setId,
      rarete: carte.rarity || rarete,
      image: carte.images?.large || carte.images?.small || null,
      imageSmall: carte.images?.small || null,
      hp: carte.hp || null,
      types: carte.types || [],
      numero: carte.number || '',
      cote: Math.round(cote * 100) / 100,
      _poidsCarte: poidsCarte,
      _poidsTotal: poidsTotal,
      _nbRarete: cartes.length,
    }
  } catch (err) {
    console.warn('tirerCarteTCG échoué', err)
    return null
  }
}

export async function dropCarteTour(niveauTour) {
  const setId  = setDropTour(niveauTour)
  const rarete = rareteDropTour(niveauTour)
  const carte  = await tirerCarteTCG(setId, rarete)
  if (!carte) return null
  const finition = tirerFinition(typeNiveau(niveauTour))
  return {
    ...carte,
    finition,
    cleCollection: `${carte.id}__${finition}`,
  }
}

export function bonusCompletionSet(collection, setId) {
  const cartesDuSet = [...collection].filter((c) => c.set === setId)
  const uniques = new Set(cartesDuSet.map((c) => c.id)).size
  const nbBrillantes = new Set(cartesDuSet.filter((c) => c.finition === 'brillante').map((c) => c.cleCollection)).size
  const nbPrismatiques = new Set(cartesDuSet.filter((c) => c.finition === 'prismatique').map((c) => c.cleCollection)).size

  const paliers = [
    { seuil: 10,  bonus: 0.02, label: '10 cartes' },
    { seuil: 25,  bonus: 0.05, label: '25 cartes' },
    { seuil: 50,  bonus: 0.10, label: '50 cartes' },
    { seuil: 75,  bonus: 0.15, label: '75 cartes' },
    { seuil: 100, bonus: 0.25, label: '100 cartes' },
  ]
  let totalBonus = 0
  for (const p of paliers) {
    if (uniques >= p.seuil) totalBonus += p.bonus
  }
  return { uniques, totalBonus, paliers, nbBrillantes, nbPrismatiques }
}