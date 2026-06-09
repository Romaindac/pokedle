// ============================================================
// AMBIANCE DE COMBAT — decor vivant et spectaculaire par monde
// Plusieurs couches superposees :
//   - voile atmospherique colore (teinte du monde)
//   - god rays (rayons de lumiere qui balaient)
//   - brume au sol qui derive
//   - particules principales qui traversent l'ecran en diagonale
//   - lucioles / etincelles ponctuelles qui scintillent
//   - vagues de vent qui balaient horizontalement
// Tout en CSS pur (fluide, aucune dependance externe).
// ============================================================

// Determine l'ambiance depuis le nom du decor de la zone.
export function ambianceDeZone(decor) {
  const d = (decor || '').toLowerCase()
  if (d.includes('neige') || d.includes('cristal') || d.includes('sommet') || d.includes('glace')) return 'neige'
  if (d.includes('volcan') || d.includes('feu') || d.includes('forge') || d.includes('lave')) return 'cendres'
  if (d.includes('desert') || d.includes('sable') || d.includes('plage') || d.includes('dune')) return 'sable'
  if (d.includes('grotte') || d.includes('abysses') || d.includes('temple') || d.includes('marais') || d.includes('cave')) return 'spores'
  if (d.includes('foret') || d.includes('prairie') || d.includes('jade') || d.includes('sanctuaire') || d.includes('dragon') || d.includes('bois') || d.includes('jardin')) return 'feuilles'
  return 'poussiere'
}

function AmbianceCombat({ decor, estBoss = false }) {
  const ambiance = ambianceDeZone(decor)

  return (
    <div className={`amb amb-${ambiance} ${estBoss ? 'amb-boss' : ''}`} aria-hidden="true">
      {/* Voile atmospherique colore */}
      <div className="amb-voile"></div>

      {/* God rays : rayons de lumiere obliques qui balaient */}
      <div className="amb-rays">
        <span className="amb-ray amb-ray-0"></span>
        <span className="amb-ray amb-ray-1"></span>
        <span className="amb-ray amb-ray-2"></span>
        <span className="amb-ray amb-ray-3"></span>
      </div>

      {/* Vagues de vent qui balaient horizontalement */}
      <div className="amb-vent">
        <span className="amb-vague amb-vague-0"></span>
        <span className="amb-vague amb-vague-1"></span>
        <span className="amb-vague amb-vague-2"></span>
      </div>

      {/* Particules principales (feuilles/flocons/braises...) en diagonale */}
      <div className="amb-particules">
        {Array.from({ length: 28 }).map((_, i) => (
          <span key={i} className={`amb-p amb-p-${i}`}></span>
        ))}
      </div>

      {/* Lucioles / etincelles qui scintillent sur place */}
      <div className="amb-lucioles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} className={`amb-luciole amb-luciole-${i}`}></span>
        ))}
      </div>

      {/* Brume au sol qui derive */}
      <div className="amb-brume">
        <span className="amb-brume-couche amb-brume-0"></span>
        <span className="amb-brume-couche amb-brume-1"></span>
      </div>

      {/* Silhouettes lointaines qui traversent (oiseaux / esprits selon le monde) */}
      <div className="amb-silhouettes">
        <span className="amb-oiseau amb-oiseau-0"></span>
        <span className="amb-oiseau amb-oiseau-1"></span>
        <span className="amb-oiseau amb-oiseau-2"></span>
      </div>

      {/* Halo de profondeur (vignette douce qui pulse, donne du relief) */}
      <div className="amb-profondeur"></div>
    </div>
  )
}

export default AmbianceCombat