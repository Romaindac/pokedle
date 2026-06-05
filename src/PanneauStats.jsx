const TOTAL_POKEDEX = 1025

function LigneStat({ label, valeur, fort }) {
  return (
    <div className={`stat-ligne-globale stat-ligne-doree ${fort ? 'stat-ligne-fort' : ''}`}>
      <span className="stat-label-g">{label}</span>
      <span className="stat-valeur-g">{valeur}</span>
    </div>
  )
}

function CategorieStats({ titre, emoji, children }) {
  return (
    <div className="stats-categorie">
      <div className="stats-categorie-titre">{emoji} {titre}</div>
      <div className="stats-categorie-corps">{children}</div>
    </div>
  )
}

// Toutes les props ont une valeur par défaut → robuste si une donnée n'est pas passée.
function Stats({
  vaincus = 0,
  captures = [],
  pokedexVus = [],
  pokedexShiny = [],
  pokeDollars = 0,
  nbBoss = 0,
  nbDresseurs = 0,
  nbSpeciaux = 0,
  nbZones = 0,
  totalZones = 100,
  totalDresseurs = 75,
  totalSpeciaux = 15,
  onFermer,
}) {
  const nbVus = pokedexVus.length
  const nbShiny = pokedexShiny.length
  const pourcentDex = ((nbVus / TOTAL_POKEDEX) * 100).toFixed(1)
  const pourcentShiny = ((nbShiny / TOTAL_POKEDEX) * 100).toFixed(1)

  const niveauMax = captures.length > 0 ? Math.max(...captures.map((p) => p.niveau || 1)) : 0
  const shinyPossedes = captures.filter((p) => p.shiny).length

  // --- Stats calculées ---
  // Niveau moyen de la collection.
  const niveauMoyen = captures.length > 0
    ? Math.round(captures.reduce((s, p) => s + (p.niveau || 1), 0) / captures.length)
    : 0
  // Pokémon le plus fort (plus haut niveau).
  const plusFort = captures.length > 0
    ? captures.reduce((meilleur, p) => ((p.niveau || 1) > (meilleur.niveau || 1) ? p : meilleur), captures[0])
    : null
  // Nombre d'évolutions dans la collection.
  const nbEvolutions = captures.filter((p) => p.estEvolution).length
  // Nombre de légendaires possédés.
  const nbLegendaires = captures.filter((p) => p.rarete === 'legendaire').length
  // Ratio shiny : 1 shiny tous les X Pokémon vus.
  const ratioShiny = nbShiny > 0 ? Math.round(nbVus / nbShiny) : 0

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-stats-doree stats-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>📊 Statistiques</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="stats-categories">

          <CategorieStats titre="Combat" emoji="⚔️">
            <LigneStat label="Combats gagnés" valeur={vaincus.toLocaleString('fr-FR')} />
            <LigneStat label="Boss de zone vaincus" valeur={nbBoss} />
            <LigneStat label="Dresseurs d'Arène battus" valeur={`${nbDresseurs} / ${totalDresseurs}`} />
            <LigneStat label="Plus haut niveau" valeur={`N.${niveauMax}`} fort />
          </CategorieStats>

          <CategorieStats titre="Collection" emoji="📦">
            <LigneStat label="Pokémon possédés" valeur={captures.length} />
            <LigneStat label="Pokédex" valeur={`${nbVus} / ${TOTAL_POKEDEX} (${pourcentDex}%)`} fort />
            <LigneStat label="Pokédex Shiny" valeur={`${nbShiny} / ${TOTAL_POKEDEX} (${pourcentShiny}%)`} />
            <LigneStat label="Shiny possédés" valeur={shinyPossedes} />
            <LigneStat label="Ratio shiny" valeur={ratioShiny > 0 ? `1 sur ${ratioShiny}` : '—'} />
            <LigneStat label="Évolutions obtenues" valeur={nbEvolutions} />
            <LigneStat label="Légendaires possédés" valeur={nbLegendaires} />
            <LigneStat label="Pokémon Spéciaux" valeur={`${nbSpeciaux} / ${totalSpeciaux}`} />
          </CategorieStats>

          <CategorieStats titre="Progression" emoji="🗺️">
            <LigneStat label="Zones débloquées" valeur={`${nbZones} / ${totalZones}`} fort />
            <LigneStat label="Niveau moyen collection" valeur={`N.${niveauMoyen}`} />
            <LigneStat
              label="Pokémon le plus fort"
              valeur={plusFort ? `${plusFort.nom} (N.${plusFort.niveau})` : '—'}
            />
            <LigneStat label="PokéDollars" valeur={pokeDollars.toLocaleString('fr-FR')} />
          </CategorieStats>

        </div>
      </div>
    </div>
  )
}

export default Stats