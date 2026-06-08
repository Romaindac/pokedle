// oeufs.js - Systeme d'oeufs / elevage (Centre d'Elevage).
// 6 types d'oeufs avec du contenu unique. Eclosion par combats (long terme).
// Monnaie dediee : jetons d'elevage.
// IMPORTANT : fichier en pur ASCII (pas d'accents) pour eviter les soucis d'encodage.

export const NB_INCUBATEURS = 3

// --- Definition des types d'oeufs ---
// combats : nombre de victoires pour eclore
// shiny   : chance de shiny a l'eclosion
// ivMin   : IV minimum garanti sur chaque stat (0-31)
// prix    : cout en jetons d'elevage (0 = non achetable, seulement drop)
// special : 'bebe' | 'legendaire' | null  (pour l'oeuf mystere)
export const TYPES_OEUF = {
  commun: {
    cle: 'commun', nom: 'Oeuf commun', emoji: '',
    couleur: '#9ca3af', accent: '#d1d5db',
    combats: 300, shiny: 0.02, ivMin: 8, prix: 40,
  },
  rare: {
    cle: 'rare', nom: 'Oeuf rare', emoji: '',
    couleur: '#3b82f6', accent: '#93c5fd',
    combats: 400, shiny: 0.03, ivMin: 16, prix: 100,
  },
  epique: {
    cle: 'epique', nom: 'Oeuf epique', emoji: '',
    couleur: '#a855f7', accent: '#d8b4fe',
    combats: 500, shiny: 0.05, ivMin: 24, prix: 250,
  },
  chromatique: {
    cle: 'chromatique', nom: 'Oeuf Chromatique', emoji: 'CHROMA',
    couleur: '#f59e0b', accent: '#fde68a',
    combats: 600, shiny: 0.60, ivMin: 18, prix: 600,
  },
  parfait: {
    cle: 'parfait', nom: 'Oeuf Parfait', emoji: 'PARFAIT',
    couleur: '#10b981', accent: '#6ee7b7',
    combats: 700, shiny: 0.08, ivMin: 28, prix: 800,
  },
  mystere: {
    cle: 'mystere', nom: 'Oeuf Mystere', emoji: '?',
    couleur: '#ec4899', accent: '#f9a8d4',
    combats: 650, shiny: 0.10, ivMin: 20, prix: 1000, special: 'mystere',
  },
}

// Ordre d'affichage / d'achat en boutique.
export const ORDRE_OEUFS = ['commun', 'rare', 'epique', 'chromatique', 'parfait', 'mystere']

// --- Gains de jetons d'elevage ---
export const JETONS_PAR_ECLOSION = 2
export const JETONS_PAR_BOSS = 5
export const CHANCE_JETON_COMBAT = 0.04

// --- Drop d'oeuf gratuit en combat ---
export const TAUX_DROP_OEUF = 0.003
// Repartition de rarete d'un oeuf qui drop gratuitement (les types premium NE droppent PAS,
// ils s'achetent uniquement avec des jetons).
const POIDS_RARETE_DROP = { commun: 70, rare: 25, epique: 5 }

export function tirerRareteOeuf() {
  const total = Object.values(POIDS_RARETE_DROP).reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (const cle in POIDS_RARETE_DROP) {
    if (r < POIDS_RARETE_DROP[cle]) return cle
    r -= POIDS_RARETE_DROP[cle]
  }
  return 'commun'
}

// --- Contenu special de l'oeuf mystere ---
// Numeros de "bebes" Pokemon (formes pre-evoluees emblematiques).
export const BEBES_POKEMON = [
  172, // Pichu
  173, // Melo (Cleffa)
  174, // Toudoudou (Igglybuff)
  175, // Togepi
  236, // Debugant (Tyrogue)
  238, // Lippouti (Smoochum)
  239, // Elekid
  240, // Magby
  298, // Azurill
  360, // Okeoke (Wynaut)
  406, // Manzai (Budew)
  433, // Korillon (Chingling)
  438, // Manzai (Bonsly)
  439, // Mime Jr.
  440, // Ptiravi (Happiny)
  446, // Goinfrex (Munchlax)
  447, // Riolu
  458, // Babimanta (Mantyke)
]

// Numeros de legendaires "accessibles" via l'oeuf mystere (petite chance).
export const LEGENDAIRES_OEUF = [
  144, 145, 146, // oiseaux Kanto
  243, 244, 245, // betes Johto
  377, 378, 379, // golems Hoenn
  480, 481, 482, // lac Sinnoh
  638, 639, 640, // epees Unys
  150, 151,      // Mewtwo, Mew
]

// Chance qu'un oeuf mystere contienne un legendaire (sinon : bebe ou base aleatoire).
export const CHANCE_LEGENDAIRE_MYSTERE = 0.02
// Chance qu'un oeuf mystere contienne un bebe (le reste = base aleatoire).
export const CHANCE_BEBE_MYSTERE = 0.40

// --- Helpers ---
export function infoOeuf(cle) {
  return TYPES_OEUF[cle] || TYPES_OEUF.commun
}

export function creerOeuf(cle = 'commun') {
  return {
    id: `oeuf-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    rarete: cle,
    progression: 0,
  }
}

export function combatsRequis(oeuf) {
  return infoOeuf(oeuf.rarete).combats
}

export function pretAEclore(oeuf) {
  return oeuf.progression >= combatsRequis(oeuf)
}

export function pourcentageOeuf(oeuf) {
  return Math.min(100, Math.round((oeuf.progression / combatsRequis(oeuf)) * 100))
}

// Decide le numero de Pokemon a faire eclore pour un oeuf donne.
// Renvoie { numero, estLegendaire, estBebe }.
export function tirerContenuOeuf(oeuf) {
  const info = infoOeuf(oeuf.rarete)
  if (info.special === 'mystere') {
    const r = Math.random()
    if (r < CHANCE_LEGENDAIRE_MYSTERE) {
      const n = LEGENDAIRES_OEUF[Math.floor(Math.random() * LEGENDAIRES_OEUF.length)]
      return { numero: n, estLegendaire: true, estBebe: false }
    }
    if (r < CHANCE_LEGENDAIRE_MYSTERE + CHANCE_BEBE_MYSTERE) {
      const n = BEBES_POKEMON[Math.floor(Math.random() * BEBES_POKEMON.length)]
      return { numero: n, estLegendaire: false, estBebe: true }
    }
  }
  // Defaut : Pokemon de base aleatoire (1-1025).
  return { numero: 1 + Math.floor(Math.random() * 1025), estLegendaire: false, estBebe: false }
}

// IV bonifies selon le type d'oeuf (min garanti, le reste aleatoire jusqu'a 31).
export function ivDepuisOeuf(oeuf) {
  const ivMin = infoOeuf(oeuf.rarete).ivMin
  const tire = () => ivMin + Math.floor(Math.random() * (31 - ivMin + 1))
  return { pv: tire(), attaque: tire(), vitesse: tire(), defense: tire() }
}

// Shiny ? selon le type d'oeuf.
export function shinyDepuisOeuf(oeuf) {
  return Math.random() < infoOeuf(oeuf.rarete).shiny
}