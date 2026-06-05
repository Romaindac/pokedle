import { useState } from 'react'
import { definirPseudo, validerPseudo, PSEUDO_MAX } from './apiClassement'

// Écran de choix de pseudo pour le classement en ligne.
// - Premier lancement : pas de onAnnuler → l'écran est obligatoire.
// - Changement de pseudo : onAnnuler fourni → on peut fermer sans valider.
function ChoixPseudo({ onValide, onAnnuler }) {
  const identiteActuelle = (() => {
    try { return JSON.parse(localStorage.getItem('pokedle-joueur') || 'null') } catch (e) { return null }
  })()
  const [pseudo, setPseudo] = useState(onAnnuler && identiteActuelle ? identiteActuelle.pseudo : '')
  const verdict = validerPseudo(pseudo)
  const valide = verdict.ok
  // On n'affiche l'erreur que si le joueur a commencé à taper (évite l'erreur dès l'ouverture).
  const erreur = pseudo.trim().length > 0 && !valide ? verdict.raison : null
  const changement = !!onAnnuler

  function confirmer() {
    if (!valide) return
    const identite = definirPseudo(pseudo)
    onValide(identite)
  }

  return (
    <div className="overlay" onClick={changement ? onAnnuler : undefined}>
      <div className="panneau-banc panneau-equipe-doree choix-pseudo-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🏆 {changement ? 'Changer de pseudo' : 'Ton pseudo'}</h2>
          {changement && <button className="bouton-fermer" onClick={onAnnuler}>✕</button>}
        </div>
        <p className="choix-pseudo-txt">
          {changement ? (
            <>Choisis ton nouveau pseudo pour le <strong>classement en ligne</strong>.</>
          ) : (
            <>Choisis un pseudo pour apparaître dans le <strong>classement en ligne</strong>. (Tu pourras le changer plus tard.)</>
          )}
        </p>
        <input
          type="text"
          className="choix-pseudo-input"
          placeholder="Ton pseudo…"
          value={pseudo}
          maxLength={PSEUDO_MAX}
          onChange={(e) => setPseudo(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmer() }}
          autoFocus
        />
        {erreur && <div className="choix-pseudo-erreur">{erreur}</div>}
        <button className="choix-pseudo-bouton" onClick={confirmer} disabled={!valide}>
          {changement ? 'Enregistrer' : 'Valider'}
        </button>
      </div>
    </div>
  )
}

export default ChoixPseudo