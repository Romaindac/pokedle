/*
  Panneau COMBAT — regroupe Vitesse, Mode auto et l'info Ultimes
  en un seul bloc cohérent (au lieu de 3 panneaux séparés).
  Sans state interne nécessaire ici : tout est piloté par les props d'App.

  Props :
    vitesse, onVitesse(n)
    autoZone, onToggleAuto()
*/
export default function BarreAction({
  vitesse = 1, onVitesse = () => {},
  autoZone = false, onToggleAuto = () => {},
}) {
  return (
    <div className="panneau panneau-combat-v2">
      <div className="panneau-titre"><img src="/icons/vitesse.png" alt="" className="panneau-icone" /> Combat</div>

      {/* Vitesse */}
      <div className="ba-ligne">
        <span className="ba-label">Vitesse</span>
        <div className="ba-vitesse">
          {[1, 2, 4].map((v) => (
            <button key={v} className={`ba-vit-btn ${vitesse === v ? 'actif' : ''}`} onClick={() => onVitesse(v)}>×{v}</button>
          ))}
        </div>
      </div>

      {/* Mode auto */}
      <div className="ba-ligne">
        <span className="ba-label">Auto zone</span>
        <button className={`ba-auto ${autoZone ? 'actif' : ''}`} onClick={onToggleAuto} title="Passe à la zone suivante après chaque boss vaincu">
          <span className="ba-auto-dot"></span>{autoZone ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Info ultimes (compacte) */}
      <div className="ba-ultimes">
        <span className="ba-ultimes-icone">⚡</span>
        <span className="ba-ultimes-txt">Chaque Pokémon déclenche son ultime ~7s après le début du combat.</span>
      </div>
    </div>
  )
}