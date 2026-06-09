// ============================================================
// apiAuth.js — Authentification (Supabase Auth, email + mot de passe)
// et stockage des sauvegardes 100% en ligne (table public.sauvegardes).
// Reutilise le meme client que le classement/PvP (./supabase).
// ============================================================
import { supabase } from './supabase'

// ---- Inscription : cree un compte (email de confirmation envoye) ----
export async function inscrire(email, motDePasse) {
  const { data, error } = await supabase.auth.signUp({
    email: (email || '').trim(),
    password: motDePasse || '',
  })
  if (error) return { ok: false, raison: error.message }
  // Si la confirmation email est active, data.session est null tant que
  // l'email n'est pas confirme : on previent l'utilisateur.
  const besoinConfirmation = !data.session
  return { ok: true, besoinConfirmation, utilisateur: data.user }
}

// ---- Connexion ----
export async function connecter(email, motDePasse) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: (email || '').trim(),
    password: motDePasse || '',
  })
  if (error) return { ok: false, raison: error.message }
  return { ok: true, session: data.session, utilisateur: data.user }
}

// ---- Deconnexion ----
export async function deconnecter() {
  const { error } = await supabase.auth.signOut()
  return { ok: !error, raison: error ? error.message : null }
}

// ---- Renvoyer l'email de confirmation ----
export async function renvoyerConfirmation(email) {
  const { error } = await supabase.auth.resend({ type: 'signup', email: (email || '').trim() })
  return { ok: !error, raison: error ? error.message : null }
}

// ---- Mot de passe oublie (envoie un email de reset) ----
export async function reinitialiserMotDePasse(email) {
  const { error } = await supabase.auth.resetPasswordForEmail((email || '').trim())
  return { ok: !error, raison: error ? error.message : null }
}

// ---- Session courante (au demarrage de l'app) ----
export async function sessionActuelle() {
  const { data } = await supabase.auth.getSession()
  return data.session || null
}

// ---- S'abonner aux changements d'auth (login / logout) ----
// callback(session) appele a chaque changement. Renvoie une fonction de desabonnement.
export function surChangementAuth(callback) {
  const { data } = supabase.auth.onAuthStateChange((_evt, session) => callback(session))
  return () => { try { data.subscription.unsubscribe() } catch {} }
}

// =====================================================================
// SAUVEGARDES CLOUD (table public.sauvegardes : user_id, slot, data, updated_at)
// =====================================================================

// Lit les 3 slots du compte connecte. Renvoie un tableau [slot1, slot2, slot3]
// ou chaque element est l'objet data (ou null si le slot est vide).
export async function chargerSlotsCloud() {
  const { data, error } = await supabase.from('sauvegardes').select('slot, data')
  if (error) { console.warn('Lecture saves cloud echouee :', error.message); return [null, null, null] }
  const slots = [null, null, null]
  for (const ligne of (data || [])) {
    if (ligne.slot >= 1 && ligne.slot <= 3) slots[ligne.slot - 1] = ligne.data
  }
  return slots
}

// Lit UN slot precis (renvoie l'objet data ou null).
export async function chargerSlotCloud(slot) {
  const { data, error } = await supabase
    .from('sauvegardes').select('data').eq('slot', slot).maybeSingle()
  if (error) { console.warn('Lecture slot cloud echouee :', error.message); return null }
  return data ? data.data : null
}

// Ecrit (upsert) un slot. Le user_id est ajoute automatiquement par Supabase
// via la valeur par defaut ? Non : on doit le fournir. On le recupere de la session.
export async function sauverSlotCloud(slot, dataObjet) {
  const { data: sess } = await supabase.auth.getSession()
  const uid = sess.session?.user?.id
  if (!uid) return { ok: false, raison: 'non_connecte' }
  const ligne = { user_id: uid, slot, data: dataObjet, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('sauvegardes').upsert(ligne, { onConflict: 'user_id,slot' })
  if (error) { console.warn('Ecriture slot cloud echouee :', error.message); return { ok: false, raison: error.message } }
  return { ok: true }
}

// Supprime un slot.
export async function supprimerSlotCloud(slot) {
  const { data: sess } = await supabase.auth.getSession()
  const uid = sess.session?.user?.id
  if (!uid) return { ok: false, raison: 'non_connecte' }
  const { error } = await supabase.from('sauvegardes').delete().eq('user_id', uid).eq('slot', slot)
  if (error) { console.warn('Suppression slot cloud echouee :', error.message); return { ok: false, raison: error.message } }
  return { ok: true }
}