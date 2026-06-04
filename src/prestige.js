// ============================================================
// SYSTÈME DE PRESTIGE — "Rang de Dresseur"
// Le joueur peut réinitialiser sa progression (niveaux, zones, argent)
// en échange de Médailles, qui s'investissent en bonus permanents cumulables.
// La collection (Pokédex) et les médailles sont conservées.
// ============================================================

// Calcule combien de médailles un prestige rapporterait, selon le progrès actuel.
// Basé sur le nombre de Pokémon vus + le nombre de zones débloquées.
export function medaillesGagnables(nbVus, nbZonesDebloquees) {
  const score = (nbVus || 0) * 2 + (nbZonesDebloquees || 0) * 10
  return Math.floor(Math.sqrt(score))
}

// Les bonus permanents qu'on peut acheter avec les médailles.
// chaque "niveau" investi coûte 1 médaille et donne 'valeur' de bonus.
export const BONUS_PRESTIGE = {
  xp: { nom: 'XP', emoji: '📈', valeur: 0.02, desc: '+2% XP par niveau' },
  argent: { nom: 'Argent', emoji: '💰', valeur: 0.02, desc: '+2% argent par niveau' },
  shiny: { nom: 'Shiny', emoji: '✨', valeur: 0.01, desc: '+1% chance shiny par niveau' },
}

// Calcule les multiplicateurs effectifs à partir des points investis.
// investis = { xp: nb, argent: nb, shiny: nb }
export function multiplicateursPrestige(investis) {
  const i = investis || {}
  return {
    xp: 1 + (i.xp || 0) * BONUS_PRESTIGE.xp.valeur,
    argent: 1 + (i.argent || 0) * BONUS_PRESTIGE.argent.valeur,
    shiny: 1 + (i.shiny || 0) * BONUS_PRESTIGE.shiny.valeur,
  }
}

// Total de médailles investies (pour calculer les médailles encore disponibles).
export function totalInvesti(investis) {
  const i = investis || {}
  return (i.xp || 0) + (i.argent || 0) + (i.shiny || 0)
}