// ============================================================
// RÔLES DES POKÉMON (système enrichi : 4 rôles × passifs + Joker)
//
// REWORK PASSIFS (équilibrage) :
//   TANK      : Colosse (+40% PV) / Carapace (+20% PV, -12% dégâts équipe) / Provocateur (+20% PV, renvoi 15%)
//   DPS       : Bourrin (+35%) / Assassin (+20%, +50% sous 35% PV) / Briseur (+20%, -50% soins ennemis)
//   ÉCLAIREUR : Vif (+15% vitesse équipe) / Saboteur (-15% attaque ennemie) / Handicapeur (-15% vitesse ennemie)
//   SOUTIEN   : Stratège (+18% attaque équipe) / Gardien (+18% défense +12% PV équipe) / Guérisseur (12% PV / 7s)
//   JOKER     : case + N'IMPORTE QUEL des 9 passifs (passif libre).
// ============================================================

import { roleParNumero } from './rolesPokemon'

export const ROLES = {
  tank:       { nom: 'Tank',      emoji: '🛡️', couleur: '#5bc47f' },
  dps:        { nom: 'DPS',       emoji: '⚔️', couleur: '#ef7d57' },
  eclaireur:  { nom: 'Éclaireur', emoji: '⚡', couleur: '#ffcd75' },
  soutien:    { nom: 'Soutien',   emoji: '💚', couleur: '#41a6f6' },
  joker:      { nom: 'Joker',     emoji: '🃏', couleur: '#d986ff' },
}

export const JOKER_CASE_DEFAUT = 'dps'
export const CASES_JOKER = ['tank', 'eclaireur', 'soutien', 'dps']

export const COMPOSITION_REQUISE = { tank: 1, eclaireur: 1, soutien: 2, dps: 2 }
export const TAILLE_EQUIPE = 6

// Cadence du soin périodique du Guérisseur (millisecondes de temps réel).
export const PERIODE_SOIN_MS = 7000

const TYPE_VERS_ROLE = {
  rock: 'tank', steel: 'tank', ground: 'tank',
  fighting: 'dps', dragon: 'dps', fire: 'dps', dark: 'dps',
  flying: 'eclaireur', electric: 'eclaireur', bug: 'eclaireur',
  psychic: 'soutien', fairy: 'soutien', grass: 'soutien',
  water: 'soutien', normal: 'soutien', ghost: 'soutien',
  poison: 'tank', ice: 'eclaireur',
}

export const ROLES_FORCES = {}

// ---------- LES PASSIFS (3 par rôle) ----------
export const PASSIFS = {
  // ===== TANK =====
  colosse: {
    nom: 'Colosse', role: 'tank', emoji: '🛡️',
    description: '+40% PV max et attire les coups',
    effet: { pvMult: 1.40, attireCoups: true },
  },
  carapace: {
    nom: 'Carapace', role: 'tank', emoji: '🐢',
    description: '+20% PV, attire les coups et réduit de 12% les dégâts subis par l\'équipe',
    effet: { pvMult: 1.20, attireCoups: true, reducDegatsEquipe: 0.12 },
  },
  provocateur: {
    nom: 'Provocateur', role: 'tank', emoji: '😤',
    description: '+20% PV, attire les coups et renvoie 15% des dégâts subis',
    effet: { pvMult: 1.20, attireCoups: true, renvoiDegats: 0.15 },
  },

  // ===== DPS =====
  bourrin: {
    nom: 'Bourrin', role: 'dps', emoji: '⚔️',
    description: '+35% de dégâts',
    effet: { degatsMult: 1.35 },
  },
  assassin: {
    nom: 'Assassin', role: 'dps', emoji: '🗡️',
    description: '+20% dégâts, +50% sur les cibles affaiblies (sous 35% PV)',
    effet: { degatsMult: 1.20, bonusExecution: 0.50, bonusExecutionSeuil: 0.35 },
  },
  briseur: {
    nom: 'Briseur', role: 'dps', emoji: '🩸',
    description: '+20% dégâts et réduit de 50% les soins de l\'équipe ennemie',
    effet: { degatsMult: 1.20, reducSoinAdverse: 0.50 },
  },

  // ===== ÉCLAIREUR (debuffer) =====
  vif: {
    nom: 'Vif', role: 'eclaireur', emoji: '⚡',
    description: '+15% de vitesse de jauge pour toute l\'équipe',
    effet: { jaugeMult: 1.15, jaugeEquipe: 0.15 },
  },
  saboteur: {
    nom: 'Saboteur', role: 'eclaireur', emoji: '🔧',
    description: 'Réduit de 15% l\'attaque de toute l\'équipe ennemie',
    effet: { jaugeMult: 1.10, reducAttaqueAdverse: 0.15 },
  },
  handicapeur: {
    nom: 'Handicapeur', role: 'eclaireur', emoji: '🕸️',
    description: 'Réduit de 15% la vitesse de jauge de toute l\'équipe ennemie',
    effet: { jaugeMult: 1.10, reducVitesseAdverse: 0.15 },
  },

  // ===== SOUTIEN (attaque / défense / soin) =====
  stratege: {
    nom: 'Stratège', role: 'soutien', emoji: '🧠',
    description: 'Augmente de 18% l\'attaque de toute l\'équipe',
    effet: { boostDegatsEquipe: 0.18 },
  },
  gardien: {
    nom: 'Gardien', role: 'soutien', emoji: '✨',
    description: 'Augmente de 18% la défense et de 12% les PV de toute l\'équipe',
    effet: { boostDefenseEquipe: 0.18, boostPvEquipe: 0.12 },
  },
  guerisseur: {
    nom: 'Guérisseur', role: 'soutien', emoji: '💚',
    description: 'Soigne 12% des PV max de toute l\'équipe toutes les 7 secondes',
    effet: { soinPeriodique: 0.12 },
  },
}

const TYPE_VERS_PASSIF = {
  tank: {
    rock: 'carapace', steel: 'carapace',
    ground: 'colosse',
    poison: 'provocateur', ghost: 'provocateur',
  },
  dps: {
    fighting: 'bourrin', dragon: 'bourrin',
    dark: 'assassin', poison: 'assassin',
    fire: 'briseur',
  },
  eclaireur: {
    flying: 'vif', electric: 'vif',
    bug: 'saboteur',
    ice: 'handicapeur', normal: 'handicapeur',
  },
  soutien: {
    psychic: 'stratege',
    normal: 'gardien', ghost: 'gardien', steel: 'gardien',
    grass: 'guerisseur', water: 'guerisseur', fairy: 'guerisseur',
  },
}

const PASSIF_DEFAUT = { tank: 'colosse', dps: 'bourrin', eclaireur: 'vif', soutien: 'stratege' }

export const PASSIFS_PAR_ROLE = {
  tank:      ['colosse', 'carapace', 'provocateur'],
  dps:       ['bourrin', 'assassin', 'briseur'],
  eclaireur: ['vif', 'saboteur', 'handicapeur'],
  soutien:   ['stratege', 'gardien', 'guerisseur'],
}

// Les 9 passifs (pour le Joker, passif libre).
export const TOUS_LES_PASSIFS = [
  ...PASSIFS_PAR_ROLE.tank,
  ...PASSIFS_PAR_ROLE.dps,
  ...PASSIFS_PAR_ROLE.eclaireur,
  ...PASSIFS_PAR_ROLE.soutien,
]

export function passifsDuRole(role) {
  const cles = role === 'joker' ? TOUS_LES_PASSIFS : (PASSIFS_PAR_ROLE[role] || [])
  return cles.map((cle) => ({ cle, ...PASSIFS[cle] })).filter((p) => p.nom)
}

export function passifParDefautDuRole(role) {
  if (role === 'joker') return PASSIF_DEFAUT.dps
  return PASSIF_DEFAUT[role] || (PASSIFS_PAR_ROLE[role] && PASSIFS_PAR_ROLE[role][0]) || 'bourrin'
}

export function passifAppartientAuRole(clePassif, role) {
  if (role === 'joker') return TOUS_LES_PASSIFS.includes(clePassif)
  return (PASSIFS_PAR_ROLE[role] || []).includes(clePassif)
}

// ---------- FONCTIONS ----------
export function determinerRole(pokemon) {
  if (!pokemon) return 'dps'
  if (pokemon.roleForce && (ROLES[pokemon.roleForce] || pokemon.roleForce === 'joker')) {
    return pokemon.roleForce
  }
  const nom = (pokemon.nom || pokemon.nomEspece || '').toLowerCase()
  if (ROLES_FORCES[nom]) return ROLES_FORCES[nom]
  const num = pokemon.id || pokemon.numero || null
  if (num) {
    const r = roleParNumero(num)
    if (r) return r
  }
  const types = pokemon.types || []
  for (const t of types) {
    if (TYPE_VERS_ROLE[t]) return TYPE_VERS_ROLE[t]
  }
  return 'dps'
}

export function estJoker(pokemon) {
  if (!pokemon) return false
  if (pokemon.roleForce === 'joker') return true
  return (pokemon.role || determinerRole(pokemon)) === 'joker'
}

export function roleEffectif(pokemon) {
  if (!pokemon) return 'dps'
  const role = pokemon.roleForce || pokemon.role || determinerRole(pokemon)
  if (role !== 'joker') return role
  const choisie = pokemon.jokerCase
  if (choisie && CASES_JOKER.includes(choisie)) return choisie
  return JOKER_CASE_DEFAUT
}

export function determinerPassif(pokemon) {
  if (!pokemon) return 'bourrin'
  const role = pokemon.roleForce || pokemon.role || determinerRole(pokemon)
  if (role === 'joker') return passifParDefautDuRole('joker')
  const table = TYPE_VERS_PASSIF[role] || {}
  const types = pokemon.types || []
  for (const t of types) {
    if (table[t]) return table[t]
  }
  return PASSIF_DEFAUT[role] || 'bourrin'
}

export function passifEffectif(pokemon) {
  if (!pokemon) return 'bourrin'
  const role = pokemon.roleForce || pokemon.role || determinerRole(pokemon)
  const choisi = pokemon.passifChoisi
  if (choisi && passifAppartientAuRole(choisi, role)) return choisi
  const auto = determinerPassif(pokemon)
  if (PASSIFS[auto]) return auto
  return passifParDefautDuRole(role)
}

export function passifDe(pokemon) {
  if (!pokemon) return null
  const cle = passifEffectif(pokemon)
  return PASSIFS[cle] || null
}

// ---------- PASSIFS PAR MODE ----------
// Renvoie la clé du passif pour un mode ('principal'|'arene'|'pvp').
// Champs : passifChoisi (principal), passifArene, passifPvp. Repli en cascade, validé contre le rôle.
export function passifPourMode(pokemon, mode = 'principal') {
  if (!pokemon) return passifParDefautDuRole('dps')
  const role = pokemon.roleForce || pokemon.role || determinerRole(pokemon)
  const champ = mode === 'arene' ? pokemon.passifArene
    : mode === 'pvp' ? pokemon.passifPvp
    : pokemon.passifChoisi
  if (champ && passifAppartientAuRole(champ, role)) return champ
  if (pokemon.passifChoisi && passifAppartientAuRole(pokemon.passifChoisi, role)) return pokemon.passifChoisi
  const auto = determinerPassif(pokemon)
  if (PASSIFS[auto]) return auto
  return passifParDefautDuRole(role)
}

export function champPassifDuMode(mode = 'principal') {
  return mode === 'arene' ? 'passifArene' : mode === 'pvp' ? 'passifPvp' : 'passifChoisi'
}

// ---------- COMPATIBILITÉ (bonusDuRole) ----------
export const BONUS_ROLE = {
  tank:      { pvMult: 1.30, degatsMult: 1.0,  jaugeMult: 1.0,  regenEquipe: 0 },
  dps:       { pvMult: 1.0,  degatsMult: 1.25, jaugeMult: 1.0,  regenEquipe: 0 },
  eclaireur: { pvMult: 1.0,  degatsMult: 1.0,  jaugeMult: 1.20, regenEquipe: 0 },
  soutien:   { pvMult: 1.0,  degatsMult: 1.0,  jaugeMult: 1.0,  regenEquipe: 0.03 },
}
export function bonusDuRole(role) {
  return BONUS_ROLE[role] || { pvMult: 1, degatsMult: 1, jaugeMult: 1, regenEquipe: 0 }
}

// Effet chiffré du passif (fusionné avec des neutres : jamais d'undefined dans le moteur).
export function bonusDuPassif(pokemon) {
  const neutre = {
    pvMult: 1, degatsMult: 1, jaugeMult: 1, defMult: 1,
    attireCoups: false, reducDegatsEquipe: 0, renvoiDegats: 0,
    bonusExecution: 0, bonusExecutionSeuil: 0.35,
    reducSoinAdverse: 0,
    jaugeEquipe: 0,
    reducAttaqueAdverse: 0, reducVitesseAdverse: 0,
    boostDegatsEquipe: 0, boostPvEquipe: 0, boostDefenseEquipe: 0,
    soinPeriodique: 0,
    ignoreDefense: 0,
    critChance: 0, critMult: 1,
  }
  const p = passifDe(pokemon)
  if (!p) return neutre
  return { ...neutre, ...p.effet }
}

// ---------- HELPERS DE COMPOSITION ----------
export function compterRoles(equipe) {
  const compte = { tank: 0, dps: 0, eclaireur: 0, soutien: 0 }
  for (const p of equipe) {
    if (!p) continue
    const role = roleEffectif(p)
    if (compte[role] !== undefined) compte[role] += 1
  }
  return compte
}

export function compositionValide(equipe) {
  const membres = (equipe || []).filter(Boolean)
  if (membres.length < TAILLE_EQUIPE) return true
  const compte = compterRoles(membres)
  return (
    compte.tank === COMPOSITION_REQUISE.tank &&
    compte.eclaireur === COMPOSITION_REQUISE.eclaireur &&
    compte.soutien === COMPOSITION_REQUISE.soutien &&
    compte.dps === COMPOSITION_REQUISE.dps
  )
}

export function diagnostiqueComposition(equipe) {
  const membres = (equipe || []).filter(Boolean)
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

// ---------- TRI PAR RÔLE ----------
export const ORDRE_ROLES = { tank: 0, eclaireur: 1, dps: 2, soutien: 3 }

function rangRole(pokemon) {
  const role = roleEffectif(pokemon)
  return ORDRE_ROLES[role] ?? 2
}

export function trierEquipeParRole(equipe) {
  return (equipe || [])
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const ra = rangRole(a.p)
      const rb = rangRole(b.p)
      if (ra !== rb) return ra - rb
      return a.i - b.i
    })
    .map((x) => x.p)
}

export function trierIdsParRole(ids, captures) {
  const trouve = (uid) => (captures || []).find((p) => p && p.uid === uid)
  return [...(ids || [])]
    .map((uid, i) => ({ uid, i, rang: rangRole(trouve(uid)) }))
    .sort((a, b) => (a.rang !== b.rang ? a.rang - b.rang : a.i - b.i))
    .map((x) => x.uid)
}