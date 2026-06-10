// ============================================================
// SYSTEME DE FUSION — facon Pokemon Infinite Fusion
// Fusionne 2 Pokemon en un seul, avec :
//   - sprite custom (dessine main par la communaute)
//   - stats = le MEILLEUR des deux par stat (base + IV)
//   - double-type (type de la tete + type du corps)
//   - nom stylise (debut de la tete + fin du corps)
// La fusion CONSOMME les deux parents (craft).
//
// V3 — GENE DOMINANT :
//   - La fusion memorise le ROLE de ses 2 parents (roleTete / roleCorps).
//   - Le joueur choisit le "gene dominant" (tete ou corps) : la fusion
//     prend le role correspondant. Basculable a volonte (appliquerGeneDominant).
// V2 — FIX COMBAT (conserve) :
//   - IV fusionnes stat par stat, role/passif/stats finales a la creation,
//   - shiny si les DEUX parents sont shiny.
// ============================================================

import { trouverFusion, pifIdDepuisNational, nationalDepuisPif } from './fusionsDisponibles'
import { statsFinales, fusionnerIV, normaliserIV } from './stats'
import { determinerRole, determinerPassif, passifParDefautDuRole } from './roles'
import { BONUS_STAT_NIVEAU } from './config'

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

// ============================================================
// GENE DOMINANT
// ============================================================
// Applique le gene choisi ('tete' ou 'corps') : la fusion prend le role
// du parent correspondant. Renvoie le Pokemon mis a jour (stats recalculees).
export function appliquerGeneDominant(poke, gene) {
  if (!poke || !poke.estFusion) return poke
  const g = gene === 'corps' ? 'corps' : 'tete'
  const role = g === 'corps' ? (poke.roleCorps || poke.role) : (poke.roleTete || poke.role)
  if (!role) return poke
  const maj = {
    ...poke,
    geneDominant: g,
    role,
    roleForce: role,
    passifChoisi: passifParDefautDuRole(role),
  }
  maj.passif = determinerPassif(maj)
  return { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
}

// REPARATION : met a jour les fusions deja sauvegardees.
//   1) URL de sprite morte -> nouvelle source
//   2) IV au mauvais format -> objet propre
//   3) Genes manquants (roleTete/roleCorps) -> deduits des deux types
//   4) Role / passif / stats finales manquants ou casses
// A appeler sur la liste de captures au chargement de la sauvegarde.
export function reparerFusions(listeCaptures) {
  if (!Array.isArray(listeCaptures)) return listeCaptures
  let modifie = false
  const liste = listeCaptures.map((p) => {
    if (!p || !p.estFusion) return p
    let maj = p
    const copie = () => { if (maj === p) maj = { ...p } }
    // 1) URL de sprite morte -> nouvelle source.
    const url = urlFusionDepuisNational(p.teteId, p.corpsId)
    if (url && p.sprite !== url) {
      copie(); maj.sprite = url; maj.spriteNormal = url; maj.spriteShiny = url
    }
    // 2) IV au mauvais format (nombre/NaN) -> objet propre.
    if (!maj.iv || typeof maj.iv !== 'object') { copie(); maj.iv = normaliserIV(null) }
    // 3) Genes manquants : roles des parents deduits des deux types de la fusion
    //    (type 1 = type principal de la tete, type 2 = type principal du corps).
    if (!maj.roleTete || !maj.roleCorps) {
      copie()
      const t = maj.types || []
      maj.roleTete = determinerRole({ ...maj, types: [t[0] || 'normal'] })
      maj.roleCorps = determinerRole({ ...maj, types: [t[1] || t[0] || 'normal'] })
      maj.geneDominant = maj.geneDominant || 'tete'
    }
    // 4) Role / passif manquants.
    if (!maj.role) { copie(); maj.role = maj.roleTete; maj.roleForce = maj.roleTete; maj.passif = determinerPassif(maj) }
    // 5) Stats finales manquantes ou cassees (NaN).
    if (!Number.isFinite(maj.pvMax) || !Number.isFinite(maj.attaque)) {
      maj = { ...maj, ...statsFinales(maj, BONUS_STAT_NIVEAU) }
    }
    if (maj !== p) modifie = true
    return maj
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

  // IV : le MEILLEUR de chaque stat entre les deux parents.
  const iv = fusionnerIV(normaliserIV(pokeA.iv), normaliserIV(pokeB.iv))

  // SHINY : la fusion est shiny seulement si les DEUX parents sont shiny.
  const estShiny = !!(pokeA.shiny && pokeB.shiny)

  // GENES : roles des deux parents (gene dominant par defaut = tete).
  const roleTete = tete.role || determinerRole(tete)
  const roleCorps = corps.role || determinerRole(corps)

  const idFusion = `fusion-${trouve.teteId}-${trouve.corpsId}`

  const base = {
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
    shiny: estShiny,
    iv,
    niveau,
    xp: 0,
    roleTete,
    roleCorps,
    geneDominant: 'tete',
    evolueEn: null, evolueNiveau: null, evolutionsPierre: [], formeEvoluee: null,
    estEvolution: false, familleId: null,
  }

  // Role = gene dominant (tete par defaut), comme un roleForce.
  base.role = roleTete
  base.roleForce = roleTete
  base.passifChoisi = passifParDefautDuRole(roleTete)
  base.passif = determinerPassif(base)

  // Stats finales (pvMax, attaque, defense, vitesse) — pretes pour le combat.
  const finales = statsFinales(base, BONUS_STAT_NIVEAU)
  return { ...base, ...finales }
}