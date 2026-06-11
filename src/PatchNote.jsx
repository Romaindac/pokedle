import { useState } from 'react'

// ============================================================
// PATCH NOTE + TUTO — Thème Pokeball, OBLIGATOIRE.
// Le joueur DOIT lire le patch note puis parcourir les 4 slides
// du tuto avant de pouvoir fermer. Aucune croix, aucun clic
// exterieur, aucun bouton "passer". onFermer n'est appele qu'a
// la toute fin.
//
// Sprites animes Showdown (memes que le jeu) + exemple anime
// "sprite pose sur une carte" sur le slide Socle.
//
// Props : onFermer() - marque la version comme vue (cote App).
// ============================================================

const ROUGE = '#ee1c25'
const ROUGE_FONCE = '#b3141a'
const NOIR = '#1a1a1a'
const BLANC = '#f7f7f7'

// Sprite anime Showdown avec cascade de secours (comme en combat).
function SpriteAnime({ nom, dexId, taille = 64, style = {} }) {
  const sources = [
    `https://play.pokemonshowdown.com/sprites/ani/${nom}.gif`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${dexId}.gif`,
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${dexId}.png`,
  ]
  const onErr = (e) => {
    const img = e.currentTarget
    const i = Number(img.dataset.i || 0)
    if (i < sources.length - 1) { img.dataset.i = i + 1; img.src = sources[i + 1] }
    else { img.style.visibility = 'hidden' }
  }
  return (
    <img
      src={sources[0]} data-i={0} onError={onErr} alt={nom}
      style={{ width: taille, height: taille, objectFit: 'contain', imageRendering: 'pixelated', ...style }}
    />
  )
}

// Sprites decoratifs par slide (nom Showdown + dexId pour secours).
const DECO_SLIDES = [
  [{ nom: 'pikachu', dexId: 25 }, { nom: 'eevee', dexId: 133 }],         // Boosters
  [{ nom: 'charizard', dexId: 6 }, { nom: 'gengar', dexId: 94 }],         // Socle
  [{ nom: 'lucario', dexId: 448 }, { nom: 'garchomp', dexId: 445 }],      // Combats & Vitesse
  [{ nom: 'rayquaza', dexId: 384 }, { nom: 'glaceon', dexId: 471 }],      // Ambiances
]

const NOUVEAUTES = [
  { emoji: '🎴', titre: 'Boosters TCG', desc: "Ouvre des boosters gagnes en Tour, complete 15 sets de cartes et gagne des bonus d'XP." },
  { emoji: '🖼️', titre: 'Cartes au combat', desc: "Chaque Pokemon combat desormais sur une vraie carte TCG. Choisis celle de tes allies !" },
  { emoji: '⚔️', titre: 'Combats unifies', desc: "Arene, Raids et Tour ont le meme rendu spectaculaire que l'aventure principale." },
  { emoji: '⏩', titre: 'Vitesse par mode', desc: "Chaque mode a ses boutons x1/x2/x4 independants, directement dans le combat." },
  { emoji: '✨', titre: 'Ambiances vivantes', desc: "Chaque zone a son ambiance animee : feuilles, braises, flocons, eclairs, god rays..." },
]

const SLIDES = [
  {
    emoji: '🎴', titre: 'Les Boosters TCG',
    points: [
      "Gagne des boosters en remportant des combats dans la Tour Infinie.",
      "Ouvre-les depuis le bouton << Boosters >> du menu : 10 cartes par booster !",
      "Range tes cartes dans l'album (onglet << Sets TCG >> de la Tour) : 15 sets a completer.",
      "Completer des sets et trouver des cartes Chromatiques booste ton XP global.",
    ],
  },
  {
    emoji: '🖼️', titre: 'Le Socle de combat',
    exempleSocle: true, // affiche l'exemple sprite-sur-carte
    points: [
      "Chaque Pokemon combat maintenant pose sur une carte TCG (comme ci-dessus).",
      "Pour tes allies : Equipe -> un Pokemon -> << Style - Socle de combat >>.",
      "Choisis n'importe quelle carte de ton espece que tu possedes.",
      "Les ennemis arborent une carte aleatoire de leur propre espece !",
    ],
  },
  {
    emoji: '⚔️', titre: 'Combats & Vitesse',
    points: [
      "Arene, Raids et Tour ont le meme affichage que l'aventure : cartes, sprites, auras.",
      "Chaque mode garde ses regles (timer de boss, vagues de raid...).",
      "Les boutons x1 / x2 / x4 sont dans chaque ecran de combat.",
      "La vitesse de chaque mode est independante et repart a x1 a chaque combat.",
    ],
  },
  {
    emoji: '✨', titre: 'Ambiances de zone',
    points: [
      "Chaque biome a sa propre ambiance animee par-dessus le decor.",
      "Foret : feuilles + petales + lucioles. Volcan : braises. Neige : flocons + aurore.",
      "Abysses : pluie. Electrique : eclairs. Et des god rays partout !",
      "En Tour Infinie, le decor change a chaque niveau. Profite du spectacle. 🔥",
    ],
  },
]

// Exemple anime : un sprite pose sur une vraie carte TCG (comme en combat).
function ExempleSocle() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
      <div style={{ position: 'relative', width: 150, height: 200 }}>
        {/* Carte TCG (Pikachu, set 151) */}
        <img
          src="https://images.pokemontcg.io/sv3pt5/25.png"
          alt="Carte Pikachu"
          style={{
            width: 150, height: 'auto', borderRadius: 8,
            boxShadow: '0 6px 16px rgba(0,0,0,0.35)', display: 'block',
          }}
        />
        {/* Halo doux derriere le sprite */}
        <div style={{
          position: 'absolute', left: '50%', top: 22, transform: 'translateX(-50%)',
          width: 96, height: 96, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(252,211,77,0.55) 0%, rgba(252,211,77,0) 70%)',
          pointerEvents: 'none',
        }} />
        {/* Sprite anime pose au-dessus de la carte */}
        <div style={{ position: 'absolute', left: '50%', top: 4, transform: 'translateX(-50%)' }}>
          <SpriteAnime nom="pikachu" dexId={25} taille={84} />
        </div>
        {/* Petite etiquette */}
        <div style={{
          position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
          background: ROUGE, color: BLANC, fontSize: 11, fontWeight: 800,
          padding: '3px 10px', borderRadius: 10, border: `2px solid ${NOIR}`, whiteSpace: 'nowrap',
        }}>
          Sprite + carte = au combat !
        </div>
      </div>
    </div>
  )
}

// En-tete Pokeball : bande rouge, ligne noire, bouton central.
function EntetesPokeball() {
  return (
    <div style={{ position: 'relative', height: 58, margin: '-26px -24px 16px', borderRadius: '14px 14px 0 0', overflow: 'hidden', flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${ROUGE} 0%, ${ROUGE_FONCE} 100%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, background: NOIR }} />
      <div style={{
        position: 'absolute', left: '50%', bottom: -17, transform: 'translateX(-50%)',
        width: 38, height: 38, borderRadius: '50%', background: BLANC,
        border: `6px solid ${NOIR}`, boxShadow: '0 2px 8px rgba(0,0,0,0.4)', zIndex: 2,
      }} />
    </div>
  )
}

function PatchNote({ onFermer }) {
  const [vue, setVue] = useState('notes') // 'notes' | 'tuto'
  const [slide, setSlide] = useState(0)

  const fond = {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(4,6,14,0.88)', backdropFilter: 'blur(5px)', padding: 16,
  }
  const boite = {
    width: '100%', maxWidth: 560, maxHeight: '90vh', display: 'flex', flexDirection: 'column',
    background: BLANC,
    border: `4px solid ${NOIR}`, borderRadius: 16,
    boxShadow: `0 0 0 4px ${ROUGE}, 0 20px 60px rgba(0,0,0,0.7)`,
    padding: '26px 24px 22px', color: NOIR,
    fontFamily: "'Rubik', system-ui, sans-serif", position: 'relative',
  }
  const corps = { overflowY: 'auto', flex: 1, minHeight: 0 }
  const btnRouge = {
    width: '100%', padding: '13px 18px', borderRadius: 10, cursor: 'pointer',
    fontWeight: 800, fontSize: 16, border: `3px solid ${NOIR}`,
    background: ROUGE, color: BLANC, boxShadow: `0 4px 0 ${ROUGE_FONCE}`,
  }
  const btnBlanc = {
    flex: 1, padding: '13px 18px', borderRadius: 10, cursor: 'pointer',
    fontWeight: 800, fontSize: 15, border: `3px solid ${NOIR}`,
    background: BLANC, color: NOIR, boxShadow: '0 4px 0 #bbb',
  }

  // ---------- VUE PATCH NOTE ----------
  if (vue === 'notes') {
    return (
      <div style={fond}>
        <div style={boite}>
          <EntetesPokeball />
          <div style={{ textAlign: 'center', marginBottom: 12, marginTop: 6 }}>
            <div style={{ fontSize: 12, letterSpacing: 2, color: ROUGE, fontWeight: 900 }}>● MISE A JOUR ●</div>
            <h2 style={{ margin: '6px 0 2px', fontSize: 25, color: NOIR, fontWeight: 900 }}>
              Nouvelle saison TCG !
            </h2>
            <div style={{ fontSize: 13, color: '#555' }}>Decouvre tout ce qui debarque dans Pokedle</div>
          </div>

          {/* Sprites mascottes en haut */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <SpriteAnime nom="pikachu" dexId={25} taille={56} />
            <SpriteAnime nom="charizard" dexId={6} taille={64} />
            <SpriteAnime nom="mewtwo" dexId={150} taille={60} />
          </div>

          <div style={corps}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
              {NOUVEAUTES.map((n, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  background: '#fff', border: `2px solid ${NOIR}`, borderLeft: `6px solid ${ROUGE}`,
                  borderRadius: 10, padding: '10px 13px',
                }}>
                  <span style={{ fontSize: 25, lineHeight: 1, flexShrink: 0 }}>{n.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 15, color: NOIR }}>{n.titre}</div>
                    <div style={{ fontSize: 13.5, color: '#444', lineHeight: 1.45 }}>{n.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button style={btnRouge} onClick={() => { setVue('tuto'); setSlide(0) }}>
            Continuer vers le tuto →
          </button>
        </div>
      </div>
    )
  }

  // ---------- VUE TUTO (slides, obligatoire) ----------
  const s = SLIDES[slide]
  const dernier = slide === SLIDES.length - 1
  const deco = DECO_SLIDES[slide] || []
  return (
    <div style={fond}>
      <div style={boite}>
        <EntetesPokeball />

        {/* Progression : petites pokeballs */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 14, marginTop: 6 }}>
          {SLIDES.map((_, i) => (
            <span key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i <= slide ? ROUGE : '#ddd',
              border: `2px solid ${NOIR}`, transition: 'all 0.2s',
            }} />
          ))}
        </div>

        <div style={corps}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 40, lineHeight: 1 }}>{s.emoji}</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 22, color: NOIR, fontWeight: 900 }}>{s.titre}</h2>
            <div style={{ fontSize: 12, color: ROUGE, fontWeight: 800, marginTop: 2 }}>
              Etape {slide + 1} / {SLIDES.length}
            </div>
          </div>

          {/* Exemple sprite-sur-carte (slide Socle) OU sprites deco */}
          {s.exempleSocle ? (
            <ExempleSocle />
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 12 }}>
              {deco.map((d, i) => <SpriteAnime key={i} nom={d.nom} dexId={d.dexId} taille={i === 0 ? 64 : 58} />)}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 18 }}>
            {s.points.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: 18, height: 18, borderRadius: '50%', marginTop: 1,
                  background: ROUGE, border: `2px solid ${NOIR}`, display: 'inline-block',
                }} />
                <span style={{ fontSize: 14.5, color: '#333', lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {slide > 0 && (
            <button style={btnBlanc} onClick={() => setSlide((v) => v - 1)}>← Precedent</button>
          )}
          {!dernier ? (
            <button style={{ ...btnRouge, flex: 2 }} onClick={() => setSlide((v) => v + 1)}>Suivant →</button>
          ) : (
            <button style={{ ...btnRouge, flex: 2 }} onClick={onFermer}>Commencer l'aventure ! 🎉</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PatchNote