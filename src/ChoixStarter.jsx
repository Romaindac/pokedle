import { useState } from 'react'

// Les starters de toutes les générations (gen 1-9). Noms = identifiants PokeAPI valides.
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

const SPRITE = (num) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`
const NB_CHOIX = 3

function ChoixStarter({ onChoisir }) {
  const [choisis, setChoisis] = useState([]) // tableau de noms PokeAPI

  function basculer(nom) {
    setChoisis((c) => {
      if (c.includes(nom)) return c.filter((n) => n !== nom)      // décocher
      if (c.length >= NB_CHOIX) return c                          // déjà 3 : on ignore
      return [...c, nom]                                          // cocher
    })
  }

  const pret = choisis.length === NB_CHOIX

  return (
    <div className="overlay overlay-starter">
      <div className="panneau-starter" onClick={(e) => e.stopPropagation()}>
        <div className="starter-entete">
          <h2>🌟 Choisis ton équipe de départ</h2>
          <p className="starter-sous-titre">
            Sélectionne <strong>{NB_CHOIX} starters</strong> parmi toutes les générations.
            ({choisis.length}/{NB_CHOIX} choisis)
          </p>
        </div>

        <div className="starter-gens">
          {STARTERS_PAR_GEN.map((g) => (
            <div key={g.gen} className="starter-gen">
              <h3 className="starter-gen-titre">{g.gen}</h3>
              <div className="starter-gen-grille">
                {g.liste.map((s) => {
                  const actif = choisis.includes(s.nom)
                  const bloque = !actif && choisis.length >= NB_CHOIX
                  return (
                    <button
                      key={s.nom}
                      className={`starter-carte ${actif ? 'choisi' : ''} ${bloque ? 'bloque' : ''}`}
                      onClick={() => basculer(s.nom)}
                      title={s.fr}
                    >
                      <img src={SPRITE(s.num)} alt={s.fr} className="starter-sprite" loading="lazy" />
                      <span className="starter-nom">{s.fr}</span>
                      {actif && <span className="starter-check">✓</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="starter-pied">
          <button
            className={`starter-valider ${pret ? '' : 'desactive'}`}
            disabled={!pret}
            onClick={() => pret && onChoisir(choisis)}
          >
            {pret ? `C'est parti ! (${NB_CHOIX} Pokémon)` : `Choisis encore ${NB_CHOIX - choisis.length} Pokémon`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChoixStarter