import { BONUS_PRESTIGE } from './prestige'

// Pop-up du système de prestige : médailles, bonus permanents, bouton prestige.
function PanneauPrestige({
  medailles,
  investis,
  gainPotentiel,
  multiplicateurs,
  onInvestir,
  onPrestige,
  onFermer,
}) {
  const categories = ['xp', 'argent', 'shiny']

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-pokedex panneau-prestige panneau-prestige-doree" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🏅 Rang de Dresseur</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        <p className="prestige-intro">
          Le Prestige réinitialise tes <strong>niveaux, zones et argent</strong>, mais tu gardes
          ton <strong>Pokédex</strong> et tes <strong>médailles</strong>. Chaque médaille investie
          donne un bonus <strong>permanent</strong> qui rend les remontées de plus en plus rapides.
        </p>

        {/* Solde de médailles */}
        <div className="prestige-solde">
          <span className="prestige-solde-val">🏅 {medailles}</span>
          <span className="prestige-solde-label">médailles disponibles</span>
        </div>

        {/* Bonus à acheter */}
        <h3 className="recomp-titre">Bonus permanents</h3>
        <div className="prestige-bonus-liste">
          {categories.map((cat) => {
            const info = BONUS_PRESTIGE[cat]
            const niveau = investis[cat] || 0
            const multi = multiplicateurs[cat]
            const pct = Math.round((multi - 1) * 100)
            return (
              <div key={cat} className="prestige-bonus">
                <div className="prestige-bonus-info">
                  <span className="prestige-bonus-nom">{info.emoji} {info.nom}</span>
                  <span className="prestige-bonus-detail">
                    Niveau {niveau} · actuellement <strong>+{pct}%</strong>
                  </span>
                  <span className="prestige-bonus-desc">{info.desc}</span>
                </div>
                <button
                  className="bouton-investir"
                  onClick={() => onInvestir(cat)}
                  disabled={medailles <= 0}
                >
                  🏅 +1
                </button>
              </div>
            )
          })}
        </div>

        {/* Bouton prestige */}
        <div className="prestige-action">
          <p className="prestige-gain">
            Prestiger maintenant rapporterait : <strong>🏅 {gainPotentiel} médailles</strong>
          </p>
          <button
            className="bouton-prestige"
            onClick={onPrestige}
            disabled={gainPotentiel <= 0}
          >
            ✨ PRESTIGE ✨
          </button>
          {gainPotentiel <= 0 && (
            <p className="prestige-gain-note">Progresse encore un peu pour pouvoir prestiger.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default PanneauPrestige