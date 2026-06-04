import { useState, useRef } from 'react'

// =====================================================================
// PanneauSauvegarde.jsx — Export / Import de la sauvegarde.
//   - Export : télécharge la save (localStorage) dans un fichier .json.
//   - Import : lit un fichier, valide le JSON, écrit dans localStorage,
//              puis recharge la page (réutilise la logique de chargement
//              existante = aucun risque de désynchro des états React).
// Le composant lit/écrit DIRECTEMENT localStorage[cleSauvegarde].
// Il ne touche à aucun état du jeu : c'est volontaire (robustesse).
// =====================================================================

function PanneauSauvegarde({ cleSauvegarde, onFermer }) {
  const [message, setMessage] = useState(null) // { type: 'ok'|'erreur', texte }
  const [confirmImport, setConfirmImport] = useState(null) // données en attente de confirmation
  const inputFichier = useRef(null)

  // ---- EXPORT : télécharge la save dans un fichier .json ----
  function exporter() {
    try {
      const save = localStorage.getItem(cleSauvegarde)
      if (!save) {
        setMessage({ type: 'erreur', texte: "Aucune sauvegarde trouvée à exporter." })
        return
      }
      // On vérifie que c'est bien du JSON valide avant d'exporter.
      JSON.parse(save)

      const blob = new Blob([save], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().slice(0, 10) // AAAA-MM-JJ
      const a = document.createElement('a')
      a.href = url
      a.download = `pokedle-sauvegarde-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setMessage({ type: 'ok', texte: "Sauvegarde téléchargée ! Garde ce fichier en lieu sûr." })
    } catch (err) {
      console.error('Erreur export :', err)
      setMessage({ type: 'erreur', texte: "Erreur pendant l'export." })
    }
  }

  // ---- IMPORT : étape 1, lire et valider le fichier ----
  function fichierChoisi(e) {
    const fichier = e.target.files && e.target.files[0]
    if (!fichier) return
    const lecteur = new FileReader()
    lecteur.onload = () => {
      try {
        const texte = String(lecteur.result)
        const data = JSON.parse(texte) // valide le JSON
        // Petit contrôle de cohérence : une vraie save a un tableau "captures".
        if (!data || typeof data !== 'object' || !Array.isArray(data.captures)) {
          setMessage({ type: 'erreur', texte: "Ce fichier ne ressemble pas à une sauvegarde Pokédle valide." })
          return
        }
        const nb = data.captures.length
        setConfirmImport({ texte, nb })
        setMessage(null)
      } catch (err) {
        console.error('Erreur lecture fichier :', err)
        setMessage({ type: 'erreur', texte: "Fichier illisible ou corrompu (JSON invalide)." })
      }
    }
    lecteur.onerror = () => setMessage({ type: 'erreur', texte: "Impossible de lire le fichier." })
    lecteur.readAsText(fichier)
    // Réinitialise l'input pour pouvoir re-sélectionner le même fichier ensuite.
    e.target.value = ''
  }

  // ---- IMPORT : étape 2, confirmer = écrire + recharger ----
  function confirmerImport() {
    try {
      localStorage.setItem(cleSauvegarde, confirmImport.texte)
      setMessage({ type: 'ok', texte: "Sauvegarde importée ! Rechargement…" })
      setTimeout(() => window.location.reload(), 600)
    } catch (err) {
      console.error('Erreur import :', err)
      setMessage({ type: 'erreur', texte: "Impossible d'écrire la sauvegarde." })
    }
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-equipe-doree save-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="save-entete">
          <h2>💾 Sauvegarde</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <p className="save-intro">
          Ta partie est sauvegardée automatiquement dans ce navigateur. Pour ne jamais la perdre
          (changement de PC, cache effacé…), exporte-la dans un fichier et garde-le.
        </p>

        {/* EXPORT */}
        <div className="save-bloc">
          <div className="save-bloc-titre">Exporter</div>
          <div className="save-bloc-txt">Télécharge ta partie actuelle dans un fichier.</div>
          <button className="tuto-bouton-or save-bouton" onClick={exporter}>
            ⬇ Télécharger ma sauvegarde
          </button>
        </div>

        {/* IMPORT */}
        <div className="save-bloc">
          <div className="save-bloc-titre">Importer</div>
          <div className="save-bloc-txt save-attention">
            ⚠️ Importer une sauvegarde <strong>remplace ta partie actuelle</strong>. La page se rechargera.
          </div>

          {!confirmImport ? (
            <>
              <button className="tuto-bouton-or save-bouton" onClick={() => inputFichier.current && inputFichier.current.click()}>
                ⬆ Choisir un fichier de sauvegarde
              </button>
              <input
                ref={inputFichier}
                type="file"
                accept=".json,application/json,text/plain"
                style={{ display: 'none' }}
                onChange={fichierChoisi}
              />
            </>
          ) : (
            <div className="save-confirm">
              <div className="save-confirm-txt">
                Fichier valide ({confirmImport.nb} Pokémon). Remplacer ta partie actuelle ?
              </div>
              <div className="save-confirm-boutons">
                <button className="tuto-bouton-secondaire" onClick={() => setConfirmImport(null)}>Annuler</button>
                <button className="tuto-bouton-or" onClick={confirmerImport}>Oui, importer</button>
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`save-message save-message-${message.type}`}>{message.texte}</div>
        )}
      </div>
    </div>
  )
}

export default PanneauSauvegarde