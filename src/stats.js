// Logique des IV + niveaux.

import { determinerRole, determinerPassif, bonusDuPassif } from './roles'
import { bonusStatsObjet } from './objets'

const STAT_MAX_IV = 31

export function genererIV() {
  return {
    pv: Math.floor(Math.random() * (STAT_MAX_IV + 1)),
    attaque: Math.floor(Math.random() * (STAT_MAX_IV + 1)),
    vitesse: Math.floor(Math.random() * (STAT_MAX_IV + 1)),
  }
}

// --- Helper anti-NaN ---
// Renvoie un nombre fini et >= min, sinon la valeur de repli.
// C'est la clé du blindage : si une stat de base ou un IV est undefined/NaN,
// on retombe sur une valeur saine au lieu de produire NaN (qui fige le combat).
function nombreSur(valeur, repli) {
  return Number.isFinite(valeur) ? valeur : repli
}

// Montée d'XP "marathon" (courbe D2) : début fluide, fin très longue (montée en puissance).
function multiplicateurProgressif(niveau) {
  return 1 + niveau * 0.025
}

// XP nécessaire pour passer du niveau actuel au suivant.
export function xpRequise(niveau, xpBase) {
  const n = nombreSur(niveau, 1)
  const base = nombreSur(xpBase, 20) * Math.pow(n, 1.8)
  return Math.max(1, Math.round(base * multiplicateurProgressif(n)))
}

// Calcule les stats finales : (base + IV) × multiplicateur de niveau, + bonus de PASSIF + objet.
// Le PV perso du passif (Colosse +40%, Carapace +25%, etc.) est appliqué ici.
// La DÉFENSE peut aussi être boostée par un passif (Caméléon du Joker : defMult).
// Les bonus d'ÉQUIPE (Gardien +20% PV équipe) sont appliqués ailleurs (construction de l'équipe).
//
// BLINDAGE ANTI-FREEZE : chaque stat de base et chaque IV passe par nombreSur(...) pour
// ne JAMAIS produire NaN. Une vitesse NaN bloquerait la jauge ATB → combat figé.
// Valeurs de repli raisonnables : base 50, IV 0, multiplicateurs 1. En dernier recours,
// on force chaque sortie à être un entier fini >= 1.
export function statsFinales(pokemon, bonusNiveau = 0.08) {
  const p = pokemon || {}
  const ivBrut = p.iv || {}
  const iv = {
    pv: nombreSur(ivBrut.pv, 0),
    attaque: nombreSur(ivBrut.attaque, 0),
    vitesse: nombreSur(ivBrut.vitesse, 0),
  }
  const niveau = nombreSur(p.niveau, 1)
  const mult = 1 + nombreSur(bonusNiveau, 0.08) * (niveau - 1)

  // Stats de base : repli à 50 si absentes/cassées (cas formes spéciales mal lues, vieilles saves).
  const pvBase = nombreSur(p.pvBase, 50)
  const attaqueBase = nombreSur(p.attaqueBase, 50)
  const vitesseBase = nombreSur(p.vitesseBase, 50)
  const defBase = nombreSur(p.defBase, 50)

  // Rôle + passif (déduits du type/style, ou stockés sur le pokémon).
  const role = p.role || determinerRole(p)
  const passif = bonusDuPassif({ ...p, role })

  // Bonus de l'objet équipé (déjà neutre par défaut, mais on sécurise quand même).
  const obj = bonusStatsObjet(p.objetEquipe) || {}
  const objPv = nombreSur(obj.pv, 1)
  const objAtt = nombreSur(obj.attaque, 1)
  const objVit = nombreSur(obj.vitesse, 1)
  const objDef = nombreSur(obj.defense, 1)

  const pvMult = nombreSur(passif.pvMult, 1)
  const defMult = nombreSur(passif.defMult, 1)

  // Calcul + garde-fou final : chaque sortie est un entier fini >= 1.
  const finir = (v, min) => {
    const r = Math.round(v)
    return Number.isFinite(r) && r >= min ? r : min
  }

  return {
    pvMax: finir((pvBase + iv.pv) * mult * pvMult * objPv, 1),
    attaque: finir((attaqueBase + iv.attaque) * mult * objAtt, 1),
    vitesse: finir((vitesseBase + iv.vitesse) * mult * objVit, 1),
    defense: finir(defBase * mult * defMult * objDef, 1),
    role,
  }
}

export function fusionnerIV(ivAncien, ivNouveau) {
  const a = ivAncien || {}
  const b = ivNouveau || {}
  return {
    pv: Math.max(nombreSur(a.pv, 0), nombreSur(b.pv, 0)),
    attaque: Math.max(nombreSur(a.attaque, 0), nombreSur(b.attaque, 0)),
    vitesse: Math.max(nombreSur(a.vitesse, 0), nombreSur(b.vitesse, 0)),
  }
}

// Ajoute de l'XP à un Pokémon, gère les montées de niveau (peut en gagner plusieurs).
// BLINDAGE : la boucle while est bornée (sécurité anti-boucle-infinie) et l'XP requise
// ne peut pas être <= 0 (xpRequise force un minimum de 1).
export function ajouterXP(pokemon, xp, xpBase, bonusNiveau) {
  let p = { ...pokemon, xp: nombreSur(pokemon.xp, 0) + nombreSur(xp, 0), niveau: nombreSur(pokemon.niveau, 1) }
  let niveauxGagnes = 0
  // Plafond de sécurité : jamais plus de 500 montées d'un coup (anti-boucle infinie
  // si une valeur déraille). En pratique on n'atteint jamais ça.
  let garde = 0
  while (p.xp >= xpRequise(p.niveau, xpBase) && garde < 500) {
    p.xp -= xpRequise(p.niveau, xpBase)
    p.niveau += 1
    niveauxGagnes += 1
    garde += 1
  }
  if (niveauxGagnes > 0) {
    const finales = statsFinales(p, bonusNiveau)
    p = { ...p, ...finales }
  }
  return { pokemon: p, niveauxGagnes }
}