// Pop-up de configuration des règles de capture automatique.
// Pour chaque catégorie de Pokémon, le joueur choisit quelle Ball utiliser.
// Priorité d'application en jeu : shiny > legendaire > nouveau > doublon.

// Les 4 catégories, dans l'ordre de priorité (la plus haute en premier).
const CATEGORIES = [
  { cle: 'shiny', nom: 'Shiny', emoji: '✨', desc: 'Pokémon shiny (rare !)' },
  { cle: 'legendaire', nom: 'Légendaire', emoji: '👑', desc: 'Pokémon légendaire' },
  { cle: 'nouveau', nom: 'Nouveau', emoji: '🆕', desc: 'Espèce pas encore capturée' },
  { cle: 'doublon', nom: 'Doublon', emoji: '🔁', desc: 'Espèce déjà capturée' },
]

// Les choix possibles pour chaque catégorie.
// 'auto' = meilleure ball dispo selon la rareté ; 'rien' = ne pas capturer.
const CHOIX = [
  { cle: 'auto', label: 'Auto' },
  { cle: 'poke', label: 'Poké', ball: 'poke' },
  { cle: 'super', label: 'Super', ball: 'super' },
  { cle: 'hyper', label: 'Hyper', ball: 'hyper' },
  { cle: 'master', label: 'Master', ball: 'master' },
  { cle: 'rien', label: '✕ Aucune' },
]

function ReglesCapture({ regles, balls = {}, icones = {}, onChanger, onFermer }) {
  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-pokedex panneau-regles regles-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>⚙️ Règles de capture</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <p className="regles-aide">
          Choisis quelle Ball utiliser automatiquement pour chaque type de Pokémon rencontré.
          Si un Pokémon entre dans plusieurs catégories, la priorité est :
          <strong> Shiny → Légendaire → Nouveau → Doublon</strong>.
          <br />
          <span className="regles-aide-note">
            « Auto » = meilleure Ball disponible selon la rareté. Si la Ball choisie est épuisée,
            on prend automatiquement ce qu'il reste (pour ne jamais rater une capture).
          </span>
        </p>

        <div className="regles-liste">
          {CATEGORIES.map((cat) => (
            <div key={cat.cle} className="regle-bloc">
              <div className="regle-entete">
                <span className="regle-nom">{cat.emoji} {cat.nom}</span>
                <span className="regle-desc">{cat.desc}</span>
              </div>
              <div className="regle-choix">
                {CHOIX.map((choix) => {
                  const actif = (regles[cat.cle] || 'auto') === choix.cle
                  const stock = choix.ball != null ? (balls[choix.ball] || 0) : null
                  return (
                    <button
                      key={choix.cle}
                      className={`regle-btn ${actif ? 'actif' : ''} ${choix.cle === 'rien' ? 'regle-btn-rien' : ''}`}
                      onClick={() => onChanger(cat.cle, choix.cle)}
                      title={choix.label}
                    >
                      {choix.ball && icones[choix.ball] ? (
                        <img src={icones[choix.ball]} alt={choix.label} className="regle-ball-img" />
                      ) : (
                        <span className="regle-btn-label">{choix.label}</span>
                      )}
                      {stock != null && <span className="regle-stock">{stock}</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReglesCapture