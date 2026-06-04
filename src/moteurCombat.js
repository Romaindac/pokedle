// Moteur de combat ATB avec efficacité des types + rôles + PASSIFS (12 passifs + Joker).

import { DIVISEUR_DEGATS_JOUEUR, DIVISEUR_DEGATS_ENNEMI, VITESSE_JAUGE } from './config'
import { multiplicateurType } from './types'
import { bonusDuPassif, determinerRole, passifDe } from './roles'

// --- Helper anti-NaN local ---
// Garantit un nombre fini >= min. Empêche une jauge ATB de se bloquer à NaN
// (ce qui figerait le combat : NaN >= 100 est toujours faux → le Pokémon n'attaque jamais).
function nombreSur(valeur, repli, min = 0) {
  const v = Number.isFinite(valeur) ? valeur : repli
  return v < min ? min : v
}

export function premierVivant(pvs) {
  return pvs.findIndex((pv) => pv > 0)
}

// Récupère le passif (effet chiffré) d'un pokémon, robuste si absent.
function passifEffet(pokemon) {
  return bonusDuPassif(pokemon)
}

// Choisit la cible : un Pokémon qui ATTIRE LES COUPS (tank) vivant en priorité,
// sinon le premier vivant.
function choisirCible(equipe, pvs) {
  for (let i = 0; i < equipe.length; i++) {
    if (pvs[i] > 0 && equipe[i] && passifEffet(equipe[i]).attireCoups) return i
  }
  return premierVivant(pvs)
}

// Calcule un bonus d'équipe cumulé (ex: somme des boostDegatsEquipe des soutiens vivants).
function bonusEquipe(equipe, pvs, champ) {
  let total = 0
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] > 0) total += passifEffet(equipe[i])[champ] || 0
  }
  return total
}

// Réduction de dégâts d'équipe (ex: Carapace) : on prend la MEILLEURE (pas cumulée à l'infini).
function meilleureReduc(equipe, pvs, champ) {
  let best = 0
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] > 0) best = Math.max(best, passifEffet(equipe[i])[champ] || 0)
  }
  return Math.min(0.6, best) // plafond de sécurité 60%
}

// Compte les alliés KO (pour le passif Berserk).
function alliesKO(equipe, pvs) {
  let n = 0
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] <= 0) n += 1
  }
  return n
}

// Calcule les dégâts d'un attaquant sur un défenseur.
// Prend en compte : type, défense, passif de l'attaquant (dégâts, exécution, berserk,
// coup critique du Joker), boost de dégâts d'équipe (tacticien/meneur),
// et réduction d'équipe côté défenseur (carapace).
function calculerDegats(attaquant, defenseur, diviseur, ctx) {
  if (!attaquant || !defenseur) return { degats: 0, multiplicateur: 1, critique: false }
  const typeAtt = attaquant.types ? attaquant.types[0] : null
  const mult = multiplicateurType(typeAtt, defenseur.types || [])
  const passif = passifEffet(attaquant)
  const div = nombreSur(diviseur, 6, 0.0001) // jamais 0 (division)
  const base = Math.max(1, nombreSur(attaquant.attaque, 50, 1) / div)
  const defenseCible = nombreSur(defenseur.defense, 50, 0)
  const reducDefense = 100 / (100 + defenseCible)

  // Multiplicateur de dégâts du passif attaquant.
  let degatsMult = passif.degatsMult || 1
  // Tacticien / Meneur : boost de dégâts de toute l'équipe de l'attaquant.
  degatsMult *= (1 + (ctx?.boostDegatsAllie || 0))
  // Berserk : +x% par allié KO.
  if (passif.degatsParAllieKO) degatsMult *= (1 + passif.degatsParAllieKO * (ctx?.alliesKO || 0))
  // Assassin : bonus d'exécution si la cible est affaiblie (<30% PV).
  if (passif.bonusExecution && ctx?.pvCible !== undefined && defenseur.pvMax) {
    if (ctx.pvCible / defenseur.pvMax < 0.30) degatsMult *= (1 + passif.bonusExecution)
  }

  // Coup de chance (Joker) : chance d'infliger un coup critique (×critMult).
  let critique = false
  if (passif.critChance && Math.random() < passif.critChance) {
    critique = true
    degatsMult *= (passif.critMult || 2)
  }

  // Réduction de dégâts d'équipe côté défenseur (Carapace).
  const reducEquipe = 1 - (ctx?.reducDegatsDef || 0)

  const brut = base * mult * reducDefense * nombreSur(degatsMult, 1, 0) * reducEquipe
  let degats = Math.max(1, Math.round(nombreSur(brut, 1, 1)))
  // PLANCHER ANTI-MUR : un coup inflige toujours au moins 1% des PV max de la cible.
  // Sans ça, à haut niveau la défense écrase les dégâts (ex: 12 sur 2849 PV → boss
  // mathématiquement intuable en 45s). Garantit qu'aucune cible n'est jamais imbattable.
  const plancher = Math.round(nombreSur(defenseur.pvMax, 0, 0) * 0.01)
  if (plancher > degats) degats = plancher
  return { degats, multiplicateur: mult, critique }
}

// Régénération (Guérisseur) : soigne toute l'équipe d'un % de PV max.
// Pousse les soins réellement appliqués dans `coups` (pour les chiffres verts).
// reducSoin (0 à 1) : réduction des soins imposée par l'équipe adverse (passif Briseur).
function appliquerRegen(soutien, equipe, pvs, coups, camp, reducSoin = 0) {
  if (!soutien) return
  const passif = passifEffet(soutien)
  if (!passif.regenEquipe) return
  const facteurSoin = Math.max(0, 1 - nombreSur(reducSoin, 0, 0))
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] > 0) {
      const pvMax = nombreSur(equipe[i].pvMax, 1, 1)
      const soin = Math.round(pvMax * passif.regenEquipe * facteurSoin)
      const avant = pvs[i]
      pvs[i] = Math.min(pvMax, pvs[i] + soin)
      const gagne = pvs[i] - avant
      // On n'affiche le chiffre vert que si le soin a réellement eu un effet.
      if (gagne > 0 && coups) coups.push({ montant: gagne, cible: i, camp, type: 'soin' })
    }
  }
}

// === ULTIMES ===
// Applique l'effet d'un ultime déclenché par le Pokémon d'index `idx` de l'équipe joueur.
// Modifie en place les tableaux d'état fournis et renvoie { coups, bouclierTics }.
// Robuste : bornes et nombreSur partout, ne plante jamais.
export function appliquerUltime(idx, ultime, equipeJ, pvJ, jaugeJ, equipeE, pvE, campLanceur = 'joueur') {
  const coups = []
  let bouclierTics = 0
  if (!ultime) return { coups, bouclierTics }
  const lanceur = equipeJ[idx]
  if (!lanceur || pvJ[idx] <= 0) return { coups, bouclierTics } // KO = pas d'ultime

  // Camp des chiffres flottants : dégâts → camp adverse du lanceur ; soin → camp du lanceur.
  const campAdverse = campLanceur === 'joueur' ? 'ennemi' : 'joueur'
  const campAllie = campLanceur

  if (ultime.effet === 'deflagration') {
    // Gros dégâts immédiats sur le premier ennemi vivant.
    const cible = premierVivant(pvE)
    if (cible !== -1 && equipeE[cible]) {
      const att = nombreSur(lanceur.attaque, 50, 1)
      const mult = nombreSur(ultime.multiplicateur, 4, 1)
      const defCible = nombreSur(equipeE[cible].defense, 50, 0)
      const reduc = 100 / (100 + defCible)
      let degats = Math.max(1, Math.round(att * mult * reduc))
      // PLAFOND ANTI-ONE-SHOT : la Déflagration ne peut pas faire plus de 40% des PV
      // max de la cible. Sans ça, un Pokémon très boosté (attaque énorme) tuait
      // n'importe qui en un seul ultime. Il faut ~3 ultimes pour tuer une cible pleine.
      const plafond = Math.round(nombreSur(equipeE[cible].pvMax, 0, 0) * 0.40)
      if (plafond > 0 && degats > plafond) degats = plafond
      pvE[cible] = Math.max(0, pvE[cible] - degats)
      coups.push({ montant: degats, cible, camp: campAdverse, type: 'crit' }) // gros chiffre jaune
    }
  } else if (ultime.effet === 'soin') {
    // Gros soin à toute l'équipe vivante.
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
    // Remplit les jauges ATB de toute l'équipe (prêtes à frapper).
    for (let i = 0; i < jaugeJ.length; i++) {
      if (equipeJ[i] && pvJ[i] > 0) jaugeJ[i] = 100
    }
  } else if (ultime.effet === 'bouclier') {
    // Active un bouclier d'équipe pour quelques tics (appliqué via options dans ticCombat).
    bouclierTics = nombreSur(ultime.duree, 30, 1)
  }

  return { coups, bouclierTics }
}

export function ticCombat(equipeJ, pvJ, jaugeJ, equipeE, pvE, jaugeE, options) {
  const nPvJ = [...pvJ]
  const nPvE = [...pvE]
  const nJaugeJ = [...jaugeJ]
  const nJaugeE = [...jaugeE]
  const ennemisTombes = []
  const evenements = []
  // Chiffres flottants : chaque coup porté (dégâts) ou soin appliqué.
  // Format : { montant, cible, camp, type } où
  //   camp = camp de la CIBLE ('joueur' = un pokémon du joueur a pris le coup),
  //   type = 'degats' | 'crit' | 'soin'.
  const coups = []

  // Pré-calcul des bonus d'équipe (une fois par tic, pour chaque camp).
  const boostDegatsJ = bonusEquipe(equipeJ, nPvJ, 'boostDegatsEquipe')
  const boostDegatsE = bonusEquipe(equipeE, nPvE, 'boostDegatsEquipe')
  const reducDegatsJ = meilleureReduc(equipeJ, nPvJ, 'reducDegatsEquipe') // protège l'équipe J
  const reducDegatsE = meilleureReduc(equipeE, nPvE, 'reducDegatsEquipe')
  const jaugeEquipeJ = bonusEquipe(equipeJ, nPvJ, 'jaugeEquipe') // vif : boost jauge alliés
  const jaugeEquipeE = bonusEquipe(equipeE, nPvE, 'jaugeEquipe')
  const koJ = alliesKO(equipeJ, nPvJ)
  const koE = alliesKO(equipeE, nPvE)
  // Réduction de soin imposée à l'adversaire (passif Briseur, côté DPS).
  // On prend la MEILLEURE réduction présente dans le camp (pas cumulée à l'infini).
  const reducSoinImposeeParJ = meilleureReduc(equipeJ, nPvJ, 'reducSoinAdverse') // affecte les soins ENNEMIS
  const reducSoinImposeeParE = meilleureReduc(equipeE, nPvE, 'reducSoinAdverse') // affecte les soins JOUEUR

  // --- Pokémon du joueur ---
  for (let i = 0; i < equipeJ.length; i++) {
    if (!equipeJ[i] || nPvJ[i] <= 0) continue
    const passif = passifEffet(equipeJ[i])
    // Vitesse de jauge : passif perso + boost d'équipe (vif) + montante (frénétique).
    let jaugeMult = (passif.jaugeMult || 1) + jaugeEquipeJ
    if (passif.jaugeMontante) jaugeMult += passif.jaugeMontante * ((equipeJ[i]._attaques) || 0)
    // BLINDAGE : vitesse et jaugeMult forcés finis. Vitesse de repli 50 (jamais 0/NaN)
    // pour que la jauge progresse TOUJOURS → plus jamais de combat figé.
    const vit = nombreSur(equipeJ[i].vitesse, 50, 1)
    const jm = nombreSur(jaugeMult, 1, 0.01)
    nJaugeJ[i] = nombreSur(nJaugeJ[i], 0, 0) + vit * VITESSE_JAUGE * jm
    if (nJaugeJ[i] >= 100) {
      nJaugeJ[i] = 0
      equipeJ[i]._attaques = ((equipeJ[i]._attaques) || 0) + 1 // pour frénétique
      const cible = choisirCible(equipeE, nPvE)
      if (cible !== -1) {
        const ctx = { boostDegatsAllie: boostDegatsJ, alliesKO: koJ, pvCible: nPvE[cible], reducDegatsDef: reducDegatsE }
        const { degats, multiplicateur, critique } = calculerDegats(equipeJ[i], equipeE[cible], DIVISEUR_DEGATS_JOUEUR, ctx)
        const avant = nPvE[cible]
        let degatsE = degats
        const reducBouclierE = (options && options.bouclierEnnemi) ? options.bouclierEnnemi : 0
        if (reducBouclierE > 0) degatsE = Math.max(1, Math.round(degatsE * (1 - reducBouclierE)))
        nPvE[cible] = Math.max(0, nPvE[cible] - degatsE)
        // Chiffre flottant sur l'ennemi touché (rouge, ou jaune si crit).
        coups.push({ montant: degatsE, cible, camp: 'ennemi', type: critique ? 'crit' : 'degats' })
        if (multiplicateur >= 2) evenements.push({ nom: equipeJ[i].nom, multiplicateur, camp: 'joueur' })
        if (critique) evenements.push({ nom: equipeJ[i].nom, critique: true, camp: 'joueur' })
        // Renvoi de dégâts (Provocateur côté ennemi qui encaisse).
        const passifCible = passifEffet(equipeE[cible])
        if (passifCible.renvoiDegats && nPvJ[i] > 0) {
          nPvJ[i] = Math.max(0, nPvJ[i] - Math.round(degats * passifCible.renvoiDegats))
        }
        if (avant > 0 && nPvE[cible] <= 0) ennemisTombes.push(cible)
      }
      appliquerRegen(equipeJ[i], equipeJ, nPvJ, coups, 'joueur', reducSoinImposeeParE)
    }
  }

  // --- Pokémon ennemis ---
  for (let i = 0; i < equipeE.length; i++) {
    if (!equipeE[i] || nPvE[i] <= 0) continue
    const passif = passifEffet(equipeE[i])
    let jaugeMult = (passif.jaugeMult || 1) + jaugeEquipeE
    if (passif.jaugeMontante) jaugeMult += passif.jaugeMontante * ((equipeE[i]._attaques) || 0)
    const vit = nombreSur(equipeE[i].vitesse, 50, 1)
    const jm = nombreSur(jaugeMult, 1, 0.01)
    nJaugeE[i] = nombreSur(nJaugeE[i], 0, 0) + vit * VITESSE_JAUGE * jm
    if (nJaugeE[i] >= 100) {
      nJaugeE[i] = 0
      equipeE[i]._attaques = ((equipeE[i]._attaques) || 0) + 1
      const cible = choisirCible(equipeJ, nPvJ)
      if (cible !== -1) {
        const ctx = { boostDegatsAllie: boostDegatsE, alliesKO: koE, pvCible: nPvJ[cible], reducDegatsDef: reducDegatsJ }
        let { degats, critique } = calculerDegats(equipeE[i], equipeJ[cible], DIVISEUR_DEGATS_ENNEMI, ctx)
        // Bouclier ultime du Tank (Rempart) : réduit les dégâts subis par l'équipe joueur.
        const reducBouclier = (options && options.bouclierJoueur) ? options.bouclierJoueur : 0
        if (reducBouclier > 0) degats = Math.max(1, Math.round(degats * (1 - reducBouclier)))
        nPvJ[cible] = Math.max(0, nPvJ[cible] - degats)
        // Chiffre flottant sur le pokémon du joueur touché.
        coups.push({ montant: degats, cible, camp: 'joueur', type: critique ? 'crit' : 'degats' })
        // Renvoi de dégâts (Provocateur côté joueur qui encaisse).
        const passifCible = passifEffet(equipeJ[cible])
        if (passifCible.renvoiDegats && nPvE[i] > 0) {
          nPvE[i] = Math.max(0, nPvE[i] - Math.round(degats * passifCible.renvoiDegats))
        }
      }
      appliquerRegen(equipeE[i], equipeE, nPvE, coups, 'ennemi', reducSoinImposeeParJ)
    }
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