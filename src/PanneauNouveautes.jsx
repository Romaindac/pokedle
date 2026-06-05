import { useState } from 'react'

// Sprites illustratifs (PokeAPI officiels — même source que le reste du jeu).
const SPRITE_POKEMON = (num) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`
const SPRITE_ITEM = (nom) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${nom}.png`

// Les pages du pop-up de nouveautés.
// Chaque page : titre, sprites illustratifs, et le texte (JSX).
const PAGES = [
  {
    cle: 'iv-defense',
    titre: 'La Défense a son IV !',
    sprites: [SPRITE_POKEMON(208), SPRITE_POKEMON(306)], // Steelix, Galeking (tanks)
    emojiFallback: '🛡️',
    contenu: (
      <>
        Chaque Pokémon possède désormais <b>4 IV</b> au lieu de 3 : PV, Attaque,
        Vitesse et <b>Défense</b>.
        <br /><br />
        Dans la fiche d'un Pokémon, tu vois les <b>4 barres d'IV</b> détaillées
        (sur 31 chacune) avec ton potentiel total. Tes Pokémon actuels reçoivent
        un IV de défense automatiquement.
      </>
    ),
  },
  {
    cle: 'bonbons-iv',
    titre: "Bonbons d'IV",
    sprites: [SPRITE_ITEM('hp-up'), SPRITE_ITEM('protein'), SPRITE_ITEM('carbos'), SPRITE_ITEM('iron')],
    emojiFallback: '✨',
    contenu: (
      <>
        Les boss lâchent parfois des <b>Bonbons d'IV</b> : ❤️ PV, ⚔️ Attaque,
        ⚡ Vitesse, 🛡️ Défense.
        <br /><br />
        Chaque bonbon ajoute <b>+1 à l'IV</b> de la stat (max 31). Utilise-les
        depuis le <b>Sac → onglet « Bonbons IV »</b>, en choisissant le Pokémon
        à booster.
      </>
    ),
  },
  {
    cle: 'refarm-boss',
    titre: 'Les boss reviennent !',
    sprites: [SPRITE_POKEMON(150), SPRITE_POKEMON(249)], // Mewtwo, Lugia
    emojiFallback: '👑',
    contenu: (
      <>
        Le 1<sup>er</sup> boss d'une zone apparaît à <b>25 victoires</b> comme
        avant. Une fois battu, il <b>revient tous les 250 combats</b> dans la zone.
        <br /><br />
        Tu peux donc <b>refarmer les boss</b> pour leurs drops (objets de boss,
        bonbons d'IV...). Le compteur de progression est dans le bandeau de zone.
      </>
    ),
  },
]

function SpriteIllu({ src, fallback }) {
  return (
    <img
      src={src}
      alt=""
      className="nouv-sprite"
      onError={(e) => {
        const span = document.createElement('span')
        span.textContent = fallback
        span.className = 'nouv-sprite-fallback'
        e.currentTarget.replaceWith(span)
      }}
    />
  )
}

function PanneauNouveautes({ onFermer }) {
  const [page, setPage] = useState(0)
  const total = PAGES.length
  const p = PAGES[page]
  const estDerniere = page === total - 1

  return (
    <div className="overlay">
      <div className="panneau-banc nouv-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="nouv-entete">
          <span className="nouv-titre-haut">Quoi de neuf ?</span>
          <span className="nouv-step">{page + 1} / {total}</span>
        </div>

        <div className="nouv-corps">
          <div className="nouv-sprites">
            {p.sprites.map((s, i) => (
              <SpriteIllu key={i} src={s} fallback={p.emojiFallback} />
            ))}
          </div>
          <div className="nouv-titre">{p.titre}</div>
          <div className="nouv-texte">{p.contenu}</div>
        </div>

        <div className="nouv-pied">
          <button
            className="nouv-btn nouv-btn-prev"
            onClick={() => setPage((v) => Math.max(0, v - 1))}
            disabled={page === 0}
          >◀ Précédent</button>

          <div className="nouv-dots">
            {PAGES.map((_, i) => (
              <span key={i} className={`nouv-dot ${i === page ? 'actif' : ''}`}></span>
            ))}
          </div>

          {estDerniere ? (
            <button className="nouv-btn nouv-btn-next" onClick={onFermer}>Commencer !</button>
          ) : (
            <button className="nouv-btn nouv-btn-next" onClick={() => setPage((v) => Math.min(total - 1, v + 1))}>Suivant ▶</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PanneauNouveautes