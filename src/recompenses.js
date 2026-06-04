// ============================================================
// RÉCOMPENSES DE COMPLÉTION DU POKÉDEX
// Paliers globaux (nombre de Pokémon vus) + paliers par génération.
// Chaque récompense a un id unique, une condition, et un contenu.
// ============================================================

// Bornes des générations (gen 1-9, 1025 Pokémon).
export const GENERATIONS = [
  { cle: 'gen1', nom: 'Gen 1', debut: 1, fin: 151 },
  { cle: 'gen2', nom: 'Gen 2', debut: 152, fin: 251 },
  { cle: 'gen3', nom: 'Gen 3', debut: 252, fin: 386 },
  { cle: 'gen4', nom: 'Gen 4', debut: 387, fin: 493 },
  { cle: 'gen5', nom: 'Gen 5', debut: 494, fin: 649 },
  { cle: 'gen6', nom: 'Gen 6', debut: 650, fin: 721 },
  { cle: 'gen7', nom: 'Gen 7', debut: 722, fin: 809 },
  { cle: 'gen8', nom: 'Gen 8', debut: 810, fin: 905 },
  { cle: 'gen9', nom: 'Gen 9', debut: 906, fin: 1025 },
]

// Types de récompenses possibles :
// { type: 'argent', montant }
// { type: 'ball', ball: 'poke'|'super'|'hyper'|'master', quantite }
// { type: 'pierre_aleatoire', quantite }
// { type: 'bonus', stat: 'xp'|'argent', valeur } (valeur = +% permanent, ex 0.05 = +5%)
// Une récompense peut contenir PLUSIEURS gains (tableau "gains").

// --- PALIERS GLOBAUX (nombre total de Pokémon vus) ---
// Rééchelonnés sur 1025. Les bonus XP/argent permanents sont la 2e source de
// puissance (collection) : ils s'accumulent et accélèrent le farm de fin de jeu.
export const PALIERS_GLOBAUX = [
  {
    id: 'global-25', seuil: 25, nom: '25 Pokémon vus',
    gains: [{ type: 'argent', montant: 1500 }],
  },
  {
    id: 'global-50', seuil: 50, nom: '50 Pokémon vus',
    gains: [{ type: 'ball', ball: 'super', quantite: 15 }],
  },
  {
    id: 'global-100', seuil: 100, nom: '100 Pokémon vus',
    gains: [{ type: 'pierre_aleatoire', quantite: 3 }, { type: 'bonus', stat: 'xp', valeur: 0.05 }],
  },
  {
    id: 'global-150', seuil: 150, nom: '150 Pokémon vus',
    gains: [{ type: 'bonus', stat: 'xp', valeur: 0.05 }],
  },
  {
    id: 'global-250', seuil: 250, nom: '250 Pokémon vus',
    gains: [{ type: 'ball', ball: 'master', quantite: 1 }, { type: 'bonus', stat: 'argent', valeur: 0.05 }],
  },
  {
    id: 'global-350', seuil: 350, nom: '350 Pokémon vus',
    gains: [{ type: 'bonus', stat: 'argent', valeur: 0.10 }],
  },
  {
    id: 'global-450', seuil: 450, nom: '450 Pokémon vus',
    gains: [{ type: 'ball', ball: 'hyper', quantite: 5 }, { type: 'bonus', stat: 'xp', valeur: 0.10 }],
  },
  {
    id: 'global-550', seuil: 550, nom: '550 Pokémon vus',
    gains: [{ type: 'bonus', stat: 'argent', valeur: 0.10 }],
  },
  {
    id: 'global-650', seuil: 650, nom: '650 Pokémon vus',
    gains: [{ type: 'ball', ball: 'master', quantite: 2 }, { type: 'bonus', stat: 'xp', valeur: 0.10 }],
  },
  {
    id: 'global-750', seuil: 750, nom: '750 Pokémon vus',
    gains: [{ type: 'bonus', stat: 'argent', valeur: 0.15 }],
  },
  {
    id: 'global-850', seuil: 850, nom: '850 Pokémon vus',
    gains: [{ type: 'ball', ball: 'master', quantite: 3 }, { type: 'bonus', stat: 'xp', valeur: 0.15 }],
  },
  {
    id: 'global-950', seuil: 950, nom: '950 Pokémon vus',
    gains: [{ type: 'bonus', stat: 'argent', valeur: 0.15 }, { type: 'bonus', stat: 'xp', valeur: 0.10 }],
  },
  {
    id: 'global-1025', seuil: 1025, nom: 'Pokédex NATIONAL complet ! (1025)',
    gains: [{ type: 'bonus', stat: 'xp', valeur: 0.25 }, { type: 'bonus', stat: 'argent', valeur: 0.25 }, { type: 'ball', ball: 'master', quantite: 10 }],
  },
]

// --- PALIERS PAR GÉNÉRATION (compléter une génération entière) ---
export const PALIERS_GENERATION = GENERATIONS.map((g) => ({
  id: `gen-${g.cle}`,
  generation: g.cle,
  nom: `${g.nom} complète`,
  gains: [{ type: 'ball', ball: 'master', quantite: 1 }, { type: 'argent', montant: 5000 }],
}))

// Compte combien de Pokémon d'une génération sont dans la liste des vus.
export function compteGeneration(idsVus, gen) {
  let n = 0
  for (let i = gen.debut; i <= gen.fin; i++) {
    if (idsVus.has(i)) n++
  }
  return n
}

// Renvoie la liste des récompenses débloquées (palier atteint) mais pas encore réclamées.
// idsVus = Set des numéros vus, recompensesReclamees = tableau d'ids déjà réclamés.
export function recompensesDisponibles(idsVus, recompensesReclamees) {
  const reclamees = new Set(recompensesReclamees || [])
  const nbVus = idsVus.size
  const dispo = []

  // Paliers globaux
  for (const p of PALIERS_GLOBAUX) {
    if (nbVus >= p.seuil && !reclamees.has(p.id)) dispo.push(p)
  }
  // Paliers par génération
  for (const g of GENERATIONS) {
    const palier = PALIERS_GENERATION.find((p) => p.generation === g.cle)
    if (!palier) continue
    const total = g.fin - g.debut + 1
    if (compteGeneration(idsVus, g) >= total && !reclamees.has(palier.id)) {
      dispo.push(palier)
    }
  }
  return dispo
}

// Décrit une récompense en texte lisible (pour l'UI).
export function decrireGains(gains) {
  return gains.map((g) => {
    if (g.type === 'argent') return `${g.montant} 💰`
    if (g.type === 'ball') {
      const noms = { poke: 'Poké Ball', super: 'Super Ball', hyper: 'Hyper Ball', master: 'Master Ball' }
      return `${g.quantite}× ${noms[g.ball] || g.ball}`
    }
    if (g.type === 'pierre_aleatoire') return `${g.quantite} pierre(s) aléatoire(s)`
    if (g.type === 'bonus') {
      const nom = g.stat === 'xp' ? 'XP' : 'Argent'
      return `+${Math.round(g.valeur * 100)}% ${nom} permanent`
    }
    return '?'
  }).join(', ')
}