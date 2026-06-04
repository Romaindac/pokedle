import { Component } from 'react'

// =====================================================================
// ErrorBoundary.jsx — Garde-fou global anti « écran blanc ».
// Si N'IMPORTE QUEL composant enfant plante pendant le rendu, au lieu
// d'une page blanche on affiche un écran « Oups » avec :
//   - un bouton pour télécharger sa sauvegarde (sécurité avant tout),
//   - un bouton pour recharger la page.
// C'est un composant de CLASSE : c'est la seule façon en React
// d'attraper les erreurs de rendu (les hooks ne le permettent pas).
//
// Utilisation (dans main.jsx) : envelopper <App /> avec <ErrorBoundary>.
// Prop optionnelle `cleSauvegarde` pour permettre le téléchargement.
// =====================================================================

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { enErreur: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return { enErreur: true, message: error && error.message ? error.message : '' }
  }

  componentDidCatch(error, info) {
    // On logue pour pouvoir diagnostiquer en console (F12).
    console.error('Erreur attrapée par ErrorBoundary :', error, info)
  }

  telechargerSave = () => {
    try {
      const cle = this.props.cleSauvegarde || 'pokedex-idle-save-v11'
      const save = localStorage.getItem(cle) || ''
      const blob = new Blob([save], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pokedle-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
  }

  recharger = () => window.location.reload()

  render() {
    if (this.state.enErreur) {
      return (
        <div className="eb-ecran">
          <div className="eb-boite">
            <div className="eb-icone">🛠️</div>
            <h1 className="eb-titre">Oups, un bug !</h1>
            <p className="eb-texte">
              Le jeu a rencontré un problème inattendu. Ta progression est
              normalement sauvegardée. Télécharge ta sauvegarde par sécurité,
              puis recharge la page.
            </p>
            <div className="eb-boutons">
              <button className="eb-bouton-secondaire" onClick={this.telechargerSave}>⬇ Télécharger ma sauvegarde</button>
              <button className="eb-bouton-or" onClick={this.recharger}>↻ Recharger le jeu</button>
            </div>
            {this.state.message && (
              <div className="eb-detail">Détail technique : {this.state.message}</div>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default ErrorBoundary