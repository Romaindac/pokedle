import { useState } from 'react'
import { nomShowdown } from './pokedexNoms'

const STARTERS_PAR_GEN = [
  { gen: 'Gen 1', liste: [
    { num: 1, nom: 'bulbasaur', fr: 'Bulbizarre' },
    { num: 4, nom: 'charmander', fr: 'Salamèche' },
    { num: 7, nom: 'squirtle', fr: 'Carapuce' },
  ]},
  { gen: 'Gen 2', liste: [
    { num: 152, nom: 'chikorita', fr: 'Germignon' },
    { num: 155, nom: 'cyndaquil', fr: 'Héricendre' },
    { num: 158, nom: 'totodile', fr: 'Kaiminus' },
  ]},
  { gen: 'Gen 3', liste: [
    { num: 252, nom: 'treecko', fr: 'Arcko' },
    { num: 255, nom: 'torchic', fr: 'Poussifeu' },
    { num: 258, nom: 'mudkip', fr: 'Gobou' },
  ]},
  { gen: 'Gen 4', liste: [
    { num: 387, nom: 'turtwig', fr: 'Tortipouss' },
    { num: 390, nom: 'chimchar', fr: 'Ouisticram' },
    { num: 393, nom: 'piplup', fr: 'Tiplouf' },
  ]},
  { gen: 'Gen 5', liste: [
    { num: 495, nom: 'snivy', fr: 'Vipélierre' },
    { num: 498, nom: 'tepig', fr: 'Gruikui' },
    { num: 501, nom: 'oshawott', fr: 'Moustillon' },
  ]},
  { gen: 'Gen 6', liste: [
    { num: 650, nom: 'chespin', fr: 'Marisson' },
    { num: 653, nom: 'fennekin', fr: 'Feunnec' },
    { num: 656, nom: 'froakie', fr: 'Grenousse' },
  ]},
  { gen: 'Gen 7', liste: [
    { num: 722, nom: 'rowlet', fr: 'Brindibou' },
    { num: 725, nom: 'litten', fr: 'Flamiaou' },
    { num: 728, nom: 'popplio', fr: 'Otaquin' },
  ]},
  { gen: 'Gen 8', liste: [
    { num: 810, nom: 'grookey', fr: 'Ouistempo' },
    { num: 813, nom: 'scorbunny', fr: 'Flambino' },
    { num: 816, nom: 'sobble', fr: 'Larméléon' },
  ]},
  { gen: 'Gen 9', liste: [
    { num: 906, nom: 'sprigatito', fr: 'Poussacha' },
    { num: 909, nom: 'fuecoco', fr: 'Chochodile' },
    { num: 912, nom: 'quaxly', fr: 'Coiffeton' },
  ]},
]

const SPRITE_STATIQUE = (num) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`
const NB_CHOIX = 3

// Sprite animé Showdown avec repli statique.
function SpriteStarter({ num, nom, fr }) {
  const nomSd = nomShowdown(num) || nom
  const urlAnime = `https://play.pokemonshowdown.com/sprites/ani/${nomSd}.gif`
  const onError = (e) => {
    const img = e.currentTarget
    if (img.dataset.failed === '1') return
    img.dataset.failed = '1'
    img.src = SPRITE_STATIQUE(num)
  }
  return <img src={urlAnime} alt={fr} className="strt-sprite" data-failed="0" loading="lazy" onError={onError} />
}

function ChoixStarter({ onChoisir }) {
  const [choisis, setChoisis] = useState([])

  function basculer(nom) {
    setChoisis((c) => {
      if (c.includes(nom)) return c.filter((n) => n !== nom)
      if (c.length >= NB_CHOIX) return c
      return [...c, nom]
    })
  }

  const pret = choisis.length === NB_CHOIX

  return (
    <div className="overlay strt-overlay">
      <div className="strt-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="strt-entete">
          <h2>🌟 Choisis ton équipe de départ</h2>
          <p className="strt-sous-titre">
            Sélectionne <strong>{NB_CHOIX} starters</strong> parmi toutes les générations.
            <span className="strt-compteur"> {choisis.length}/{NB_CHOIX} choisis</span>
          </p>
        </div>

        <div className="strt-gens">
          {STARTERS_PAR_GEN.map((g) => (
            <div key={g.gen} className="strt-gen">
              <h3 className="strt-gen-titre">{g.gen}</h3>
              <div className="strt-gen-grille">
                {g.liste.map((s) => {
                  const actif = choisis.includes(s.nom)
                  const bloque = !actif && choisis.length >= NB_CHOIX
                  return (
                    <button
                      key={s.nom}
                      className={`strt-carte ${actif ? 'choisi' : ''} ${bloque ? 'bloque' : ''}`}
                      onClick={() => basculer(s.nom)}
                      title={s.fr}>
                      <div className="strt-sprite-zone"><SpriteStarter num={s.num} nom={s.nom} fr={s.fr} /></div>
                      <span className="strt-nom">{s.fr}</span>
                      {actif && <span className="strt-check">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="strt-pied">
          <button
            className={`strt-valider ${pret ? '' : 'desactive'}`}
            disabled={!pret}
            onClick={() => pret && onChoisir(choisis)}>
            {pret ? `C'est parti ! (${NB_CHOIX} Pokémon)` : `Choisis encore ${NB_CHOIX - choisis.length} Pokémon`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChoixStarter