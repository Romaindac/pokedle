import { useState, useEffect, useRef } from 'react'
import { ticCombat } from './moteurCombat'
import { VITESSE_COMBAT } from './config'
import { typeNiveau, difficulteNiveau } from './tour'
import { creerHorloge } from './horlogeWorker'

// Couleur d'aura selon le type principal du Pokemon (pour le rare/boss).
const COULEUR_TYPE_AURA = {
  normal: '#9099a1', fire: '#ff7843', water: '#4d90d5', electric: '#f4d23c',
  grass: '#63bb5b', ice: '#73cec0', fighting: '#ce4069', poison: '#b265d6',
  ground: '#d97746', flying: '#8fa8dd', psychic: '#fa7179', bug: '#90c12c',
  rock: '#c7b78b', ghost: '#7b62c9', dragon: '#3b6dd6', dark: '#5a5366',
  steel: '#5a8ea1', fairy: '#ec8fe6',
}

// Barre de PV compacte
function BarrePv({ pv, pvMax, camp }) {
  const pct = pvMax > 0 ? Math.max(0, Math.min(100, (pv / pvMax) * 100)) : 0
  const couleur = pct > 50 ? '#4ade80' : pct > 25 ? '#fbbf24' : '#ef4444'
  return (
    <div className="ct-barre-pv">
      <div className="ct-barre-fill" style={{ width: `${pct}%`, background: couleur }} />
    </div>
  )
}

// Carte d'un combattant
function CarteCombattant({ poke, pv, camp }) {
  if (!poke) return null
  const mort = pv <= 0
  const estRare = !!poke.estRareTour
  // Couleur d'aura selon le type principal du Pokemon rare.
  const typePrincipal = (poke.types && poke.types[0]) || 'normal'
  const couleurAura = COULEUR_TYPE_AURA[typePrincipal] || '#fcd34d'
  return (
    <div
      className={`ct-combattant ${mort ? 'ko' : ''} ${camp} ${estRare ? 'ct-rare' : ''}`}
      style={estRare ? { '--c-aura': couleurAura } : undefined}
    >
      {estRare && !mort && <span className="ct-couronne" title="Pokemon rare">👑</span>}
      <div className="ct-sprite-wrap">
        {estRare && !mort && <span className="ct-aura-tenebreuse"></span>}
        <img
          src={camp === 'joueur'
            ? (poke.spriteNormal || poke.sprite)
            : (poke.sprite || poke.spriteNormal)}
          alt={poke.nom}
          className="ct-sprite"
          onError={(e) => { e.currentTarget.style.opacity = '0.3' }}
        />
      </div>
      <span className="ct-nom">{poke.nom}</span>
      <span className="ct-niveau">N.{poke.niveau}</span>
      <BarrePv pv={pv} pvMax={poke.pvMax} camp={camp} />
    </div>
  )
}

function CombatTour({
  niveauTour,
  equipeJoueur,
  equipeEnnemie,
  vitesse = 1,
  onVictoire,
  onDefaite,
  onQuitter,
}) {
  const type = typeNiveau(niveauTour)
  const labelType = type === 'boss' ? '👑 BOSS' : type === 'miniboss' ? '⚔️ Mini-Boss' : '⚡ Niveau'

  const [pvJoueur, setPvJoueur] = useState(equipeJoueur.map((p) => p.pvMax))
  const [pvEnnemis, setPvEnnemis] = useState(equipeEnnemie.map((p) => p.pvMax))
  const [jaugeJoueur, setJaugeJoueur] = useState(equipeJoueur.map(() => 0))
  const [jaugeEnnemis, setJaugeEnnemis] = useState(equipeEnnemie.map(() => 0))
  const [journal, setJournal] = useState([`Niveau ${niveauTour} — ${labelType} !`])
  const [termine, setTermine] = useState(false)

  const etat = useRef({
    pvJ: equipeJoueur.map((p) => p.pvMax),
    jJ: equipeJoueur.map(() => 0),
    pvE: equipeEnnemie.map((p) => p.pvMax),
    jE: equipeEnnemie.map(() => 0),
  })
  const terminéRef = useRef(false)

  function log(texte) {
    setJournal((l) => [...l.slice(-5), texte])
  }

  useEffect(() => {
    let dernierTic = Date.now()
    const horloge = creerHorloge(() => {
      if (terminéRef.current) return
      const maintenant = Date.now()
      const intervalle = VITESSE_COMBAT / vitesse
      if (maintenant - dernierTic < intervalle) return
      dernierTic = maintenant

      const e = etat.current
      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, equipeEnnemie, e.pvE, e.jE, {})
      etat.current = { pvJ: r.pvJoueur, jJ: r.jaugeJoueur, pvE: r.pvEnnemis, jE: r.jaugeEnnemis }
      setPvJoueur([...r.pvJoueur])
      setPvEnnemis([...r.pvEnnemis])
      setJaugeJoueur([...r.jaugeJoueur])
      setJaugeEnnemis([...r.jaugeEnnemis])

      if (r.ennemisTombes.length > 0) {
        r.ennemisTombes.forEach((i) => {
          const en = equipeEnnemie[i]
          if (en) log(`💥 ${en.nom} est K.O. !`)
        })
      }

      if (r.resultat === 'victoire') {
        terminéRef.current = true
        setTermine(true)
        log(`✅ Niveau ${niveauTour} vaincu !`)
        setTimeout(() => onVictoire(), 1200)
      } else if (r.resultat === 'defaite') {
        terminéRef.current = true
        setTermine(true)
        log(`💀 Ton équipe est K.O. — Run terminée au niveau ${niveauTour}.`)
        setTimeout(() => onDefaite(), 1800)
      }
    })
    horloge.start(40)
    return () => horloge.detruire()
  }, [])

  return (
    <div className="ct-ecran">
      <div className="ct-header">
        <span className="ct-niveau-label">{labelType} {niveauTour}</span>
        <button className="ct-quitter" onClick={onQuitter}>✕ Abandonner</button>
      </div>

      <div className="ct-terrain">
        {/* Ennemis */}
        <div className="ct-rangee ct-ennemis">
          {equipeEnnemie.map((p, i) => (
            <CarteCombattant key={i} poke={p} pv={pvEnnemis[i] ?? p.pvMax} camp="ennemi" />
          ))}
        </div>

        <div className="ct-vs">⚔️</div>

        {/* Joueur */}
        <div className="ct-rangee ct-joueur">
          {equipeJoueur.map((p, i) => (
            <CarteCombattant key={p.uid} poke={p} pv={pvJoueur[i] ?? p.pvMax} camp="joueur" />
          ))}
        </div>
      </div>

      <div className="ct-journal">
        {journal.map((l, i) => <p key={i} className="ct-journal-ligne">{l}</p>)}
      </div>

      {termine && (
        <div className="ct-overlay-fin">
          <p className="ct-fin-texte">Chargement de la récompense...</p>
        </div>
      )}
    </div>
  )
}

export default CombatTour