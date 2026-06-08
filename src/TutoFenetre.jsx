import { useState } from 'react'
import { TUTOS, tutoEstVu, marquerTutoVu } from './tuto'

// Encart de tuto contextuel. À placer en haut du rendu d'une fenêtre.
// Props : id (clé dans TUTOS). S'affiche une seule fois (1re ouverture),
// puis se masque définitivement (sauvegardé en localStorage).
//
// Usage : <TutoFenetre id="equipe" /> tout en haut du JSX de la fenêtre.
function TutoFenetre({ id }) {
  const tuto = TUTOS[id]
  const [visible, setVisible] = useState(() => !!tuto && !tutoEstVu(id))
  if (!tuto || !visible) return null

  function fermer() {
    marquerTutoVu(id)
    setVisible(false)
  }

  return (
    <div className="tuto-overlay" onClick={fermer}>
      <div className="tuto-encart" onClick={(e) => e.stopPropagation()}>
        <div className="tuto-badge">💡 Astuce</div>
        <h3 className="tuto-titre">{tuto.titre}</h3>
        <ul className="tuto-lignes">
          {tuto.lignes.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <button className="tuto-bouton" onClick={fermer}>Compris ✓</button>
      </div>
    </div>
  )
}

export default TutoFenetre