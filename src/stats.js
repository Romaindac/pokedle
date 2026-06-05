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
function nombreSur(valeur, repli) {
  return Number.isFinite(valeur) ? valeur : repli
}

// Montée d'XP "marathon" assouplie pour aller jusqu'au niveau ~500 sans mur.
// (Avant : 1 + niveau*0.025. Adouci à 0.02 pour une fin plus fluide.)
function multiplicateurProgressif(niveau) {
  return 1 + niveau * 0.02
}

// XP nécessaire pour passer du niveau actuel au suivant.
// Exposant assoupli de 1.8 → 1.55 : la fin (niv 200-500) reste longue mais jouable
// (« xp non-stop »), cohérent avec les zones/arène qui montent jusqu'à ~500.
export function xpRequise(niveau, xpBase) {
  const n = nombreSur(niveau, 1)
  const base = nombreSur(xpBase, 20) * Math.pow(n, 1.55)
  return Math.max(1, Math.round(base * multiplicateurProgressif(n)))
}

// Calcule les stats finales : (base + IV) × multiplicateur de niveau, + bonus de PASSIF + objet.
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