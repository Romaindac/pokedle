import { useState } from 'react'
import { TUTOS, tutoEstVu, marquerTutoVu } from './tuto'

// Encart de tuto contextuel. A placer en haut du rendu d'une fenetre.
// Props : id (cle dans TUTOS). S'affiche une seule fois (1re ouverture),
// puis se masque definitivement (sauvegarde en localStorage).
//
// Usage : <TutoFenetre id="equipe" /> tout en haut du JSX de la fenetre.
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
        <div className="tuto-sprite-halo">
          {tuto.sprite && (
            <img
              src={tuto.sprite}
              alt=""
              className="tuto-sprite"
              onError={(e) => {
                // Repli : si le gif anime echoue, on bascule sur le sprite fixe PokeAPI.
                if (tuto.spriteRepli && e.currentTarget.src !== tuto.spriteRepli) {
                  e.currentTarget.src = tuto.spriteRepli
                } else {
                  e.currentTarget.style.display = 'none'
                }
              }}
            />
          )}
        </div>
        <div className="tuto-badge">Astuce</div>
        <h3 className="tuto-titre">{tuto.titre}</h3>
        <ul className="tuto-lignes">
          {tuto.lignes.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
        <button className="tuto-bouton" onClick={fermer}>Compris</button>
      </div>
    </div>
  )
}

export default TutoFenetre