// ============================================================
// boosters.js — Logique des boosters de cartes TCG.
// Module autonome : ne touche a rien d'existant.
// Depend uniquement de setsCartes.js (SETS_CARTES, IDS_SETS).
//
// Un booster = 10 cartes tirees dans un set :
//   - 6 cartes palier 1-2 (communes / peu communes)
//   - 2 cartes "slot rare classique"
//   - 2 cartes "slot brillant"
// La rarete EST la finition (plus de systeme normale/brillante).
// La "cote" est interne (invisible joueur) : sert au tri du
// classement carte_rare et a la valeur estimee.
// ============================================================

import { SETS_CARTES, IDS_SETS } from './setsCartes';

// ------------------------------------------------------------
// 1) PALIERS DE RARETE
// 6 paliers. Chaque rarete reelle du TCG est mappee vers un palier.
// couleur = halo affiche ; cote = valeur interne estimee.
// ------------------------------------------------------------

export const PALIERS = {
  1: { nom: 'Commune',      emoji: '\u26AA', couleur: '#9ca3af', cote: 0.5 },
  2: { nom: 'Peu commune',  emoji: '\uD83D\uDFE2', couleur: '#22c55e', cote: 1 },
  3: { nom: 'Rare',         emoji: '\uD83D\uDD35', couleur: '#3b82f6', cote: 3 },
  4: { nom: 'Ultra Rare',   emoji: '\uD83D\uDFE3', couleur: '#a855f7', cote: 15 },
  5: { nom: 'Illustration', emoji: '\uD83C\uDF38', couleur: '#ec4899', cote: 40 },
  6: { nom: 'Chromatique',  emoji: '\uD83C\uDF08', couleur: '#f59e0b', cote: 150 },
};

// Table de correspondance rarete reelle -> numero de palier.
// Verifiee exhaustive sur les 16 libelles presents dans les 15 sets.
const RARETE_VERS_PALIER = {
  'Common': 1,

  'Uncommon': 2,

  'Rare': 3,
  'Rare Holo': 3,

  'Double Rare': 4,
  'Ultra Rare': 4,
  'Rare Ultra': 4,
  'Rare Holo V': 4,
  'Rare Holo VMAX': 4,
  'Rare Holo VSTAR': 4,
  'Radiant Rare': 4,

  'Illustration Rare': 5,

  'Special Illustration Rare': 6,
  'Hyper Rare': 6,
  'Rare Rainbow': 6,
  'Rare Secret': 6,
};

// Palier d'une carte (defaut palier 3 si rarete inconnue, pour
// ne jamais casser : une rarete non mappee est traitee comme "Rare").
export function palierDeCarte(rarete) {
  return RARETE_VERS_PALIER[rarete] || 3;
}

// Infos d'affichage d'un palier (couleur, nom, emoji).
export function infoPalier(palier) {
  return PALIERS[palier] || PALIERS[3];
}

// Couleur du halo pour un palier.
export function couleurPalier(palier) {
  return infoPalier(palier).couleur;
}

// Libelle court "🔵 Rare" pour un palier.
export function libellePalier(palier) {
  const p = infoPalier(palier);
  return `${p.emoji} ${p.nom}`;
}

// ------------------------------------------------------------
// 2) STRUCTURE DU BOOSTER
// Probabilites de montee de palier pour les 4 slots speciaux.
// ------------------------------------------------------------

// Slot "rare classique" (x2) : surtout palier 3.
const TABLE_RARE_CLASSIQUE = [
  [3, 0.80],
  [4, 0.16],
  [5, 0.03],
  [6, 0.01],
];

// Slot "brillant" (x2) : plus genereux vers 4/5/6.
const TABLE_BRILLANT = [
  [3, 0.45],
  [4, 0.38],
  [5, 0.12],
  [6, 0.05],
];

// Tirage pondere d'un palier dans une table [[palier, proba], ...].
function tirerPalier(table) {
  const r = Math.random();
  let cumul = 0;
  for (const [palier, proba] of table) {
    cumul += proba;
    if (r < cumul) return palier;
  }
  return table[table.length - 1][0];
}

// ------------------------------------------------------------
// 3) INDEX DES CARTES PAR PALIER (par set, calcule a la demande, mis en cache)
// ------------------------------------------------------------

const _cacheIndex = {};

// Renvoie { 1:[...], 2:[...], ... 6:[...] } pour un set donne.
// Chaque entree est la liste des cartes brutes de ce palier.
function indexParPalier(idSet) {
  if (_cacheIndex[idSet]) return _cacheIndex[idSet];
  const set = SETS_CARTES[idSet];
  const index = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  if (set && set.cartes) {
    for (const c of set.cartes) {
      const p = palierDeCarte(c.rarete);
      index[p].push(c);
    }
  }
  _cacheIndex[idSet] = index;
  return index;
}

// Tire une carte aleatoire d'un palier donne dans un set.
// Si le palier est vide, redescend vers le palier inferieur jusqu'a
// trouver quelque chose (garantit qu'on renvoie toujours une carte).
function tirerCarteDuPalier(index, palierVoulu) {
  for (let p = palierVoulu; p >= 1; p--) {
    const liste = index[p];
    if (liste && liste.length > 0) {
      return liste[Math.floor(Math.random() * liste.length)];
    }
  }
  // Si meme le palier 1 est vide, on remonte (set minuscule).
  for (let p = palierVoulu + 1; p <= 6; p++) {
    const liste = index[p];
    if (liste && liste.length > 0) {
      return liste[Math.floor(Math.random() * liste.length)];
    }
  }
  return null;
}

// ------------------------------------------------------------
// 4) FABRICATION D'UNE CARTE DE COLLECTION
// Convertit une carte brute {id,nom,rarete,img} en objet compatible
// avec collectionCartesTCG (champs attendus par App.jsx / socles).
// ------------------------------------------------------------

function fabriquerCarte(carteBrute, idSet) {
  const set = SETS_CARTES[idSet];
  const palier = palierDeCarte(carteBrute.rarete);
  return {
    id: carteBrute.id,
    nom: carteBrute.nom,
    set: idSet,
    setNom: set ? set.nom : idSet,
    rarete: carteBrute.rarete,
    image: carteBrute.img,
    imageSmall: carteBrute.img,
    palier: palier,
    cote: infoPalier(palier).cote,
    cleCollection: carteBrute.id, // plus de finition : la cle est l'id seul
  };
}

// ------------------------------------------------------------
// 5) OUVERTURE D'UN BOOSTER
// Renvoie un tableau de 10 cartes de collection.
// ------------------------------------------------------------

export function ouvrirBooster(idSet) {
  const index = indexParPalier(idSet);
  const tirages = [];

  // 6 cartes communes / peu communes (~70% commune, ~30% peu commune)
  for (let i = 0; i < 6; i++) {
    tirages.push(Math.random() < 0.7 ? 1 : 2);
  }
  // 2 slots rares classiques
  for (let i = 0; i < 2; i++) tirages.push(tirerPalier(TABLE_RARE_CLASSIQUE));
  // 2 slots brillants
  for (let i = 0; i < 2; i++) tirages.push(tirerPalier(TABLE_BRILLANT));

  const cartes = [];
  for (const palier of tirages) {
    const brute = tirerCarteDuPalier(index, palier);
    if (brute) cartes.push(fabriquerCarte(brute, idSet));
  }
  return cartes;
}

// ------------------------------------------------------------
// 6) HELPERS DIVERS
// ------------------------------------------------------------

// Infos d'un set pour l'affichage (nom, logo, nb de cartes).
export function infoSet(idSet) {
  const set = SETS_CARTES[idSet];
  if (!set) return null;
  return {
    id: idSet,
    nom: set.nom,
    serie: set.serie,
    date: set.date,
    logo: set.logo,
    nbCartes: set.cartes ? set.cartes.length : 0,
  };
}

// Liste de tous les sets ouvrables (pour l'inventaire / affichage).
export function tousLesSets() {
  return IDS_SETS.map(infoSet).filter(Boolean);
}

// Tire un set au hasard (utile pour le drop de booster en fin de Tour).
export function setAleatoire() {
  return IDS_SETS[Math.floor(Math.random() * IDS_SETS.length)];
}

// ------------------------------------------------------------
// 7) COLLECTION / PROGRESSION (pour l'album des 15 sets)
// ------------------------------------------------------------

// Liste les cartes d'un set, enrichies de leur palier (pour l'album).
// Renvoie [{ id, nom, rarete, img, palier }, ...].
export function cartesDuSet(idSet) {
  const set = SETS_CARTES[idSet];
  if (!set || !set.cartes) return [];
  return set.cartes.map((c) => ({
    id: c.id,
    nom: c.nom,
    rarete: c.rarete,
    img: c.img,
    palier: palierDeCarte(c.rarete),
  }));
}

// Ensemble des ids de cartes possedees, filtre sur un set donne.
// collection = collectionCartesTCG (tableau d'objets carte avec .set et .id).
export function idsPossedesDuSet(collection, idSet) {
  const possedes = new Set();
  for (const c of (collection || [])) {
    if (c && c.set === idSet && c.id) possedes.add(c.id);
  }
  return possedes;
}

// Progression d'un set : { possedees, total, pct }.
export function progressionSet(collection, idSet) {
  const total = (SETS_CARTES[idSet] && SETS_CARTES[idSet].cartes)
    ? SETS_CARTES[idSet].cartes.length : 0;
  const possedees = idsPossedesDuSet(collection, idSet).size;
  const pct = total > 0 ? Math.round((possedees / total) * 100) : 0;
  return { possedees, total, pct };
}

// Compte, pour un set, combien de cartes possedees sont de palier >= seuil.
// Sert au compteur "cartes rares" du bandeau.
export function compterParPalierMin(collection, idSet, seuil) {
  const ids = idsPossedesDuSet(collection, idSet);
  const set = SETS_CARTES[idSet];
  if (!set || !set.cartes) return 0;
  let n = 0;
  for (const c of set.cartes) {
    if (ids.has(c.id) && palierDeCarte(c.rarete) >= seuil) n++;
  }
  return n;
}

// ------------------------------------------------------------
// 8) BONUS XP DE COLLECTION (coherent avec le jeu)
// Bareme :
//   - set complete a 100%        -> +2% XP
//   - au moins 1 carte palier 6  -> +1% XP (par set)
// Renvoie un nombre decimal (ex: 0.07 = +7% XP).
// Ajuste BONUS_SET_COMPLET / BONUS_CHROMA pour equilibrer.
// ------------------------------------------------------------

const BONUS_SET_COMPLET = 0.02; // +2% par set 100%
const BONUS_CHROMA = 0.01;      // +1% si au moins 1 Chromatique du set

export function bonusXpCollection(collection) {
  let bonus = 0;
  for (const idSet of IDS_SETS) {
    const prog = progressionSet(collection, idSet);
    if (prog.total > 0 && prog.possedees >= prog.total) bonus += BONUS_SET_COMPLET;
    if (compterParPalierMin(collection, idSet, 6) > 0) bonus += BONUS_CHROMA;
  }
  return bonus;
}