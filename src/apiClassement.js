// Logique du classement en ligne (lecture/écriture vers Supabase).
import { supabase } from './supabase'

// --- Identité locale du joueur ---
const CLE_JOUEUR = 'pokedle-joueur'

// =====================================================================
// VALIDATION / NETTOYAGE DU PSEUDO
// =====================================================================
export const PSEUDO_MIN = 2
export const PSEUDO_MAX = 16

const GROS_MOTS = [
  'connard', 'connar', 'enculé', 'encule', 'pute', 'putain', 'salope', 'merde',
  'pd', 'pédé', 'pede', 'nègre', 'negre', 'batard', 'bâtard', 'ntm', 'fdp',
  'fuck', 'shit', 'bitch', 'nigger', 'nigga', 'cunt', 'asshole', 'dick',
  'pénis', 'penis', 'bite', 'couille', 'zob', 'nazi', 'hitler', 'viol',
]

export function validerPseudo(pseudo) {
  const p = (pseudo || '').trim()
  if (p.length < PSEUDO_MIN) return { ok: false, raison: `Au moins ${PSEUDO_MIN} caractères.` }
  if (p.length > PSEUDO_MAX) return { ok: false, raison: `${PSEUDO_MAX} caractères maximum.` }
  if (!/^[\p{L}\p{N} _-]+$/u.test(p)) {
    return { ok: false, raison: 'Lettres, chiffres, espaces et - _ uniquement.' }
  }
  const simple = p.toLowerCase().replace(/[\s_-]/g, '')
  for (const mot of GROS_MOTS) {
    if (simple.includes(mot)) return { ok: false, raison: 'Pseudo non autorisé.' }
  }
  return { ok: true }
}

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
  const propre = nettoyerPseudo(pseudo)
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
const MAX_POKEDEX = 1025
const MAX_ZONES = 100
const MAX_PVP = 5000
const MAX_CARTE_RARE = 100000000 // 1 sur 100M max (borne large)
const MAX_PRESTIGES = 100000

function borne(valeur, min, max) {
  const n = Number(valeur)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n)))
}

// Envoie (ou met à jour) le score du joueur dans le classement en ligne.
// `stats` = { pokemonCaptures, nbShiny, zones, scorePvp, rangPvp, carteRare, nbPrestiges }
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
    carte_rare: borne(stats.carteRare, 0, MAX_CARTE_RARE),
    nb_prestiges: borne(stats.nbPrestiges, 0, MAX_PRESTIGES),
    maj: new Date().toISOString(),
  }

  const { error } = await supabase.from('classement').upsert(ligne, { onConflict: 'id' })
  if (error) {
    console.warn('Envoi score échoué :', error.message)
    return { ok: false, raison: error.message }
  }
  return { ok: true }
}

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