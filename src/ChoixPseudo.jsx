import { useState } from 'react'
import { definirPseudo, validerPseudo, PSEUDO_MAX } from './apiClassement'

// Écran de choix de pseudo.
// Modes :
//  - Premier lancement classement : pas de onAnnuler -> obligatoire.
//  - Changement de pseudo : onAnnuler fourni -> fermable.
//  - Pseudo de SLOT (nouvelle partie) : prop `pourSlot` -> renvoie juste le
//    pseudo valide via onValide(pseudo) SANS ecrire dans le localStorage global.
function ChoixPseudo({ onValide, onAnnuler, pourSlot = false, valeurInitiale = '' }) {
  const identiteActuelle = (() => {
    try { return JSON.parse(localStorage.getItem('pokedle-joueur') || 'null') } catch (e) { return null }
  })()
  const [pseudo, setPseudo] = useState(
    pourSlot ? valeurInitiale : (onAnnuler && identiteActuelle ? identiteActuelle.pseudo : '')
  )
  const verdict = validerPseudo(pseudo)
  const valide = verdict.ok
  const erreur = pseudo.trim().length > 0 && !valide ? verdict.raison : null
  const changement = !!onAnnuler

  function confirmer() {
    if (!valide) return
    if (pourSlot) {
      // Pour un slot : on renvoie juste le pseudo nettoye, sans toucher au global.
      onValide(pseudo.trim().replace(/\s+/g, ' ').slice(0, PSEUDO_MAX))
    } else {
      const identite = definirPseudo(pseudo)
      onValide(identite)
    }
  }

  const titre = pourSlot ? '🏆 Pseudo de la partie' : (changement ? 'Changer de pseudo' : 'Ton pseudo')

  return (
    <div className="overlay" onClick={changement ? onAnnuler : undefined}>
      <div className="panneau-banc panneau-equipe-doree choix-pseudo-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>{titre}</h2>
          {changement && <button className="bouton-fermer" onClick={onAnnuler}>✕</button>}
        </div>
        <p className="choix-pseudo-txt">
          {pourSlot ? (
            <>Choisis le pseudo de <strong>cette partie</strong> pour le <strong>classement en ligne</strong>. Chaque partie a son propre pseudo.</>
          ) : changement ? (
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
          {pourSlot ? 'Continuer' : (changement ? 'Enregistrer' : 'Valider')}
        </button>
      </div>
    </div>
  )
}

export default ChoixPseudo