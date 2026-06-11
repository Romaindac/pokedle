import { useState, useEffect, useRef } from 'react'
import { ticCombat } from './moteurCombat'
import SpriteCombattant from './SpriteCombattant'
import { VITESSE_COMBAT } from './config'
import { typeNiveau, difficulteNiveau } from './tour'
import { creerHorloge } from './horlogeWorker'
import AmbianceMode, { decorPourNumero } from './AmbianceMode'

// ============================================================
// COMBAT DE TOUR INFINIE — rendu unifié via SpriteCombattant
// (carte-socle + aura + sprite dos/face), comme l'histoire.
// Mécaniques de tour conservées : niveau, type (boss/miniboss),
// boucle worker, journal, overlay de fin.
// ============================================================

function nombreSur(v, repli) {
  return Number.isFinite(v) ? v : repli
}

function CombatTour({
  niveauTour,
  equipeJoueur,
  equipeEnnemie,
  vitesse: _vitesseIgnoree = 1,
  onVictoire,
  onDefaite,
  onQuitter,
}) {
  const type = typeNiveau(niveauTour)
  const labelType = type === 'boss' ? '👑 BOSS' : type === 'miniboss' ? '⚔️ Mini-Boss' : '⚡ Niveau'

  // Vitesse PROPRE à la tour (repart à x1 à chaque combat).
  const [vitesse, setVitesse] = useState(1)
  const vitesseRef = useRef(1)
  useEffect(() => { vitesseRef.current = vitesse }, [vitesse])

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
  const termineRef = useRef(false)

  function log(texte) {
    setJournal((l) => [...l.slice(-5), texte])
  }

  useEffect(() => {
    let dernierTic = Date.now()
    const horloge = creerHorloge(() => {
      if (termineRef.current) return
      const maintenant = Date.now()
      const intervalle = VITESSE_COMBAT / vitesseRef.current
      if (maintenant - dernierTic < intervalle) return
      dernierTic = maintenant

      const e = etat.current
      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, equipeEnnemie, e.pvE, e.jE, {})
      etat.current = { pvJ: r.pvJoueur, jJ: r.jaugeJoueur, pvE: r.pvEnnemis, jE: r.jaugeEnnemis }
      setPvJoueur([...r.pvJoueur])
      setPvEnnemis([...r.pvEnnemis])
      setJaugeJoueur([...r.jaugeJoueur])
      setJaugeEnnemis([...r.jaugeEnnemis])

      if (r.ennemisTombes && r.ennemisTombes.length > 0) {
        r.ennemisTombes.forEach((i) => {
          const en = equipeEnnemie[i]
          if (en) log(`💥 ${en.nom} est K.O. !`)
        })
      }

      if (r.resultat === 'victoire') {
        termineRef.current = true
        setTermine(true)
        log(`✅ Niveau ${niveauTour} vaincu !`)
        setTimeout(() => onVictoire(), 1200)
      } else if (r.resultat === 'defaite') {
        termineRef.current = true
        setTermine(true)
        log(`💀 Ton équipe est K.O. — Run terminée au niveau ${niveauTour}.`)
        setTimeout(() => onDefaite(), 1800)
      }
    })
    horloge.start(40)
    return () => horloge.detruire()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const restantsE = pvEnnemis.filter((pv) => nombreSur(pv, 0) > 0).length
  const restantsJ = pvJoueur.filter((pv) => nombreSur(pv, 0) > 0).length

  return (
    <div className="ct-ecran">
      <div className="ct-header">
        <span className="ct-niveau-label">{labelType} {niveauTour}</span>
        <div style={{ display: 'flex', gap: 4, margin: '0 auto 0 12px' }}>
          {[1, 2, 4].map((v) => (
            <button key={v} onClick={() => setVitesse(v)}
              style={{
                padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontWeight: 800, fontSize: 13,
                border: vitesse === v ? '2px solid #fcd34d' : '1px solid rgba(255,255,255,0.2)',
                background: vitesse === v ? 'rgba(252,211,77,0.18)' : 'rgba(255,255,255,0.05)',
                color: vitesse === v ? '#fcd34d' : '#cfd8e3',
              }}>x{v}</button>
          ))}
        </div>
        <button className="ct-quitter" onClick={onQuitter}>✕ Abandonner</button>
      </div>

      {/* Terrain identique à l'histoire (SpriteCombattant) */}
      <div className={`arene arene-terrain ${type === 'boss' ? 'arene-boss' : ''}`} style={{ minHeight: '54vh', paddingBottom: '40px', position: 'relative', overflow: 'hidden' }}>
        <AmbianceMode mode="tour" boss={type === 'boss'} fondForce={decorPourNumero(niveauTour * 7 + 3)} />
        <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="arene-combat-restants" style={{ textAlign: 'center', marginBottom: 4 }}>
          Ennemis — {restantsE} restant{restantsE > 1 ? 's' : ''}
        </div>
        <div className="terrain-rangee terrain-ennemis" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: '2%', width: '92%', margin: '0 auto' }}>
          {equipeEnnemie.map((poke, i) => (
            <div className="terrain-slot" key={`${poke.uid || 'enn'}-${i}`}>
              <SpriteCombattant pokemon={poke} pvActuels={nombreSur(pvEnnemis[i], 0)} jauge={jaugeEnnemis[i]} camp="ennemi" ultimeEnnemi />
            </div>
          ))}
        </div>

        <div className="terrain-vs"><span className="vs-texte">VS</span></div>

        <div className="terrain-rangee terrain-joueur" style={{ display: 'flex', justifyContent: 'center', gap: 24, width: '92%', margin: '0 auto' }}>
          {equipeJoueur.map((poke, i) => (
            <div className="terrain-slot" key={poke.uid || i}>
              <SpriteCombattant pokemon={poke} pvActuels={nombreSur(pvJoueur[i], 0)} jauge={jaugeJoueur[i]} camp="joueur" />
            </div>
          ))}
        </div>
        <div className="arene-combat-restants" style={{ textAlign: 'center', marginTop: 4 }}>
          Ton équipe — {restantsJ} restant{restantsJ > 1 ? 's' : ''}
        </div>
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