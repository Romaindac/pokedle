// Charge UNE fois la table nom → numéro des 1025 Pokémon (Gen 1-9).
// (Avant : limité à 649 → les Pokémon des zones hautes n'avaient pas de sprite.)
let tableNoms = null

export async function chargerTableNoms() {
  if (tableNoms) return tableNoms // déjà chargée
  try {
    const reponse = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1025')
    const data = await reponse.json()
    const table = {}
    data.results.forEach((p, i) => {
      table[p.name] = i + 1 // l'ordre = le numéro national
    })
    tableNoms = table
    return table
  } catch (err) {
    return {}
  }
}

// Renvoie le numéro d'un Pokémon par son nom (ou null si inconnu).
export function numeroParNom(table, nom) {
  if (!table) return null
  // Essai direct, puis sans suffixe de forme (ex: darmanitan-standard → darmanitan).
  if (table[nom]) return table[nom]
  const base = nom.split('-')[0]
  return table[base] || null
}