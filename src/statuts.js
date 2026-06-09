// ============================================================
// SYSTÈME DE STATUTS DE COMBAT
// Effets temporaires appliqués aux Pokémon pendant un combat.
// Module autonome : se greffe sur le moteur ATB sans changer
// la façon dont les combats sont lancés.
//
// Chaque statut est stocké sur le Pokémon dans un champ _statuts
// (objet { cle: { tics, intensite, ... } }). Les tics sont décrémentés
// à chaque appel de ticCombat. Tout est borné pour éviter NaN/abus.
// ============================================================

// --- Helper anti-NaN ---
function nb(v, repli, min = 0) {
  const x = Number.isFinite(v) ? v : repli
  return x < min ? min : x
}

// Définition des statuts. duree = nb de tics par défaut.
// Un "tic" = un appel de ticCombat (cadence ~ celle de la boucle de combat).
export const STATUTS = {
  brulure: {
    nom: 'Brûlure', emoji: '🔥', couleur: '#ff6b35', type: 'malus',
    description: 'Dégâts continus + attaque réduite',
    dureeDefaut: 24,
    degatsParTicPctPvMax: 0.012,   // 1.2% PV max / tic
    modifAttaque: -0.20,            // -20% attaque tant que brûlé
  },
  poison: {
    nom: 'Poison', emoji: '☠️', couleur: '#9b5de5', type: 'malus',
    description: 'Dégâts continus qui s\'aggravent',
    dureeDefaut: 30,
    degatsParTicPctPvMax: 0.008,   // commence à 0.8% PV max / tic
    aggravation: 0.0006,           // +0.06% PV max par tic écoulé (poison qui empire)
  },
  gel: {
    nom: 'Gel', emoji: '❄️', couleur: '#4cc9f0', type: 'malus',
    description: 'Jauge fortement ralentie',
    dureeDefaut: 12,
    modifVitesse: -0.65,           // -65% vitesse de jauge
  },
  paralysie: {
    nom: 'Paralysie', emoji: '⚡', couleur: '#ffd60a', type: 'malus',
    description: 'Risque de rater son attaque + vitesse réduite',
    dureeDefaut: 20,
    modifVitesse: -0.25,
    chanceRater: 0.30,             // 30% de rater l'attaque
  },
  rage: {
    nom: 'Rage', emoji: '💢', couleur: '#e63946', type: 'buff',
    description: 'Attaque augmentée',
    dureeDefaut: 22,
    modifAttaque: 0.30,            // +30% attaque
  },
  garde: {
    nom: 'Garde', emoji: '🛡️', couleur: '#48cae4', type: 'buff',
    description: 'Dégâts subis réduits',
    dureeDefaut: 22,
    reducDegatsSubis: 0.30,        // -30% dégâts subis
  },
  hate: {
    nom: 'Hâte', emoji: '🌀', couleur: '#80ed99', type: 'buff',
    description: 'Jauge accélérée',
    dureeDefaut: 22,
    modifVitesse: 0.35,            // +35% vitesse de jauge
  },
}

// Quel statut un type d'attaque peut-il infliger ? (chance douce, pas punitif)
// On garde ça LÉGER : c'est un bonus aléatoire, pas un x4 brutal.
export const TYPE_INFLIGE_STATUT = {
  fire:     { statut: 'brulure',   chance: 0.18 },
  ice:      { statut: 'gel',       chance: 0.15 },
  electric: { statut: 'paralysie', chance: 0.16 },
  poison:   { statut: 'poison',    chance: 0.20 },
  grass:    { statut: 'poison',    chance: 0.10 },  // spores
  ghost:    { statut: 'paralysie', chance: 0.10 },  // effroi
}

// Borne le nombre de statuts simultanés pour éviter les abus / surcharge visuelle.
const MAX_STATUTS_SIMULTANES = 4

// Initialise le conteneur de statuts si absent.
function assurerConteneur(pokemon) {
  if (!pokemon._statuts || typeof pokemon._statuts !== 'object') pokemon._statuts = {}
  return pokemon._statuts
}

// Applique (ou rafraîchit) un statut sur un Pokémon.
export function appliquerStatut(pokemon, cleStatut, options = {}) {
  if (!pokemon) return false
  const def = STATUTS[cleStatut]
  if (!def) return false
  const conteneur = assurerConteneur(pokemon)
  // Si déjà présent : on rafraîchit la durée (et on cumule l'intensité pour le poison).
  const existant = conteneur[cleStatut]
  const duree = nb(options.duree, def.dureeDefaut, 1)
  if (existant) {
    existant.tics = Math.max(existant.tics, duree)
    existant.intensite = Math.min(3, (existant.intensite || 1) + (options.empile ? 1 : 0))
    return true
  }
  // Limite du nombre de statuts.
  if (Object.keys(conteneur).length >= MAX_STATUTS_SIMULTANES) return false
  conteneur[cleStatut] = { tics: duree, intensite: 1, age: 0 }
  return true
}

// Retire un statut.
export function retirerStatut(pokemon, cleStatut) {
  if (pokemon && pokemon._statuts) delete pokemon._statuts[cleStatut]
}

// Le Pokémon a-t-il ce statut ?
export function aStatut(pokemon, cleStatut) {
  return !!(pokemon && pokemon._statuts && pokemon._statuts[cleStatut] && pokemon._statuts[cleStatut].tics > 0)
}

// Renvoie la liste des clés de statuts actifs (pour l'affichage).
export function statutsActifs(pokemon) {
  if (!pokemon || !pokemon._statuts) return []
  return Object.keys(pokemon._statuts).filter((k) => pokemon._statuts[k] && pokemon._statuts[k].tics > 0)
}

// --- Modificateurs agrégés (lus par le moteur) ---

// Modificateur d'attaque dû aux statuts (somme, borné).
export function modifAttaqueStatuts(pokemon) {
  let m = 0
  for (const k of statutsActifs(pokemon)) {
    const def = STATUTS[k]
    if (def && def.modifAttaque) m += def.modifAttaque
  }
  return Math.max(-0.8, Math.min(1.5, m))
}

// Modificateur de vitesse de jauge dû aux statuts (somme, borné).
export function modifVitesseStatuts(pokemon) {
  let m = 0
  for (const k of statutsActifs(pokemon)) {
    const def = STATUTS[k]
    if (def && def.modifVitesse) m += def.modifVitesse
  }
  return Math.max(-0.9, Math.min(1.2, m))
}

// Réduction des dégâts subis (Garde), borné.
export function reducDegatsSubisStatuts(pokemon) {
  let r = 0
  for (const k of statutsActifs(pokemon)) {
    const def = STATUTS[k]
    if (def && def.reducDegatsSubis) r += def.reducDegatsSubis
  }
  return Math.max(0, Math.min(0.7, r))
}

// Le Pokémon rate-t-il son attaque ce tour (paralysie) ?
export function rateAttaque(pokemon) {
  for (const k of statutsActifs(pokemon)) {
    const def = STATUTS[k]
    if (def && def.chanceRater && Math.random() < def.chanceRater) return true
  }
  return false
}

// Applique les dégâts de statut (brûlure, poison) à un Pokémon.
// Modifie pvs[idx] en place et pousse un "coup" visuel. Retourne les dégâts infligés.
export function appliquerDegatsStatuts(pokemon, idx, pvs, coups, camp) {
  if (!pokemon || !pokemon._statuts) return 0
  const pvMax = nb(pokemon.pvMax, 1, 1)
  let totalDegats = 0
  for (const k of statutsActifs(pokemon)) {
    const def = STATUTS[k]
    if (!def || !def.degatsParTicPctPvMax) continue
    const etat = pokemon._statuts[k]
    let pct = def.degatsParTicPctPvMax
    // Poison qui s'aggrave avec l'âge.
    if (def.aggravation) pct += def.aggravation * nb(etat.age, 0, 0)
    const deg = Math.max(1, Math.round(pvMax * pct * nb(etat.intensite, 1, 1)))
    const avant = pvs[idx]
    pvs[idx] = Math.max(0, pvs[idx] - deg)
    const inflige = avant - pvs[idx]
    if (inflige > 0) {
      totalDegats += inflige
      if (coups) coups.push({ montant: inflige, cible: idx, camp, type: 'statut', statut: k, emoji: def.emoji })
    }
  }
  return totalDegats
}

// Décrémente les minuteurs de tous les statuts d'un Pokémon (1 par tic).
// Incrémente aussi l'âge (pour l'aggravation). Nettoie les statuts expirés.
export function vieillirStatuts(pokemon) {
  if (!pokemon || !pokemon._statuts) return
  for (const k of Object.keys(pokemon._statuts)) {
    const etat = pokemon._statuts[k]
    if (!etat) { delete pokemon._statuts[k]; continue }
    etat.tics = nb(etat.tics, 0, 0) - 1
    etat.age = nb(etat.age, 0, 0) + 1
    if (etat.tics <= 0) delete pokemon._statuts[k]
  }
}

// Réinitialise tous les statuts (à appeler en début de combat).
export function reinitialiserStatuts(equipe) {
  for (const p of (equipe || [])) {
    if (p) p._statuts = {}
  }
}

// Tente d'infliger un statut basé sur le type de l'attaquant (appelé après une attaque).
// Retourne la clé du statut infligé, ou null.
export function tenterStatutParType(attaquant, defenseur) {
  if (!attaquant || !defenseur) return null
  const typeAtt = attaquant.types ? attaquant.types[0] : null
  if (!typeAtt) return null
  const regle = TYPE_INFLIGE_STATUT[typeAtt]
  if (!regle) return null
  if (Math.random() < regle.chance) {
    if (appliquerStatut(defenseur, regle.statut)) return regle.statut
  }
  return null
}

// ===== BUFFS D'ÉQUIPE (lancés périodiquement par les Soutiens) =====
// Cadence basée sur les TICS (suit la vitesse de combat, comme le soin).
//   - Rage sur le meilleur attaquant (DPS), Garde sur le Tank, Hâte sur le plus lent.
export const TICS_PAR_BUFF = 180

// Choisit le buff + la cible selon l'équipe. Retourne { cible, statut } ou null.
function choisirBuff(equipe, pvs, roleEffectif) {
  let idxDps = -1, attDps = -1
  let idxTank = -1, pvTank = -1
  let idxLent = -1, vitLent = Infinity
  for (let i = 0; i < equipe.length; i++) {
    const p = equipe[i]
    if (!p || pvs[i] <= 0) continue
    const role = roleEffectif ? roleEffectif(p) : (p.role || 'dps')
    const att = Number.isFinite(p.attaque) ? p.attaque : 0
    const pvmax = Number.isFinite(p.pvMax) ? p.pvMax : 0
    const vit = Number.isFinite(p.vitesse) ? p.vitesse : 50
    if (role === 'dps' && att > attDps) { attDps = att; idxDps = i }
    if (role === 'tank' && pvmax > pvTank) { pvTank = pvmax; idxTank = i }
    if (vit < vitLent) { vitLent = vit; idxLent = i }
  }
  // Priorité : Rage au DPS > Garde au Tank > Hâte au plus lent.
  if (idxDps !== -1) return { cible: idxDps, statut: 'rage' }
  if (idxTank !== -1) return { cible: idxTank, statut: 'garde' }
  if (idxLent !== -1) return { cible: idxLent, statut: 'hate' }
  return null
}

// Appelé une fois par tic pour chaque soutien "tacticien" vivant.
// Lance un buff tous les TICS_PAR_BUFF tics (compteur propre au soutien).
// Retourne { cible, statut } si un buff a été lancé, sinon null.
export function tenterBuffEquipe(soutien, equipe, pvs, roleEffectif) {
  if (!soutien) return null
  soutien._ticsBuff = (Number.isFinite(soutien._ticsBuff) ? soutien._ticsBuff : 0) + 1
  if (soutien._ticsBuff < TICS_PAR_BUFF) return null
  soutien._ticsBuff = 0
  const choix = choisirBuff(equipe, pvs, roleEffectif)
  if (!choix) return null
  if (appliquerStatut(equipe[choix.cible], choix.statut)) return choix
  return null
}