// Panneau de l'équipe complète, organisé en 3 sections : actifs / réserve / KO.
function Banc({ equipe, pvs, indexActifs, onFermer }) {
  // On classe chaque membre dans une catégorie.
  const actifs = []
  const reserve = []
  const ko = []
  equipe.forEach((poke, i) => {
    const membre = { poke, pv: pvs[i], index: i }
    if (indexActifs.includes(i)) actifs.push(membre)
    else if (pvs[i] <= 0) ko.push(membre)
    else reserve.push(membre)
  })

  const Carte = ({ membre, etat }) => {
    const pct = Math.max(0, (membre.pv / membre.poke.pvMax) * 100)
    return (
      <div className={`banc-carte ${etat}`}>
        <img src={membre.poke.sprite} alt={membre.poke.nom} className="banc-sprite" />
        <span className="banc-nom">{membre.poke.nom}</span>
        <div className="banc-barre">
          <div className="banc-barre-fill" style={{ width: `${pct}%` }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>Mon équipe ({equipe.length})</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <h3 className="banc-titre actif">⚔️ Au combat ({actifs.length})</h3>
        <div className="banc-grille">
          {actifs.map((m) => <Carte key={m.index} membre={m} etat="actif" />)}
        </div>

        <h3 className="banc-titre reserve">🪑 En réserve ({reserve.length})</h3>
        <div className="banc-grille">
          {reserve.length === 0
            ? <p className="banc-vide">Personne en réserve.</p>
            : reserve.map((m) => <Carte key={m.index} membre={m} etat="reserve" />)}
        </div>

        {ko.length > 0 && (
          <>
            <h3 className="banc-titre ko">💀 K.O. ({ko.length})</h3>
            <div className="banc-grille">
              {ko.map((m) => <Carte key={m.index} membre={m} etat="ko" />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Banc