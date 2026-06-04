import { useState } from 'react'
import { definirPseudo, validerPseudo, PSEUDO_MAX } from './apiClassement'

// Écran demandé une seule fois : le joueur choisit son pseudo pour le classement en ligne.
function ChoixPseudo({ onValide }) {
  const [pseudo, setPseudo] = useState('')
  const verdict = validerPseudo(pseudo)
  const valide = verdict.ok
  // On n'affiche l'erreur que si le joueur a commencé à taper (évite l'erreur dès l'ouverture).
  const erreur = pseudo.trim().length > 0 && !valide ? verdict.raison : null

  function confirmer() {
    if (!valide) return
    const identite = definirPseudo(pseudo)
    onValide(identite)
  }

  return (
    <div className="overlay">
      <div className="panneau-banc panneau-equipe-doree choix-pseudo-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🏆 Ton pseudo</h2>
        </div>
        <p className="choix-pseudo-txt">
          Choisis un pseudo pour apparaître dans le <strong>classement en ligne</strong>.
          (Tu pourras le changer plus tard.)
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
          Valider
        </button>
      </div>
    </div>
  )
}

export default ChoixPseudo