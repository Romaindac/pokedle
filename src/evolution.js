// Certains noms renvoyés par la PokeAPI (dans les chaînes d'évolution) ne sont pas
// directement chargeables. On les corrige ici.
const CORRECTIONS_NOMS = {
  darmanitan: 'darmanitan-standard',
  // (on pourra en ajouter d'autres ici si on en découvre)
}

export function corrigerNom(nom) {
  return CORRECTIONS_NOMS[nom] || nom
}

// Récupère TOUTES les infos d'espèce en UN minimum d'appels :
// - evolueEn / evolueNiveau (évolution par niveau)
// - estEvolution (a une pré-évolution)
// - familleId (id de la chaîne d'évolution)
export async function chargerInfosEspece(nomOuId) {
  try {
    const espece = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${nomOuId}`)
    const especeData = await espece.json()

    const estEvolution = especeData.evolves_from_species !== null

    const url = especeData.evolution_chain.url
    const matchFamille = url.match(/\/evolution-chain\/(\d+)\//)
    const familleId = matchFamille ? parseInt(matchFamille[1], 10) : null

    // Récupérer la chaîne pour trouver les évolutions (niveau + pierre).
    const chaine = await fetch(url)
    const chaineData = await chaine.json()
    const evo = chercherEvolution(chaineData.chain, especeData.name)
    const evolutionsPierre = chercherEvolutionsPierre(chaineData.chain, especeData.name)

    return {
      evolueEn: evo ? evo.evolueEn : null,
      evolueNiveau: evo ? evo.evolueNiveau : null,
      evolutionsPierre, // tableau, vide si aucune évolution par pierre
      estEvolution,
      familleId,
    }
  } catch (err) {
    return { evolueEn: null, evolueNiveau: null, evolutionsPierre: [], estEvolution: false, familleId: null }
  }
}

// Parcourt la chaîne pour trouver le maillon de nomActuel, puis son évolution par niveau.
function chercherEvolution(maillon, nomActuel) {
  if (maillon.species.name === nomActuel) {
    for (const suivant of maillon.evolves_to) {
      for (const detail of suivant.evolution_details) {
        if (detail.trigger.name === 'level-up') {
          const niveau = detail.min_level || 10
          return { evolueEn: suivant.species.name, evolueNiveau: niveau }
        }
      }
    }
    return null
  }
  for (const suivant of maillon.evolves_to) {
    const trouve = chercherEvolution(suivant, nomActuel)
    if (trouve) return trouve
  }
  return null
}

// Cherche les évolutions PAR PIERRE (use-item) du maillon correspondant à nomActuel.
// Renvoie un tableau : [{ evolueEn: 'vaporeon', pierre: 'water-stone' }, ...] (vide si aucune).
function chercherEvolutionsPierre(maillon, nomActuel) {
  if (maillon.species.name === nomActuel) {
    const resultats = []
    for (const suivant of maillon.evolves_to) {
      for (const detail of suivant.evolution_details) {
        if (detail.trigger.name === 'use-item' && detail.item) {
          resultats.push({ evolueEn: suivant.species.name, pierre: detail.item.name })
        }
      }
    }
    return resultats
  }
  for (const suivant of maillon.evolves_to) {
    const trouve = chercherEvolutionsPierre(suivant, nomActuel)
    if (trouve.length > 0) return trouve
  }
  return []
}