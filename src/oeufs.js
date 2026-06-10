// oeufs.js - Systeme d'oeufs / elevage (Centre d'Elevage).
// 6 types d'oeufs avec du contenu unique. Eclosion par combats (long terme).
// Monnaie dediee : jetons d'elevage.
// IMPORTANT : fichier en pur ASCII (pas d'accents) pour eviter les soucis d'encodage.

export const NB_INCUBATEURS_DEPART = 2
export const NB_INCUBATEURS_MAX = 5
// Compat : ancienne constante (certains anciens imports). Vaut le MAX pour dimensionner les tableaux.
export const NB_INCUBATEURS = NB_INCUBATEURS_MAX

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
    combats: 200, shiny: 0.02, ivMin: 8, prix: 40,
  },
  rare: {
    cle: 'rare', nom: 'Oeuf rare', emoji: '',
    couleur: '#3b82f6', accent: '#93c5fd',
    combats: 500, shiny: 0.03, ivMin: 16, prix: 100,
  },
  epique: {
    cle: 'epique', nom: 'Oeuf epique', emoji: '',
    couleur: '#a855f7', accent: '#d8b4fe',
    combats: 1200, shiny: 0.05, ivMin: 24, prix: 250,
  },
  chromatique: {
    cle: 'chromatique', nom: 'Oeuf Chromatique', emoji: 'CHROMA',
    couleur: '#f59e0b', accent: '#fde68a',
    combats: 2500, shiny: 0.60, ivMin: 18, prix: 600,
  },
  parfait: {
    cle: 'parfait', nom: 'Oeuf Parfait', emoji: 'PARFAIT',
    couleur: '#10b981', accent: '#6ee7b7',
    combats: 3500, shiny: 0.08, ivMin: 28, prix: 800,
  },
  mystere: {
    cle: 'mystere', nom: 'Oeuf Mystere', emoji: '?',
    couleur: '#ec4899', accent: '#f9a8d4',
    combats: 3000, shiny: 0.10, ivMin: 20, prix: 1000, special: 'mystere',
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

export function combatsRequis(oeuf, am) {
  const base = infoOeuf(oeuf.rarete).combats
  const reduction = bonusVitesse(am) // 0 a 0.30
  return Math.max(1, Math.round(base * (1 - reduction)))
}

export function pretAEclore(oeuf, am) {
  return oeuf.progression >= combatsRequis(oeuf, am)
}

export function pourcentageOeuf(oeuf, am) {
  return Math.min(100, Math.round((oeuf.progression / combatsRequis(oeuf, am)) * 100))
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

// IV bonifies selon le type d'oeuf + bonus Qualite (min garanti, plafonne a 31).
export function ivDepuisOeuf(oeuf, am) {
  const ivMin = Math.min(31, infoOeuf(oeuf.rarete).ivMin + Math.round(bonusQualite(am)))
  const tire = () => ivMin + Math.floor(Math.random() * (31 - ivMin + 1))
  return { pv: tire(), attaque: tire(), vitesse: tire(), defense: tire() }
}

// Shiny ? selon le type d'oeuf + bonus Chaleur (plafonne a 95%).
export function shinyDepuisOeuf(oeuf, am) {
  const chance = Math.min(0.95, infoOeuf(oeuf.rarete).shiny + bonusChaleur(am))
  return Math.random() < chance
}


// ============================================================
// AMELIORATIONS DU CENTRE D'ELEVAGE (progression long terme)
// 5 ameliorations x 10 niveaux + achat d'incubateurs supplementaires.
// Etat stocke : { vitesse, chaleur, qualite, chance, rendement, incubateurs }
// (incubateurs = NOMBRE d'incubateurs debloques, de DEPART a MAX)
// ============================================================

export const NIVEAU_MAX_AMELIO = 10

// Definition des 5 ameliorations globales.
// effetParNiveau : valeur ajoutee par niveau. prixBase / facteur : cout exponentiel.
export const AMELIORATIONS_ELEVAGE = {
  vitesse: {
    cle: 'vitesse', nom: 'Vitesse', emoji: 'V', couleur: '#3b82f6',
    desc: 'Reduit les combats necessaires pour eclore.',
    effetParNiveau: 0.03, // -3% combats / niveau (max -30%)
    suffixe: '% eclosion plus rapide',
    prixBase: 50, facteur: 1.6,
  },
  chaleur: {
    cle: 'chaleur', nom: 'Chaleur', emoji: 'C', couleur: '#f59e0b',
    desc: 'Augmente la chance de shiny de tous les oeufs.',
    effetParNiveau: 0.015, // +1.5% shiny / niveau (max +15%)
    suffixe: '% shiny',
    prixBase: 80, facteur: 1.7,
  },
  qualite: {
    cle: 'qualite', nom: 'Qualite', emoji: 'Q', couleur: '#10b981',
    desc: 'Augmente les IV minimum garantis a l\'eclosion.',
    effetParNiveau: 1, // +1 IV min / niveau (max +10)
    suffixe: ' IV min',
    prixBase: 80, facteur: 1.7,
  },
  chance: {
    cle: 'chance', nom: 'Chance', emoji: 'L', couleur: '#a855f7',
    desc: 'Augmente la chance de trouver un oeuf en combat.',
    effetParNiveau: 0.003, // +0.3% drop / niveau (max +3%, double le taux de base)
    suffixe: '% drop d\'oeuf',
    prixBase: 60, facteur: 1.65,
  },
  rendement: {
    cle: 'rendement', nom: 'Rendement', emoji: 'J', couleur: '#fcd34d',
    desc: 'Augmente la chance de gagner un jeton en combat.',
    effetParNiveau: 0.005, // +0.5% jeton / niveau (max +5%)
    suffixe: '% jeton',
    prixBase: 60, facteur: 1.65,
  },
}

export const ORDRE_AMELIORATIONS = ['vitesse', 'chaleur', 'qualite', 'chance', 'rendement']

// Etat par defaut des ameliorations (niveau 0 partout, incubateurs = depart).
export function ameliorationsParDefaut() {
  return { vitesse: 0, chaleur: 0, qualite: 0, chance: 0, rendement: 0, incubateurs: NB_INCUBATEURS_DEPART }
}

// Prix du prochain niveau d'une amelioration (exponentiel). Renvoie null si max.
export function prixAmelioration(cle, niveauActuel) {
  const a = AMELIORATIONS_ELEVAGE[cle]
  if (!a || niveauActuel >= NIVEAU_MAX_AMELIO) return null
  return Math.round(a.prixBase * Math.pow(a.facteur, niveauActuel))
}

// Prix du prochain incubateur (du depart vers le max). Renvoie null si max atteint.
export function prixIncubateur(nbActuel) {
  if (nbActuel >= NB_INCUBATEURS_MAX) return null
  // 3e incubateur = 300, 4e = 700, 5e = 1500 (paliers costauds).
  const paliers = { 2: 300, 3: 700, 4: 1500 }
  return paliers[nbActuel] || null
}

// --- Effets calcules a partir de l'etat d'ameliorations ---
export function bonusVitesse(am) { return (am?.vitesse || 0) * AMELIORATIONS_ELEVAGE.vitesse.effetParNiveau }
export function bonusChaleur(am) { return (am?.chaleur || 0) * AMELIORATIONS_ELEVAGE.chaleur.effetParNiveau }
export function bonusQualite(am) { return (am?.qualite || 0) * AMELIORATIONS_ELEVAGE.qualite.effetParNiveau }
export function bonusChance(am) { return (am?.chance || 0) * AMELIORATIONS_ELEVAGE.chance.effetParNiveau }
export function nbIncubateurs(am) { return am?.incubateurs || NB_INCUBATEURS_DEPART }
export function bonusRendement(am) { return (am?.rendement || 0) * AMELIORATIONS_ELEVAGE.rendement.effetParNiveau }