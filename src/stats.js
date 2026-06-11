// Logique des IV + niveaux.
//
// ============================================================
// SYSTÈME DE STATS REFONDU (v2)
// stat = baseScalée(base_réelle) × facteurNiveau × (1 + IV/62) × mults
//
//  - baseScalée : garde les PROPORTIONS réelles des Pokémon (issues de
//    PokeAPI : pvBase=hp, attaqueBase=attack, etc.) mais recalibrées pour
//    des chiffres sains et un combat auto équilibré.
//  - facteurNiveau : croissance INFINIE qui RALENTIT (puissance < 1).
//    Pas de mur dur → on peut viser niveau 200, 500, 1000... sans explosion.
//    La DÉFENSE scale volontairement peu (la formule de combat est
//    100/(100+déf) : une défense trop haute rendrait les dégâts ridicules).
//  - IV (0-31) : bonus % CONSTANT à tous les niveaux (max +50%), donc juste.
//
// Compatible avec moteurCombat.js SANS le modifier. La signature
// statsFinales(pokemon, bonusNiveau) est conservée (2e arg ignoré).
// ============================================================

import { determinerRole, determinerPassif, bonusDuPassif } from './roles'
import { bonusStatsObjet } from './objets'

export const STAT_MAX_IV = 31

// BONUS SHINY : multiplicateur applique a TOUTES les stats d'un Pokemon shiny.
export const BONUS_SHINY = 1.08

// ============================================================
// BONUS PUISSANCE GLOBAL (prestige + amelioration boutique).
// Variable module-level mise a jour par App.jsx via setBonusPuissance().
// Integree dans statsFinales -> s'applique PARTOUT (Histoire, Arene, Tour,
// PvP, Raids) ET s'affiche dans la fiche. Meme pattern que bonusShinyGlobal.
// Booste PV / ATT / DEF / VIT.
// ============================================================
let _bonusPuissanceGlobal = 1

export function setBonusPuissance(valeur) {
  const v = Number(valeur)
  _bonusPuissanceGlobal = Number.isFinite(v) && v > 0 ? v : 1
}

export function getBonusPuissance() {
  return _bonusPuissanceGlobal
}

export function genererIV() {
  return {
    pv: Math.floor(Math.random() * (STAT_MAX_IV + 1)),
    attaque: Math.floor(Math.random() * (STAT_MAX_IV + 1)),
    vitesse: Math.floor(Math.random() * (STAT_MAX_IV + 1)),
    defense: Math.floor(Math.random() * (STAT_MAX_IV + 1)),
  }
}

// --- Helper anti-NaN ---
function nombreSur(valeur, repli) {
  return Number.isFinite(valeur) ? valeur : repli
}

// Normalise un objet IV : garantit les 4 stats (migration des vieux IV à 3 stats).
export function normaliserIV(iv) {
  const src = iv || {}
  return {
    pv: nombreSur(src.pv, 0),
    attaque: nombreSur(src.attaque, 0),
    vitesse: nombreSur(src.vitesse, 0),
    defense: Number.isFinite(src.defense)
      ? src.defense
      : Math.floor(Math.random() * (STAT_MAX_IV + 1)),
  }
}

// Montée d'XP "marathon".
function multiplicateurProgressif(niveau) {
  return 1 + niveau * 0.035
}

// XP nécessaire pour passer du niveau actuel au suivant.
export function xpRequise(niveau, xpBase) {
  const n = nombreSur(niveau, 1)
  const base = nombreSur(xpBase, 20) * Math.pow(n, 1.7)
  return Math.max(1, Math.round(base * multiplicateurProgressif(n)))
}

// ============================================================
// NOUVELLE FORMULE DE STATS
// ============================================================

// Bases scalées : conservent les proportions réelles Pokémon.
// (base réelle PokeAPI : ~5 à ~255 selon la stat)
function baseScaleePV(b)  { return 25 + nombreSur(b, 50) * 0.40 }
function baseScaleeATT(b) { return 25 + nombreSur(b, 50) * 0.45 }
function baseScaleeDEF(b) { return 15 + nombreSur(b, 50) * 0.14 }
function baseScaleeVIT(b) { return 30 + nombreSur(b, 50) * 0.45 }

// Facteurs de niveau (croissance sous-linéaire = ralentit, jamais de mur).
// PV/ATT montent fort, DÉF très peu (équilibre avec 100/(100+déf)), VIT modérée.
function facteurPuissance(niveau) { return Math.pow(Math.max(1, niveau), 0.72) }
function facteurDefense(niveau)   { return Math.pow(Math.max(1, niveau), 0.32) }
function facteurVitesse(niveau)   { return Math.pow(Math.max(1, niveau), 0.40) }

// Bonus IV : pourcentage constant à tous niveaux (IV 0-31 -> +0% à +50%).
function bonusIV(iv) { return 1 + nombreSur(iv, 0) / 62 }

// Calcule les stats finales. (bonusNiveau conservé pour compat, non utilisé.)
// Les Pokemon SHINY reçoivent BONUS_SHINY (+8%) sur toutes les stats.
export function statsFinales(pokemon, bonusNiveau = 0.08) {
  const p = pokemon || {}
  const ivBrut = p.iv || {}
  const iv = {
    pv: nombreSur(ivBrut.pv, 0),
    attaque: nombreSur(ivBrut.attaque, 0),
    vitesse: nombreSur(ivBrut.vitesse, 0),
    defense: nombreSur(ivBrut.defense, 0),
  }
  const niveau = nombreSur(p.niveau, 1)

  // Bonus shiny.
  const multShiny = p.shiny === true ? BONUS_SHINY : 1

  const pvBase = nombreSur(p.pvBase, 50)
  const attaqueBase = nombreSur(p.attaqueBase, 50)
  const vitesseBase = nombreSur(p.vitesseBase, 50)
  const defBase = nombreSur(p.defBase, 50)

  const role = p.role || determinerRole(p)
  const passif = bonusDuPassif({ ...p, role })

  const obj = bonusStatsObjet(p.objetEquipe) || {}
  const objPv = nombreSur(obj.pv, 1)
  const objAtt = nombreSur(obj.attaque, 1)
  const objVit = nombreSur(obj.vitesse, 1)
  const objDef = nombreSur(obj.defense, 1)

  const pvMult = nombreSur(passif.pvMult, 1)
  const defMult = nombreSur(passif.defMult, 1)

  const fP = facteurPuissance(niveau)
  const fD = facteurDefense(niveau)
  const fV = facteurVitesse(niveau)

  // Bonus PUISSANCE global (prestige + boutique) : booste les 4 stats.
  const mPuiss = _bonusPuissanceGlobal

  const finir = (v, min) => {
    const r = Math.round(v)
    return Number.isFinite(r) && r >= min ? r : min
  }

  return {
    pvMax:   finir(baseScaleePV(pvBase)   * fP * bonusIV(iv.pv)      * multShiny * mPuiss * pvMult * objPv, 1),
    attaque: finir(baseScaleeATT(attaqueBase) * fP * bonusIV(iv.attaque) * multShiny * mPuiss * objAtt, 1),
    vitesse: finir(baseScaleeVIT(vitesseBase) * fV * bonusIV(iv.vitesse) * multShiny * mPuiss * objVit, 1),
    defense: finir(baseScaleeDEF(defBase) * fD * bonusIV(iv.defense) * multShiny * mPuiss * defMult * objDef, 1),
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
    defense: Math.max(nombreSur(a.defense, 0), nombreSur(b.defense, 0)),
  }
}

// Ajoute de l'XP à un Pokémon, gère les montées de niveau (peut en gagner plusieurs).
export function ajouterXP(pokemon, xp, xpBase, bonusNiveau) {
  let p = { ...pokemon, xp: nombreSur(pokemon.xp, 0) + nombreSur(xp, 0), niveau: nombreSur(pokemon.niveau, 1) }
  let niveauxGagnes = 0
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