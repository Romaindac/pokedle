// Registre mondial des fusions (Supabase).
// Le PREMIER joueur a creer une fusion donnee en devient le decouvreur officiel,
// visible par tous. Une decouverte est definitive (pas d'update cote base).
import { supabase } from './supabase'
import { chargerIdentite, nettoyerPseudo } from './apiClassement'

// Cle unique d'une fusion : ids NATIONAUX "tete-corps".
export function cleFusion(teteId, corpsId) {
  return `${teteId}-${corpsId}`
}

// Tente d'enregistrer une decouverte. Si la fusion est deja decouverte,
// l'insertion est ignoree (le premier garde son titre).
// Renvoie { ok, premiere, cle, ligne } :
//   premiere = true si CE joueur vient de faire la PREMIERE decouverte mondiale.
export async function enregistrerDecouverte(fusion) {
  const identite = chargerIdentite()
  if (!identite || !identite.pseudo || !fusion || !fusion.teteId || !fusion.corpsId) {
    return { ok: false, premiere: false }
  }
  const cle = cleFusion(fusion.teteId, fusion.corpsId)
  const ligne = {
    cle,
    tete_id: fusion.teteId,
    corps_id: fusion.corpsId,
    nom: String(fusion.nom || '').slice(0, 40),
    pseudo: nettoyerPseudo(identite.pseudo),
    joueur_id: identite.id || null,
  }
  // ignoreDuplicates : si la cle existe deja, on n'ecrase RIEN.
  // .select() renvoie la ligne seulement si elle vient d'etre inseree.
  const { data, error } = await supabase
    .from('registre_fusions')
    .upsert(ligne, { onConflict: 'cle', ignoreDuplicates: true })
    .select()
  if (error) {
    console.warn('Enregistrement decouverte echoue :', error.message)
    return { ok: false, premiere: false, cle }
  }
  const premiere = Array.isArray(data) && data.length > 0
  return { ok: true, premiere, cle, ligne: premiere ? ligne : null }
}

// Charge tout le registre. Renvoie { ok, table } ou table = { "tete-corps": { pseudo, nom, cree_le } }.
export async function chargerRegistre(limite = 2000) {
  const { data, error } = await supabase
    .from('registre_fusions')
    .select('cle, pseudo, nom, cree_le')
    .order('cree_le', { ascending: true })
    .limit(limite)
  if (error) {
    console.warn('Lecture registre echouee :', error.message)
    return { ok: false, table: {} }
  }
  const table = {}
  for (const l of data || []) {
    if (l && l.cle && !table[l.cle]) table[l.cle] = { pseudo: l.pseudo, nom: l.nom, cree_le: l.cree_le }
  }
  return { ok: true, table }
}