// Logique du classement en ligne (lecture/écriture vers Supabase).
import { supabase } from './supabase'

// --- Identité locale du joueur ---
// On garde un identifiant unique + le pseudo dans le navigateur (localStorage).
// Comme ça, le même joueur met à jour SA ligne au lieu d'en créer plusieurs.
const CLE_JOUEUR = 'pokedle-joueur'

// =====================================================================
// VALIDATION / NETTOYAGE DU PSEUDO
// =====================================================================
export const PSEUDO_MIN = 2
export const PSEUDO_MAX = 16

// Petite liste de base (français + anglais courants). Volontairement courte :
// le but est d'éviter les pseudos clairement insultants, pas d'être exhaustif.
const GROS_MOTS = [
  'connard', 'connar', 'enculé', 'encule', 'pute', 'putain', 'salope', 'merde',
  'pd', 'pédé', 'pede', 'nègre', 'negre', 'batard', 'bâtard', 'ntm', 'fdp',
  'fuck', 'shit', 'bitch', 'nigger', 'nigga', 'cunt', 'asshole', 'dick',
  'pénis', 'penis', 'bite', 'couille', 'zob', 'nazi', 'hitler', 'viol',
]

// Vérifie un pseudo et renvoie { ok, raison }.
export function validerPseudo(pseudo) {
  const p = (pseudo || '').trim()
  if (p.length < PSEUDO_MIN) return { ok: false, raison: `Au moins ${PSEUDO_MIN} caractères.` }
  if (p.length > PSEUDO_MAX) return { ok: false, raison: `${PSEUDO_MAX} caractères maximum.` }
  // Caractères autorisés : lettres (accents inclus), chiffres, espace, tiret, underscore.
  if (!/^[\p{L}\p{N} _-]+$/u.test(p)) {
    return { ok: false, raison: 'Lettres, chiffres, espaces et - _ uniquement.' }
  }
  // Filtre gros mots (on compare une version simplifiée : minuscules, sans espaces).
  const simple = p.toLowerCase().replace(/[\s_-]/g, '')
  for (const mot of GROS_MOTS) {
    if (simple.includes(mot)) return { ok: false, raison: 'Pseudo non autorisé.' }
  }
  return { ok: true }
}

// Nettoie un pseudo pour stockage (coupe à la longueur max, espaces multiples réduits).
export function nettoyerPseudo(pseudo) {
  return (pseudo || '').trim().replace(/\s+/g, ' ').slice(0, PSEUDO_MAX)
}

export function chargerIdentite() {
  try {
    const brut = localStorage.getItem(CLE_JOUEUR)
    if (brut) return JSON.parse(brut)
  } catch (e) { /* ignore */ }
  return null
}

export function definirPseudo(pseudo) {
  // Sécurité : on nettoie toujours avant de stocker (même si l'UI a déjà validé).
  const propre = nettoyerPseudo(pseudo)
  // Crée un identifiant unique stable pour ce joueur (gardé à vie sur ce navigateur).
  let identite = chargerIdentite()
  if (!identite) {
    identite = { id: crypto.randomUUID(), pseudo: propre }
  } else {
    identite = { ...identite, pseudo: propre }
  }
  localStorage.setItem(CLE_JOUEUR, JSON.stringify(identite))
  return identite
}

// =====================================================================
// PLAFONNEMENT DES SCORES (anti valeurs aberrantes)
// =====================================================================
// Bornes hautes réalistes du jeu. Empêche d'envoyer des nombres absurdes
// (utile aussi en miroir de la contrainte SQL côté Supabase).
const MAX_POKEDEX = 1025
const MAX_ZONES = 100
const MAX_PVP = 5000

function borne(valeur, min, max) {
  const n = Number(valeur)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n)))
}

// Envoie (ou met à jour) le score du joueur dans le classement en ligne.
// `stats` = { pokemonCaptures, nbShiny, zones, scorePvp, rangPvp }
export async function envoyerScore(stats) {
  const identite = chargerIdentite()
  if (!identite || !identite.pseudo) return { ok: false, raison: 'pas_de_pseudo' }

  const ligne = {
    id: identite.id,
    pseudo: nettoyerPseudo(identite.pseudo),
    pokemon_captures: borne(stats.pokemonCaptures, 0, MAX_POKEDEX),
    nb_shiny: borne(stats.nbShiny, 0, MAX_POKEDEX),
    zones: borne(stats.zones, 0, MAX_ZONES),
    score_pvp: borne(stats.scorePvp, 0, MAX_PVP),
    rang_pvp: String(stats.rangPvp || 'Non classé').slice(0, 20),
    maj: new Date().toISOString(),
  }

  // upsert = insère si l'id n'existe pas, sinon met à jour la ligne existante.
  const { error } = await supabase.from('classement').upsert(ligne, { onConflict: 'id' })
  if (error) {
    console.warn('Envoi score échoué :', error.message)
    return { ok: false, raison: error.message }
  }
  return { ok: true }
}

// Récupère le classement trié selon une colonne donnée.
// colonne = 'pokemon_captures' | 'nb_shiny' | 'zones' | 'score_pvp'
export async function recupererClassement(colonne = 'pokemon_captures', limite = 50) {
  const { data, error } = await supabase
    .from('classement')
    .select('*')
    .order(colonne, { ascending: false })
    .limit(limite)
  if (error) {
    console.warn('Lecture classement échouée :', error.message)
    return { ok: false, raison: error.message, lignes: [] }
  }
  return { ok: true, lignes: data || [] }
}