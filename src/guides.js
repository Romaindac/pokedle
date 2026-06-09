// ============================================================
// guides.js — Scenarios de tutos GUIDES INTERACTIFS.
// Chaque guide = une suite d'etapes. Une etape surligne un element
// (recible par data-guide) et attend une action (clic) avant de continuer.
// Memorise "vu" dans localStorage (cle dediee, distincte des bulles).
//
// Types d'etape :
//  - cible: selecteur data-guide a surligner (null = bulle centree sans trou)
//  - action: 'clic' (attend un clic sur la cible) | 'info' (juste Suivant)
//  - titre / texte : contenu de la bulle
//  - placement: 'auto' | 'haut' | 'bas' (ou poser la bulle vs la cible)
// ============================================================

const CLE_STORAGE = 'pokedle-guides-vus'

export const GUIDES = {
  equipe: [
    {
      cible: null, action: 'info',
      titre: 'Bienvenue dans ton Equipe',
      texte: "Ton equipe, c'est 6 Pokemon qui combattent tout seuls. Je vais te montrer l'essentiel en quelques etapes. Tu peux passer a tout moment.",
    },
    {
      cible: '.eqm-compo', action: 'info', placement: 'bas',
      titre: 'La composition',
      texte: "Une bonne equipe respecte une regle : 1 a 2 Pokemon par role, et les 4 roles presents (Tank, Eclaireur, Soutien, DPS). Quand c'est vert, ton equipe est prete au combat. 1 seul Pokemon special autorise.",
    },
    {
      cible: '.eqm-syn', action: 'info', placement: 'bas',
      titre: 'Les synergies',
      texte: "Selon les roles de ton equipe, des BONUS automatiques s'activent (vitesse, degats...). Tu n'as rien a faire : la bonne compo declenche les synergies toute seule. Le bouton ? explique chacune.",
    },
    {
      cible: '.eqm-auto', action: 'clic', placement: 'bas',
      titre: 'Compo automatique',
      texte: "Pas envie de chercher ? Clique ici : le jeu compose pour toi une equipe valide avec tes meilleurs combattants. Essaie maintenant !",
    },
    {
      cible: '.eqm-grille-equipe .eqm-carte-corps', action: 'clic', placement: 'auto',
      titre: 'Voir un Pokemon',
      texte: "Clique sur un membre de ton equipe pour ouvrir sa fiche detaillee (stats, role, passifs, objet, evolution).",
    },
    {
      cible: null, action: 'info',
      titre: 'Tu sais tout !',
      texte: "Dans la fiche, tu peux equiper un objet, choisir les passifs, changer le role avec un parchemin et faire evoluer par pierre. A toi de batir l'equipe parfaite. Bonne chance, Dresseur !",
    },
  ],

  arene: [
    {
      cible: null, action: 'info',
      titre: "Bienvenue dans l'Arene",
      texte: "Ici tu affrontes des dresseurs, du plus faible au plus fort, avec une equipe DEDIEE a l'arene (separee de ton equipe principale). Suis le guide !",
    },
    {
      cible: '.arn-auto-equipe', action: 'clic', placement: 'bas',
      titre: 'Compose vite ton equipe',
      texte: "Clique sur Equipe auto : le jeu te propose une equipe d'arene valide avec tes meilleurs Pokemon. Essaie !",
    },
    {
      cible: '.arn-compo', action: 'info', placement: 'bas',
      titre: 'Verifie la compo',
      texte: "Ton equipe d'arene doit respecter la regle : 1 a 2 par role, les 4 roles presents, 1 special max. Quand c'est vert, tu peux combattre.",
    },
    {
      cible: '.arn-collection-toggle', action: 'clic', placement: 'auto',
      titre: 'Ta collection',
      texte: "Tu peux aussi choisir tes Pokemon a la main. Clique ici pour ouvrir ta collection et ajouter/retirer des membres.",
    },
    {
      cible: '.arn-dresseurs', action: 'info', placement: 'haut',
      titre: 'Defie les dresseurs',
      texte: "Voici les dresseurs. Bats-les dans l'ordre : chaque victoire debloque le suivant. Battre un BOSS d'arene t'offre un Pokemon SPECIAL ! Ils redeviennent dispo toutes les 3h.",
    },
    {
      cible: null, action: 'info',
      titre: "Prêt pour l'Arene !",
      texte: "Tu peux activer l'Auto-dresseur pour enchainer les combats automatiquement. A toi de devenir Maitre de l'Arene !",
    },
  ],

  raids: [
    {
      cible: null, action: 'info',
      titre: 'Bienvenue dans les Raids',
      texte: "Les Raids sont le defi ULTIME : plusieurs vagues d'affilee, et tes PV ne se soignent qu'en partie entre chaque. Au bout : un gros boss capturable !",
    },
    {
      cible: '.arn-compo', action: 'info', placement: 'bas',
      titre: 'Compo STRICTE',
      texte: "Pour les raids, la compo est imposee : exactement 1 Tank, 1 Eclaireur, 2 Soutien et 2 DPS. Pas d'a-peu-pres ici !",
    },
    {
      cible: '.arn-collection-toggle', action: 'clic', placement: 'auto',
      titre: 'Choisis ton equipe de raid',
      texte: "Clique pour ouvrir ta collection et composer ton equipe. Prends tes Pokemon les plus solides : ca va cogner.",
    },
    {
      cible: '.arn-dresseurs', action: 'info', placement: 'haut',
      titre: 'Lance un raid',
      texte: "Chaque raid se debloque en avancant dans l'aventure. 1re victoire = tu peux capturer le boss. Ensuite = des bonbons IV. Chaque raid a un temps de recharge.",
    },
    {
      cible: null, action: 'info',
      titre: 'Bonne chasse !',
      texte: "Prepare bien ton equipe avant de te lancer : les raids ne pardonnent pas. Mais les recompenses en valent la peine !",
    },
  ],

  oeufs: [
    {
      cible: null, action: 'info',
      titre: "Bienvenue au Centre d'Elevage",
      texte: "Ici tu fais eclore des oeufs pour obtenir de nouveaux Pokemon, souvent avec de meilleurs IV et plus de chances de shiny. Suis le guide !",
    },
    {
      cible: '.oeufs-onglets', action: 'info', placement: 'bas',
      titre: 'Deux onglets',
      texte: "Incubateurs : pour faire eclore tes oeufs. Ameliorations : pour booster l'elevage (plus d'incubateurs, eclosion plus rapide, plus de chances de shiny...).",
    },
    {
      cible: '.oeuf-reserve-item', action: 'clic', placement: 'auto',
      titre: 'Place un oeuf',
      texte: "Clique sur un oeuf de ta reserve pour le mettre dans un incubateur libre. (Si tu n'en as pas encore, gagne-en en combattant ou achete-en plus bas.)",
    },
    {
      cible: '.incub', action: 'info', placement: 'auto',
      titre: 'Incubation par le combat',
      texte: "Un oeuf en incubation progresse a CHAQUE victoire en combat. Quand la barre est pleine, un bouton 'Faire eclore' apparait. Continue de jouer, ca avance tout seul !",
    },
    {
      cible: '.oeufs-boutique', action: 'info', placement: 'auto',
      titre: 'Acheter des oeufs',
      texte: "Avec tes jetons d'elevage (gagnes en combat et sur les boss), tu peux acheter des oeufs ici, dont des speciaux (Chromatique, Parfait, Mystere) introuvables ailleurs.",
    },
    {
      cible: null, action: 'info',
      titre: "C'est parti !",
      texte: "Place tes oeufs, combats pour les faire eclore, et investis tes jetons dans les ameliorations. Bon elevage !",
    },
  ],
}

// ---- API memorisation (cle distincte des bulles TUTOS) ----
export function guidesVus() {
  try { const b = localStorage.getItem(CLE_STORAGE); return b ? JSON.parse(b) : [] } catch { return [] }
}
export function guideEstVu(id) { return guidesVus().includes(id) }
export function marquerGuideVu(id) {
  try { const v = guidesVus(); if (!v.includes(id)) { v.push(id); localStorage.setItem(CLE_STORAGE, JSON.stringify(v)) } } catch {}
}
export function reinitialiserGuides() {
  try { localStorage.removeItem(CLE_STORAGE) } catch {}
}