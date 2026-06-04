// ============================================================
// RÔLES DES POKÉMON (système enrichi : 4 rôles × 3 passifs = 12 passifs)
//
// NOUVEAU : le RÔLE est maintenant déterminé par les VRAIES STATS de base du
// Pokémon (table figée dans rolesPokemon.js, calculée depuis PokeAPI).
//   - On regarde quelle stat démarque le plus le Pokémon de la moyenne :
//     PV/Défense -> Tank, Attaque/Atq.Spé -> DPS, Vitesse -> Éclaireur, Déf.Spé -> Soutien.
//   - 21 grands légendaires sont des "Joker" (rôle flexible — géré plus tard).
// - Une table ROLES_FORCES permet de corriger les cas spéciaux à la main (par nom).
// - Chaque rôle a 3 PASSIFS. Le JOUEUR choisit le passif (champ pokemon.passifChoisi) ;
//   sinon on déduit un passif automatique selon le style/type ; défaut = 1er passif du rôle.
// - Composition d'équipe imposée : 1 Tank, 1 Éclaireur, 2 Support, 2 DPS.
// ============================================================

import { roleParNumero } from './rolesPokemon'

// ---------- LES 4 RÔLES (+ le Joker, rôle flexible) ----------
export const ROLES = {
  tank:       { nom: 'Tank',      emoji: '🛡️', couleur: '#5bc47f' },
  dps:        { nom: 'DPS',       emoji: '⚔️', couleur: '#ef7d57' },
  eclaireur:  { nom: 'Éclaireur', emoji: '⚡', couleur: '#ffcd75' },
  soutien:    { nom: 'Soutien',   emoji: '💚', couleur: '#41a6f6' },
  // Le Joker (légendaires emblématiques) : peut remplir N'IMPORTE QUELLE case.
  // Le joueur choisit sa case (pokemon.jokerCase) ; il joue alors ce rôle en combat.
  joker:      { nom: 'Joker',     emoji: '🃏', couleur: '#d986ff' },
}

// Le rôle qu'un Joker occupe par défaut tant que le joueur n'a pas choisi sa case.
export const JOKER_CASE_DEFAUT = 'dps'
// Les cases qu'un Joker peut occuper (= les 4 rôles normaux).
export const CASES_JOKER = ['tank', 'eclaireur', 'soutien', 'dps']

// Composition d'équipe imposée (nombre de chaque rôle).
export const COMPOSITION_REQUISE = { tank: 1, eclaireur: 1, soutien: 2, dps: 2 }
export const TAILLE_EQUIPE = 6

// ---------- ANCIENNE TABLE TYPE → RÔLE (gardée en SECOURS uniquement) ----------
// Utilisée seulement si on n'a pas le numéro du Pokémon (cas très rare).
const TYPE_VERS_ROLE = {
  rock: 'tank', steel: 'tank', ground: 'tank',
  fighting: 'dps', dragon: 'dps', fire: 'dps', dark: 'dps',
  flying: 'eclaireur', electric: 'eclaireur', bug: 'eclaireur',
  psychic: 'soutien', fairy: 'soutien', grass: 'soutien',
  water: 'soutien', normal: 'soutien', ghost: 'soutien',
  poison: 'tank', ice: 'eclaireur',
}

// ---------- TABLE D'EXCEPTIONS (à remplir à la main) ----------
// Force le rôle de certaines espèces (clé = nom PokeAPI en minuscules).
// Priorité ABSOLUE sur la table par stats : si un Pokémon est ici, c'est ce rôle.
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
    description: 'Régénère 1.5% des PV de toute l\'équipe à chaque attaque',
    effet: { regenEquipe: 0.015 },
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

  // ===== JOKER (passifs uniques, puissants) =====
  cameleon: {
    nom: 'Caméléon', role: 'joker', emoji: '🦎',
    description: '+15% à toutes ses stats (PV, attaque, vitesse, défense)',
    effet: { pvMult: 1.15, degatsMult: 1.15, jaugeMult: 1.15, defMult: 1.15 },
  },
  coupDeChance: {
    nom: 'Coup de chance', role: 'joker', emoji: '🎲',
    description: '20% de chance d\'infliger un coup critique (×2 dégâts)',
    effet: { critChance: 0.20, critMult: 2 },
  },
  meneur: {
    nom: 'Meneur', role: 'joker', emoji: '👑',
    description: 'Augmente de 10% l\'attaque de toute l\'équipe',
    effet: { boostDegatsEquipe: 0.10 },
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

// Passif par défaut de chaque rôle (= 1er passif du rôle, si aucun type ne matche).
const PASSIF_DEFAUT = { tank: 'colosse', dps: 'bourrin', eclaireur: 'vif', soutien: 'guerisseur', joker: 'cameleon' }

// ---------- CHOIX DE PASSIF PAR LE JOUEUR (nouveau) ----------
// Liste ORDONNÉE des clés de passifs par rôle. L'ordre = ordre d'affichage dans l'UI,
// et le 1er élément est le passif PAR DÉFAUT du rôle.
export const PASSIFS_PAR_ROLE = {
  tank:      ['colosse', 'carapace', 'provocateur'],
  dps:       ['bourrin', 'assassin', 'berserk'],
  eclaireur: ['vif', 'precurseur', 'frenetique'],
  soutien:   ['guerisseur', 'tacticien', 'gardien'],
  joker:     ['cameleon', 'coupDeChance', 'meneur'],
}

// Renvoie les 3 objets passifs d'un rôle (pour peupler le sélecteur de l'UI).
// Chaque élément = { cle, ...donnéesDuPassif }.
export function passifsDuRole(role) {
  const cles = PASSIFS_PAR_ROLE[role] || []
  return cles.map((cle) => ({ cle, ...PASSIFS[cle] })).filter((p) => p.nom)
}

// Renvoie la CLÉ du passif par défaut d'un rôle (= le 1er de la liste).
export function passifParDefautDuRole(role) {
  return PASSIF_DEFAUT[role] || (PASSIFS_PAR_ROLE[role] && PASSIFS_PAR_ROLE[role][0]) || 'bourrin'
}

// Vrai si une clé de passif appartient bien au rôle donné.
export function passifAppartientAuRole(clePassif, role) {
  return (PASSIFS_PAR_ROLE[role] || []).includes(clePassif)
}

// ---------- FONCTIONS ----------

// Détermine le RÔLE d'un Pokémon.
// Ordre de priorité :
//   1) Exception forcée par nom (ROLES_FORCES).
//   2) Table figée par NUMÉRO de Pokédex (vraies stats PokeAPI).
//   3) Secours : par type principal (ancienne logique).
//   4) Fallback : DPS.
export function determinerRole(pokemon) {
  if (!pokemon) return 'dps'
  // 0) Rôle FORCÉ sur cet exemplaire précis (via un objet endgame : Parchemin / Sceau Joker).
  //    Priorité absolue, au-dessus de tout (c'est un choix explicite du joueur sur CE Pokémon).
  if (pokemon.roleForce && (ROLES[pokemon.roleForce] || pokemon.roleForce === 'joker')) {
    return pokemon.roleForce
  }
  // 1) Exception forcée par nom d'espèce ?
  const nom = (pokemon.nom || pokemon.nomEspece || '').toLowerCase()
  if (ROLES_FORCES[nom]) return ROLES_FORCES[nom]
  // 2) Table figée par numéro (le plus fiable).
  const num = pokemon.id || pokemon.numero || null
  if (num) {
    const r = roleParNumero(num)
    if (r) return r
  }
  // 3) Secours : par type principal.
  const types = pokemon.types || []
  for (const t of types) {
    if (TYPE_VERS_ROLE[t]) return TYPE_VERS_ROLE[t]
  }
  // 4) Fallback : DPS.
  return 'dps'
}

// Vrai si le Pokémon a le rôle Joker (rôle flexible).
// Inclut les Jokers natifs (légendaires) ET ceux transformés via le Sceau du Joker (roleForce).
export function estJoker(pokemon) {
  if (!pokemon) return false
  if (pokemon.roleForce === 'joker') return true
  return (pokemon.role || determinerRole(pokemon)) === 'joker'
}

// Renvoie le rôle EFFECTIF d'un Pokémon = le rôle réellement utilisé pour la compo,
// le ciblage, le tri et l'ordre d'attaque.
//   - Pokémon normal  -> son rôle.
//   - Joker AVEC case choisie (pokemon.jokerCase valide) -> cette case.
//   - Joker SANS case -> JOKER_CASE_DEFAUT (= 'dps').
// C'est CETTE fonction qu'on utilise partout à la place de "role === 'joker' ? 'dps'".
export function roleEffectif(pokemon) {
  if (!pokemon) return 'dps'
  // Le rôle forcé (objet) prime sur le rôle stocké, même si pokemon.role est resté figé.
  const role = pokemon.roleForce || pokemon.role || determinerRole(pokemon)
  if (role !== 'joker') return role
  const choisie = pokemon.jokerCase
  if (choisie && CASES_JOKER.includes(choisie)) return choisie
  return JOKER_CASE_DEFAUT
}

// Détermine le PASSIF AUTOMATIQUE d'un Pokémon (selon son rôle + son style/type).
// C'est le passif "suggéré" tant que le joueur n'a rien choisi.
export function determinerPassif(pokemon) {
  if (!pokemon) return 'bourrin'
  const role = pokemon.roleForce || pokemon.role || determinerRole(pokemon)
  // Le Joker a ses propres passifs : par défaut le 1er (Caméléon).
  if (role === 'joker') return PASSIF_DEFAUT.joker
  const table = TYPE_VERS_PASSIF[role] || {}
  const types = pokemon.types || []
  for (const t of types) {
    if (table[t]) return table[t]
  }
  return PASSIF_DEFAUT[role] || 'bourrin'
}

// Renvoie la CLÉ du passif EFFECTIF d'un Pokémon, selon la priorité :
//   1) Choix du joueur (pokemon.passifChoisi) S'IL correspond au rôle actuel.
//   2) Passif automatique (determinerPassif) — pour anciennes saves / pas de choix.
//   3) Garde-fou : 1er passif du rôle.
export function passifEffectif(pokemon) {
  if (!pokemon) return 'bourrin'
  // On garde le rôle TEL QUEL (y compris 'joker') : les passifs Joker
  // (Caméléon/Coup de chance/Meneur) n'appartiennent qu'au rôle 'joker'.
  // Le rôle forcé (objet) prime sur le rôle stocké.
  const role = pokemon.roleForce || pokemon.role || determinerRole(pokemon)
  // 1) Choix du joueur, seulement s'il est valide pour le rôle actuel.
  const choisi = pokemon.passifChoisi
  if (choisi && passifAppartientAuRole(choisi, role)) return choisi
  // 2) Passif automatique selon le style/type.
  const auto = determinerPassif(pokemon)
  if (PASSIFS[auto]) return auto
  // 3) Garde-fou.
  return passifParDefautDuRole(role)
}

// Renvoie l'objet passif complet (avec fallback neutre).
// Utilise désormais passifEffectif (qui respecte le choix du joueur).
export function passifDe(pokemon) {
  if (!pokemon) return null
  const cle = passifEffectif(pokemon)
  return PASSIFS[cle] || null
}

// ---------- COMPATIBILITÉ avec l'ancien système (bonusDuRole) ----------
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
export function bonusDuPassif(pokemon) {
  const neutre = {
    pvMult: 1, degatsMult: 1, jaugeMult: 1, regenEquipe: 0,
    attireCoups: false, reducDegatsEquipe: 0, renvoiDegats: 0,
    bonusExecution: 0, degatsParAllieKO: 0,
    jaugeEquipe: 0, jaugeDepart: 0, jaugeMontante: 0,
    boostDegatsEquipe: 0, boostPvEquipe: 0,
    // Champs Joker :
    defMult: 1, critChance: 0, critMult: 1,
  }
  const p = passifDe(pokemon)
  if (!p) return neutre
  return { ...neutre, ...p.effet }
}

// ---------- HELPERS DE COMPOSITION D'ÉQUIPE ----------

// Compte les rôles présents dans une liste de Pokémon.
// Le Joker compte comme la CASE qu'il occupe (roleEffectif).
export function compterRoles(equipe) {
  const compte = { tank: 0, dps: 0, eclaireur: 0, soutien: 0 }
  for (const p of equipe) {
    if (!p) continue
    const role = roleEffectif(p)
    if (compte[role] !== undefined) compte[role] += 1
  }
  return compte
}

// Vérifie si une équipe respecte la composition imposée (1T/1E/2S/2D).
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

// ---------- TRI PAR RÔLE (ordre Tank → Éclaireur → DPS → Soutien) ----------
// Ordre d'affichage ET d'attaque voulu dans tout le jeu.
export const ORDRE_ROLES = { tank: 0, eclaireur: 1, dps: 2, soutien: 3 }

// Donne le rang d'ordre d'un Pokémon selon son rôle EFFECTIF
// (le Joker se range dans la case qu'il occupe).
function rangRole(pokemon) {
  const role = roleEffectif(pokemon)
  return ORDRE_ROLES[role] ?? 2
}

// Trie une LISTE DE POKÉMON par rôle (Tank → Éclaireur → DPS → Soutien).
// Tri stable : à rôle égal, l'ordre d'origine est conservé.
export function trierEquipeParRole(equipe) {
  return (equipe || [])
    .map((p, i) => ({ p, i }))
    .sort((a, b) => {
      const ra = rangRole(a.p)
      const rb = rangRole(b.p)
      if (ra !== rb) return ra - rb
      return a.i - b.i // stable
    })
    .map((x) => x.p)
}

// Trie une LISTE D'UID (equipeIds) par rôle, en retrouvant chaque Pokémon dans `captures`.
// Sert à ranger l'équipe "à la source" (Stratégie A) : tout le reste (PV, combat) suit.
export function trierIdsParRole(ids, captures) {
  const trouve = (uid) => (captures || []).find((p) => p && p.uid === uid)
  return [...(ids || [])]
    .map((uid, i) => ({ uid, i, rang: rangRole(trouve(uid)) }))
    .sort((a, b) => (a.rang !== b.rang ? a.rang - b.rang : a.i - b.i))
    .map((x) => x.uid)
}