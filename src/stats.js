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

// Montée d'XP "marathon" (courbe D2) : début fluide, fin très longue (montée en puissance).
function multiplicateurProgressif(niveau) {
  return 1 + niveau * 0.025
}

// XP nécessaire pour passer du niveau actuel au suivant.
export function xpRequise(niveau, xpBase) {
  const base = xpBase * Math.pow(niveau, 1.8)
  return Math.round(base * multiplicateurProgressif(niveau))
}

// Calcule les stats finales : (base + IV) × multiplicateur de niveau, + bonus de PASSIF + objet.
// Le PV perso du passif (Colosse +40%, Carapace +25%, etc.) est appliqué ici.
// Les bonus d'ÉQUIPE (Gardien +20% PV équipe) sont appliqués ailleurs (construction de l'équipe).
export function statsFinales(pokemon, bonusNiveau = 0.08) {
  const iv = pokemon.iv || { pv: 0, attaque: 0, vitesse: 0 }
  const niveau = pokemon.niveau || 1
  const mult = 1 + bonusNiveau * (niveau - 1)
  const defBase = pokemon.defBase ?? 50
  // Rôle + passif (déduits du type/style, ou stockés sur le pokémon).
  const role = pokemon.role || determinerRole(pokemon)
  const passif = bonusDuPassif({ ...pokemon, role })
  // Bonus de l'objet équipé.
  const obj = bonusStatsObjet(pokemon.objetEquipe)
  return {
    pvMax: Math.round((pokemon.pvBase + iv.pv) * mult * (passif.pvMult || 1) * obj.pv),
    attaque: Math.round((pokemon.attaqueBase + iv.attaque) * mult * obj.attaque),
    vitesse: Math.round((pokemon.vitesseBase + iv.vitesse) * mult * obj.vitesse),
    defense: Math.round(defBase * mult * obj.defense),
    role,
  }
}

export function fusionnerIV(ivAncien, ivNouveau) {
  return {
    pv: Math.max(ivAncien.pv, ivNouveau.pv),
    attaque: Math.max(ivAncien.attaque, ivNouveau.attaque),
    vitesse: Math.max(ivAncien.vitesse, ivNouveau.vitesse),
  }
}

// Ajoute de l'XP à un Pokémon, gère les montées de niveau (peut en gagner plusieurs).
export function ajouterXP(pokemon, xp, xpBase, bonusNiveau) {
  let p = { ...pokemon, xp: (pokemon.xp || 0) + xp, niveau: pokemon.niveau || 1 }
  let niveauxGagnes = 0
  while (p.xp >= xpRequise(p.niveau, xpBase)) {
    p.xp -= xpRequise(p.niveau, xpBase)
    p.niveau += 1
    niveauxGagnes += 1
  }
  if (niveauxGagnes > 0) {
    const finales = statsFinales(p, bonusNiveau)
    p = { ...p, ...finales }
  }
  return { pokemon: p, niveauxGagnes }
}