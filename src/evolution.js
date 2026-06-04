// Certains noms renvoyés par la PokeAPI (dans les chaînes d'évolution) ne sont pas
// directement chargeables. On les corrige ici.
const CORRECTIONS_NOMS = {
  darmanitan: 'darmanitan-standard',
  // (on pourra en ajouter d'autres ici si on en découvre)
}

export function corrigerNom(nom) {
  return CORRECTIONS_NOMS[nom] || nom
}

// ====================================================================
// ÉVOLUTIONS "EXOTIQUES" (bonheur, échange, amitié, attaque connue...)
// Le jeu ne gère que 2 déclencheurs : par NIVEAU et par PIERRE.
// Toutes les autres évolutions seraient donc IMPOSSIBLES (ex: Noctali, Mentali,
// et tous les Pokémon qui évoluent au bonheur). Pour les rendre jouables, on les
// convertit en évolutions PAR PIERRE, avec une pierre choisie intelligemment.
// ====================================================================

// Les 10 pierres disponibles dans le jeu.
// fire-stone, water-stone, thunder-stone, leaf-stone, moon-stone,
// sun-stone, shiny-stone, dusk-stone, dawn-stone, ice-stone

// Mapping SPÉCIAL pour les évolutions d'Évoli qui ne sont pas déjà par pierre
// (Phyllali = leaf-stone et Givrali = ice-stone sont déjà des use-item natifs).
const PIERRE_SPECIALE_PAR_ESPECE = {
  umbreon: 'dusk-stone',   // Noctali → Pierre Nuit
  espeon: 'dawn-stone',    // Mentali → Pierre Aube
  sylveon: 'moon-stone',   // Nymphali → Pierre Lune
  leafeon: 'leaf-stone',   // Phyllali (sécurité si pas use-item)
  glaceon: 'ice-stone',    // Givrali (sécurité si pas use-item)
}

// Pierre choisie selon le TYPE principal du Pokémon cible (pour les évolutions
// exotiques génériques). Couvre les types courants ; fallback = dawn-stone.
const PIERRE_PAR_TYPE = {
  fire: 'fire-stone',
  water: 'water-stone',
  electric: 'thunder-stone',
  grass: 'leaf-stone',
  ice: 'ice-stone',
  psychic: 'dawn-stone',
  fairy: 'moon-stone',
  dark: 'dusk-stone',
  ghost: 'dusk-stone',
  rock: 'sun-stone',
  ground: 'sun-stone',
  fighting: 'sun-stone',
  normal: 'shiny-stone',
  flying: 'shiny-stone',
  bug: 'leaf-stone',
  poison: 'dusk-stone',
  steel: 'thunder-stone',
  dragon: 'fire-stone',
}
const PIERRE_DEFAUT = 'dawn-stone'

// Récupère TOUTES les infos d'espèce en UN minimum d'appels :
// - evolueEn / evolueNiveau (évolution par niveau)
// - evolutionsPierre (évolutions par pierre, NATIVES + exotiques converties)
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

    // Récupérer la chaîne pour trouver les évolutions (niveau + pierre + exotiques).
    const chaine = await fetch(url)
    const chaineData = await chaine.json()
    const evo = chercherEvolution(chaineData.chain, especeData.name)
    const evolutionsPierre = await chercherEvolutionsPierre(chaineData.chain, especeData.name)

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

// Parcourt la chaîne pour trouver le maillon de nomActuel, puis son évolution par NIVEAU.
// NB : seules les évolutions "level-up" restent ici. Les autres (bonheur, échange...)
// sont gérées comme des pierres dans chercherEvolutionsPierre.
function chercherEvolution(maillon, nomActuel) {
  if (maillon.species.name === nomActuel) {
    for (const suivant of maillon.evolves_to) {
      for (const detail of suivant.evolution_details) {
        if (detail.trigger.name === 'level-up' && detail.min_level) {
          return { evolueEn: suivant.species.name, evolueNiveau: detail.min_level }
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

// Renvoie le type principal d'une espèce (pour choisir sa pierre). 1 appel léger.
async function typePrincipalDe(nomEspece) {
  try {
    const rep = await fetch(`https://pokeapi.co/api/v2/pokemon/${corrigerNom(nomEspece)}`)
    const data = await rep.json()
    return data.types && data.types[0] ? data.types[0].type.name : null
  } catch (err) {
    return null
  }
}

// Choisit la pierre à associer à une évolution exotique de `nomCible`.
async function pierrePourEvolution(nomCible) {
  // 1) Mapping spécial connu (Évoli & co).
  if (PIERRE_SPECIALE_PAR_ESPECE[nomCible]) return PIERRE_SPECIALE_PAR_ESPECE[nomCible]
  // 2) Selon le type principal du Pokémon cible.
  const type = await typePrincipalDe(nomCible)
  if (type && PIERRE_PAR_TYPE[type]) return PIERRE_PAR_TYPE[type]
  // 3) Fallback.
  return PIERRE_DEFAUT
}

// Cherche les évolutions PAR PIERRE du maillon correspondant à nomActuel.
// Inclut : les vraies pierres (use-item) ET les évolutions exotiques converties
// (bonheur, échange, amitié, etc.), pour qu'aucune famille ne reste bloquée.
// Renvoie un tableau : [{ evolueEn, pierre }, ...] (vide si aucune).
async function chercherEvolutionsPierre(maillon, nomActuel) {
  // Trouve d'abord le bon maillon (récursif).
  if (maillon.species.name !== nomActuel) {
    for (const suivant of maillon.evolves_to) {
      const trouve = await chercherEvolutionsPierre(suivant, nomActuel)
      if (trouve.length > 0) return trouve
    }
    return []
  }

  const resultats = []
  for (const suivant of maillon.evolves_to) {
    const cible = suivant.species.name
    // Cette évolution a-t-elle un déclencheur "par niveau" exploitable ?
    let aNiveau = false
    let aPierreNative = false
    let pierreNative = null
    for (const detail of suivant.evolution_details) {
      const trig = detail.trigger?.name
      if (trig === 'level-up' && detail.min_level) aNiveau = true
      if (trig === 'use-item' && detail.item) {
        aPierreNative = true
        pierreNative = detail.item.name
      }
    }

    if (aPierreNative) {
      // Vraie évolution par pierre (Aquali, etc.) → on garde la pierre native.
      resultats.push({ evolueEn: cible, pierre: pierreNative })
    } else if (!aNiveau) {
      // Évolution EXOTIQUE (bonheur, échange, amitié, attaque...) sans niveau exploitable
      // → on la rend jouable en lui assignant une pierre logique.
      const pierre = await pierrePourEvolution(cible)
      resultats.push({ evolueEn: cible, pierre })
    }
    // Si aNiveau && !aPierreNative : c'est une évolution par niveau pure, gérée ailleurs.
  }
  return resultats
}