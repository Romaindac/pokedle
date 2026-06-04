import { useState, useEffect, useRef, useCallback } from 'react'

// =====================================================================
// Tutoriel.jsx — Système de tuto complet de Pokédle (version illustrée).
// 3 modes, pilotés par la prop `mode` :
//   - 'bienvenue'  : pop-up d'accueil illustré (sprites starters).
//   - 'visite'     : visite guidée à surlignage réel + mascotte Pikachu.
//   - 'guide'      : encyclopédie à onglets, chaque page illustrée d'un sprite.
// =====================================================================

// Sprites Pokémon officiels PokeAPI (par numéro national).
const SPRITE = (num) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${num}.png`
// Sprites d'items PokeAPI.
const ITEM = (nom) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${nom}.png`
// Mascotte qui guide la visite.
const MASCOTTE = SPRITE(25) // Pikachu

// ---------- Étapes de la VISITE GUIDÉE (surlignage réel) ----------
const ETAPES_VISITE = [
  {
    cible: 'arene',
    titre: 'Le terrain de combat',
    texte: "Ici, ton équipe affronte les Pokémon sauvages toute seule, en boucle. Tu n'as rien à cliquer : regarde les barres de vie descendre ! À chaque victoire tu gagnes de l'XP (pour monter de niveau) et de l'argent.",
  },
  {
    cible: 'arene',
    titre: 'Apparitions & loot des zones',
    texte: "Les Pokémon qui apparaissent dépendent de la zone et de leur rareté (commun, rare, très rare, légendaire). Plus c'est rare, moins ça apparaît souvent. En battant des ennemis, tu as aussi une petite chance (~0,3%) de looter un objet équipable rare — il atterrit direct dans ton sac !",
  },
  {
    cible: 'capture',
    titre: 'Tes règles de capture',
    texte: "C'est toi qui décides quoi attraper. Clique sur « Règles de capture » pour choisir, par catégorie (shiny, légendaire, nouveau, doublon), quelle ball utiliser — ou de ne pas capturer. Pratique pour ne pas gaspiller tes belles balls !",
  },
  {
    cible: 'capture',
    titre: 'Tes balls en stock',
    texte: "En bas de ce panneau, tu vois ton stock de chaque ball. Si la ball d'une règle est épuisée, le jeu prend automatiquement la meilleure dispo : tu ne rates jamais une capture faute de la bonne ball.",
  },
  {
    cible: 'achat',
    titre: 'Tes Poké Balls',
    texte: "Pas de balls = pas de captures. Ici tu en achètes rapidement (+1, +10, +100). Les meilleures balls attrapent les Pokémon rares plus facilement.",
  },
  {
    cible: 'equipe',
    titre: "Gère ton équipe",
    texte: "Ouvre ton équipe pour choisir tes 6 combattants, voir leurs stats et leurs rôles, les faire évoluer (par niveau ou par pierre) et leur équiper des objets. La compo idéale : 1 Tank, 1 Éclaireur, 2 Soutien, 2 DPS.",
  },
  {
    cible: 'routes',
    titre: 'Change de zone',
    texte: "Les Routes te montrent toutes les zones débloquées. Chaque zone a ses propres Pokémon et un niveau plus élevé. Avance quand tu te sens prêt !",
  },
  {
    cible: 'routes',
    titre: 'Boss & déblocage',
    texte: "Au bout de 25 victoires dans une zone, son boss légendaire apparaît (timer de 45 s pour le battre !). Le vaincre débloque la zone suivante. Si tu es trop lent ou battu, le compteur de victoires repart à zéro.",
  },
  {
    cible: 'boutique',
    titre: 'La Boutique',
    texte: "Dépense ton argent ici : balls, pierres d'évolution et objets équipables (de stats). Les prix montent un peu à chaque achat. Les bonbons, eux, ne s'achètent pas : ils se gagnent sur les boss.",
  },
  {
    cible: 'sac',
    titre: 'Ton Sac',
    texte: "Tout ce que tu possèdes est rangé ici en onglets (balls, pierres, objets). Tu peux y voir quels Pokémon une pierre fait évoluer, et utiliser tes bonbons d'XP.",
  },
  {
    cible: 'stats',
    titre: 'Tes statistiques',
    texte: "Un récapitulatif de ta progression : Pokémon capturés, shinies, boss vaincus, dresseurs battus, zones franchies… Pratique pour suivre ton avancée.",
  },
  {
    cible: 'succes',
    titre: 'Les Succès',
    texte: "Des objectifs à accomplir (capturer X Pokémon, battre des boss…). Chaque succès rapporte des récompenses : argent, balls, pierres, ou même des bonus permanents d'XP/argent.",
  },
  {
    cible: 'boost',
    titre: 'Les Améliorations (Boost)',
    texte: "Achète des bonus permanents avec ton argent : plus d'XP, plus d'argent, captures plus faciles, combats plus rapides… Un bon moyen d'accélérer ta progression sur le long terme.",
  },
  {
    cible: 'arene-mode',
    titre: 'Le Mode Arène',
    texte: "Un mode à part : affronte 75 dresseurs, du plus faible au plus fort, avec une équipe d'arène dédiée. Tous les 5 dresseurs, un BOSS emblématique. Les battre débloque les Pokémon Spéciaux (méga-évolutions et formes rares) !",
  },
  {
    cible: 'pvp',
    titre: "Défie d'autres joueurs (PvP)",
    texte: "Mesure-toi à de vrais joueurs : pose une équipe de défense, attaque celles des autres et grimpe les rangs (Bronze → Maître). En PvP, tous les Pokémon sont calibrés au niveau 50 max : c'est la stratégie qui compte, pas le farm !",
  },
  {
    cible: 'classement',
    titre: 'Le Classement en ligne',
    texte: "Compare-toi aux autres joueurs : Pokémon capturés, shinies, zones franchies, et points PvP. Choisis un pseudo et grimpe le classement !",
  },
  {
    cible: null,
    titre: "À toi de jouer !",
    texte: "C'est parti. Laisse ton équipe combattre dans le Sentier des Débutants, capture tes premiers Pokémon, et explore les menus à ton rythme. Tu peux rouvrir ce tuto quand tu veux via le bouton « Aide ». Bonne aventure, Dresseur !",
  },
]

// ---------- Pages du GUIDE à onglets ----------
// `sprite` = numéro Pokémon illustrant la page. `teinte` = couleur d'accent de l'en-tête.
const ONGLETS_GUIDE = [
  {
    cle: 'demarrage',
    titre: 'Démarrage',
    sprite: 25, teinte: '#f6c544',
    paragraphes: [
      "Bienvenue dans Pokédle, un jeu idle : ton équipe combat automatiquement, même quand tu ne fais rien.",
      "Au début, tu choisis 3 starters parmi les 27 (toutes générations). Ils forment ton équipe de départ.",
      "Ton but : capturer un max de Pokémon, les faire évoluer, compléter le Pokédex (1025 !) et progresser à travers les 100 zones.",
      "À chaque combat gagné : de l'XP (pour monter de niveau) et de l'argent (pour acheter des balls et des objets).",
    ],
    astuce: "Laisse tourner ! Reviens régler ta capture et ton équipe de temps en temps.",
    astuceItem: 'rare-candy',
  },
  {
    cle: 'combat',
    titre: 'Combat & Zones',
    sprite: 6, teinte: '#e25a30',
    paragraphes: [
      "Le combat est automatique. Chaque Pokémon a une jauge (ATB) qui se remplit selon sa vitesse : quand elle est pleine, il attaque.",
      "Les dégâts dépendent de l'attaque, de la défense de la cible, et des types (un type fort fait plus de dégâts).",
      "Tu peux accélérer le combat (×1 / ×2 / ×4 / ×8) pour farmer plus vite.",
      "Chaque zone a un niveau. Après 25 victoires dans une zone, son boss légendaire apparaît — avec un timer de 45 secondes pour le battre !",
    ],
    astuce: "Si une zone devient trop dure, monte tes Pokémon de niveau dans une zone plus facile.",
    astuceItem: 'rare-candy',
  },
  {
    cle: 'capture',
    titre: 'Capture',
    sprite: 16, teinte: '#9fd0ff',
    paragraphes: [
      "Pendant les combats, tu peux capturer les Pokémon sauvages avec des balls.",
      "Le panneau « Règles de capture » te laisse définir, par catégorie (Shiny, Légendaire, Nouveau, Doublon), quelle ball utiliser — ou de ne rien capturer.",
      "Priorité des règles : shiny > légendaire > nouveau > doublon. Et si la ball choisie est épuisée, le jeu prend la meilleure disponible (tu ne rates jamais une capture par manque de la bonne ball).",
      "Plus un Pokémon est rare, plus il est dur à attraper : les meilleures balls (Super, Hyper, Master) augmentent tes chances.",
    ],
    astuce: "Les doublons ne sont pas perdus : ils améliorent les IV (la qualité) du Pokémon que tu possèdes déjà.",
    astuceItem: 'ultra-ball',
  },
  {
    cle: 'equipe',
    titre: 'Équipe & Rôles',
    sprite: 448, teinte: '#5dcaa5',
    paragraphes: [
      "Ton équipe compte 6 Pokémon. Chacun a un rôle automatique selon son style : Tank, DPS, Éclaireur ou Soutien.",
      "Tank : encaisse et attire les coups. DPS : gros dégâts. Éclaireur : rapide, attaque souvent. Soutien : soigne l'équipe.",
      "La composition imposée pour combattre (Arène, PvP) : 1 Tank, 1 Éclaireur, 2 Soutien, 2 DPS. Un bon équilibre !",
      "Dans la fiche d'un Pokémon : ses 4 stats (PV, Attaque, Vitesse, Défense), son rôle, son XP, et les boutons d'évolution par pierre.",
    ],
    astuce: "Le bouton « auto-équipe » sélectionne automatiquement tes 6 meilleurs, en respectant la compo.",
    astuceItem: 'ability-capsule',
  },
  {
    cle: 'pokedex',
    titre: 'Pokédex & Récompenses',
    sprite: 151, teinte: '#f48fb1',
    paragraphes: [
      "Le Pokédex recense les 1025 Pokémon (générations 1 à 9). Tu peux le voir en mode Normal, Shiny, ou Spéciaux.",
      "Il affiche ta progression par génération, avec des filtres (Tous / Obtenus / Non obtenus).",
      "L'onglet Récompenses te donne des cadeaux quand tu atteins des paliers de complétion (balls, pierres, argent, et même des bonus permanents d'XP et d'argent).",
      "Les Pokémon Spéciaux (méga-évolutions, formes) se débloquent en battant les 15 boss de l'Arène.",
    ],
    astuce: "Une pastille rouge sur le bouton Pokédex = des récompenses à réclamer t'attendent !",
    astuceItem: 'shiny-charm',
  },
  {
    cle: 'boutique',
    titre: 'Boutique & Sac',
    sprite: 101, teinte: '#f6c544',
    paragraphes: [
      "La Boutique : achète des balls, des pierres d'évolution et des objets équipables (de stats). Achat en lot possible.",
      "Les prix augmentent un peu à chaque achat — c'est normal.",
      "Le Sac : tout ce que tu possèdes, rangé en onglets (balls, pierres, objets). Tu y vois aussi quels Pokémon une pierre peut faire évoluer.",
      "Les bonbons (XP) ne s'achètent pas : ils se gagnent en battant les boss.",
    ],
    astuce: "Garde des Master Balls pour les légendaires ou les shiny que tu ne veux surtout pas rater.",
    astuceItem: 'master-ball',
  },
  {
    cle: 'objets',
    titre: 'Objets équipables',
    sprite: 213, teinte: '#5dcaa5',
    paragraphes: [
      "Chaque Pokémon peut équiper 1 objet, qui booste ses stats ou donne un effet spécial.",
      "Objets de stats : +attaque, +PV, +vitesse, +défense, ou +tout un peu.",
      "Objets spéciaux : +chance de shiny, +XP gagnée, +argent gagné.",
      "On les obtient en boutique, en récompense d'arène, ou en drop rare pendant les combats.",
    ],
    astuce: "Mets un objet +XP sur un Pokémon que tu veux faire monter vite, ou +shiny pour la chasse.",
    astuceItem: 'leftovers',
  },
  {
    cle: 'arene',
    titre: 'Mode Arène',
    sprite: 68, teinte: '#e25a30',
    paragraphes: [
      "L'Arène est un mode à part : tu affrontes 75 dresseurs thématiques, du plus faible au plus fort.",
      "Tu composes une équipe d'arène dédiée (1T/1E/2S/2D) et tu défies les dresseurs un par un. Une victoire par dresseur (pas de farm).",
      "Tous les 5 dresseurs, un BOSS emblématique t'attend (avec un timer de 45 s).",
      "Battre les 15 boss débloque les Pokémon Spéciaux (méga-évolutions et formes rares) !",
    ],
    astuce: "Pendant l'Arène, le combat principal est en pause. Tu reprends où tu en étais en sortant.",
    astuceItem: 'gold-bottle-cap',
  },
  {
    cle: 'pvp',
    titre: 'Arène PvP (en ligne)',
    sprite: 445, teinte: '#9fd0ff',
    paragraphes: [
      "Le PvP t'oppose à de vrais joueurs ! Tu poses une équipe de défense (enregistrée en ligne), et les autres peuvent l'attaquer — et inversement.",
      "Tu gagnes ou perds des points selon tes combats (système ELO), et tu grimpes les rangs : Bronze, Argent, Or, Platine, Diamant, Maître.",
      "Important : en PvP, tous les Pokémon de niveau supérieur à 50 sont calibrés au niveau 50 le temps du combat. Ils gardent leur vrai niveau partout ailleurs.",
      "Du coup, en haut du classement, c'est la stratégie qui fait la différence : compo, types et objets, pas le farm.",
    ],
    astuce: "Défense et attaque doivent respecter la compo 1T/1E/2S/2D, avec 6 Pokémon.",
    astuceItem: 'expert-belt',
  },
  {
    cle: 'prestige',
    titre: 'Prestige & Boosts',
    sprite: 658, teinte: '#7f77dd',
    paragraphes: [
      "Le Prestige (Rang de Dresseur) te permet de recommencer ta progression en échange de médailles.",
      "Tu repars à zéro côté niveaux/zones/argent, mais tu GARDES ton Pokédex, tes médailles et tes bonus.",
      "Les médailles s'investissent en bonus permanents : +XP, +argent, ou +chance de shiny.",
      "Les Améliorations (Boost) offrent aussi des bonus permanents achetables avec ton argent.",
    ],
    astuce: "Le prestige est optionnel : prestige quand la progression ralentit pour repartir plus fort.",
    astuceItem: 'ability-urge',
  },
]

// =====================================================================
function Tutoriel({ mode, onLancerVisite, onOuvrirGuide, onFermer, onTerminerVisite }) {
  // ---------------- MODE BIENVENUE ----------------
  if (mode === 'bienvenue') {
    return (
      <div className="overlay tuto-overlay">
        <div className="tuto-bienvenue" onClick={(e) => e.stopPropagation()}>
          {/* Bandeau de sprites starters */}
          <div className="tuto-bienvenue-bandeau">
            <img className="tuto-starter tuto-flotte" src={SPRITE(1)} alt="Bulbizarre" />
            <img className="tuto-starter tuto-starter-centre tuto-flotte" src={SPRITE(4)} alt="Salamèche" />
            <img className="tuto-starter tuto-flotte" src={SPRITE(7)} alt="Carapuce" />
          </div>

          <div className="tuto-bienvenue-corps">
            <div className="tuto-bienvenue-titre">Bienvenue, Dresseur !</div>
            <div className="tuto-bienvenue-sous">Ton aventure Pokédle commence</div>
            <p className="tuto-bienvenue-intro">
              Ton équipe combat <strong>toute seule</strong>. Capture, fais évoluer, complète le Pokédex à travers 100 zones !
            </p>

            <div className="tuto-bienvenue-grille">
              <div className="tuto-feature">
                <img className="tuto-feature-img" src={ITEM('poke-ball')} alt="" />
                <div><div className="tuto-feature-titre">Capture</div><div className="tuto-feature-txt">Attrape-les tous</div></div>
              </div>
              <div className="tuto-feature">
                <img className="tuto-feature-img" src={SPRITE(25)} alt="" />
                <div><div className="tuto-feature-titre">Équipe</div><div className="tuto-feature-txt">Rôles & stratégie</div></div>
              </div>
              <div className="tuto-feature">
                <img className="tuto-feature-img" src={SPRITE(150)} alt="" />
                <div><div className="tuto-feature-titre">Boss & Arène</div><div className="tuto-feature-txt">Dresseurs légendaires</div></div>
              </div>
              <div className="tuto-feature">
                <img className="tuto-feature-img" src={SPRITE(448)} alt="" />
                <div><div className="tuto-feature-titre">PvP</div><div className="tuto-feature-txt">Affronte des joueurs</div></div>
              </div>
            </div>

            <div className="tuto-bienvenue-boutons">
              <button className="tuto-bouton-or" onClick={onLancerVisite}>Commencer la visite guidée →</button>
              <button className="tuto-bouton-secondaire" onClick={onOuvrirGuide}>Voir le guide complet</button>
            </div>
            <div className="tuto-bienvenue-pied">Tu pourras rouvrir tout ça via le bouton « Aide » du menu.</div>
          </div>
        </div>
      </div>
    )
  }

  // ---------------- MODE VISITE GUIDÉE ----------------
  if (mode === 'visite') {
    return <VisiteGuidee onTerminer={onTerminerVisite} />
  }

  // ---------------- MODE GUIDE À ONGLETS ----------------
  if (mode === 'guide') {
    return <GuideOnglets onFermer={onFermer} />
  }

  return null
}

// ---------------- Composant interne : VISITE GUIDÉE ----------------
function VisiteGuidee({ onTerminer }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null) // position de l'élément ciblé
  const etape = ETAPES_VISITE[index]
  const dernier = index === ETAPES_VISITE.length - 1

  // Mesure la position de l'élément cible (par data-tuto). Recalcule au resize/scroll.
  const mesurer = useCallback(() => {
    if (!etape.cible) { setRect(null); return }
    const el = document.querySelector(`[data-tuto="${etape.cible}"]`)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [etape])

  useEffect(() => {
    // On amène d'abord l'élément ciblé bien au centre de l'écran, PUIS on mesure.
    if (etape.cible) {
      const el = document.querySelector(`[data-tuto="${etape.cible}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const t = setTimeout(mesurer, 350)
    const t2 = setTimeout(mesurer, 700)
    window.addEventListener('resize', mesurer)
    window.addEventListener('scroll', mesurer, true)
    return () => {
      clearTimeout(t)
      clearTimeout(t2)
      window.removeEventListener('resize', mesurer)
      window.removeEventListener('scroll', mesurer, true)
    }
  }, [mesurer, etape])

  return (
    <div className="tuto-visite-couche">
      {/* Voile sombre derrière */}
      <div className="tuto-voile" />

      {/* Halo qui entoure l'élément ciblé */}
      {rect && (
        <div
          className="tuto-halo"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      )}

      {/* Bulle d'explication : ANCRÉE EN BAS, avec mascotte. */}
      <div className="tuto-bulle tuto-bulle-bas">
        <img className="tuto-mascotte tuto-flotte" src={MASCOTTE} alt="Guide" />
        <div className="tuto-bulle-contenu">
          <div className="tuto-bulle-etape">Étape {index + 1} / {ETAPES_VISITE.length}</div>
          <div className="tuto-bulle-titre">{etape.titre}</div>
          <p className="tuto-bulle-texte">{etape.texte}</p>
          <div className="tuto-bulle-boutons">
            {index > 0 && (
              <button className="tuto-bouton-secondaire" onClick={() => setIndex((i) => i - 1)}>← Précédent</button>
            )}
            <button className="tuto-bouton-or" onClick={() => dernier ? onTerminer() : setIndex((i) => i + 1)}>
              {dernier ? "C'est parti !" : 'Suivant →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------- Composant interne : GUIDE À ONGLETS ----------------
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
            <button
              key={o.cle}
              className={`tuto-guide-onglet ${ongletActif === o.cle ? 'actif' : ''}`}
              onClick={() => setOngletActif(o.cle)}
            >
              {o.titre}
            </button>
          ))}
        </div>

        <div className="tuto-guide-page">
          {/* En-tête illustré avec sprite + teinte */}
          <div
            className="tuto-guide-page-entete"
            style={{ background: `linear-gradient(90deg, ${onglet.teinte}33, transparent)` }}
          >
            <img className="tuto-guide-page-sprite tuto-flotte" src={SPRITE(onglet.sprite)} alt="" />
            <h3 className="tuto-guide-page-titre" style={{ color: onglet.teinte }}>{onglet.titre}</h3>
          </div>

          <div className="tuto-guide-page-corps">
            {onglet.paragraphes.map((p, i) => (
              <p key={i} className="tuto-guide-para">{p}</p>
            ))}
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