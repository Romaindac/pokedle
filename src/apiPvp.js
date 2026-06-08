// =====================================================================
// apiPvp.js — Logique du PvP "Arène de défense" (Mode 1, asynchrone).
// ---------------------------------------------------------------------
// Rôle de ce fichier :
//   - Calculer les rangs (Bronze → Maître) à partir des points.
//   - Calculer les gains/pertes de points avec un système ELO.
//   - Fabriquer un "snapshot" d'équipe (figé) qu'on peut rejouer plus tard.
//   - Parler à Supabase : publier sa défense, lister les adversaires,
//     appliquer le résultat d'un combat (ELO mutuel : les 2 joueurs bougent).
//
// IMPORTANT (piège Windows) : ce fichier est la LOGIQUE (apiPvp.js, minuscule).
//   Les ÉCRANS seront PanneauPvp.jsx / CombatPvp.jsx (majuscule). Ne pas mélanger.
// =====================================================================

import { supabase } from './supabase'
import { chargerIdentite } from './apiClassement'
import { statsFinales } from './stats'
import { determinerRole, determinerPassif, bonusDuPassif, compterRoles, COMPOSITION_REQUISE } from './roles'
import { BONUS_STAT_NIVEAU } from './config'

// ---------------------------------------------------------------------
// 1) RANGS — paliers de points → nom du rang.
// ---------------------------------------------------------------------
// 6 paliers. Les seuils sont volontairement larges au début (on commence
// à 1000 = milieu de Bronze) et se resserrent en haut.
export const PALIERS_RANG = [
  { rang: 'Bronze',  min: 0,    couleur: '#cd7f32' },
  { rang: 'Argent',  min: 1100, couleur: '#c0c0c0' },
  { rang: 'Or',      min: 1250, couleur: '#ffd700' },
  { rang: 'Platine', min: 1450, couleur: '#5fd0d0' },
  { rang: 'Diamant', min: 1700, couleur: '#7fd8ff' },
  { rang: 'Maître',  min: 2000, couleur: '#ff5fa2' },
]

export const POINTS_DEPART = 1000

// Niveau maximum en PvP : un Pokémon de niveau supérieur est ramené à ce niveau
// pour le combat (uniquement en PvP). Un Pokémon de niveau inférieur garde le sien.
// But : valoriser la progression jusqu'à 50, puis égaliser le haut du classement
// pour que tout se joue sur la stratégie (compo, types, objets) — pas le farm.
export const NIVEAU_MAX_PVP = 50

// Renvoie le niveau effectif d'un Pokémon en PvP.
export function niveauPvp(niveau) {
  return Math.min(niveau || 1, NIVEAU_MAX_PVP)
}

// Renvoie le nom du rang correspondant à un total de points.
export function rangDepuisPoints(points) {
  let resultat = PALIERS_RANG[0]
  for (const palier of PALIERS_RANG) {
    if (points >= palier.min) resultat = palier
  }
  return resultat.rang
}

// Renvoie l'objet complet du rang (nom + couleur + min) — pratique pour l'UI.
export function infosRang(points) {
  let resultat = PALIERS_RANG[0]
  for (const palier of PALIERS_RANG) {
    if (points >= palier.min) resultat = palier
  }
  return resultat
}

// ---------------------------------------------------------------------
// 2) ELO — calcul des points gagnés/perdus.
// ---------------------------------------------------------------------
// Formule ELO classique :
//   - probabilité attendue de victoire de A : 1 / (1 + 10^((B - A)/400))
//   - nouveau score : A + K × (resultat - attendu)   (resultat = 1 si gagné, 0 si perdu)
// K = facteur d'ampleur. Plus il est grand, plus les points bougent vite.
export const FACTEUR_K = 32

function probaAttendue(pointsA, pointsB) {
  return 1 / (1 + Math.pow(10, (pointsB - pointsA) / 400))
}

// Calcule les nouveaux points des DEUX joueurs après un combat.
// `attaquantGagne` = true si l'attaquant a gagné.
// Renvoie { attaquant: nouveauxPoints, defenseur: nouveauxPoints, deltaAttaquant, deltaDefenseur }.
export function calculerElo(pointsAttaquant, pointsDefenseur, attaquantGagne) {
  const attenduAtt = probaAttendue(pointsAttaquant, pointsDefenseur)
  const attenduDef = probaAttendue(pointsDefenseur, pointsAttaquant)

  const resAtt = attaquantGagne ? 1 : 0
  const resDef = attaquantGagne ? 0 : 1

  let nouvAtt = Math.round(pointsAttaquant + FACTEUR_K * (resAtt - attenduAtt))
  let nouvDef = Math.round(pointsDefenseur + FACTEUR_K * (resDef - attenduDef))

  // On ne descend jamais sous 0.
  nouvAtt = Math.max(0, nouvAtt)
  nouvDef = Math.max(0, nouvDef)

  return {
    attaquant: nouvAtt,
    defenseur: nouvDef,
    deltaAttaquant: nouvAtt - pointsAttaquant,
    deltaDefenseur: nouvDef - pointsDefenseur,
  }
}

// ---------------------------------------------------------------------
// 3) SNAPSHOT — figer une équipe pour la stocker / la rejouer.
// ---------------------------------------------------------------------
// On ne stocke QUE les champs "source" (pas les stats finales). Les stats
// finales seront recalculées par statsFinales() au moment du combat, donc le
// combat est 100% rejouable sans refetch PokeAPI.
//
// Champs gardés (suffisants pour chargerPokemonDepuisSnapshot) :
//   nom, id, pvBase, attaqueBase, vitesseBase, defBase, types,
//   spriteNormal, spriteShiny, shiny, iv, niveau, role, passif, objetEquipe.
export function snapshotEquipe(equipe) {
  return (equipe || [])
    .filter((p) => p) // enlève les slots vides
    .map((p) => ({
      nom: p.nom,
      id: p.id,
      pvBase: p.pvBase,
      attaqueBase: p.attaqueBase,
      vitesseBase: p.vitesseBase,
      defBase: p.defBase,
      types: p.types || [],
      spriteNormal: p.spriteNormal || p.sprite || null,
      spriteShiny: p.spriteShiny || null,
      shiny: !!p.shiny,
      iv: p.iv || { pv: 0, attaque: 0, vitesse: 0, defense: 0 },
      niveau: p.niveau || 1,
      role: p.role || null,
      passif: p.passif || null,
      objetEquipe: p.objetEquipe || null,
    }))
}

// ---------------------------------------------------------------------
// 3 bis) RECONSTRUCTION — réhydrater un snapshot en Pokémon prêts au combat.
// ---------------------------------------------------------------------
// Le moteur de combat (ticCombat) a besoin de Pokémon "vivants" : avec pvMax,
// attaque, vitesse, defense, role, passif, uid, sprite. On les recalcule ici
// à partir des champs source du snapshot (déterministe = combat reproductible).
//
// On applique aussi le bonus d'équipe (passif "Gardien" = +PV à toute l'équipe),
// comme le fait appliquerBonusEquipe() dans App.jsx, pour que la défense soit
// aussi forte qu'en jeu normal.
export function reconstruireEquipeSnapshot(snapshot) {
  const equipe = (snapshot || []).filter((p) => p).map((p, index) => {
    // Rôle/passif : on garde ceux du snapshot, sinon on les redéduit.
    const role = p.role || determinerRole(p)
    const passif = p.passif || determinerPassif({ ...p, role })
    // Cap PvP : le niveau de combat est plafonné (les IV réels sont gardés).
    const niveauCombat = niveauPvp(p.niveau)
    const base = {
      ...p,
      niveau: niveauCombat,
      role,
      passif,
      sprite: p.shiny ? (p.spriteShiny || p.spriteNormal) : p.spriteNormal,
      uid: `def-${index}-${p.id}`, // uid local stable pour l'affichage
    }
    const finales = statsFinales(base, BONUS_STAT_NIVEAU)
    return { ...base, ...finales }
  })

  // Bonus d'équipe (Gardien : +PV max à toute l'équipe). Cumulé sur les membres.
  let boostPv = 0
  for (const p of equipe) {
    const eff = bonusDuPassif(p)
    boostPv += eff.boostPvEquipe || 0
  }
  if (boostPv > 0) {
    const facteur = 1 + boostPv
    return equipe.map((p) => ({ ...p, pvMax: Math.max(1, Math.round(p.pvMax * facteur)) }))
  }
  return equipe
}

// Cappe une équipe de Pokémon VIVANTS (issus de la collection, ex: équipe d'attaque)
// au niveau max PvP. Recalcule pvMax/attaque/vitesse/defense au niveau plafonné.
// Les Pokémon sous le cap sont laissés tels quels. Applique aussi le bonus d'équipe.
export function capperEquipePvp(equipe) {
  const capee = (equipe || []).filter((p) => p).map((p) => {
    const niveauCombat = niveauPvp(p.niveau)
    if (niveauCombat === p.niveau) return p // déjà sous le cap : inchangé
    const base = { ...p, niveau: niveauCombat }
    const finales = statsFinales(base, BONUS_STAT_NIVEAU)
    return { ...base, ...finales }
  })

  // Bonus d'équipe (Gardien : +PV à toute l'équipe), recalculé sur l'équipe cappée.
  let boostPv = 0
  for (const p of capee) {
    const eff = bonusDuPassif(p)
    boostPv += eff.boostPvEquipe || 0
  }
  if (boostPv > 0) {
    const facteur = 1 + boostPv
    return capee.map((p) => ({ ...p, pvMax: Math.max(1, Math.round(p.pvMax * facteur)) }))
  }
  return capee
}

// Vérifie qu'une défense (snapshot) respecte la compo stricte 1T/1E/2S/2D.
// Sert à masquer les défenses incomplètes de la liste d'adversaires.
export function defenseComplete(snapshot) {
  const equipe = snapshot || []
  if (equipe.length !== 6) return false
  // compterRoles attend des objets avec un champ `role` — le snapshot l'a.
  const compte = compterRoles(equipe)
  for (const role of Object.keys(COMPOSITION_REQUISE)) {
    if ((compte[role] || 0) !== COMPOSITION_REQUISE[role]) return false
  }
  return true
}

// Filtre d'AFFICHAGE des défenses adverses (plus tolérant que defenseComplete).
// On affiche toute défense qui a 6 Pokémon, peu importe la compo exacte des rôles.
// Pourquoi : une défense ancienne (snapshot sans `role`) ou à compo atypique
// reste un vrai combat 6v6 et ne doit pas disparaître silencieusement de la liste.
// La PUBLICATION, elle, reste verrouillée à la compo stricte (equipeComplete),
// donc les nouvelles défenses sont propres de toute façon.
export function defenseAffichable(snapshot) {
  const equipe = (snapshot || []).filter((p) => p)
  return equipe.length === 6
}

// Même règle stricte, mais pour une équipe VIVANTE (objets de la collection).
// Contrairement à compositionValide() de roles.js, exige EXACTEMENT 6 membres
// (pas de "jeu libre <6"). Utilisé pour autoriser la publication de la défense.
export function equipeComplete(equipe) {
  const membres = (equipe || []).filter((p) => p)
  if (membres.length !== 6) return false
  const compte = compterRoles(membres)
  for (const role of Object.keys(COMPOSITION_REQUISE)) {
    if ((compte[role] || 0) !== COMPOSITION_REQUISE[role]) return false
  }
  return true
}

// ---------------------------------------------------------------------
// 4) SUPABASE — publier sa défense.
// ---------------------------------------------------------------------
// `equipe` = l'équipe de défense (tableau de Pokémon "vivants" du jeu).
// On la transforme en snapshot avant d'envoyer.
// On NE touche PAS aux points si la ligne existe déjà (on garde son score).
export async function publierDefense(equipe) {
  const identite = chargerIdentite()
  if (!identite || !identite.pseudo) return { ok: false, raison: 'pas_de_pseudo' }

  // On regarde si le joueur a déjà une ligne (pour garder ses points/rang).
  const { data: existante } = await supabase
    .from('defenses_pvp')
    .select('points_pvp, rang, victoires, defaites')
    .eq('id', identite.id)
    .maybeSingle()

  const points = existante ? existante.points_pvp : POINTS_DEPART
  const ligne = {
    id: identite.id,
    pseudo: identite.pseudo,
    equipe: snapshotEquipe(equipe),
    points_pvp: points,
    rang: rangDepuisPoints(points),
    victoires: existante ? existante.victoires : 0,
    defaites: existante ? existante.defaites : 0,
    maj: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('defenses_pvp')
    .upsert(ligne, { onConflict: 'id' })

  if (error) {
    console.warn('publierDefense échoué :', error.message)
    return { ok: false, raison: error.message }
  }
  return { ok: true, ligne }
}

// Récupère MA ligne PvP (mes points, mon rang, ma défense actuelle). Peut être null.
export async function chargerMaDefense() {
  const identite = chargerIdentite()
  if (!identite) return null
  const { data, error } = await supabase
    .from('defenses_pvp')
    .select('*')
    .eq('id', identite.id)
    .maybeSingle()
  if (error) {
    console.warn('chargerMaDefense échoué :', error.message)
    return null
  }
  return data || null
}

// ---------------------------------------------------------------------
// 5) SUPABASE — lister les adversaires (toutes les défenses sauf la mienne).
// ---------------------------------------------------------------------
// Triées par points décroissants. On exclut le joueur courant.
export async function listerDefenses(limite = 50) {
  const identite = chargerIdentite()
  const { data, error } = await supabase
    .from('defenses_pvp')
    .select('*')
    .order('points_pvp', { ascending: false })
    .limit(limite)

  if (error) {
    console.warn('listerDefenses échoué :', error.message)
    return { ok: false, raison: error.message, lignes: [] }
  }
  // On enlève sa propre ligne ET les défenses non affichables (moins de 6 Pokémon).
  // (Filtre tolérant : on ne cache plus une défense pour une compo de rôles atypique.)
  const lignes = (data || []).filter(
    (l) => (!identite || l.id !== identite.id) && defenseAffichable(l.equipe)
  )
  return { ok: true, lignes }
}

// Récupère le classement PvP (toutes les défenses, triées par points décroissants).
// Utilisé par l'onglet PvP du classement.
export async function classementPvp(limite = 50) {
  const { data, error } = await supabase
    .from('defenses_pvp')
    .select('id, pseudo, points_pvp, rang, victoires, defaites')
    .order('points_pvp', { ascending: false })
    .limit(limite)
  if (error) {
    console.warn('classementPvp échoué :', error.message)
    return { ok: false, raison: error.message, lignes: [] }
  }
  return { ok: true, lignes: data || [] }
}
// ---------------------------------------------------------------------
// Comme le défenseur est hors-ligne, c'est l'attaquant qui écrit les 2 lignes.
//   - `defenseur` = la ligne complète de l'adversaire (issue de listerDefenses).
//   - `attaquantGagne` = true si on a gagné.
// On met à jour : points + rang + victoires/defaites des 2 joueurs.
// Renvoie le détail des points pour l'affichage.
export async function appliquerResultatPvp(defenseur, attaquantGagne) {
  const identite = chargerIdentite()
  if (!identite || !identite.pseudo) return { ok: false, raison: 'pas_de_pseudo' }

  // Mes points actuels (ou départ si je n'ai pas encore de ligne).
  const maLigne = await chargerMaDefense()
  const mesPoints = maLigne ? maLigne.points_pvp : POINTS_DEPART

  const elo = calculerElo(mesPoints, defenseur.points_pvp, attaquantGagne)

  // --- Ma ligne (attaquant) ---
  const ligneAttaquant = {
    id: identite.id,
    pseudo: identite.pseudo,
    // Si je n'avais pas encore publié de défense, je mets une équipe vide
    // (le joueur sera invité à publier sa défense). Sinon je garde la mienne.
    equipe: maLigne ? maLigne.equipe : [],
    points_pvp: elo.attaquant,
    rang: rangDepuisPoints(elo.attaquant),
    victoires: (maLigne ? maLigne.victoires : 0) + (attaquantGagne ? 1 : 0),
    defaites: (maLigne ? maLigne.defaites : 0) + (attaquantGagne ? 0 : 1),
    maj: new Date().toISOString(),
  }

  // --- Ligne du défenseur ---
  const ligneDefenseur = {
    id: defenseur.id,
    pseudo: defenseur.pseudo,
    equipe: defenseur.equipe, // on ne touche pas à sa défense
    points_pvp: elo.defenseur,
    rang: rangDepuisPoints(elo.defenseur),
    victoires: (defenseur.victoires || 0) + (attaquantGagne ? 0 : 1),
    defaites: (defenseur.defaites || 0) + (attaquantGagne ? 1 : 0),
    maj: defenseur.maj, // on garde sa date de défense (on n'a pas modifié son équipe)
  }

  const { error } = await supabase
    .from('defenses_pvp')
    .upsert([ligneAttaquant, ligneDefenseur], { onConflict: 'id' })

  if (error) {
    console.warn('appliquerResultatPvp échoué :', error.message)
    return { ok: false, raison: error.message }
  }

  return {
    ok: true,
    attaquantGagne,
    mesNouveauxPoints: elo.attaquant,
    deltaMoi: elo.deltaAttaquant,
    monRang: rangDepuisPoints(elo.attaquant),
    deltaAdversaire: elo.deltaDefenseur,
  }
}