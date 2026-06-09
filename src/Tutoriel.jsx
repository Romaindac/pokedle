import { useState, useEffect, useRef, useCallback } from 'react'

// =====================================================================
// Tutoriel.jsx — Systeme de tuto de Pokedle (refondu visite).
// 3 modes via la prop `mode` :
//   - 'bienvenue' : pop-up d'accueil illustre.
//   - 'visite'    : visite guidee avec SPOTLIGHT reel + FLECHE animee.
//   - 'guide'     : encyclopedie a onglets.
// =====================================================================

const SPRITE = (num) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`
const ITEM = (nom) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${nom}.png`
const MASCOTTE = SPRITE(25) // Pikachu

// ---------- Etapes de la VISITE GUIDEE (surlignage reel) ----------
// cible = valeur data-tuto a illuminer (null = pas de cible, bulle centree).
const ETAPES_VISITE = [
  {
    cible: null,
    titre: 'Bienvenue, Dresseur !',
    texte: "Pokedle est un jeu ou ton equipe se bat TOUTE SEULE. Suis ce petit tour : je vais te montrer chaque partie de l'ecran, pas a pas. Clique sur Suivant quand tu veux avancer.",
  },
  {
    cible: 'arene',
    titre: 'Le terrain de combat',
    texte: "Voici le coeur du jeu : ton equipe (en bas) affronte les Pokemon sauvages (en haut), automatiquement. Tu n'as rien a cliquer. A chaque victoire, tu gagnes de l'XP (pour monter de niveau) et de l'argent.",
  },
  {
    cible: 'capture',
    titre: 'Capturer les Pokemon',
    texte: "Quand un Pokemon sauvage est battu, tu peux l'attraper avec une Ball. Ici tu choisis quoi capturer (shiny, legendaire, nouveau, doublon) et quelle Ball utiliser. Si tu manques de la bonne Ball, le jeu prend la meilleure dispo : tu ne rates jamais une capture.",
  },
  {
    cible: 'achat',
    titre: 'Acheter des Balls',
    texte: "Pas de Balls = pas de captures ! Ici tu en achetes rapidement (+1, +10, +100) avec ton argent. Les meilleures Balls attrapent plus facilement les Pokemon rares.",
  },
  {
    cible: 'equipe',
    titre: 'Ton equipe',
    texte: "Tes 6 combattants sont ici. Chacun a un ROLE selon sa meilleure stat : Tank (encaisse), DPS (frappe fort), Eclaireur (rapide), Soutien (soigne). La bonne compo : 1 Tank, 1 Eclaireur, 2 Soutien, 2 DPS. Clique pour gerer ton equipe et faire evoluer tes Pokemon.",
  },
  {
    cible: 'routes',
    titre: 'Voyager entre les zones',
    texte: "Le jeu a 100 zones. Chaque zone a ses Pokemon et un niveau plus eleve. Apres assez de victoires, un BOSS apparait (avec un temps limite !). Le battre debloque la zone suivante.",
  },
  {
    cible: null,
    titre: 'Et le reste ?',
    texte: "Tu as plein d'autres menus en haut : Boutique, Sac, Elevage, Arene, Raids, Tour, PvP, Prestige... Pas de panique : chacun t'expliquera ce qu'il fait la PREMIERE fois que tu l'ouvres. Apprends en jouant !",
  },
  {
    cible: null,
    titre: 'A toi de jouer !',
    texte: "C'est parti ! Laisse ton equipe combattre, attrape tes premiers Pokemon, et explore a ton rythme. Tu peux rouvrir ce tuto via le bouton Aide. Bonne aventure, Dresseur !",
  },
]

// ---------- Pages du GUIDE a onglets (inchange) ----------
const ONGLETS_GUIDE = [
  {
    cle: 'demarrage', titre: 'Demarrage', sprite: 25, teinte: '#f6c544',
    paragraphes: [
      "Bienvenue dans Pokedle, un jeu idle : ton equipe combat automatiquement, meme quand tu ne fais rien.",
      "Au debut, tu choisis 3 starters. Ils forment ton equipe de depart.",
      "Ton but : capturer un max de Pokemon, les faire evoluer, completer le Pokedex (1025 !) et progresser a travers les 100 zones.",
      "A chaque combat gagne : de l'XP (pour monter de niveau) et de l'argent (pour acheter des balls et objets).",
    ],
    astuce: "Laisse tourner ! Reviens regler ta capture et ton equipe de temps en temps.", astuceItem: 'rare-candy',
  },
  {
    cle: 'combat', titre: 'Combat & Zones', sprite: 6, teinte: '#e25a30',
    paragraphes: [
      "Le combat est automatique. Chaque Pokemon a une jauge qui se remplit selon sa vitesse : pleine, il attaque.",
      "Les degats dependent de l'attaque, de la defense de la cible, et des types.",
      "Tu peux accelerer le combat (x1 / x2 / x4) pour farmer plus vite.",
      "Apres assez de victoires dans une zone, son boss apparait avec un timer. Le battre debloque la zone suivante.",
    ],
    astuce: "Si une zone est trop dure, monte tes Pokemon de niveau dans une zone plus facile.", astuceItem: 'rare-candy',
  },
  {
    cle: 'capture', titre: 'Capture', sprite: 16, teinte: '#9fd0ff',
    paragraphes: [
      "Pendant les combats, tu captures les Pokemon sauvages avec des balls.",
      "Le panneau Regles de capture definit, par categorie (Shiny, Legendaire, Nouveau, Doublon), quelle ball utiliser.",
      "Priorite : shiny > legendaire > nouveau > doublon. Si la ball manque, le jeu prend la meilleure dispo.",
      "Plus un Pokemon est rare, plus il est dur a attraper : les meilleures balls augmentent tes chances.",
    ],
    astuce: "Les doublons ne sont pas perdus : ils ameliorent les IV du Pokemon que tu possedes deja.", astuceItem: 'ultra-ball',
  },
  {
    cle: 'equipe', titre: 'Equipe & Roles', sprite: 448, teinte: '#5dcaa5',
    paragraphes: [
      "Ton equipe compte 6 Pokemon. Chacun a un role automatique : Tank, DPS, Eclaireur ou Soutien.",
      "Tank : encaisse. DPS : gros degats. Eclaireur : rapide. Soutien : soigne l'equipe.",
      "La compo imposee pour l'Arene et le PvP : 1 Tank, 1 Eclaireur, 2 Soutien, 2 DPS.",
      "Dans la fiche d'un Pokemon : ses stats, son role, son XP et les boutons d'evolution.",
    ],
    astuce: "Le bouton auto-equipe selectionne tes 6 meilleurs en respectant la compo.", astuceItem: 'ability-capsule',
  },
  {
    cle: 'pokedex', titre: 'Pokedex & Recompenses', sprite: 151, teinte: '#f48fb1',
    paragraphes: [
      "Le Pokedex recense les 1025 Pokemon. Tu peux le voir en Normal, Shiny, ou Speciaux.",
      "Il affiche ta progression par generation avec des filtres.",
      "L'onglet Recompenses te donne des cadeaux aux paliers de completion (balls, pierres, argent, bonus permanents).",
      "Les Pokemon Speciaux se debloquent en battant les boss de l'Arene.",
    ],
    astuce: "Une pastille rouge sur Pokedex = des recompenses a reclamer !", astuceItem: 'shiny-charm',
  },
  {
    cle: 'boutique', titre: 'Boutique & Sac', sprite: 101, teinte: '#f6c544',
    paragraphes: [
      "La Boutique : balls, pierres d'evolution et objets equipables. Achat en lot possible.",
      "Les prix montent un peu a chaque achat.",
      "Le Sac : tout ce que tu possedes, range en onglets.",
      "Les bonbons (XP) ne s'achetent pas : ils se gagnent sur les boss.",
    ],
    astuce: "Garde des Master Balls pour les legendaires ou shiny a ne pas rater.", astuceItem: 'master-ball',
  },
  {
    cle: 'elevage', titre: 'Elevage & Oeufs', sprite: 175, teinte: '#f9a8d4',
    paragraphes: [
      "Place un oeuf dans un incubateur : il eclot en COMBATTANT (chaque victoire le fait avancer).",
      "Les oeufs ont plus de chance de donner un shiny et de bons IV.",
      "Tu en trouves en combat, en battant des boss, ou tu en achetes avec des jetons d'elevage.",
      "Ameliore ton Centre d'Elevage pour eclore plus vite et avoir de meilleurs bonus.",
    ],
    astuce: "Garde toujours un oeuf en incubation : ca avance pendant que tu joues normalement.", astuceItem: 'rare-candy',
  },
  {
    cle: 'arene', titre: 'Mode Arene', sprite: 68, teinte: '#e25a30',
    paragraphes: [
      "L'Arene : affronte 75 dresseurs, du plus faible au plus fort, avec une equipe dediee.",
      "Une victoire par dresseur (pas de farm). Tous les 5 dresseurs, un BOSS emblematique.",
      "Battre les boss debloque les Pokemon Speciaux (formes rares) !",
      "Pendant l'Arene, le combat principal est en pause.",
    ],
    astuce: "Compose une equipe d'arene valide (1T/1E/2S/2D) avant de te lancer.", astuceItem: 'gold-bottle-cap',
  },
  {
    cle: 'tour', titre: 'Tour Infinie & Cartes', sprite: 643, teinte: '#7f77dd',
    paragraphes: [
      "La Tour Infinie : monte les etages, chaque combat est plus dur que le precedent.",
      "Tu gagnes des CARTES a collectionner (certaines tres rares !) et de l'ADN de Fusion.",
      "Completer des series de cartes donne des bonus d'XP permanents.",
      "Si tu perds, tu recommences en bas mais tu gardes tes cartes.",
    ],
    astuce: "Les mini-boss et boss de la Tour donnent les meilleures cartes.", astuceItem: 'rare-candy',
  },
  {
    cle: 'pvp', titre: 'Arene PvP (en ligne)', sprite: 445, teinte: '#9fd0ff',
    paragraphes: [
      "Le PvP t'oppose a de vrais joueurs : tu poses une equipe de defense, et tu attaques celles des autres.",
      "Tu gagnes ou perds des points (ELO) et grimpes les rangs : Bronze a Maitre.",
      "Tous les Pokemon sont calibres au niveau 50 : c'est la strategie qui compte, pas le farm.",
      "Defense et attaque doivent respecter la compo 1T/1E/2S/2D.",
    ],
    astuce: "Pense aux types et aux objets : en PvP, les details font la difference.", astuceItem: 'expert-belt',
  },
  {
    cle: 'prestige', titre: 'Prestige & Fusion', sprite: 658, teinte: '#7f77dd',
    paragraphes: [
      "Le Prestige te fait recommencer en echange de Medailles, quand tes Pokemon plafonnent.",
      "Tu repars a zero (niveaux, zones, argent) mais GARDES Pokedex, shinies et medailles.",
      "Les medailles s'investissent en bonus permanents. La Puissance debloque aussi plus de niveaux max.",
      "Apres 3 prestiges, le Centre de Fusion s'ouvre : combine 2 Pokemon en une fusion unique !",
    ],
    astuce: "Prestige des que la progression ralentit : tu repars bien plus fort.", astuceItem: 'ability-urge',
  },
]

// =====================================================================
function Tutoriel({ mode, onLancerVisite, onOuvrirGuide, onFermer, onTerminerVisite }) {
  if (mode === 'bienvenue') {
    return (
      <div className="overlay tuto-overlay">
        <div className="tuto-bienvenue" onClick={(e) => e.stopPropagation()}>
          <div className="tuto-bienvenue-bandeau">
            <img className="tuto-starter tuto-flotte" src={SPRITE(1)} alt="Bulbizarre" />
            <img className="tuto-starter tuto-starter-centre tuto-flotte" src={SPRITE(4)} alt="Salameche" />
            <img className="tuto-starter tuto-flotte" src={SPRITE(7)} alt="Carapuce" />
          </div>
          <div className="tuto-bienvenue-corps">
            <div className="tuto-bienvenue-titre">Bienvenue, Dresseur !</div>
            <div className="tuto-bienvenue-sous">Ton aventure Pokedle commence</div>
            <p className="tuto-bienvenue-intro">
              Ton equipe combat <strong>toute seule</strong>. Capture, fais evoluer, complete le Pokedex a travers 100 zones !
            </p>
            <div className="tuto-bienvenue-grille">
              <div className="tuto-feature"><img className="tuto-feature-img" src={ITEM('poke-ball')} alt="" /><div><div className="tuto-feature-titre">Capture</div><div className="tuto-feature-txt">Attrape-les tous</div></div></div>
              <div className="tuto-feature"><img className="tuto-feature-img" src={SPRITE(25)} alt="" /><div><div className="tuto-feature-titre">Equipe</div><div className="tuto-feature-txt">Roles & strategie</div></div></div>
              <div className="tuto-feature"><img className="tuto-feature-img" src={SPRITE(150)} alt="" /><div><div className="tuto-feature-titre">Boss & Arene</div><div className="tuto-feature-txt">Dresseurs legendaires</div></div></div>
              <div className="tuto-feature"><img className="tuto-feature-img" src={SPRITE(448)} alt="" /><div><div className="tuto-feature-titre">PvP</div><div className="tuto-feature-txt">Affronte des joueurs</div></div></div>
            </div>
            <div className="tuto-bienvenue-boutons">
              <button className="tuto-bouton-or" onClick={onLancerVisite}>Commencer la visite guidee →</button>
              <button className="tuto-bouton-secondaire" onClick={onOuvrirGuide}>Voir le guide complet</button>
            </div>
            <div className="tuto-bienvenue-pied">Tu pourras rouvrir tout ca via le bouton Aide du menu.</div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'visite') return <VisiteGuidee onTerminer={onTerminerVisite} />
  if (mode === 'guide') return <GuideOnglets onFermer={onFermer} />
  return null
}

// ---------------- VISITE GUIDEE : spotlight reel + fleche ----------------
function VisiteGuidee({ onTerminer }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null)
  const etape = ETAPES_VISITE[index]
  const dernier = index === ETAPES_VISITE.length - 1

  const mesurer = useCallback(() => {
    if (!etape.cible) { setRect(null); return }
    const el = document.querySelector(`[data-tuto="${etape.cible}"]`)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) { setRect(null); return }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [etape])

  useEffect(() => {
    if (etape.cible) {
      const el = document.querySelector(`[data-tuto="${etape.cible}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const t = setTimeout(mesurer, 350)
    const t2 = setTimeout(mesurer, 700)
    window.addEventListener('resize', mesurer)
    window.addEventListener('scroll', mesurer, true)
    return () => {
      clearTimeout(t); clearTimeout(t2)
      window.removeEventListener('resize', mesurer)
      window.removeEventListener('scroll', mesurer, true)
    }
  }, [mesurer, etape])

  // Padding autour de l'element surligne.
  const PAD = 10
  const trou = rect ? {
    top: Math.max(0, rect.top - PAD),
    left: Math.max(0, rect.left - PAD),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  } : null

  // La fleche : placee SOUS l'element si il est en haut de l'ecran, AU-DESSUS sinon.
  let fleche = null
  if (trou) {
    const milieuX = trou.left + trou.width / 2
    const placeEnDessous = trou.top < window.innerHeight * 0.45
    fleche = {
      left: milieuX,
      top: placeEnDessous ? (trou.top + trou.height + 6) : (trou.top - 6),
      sens: placeEnDessous ? 'bas' : 'haut', // pointe vers l'element
    }
  }

  return (
    <div className="tuto-visite-couche">
      {/* Voile sombre TROUE sur l'element (spotlight via 4 panneaux) */}
      {trou ? (
        <>
          <div className="tuto-spot-panneau" style={{ top: 0, left: 0, width: '100%', height: trou.top }} />
          <div className="tuto-spot-panneau" style={{ top: trou.top + trou.height, left: 0, width: '100%', bottom: 0 }} />
          <div className="tuto-spot-panneau" style={{ top: trou.top, left: 0, width: trou.left, height: trou.height }} />
          <div className="tuto-spot-panneau" style={{ top: trou.top, left: trou.left + trou.width, right: 0, height: trou.height }} />
          {/* Cadre lumineux autour du trou */}
          <div className="tuto-spot-cadre" style={{ top: trou.top, left: trou.left, width: trou.width, height: trou.height }} />
        </>
      ) : (
        <div className="tuto-voile" />
      )}

      {/* Fleche animee qui pointe vers l'element */}
      {fleche && (
        <div
          className={`tuto-fleche tuto-fleche-${fleche.sens}`}
          style={{ left: fleche.left, top: fleche.top }}
        >
          {fleche.sens === 'bas' ? '▲' : '▼'}
        </div>
      )}

      {/* Bulle d'explication ancree en bas, avec mascotte */}
      <div className="tuto-bulle tuto-bulle-bas">
        <img className="tuto-mascotte tuto-flotte" src={MASCOTTE} alt="Guide" />
        <div className="tuto-bulle-contenu">
          <div className="tuto-bulle-etape">Etape {index + 1} / {ETAPES_VISITE.length}</div>
          <div className="tuto-bulle-titre">{etape.titre}</div>
          <p className="tuto-bulle-texte">{etape.texte}</p>
          <div className="tuto-bulle-boutons">
            {index > 0 && (
              <button className="tuto-bouton-secondaire" onClick={() => setIndex((i) => i - 1)}>← Precedent</button>
            )}
            <button className="tuto-bouton-passer" onClick={onTerminer}>Passer</button>
            <button className="tuto-bouton-or" onClick={() => dernier ? onTerminer() : setIndex((i) => i + 1)}>
              {dernier ? "C'est parti !" : 'Suivant →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- GUIDE A ONGLETS ----------------
function GuideOnglets({ onFermer }) {
  const [ongletActif, setOngletActif] = useState('demarrage')
  const onglet = ONGLETS_GUIDE.find((o) => o.cle === ongletActif)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="tuto-guide" onClick={(e) => e.stopPropagation()}>
        <div className="tuto-guide-entete">
          <h2>📖 Guide du Dresseur</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>
        <div className="tuto-guide-onglets">
          {ONGLETS_GUIDE.map((o) => (
            <button key={o.cle} className={`tuto-guide-onglet ${ongletActif === o.cle ? 'actif' : ''}`} onClick={() => setOngletActif(o.cle)}>
              {o.titre}
            </button>
          ))}
        </div>
        <div className="tuto-guide-page">
          <div className="tuto-guide-page-entete" style={{ background: `linear-gradient(90deg, ${onglet.teinte}33, transparent)` }}>
            <img className="tuto-guide-page-sprite tuto-flotte" src={SPRITE(onglet.sprite)} alt="" />
            <h3 className="tuto-guide-page-titre" style={{ color: onglet.teinte }}>{onglet.titre}</h3>
          </div>
          <div className="tuto-guide-page-corps">
            {onglet.paragraphes.map((p, i) => (<p key={i} className="tuto-guide-para">{p}</p>))}
            {onglet.astuce && (
              <div className="tuto-guide-astuce">
                <img className="tuto-guide-astuce-item" src={ITEM(onglet.astuceItem || 'rare-candy')} alt=""
                  onError={(e) => { e.currentTarget.style.display = 'none' }} />
                <span><strong>Astuce :</strong> {onglet.astuce}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Tutoriel