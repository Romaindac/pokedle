// ============================================================
// SYSTEME DE FUSION — facon Pokemon Infinite Fusion
// Fusionne 2 Pokemon en un seul, avec :
//   - sprite custom (dessine main par la communaute, repo Aegide)
//   - stats = le MEILLEUR des deux par stat
//   - double-type (type de la tete + type du corps)
//   - nom stylise (debut de la tete + fin du corps)
// La fusion CONSOMME les deux parents (craft).
//
// IMPORTANT : on n'utilise QUE les sprites custom (faits main).
// Si aucun sprite custom n'existe (ni tete.corps ni corps.tete),
// la fusion est refusee (pas d'autogen moche).
// ============================================================

// Base du repo des sprites custom (faits main par la communaute).
const BASE_CUSTOM = 'https://raw.githubusercontent.com/Aegide/custom-fusion-sprites/main/CustomBattlers'

// URL du sprite custom pour une paire (tete, corps) = ids nationaux.
export function urlSpriteFusion(teteId, corpsId) {
  return `${BASE_CUSTOM}/${teteId}.${corpsId}.png`
}

// Verifie si une image existe vraiment (se charge sans erreur).
// Renvoie une Promise<boolean>. Utilise dans le navigateur.
export function spriteExiste(url) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') { resolve(false); return }
    const img = new Image()
    let regle = false
    const fini = (ok) => { if (!regle) { regle = true; resolve(ok) } }
    img.onload = () => fini(img.naturalWidth > 1 && img.naturalHeight > 1)
    img.onerror = () => fini(false)
    img.src = url
    // Securite : si rien ne se passe en 7s, on considere absent.
    setTimeout(() => fini(false), 7000)
  })
}

// Cherche un sprite custom pour la paire, en tentant les DEUX sens.
// Renvoie { url, teteId, corpsId } du sens qui a un sprite, ou null si aucun.
export async function trouverSpriteFusion(aId, bId) {
  // Sens 1 : a = tete, b = corps
  const url1 = urlSpriteFusion(aId, bId)
  if (await spriteExiste(url1)) return { url: url1, teteId: aId, corpsId: bId }
  // Sens 2 : b = tete, a = corps
  const url2 = urlSpriteFusion(bId, aId)
  if (await spriteExiste(url2)) return { url: url2, teteId: bId, corpsId: aId }
  return null
}

// ============================================================
// NOM STYLISE — debut phonetique de la tete + fin du corps.
// Ex : "dracaufeu" + "tortank" => "Dracank"
// On coupe la tete avant la derniere voyelle-bloc, le corps apres.
// ============================================================
const VOYELLES = 'aeiouyàâäéèêëîïôöûü'

function estVoyelle(c) { return VOYELLES.includes((c || '').toLowerCase()) }

function debutTete(nom) {
  // Prend la 1ere moitie environ, en coupant proprement sur une voyelle.
  const n = nom.toLowerCase()
  let coupe = Math.ceil(n.length * 0.5)
  // Recule jusqu'a juste apres une voyelle pour un son naturel.
  while (coupe > 1 && !estVoyelle(n[coupe - 1])) coupe--
  if (coupe < 2) coupe = Math.ceil(n.length * 0.5)
  return n.slice(0, coupe)
}

function finCorps(nom) {
  // Prend la 2e moitie, en commencant a une consonne si possible.
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
  // Nettoyage : pas plus de 2 voyelles ou consonnes identiques d'affilee.
  nom = nom.replace(/(.)\1\1+/g, '$1$1')
  // Majuscule initiale.
  return nom.charAt(0).toUpperCase() + nom.slice(1)
}

// ============================================================
// STATS DE LA FUSION — le MEILLEUR des deux par stat.
// On prend le max de chaque stat de base des deux parents.
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
// Si meme type, on garde un seul type.
// ============================================================
export function typesFusion(pokeTete, pokeCorps) {
  const t1 = (pokeTete.types && pokeTete.types[0]) || 'normal'
  const t2 = (pokeCorps.types && pokeCorps.types[0]) || 'normal'
  if (t1 === t2) return [t1]
  return [t1, t2]
}

// ============================================================
// COUT EN ADN DE FUSION — selon la rarete des deux parents.
// Plus les Pokemon sont rares, plus ca coute d'ADN.
// Le cout = somme des deux raretes (avec un minimum de 1).
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

// Cout d'une rarete unique (fallback : 2).
export function coutAdnRarete(rarete) {
  return COUT_ADN_RARETE[rarete] ?? 2
}

// Cout total d'une fusion = somme des deux raretes. Minimum 1.
export function coutFusion(pokeA, pokeB) {
  const a = coutAdnRarete(pokeA?.rarete)
  const b = coutAdnRarete(pokeB?.rarete)
  return Math.max(1, a + b)
}

// ============================================================
// CREATION DU POKEMON FUSIONNE
// Combine tout : id special, nom, stats max, double-type, sprite custom.
// Le niveau herite du plus haut des deux parents.
// Renvoie null si aucun sprite custom n'existe (fusion impossible).
// ============================================================
export async function creerFusion(pokeA, pokeB, nouvelUidFn) {
  if (!pokeA || !pokeB) return null
  if (pokeA.uid === pokeB.uid) return null // pas se fusionner avec soi-meme
  const idA = pokeA.id
  const idB = pokeB.id
  if (!idA || !idB) return null

  // 1) Trouver un sprite custom (tente les deux sens).
  const trouve = await trouverSpriteFusion(idA, idB)
  if (!trouve) return null // pas de sprite custom -> fusion refusee

  // Le sens du sprite definit qui est tete / corps (pour nom + types coherents).
  const tete  = trouve.teteId === idA ? pokeA : pokeB
  const corps = trouve.teteId === idA ? pokeB : pokeA

  // 2) Stats = meilleur des deux.
  const stats = statsFusion(pokeA, pokeB)

  // 3) Types = tete + corps.
  const types = typesFusion(tete, corps)

  // 4) Nom stylise.
  const nom = nomFusion(tete.nom, corps.nom)

  // 5) Niveau = max des deux parents.
  const niveau = Math.max(pokeA.niveau || 1, pokeB.niveau || 1)

  // 6) IV = meilleur des deux (recompense la fusion).
  const iv = Math.max(pokeA.iv || 0, pokeB.iv || 0)

  // Identifiant special de fusion (pour la save / le pokedex).
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
    sprite: trouve.url,
    spriteNormal: trouve.url,
    spriteShiny: trouve.url, // pas de shiny custom fiable -> meme sprite
    shiny: false,
    iv,
    niveau,
    xp: 0,
    // Pas d'evolution pour une fusion.
    evolueEn: null, evolueNiveau: null, evolutionsPierre: [], formeEvoluee: null,
    estEvolution: false, familleId: null,
  }
  return fusion
}