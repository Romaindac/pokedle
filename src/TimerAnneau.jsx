// Timer circulaire (anneau SVG qui se vide). Réutilisable : boss d'arène + boss de zone.
// Props : tempsRestant (sec), tempsTotal (sec), taille (px, défaut 64).
function TimerAnneau({ tempsRestant, tempsTotal, taille = 64 }) {
  const rayon = (taille - 8) / 2
  const circonference = 2 * Math.PI * rayon
  const fraction = Math.max(0, Math.min(1, tempsRestant / tempsTotal))
  const offset = circonference * (1 - fraction)
  const urgent = tempsRestant <= 10
  const couleur = urgent ? '#ff5a5a' : 'var(--accent, #ffcd75)'

  return (
    <div className={`timer-anneau ${urgent ? 'urgent' : ''}`} title="Temps restant pour vaincre le boss">
      <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`}>
        {/* Cercle de fond */}
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth="5"
        />
        {/* Cercle de progression (se vide) */}
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          fill="none"
          stroke={couleur}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${taille / 2} ${taille / 2})`}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
        {/* Texte au centre */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={couleur}
          fontSize={taille * 0.32}
          fontWeight="bold"
          fontFamily="var(--font-data, monospace)"
        >
          {Math.ceil(tempsRestant)}
        </text>
      </svg>
    </div>
  )
}

export default TimerAnneau