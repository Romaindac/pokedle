// ============================================================
// RAIDS — contenu endgame (20 raids)
// Un raid = 4 VAGUES : 6 petits → 3 mini-boss → 2 costauds → 1 gros boss capturable.
// Le gros boss est un Pokémon SPÉCIAL (forme méga/déchaînée, id >= 10000) qui
// rejoint le Pokédex spécial une fois capturé (1re capture).
//
// - debloqueA : nb de zones franchies requis pour accéder au raid.
// - cooldownMs : temps avant de pouvoir refaire CE raid (varie selon le raid).
// - tauxCaptureBoss : chance de capture du gros boss (1re fois ; balls requises).
// - soinEntreVagues : fraction de PV max redonnée à l'équipe entre vagues (+25%).
// - vagues : 4 tableaux de noms PokeAPI (v1, v2, v3, v4 = le boss seul).
// - niveau : niveau de base des Pokémon du raid (boss renforcé, voir App.jsx).
// - recompense.argent / .bonbons : récompense de 1re complétion.
// ============================================================

// Soin de PV (fraction du max) redonné à l'équipe entre deux vagues.
// Abaissé à 0.25 (4 vagues = plus long, on veut que les PV comptent).
export const SOIN_ENTRE_VAGUES = 0.25

// Cooldowns possibles selon la "lourdeur" du raid.
export const COOLDOWN_COURT = 30 * 60 * 1000      // 30 min (raids d'entrée)
export const COOLDOWN_RAID_MS = 60 * 60 * 1000    // 1 h (standard, compat)
export const COOLDOWN_LONG = 90 * 60 * 1000       // 1 h 30 (raids de fin)

// Renforcement du gros boss : TRÈS tanky (PV ×8) mais attaque modérée (×3)
// pour éviter les one-shot. Combat long et épique plutôt que brutal.
export const FORCE_BOSS_RAID_PV = 8
export const FORCE_BOSS_RAID_ATK = 3
// (compat : ancienne constante unique)
export const FORCE_BOSS_RAID = 8

// Taux de capture FIXE du boss de raid selon la ball (identique pour tous).
// Volontairement dur : grosse prise. Master Ball = garanti.
export const TAUX_CAPTURE_BOSS_RAID = {
  poke: 0.02,
  super: 0.03,
  hyper: 0.05,
  master: 1,
}

// Nombre de bonbons IV donnés quand on REFAIT un raid déjà complété.
// Scale avec le niveau du raid : 1 + floor(niveau/25).
// (niv 55 → 3, niv 80 → 4, niv 110 → 5, niv 140 → 6...)
export function bonbonsIvRefarm(raid) {
  return 1 + Math.floor((raid.niveau || 50) / 25)
}

export const RAIDS = [
  // ---------- PALIER 1 : entrée (cooldown court) ----------
  {
    id: 'raid_dragons', nom: "L'Aire des Dragons", theme: 'Dragon', emoji: '🐉',
    debloqueA: 25, niveau: 55, cooldownMs: COOLDOWN_COURT, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.15,
    vagues: [
      ['gible', 'bagon', 'deino', 'dratini', 'swablu', 'axew'],
      ['gabite', 'shelgon', 'jangmo-o'],
      ['fraxure', 'sliggoo'],
      ['garchomp-mega'],
    ],
    boss: { nom: 'garchomp-mega', nomFr: 'Carchacrok Méga', id: 10058 },
    recompense: { argent: 20000, bonbons: 3 },
  },
  {
    id: 'raid_fossiles', nom: 'Réveil Préhistorique', theme: 'Roche', emoji: '🦴',
    debloqueA: 30, niveau: 60, cooldownMs: COOLDOWN_COURT, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.13,
    vagues: [
      ['omanyte', 'kabuto', 'lileep', 'anorith', 'cranidos', 'shieldon'],
      ['tyrunt', 'amaura', 'archen'],
      ['rampardos', 'bastiodon'],
      ['aerodactyl-mega'],
    ],
    boss: { nom: 'aerodactyl-mega', nomFr: 'Ptéra Méga', id: 10042 },
    recompense: { argent: 24000, bonbons: 3 },
  },
  {
    id: 'raid_insectes', nom: 'La Ruche Frénétique', theme: 'Insecte', emoji: '🐝',
    debloqueA: 32, niveau: 62, cooldownMs: COOLDOWN_COURT, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.13,
    vagues: [
      ['weedle', 'caterpie', 'wurmple', 'kricketot', 'scatterbug', 'grubbin'],
      ['beedrill', 'butterfree', 'ariados'],
      ['scizor', 'vikavolt'],
      ['beedrill-mega'],
    ],
    boss: { nom: 'beedrill-mega', nomFr: 'Dardargnan Méga', id: 10090 },
    recompense: { argent: 26000, bonbons: 3 },
  },
  {
    id: 'raid_plantes', nom: 'La Forêt Vorace', theme: 'Plante', emoji: '🌿',
    debloqueA: 35, niveau: 64, cooldownMs: COOLDOWN_COURT, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.13,
    vagues: [
      ['bulbasaur', 'oddish', 'bellsprout', 'seedot', 'cottonee', 'bounsweet'],
      ['ivysaur', 'gloom', 'weepinbell'],
      ['venusaur', 'roserade'],
      ['venusaur-mega'],
    ],
    boss: { nom: 'venusaur-mega', nomFr: 'Florizarre Méga', id: 10033 },
    recompense: { argent: 28000, bonbons: 3 },
  },

  // ---------- PALIER 2 : milieu (cooldown standard 1 h) ----------
  {
    id: 'raid_feu', nom: 'Le Cœur du Volcan', theme: 'Feu', emoji: '🔥',
    debloqueA: 40, niveau: 70, cooldownMs: COOLDOWN_RAID_MS, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.12,
    vagues: [
      ['charmander', 'vulpix', 'growlithe', 'litten', 'fennekin', 'torchic'],
      ['charmeleon', 'arcanine', 'ninetales'],
      ['charizard', 'incineroar'],
      ['charizard-mega-x'],
    ],
    boss: { nom: 'charizard-mega-x', nomFr: 'Dracaufeu Méga X', id: 10034 },
    recompense: { argent: 32000, bonbons: 4 },
  },
  {
    id: 'raid_eau', nom: 'Les Abysses Déchaînées', theme: 'Eau', emoji: '🌊',
    debloqueA: 44, niveau: 72, cooldownMs: COOLDOWN_RAID_MS, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.12,
    vagues: [
      ['magikarp', 'tympole', 'wooper', 'mudkip', 'squirtle', 'wingull'],
      ['gyarados', 'wartortle', 'quagsire'],
      ['blastoise', 'swampert'],
      ['gyarados-mega'],
    ],
    boss: { nom: 'gyarados-mega', nomFr: 'Léviator Méga', id: 10041 },
    recompense: { argent: 34000, bonbons: 4 },
  },
  {
    id: 'raid_electrique', nom: 'La Tempête Électrique', theme: 'Électrik', emoji: '⚡',
    debloqueA: 47, niveau: 74, cooldownMs: COOLDOWN_RAID_MS, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.12,
    vagues: [
      ['pikachu', 'mareep', 'electrike', 'blitzle', 'tynamo', 'voltorb'],
      ['raichu', 'ampharos', 'manectric'],
      ['electivire', 'luxray'],
      ['manectric-mega'],
    ],
    boss: { nom: 'manectric-mega', nomFr: 'Élecsprint Méga', id: 10055 },
    recompense: { argent: 36000, bonbons: 4 },
  },
  {
    id: 'raid_psy', nom: 'Le Temple de l\'Esprit', theme: 'Psy', emoji: '🔮',
    debloqueA: 50, niveau: 76, cooldownMs: COOLDOWN_RAID_MS, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.11,
    vagues: [
      ['abra', 'ralts', 'espurr', 'gothita', 'solosis', 'natu'],
      ['kadabra', 'kirlia', 'gardevoir'],
      ['alakazam', 'gallade'],
      ['gardevoir-mega'],
    ],
    boss: { nom: 'gardevoir-mega', nomFr: 'Gardevoir Méga', id: 10051 },
    recompense: { argent: 38000, bonbons: 4 },
  },
  {
    id: 'raid_combat', nom: 'L\'Arène des Lutteurs', theme: 'Combat', emoji: '🥊',
    debloqueA: 53, niveau: 78, cooldownMs: COOLDOWN_RAID_MS, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.11,
    vagues: [
      ['machop', 'mankey', 'makuhita', 'timburr', 'mienfoo', 'tyrogue'],
      ['machoke', 'primeape', 'hariyama'],
      ['machamp', 'lucario'],
      ['lucario-mega'],
    ],
    boss: { nom: 'lucario-mega', nomFr: 'Lucario Méga', id: 10059 },
    recompense: { argent: 40000, bonbons: 4 },
  },
  {
    id: 'raid_acier', nom: 'La Forge d\'Acier', theme: 'Acier', emoji: '⚙️',
    debloqueA: 56, niveau: 80, cooldownMs: COOLDOWN_RAID_MS, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.11,
    vagues: [
      ['beldum', 'aron', 'magnemite', 'klink', 'ferroseed', 'pawniard'],
      ['metang', 'lairon', 'magneton'],
      ['metagross', 'aggron'],
      ['metagross-mega'],
    ],
    boss: { nom: 'metagross-mega', nomFr: 'Métalosse Méga', id: 10076 },
    recompense: { argent: 42000, bonbons: 4 },
  },
  {
    id: 'raid_normal', nom: 'La Horde Sauvage', theme: 'Normal', emoji: '🐾',
    debloqueA: 58, niveau: 82, cooldownMs: COOLDOWN_RAID_MS, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.10,
    vagues: [
      ['rattata', 'zigzagoon', 'bidoof', 'lillipup', 'bunnelby', 'skwovet'],
      ['raticate', 'linoone', 'watchog'],
      ['kangaskhan', 'snorlax'],
      ['kangaskhan-mega'],
    ],
    boss: { nom: 'kangaskhan-mega', nomFr: 'Kangourex Méga', id: 10039 },
    recompense: { argent: 44000, bonbons: 4 },
  },

  // ---------- PALIER 3 : endgame (cooldown long) ----------
  {
    id: 'raid_spectres', nom: 'Le Sanctuaire Spectral', theme: 'Spectre', emoji: '👻',
    debloqueA: 60, niveau: 85, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.10,
    vagues: [
      ['gastly', 'shuppet', 'duskull', 'misdreavus', 'sableye', 'drifloon'],
      ['haunter', 'banette', 'dusclops'],
      ['gengar', 'mismagius'],
      ['gengar-mega'],
    ],
    boss: { nom: 'gengar-mega', nomFr: 'Ectoplasma Méga', id: 10038 },
    recompense: { argent: 46000, bonbons: 5 },
  },
  {
    id: 'raid_tenebres', nom: 'L\'Antre des Ténèbres', theme: 'Ténèbres', emoji: '🌑',
    debloqueA: 63, niveau: 87, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.10,
    vagues: [
      ['poochyena', 'houndour', 'purrloin', 'sandile', 'zorua', 'pawniard'],
      ['mightyena', 'houndoom', 'krookodile'],
      ['tyranitar', 'zoroark'],
      ['houndoom-mega'],
    ],
    boss: { nom: 'houndoom-mega', nomFr: 'Démolosse Méga', id: 10048 },
    recompense: { argent: 48000, bonbons: 5 },
  },
  {
    id: 'raid_glace', nom: 'Le Pic Gelé', theme: 'Glace', emoji: '❄️',
    debloqueA: 66, niveau: 89, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.10,
    vagues: [
      ['swinub', 'snorunt', 'spheal', 'snover', 'vanillite', 'bergmite'],
      ['piloswine', 'glalie', 'sealeo'],
      ['mamoswine', 'abomasnow'],
      ['abomasnow-mega'],
    ],
    boss: { nom: 'abomasnow-mega', nomFr: 'Blizzaroi Méga', id: 10060 },
    recompense: { argent: 50000, bonbons: 5 },
  },
  {
    id: 'raid_roche', nom: 'L\'Éboulement Titanesque', theme: 'Roche', emoji: '🪨',
    debloqueA: 69, niveau: 91, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.10,
    vagues: [
      ['geodude', 'roggenrola', 'rhyhorn', 'larvitar', 'rolycoly', 'nosepass'],
      ['graveler', 'boldore', 'rhydon'],
      ['golem', 'rhyperior'],
      ['aggron-mega'],
    ],
    boss: { nom: 'aggron-mega', nomFr: 'Galeking Méga', id: 10057 },
    recompense: { argent: 52000, bonbons: 5 },
  },
  {
    id: 'raid_fee', nom: 'La Clairière Féerique', theme: 'Fée', emoji: '🧚',
    debloqueA: 72, niveau: 93, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.09,
    vagues: [
      ['clefairy', 'jigglypuff', 'snubbull', 'spritzee', 'swirlix', 'cutiefly'],
      ['clefable', 'wigglytuff', 'granbull'],
      ['gardevoir', 'sylveon'],
      ['mawile-mega'],
    ],
    boss: { nom: 'mawile-mega', nomFr: 'Mysdibule Méga', id: 10052 },
    recompense: { argent: 54000, bonbons: 5 },
  },

  // ---------- PALIER 4 : légendaires primal / déchaînés (le sommet) ----------
  {
    id: 'raid_hoopa', nom: 'La Faille Dimensionnelle', theme: 'Psy/Spectre', emoji: '🌀',
    debloqueA: 76, niveau: 100, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.08,
    vagues: [
      ['baltoy', 'sigilyph', 'elgyem', 'gothita', 'inkay', 'espurr'],
      ['claydol', 'beheeyem', 'malamar'],
      ['metagross', 'gengar'],
      ['hoopa-unbound'],
    ],
    boss: { nom: 'hoopa-unbound', nomFr: 'Hoopa Déchaîné', id: 10086 },
    recompense: { argent: 60000, bonbons: 6 },
  },
  {
    id: 'raid_kyogre', nom: 'Le Déluge Primordial', theme: 'Eau', emoji: '🌧️',
    debloqueA: 82, niveau: 110, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.07,
    vagues: [
      ['magikarp', 'clamperl', 'wailmer', 'lapras', 'sharpedo', 'relicanth'],
      ['gyarados', 'wailord', 'milotic'],
      ['kingdra', 'gyarados-mega'],
      ['kyogre-primal'],
    ],
    boss: { nom: 'kyogre-primal', nomFr: 'Kyogre Primal', id: 10077 },
    recompense: { argent: 70000, bonbons: 6 },
  },
  {
    id: 'raid_groudon', nom: 'Le Cataclysme Terrestre', theme: 'Sol', emoji: '🌋',
    debloqueA: 88, niveau: 120, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.06,
    vagues: [
      ['numel', 'phanpy', 'trapinch', 'hippopotas', 'mudbray', 'silicobra'],
      ['camerupt', 'donphan', 'flygon'],
      ['hippowdon', 'garchomp'],
      ['groudon-primal'],
    ],
    boss: { nom: 'groudon-primal', nomFr: 'Groudon Primal', id: 10078 },
    recompense: { argent: 80000, bonbons: 7 },
  },
  {
    id: 'raid_rayquaza', nom: 'Le Seigneur des Cieux', theme: 'Dragon/Vol', emoji: '☄️',
    debloqueA: 94, niveau: 135, cooldownMs: COOLDOWN_LONG, soinEntreVagues: SOIN_ENTRE_VAGUES, tauxCaptureBoss: 0.05,
    vagues: [
      ['dratini', 'bagon', 'gible', 'deino', 'goomy', 'swablu'],
      ['dragonair', 'shelgon', 'gabite'],
      ['dragonite', 'salamence', 'garchomp'],
      ['rayquaza-mega'],
    ],
    boss: { nom: 'rayquaza-mega', nomFr: 'Rayquaza Méga', id: 10079 },
    recompense: { argent: 100000, bonbons: 8 },
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

// Formatte un temps en ms → "12 min" ou "1 h 03".
export function formaterCooldown(ms) {
  const totalSec = Math.ceil(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const min = Math.floor((totalSec % 3600) / 60)
  const sec = totalSec % 60
  if (h > 0) return `${h} h ${String(min).padStart(2, '0')}`
  if (min > 0) return `${min} min ${String(sec).padStart(2, '0')}`
  return `${sec} s`
}