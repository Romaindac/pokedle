// ============================================================
// RAIDS — contenu endgame
// Un raid = 3 vagues : 6 petits Pokémon → 2 mini-boss → 1 gros boss capturable.
// Le gros boss est un Pokémon SPÉCIAL (forme méga/déchaînée, id >= 10000) qui
// rejoint le Pokédex spécial une fois capturé.
//
// - debloqueA : nombre de zones franchies requis pour accéder au raid (endgame progressif).
// - cooldownMs : temps avant de pouvoir refaire CE raid (cooldown par raid).
// - tauxCaptureBoss : chance de capture du gros boss à la fin (faut des balls, peut rater).
// - soinEntreVagues : fraction de PV max redonnée à l'équipe entre chaque vague (+30%).
// - vagues : 3 tableaux de noms PokeAPI (vague 1, vague 2, vague 3 = le boss seul).
// - niveau : niveau de base des Pokémon du raid (le boss est renforcé, voir App.jsx).
// ============================================================

// Soin de PV (fraction du max) redonné à l'équipe entre deux vagues.
export const SOIN_ENTRE_VAGUES = 0.30

// Cooldown standard d'un raid : 1 heure.
export const COOLDOWN_RAID_MS = 60 * 60 * 1000

// Renforcement du gros boss : très tanky (PV ×5) mais attaque modérée (×3) pour
// éviter les one-shot. Combat long et épique plutôt que brutal.
export const FORCE_BOSS_RAID_PV = 5
export const FORCE_BOSS_RAID_ATK = 3
// (compat : ancienne constante unique, gardée au cas où)
export const FORCE_BOSS_RAID = 5

// Taux de capture FIXE du boss de raid, selon la ball utilisée (identique pour tous les raids).
// Volontairement dur : le boss de raid est une grosse prise. Master Ball = garanti.
export const TAUX_CAPTURE_BOSS_RAID = {
  poke: 0.02,    // 2%
  super: 0.03,   // 3%
  hyper: 0.05,   // 5%
  master: 1,     // 100% (garanti)
}

export const RAIDS = [
  {
    id: 'raid_dragons',
    nom: 'L\'Aire des Dragons',
    theme: 'Dragon',
    emoji: '🐉',
    debloqueA: 30,          // 30 zones franchies
    niveau: 60,
    cooldownMs: COOLDOWN_RAID_MS,
    soinEntreVagues: SOIN_ENTRE_VAGUES,
    tauxCaptureBoss: 0.15,
    vagues: [
      ['gible', 'bagon', 'deino', 'dratini', 'swablu', 'axew'], // 6 petits
      ['gabite', 'shelgon'],                                     // 2 mini-boss
      ['garchomp-mega'],                                         // gros boss
    ],
    // Le gros boss (Pokémon spécial à débloquer dans le Pokédex spécial).
    boss: { nom: 'garchomp-mega', nomFr: 'Carchacrok Méga', id: 10058 },
    recompense: { argent: 20000, bonbons: 3 },
  },
  {
    id: 'raid_fossiles',
    nom: 'Réveil Préhistorique',
    theme: 'Roche',
    emoji: '🦴',
    debloqueA: 50,
    niveau: 75,
    cooldownMs: COOLDOWN_RAID_MS,
    soinEntreVagues: SOIN_ENTRE_VAGUES,
    tauxCaptureBoss: 0.12,
    vagues: [
      ['omanyte', 'kabuto', 'lileep', 'anorith', 'cranidos', 'shieldon'],
      ['tyrunt', 'amaura'],
      ['aerodactyl-mega'],
    ],
    boss: { nom: 'aerodactyl-mega', nomFr: 'Ptéra Méga', id: 10042 },
    recompense: { argent: 30000, bonbons: 3 },
  },
  {
    id: 'raid_spectres',
    nom: 'Le Sanctuaire Spectral',
    theme: 'Spectre',
    emoji: '👻',
    debloqueA: 70,
    niveau: 90,
    cooldownMs: COOLDOWN_RAID_MS,
    soinEntreVagues: SOIN_ENTRE_VAGUES,
    tauxCaptureBoss: 0.10,
    vagues: [
      ['gastly', 'shuppet', 'duskull', 'misdreavus', 'sableye', 'drifloon'],
      ['haunter', 'banette'],
      ['hoopa-unbound'],
    ],
    boss: { nom: 'hoopa-unbound', nomFr: 'Hoopa Déchaîné', id: 10086 },
    recompense: { argent: 45000, bonbons: 4 },
  },
]

// Trouve un raid par son id.
export function raidParId(id) {
  return RAIDS.find((r) => r.id === id) || null
}

// Un raid est-il débloqué (assez de zones franchies) ?
export function raidDebloque(raid, nbZones) {
  return nbZones >= raid.debloqueA
}

// Un raid est-il disponible MAINTENANT (débloqué + cooldown écoulé) ?
// cooldowns = objet { [raidId]: timestampProchaineDispo }.
export function raidDisponible(raid, nbZones, cooldowns) {
  if (!raidDebloque(raid, nbZones)) return false
  const prochain = (cooldowns && cooldowns[raid.id]) || 0
  return Date.now() >= prochain
}

// Temps restant (ms) avant que le raid soit de nouveau disponible (0 si dispo).
export function tempsRestantRaid(raid, cooldowns) {
  const prochain = (cooldowns && cooldowns[raid.id]) || 0
  return Math.max(0, prochain - Date.now())
}

// État d'un raid pour l'affichage : 'verrouille' | 'disponible' | 'cooldown'.
export function etatRaid(raid, nbZones, cooldowns) {
  if (!raidDebloque(raid, nbZones)) return 'verrouille'
  return tempsRestantRaid(raid, cooldowns) > 0 ? 'cooldown' : 'disponible'
}

// URL du sprite d'un boss de raid (par id PokeAPI, comme les spéciaux).
export function spriteBossRaid(id, shiny = false) {
  const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
  return base + (shiny ? 'shiny/' : '') + id + '.png'
}

// Formatte un temps en ms → "12 min" ou "1 h 03" (pour l'affichage du cooldown).
export function formaterCooldown(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  if (h > 0) return `${h} h ${String(min).padStart(2, '0')}`
  if (min > 0) return `${min} min ${String(sec).padStart(2, '0')}`
  return `${sec} s`
}