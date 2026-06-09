// ============================================================
// SYSTÈME DE PRESTIGE — "Rang de Dresseur"
// Le joueur réinitialise sa progression (niveaux, zones, argent) en échange de
// Médailles, investies en bonus permanents cumulables. La collection (Pokédex),
// les médailles et l'élevage sont conservés.
//
// Le bonus PUISSANCE est la clé : il augmente les stats ET débloque le PLAFOND
// DE NIVEAU (level cap). C'est le vrai "mur" : sans assez de Puissance investie,
// tes Pokémon plafonnent et ne peuvent plus franchir les zones hautes, même en
// farmant l'XP. Il FAUT prestiger pour progresser.
// ============================================================

// Calcule combien de médailles un prestige rapporterait, selon le progrès actuel.
// Recalibré : le 1er prestige (~zone 20) donne ~8-10 médailles, pas 22.
// Croissance douce pour alimenter une douzaine de prestiges sur 100 zones.
export function medaillesGagnables(nbVus, nbZonesDebloquees) {
  const zones = nbZonesDebloquees || 0
  const vus = nbVus || 0
  // Réduit : zone 20 -> ~9, zone 35 -> ~16, zone 50 -> ~24, zone 100 -> ~50.
  const score = zones * zones * 0.18 + vus * 0.4
  return Math.floor(Math.sqrt(score))
}

// Coût d'un niveau d'amélioration prestige (progressif, double doucement).
// niveau = niveau ACTUEL de l'amélioration (0 pour le 1er achat).
// Donne : 1, 3, 4, 6, 7, 9, 10, 12... (cumul niveau 10 ~ 80 médailles).
export function coutAmeliorationPrestige(niveauActuel) {
  const n = niveauActuel || 0
  return 1 + Math.round(n * 1.6)
}

// ===== PLAFOND DE NIVEAU (LE MUR) =====
// Niveau max de base, puis +NIVEAUX_PAR_PUISSANCE par médaille investie en Puissance.
// Pensé pour que le cap de base te porte ~jusqu'au premier mur (zone ~18-20),
// puis chaque prestige investi en Puissance débloque la suite.
export const NIVEAU_MAX_BASE = 36
export const NIVEAUX_PAR_PUISSANCE = 12

export function plafondNiveau(investis) {
  const i = investis || {}
  const puissance = i.puissance || 0
  return NIVEAU_MAX_BASE + puissance * NIVEAUX_PAR_PUISSANCE
}

// Un Pokémon est-il au plafond ? (utile pour l'affichage "MAX")
export function estAuPlafond(niveau, investis) {
  return (niveau || 1) >= plafondNiveau(investis)
}

// Les bonus permanents qu'on peut acheter avec les médailles.
export const BONUS_PRESTIGE = {
  puissance: { nom: 'Puissance', emoji: '⚔️', valeur: 0.03, desc: '+3% stats équipe ET +12 niveaux max (franchit les murs)' },
  xp: { nom: 'XP', emoji: '📈', valeur: 0.04, desc: '+4% XP par niveau (re-farm plus vite)' },
  argent: { nom: 'Argent', emoji: '💰', valeur: 0.04, desc: '+4% argent par niveau' },
  shiny: { nom: 'Shiny', emoji: '✨', valeur: 0.01, desc: '+1% chance shiny par niveau' },
}

// Ordre d'affichage (puissance en premier : c'est le bonus central).
export const ORDRE_BONUS_PRESTIGE = ['puissance', 'xp', 'argent', 'shiny']

// Calcule les multiplicateurs effectifs à partir des points investis.
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

// Total de médailles investies (pour calculer les médailles encore disponibles).
export function totalInvesti(investis) {
  const i = investis || {}
  return (i.puissance || 0) + (i.xp || 0) + (i.argent || 0) + (i.shiny || 0)
}

// ============================================================
// CONDITIONS DE PRESTIGE (par palier)
// Le 1er prestige n'a aucune condition (juste l'équipe au plafond, géré ailleurs).
// À partir du 2e, des conditions OBLIGATOIRES s'ajoutent et se cumulent.
// Plus le palier est haut, plus il y a de conditions et plus les seuils montent.
//
// nbPrestiges = nombre de prestiges DÉJÀ effectués.
// Le "prochain prestige" est donc le palier (nbPrestiges + 1).
// ============================================================

// Renvoie la liste des conditions requises pour le PROCHAIN prestige.
// Chaque condition : { cle, nom, emoji, seuil, valeurActuelle, remplie }
// etat = { dresseursVaincus, zoneMax, raidsReussis, pokedexVus, niveauTour }
export function conditionsPrestige(nbPrestiges, etat) {
  const prochain = (nbPrestiges || 0) + 1
  const e = etat || {}
  const conds = []

  // Le 1er prestige : aucune condition supplémentaire.
  if (prochain <= 1) return conds

  // Les seuils montent avec le palier (le numéro du prochain prestige).
  const p = prochain

  // Palier 2+ : battre des dresseurs d'arène.
  if (prochain >= 2) {
    const seuil = 3 + (p - 2) * 3   // 3, 6, 9, 12...
    const val = e.dresseursVaincus || 0
    conds.push({ cle: 'arene', nom: 'Dresseurs d\'arène vaincus', emoji: '⚔️', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  // Palier 3+ : atteindre une zone.
  if (prochain >= 3) {
    const seuil = 20 + (p - 3) * 8  // 20, 28, 36...
    const val = e.zoneMax || 0
    conds.push({ cle: 'zone', nom: 'Zone atteinte', emoji: '🗺️', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  // Palier 4+ : réussir des raids.
  if (prochain >= 4) {
    const seuil = 2 + (p - 4) * 2   // 2, 4, 6...
    const val = e.raidsReussis || 0
    conds.push({ cle: 'raids', nom: 'Raids réussis', emoji: '🔥', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  // Palier 5+ : compléter le Pokédex.
  if (prochain >= 5) {
    const seuil = 150 + (p - 5) * 60  // 150, 210, 270...
    const val = e.pokedexVus || 0
    conds.push({ cle: 'pokedex', nom: 'Pokémon découverts', emoji: '📖', seuil, valeurActuelle: val, remplie: val >= seuil })
  }
  // Palier 6+ : atteindre un niveau à la Tour Infinie.
  if (prochain >= 6) {
    const seuil = 10 + (p - 6) * 5  // 10, 15, 20...
    const val = e.niveauTour || 0
    conds.push({ cle: 'tour', nom: 'Niveau Tour Infinie', emoji: '🗼', seuil, valeurActuelle: val, remplie: val >= seuil })
  }

  return conds
}

// Toutes les conditions sont-elles remplies ? (true si aucune condition)
export function toutesConditionsRemplies(nbPrestiges, etat) {
  const conds = conditionsPrestige(nbPrestiges, etat)
  return conds.every((c) => c.remplie)
}