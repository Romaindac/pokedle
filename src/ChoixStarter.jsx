import { useState } from 'react'
import { nomShowdown } from './pokedexNoms'
import { determinerRole, ROLES } from './roles'

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

// Description courte de chaque role (pour l'encart d'intro).
const ROLE_DESC = {
  tank:      "Encaisse les coups et protege l'equipe.",
  dps:       "Inflige de gros degats aux ennemis.",
  eclaireur: "Tres rapide, attaque souvent.",
  soutien:   "Soigne et renforce toute l'equipe.",
}

// Sprite anime Showdown avec repli statique.
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

// Calcule le role d'un starter depuis son numero (logique du jeu).
function roleDuStarter(num) {
  const role = determinerRole({ id: num })
  return ROLES[role] ? role : 'dps'
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

  // Compte les roles deja choisis (pour le conseil de variete).
  const rolesChoisis = {}
  for (const g of STARTERS_PAR_GEN) {
    for (const s of g.liste) {
      if (choisis.includes(s.nom)) {
        const r = roleDuStarter(s.num)
        rolesChoisis[r] = (rolesChoisis[r] || 0) + 1
      }
    }
  }
  const nbRolesDifferents = Object.keys(rolesChoisis).length

  return (
    <div className="overlay strt-overlay">
      <div className="strt-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="strt-entete">
          <h2>🌟 Choisis ton equipe de depart</h2>
          <p className="strt-sous-titre">
            Selectionne <strong>{NB_CHOIX} starters</strong> parmi toutes les generations.
            <span className="strt-compteur"> {choisis.length}/{NB_CHOIX} choisis</span>
          </p>
        </div>

        {/* Encart d'explication des roles */}
        <div className="strt-intro-roles">
          <p className="strt-intro-txt">
            👋 Chaque Pokemon a un <strong>ROLE</strong> selon ses points forts. Une bonne equipe melange les roles !
          </p>
          <div className="strt-roles-legende">
            {['tank', 'eclaireur', 'soutien', 'dps'].map((r) => (
              <div key={r} className="strt-role-item" style={{ '--c-role': ROLES[r].couleur }}>
                <span className="strt-role-badge" style={{ background: ROLES[r].couleur }}>{ROLES[r].emoji}</span>
                <div className="strt-role-txt">
                  <span className="strt-role-nom">{ROLES[r].nom}</span>
                  <span className="strt-role-desc">{ROLE_DESC[r]}</span>
                </div>
              </div>
            ))}
          </div>
          {choisis.length > 0 && (
            <p className={`strt-conseil ${nbRolesDifferents >= choisis.length ? 'ok' : 'attention'}`}>
              {nbRolesDifferents >= choisis.length
                ? "👍 Bien joue, tes roles sont varies !"
                : "💡 Astuce : essaie de varier les roles pour une equipe plus solide."}
            </p>
          )}
        </div>

        <div className="strt-gens">
          {STARTERS_PAR_GEN.map((g) => (
            <div key={g.gen} className="strt-gen">
              <h3 className="strt-gen-titre">{g.gen}</h3>
              <div className="strt-gen-grille">
                {g.liste.map((s) => {
                  const actif = choisis.includes(s.nom)
                  const bloque = !actif && choisis.length >= NB_CHOIX
                  const role = roleDuStarter(s.num)
                  const infoRole = ROLES[role]
                  return (
                    <button
                      key={s.nom}
                      className={`strt-carte ${actif ? 'choisi' : ''} ${bloque ? 'bloque' : ''}`}
                      onClick={() => basculer(s.nom)}
                      title={`${s.fr} — ${infoRole.nom}`}>
                      <span className="strt-role-tag" style={{ background: infoRole.couleur }}>
                        {infoRole.emoji} {infoRole.nom}
                      </span>
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
            {pret ? `C'est parti ! (${NB_CHOIX} Pokemon)` : `Choisis encore ${NB_CHOIX - choisis.length} Pokemon`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChoixStarter