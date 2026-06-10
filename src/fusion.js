// ============================================================
// SYSTEME DE FUSION — facon Pokemon Infinite Fusion
// Fusionne 2 Pokemon en un seul, avec :
//   - sprite custom (dessine main par la communaute)
//   - stats = le MEILLEUR des deux par stat
//   - double-type (type de la tete + type du corps)
//   - nom stylise (debut de la tete + fin du corps)
// La fusion CONSOMME les deux parents (craft).
//
// La disponibilite des sprites est lue dans une TABLE STATIQUE
// (fusionsDisponibles.js, issue de la matrice officielle Infinite Fusion).
// Aucune verification reseau : tout est instantane.
// Les URLs du repo de sprites utilisent les ids du dex INFINITE FUSION (PIF).
//
// FIX SPRITES (important) :
//   - L'ancienne source GitLab ne chargeait pas, et l'ancien secours
//     (Aegide/custom-fusion-sprites) est un repo MORT (403).
//   - Nouvelle source principale : le MIROIR GITHUB OFFICIEL
//     pokemoninfinitefusion/custom-sprites (verifie : repond 200,
//     meme domaine raw.githubusercontent.com que les sprites PokeAPI).
//   - Secours : le GitLab officiel.
// ============================================================

import { trouverFusion, pifIdDepuisNational, nationalDepuisPif } from './fusionsDisponibles'

// Source PRINCIPALE : miroir GitHub officiel (fiable, meme domaine que PokeAPI).
const BASE_CUSTOM = 'https://raw.githubusercontent.com/pokemoninfinitefusion/custom-sprites/master/CustomBattlers'
// Secours : GitLab officiel du projet Infinite Fusion.
const BASE_CUSTOM_SECOURS = 'https://gitlab.com/pokemoninfinitefusion/customsprites/-/raw/master/CustomBattlers'

// URL du sprite custom pour une paire (tete, corps) = ids PIF.
export function urlSpriteFusion(tetePif, corpsPif) {
  return `${BASE_CUSTOM}/${tetePif}.${corpsPif}.png`
}

// URL de secours (GitLab officiel) pour la meme paire.
export function urlSpriteFusionSecours(tetePif, corpsPif) {
  return `${BASE_CUSTOM_SECOURS}/${tetePif}.${corpsPif}.png`
}

// URL du sprite de fusion a partir des ids NATIONAUX des parents
// (sert a reparer les fusions deja creees avec l'ancienne adresse).
export function urlFusionDepuisNational(natTete, natCorps) {
  const t = pifIdDepuisNational(natTete)
  const c = pifIdDepuisNational(natCorps)
  if (!t || !c) return null
  return urlSpriteFusion(t, c)
}

// REPARATION : met a jour les sprites des fusions deja sauvegardees
// (creees avec l'ancienne URL morte). A appeler sur la liste de captures
// au chargement de la sauvegarde. Renvoie la liste (inchangee si rien a faire).
export function reparerFusions(listeCaptures) {
  if (!Array.isArray(listeCaptures)) return listeCaptures
  let modifie = false
  const liste = listeCaptures.map((p) => {
    if (!p || !p.estFusion) return p
    const url = urlFusionDepuisNational(p.teteId, p.corpsId)
    if (!url || p.sprite === url) return p
    modifie = true
    return { ...p, sprite: url, spriteNormal: url, spriteShiny: url }
  })
  return modifie ? liste : listeCaptures
}

// Compat : verifie si une image existe (plus utilisee par le coeur du jeu).
export function spriteExiste(url) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') { resolve(false); return }
    const img = new Image()
    let regle = false
    const fini = (ok) => { if (!regle) { regle = true; resolve(ok) } }
    img.onload = () => fini(img.naturalWidth > 1 && img.naturalHeight > 1)
    img.onerror = () => fini(false)
    img.src = url
    setTimeout(() => fini(false), 7000)
  })
}

// Cherche un sprite custom pour la paire d'ids NATIONAUX (les 2 sens testes).
// INSTANTANE (lecture de table). Renvoie { url, teteId, corpsId } (ids NATIONAUX) ou null.
// Garde une signature async pour compatibilite avec le code existant.
export async function trouverSpriteFusion(aIdNat, bIdNat) {
  const f = trouverFusion(aIdNat, bIdNat)
  if (!f) return null
  return {
    url: urlSpriteFusion(f.tetePif, f.corpsPif),
    teteId: nationalDepuisPif(f.tetePif),
    corpsId: nationalDepuisPif(f.corpsPif),
  }
}

// Version synchrone (pour les interfaces) : meme retour, sans Promise.
export function trouverSpriteFusionSync(aIdNat, bIdNat) {
  const f = trouverFusion(aIdNat, bIdNat)
  if (!f) return null
  return {
    url: urlSpriteFusion(f.tetePif, f.corpsPif),
    teteId: nationalDepuisPif(f.tetePif),
    corpsId: nationalDepuisPif(f.corpsPif),
  }
}

// Une espece nationale est-elle fusionnable (presente dans le dex IF) ?
export function especeFusionnable(idNat) {
  return !!pifIdDepuisNational(idNat)
}

// ============================================================
// NOM STYLISE — debut phonetique de la tete + fin du corps.
// Ex : "dracaufeu" + "tortank" => "Dracank"
// ============================================================
const VOYELLES = 'aeiouyàâäéèêëîïôöûü'

function estVoyelle(c) { return VOYELLES.includes((c || '').toLowerCase()) }

function debutTete(nom) {
  const n = nom.toLowerCase()
  let coupe = Math.ceil(n.length * 0.5)
  while (coupe > 1 && !estVoyelle(n[coupe - 1])) coupe--
  if (coupe < 2) coupe = Math.ceil(n.length * 0.5)
  return n.slice(0, coupe)
}

function finCorps(nom) {
  const n = nom.toLowerCase()
  let debut = Math.floor(n.length * 0.5)
  while (debut < n.length - 1 && estVoyelle(n[debut])) debut++
  if (debut >= n.length - 1) debut = Math.floor(n.length * 0.5)
  return n.slice(debut)
}

export function nomFusion(nomTete, nomCorps) {
  const a = debutTete(nomTete)
  const b = finCorps(nomCorps)
  let nom = a + b
  nom = nom.replace(/(.)\1\1+/g, '$1$1')
  return nom.charAt(0).toUpperCase() + nom.slice(1)
}

// ============================================================
// STATS DE LA FUSION — le MEILLEUR des deux par stat.
// ============================================================
export function statsFusion(pokeA, pokeB) {
  return {
    pvBase:      Math.max(pokeA.pvBase || 0,      pokeB.pvBase || 0),
    attaqueBase: Math.max(pokeA.attaqueBase || 0, pokeB.attaqueBase || 0),
    defBase:     Math.max(pokeA.defBase || 0,     pokeB.defBase || 0),
    vitesseBase: Math.max(pokeA.vitesseBase || 0, pokeB.vitesseBase || 0),
  }
}

// ============================================================
// TYPES DE LA FUSION — type principal de la tete + type du corps.
// ============================================================
export function typesFusion(pokeTete, pokeCorps) {
  const t1 = (pokeTete.types && pokeTete.types[0]) || 'normal'
  const t2 = (pokeCorps.types && pokeCorps.types[0]) || 'normal'
  if (t1 === t2) return [t1]
  return [t1, t2]
}

// ============================================================
// COUT EN ADN DE FUSION — selon la rarete des deux parents.
// ============================================================
const COUT_ADN_RARETE = {
  commun: 1,
  peuCommun: 2,
  peu_commun: 2,
  rare: 3,
  tresRare: 5,
  tres_rare: 5,
  epique: 6,
  legendaire: 8,
  mythique: 10,
  special: 8,
}

export function coutAdnRarete(rarete) {
  return COUT_ADN_RARETE[rarete] ?? 2
}

export function coutFusion(pokeA, pokeB) {
  const a = coutAdnRarete(pokeA?.rarete)
  const b = coutAdnRarete(pokeB?.rarete)
  return Math.max(1, a + b)
}

// La rarete de la fusion = celle du parent le plus rare (selon le bareme ADN).
function rareteFusion(pokeA, pokeB) {
  const a = pokeA?.rarete || 'commun'
  const b = pokeB?.rarete || 'commun'
  return coutAdnRarete(a) >= coutAdnRarete(b) ? a : b
}

// ============================================================
// CREATION DU POKEMON FUSIONNE
// ============================================================
export async function creerFusion(pokeA, pokeB, nouvelUidFn) {
  if (!pokeA || !pokeB) return null
  if (pokeA.uid === pokeB.uid) return null
  const idA = pokeA.id
  const idB = pokeB.id
  if (!idA || !idB) return null

  // 1) Sprite custom : lookup instantane dans la table (les 2 sens).
  const trouve = trouverSpriteFusionSync(idA, idB)
  if (!trouve) return null

  const tete  = trouve.teteId === idA ? pokeA : pokeB
  const corps = trouve.teteId === idA ? pokeB : pokeA

  const stats = statsFusion(pokeA, pokeB)
  const types = typesFusion(tete, corps)
  const nom = nomFusion(tete.nom, corps.nom)
  const niveau = Math.max(pokeA.niveau || 1, pokeB.niveau || 1)
  const iv = Math.max(pokeA.iv || 0, pokeB.iv || 0)

  const idFusion = `fusion-${trouve.teteId}-${trouve.corpsId}`

  const fusion = {
    uid: nouvelUidFn ? nouvelUidFn() : `fus-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    id: idFusion,
    estFusion: true,
    teteId: trouve.teteId,
    corpsId: trouve.corpsId,
    nom,
    nomTete: tete.nom,
    nomCorps: corps.nom,
    ...stats,
    types,
    rarete: rareteFusion(pokeA, pokeB),
    sprite: trouve.url,
    spriteNormal: trouve.url,
    spriteShiny: trouve.url,
    shiny: false,
    iv,
    niveau,
    xp: 0,
    evolueEn: null, evolueNiveau: null, evolutionsPierre: [], formeEvoluee: null,
    estEvolution: false, familleId: null,
  }
  return fusion
}