// Moteur de combat ATB avec efficacité des types + rôles + PASSIFS (12 passifs + Joker).
//
// REWORK PASSIFS : nouveaux effets pris en charge ici :
//   - soinPeriodique (Guérisseur) : soigne toute l'équipe d'un % de PV max toutes les
//     PERIODE_SOIN_MS (temps RÉEL via Date.now), au lieu d'un soin à chaque attaque.
//     Autonome dans le moteur → fonctionne dans tous les combats (principal/arène/PvP)
//     sans rien changer aux boucles. Réduit par le Briseur adverse (reducSoinAdverse).
//   - reducAttaqueAdverse (Saboteur) : réduit l'attaque de l'équipe adverse.
//   - reducVitesseAdverse (Handicapeur) : réduit la vitesse de jauge de l'équipe adverse.
//   - boostDefenseEquipe (Gardien) : augmente la défense de toute l'équipe (réduit les dégâts subis).
// L'ancien regenEquipe (soin à chaque attaque) est SUPPRIMÉ.

import { DIVISEUR_DEGATS_JOUEUR, DIVISEUR_DEGATS_ENNEMI, VITESSE_JAUGE } from './config'
import { multiplicateurType } from './types'
import { bonusDuPassif, determinerRole, passifDe, PERIODE_SOIN_MS, roleEffectif } from './roles'
import {
  modifAttaqueStatuts, modifVitesseStatuts, reducDegatsSubisStatuts,
  rateAttaque, appliquerDegatsStatuts, vieillirStatuts, tenterStatutParType,
  tenterBuffEquipe,
} from './statuts'
import { bonusSynergies } from './synergies'

// --- Helper anti-NaN local ---
function nombreSur(valeur, repli, min = 0) {
  const v = Number.isFinite(valeur) ? valeur : repli
  return v < min ? min : v
}

// Increment de jauge MINIMUM garanti par tic (anti-blocage).
// Calé sur une vitesse de référence très faible (8) pour qu'une attaque
// finisse TOUJOURS par partir, même si la vitesse réelle est minuscule
// ou fortement ralentie. Empêche le cas "l'ennemi ne tape jamais".
const VJ = nombreSur(VITESSE_JAUGE, 0.05, 0.0001)
const INCREMENT_MIN_JAUGE = 8 * VJ * 0.4

export function premierVivant(pvs) {
  return pvs.findIndex((pv) => pv > 0)
}

function passifEffet(pokemon) {
  return bonusDuPassif(pokemon)
}

// Choisit la cible : un Pokémon qui ATTIRE LES COUPS (tank) vivant en priorité, sinon premier vivant.
function choisirCible(equipe, pvs) {
  for (let i = 0; i < equipe.length; i++) {
    if (pvs[i] > 0 && equipe[i] && passifEffet(equipe[i]).attireCoups) return i
  }
  return premierVivant(pvs)
}

// Somme d'un champ d'effet sur les membres vivants (ex: boostDegatsEquipe).
function bonusEquipe(equipe, pvs, champ) {
  let total = 0
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] > 0) total += passifEffet(equipe[i])[champ] || 0
  }
  return total
}

// Meilleure valeur d'un champ parmi les membres vivants (pas cumulée à l'infini), plafonnée.
function meilleureReduc(equipe, pvs, champ, plafond = 0.6) {
  let best = 0
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] > 0) best = Math.max(best, passifEffet(equipe[i])[champ] || 0)
  }
  return Math.min(plafond, best)
}

function alliesKO(equipe, pvs) {
  let n = 0
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] <= 0) n += 1
  }
  return n
}

// Calcule les dégâts d'un attaquant sur un défenseur.
function calculerDegats(attaquant, defenseur, diviseur, ctx) {
  if (!attaquant || !defenseur) return { degats: 0, multiplicateur: 1, critique: false }
  const typeAtt = attaquant.types ? attaquant.types[0] : null
  const mult = nombreSur(multiplicateurType(typeAtt, defenseur.types || []), 1, 0)
  const passif = passifEffet(attaquant)
  const div = nombreSur(diviseur, 6, 0.0001)
  // Attaque de base, RÉDUITE par le Saboteur adverse (reducAttaqueImposee, 0..1).
  const reducAtt = 1 - nombreSur(ctx?.reducAttaqueImposee || 0, 0, 0)
  // Modificateur d'attaque dû aux STATUTS de l'attaquant (brûlure -, rage +).
  const modAttStatut = 1 + modifAttaqueStatuts(attaquant)
  const attEffective = nombreSur(attaquant.attaque, 50, 1) * Math.max(0.2, reducAtt) * Math.max(0.1, modAttStatut)
  const base = Math.max(1, attEffective / div)
  // Défense de la cible, AUGMENTÉE par le Gardien de son équipe (boostDefenseDef, fraction).
  const defBoost = 1 + nombreSur(ctx?.boostDefenseDef || 0, 0, 0)
  const defenseCible = nombreSur(defenseur.defense, 50, 0) * defBoost
  let reducDefense = 100 / (100 + defenseCible)
  reducDefense = nombreSur(reducDefense, 0.5, 0.0001)
  // Ignore-défense (si un passif l'utilise) : on remonte vers 1 (moins de réduction).
  const ignore = nombreSur(passif.ignoreDefense || 0, 0, 0)
  if (ignore > 0) reducDefense = reducDefense + (1 - reducDefense) * Math.min(1, ignore)

  let degatsMult = nombreSur(passif.degatsMult, 1, 0) || 1
  degatsMult *= (1 + nombreSur(ctx?.boostDegatsAllie, 0, 0)) // Stratège
  // Assassin : exécution sous le seuil.
  if (passif.bonusExecution && ctx?.pvCible !== undefined && defenseur.pvMax) {
    const seuil = passif.bonusExecutionSeuil || 0.35
    if (ctx.pvCible / defenseur.pvMax < seuil) degatsMult *= (1 + passif.bonusExecution)
  }

  let critique = false
  const chanceCrit = nombreSur(passif.critChance, 0, 0) + nombreSur(ctx?.critBonus, 0, 0)
  if (chanceCrit > 0 && Math.random() < chanceCrit) {
    critique = true
    degatsMult *= (passif.critMult || 2)
  }

  const reducEquipe = 1 - nombreSur(ctx?.reducDegatsDef, 0, 0) // Carapace côté défenseur
  // Réduction due au STATUT Garde du défenseur.
  const reducGarde = 1 - reducDegatsSubisStatuts(defenseur)

  const brut = base * mult * reducDefense * nombreSur(degatsMult, 1, 0) * reducEquipe * reducGarde
  let degats = Math.max(1, Math.round(nombreSur(brut, 1, 1)))
  // PLANCHER ANTI-MUR : au moins 1% des PV max de la cible.
  const plancher = Math.round(nombreSur(defenseur.pvMax, 0, 0) * 0.01)
  if (plancher > degats) degats = plancher
  return { degats, multiplicateur: mult, critique }
}

// ===== SOIN PÉRIODIQUE (Guérisseur) =====
// Cadence basée sur les TICS (pas le temps réel) : le soin suit la vitesse de combat.
// En x4, on tic 4x plus vite -> on soigne 4x plus souvent, comme les attaques.
// L'équilibre reste donc constant à toutes les vitesses.
const TICS_PAR_SOIN = 150  // ~ un soin tous les 150 tics
function appliquerSoinPeriodique(soutien, equipe, pvs, coups, camp, reducSoin = 0) {
  if (!soutien) return
  const passif = passifEffet(soutien)
  const pct = passif.soinPeriodique || 0
  if (pct <= 0) return
  // Compteur de tics propre à ce soutien.
  soutien._ticsSoin = nombreSur(soutien._ticsSoin, 0, 0) + 1
  if (soutien._ticsSoin < TICS_PAR_SOIN) return
  soutien._ticsSoin = 0
  const facteurSoin = Math.max(0, 1 - nombreSur(reducSoin, 0, 0))
  if (facteurSoin <= 0) return
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] > 0) {
      const pvMax = nombreSur(equipe[i].pvMax, 1, 1)
      const soin = Math.round(pvMax * pct * facteurSoin)
      const avant = pvs[i]
      pvs[i] = Math.min(pvMax, pvs[i] + soin)
      const gagne = pvs[i] - avant
      if (gagne > 0 && coups) coups.push({ montant: gagne, cible: i, camp, type: 'soin' })
    }
  }
}

// === ULTIMES ===
export function appliquerUltime(idx, ultime, equipeJ, pvJ, jaugeJ, equipeE, pvE, campLanceur = 'joueur') {
  const coups = []
  let bouclierTics = 0
  if (!ultime) return { coups, bouclierTics }
  const lanceur = equipeJ[idx]
  if (!lanceur || pvJ[idx] <= 0) return { coups, bouclierTics }

  const campAdverse = campLanceur === 'joueur' ? 'ennemi' : 'joueur'
  const campAllie = campLanceur

  if (ultime.effet === 'deflagration') {
    const cible = premierVivant(pvE)
    if (cible !== -1 && equipeE[cible]) {
      const att = nombreSur(lanceur.attaque, 50, 1)
      const mult = nombreSur(ultime.multiplicateur, 4, 1)
      const defCible = nombreSur(equipeE[cible].defense, 50, 0)
      const reduc = nombreSur(100 / (100 + defCible), 0.5, 0.0001)
      let degats = Math.max(1, Math.round(att * mult * reduc))
      const plafond = Math.round(nombreSur(equipeE[cible].pvMax, 0, 0) * 0.40)
      if (plafond > 0 && degats > plafond) degats = plafond
      pvE[cible] = Math.max(0, pvE[cible] - degats)
      coups.push({ montant: degats, cible, camp: campAdverse, type: 'crit' })
    }
  } else if (ultime.effet === 'soin') {
    for (let i = 0; i < equipeJ.length; i++) {
      if (equipeJ[i] && pvJ[i] > 0) {
        const pvMax = nombreSur(equipeJ[i].pvMax, 1, 1)
        const soin = Math.round(pvMax * nombreSur(ultime.soin, 0.5, 0))
        const avant = pvJ[i]
        pvJ[i] = Math.min(pvMax, pvJ[i] + soin)
        const gagne = pvJ[i] - avant
        if (gagne > 0) coups.push({ montant: gagne, cible: i, camp: campAllie, type: 'soin' })
      }
    }
  } else if (ultime.effet === 'tempo') {
    for (let i = 0; i < jaugeJ.length; i++) {
      if (equipeJ[i] && pvJ[i] > 0) jaugeJ[i] = 100
    }
  } else if (ultime.effet === 'bouclier') {
    bouclierTics = nombreSur(ultime.duree, 30, 1)
  }

  return { coups, bouclierTics }
}

export function ticCombat(equipeJ, pvJ, jaugeJ, equipeE, pvE, jaugeE, options) {
  // Au tout premier tic d'un combat, les jauges sont à 0 partout : on nettoie
  // les statuts résiduels (ils sont stockés sur l'objet Pokémon, donc pourraient
  // persister d'un combat à l'autre). Détection : aucune jauge entamée.
  const debutCombat = jaugeJ.every((j) => !j || j <= 0) && jaugeE.every((j) => !j || j <= 0)
  if (debutCombat) {
    for (const p of equipeJ) { if (p) { if (p._statuts) p._statuts = {}; p._ticsSoin = 0; p._ticsBuff = 0 } }
    for (const p of equipeE) { if (p) { if (p._statuts) p._statuts = {}; p._ticsSoin = 0; p._ticsBuff = 0 } }
  }
  const nPvJ = [...pvJ]
  const nPvE = [...pvE]
  const nJaugeJ = [...jaugeJ]
  const nJaugeE = [...jaugeE]
  const ennemisTombes = []
  const evenements = []
  const coups = []

  // Pré-calcul des bonus d'équipe (une fois par tic, pour chaque camp).
  const boostDegatsJ = bonusEquipe(equipeJ, nPvJ, 'boostDegatsEquipe')   // Stratège
  const boostDegatsE = bonusEquipe(equipeE, nPvE, 'boostDegatsEquipe')
  const reducDegatsJ = meilleureReduc(equipeJ, nPvJ, 'reducDegatsEquipe') // Carapace (protège J)
  const reducDegatsE = meilleureReduc(equipeE, nPvE, 'reducDegatsEquipe')
  const boostDefenseJ = bonusEquipe(equipeJ, nPvJ, 'boostDefenseEquipe') // Gardien (défense équipe J)
  const boostDefenseE = bonusEquipe(equipeE, nPvE, 'boostDefenseEquipe')
  const jaugeEquipeJ = bonusEquipe(equipeJ, nPvJ, 'jaugeEquipe')          // Vif
  const jaugeEquipeE = bonusEquipe(equipeE, nPvE, 'jaugeEquipe')
  // Malus imposés à l'adversaire (Éclaireur). On prend la MEILLEURE valeur (pas cumulée).
  const reducAttJ = meilleureReduc(equipeJ, nPvJ, 'reducAttaqueAdverse')   // affecte l'attaque ENNEMIE
  const reducAttE = meilleureReduc(equipeE, nPvE, 'reducAttaqueAdverse')   // affecte l'attaque JOUEUR
  const reducVitJ = meilleureReduc(equipeJ, nPvJ, 'reducVitesseAdverse')   // ralentit l'ENNEMI
  const reducVitE = meilleureReduc(equipeE, nPvE, 'reducVitesseAdverse')   // ralentit le JOUEUR
  const koJ = alliesKO(equipeJ, nPvJ)
  const koE = alliesKO(equipeE, nPvE)
  // Réduction de soin imposée (Briseur).
  const reducSoinImposeeParJ = meilleureReduc(equipeJ, nPvJ, 'reducSoinAdverse') // affecte soins ENNEMIS
  const reducSoinImposeeParE = meilleureReduc(equipeE, nPvE, 'reducSoinAdverse') // affecte soins JOUEUR

  // SYNERGIES D'ÉQUIPE : bonus globaux selon la composition de rôles.
  const synJ = bonusSynergies(equipeJ)
  const synE = bonusSynergies(equipeE)

  // Facteur de vitesse imposé par l'adversaire (Handicapeur). 1 - reduc, plancher 0.4.
  const facteurVitJ = Math.max(0.4, 1 - reducVitE) // vitesse du JOUEUR (ralenti par l'ennemi)
  const facteurVitE = Math.max(0.4, 1 - reducVitJ) // vitesse de l'ENNEMI (ralenti par le joueur)

  // --- Pokémon du joueur ---
  for (let i = 0; i < equipeJ.length; i++) {
    if (!equipeJ[i] || nPvJ[i] <= 0) {
      continue
    }
    const passif = passifEffet(equipeJ[i])
    let jaugeMult = (passif.jaugeMult || 1) + jaugeEquipeJ
    const vit = nombreSur(equipeJ[i].vitesse, 50, 1)
    const jm = nombreSur(jaugeMult, 1, 0.01)
    // Modificateur de vitesse dû aux STATUTS (gel/paralysie -, hâte +).
    const modVit = Math.max(0.1, 1 + modifVitesseStatuts(equipeJ[i]))
    // Increment de jauge, avec MINIMUM garanti (anti-blocage). + synergie vitesse.
    const inc = Math.max(INCREMENT_MIN_JAUGE, vit * VITESSE_JAUGE * jm * facteurVitJ * modVit * (1 + synJ.bonusVitesseEquipe))
    nJaugeJ[i] = nombreSur(nJaugeJ[i], 0, 0) + nombreSur(inc, INCREMENT_MIN_JAUGE, INCREMENT_MIN_JAUGE)
    if (nJaugeJ[i] >= 100) {
      nJaugeJ[i] = 0
      equipeJ[i]._attaques = (nombreSur(equipeJ[i]._attaques, 0, 0)) + 1
      // PARALYSIE : risque de rater l'attaque.
      if (rateAttaque(equipeJ[i])) {
        coups.push({ montant: 0, cible: i, camp: 'joueur', type: 'rate' })
        continue
      }
      const cible = choisirCible(equipeE, nPvE)
      if (cible !== -1 && equipeE[cible]) {
        const ctx = {
          boostDegatsAllie: boostDegatsJ + synJ.bonusDegatsEquipe, alliesKO: koJ, pvCible: nPvE[cible],
          reducDegatsDef: reducDegatsE, reducAttaqueImposee: reducAttE, boostDefenseDef: boostDefenseE + synE.bonusDefenseEquipe,
          critBonus: synJ.bonusCritEquipe,
        }
        const { degats, multiplicateur, critique } = calculerDegats(equipeJ[i], equipeE[cible], DIVISEUR_DEGATS_JOUEUR, ctx)
        const avant = nPvE[cible]
        let degatsE = degats
        const reducBouclierE = (options && options.bouclierEnnemi) ? options.bouclierEnnemi : 0
        if (reducBouclierE > 0) degatsE = Math.max(1, Math.round(degatsE * (1 - reducBouclierE)))
        nPvE[cible] = Math.max(0, nPvE[cible] - degatsE)
        coups.push({ montant: degatsE, cible, camp: 'ennemi', type: critique ? 'crit' : 'degats' })
        if (multiplicateur >= 2) evenements.push({ nom: equipeJ[i].nom, multiplicateur, camp: 'joueur' })
        if (critique) evenements.push({ nom: equipeJ[i].nom, critique: true, camp: 'joueur' })
        // STATUT par type : l'attaquant peut infliger brûlure/gel/etc.
        if (nPvE[cible] > 0) {
          const statutInflige = tenterStatutParType(equipeJ[i], equipeE[cible])
          if (statutInflige) coups.push({ montant: 0, cible, camp: 'ennemi', type: 'applique-statut', statut: statutInflige })
        }
        const passifCible = passifEffet(equipeE[cible])
        if (passifCible.renvoiDegats && nPvJ[i] > 0) {
          nPvJ[i] = Math.max(0, nPvJ[i] - Math.round(degats * passifCible.renvoiDegats))
        }
        if (avant > 0 && nPvE[cible] <= 0) ennemisTombes.push(cible)
      }
    }
  }

  // --- Pokémon ennemis ---
  for (let i = 0; i < equipeE.length; i++) {
    if (!equipeE[i] || nPvE[i] <= 0) continue
    const passif = passifEffet(equipeE[i])
    let jaugeMult = (passif.jaugeMult || 1) + jaugeEquipeE
    const vit = nombreSur(equipeE[i].vitesse, 50, 1)
    const jm = nombreSur(jaugeMult, 1, 0.01)
    // Modificateur de vitesse dû aux STATUTS.
    const modVit = Math.max(0.1, 1 + modifVitesseStatuts(equipeE[i]))
    // Increment de jauge, avec MINIMUM garanti (anti-blocage). + synergie vitesse.
    const inc = Math.max(INCREMENT_MIN_JAUGE, vit * VITESSE_JAUGE * jm * facteurVitE * modVit * (1 + synE.bonusVitesseEquipe))
    nJaugeE[i] = nombreSur(nJaugeE[i], 0, 0) + nombreSur(inc, INCREMENT_MIN_JAUGE, INCREMENT_MIN_JAUGE)
    if (nJaugeE[i] >= 100) {
      nJaugeE[i] = 0
      equipeE[i]._attaques = (nombreSur(equipeE[i]._attaques, 0, 0)) + 1
      // PARALYSIE : risque de rater.
      if (rateAttaque(equipeE[i])) {
        coups.push({ montant: 0, cible: i, camp: 'ennemi', type: 'rate' })
        continue
      }
      const cible = choisirCible(equipeJ, nPvJ)
      if (cible !== -1 && equipeJ[cible]) {
        const ctx = {
          boostDegatsAllie: boostDegatsE + synE.bonusDegatsEquipe, alliesKO: koE, pvCible: nPvJ[cible],
          reducDegatsDef: reducDegatsJ, reducAttaqueImposee: reducAttJ, boostDefenseDef: boostDefenseJ + synJ.bonusDefenseEquipe,
          critBonus: synE.bonusCritEquipe,
        }
        let { degats, critique } = calculerDegats(equipeE[i], equipeJ[cible], DIVISEUR_DEGATS_ENNEMI, ctx)
        const reducBouclier = (options && options.bouclierJoueur) ? options.bouclierJoueur : 0
        if (reducBouclier > 0) degats = Math.max(1, Math.round(degats * (1 - reducBouclier)))
        nPvJ[cible] = Math.max(0, nPvJ[cible] - degats)
        coups.push({ montant: degats, cible, camp: 'joueur', type: critique ? 'crit' : 'degats' })
        // STATUT par type côté ennemi.
        if (nPvJ[cible] > 0) {
          const statutInflige = tenterStatutParType(equipeE[i], equipeJ[cible])
          if (statutInflige) coups.push({ montant: 0, cible, camp: 'joueur', type: 'applique-statut', statut: statutInflige })
        }
        const passifCible = passifEffet(equipeJ[cible])
        if (passifCible.renvoiDegats && nPvE[i] > 0) {
          nPvE[i] = Math.max(0, nPvE[i] - Math.round(degats * passifCible.renvoiDegats))
        }
      }
    }
  }

  // --- SOIN PÉRIODIQUE (Guérisseur) + BUFFS (Stratège) ---
  // Le bonus de soin de synergie augmente l'efficacité des soins.
  const facteurSoinSynJ = Math.max(0, reducSoinImposeeParE - synJ.bonusSoinEquipe)
  const facteurSoinSynE = Math.max(0, reducSoinImposeeParJ - synE.bonusSoinEquipe)
  for (let i = 0; i < equipeJ.length; i++) {
    if (equipeJ[i] && nPvJ[i] > 0) {
      appliquerSoinPeriodique(equipeJ[i], equipeJ, nPvJ, coups, 'joueur', facteurSoinSynJ)
      // Stratège (boostDegatsEquipe) lance des buffs périodiques sur l'équipe.
      if (passifEffet(equipeJ[i]).boostDegatsEquipe > 0) {
        const buff = tenterBuffEquipe(equipeJ[i], equipeJ, nPvJ, roleEffectif)
        if (buff) coups.push({ montant: 0, cible: buff.cible, camp: 'joueur', type: 'applique-statut', statut: buff.statut })
      }
    }
  }
  for (let i = 0; i < equipeE.length; i++) {
    if (equipeE[i] && nPvE[i] > 0) {
      appliquerSoinPeriodique(equipeE[i], equipeE, nPvE, coups, 'ennemi', facteurSoinSynE)
      if (passifEffet(equipeE[i]).boostDegatsEquipe > 0) {
        const buff = tenterBuffEquipe(equipeE[i], equipeE, nPvE, roleEffectif)
        if (buff) coups.push({ montant: 0, cible: buff.cible, camp: 'ennemi', type: 'applique-statut', statut: buff.statut })
      }
    }
  }

  // --- DÉGÂTS DE STATUT (brûlure, poison) + VIEILLISSEMENT ---
  // Appliqué une fois par tic, après les attaques et soins.
  for (let i = 0; i < equipeJ.length; i++) {
    if (equipeJ[i] && nPvJ[i] > 0) {
      appliquerDegatsStatuts(equipeJ[i], i, nPvJ, coups, 'joueur')
    }
    if (equipeJ[i]) vieillirStatuts(equipeJ[i])
  }
  for (let i = 0; i < equipeE.length; i++) {
    if (equipeE[i] && nPvE[i] > 0) {
      const avant = nPvE[i]
      appliquerDegatsStatuts(equipeE[i], i, nPvE, coups, 'ennemi')
      if (avant > 0 && nPvE[i] <= 0) ennemisTombes.push(i)
    }
    if (equipeE[i]) vieillirStatuts(equipeE[i])
  }

  const joueurVivant = nPvJ.some((pv) => pv > 0)
  const ennemiVivant = nPvE.some((pv) => pv > 0)
  let resultat = 'en_cours'
  if (!ennemiVivant) resultat = 'victoire'
  else if (!joueurVivant) resultat = 'defaite'

  return {
    pvJoueur: nPvJ, pvEnnemis: nPvE,
    jaugeJoueur: nJaugeJ, jaugeEnnemis: nJaugeE,
    ennemisTombes, resultat, evenements, coups,
  }
}