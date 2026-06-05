import { useState } from 'react'

const CLE_SAUVEGARDE = 'pokedex-idle-save-v11'
const PREFIXE = 'PKDLE1:'

// Encode une chaîne UTF-8 en base64 (gère les accents et emojis).
function encoderBase64(texte) {
  const octets = new TextEncoder().encode(texte)
  let binaire = ''
  for (let i = 0; i < octets.length; i++) binaire += String.fromCharCode(octets[i])
  return btoa(binaire)
}

// Décode un base64 vers une chaîne UTF-8.
function decoderBase64(b64) {
  const binaire = atob(b64)
  const octets = new Uint8Array(binaire.length)
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i)
  return new TextDecoder().decode(octets)
}

function PanneauSauvegarde({ onFermer }) {
  const [codeImport, setCodeImport] = useState('')
  const [message, setMessage] = useState('')
  const [copie, setCopie] = useState(false)

  // Génère le code d'export à partir du localStorage.
  let codeExport = ''
  let erreurExport = ''
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE)
    if (!brut) {
      erreurExport = "Aucune sauvegarde trouvée. Lance une partie d'abord."
    } else {
      codeExport = PREFIXE + encoderBase64(brut)
    }
  } catch (err) {
    erreurExport = "Impossible de lire la sauvegarde."
  }

  function copierCode() {
    if (!codeExport) return
    const fini = () => { setCopie(true); setTimeout(() => setCopie(false), 2000) }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codeExport).then(fini).catch(() => {
        // Repli : sélection manuelle
        const zone = document.getElementById('save-export-zone')
        if (zone) { zone.select(); try { document.execCommand('copy'); fini() } catch (e) {} }
      })
    } else {
      const zone = document.getElementById('save-export-zone')
      if (zone) { zone.select(); try { document.execCommand('copy'); fini() } catch (e) {} }
    }
  }

  function importer() {
    setMessage('')
    const code = codeImport.trim()
    if (!code) {
      setMessage('⚠️ Colle d\'abord un code de sauvegarde.')
      return
    }
    if (!code.startsWith(PREFIXE)) {
      setMessage('❌ Ce code n\'est pas un code Pokédle valide.')
      return
    }
    let donnees
    try {
      const json = decoderBase64(code.slice(PREFIXE.length))
      donnees = JSON.parse(json)
    } catch (err) {
      setMessage('❌ Code illisible ou abîmé. Vérifie le copier-coller (en entier, sans espace en trop).')
      return
    }
    if (!donnees || typeof donnees !== 'object' || !Array.isArray(donnees.captures)) {
      setMessage('❌ Ce code ne contient pas une sauvegarde Pokédle valide.')
      return
    }

    const nbPoke = donnees.captures.length
    const nbVus = Array.isArray(donnees.pokedexVus) ? donnees.pokedexVus.length : 0
    const ok = window.confirm(
      `Importer cette sauvegarde ?\n\n` +
      `• ${nbPoke} Pokémon dans la collection\n` +
      `• ${nbVus} vus au Pokédex\n` +
      `• ${donnees.pokeDollars || 0} PokéDollars\n\n` +
      `⚠️ ATTENTION : ta sauvegarde ACTUELLE sera DÉFINITIVEMENT remplacée.\n` +
      `Cette action est irréversible. Continuer ?`
    )
    if (!ok) return

    try {
      const json = decoderBase64(code.slice(PREFIXE.length))
      localStorage.setItem(CLE_SAUVEGARDE, json)
      setMessage('✓ Sauvegarde importée ! Rechargement...')
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      setMessage('❌ Erreur lors de l\'enregistrement.')
    }
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc save-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="save-entete">
          <h2>💾 Sauvegarde</h2>
          <button className="save-fermer" onClick={onFermer}>✕</button>
        </div>

        <p className="save-intro">
          Transfère ta progression entre ton téléphone et ton PC : copie le code sur un appareil, colle-le sur l'autre.
        </p>

        {/* EXPORT */}
        <div className="save-bloc">
          <h3 className="save-titre">📤 Exporter (sauvegarder)</h3>
          {erreurExport ? (
            <p className="save-erreur">{erreurExport}</p>
          ) : (
            <>
              <p className="save-aide">Voici ton code. Copie-le et garde-le précieusement.</p>
              <textarea
                id="save-export-zone"
                className="save-zone"
                readOnly
                value={codeExport}
                onFocus={(e) => e.target.select()}
              />
              <button className="save-bouton save-bouton-copier" onClick={copierCode}>
                {copie ? '✓ Copié !' : '📋 Copier le code'}
              </button>
            </>
          )}
        </div>

        {/* IMPORT */}
        <div className="save-bloc">
          <h3 className="save-titre">📥 Importer (charger)</h3>
          <p className="save-aide">
            Colle ici un code de sauvegarde. Ta partie actuelle sera remplacée.
          </p>
          <textarea
            className="save-zone"
            placeholder="Colle ton code PKDLE1:... ici"
            value={codeImport}
            onChange={(e) => setCodeImport(e.target.value)}
          />
          <button className="save-bouton save-bouton-importer" onClick={importer}>
            📥 Importer cette sauvegarde
          </button>
          {message && <p className="save-message">{message}</p>}
        </div>
      </div>
    </div>
  )
}

export default PanneauSauvegarde