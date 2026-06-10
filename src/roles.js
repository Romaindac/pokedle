// ============================================================
// RÔLES DES POKÉMON (système enrichi : 4 rôles × passifs + Joker)
// Passifs ÉQUILIBRÉS — aucun ne domine, valeurs pensées pour la boucle de tics.
//
// RÔLE FIXE PAR ESPÈCE : le rôle est déterminé par les STATS DE BASE
// officielles du Pokémon (sa stat dominante = son physique). Comme les stats
// de base ne changent jamais, le rôle est STABLE pour toujours :
//   - Défense la plus haute  -> Tank      (ex : Rhinoféros)
//   - Attaque la plus haute  -> DPS       (ex : Dracaufeu)
//   - Vitesse la plus haute  -> Éclaireur (ex : Voltali)
//   - PV les plus hauts      -> Soutien   (ex : Leveinard)
// Égalité : priorité Défense > Attaque > Vitesse > PV.
// Le parchemin (roleForce) garde la priorité absolue.
// ============================================================

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

// ===== RÈGLE DE COMPO (souple) =====
export const MIN_PAR_ROLE = 1
export const MAX_PAR_ROLE = 2
export const MAX_SPECIAL = 1

// Cadence du soin périodique du Guérisseur — désormais gérée en TICS dans le moteur.
// (Conservée pour compatibilité, plus utilisée pour le timing.)
export const PERIODE_SOIN_MS = 9300

export const ROLES_FORCES = {}

// ---------- LES PASSIFS (3 par rôle) — ÉQUILIBRÉS ----------
export const PASSIFS = {
  colosse: {
    nom: 'Colosse', role: 'tank', emoji: '🛡️',
    description: '+35% PV max et attire les coups',
    effet: { pvMult: 1.35, attireCoups: true },
  },
  carapace: {
    nom: 'Carapace', role: 'tank', emoji: '🐢',
    description: '+20% PV, attire les coups et réduit de 12% les dégâts subis par l\'équipe',
    effet: { pvMult: 1.20, attireCoups: true, reducDegatsEquipe: 0.12 },
  },
  provocateur: {
    nom: 'Provocateur', role: 'tank', emoji: '😤',
    description: '+20% PV, attire les coups et renvoie 18% des dégâts subis',
    effet: { pvMult: 1.20, attireCoups: true, renvoiDegats: 0.18 },
  },
  bourrin: {
    nom: 'Bourrin', role: 'dps', emoji: '⚔️',
    description: '+30% de dégâts',
    effet: { degatsMult: 1.30 },
  },
  assassin: {
    nom: 'Assassin', role: 'dps', emoji: '🗡️',
    description: '+15% dégâts, +45% sur les cibles affaiblies (sous 35% PV), +8% critique',
    effet: { degatsMult: 1.15, bonusExecution: 0.45, bonusExecutionSeuil: 0.35, critChance: 0.08, critMult: 2 },
  },
  briseur: {
    nom: 'Briseur', role: 'dps', emoji: '🩸',
    description: '+15% dégâts et réduit de 40% les soins de l\'équipe ennemie',
    effet: { degatsMult: 1.15, reducSoinAdverse: 0.40 },
  },
  vif: {
    nom: 'Vif', role: 'eclaireur', emoji: '⚡',
    description: '+12% de vitesse de jauge pour toute l\'équipe',
    effet: { jaugeMult: 1.10, jaugeEquipe: 0.12 },
  },
  saboteur: {
    nom: 'Saboteur', role: 'eclaireur', emoji: '🔧',
    description: 'Réduit de 15% l\'attaque de toute l\'équipe ennemie (+10% vitesse perso)',
    effet: { jaugeMult: 1.10, reducAttaqueAdverse: 0.15 },
  },
  handicapeur: {
    nom: 'Handicapeur', role: 'eclaireur', emoji: '🕸️',
    description: 'Réduit de 15% la vitesse de jauge de toute l\'équipe ennemie (+10% vitesse perso)',
    effet: { jaugeMult: 1.10, reducVitesseAdverse: 0.15 },
  },
  stratege: {
    nom: 'Stratège', role: 'soutien', emoji: '🧠',
    description: 'Augmente de 15% l\'attaque de l\'équipe et lance des buffs (Rage/Garde/Hâte)',
    effet: { boostDegatsEquipe: 0.15 },
  },
  gardien: {
    nom: 'Gardien', role: 'soutien', emoji: '✨',
    description: 'Augmente de 15% la défense et de 10% les PV de toute l\'équipe',
    effet: { boostDefenseEquipe: 0.15, boostPvEquipe: 0.10 },
  },
  guerisseur: {
    nom: 'Guérisseur', role: 'soutien', emoji: '💚',
    description: 'Soigne régulièrement 7% des PV max de toute l\'équipe',
    effet: { soinPeriodique: 0.07 },
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

// ============================================================
// RÔLE OFFICIEL FIGÉ : lu dans la table donneesPokemon (stats officielles
// des jeux Pokémon, rôle précalculé une fois pour toutes et écrit en dur).
// Fallback (fusions, ids inconnus) : rôle par les stats de base stockées.
//   stat dominante : Défense -> tank | Attaque -> dps
//                    Vitesse -> eclaireur | PV -> soutien
// ============================================================
import { roleOfficiel } from './donneesPokemon'

export function roleDepuisStats(pokemon) {
  const pv  = Number(pokemon?.pvBase) || 50
  const att = Number(pokemon?.attaqueBase) || 50
  const def = Number(pokemon?.defBase) || 50
  const vit = Number(pokemon?.vitesseBase) || 50
  // Même pondération que la table officielle (def/pv légèrement favorisés).
  const candidats = [
    { role: 'tank', valeur: def * 1.06 },
    { role: 'soutien', valeur: pv * 1.06 },
    { role: 'dps', valeur: att * 0.94 },
    { role: 'eclaireur', valeur: vit },
  ]
  let meilleur = candidats[0]
  for (const c of candidats) {
    if (c.valeur > meilleur.valeur) meilleur = c
  }
  return meilleur.role
}

export function determinerRole(pokemon) {
  if (!pokemon) return 'dps'
  // 1) Rôle forcé par parchemin (choix du joueur) : priorité absolue.
  if (pokemon.roleForce && (ROLES[pokemon.roleForce] || pokemon.roleForce === 'joker')) {
    return pokemon.roleForce
  }
  // 2) Exceptions manuelles éventuelles (par nom).
  const nom = (pokemon.nom || pokemon.nomEspece || '').toLowerCase()
  if (ROLES_FORCES[nom]) return ROLES_FORCES[nom]
  // 3) Rôle OFFICIEL figé (table en dur basée sur les vraies stats des jeux).
  const officiel = roleOfficiel(pokemon.id || pokemon.numero)
  if (officiel) return officiel
  // 4) Fallback (fusions, ids hors table) : stats de base stockées.
  return roleDepuisStats(pokemon)
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

export const BONUS_ROLE = {
  tank:      { pvMult: 1.30, degatsMult: 1.0,  jaugeMult: 1.0,  regenEquipe: 0 },
  dps:       { pvMult: 1.0,  degatsMult: 1.25, jaugeMult: 1.0,  regenEquipe: 0 },
  eclaireur: { pvMult: 1.0,  degatsMult: 1.0,  jaugeMult: 1.20, regenEquipe: 0 },
  soutien:   { pvMult: 1.0,  degatsMult: 1.0,  jaugeMult: 1.0,  regenEquipe: 0.03 },
}
export function bonusDuRole(role) {
  return BONUS_ROLE[role] || { pvMult: 1, degatsMult: 1, jaugeMult: 1, regenEquipe: 0 }
}

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
  for (const p of (Array.isArray(equipe) ? equipe : [])) {
    if (!p) continue
    const role = roleEffectif(p)
    if (compte[role] !== undefined) compte[role] += 1
  }
  return compte
}

export function compterSpeciaux(equipe) {
  let n = 0
  for (const p of (Array.isArray(equipe) ? equipe : [])) {
    if (!p) continue
    if (p.estSpecial === true || p.rarete === 'special') n += 1
  }
  return n
}

export function compositionValide(equipe) {
  const membres = (Array.isArray(equipe) ? equipe : []).filter(Boolean)
  if (membres.length < TAILLE_EQUIPE) return true
  const compte = compterRoles(membres)
  for (const role of ['tank', 'eclaireur', 'soutien', 'dps']) {
    if (compte[role] < MIN_PAR_ROLE) return false
    if (compte[role] > MAX_PAR_ROLE) return false
  }
  if (compterSpeciaux(membres) > MAX_SPECIAL) return false
  return true
}

export function diagnostiqueComposition(equipe) {
  const membres = (Array.isArray(equipe) ? equipe : []).filter(Boolean)
  if (membres.length < TAILLE_EQUIPE) {
    return [`Équipe libre (${membres.length}/${TAILLE_EQUIPE}). À 6 Pokémon : 1 de chaque rôle minimum, 2 maximum par rôle, 1 spécial max.`]
  }
  const compte = compterRoles(membres)
  const messages = []
  for (const role of ['tank', 'eclaireur', 'soutien', 'dps']) {
    const labelRole = ROLES[role].nom
    if (compte[role] < MIN_PAR_ROLE) messages.push(`Il manque un ${labelRole}`)
    else if (compte[role] > MAX_PAR_ROLE) messages.push(`Trop de ${labelRole} (max ${MAX_PAR_ROLE})`)
  }
  if (compterSpeciaux(membres) > MAX_SPECIAL) {
    messages.push(`1 seul Pokémon spécial autorisé par équipe`)
  }
  return messages
}

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