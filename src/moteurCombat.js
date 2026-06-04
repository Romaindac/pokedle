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
  const degats = Math.max(1, Math.round(nombreSur(brut, 1, 1)))
  return { degats, multiplicateur: mult, critique }
}

// Régénération (Guérisseur) : soigne toute l'équipe d'un % de PV max.
function appliquerRegen(soutien, equipe, pvs) {
  if (!soutien) return
  const passif = passifEffet(soutien)
  if (!passif.regenEquipe) return
  for (let i = 0; i < equipe.length; i++) {
    if (equipe[i] && pvs[i] > 0) {
      const pvMax = nombreSur(equipe[i].pvMax, 1, 1)
      const soin = Math.round(pvMax * passif.regenEquipe)
      pvs[i] = Math.min(pvMax, pvs[i] + soin)
    }
  }
}

export function ticCombat(equipeJ, pvJ, jaugeJ, equipeE, pvE, jaugeE) {
  const nPvJ = [...pvJ]
  const nPvE = [...pvE]
  const nJaugeJ = [...jaugeJ]
  const nJaugeE = [...jaugeE]
  const ennemisTombes = []
  const evenements = []

  // Pré-calcul des bonus d'équipe (une fois par tic, pour chaque camp).
  const boostDegatsJ = bonusEquipe(equipeJ, nPvJ, 'boostDegatsEquipe')
  const boostDegatsE = bonusEquipe(equipeE, nPvE, 'boostDegatsEquipe')
  const reducDegatsJ = meilleureReduc(equipeJ, nPvJ, 'reducDegatsEquipe') // protège l'équipe J
  const reducDegatsE = meilleureReduc(equipeE, nPvE, 'reducDegatsEquipe')
  const jaugeEquipeJ = bonusEquipe(equipeJ, nPvJ, 'jaugeEquipe') // vif : boost jauge alliés
  const jaugeEquipeE = bonusEquipe(equipeE, nPvE, 'jaugeEquipe')
  const koJ = alliesKO(equipeJ, nPvJ)
  const koE = alliesKO(equipeE, nPvE)

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
        nPvE[cible] = Math.max(0, nPvE[cible] - degats)
        if (multiplicateur >= 2) evenements.push({ nom: equipeJ[i].nom, multiplicateur, camp: 'joueur' })
        if (critique) evenements.push({ nom: equipeJ[i].nom, critique: true, camp: 'joueur' })
        // Renvoi de dégâts (Provocateur côté ennemi qui encaisse).
        const passifCible = passifEffet(equipeE[cible])
        if (passifCible.renvoiDegats && nPvJ[i] > 0) {
          nPvJ[i] = Math.max(0, nPvJ[i] - Math.round(degats * passifCible.renvoiDegats))
        }
        if (avant > 0 && nPvE[cible] <= 0) ennemisTombes.push(cible)
      }
      appliquerRegen(equipeJ[i], equipeJ, nPvJ)
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
        const { degats } = calculerDegats(equipeE[i], equipeJ[cible], DIVISEUR_DEGATS_ENNEMI, ctx)
        nPvJ[cible] = Math.max(0, nPvJ[cible] - degats)
        // Renvoi de dégâts (Provocateur côté joueur qui encaisse).
        const passifCible = passifEffet(equipeJ[cible])
        if (passifCible.renvoiDegats && nPvE[i] > 0) {
          nPvE[i] = Math.max(0, nPvE[i] - Math.round(degats * passifCible.renvoiDegats))
        }
      }
      appliquerRegen(equipeE[i], equipeE, nPvE)
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
    ennemisTombes, resultat, evenements,
  }
}