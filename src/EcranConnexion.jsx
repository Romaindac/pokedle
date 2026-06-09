import { useState } from 'react'
import { connecter, inscrire, renvoyerConfirmation, reinitialiserMotDePasse } from './apiAuth'

// Ecran de connexion / inscription. S'affiche AVANT le menu titre.
// IMPORTANT : styles critiques en INLINE pour etre 100% isole du CSS du jeu
// (aucune regle de App.css ne peut deformer la carte au survol).
function EcranConnexion({ onConnecte }) {
  const [mode, setMode] = useState('connexion')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [mdp2, setMdp2] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState(null)
  const [attenteConfirmation, setAttenteConfirmation] = useState(false)
  const [survolBouton, setSurvolBouton] = useState(false)

  function valider() {
    if (!email.trim() || !/.+@.+\..+/.test(email.trim())) return 'Entre une adresse email valide.'
    if ((mdp || '').length < 6) return 'Le mot de passe doit faire au moins 6 caracteres.'
    if (mode === 'inscription' && mdp !== mdp2) return 'Les deux mots de passe ne correspondent pas.'
    return null
  }

  async function soumettre(e) {
    if (e) e.preventDefault()
    setMessage(null)
    const err = valider()
    if (err) { setMessage({ type: 'erreur', texte: err }); return }
    setEnCours(true)
    try {
      if (mode === 'inscription') {
        const r = await inscrire(email, mdp)
        if (!r.ok) { setMessage({ type: 'erreur', texte: traduireErreur(r.raison) }); setEnCours(false); return }
        if (r.besoinConfirmation) {
          setAttenteConfirmation(true)
          setMessage({ type: 'info', texte: "Compte cree ! Un email de confirmation vient de t'etre envoye. Clique le lien dedans, puis reviens te connecter." })
        } else if (r.utilisateur) {
          const c = await connecter(email, mdp)
          if (c.ok && onConnecte) onConnecte(c.session)
        }
      } else {
        const r = await connecter(email, mdp)
        if (!r.ok) { setMessage({ type: 'erreur', texte: traduireErreur(r.raison) }); setEnCours(false); return }
        if (onConnecte) onConnecte(r.session)
      }
    } catch (err) {
      setMessage({ type: 'erreur', texte: 'Erreur reseau. Reessaie.' })
    }
    setEnCours(false)
  }

  async function motDePasseOublie() {
    if (!email.trim()) { setMessage({ type: 'erreur', texte: "Entre d'abord ton email ci-dessus." }); return }
    setEnCours(true)
    const r = await reinitialiserMotDePasse(email)
    setEnCours(false)
    setMessage(r.ok
      ? { type: 'info', texte: 'Email de reinitialisation envoye (si le compte existe).' }
      : { type: 'erreur', texte: traduireErreur(r.raison) })
  }

  async function renvoyer() {
    setEnCours(true)
    const r = await renvoyerConfirmation(email)
    setEnCours(false)
    setMessage(r.ok
      ? { type: 'info', texte: 'Email de confirmation renvoye.' }
      : { type: 'erreur', texte: traduireErreur(r.raison) })
  }

  // ---- Styles inline (priorite maximale, immunises contre App.css) ----
  const S = {
    ecran: {
      position: 'fixed', inset: 0, zIndex: 2500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: '#0b0e14', overflow: 'auto',
      fontFamily: "'Rubik', system-ui, sans-serif",
    },
    fond: {
      position: 'absolute', inset: 0, pointerEvents: 'none',
      background: 'radial-gradient(60% 50% at 50% 0%, rgba(252,211,77,0.10), transparent 70%), radial-gradient(50% 40% at 50% 100%, rgba(167,139,250,0.10), transparent 70%)',
    },
    carte: {
      position: 'relative', width: 'min(94vw, 400px)', boxSizing: 'border-box',
      padding: '30px 26px 24px',
      background: 'linear-gradient(168deg, #1a1f2b, #161b26)',
      border: '1px solid rgba(252,211,77,0.5)', borderRadius: 20,
      boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      transform: 'none', transition: 'none', animation: 'none',
    },
    logo: { width: 150, maxWidth: '70%', height: 'auto', marginBottom: 6, imageRendering: 'pixelated' },
    titre: { fontFamily: "'Press Start 2P', monospace", fontSize: 16, color: '#f0f4fc', margin: '6px 0 8px', textAlign: 'center' },
    sous: { fontSize: 13, lineHeight: 1.5, color: '#9ca8bd', textAlign: 'center', margin: '0 0 18px' },
    form: { width: '100%', display: 'flex', flexDirection: 'column', gap: 12 },
    label: { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, fontWeight: 600, color: '#9ca8bd' },
    input: {
      width: '100%', boxSizing: 'border-box', background: '#161b26',
      border: '1px solid #232a38', borderRadius: 10, padding: '11px 12px',
      fontSize: 14, color: '#f0f4fc', fontFamily: "'Rubik', sans-serif",
      transform: 'none', animation: 'none',
    },
    message: (t) => ({
      fontSize: 12.5, lineHeight: 1.45, borderRadius: 10, padding: '10px 12px',
      background: t === 'erreur' ? 'rgba(239,104,104,0.12)' : 'rgba(52,211,153,0.1)',
      border: `1px solid ${t === 'erreur' ? 'rgba(239,104,104,0.4)' : 'rgba(52,211,153,0.4)'}`,
      color: t === 'erreur' ? '#fca5a5' : '#6ee7b7',
    }),
    bouton: {
      width: '100%', marginTop: 2, border: 'none', borderRadius: 12, color: '#1a1205',
      background: 'linear-gradient(135deg, #fcd34d, #f59e0b)',
      fontFamily: "'Press Start 2P', monospace", fontSize: 11, padding: 14,
      cursor: enCours ? 'default' : 'pointer', opacity: enCours ? 0.6 : 1,
      boxShadow: '0 4px 0 #b8860b, 0 6px 14px rgba(0,0,0,0.3)',
      transform: 'none', filter: survolBouton && !enCours ? 'brightness(1.06)' : 'none',
      transition: 'filter 0.14s ease',
    },
    lien: { background: 'none', border: 'none', cursor: 'pointer', marginTop: 12, fontSize: 12, color: '#6b7280', textDecoration: 'underline', fontFamily: "'Rubik', sans-serif" },
    bascule: { marginTop: 16, paddingTop: 14, borderTop: '1px solid #232a38', width: '100%', textAlign: 'center', fontSize: 12.5, color: '#9ca8bd' },
    lienFort: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#fcd34d', textDecoration: 'underline', fontFamily: "'Rubik', sans-serif" },
  }

  return (
    <div style={S.ecran}>
      <div style={S.fond} aria-hidden="true" />
      <div style={S.carte}>
        <img src="/logo-titre.png" alt="Pokedle" style={S.logo} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <h1 style={S.titre}>{mode === 'connexion' ? 'Connexion' : 'Creer un compte'}</h1>
        <p style={S.sous}>
          {mode === 'connexion'
            ? 'Connecte-toi pour retrouver ta partie sur tous tes appareils.'
            : 'Cree ton compte pour sauvegarder en ligne et jouer partout.'}
        </p>

        <form style={S.form} onSubmit={soumettre}>
          <label style={S.label}>
            Email
            <input type="email" style={S.input} value={email} autoComplete="email"
              onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" disabled={enCours} />
          </label>
          <label style={S.label}>
            Mot de passe
            <input type="password" style={S.input} value={mdp} autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
              onChange={(e) => setMdp(e.target.value)} placeholder="6 caracteres minimum" disabled={enCours} />
          </label>
          {mode === 'inscription' && (
            <label style={S.label}>
              Confirme le mot de passe
              <input type="password" style={S.input} value={mdp2} autoComplete="new-password"
                onChange={(e) => setMdp2(e.target.value)} placeholder="Retape ton mot de passe" disabled={enCours} />
            </label>
          )}

          {message && <div style={S.message(message.type)}>{message.texte}</div>}

          {attenteConfirmation ? (
            <button type="button" style={S.bouton} onClick={renvoyer} disabled={enCours}
              onMouseEnter={() => setSurvolBouton(true)} onMouseLeave={() => setSurvolBouton(false)}>
              Renvoyer l'email de confirmation
            </button>
          ) : (
            <button type="submit" style={S.bouton} disabled={enCours}
              onMouseEnter={() => setSurvolBouton(true)} onMouseLeave={() => setSurvolBouton(false)}>
              {enCours ? '...' : (mode === 'connexion' ? 'Se connecter' : 'Creer mon compte')}
            </button>
          )}
        </form>

        {mode === 'connexion' && !attenteConfirmation && (
          <button style={S.lien} onClick={motDePasseOublie} disabled={enCours}>Mot de passe oublie ?</button>
        )}

        <div style={S.bascule}>
          {mode === 'connexion' ? (
            <>Pas encore de compte ?{' '}
              <button style={S.lienFort} onClick={() => { setMode('inscription'); setMessage(null); setAttenteConfirmation(false) }}>Creer un compte</button>
            </>
          ) : (
            <>Deja un compte ?{' '}
              <button style={S.lienFort} onClick={() => { setMode('connexion'); setMessage(null); setAttenteConfirmation(false) }}>Se connecter</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function traduireErreur(raison) {
  const r = (raison || '').toLowerCase()
  if (r.includes('invalid login')) return 'Email ou mot de passe incorrect.'
  if (r.includes('email not confirmed')) return "Confirme d'abord ton email (verifie ta boite mail)."
  if (r.includes('already registered') || r.includes('already been registered')) return 'Un compte existe deja avec cet email.'
  if (r.includes('rate limit') || r.includes('too many')) return 'Trop de tentatives. Patiente un peu.'
  if (r.includes('password')) return 'Mot de passe trop court ou invalide.'
  return raison || 'Une erreur est survenue.'
}

export default EcranConnexion