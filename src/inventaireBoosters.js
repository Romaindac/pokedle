// ============================================================
// inventaireBoosters.js — Inventaire de boosters + drop de Tour.
// Module autonome : logique pure, ne touche a aucun composant.
// Depend de boosters.js (setAleatoire, infoSet, IDS_SETS via setsCartes).
//
// L'inventaire est un objet simple : { idSet: quantite }
//   ex : { sv3pt5: 3, swsh7: 1 }
// On stocke le SET PRECIS : le joueur voit le nom/logo de chaque
// pack dans l'inventaire et choisit lequel ouvrir. "Aleatoire"
// concerne uniquement QUEL set tombe au drop de Tour.
// ============================================================

import { setAleatoire, infoSet } from './boosters';
import { IDS_SETS } from './setsCartes';

// ------------------------------------------------------------
// 1) MANIPULATION DE L'INVENTAIRE
// Toutes les fonctions sont PURES : elles renvoient un NOUVEL
// objet, sans muter l'ancien (compatible setState React).
// ------------------------------------------------------------

// Ajoute n boosters d'un set. Renvoie un nouvel inventaire.
export function ajouterBooster(inventaire, idSet, n = 1) {
  const inv = { ...(inventaire || {}) };
  inv[idSet] = (inv[idSet] || 0) + n;
  return inv;
}

// Retire 1 booster d'un set (a l'ouverture). Renvoie un nouvel
// inventaire ; si le compteur tombe a 0, la cle est supprimee.
export function retirerBooster(inventaire, idSet) {
  const inv = { ...(inventaire || {}) };
  if (!inv[idSet]) return inv; // rien a retirer
  inv[idSet] -= 1;
  if (inv[idSet] <= 0) delete inv[idSet];
  return inv;
}

// Applique une liste de drops (tableau d'idSet) a l'inventaire.
// Utilise pour le God Pack (10 sets d'un coup, doublons ok).
export function ajouterPlusieurs(inventaire, listeIdSet) {
  let inv = { ...(inventaire || {}) };
  for (const idSet of listeIdSet) {
    inv[idSet] = (inv[idSet] || 0) + 1;
  }
  return inv;
}

// Nombre total de boosters possedes (toutes raretes confondues).
export function totalBoosters(inventaire) {
  const inv = inventaire || {};
  return Object.values(inv).reduce((s, n) => s + (n || 0), 0);
}

// Liste detaillee pour l'affichage de l'inventaire :
// [{ id, nom, serie, logo, quantite }] triee par nom de set.
export function listerInventaire(inventaire) {
  const inv = inventaire || {};
  const liste = [];
  for (const idSet of Object.keys(inv)) {
    const qte = inv[idSet];
    if (!qte || qte <= 0) continue;
    const info = infoSet(idSet);
    if (!info) continue;
    liste.push({ ...info, quantite: qte });
  }
  liste.sort((a, b) => a.nom.localeCompare(b.nom));
  return liste;
}

// ------------------------------------------------------------
// 2) DROP DE TOUR
// Regles validees :
//   - niveau multiple de 10 : 1 booster garanti + 0.01% God Pack (10 boosters)
//   - niveau multiple de 5  : 1 booster garanti
//   - sinon                 : 15% de chance d'1 booster
//
// Renvoie un objet decrivant ce qui est tombe :
//   { boosters: [idSet, ...], godPack: bool }
// - boosters = [] si rien n'est tombe (niveau normal sans chance)
// - godPack = true si le God Pack s'est declenche (boosters contient 10 sets)
// ------------------------------------------------------------

const CHANCE_DROP_NORMAL = 0.15;   // 15% sur niveau normal
const CHANCE_GOD_PACK = 0.0001;    // 0.01% sur niveau multiple de 10
const TAILLE_GOD_PACK = 10;        // 10 boosters dans un God Pack

export function dropBoosterTour(niveau) {
  const estMultiple10 = niveau % 10 === 0;
  const estMultiple5 = niveau % 5 === 0;

  // God Pack : seulement testable sur les paliers de 10.
  if (estMultiple10 && Math.random() < CHANCE_GOD_PACK) {
    const boosters = [];
    for (let i = 0; i < TAILLE_GOD_PACK; i++) boosters.push(setAleatoire());
    return { boosters, godPack: true };
  }

  // Booster garanti tous les 5 niveaux (inclut les multiples de 10).
  if (estMultiple5) {
    return { boosters: [setAleatoire()], godPack: false };
  }

  // Niveau normal : 15% de chance.
  if (Math.random() < CHANCE_DROP_NORMAL) {
    return { boosters: [setAleatoire()], godPack: false };
  }

  // Rien.
  return { boosters: [], godPack: false };
}

// ------------------------------------------------------------
// 3) HELPER MIGRATION (securite)
// Garantit qu'un inventaire charge est bien un objet propre
// (filtre les cles invalides et les quantites <= 0).
// ------------------------------------------------------------

export function nettoyerInventaire(inventaire) {
  const inv = {};
  if (!inventaire || typeof inventaire !== 'object') return inv;
  const setsValides = new Set(IDS_SETS);
  for (const idSet of Object.keys(inventaire)) {
    const qte = inventaire[idSet];
    if (setsValides.has(idSet) && Number.isFinite(qte) && qte > 0) {
      inv[idSet] = Math.floor(qte);
    }
  }
  return inv;
}