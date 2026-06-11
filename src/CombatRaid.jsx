import { useState, useEffect, useRef } from 'react'
import SpriteCombattant from './SpriteCombattant'
import { ticCombat } from './moteurCombat'
import AmbianceMode from './AmbianceMode'

// ============================================================
// COMBAT DE RAID — N vagues d'affilée, PV joueur conservés entre vagues.
// Rendu unifié via SpriteCombattant (carte-socle + aura + sprite dos/face),
// comme l'histoire. Mécaniques de raid conservées (vagues, soin, overlay).
// ============================================================

function nombreSur(v, repli) {
  return Number.isFinite(v) ? v : repli
}

// Vitesse mémorisée pendant la session (persiste entre les raids, revient à 1 au F5).
let vitesseRaidSession = 1

function CombatRaid({ raid, equipeJoueur, vagues, vitesse: _vitesseIgnoree = 1, onTermine, onQuitter }) {
  // Vitesse PROPRE au raid, mémorisée pendant la session (revient à x1 au F5).
  const [vitesse, setVitesseEtat] = useState(vitesseRaidSession)
  const vitesseRef = useRef(vitesseRaidSession)
  const setVitesse = (v) => { vitesseRaidSession = v; setVitesseEtat(v) }
  useEffect(() => { vitesseRef.current = vitesse }, [vitesse])

  const [indexVague, setIndexVague] = useState(0)
  const [equipeEnnemie, setEquipeEnnemie] = useState(vagues[0] || [])

  const [pvJoueur, setPvJoueur] = useState(equipeJoueur.map((p) => p.pvMax))
  const [jaugeJoueur, setJaugeJoueur] = useState(equipeJoueur.map(() => 0))
  const [pvEnnemis, setPvEnnemis] = useState((vagues[0] || []).map((p) => p.pvMax))
  const [jaugeEnnemis, setJaugeEnnemis] = useState((vagues[0] || []).map(() => 0))

  const [resultat, setResultat] = useState(null)
  const [messageVague, setMessageVague] = useState('')

  const etat = useRef({
    pvJ: equipeJoueur.map((p) => p.pvMax),
    jJ: equipeJoueur.map(() => 0),
    pvE: (vagues[0] || []).map((p) => p.pvMax),
    jE: (vagues[0] || []).map(() => 0),
  })
  const indexVagueRef = useRef(0)
  const equipeEnnemieRef = useRef(vagues[0] || [])
  const terminePar = useRef(false)

  const NB_VAGUES = vagues.length

  // Affiche un message de vague temporaire (générique pour N vagues).
  function annoncerVague(idx) {
    const dernier = NB_VAGUES - 1
    let label
    if (idx === dernier) label = `Vague ${idx + 1} — LE BOSS !`
    else if (idx === 0) label = 'Vague 1 — Assaut !'
    else if (idx === dernier - 1) label = `Vague ${idx + 1} — Garde rapprochée !`
    else label = `Vague ${idx + 1} — Mini-boss !`
    setMessageVague(label)
    setTimeout(() => setMessageVague(''), 1800)
  }

  useEffect(() => {
    annoncerVague(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function passerVagueSuivante() {
    const prochaine = indexVagueRef.current + 1
    if (prochaine >= NB_VAGUES) return false
    const soin = raid.soinEntreVagues || 0
    const nouveauxPvJ = etat.current.pvJ.map((pv, i) => {
      if (pv <= 0) return pv
      const max = equipeJoueur[i].pvMax
      return Math.min(max, Math.round(pv + max * soin))
    })
    const vagueEnnemis = vagues[prochaine] || []
    etat.current.pvJ = nouveauxPvJ
    etat.current.jJ = equipeJoueur.map(() => 0)
    etat.current.pvE = vagueEnnemis.map((p) => p.pvMax)
    etat.current.jE = vagueEnnemis.map(() => 0)
    indexVagueRef.current = prochaine
    equipeEnnemieRef.current = vagueEnnemis

    setIndexVague(prochaine)
    setEquipeEnnemie(vagueEnnemis)
    setPvJoueur(nouveauxPvJ)
    setJaugeJoueur(equipeJoueur.map(() => 0))
    setPvEnnemis(vagueEnnemis.map((p) => p.pvMax))
    setJaugeEnnemis(vagueEnnemis.map(() => 0))
    annoncerVague(prochaine)
    return true
  }

  useEffect(() => {
    if (resultat) return
    const intervalle = setInterval(() => {
      const e = etat.current
      const ennemis = equipeEnnemieRef.current
      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, ennemis, e.pvE, e.jE)
      e.pvJ = r.pvJoueur
      e.jJ = r.jaugeJoueur
      e.pvE = r.pvEnnemis
      e.jE = r.jaugeEnnemis
      setPvJoueur([...r.pvJoueur])
      setJaugeJoueur([...r.jaugeJoueur])
      setPvEnnemis([...r.pvEnnemis])
      setJaugeEnnemis([...r.jaugeEnnemis])

      if (r.resultat === 'defaite') {
        if (!terminePar.current) { terminePar.current = true; setResultat('defaite') }
        return
      }
      if (r.resultat === 'victoire') {
        if (indexVagueRef.current >= NB_VAGUES - 1) {
          if (!terminePar.current) { terminePar.current = true; setResultat('victoire') }
        } else {
          passerVagueSuivante()
        }
      }
    }, Math.max(60, 400 / vitesseRef.current))
    return () => clearInterval(intervalle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultat, vitesse])

  useEffect(() => {
    if (!resultat) return
    const t = setTimeout(() => { onTermine && onTermine(resultat) }, 2200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultat])

  const restantsE = pvEnnemis.filter((pv) => nombreSur(pv, 0) > 0).length
  const restantsJ = pvJoueur.filter((pv) => nombreSur(pv, 0) > 0).length
  const estVagueBoss = indexVague === NB_VAGUES - 1

  return (
    <div className="app app-layout">
      <header className="arn-topbar">
        <div className="arn-topbar-titre">{raid.emoji} {raid.nom}</div>
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', marginRight: 12 }}>
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
        <button className="arn-retour" onClick={() => onQuitter && onQuitter()}>← Abandonner</button>
      </header>

      <div className="combat-arene-ecran">
        <div className="raid-vagues-indic">
          {vagues.map((_, i) => (
            <span key={i} className={`raid-vague-pastille ${i < indexVague ? 'faite' : ''} ${i === indexVague ? 'active' : ''}`}>
              {i === NB_VAGUES - 1 ? '👑' : `V${i + 1}`}
            </span>
          ))}
        </div>

        {messageVague && <div className="raid-message-vague">{messageVague}</div>}

        {/* Terrain identique à l'histoire (SpriteCombattant) */}
        <div className={`arene arene-terrain ${estVagueBoss ? 'arene-boss' : ''}`} style={{ minHeight: '54vh', paddingBottom: '40px', position: 'relative', overflow: 'hidden' }}>
          <AmbianceMode mode="raid" boss={estVagueBoss} />
          <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="arene-combat-restants" style={{ textAlign: 'center', marginBottom: 4 }}>
            {estVagueBoss ? `Boss : ${raid.boss?.nomFr || ''}` : `Vague ${indexVague + 1}`} — {restantsE} restant{restantsE > 1 ? 's' : ''}
          </div>
          <div className="terrain-rangee terrain-ennemis" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: '2%', width: '92%', margin: '0 auto' }}>
            {equipeEnnemie.map((poke, i) => (
              <div className="terrain-slot" key={`e-${poke.uid || i}`}>
                <SpriteCombattant pokemon={poke} pvActuels={nombreSur(pvEnnemis[i], 0)} jauge={jaugeEnnemis[i]} camp="ennemi" ultimeEnnemi />
              </div>
            ))}
          </div>

          <div className="terrain-vs"><span className="vs-texte">VS</span></div>

          <div className="terrain-rangee terrain-joueur" style={{ display: 'flex', justifyContent: 'center', gap: 24, width: '92%', margin: '0 auto' }}>
            {equipeJoueur.map((poke, i) => (
              <div className="terrain-slot" key={`j-${poke.uid || i}`}>
                <SpriteCombattant pokemon={poke} pvActuels={nombreSur(pvJoueur[i], 0)} jauge={jaugeJoueur[i]} camp="joueur" />
              </div>
            ))}
          </div>
          <div className="arene-combat-restants" style={{ textAlign: 'center', marginTop: 4 }}>
            Ton équipe — {restantsJ} restant{restantsJ > 1 ? 's' : ''}
          </div>
          </div>
        </div>

        {resultat && (
          <div className={`combat-arene-overlay ${resultat}`}>
            <div className="combat-arene-overlay-contenu">
              {resultat === 'victoire' ? (
                <>
                  <div className="combat-arene-overlay-titre">🏆 RAID RÉUSSI !</div>
                  <div className="combat-arene-overlay-sous">Tu peux tenter de capturer {raid.boss?.nomFr}…</div>
                </>
              ) : (
                <>
                  <div className="combat-arene-overlay-titre">💀 DÉFAITE</div>
                  <div className="combat-arene-overlay-sous">Pas de cooldown — réessaie quand tu veux !</div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CombatRaid