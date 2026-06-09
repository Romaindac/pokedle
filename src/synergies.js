// ============================================================
// SYNERGIES D'ÉQUIPE
// Des combos de rôles débloquent des bonus passifs pendant le combat.
// Module autonome : calcule les bonus à partir de la composition.
// Les bonus sont APPLIQUÉS comme des multiplicateurs/fractions que le
// moteur lit une fois par combat (pas de NaN possible : tout est borné).
// ============================================================

import { roleEffectif } from './roles'

// Compte les rôles effectifs d'une équipe (Joker compte dans sa case choisie).
function compterRolesEffectifs(equipe) {
  const c = { tank: 0, dps: 0, eclaireur: 0, soutien: 0 }
  for (const p of (equipe || [])) {
    if (!p) continue
    const r = roleEffectif(p)
    if (c[r] !== undefined) c[r] += 1
  }
  return c
}

// Définition des synergies. condition(c) reçoit le compte de rôles.
// effets : fractions appliquées à toute l'équipe (bornées côté moteur).
export const SYNERGIES = {
  forteresse: {
    nom: 'Forteresse', emoji: '🏰', couleur: '#48cae4',
    description: 'Tank + 2 Soutiens : +15% PV et -10% dégâts subis',
    condition: (c) => c.tank >= 1 && c.soutien >= 2,
    effets: { bonusPvEquipe: 0.15, reducDegatsEquipe: 0.10 },
  },
  blitz: {
    nom: 'Blitz', emoji: '⚡', couleur: '#ffd60a',
    description: '2 Éclaireurs + 1 DPS : +12% vitesse de jauge et +10% dégâts',
    condition: (c) => c.eclaireur >= 2 && c.dps >= 1,
    effets: { bonusVitesseEquipe: 0.12, bonusDegatsEquipe: 0.10 },
  },
  tempete: {
    nom: 'Tempête', emoji: '🌪️', couleur: '#9b5de5',
    description: '2 DPS + 1 Éclaireur : +18% dégâts, +8% chance de critique',
    condition: (c) => c.dps >= 2 && c.eclaireur >= 1,
    effets: { bonusDegatsEquipe: 0.18, bonusCritEquipe: 0.08 },
  },
  equilibre: {
    nom: 'Équilibre Parfait', emoji: '⚖️', couleur: '#80ed99',
    description: '1 de chaque rôle : +10% à toutes les stats de l\'équipe',
    condition: (c) => c.tank >= 1 && c.dps >= 1 && c.eclaireur >= 1 && c.soutien >= 1,
    effets: { bonusPvEquipe: 0.10, bonusDegatsEquipe: 0.10, bonusVitesseEquipe: 0.10, bonusDefenseEquipe: 0.10 },
  },
  bastion: {
    nom: 'Bastion', emoji: '🛡️', couleur: '#5bc47f',
    description: '2 Tanks : +25% PV mais -5% vitesse (mur défensif)',
    condition: (c) => c.tank >= 2,
    effets: { bonusPvEquipe: 0.25, bonusVitesseEquipe: -0.05 },
  },
  guerre_totale: {
    nom: 'Guerre Totale', emoji: '⚔️', couleur: '#e63946',
    description: '2 DPS + 2 Soutiens : +22% dégâts et soins renforcés',
    condition: (c) => c.dps >= 2 && c.soutien >= 2,
    effets: { bonusDegatsEquipe: 0.22, bonusSoinEquipe: 0.20 },
  },
  cavalerie: {
    nom: 'Cavalerie', emoji: '🐎', couleur: '#ffb703',
    description: '2 Éclaireurs + 2 Soutiens : +20% vitesse, +12% PV',
    condition: (c) => c.eclaireur >= 2 && c.soutien >= 2,
    effets: { bonusVitesseEquipe: 0.20, bonusPvEquipe: 0.12 },
  },
}

// Calcule les synergies ACTIVES pour une équipe.
export function synergiesActives(equipe) {
  const c = compterRolesEffectifs(equipe)
  const actives = []
  for (const cle of Object.keys(SYNERGIES)) {
    const s = SYNERGIES[cle]
    if (s.condition(c)) actives.push({ cle, ...s })
  }
  return actives
}

// Décrit ce qu'il manque pour activer une synergie (texte court).
// Retourne '' si la synergie est déjà active.
const NOMS_ROLES = { tank: 'Tank', dps: 'DPS', eclaireur: 'Éclaireur', soutien: 'Soutien' }
const BESOINS_SYNERGIE = {
  forteresse:   { tank: 1, soutien: 2 },
  blitz:        { eclaireur: 2, dps: 1 },
  tempete:      { dps: 2, eclaireur: 1 },
  equilibre:    { tank: 1, dps: 1, eclaireur: 1, soutien: 1 },
  bastion:      { tank: 2 },
  guerre_totale:{ dps: 2, soutien: 2 },
  cavalerie:    { eclaireur: 2, soutien: 2 },
}
export function manquePourSynergie(equipe, cle) {
  const c = compterRolesEffectifs(equipe)
  const besoin = BESOINS_SYNERGIE[cle]
  if (!besoin) return ''
  const manques = []
  for (const role of Object.keys(besoin)) {
    const requis = besoin[role]
    const actuel = c[role] || 0
    if (actuel < requis) manques.push(`${requis - actuel} ${NOMS_ROLES[role]}`)
  }
  if (manques.length === 0) return ''
  return 'Il te manque : ' + manques.join(', ')
}

// Agrège tous les effets des synergies actives en un seul objet de bonus.
// Les effets s'additionnent puis sont BORNÉS pour éviter tout abus.
export function bonusSynergies(equipe) {
  const total = {
    bonusPvEquipe: 0, bonusDegatsEquipe: 0, bonusVitesseEquipe: 0,
    bonusDefenseEquipe: 0, bonusCritEquipe: 0, bonusSoinEquipe: 0,
    reducDegatsEquipe: 0,
  }
  for (const s of synergiesActives(equipe)) {
    for (const k of Object.keys(s.effets)) {
      if (total[k] !== undefined) total[k] += s.effets[k]
    }
  }
  // Bornes de sécurité (anti-abus / anti-NaN).
  total.bonusPvEquipe     = Math.max(-0.5, Math.min(0.6, total.bonusPvEquipe))
  total.bonusDegatsEquipe = Math.max(-0.5, Math.min(0.6, total.bonusDegatsEquipe))
  total.bonusVitesseEquipe= Math.max(-0.5, Math.min(0.6, total.bonusVitesseEquipe))
  total.bonusDefenseEquipe= Math.max(-0.5, Math.min(0.6, total.bonusDefenseEquipe))
  total.bonusCritEquipe   = Math.max(0, Math.min(0.3, total.bonusCritEquipe))
  total.bonusSoinEquipe   = Math.max(0, Math.min(0.5, total.bonusSoinEquipe))
  total.reducDegatsEquipe = Math.max(0, Math.min(0.4, total.reducDegatsEquipe))
  return total
}