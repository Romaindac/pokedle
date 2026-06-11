// ============================================================
// SYSTÈME DE PRESTIGE — "Rang de Dresseur"
// ============================================================

export function medaillesGagnables(nbVus, nbZonesDebloquees) {
  const zones = nbZonesDebloquees || 0
  const vus = nbVus || 0
  const score = zones * zones * 0.18 + vus * 0.4
  return Math.floor(Math.sqrt(score))
}

// Coût d'un niveau d'amélioration prestige.
// Barème LINEAIRE : cout = niveau cible.
// niveauActuel = niveau ACTUEL (0 pour le 1er achat).
// 0->1 coute 1, 1->2 coute 2, 2->3 coute 3, etc.
export function coutAmeliorationPrestige(niveauActuel) {
  const n = niveauActuel || 0
  return n + 1
}

export const NIVEAU_MAX_BASE = 36
export const NIVEAUX_PAR_PUISSANCE = 12 // gain de base (avant le palier 100)
export const NIVEAU_MAX_ABSOLU = 200    // plafond ultime

// Plafond de niveau selon les achats "Puissance".
// Montée RAPIDE jusqu'à 100 (+12/achat, comme avant), puis DEGRESSIVE
// vers 200 pour faire de la fin un objectif long terme (sans bloquer).
// IMPORTANT : identique a l'ancienne formule tant que cap < 100,
// donc les achats deja faits gardent exactement le meme plafond.
export function plafondNiveau(investis) {
  const i = investis || {}
  const puissance = i.puissance || 0
  let cap = NIVEAU_MAX_BASE
  for (let k = 0; k < puissance; k++) {
    let gain
    if (cap < 100) gain = 12
    else if (cap < 140) gain = 9
    else if (cap < 170) gain = 7
    else gain = 5
    cap += gain
  }
  return Math.min(NIVEAU_MAX_ABSOLU, cap)
}

export function estAuPlafond(niveau, investis) {
  return (niveau || 1) >= plafondNiveau(investis)
}

export const BONUS_PRESTIGE = {
  puissance: { nom: 'Puissance', emoji: '⚔️', valeur: 0.03, desc: '+3% stats équipe ET niveau max plus haut (franchit les murs, jusqu\'à 200)' },
  xp: { nom: 'XP', emoji: '📈', valeur: 0.04, desc: '+4% XP par niveau (re-farm plus vite)' },
  argent: { nom: 'Argent', emoji: '💰', valeur: 0.04, desc: '+4% argent par niveau' },
  shiny: { nom: 'Shiny', emoji: '✨', valeur: 0.01, desc: '+1% chance shiny par niveau' },
}

export const ORDRE_BONUS_PRESTIGE = ['puissance', 'xp', 'argent', 'shiny']

export function multiplicateursPrestige(investis) {
  const i = investis || {}
  return {
    puissance: 1 + (i.puissance || 0) * BONUS_PRESTIGE.puissance.valeur,
    xp: 1 + (i.xp || 0) * BONUS_PRESTIGE.xp.valeur,
    argent: 1 + (i.argent || 0) * BONUS_PRESTIGE.argent.valeur,
    shiny: 1 + (i.shiny || 0) * BONUS_PRESTIGE.shiny.valeur,
    plafondNiveau: plafondNiveau(i),
  }
}

export function totalInvesti(investis) {
  const i = investis || {}
  return (i.puissance || 0) + (i.xp || 0) + (i.argent || 0) + (i.shiny || 0)
}

export function conditionsPrestige(nbPrestiges, etat) {
  const prochain = (nbPrestiges || 0) + 1
  const e = etat || {}
  const conds = []
  if (prochain <= 1) return conds
  const p = prochain
  if (prochain >= 2) {
    const seuil = 3 + (p - 2) * 3
    const val = e.dresseursVaincus || 0
    conds.push({ cle: 'arene', nom: 'Dresseurs d\'arène vaincus', emoji: '⚔️', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  if (prochain >= 3) {
    const seuil = 20 + (p - 3) * 8
    const val = e.zoneMax || 0
    conds.push({ cle: 'zone', nom: 'Zone atteinte', emoji: '🗺️', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  if (prochain >= 4) {
    const seuil = 2 + (p - 4) * 2
    const val = e.raidsReussis || 0
    conds.push({ cle: 'raids', nom: 'Raids réussis', emoji: '🔥', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  if (prochain >= 5) {
    const seuil = 150 + (p - 5) * 60
    const val = e.pokedexVus || 0
    conds.push({ cle: 'pokedex', nom: 'Pokémon découverts', emoji: '📖', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  if (prochain >= 6) {
    const seuil = 10 + (p - 6) * 5
    const val = e.niveauTour || 0
    conds.push({ cle: 'tour', nom: 'Niveau Tour Infinie', emoji: '🗼', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  return conds
}

export function toutesConditionsRemplies(nbPrestiges, etat) {
  const conds = conditionsPrestige(nbPrestiges, etat)
  return conds.every((c) => c.remplie)
}