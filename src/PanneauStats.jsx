import { nomShowdown } from './pokedexNoms'

const TOTAL_POKEDEX = 1025

// Sprite animé du Pokémon (Showdown + repli artwork/normal).
function SpritePoke({ poke, classe }) {
  if (!poke) return null
  const num = poke.id
  const nomSd = num ? nomShowdown(num) : (poke.nom || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const shiny = !!poke.shiny
  const urlAnime = nomSd ? `https://play.pokemonshowdown.com/sprites/${shiny ? 'ani-shiny' : 'ani'}/${nomSd}.gif` : null
  const urlHd = num ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/${shiny ? 'official-artwork/shiny' : 'official-artwork'}/${num}.png` : null
  const fallback = poke.sprite
  const onError = (e) => {
    const img = e.currentTarget
    const etape = parseInt(img.dataset.etape || '0', 10)
    if (etape === 0 && urlHd) { img.dataset.etape = '1'; img.src = urlHd }
    else if (etape <= 1 && fallback) { img.dataset.etape = '2'; img.src = fallback }
  }
  return <img src={urlAnime || fallback || urlHd} alt={poke.nom} className={classe} data-etape="0" onError={onError} />
}

function LigneStat({ label, valeur, fort }) {
  return (
    <div className={`stm-ligne ${fort ? 'fort' : ''}`}>
      <span className="stm-label">{label}</span>
      <span className="stm-valeur">{valeur}</span>
    </div>
  )
}

function CategorieStats({ titre, emoji, children }) {
  return (
    <div className="stm-categorie">
      <div className="stm-categorie-titre">{emoji} {titre}</div>
      <div className="stm-categorie-corps">{children}</div>
    </div>
  )
}

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
  pseudoActuel = '',
  onChangerPseudo,
  onFermer,
}) {
  const nbVus = pokedexVus.length
  const nbShiny = pokedexShiny.length
  const pourcentDex = ((nbVus / TOTAL_POKEDEX) * 100).toFixed(1)
  const pourcentShiny = ((nbShiny / TOTAL_POKEDEX) * 100).toFixed(1)

  const niveauMax = captures.length > 0 ? Math.max(...captures.map((p) => p.niveau || 1)) : 0
  const shinyPossedes = captures.filter((p) => p.shiny).length

  const niveauMoyen = captures.length > 0
    ? Math.round(captures.reduce((s, p) => s + (p.niveau || 1), 0) / captures.length)
    : 0
  const plusFort = captures.length > 0
    ? captures.reduce((meilleur, p) => ((p.niveau || 1) > (meilleur.niveau || 1) ? p : meilleur), captures[0])
    : null
  const nbEvolutions = captures.filter((p) => p.estEvolution).length
  const nbLegendaires = captures.filter((p) => p.rarete === 'legendaire').length
  const ratioShiny = nbShiny > 0 ? Math.round(nbVus / nbShiny) : 0

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="stm-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="stm-entete">
          <h2>📊 Statistiques</h2>
          <button className="stm-fermer" onClick={onFermer}>✕</button>
        </div>

        {plusFort && (
          <div className="stm-vedette">
            <div className="stm-vedette-sprite"><SpritePoke poke={plusFort} classe="stm-vedette-img" /></div>
            <div className="stm-vedette-txt">
              <span className="stm-vedette-label">Champion de ta collection</span>
              <span className="stm-vedette-nom">{plusFort.nom}{plusFort.shiny ? ' ✨' : ''}</span>
              <span className="stm-vedette-niv">Niveau {plusFort.niveau || 1}</span>
            </div>
          </div>
        )}

        {onChangerPseudo && (
          <div className="stm-pseudo">
            <div className="stm-pseudo-info">
              <span className="stm-pseudo-label">Pseudo du classement</span>
              <span className="stm-pseudo-valeur">🏆 {pseudoActuel || '—'}</span>
            </div>
            <button className="stm-pseudo-bouton" onClick={onChangerPseudo}>✏️ Changer</button>
          </div>
        )}

        <div className="stm-categories">
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
            <LigneStat label="Pokémon le plus fort" valeur={plusFort ? `${plusFort.nom} (N.${plusFort.niveau})` : '—'} />
            <LigneStat label="PokéDollars" valeur={pokeDollars.toLocaleString('fr-FR')} />
          </CategorieStats>
        </div>
      </div>
    </div>
  )
}

export default Stats