import { useState, useEffect, useRef } from 'react'
import { ticCombat } from './moteurCombat'
import SpriteCombattant from './SpriteCombattant'
import TimerAnneau from './TimerAnneau'
import { VITESSE_COMBAT } from './config'
import { creerHorloge } from './horlogeWorker'
import AmbianceMode from './AmbianceMode'

// ============================================================
// COMBAT D'ARÈNE — combat 6 contre 6 SIMULTANÉ.
// Rendu unifié : utilise SpriteCombattant (carte-socle + aura + sprite dos/face),
// EXACTEMENT comme le combat de l'histoire. Mécaniques d'arène conservées :
// timer de boss, journal, boucle worker, overlay victoire/défaite.
// ============================================================

function nombreSur(v, repli) {
  return Number.isFinite(v) ? v : repli
}

const TEMPS_BOSS = 45 // secondes pour battre un boss d'arène (sinon défaite)

function CombatArene({ dresseur, equipeJoueur, equipeDresseur, vitesse: _vitesseIgnoree = 1, onTermine, onQuitter }) {
  const estBoss = !!(dresseur && dresseur.estBoss)

  // Vitesse PROPRE à l'arène (repart à x1 à chaque combat, boutons dans l'écran).
  const [vitesse, setVitesse] = useState(1)
  const vitesseRef = useRef(1)
  useEffect(() => { vitesseRef.current = vitesse }, [vitesse])

  // PV / jauges de TOUTE l'équipe (6v6 simultané).
  const [pvJ, setPvJ] = useState(() => (equipeJoueur || []).map((p) => nombreSur(p?.pvMax, 1)))
  const [pvE, setPvE] = useState(() => (equipeDresseur || []).map((p) => nombreSur(p?.pvMax, 1)))
  const [jaugeJ, setJaugeJ] = useState(() => (equipeJoueur || []).map(() => 0))
  const [jaugeE, setJaugeE] = useState(() => (equipeDresseur || []).map(() => 0))

  const [resultat, setResultat] = useState(null) // null | 'victoire' | 'defaite'
  const [tempsBoss, setTempsBoss] = useState(TEMPS_BOSS)
  const [journal, setJournal] = useState([])
  const compteurJournal = useRef(0)

  // État de combat en ref (la boucle lit/écrit ici, évite les soucis de closure).
  const etat = useRef({
    pvJ: (equipeJoueur || []).map((p) => nombreSur(p?.pvMax, 1)),
    jJ: (equipeJoueur || []).map(() => 0),
    pvE: (equipeDresseur || []).map((p) => nombreSur(p?.pvMax, 1)),
    jE: (equipeDresseur || []).map(() => 0),
  })
  const fini = useRef(false)
  const resultatRef = useRef(null)

  function ajouterJournal(texte, type = 'info') {
    compteurJournal.current += 1
    const ligne = { texte, type, id: `a-${compteurJournal.current}` }
    setJournal((l) => [...l, ligne].slice(-5))
  }

  function finir(res) {
    if (resultatRef.current) return
    resultatRef.current = res
    fini.current = true
    setResultat(res)
    ajouterJournal(res === 'victoire' ? '🏆 VICTOIRE !' : '💀 DÉFAITE…', res === 'victoire' ? 'victoire' : 'echec')
  }

  // ===== TIMER DE BOSS (basé sur Date.now, indépendant de la vitesse) =====
  useEffect(() => {
    if (!estBoss) return
    setTempsBoss(TEMPS_BOSS)
    const debut = Date.now()
    const tic = setInterval(() => {
      const reste = Math.max(0, TEMPS_BOSS - (Date.now() - debut) / 1000)
      setTempsBoss(reste)
      if (reste <= 0) {
        clearInterval(tic)
        if (!resultatRef.current) {
          ajouterJournal('⏱️ Temps écoulé ! Le boss vous a résisté.', 'echec')
          finir('defaite')
        }
      }
    }, 100)
    return () => clearInterval(tic)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estBoss])

  // ===== BOUCLE DE COMBAT 6v6 (isolée, pilotée par worker) =====
  useEffect(() => {
    let dernierTic = Date.now()

    const horloge = creerHorloge(() => {
      if (fini.current) return
      const maintenant = Date.now()
      const intervalleCombat = VITESSE_COMBAT / Math.max(1, vitesseRef.current)
      if (maintenant - dernierTic < intervalleCombat) return
      dernierTic = maintenant

      const e = etat.current
      const avantPvE = [...e.pvE]
      const avantPvJ = [...e.pvJ]
      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, equipeDresseur, e.pvE, e.jE)
      etat.current = { pvJ: r.pvJoueur, jJ: r.jaugeJoueur, pvE: r.pvEnnemis, jE: r.jaugeEnnemis }
      setPvJ(r.pvJoueur); setJaugeJ(r.jaugeJoueur)
      setPvE(r.pvEnnemis); setJaugeE(r.jaugeEnnemis)

      // Journal des K.O. ce tic (des deux côtés).
      r.pvEnnemis.forEach((pv, i) => {
        if (avantPvE[i] > 0 && pv <= 0 && equipeDresseur[i]) {
          ajouterJournal(`${equipeDresseur[i].nom} est K.O. !`, 'victoire')
        }
      })
      r.pvJoueur.forEach((pv, i) => {
        if (avantPvJ[i] > 0 && pv <= 0 && equipeJoueur[i]) {
          ajouterJournal(`Ton ${equipeJoueur[i].nom} est K.O. !`, 'echec')
        }
      })

      if (r.resultat !== 'en_cours') {
        finir(r.resultat)
      }
    })

    // Le worker tique vite (40ms) ; le cadençage réel se fait par horodatage ci-dessus.
    horloge.start(40)

    return () => horloge.detruire()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Quand le résultat est posé, prévient le parent après un court délai (affiche l'overlay).
  useEffect(() => {
    if (!resultat) return
    const t = setTimeout(() => { onTermine && onTermine(resultat) }, 1600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultat])

  // Compteurs de Pokémon restants par camp.
  const restantsJ = pvJ.filter((pv) => nombreSur(pv, 0) > 0).length
  const restantsE = pvE.filter((pv) => nombreSur(pv, 0) > 0).length

  return (
    <div className="app app-layout">
      <header className="topbar">
        <div className="topbar-titre">⚔️ Arène — {dresseur?.nom || 'Combat'}</div>
        <button className="bouton-fermer" onClick={() => onQuitter && onQuitter()} title="Quitter le combat">✕</button>
      </header>

      <div className="arene-combat">
        {/* Bandeau dresseur + vitesse + timer si boss */}
        <div className="arene-combat-entete">
          <span className="arene-combat-titre">
            {dresseur?.emoji ? `${dresseur.emoji} ` : ''}{dresseur?.nom}
            {estBoss && <span className="bandeau-badge bandeau-badge-boss"> ★ BOSS</span>}
          </span>
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
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
          {estBoss && !resultat && (
            <TimerAnneau tempsRestant={tempsBoss} tempsTotal={TEMPS_BOSS} taille={58} />
          )}
        </div>

        {/* Zone de combat 6v6 : terrain identique à l'histoire (SpriteCombattant) */}
        <div className={`arene arene-terrain ${estBoss ? 'arene-boss' : ''}`} style={{ minHeight: '54vh', paddingBottom: '40px', position: 'relative', overflow: 'hidden' }}>
          <AmbianceMode mode="arene" boss={estBoss} />
          <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="arene-combat-restants" style={{ textAlign: 'center', marginBottom: 4 }}>
            {dresseur?.nom} — {restantsE} restant{restantsE > 1 ? 's' : ''}
          </div>
          <div className="terrain-rangee terrain-ennemis" style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: '2%', width: '92%', margin: '0 auto' }}>
            {equipeDresseur.map((poke, i) => (
              <div className="terrain-slot" key={`${poke.uid || 'enn'}-${i}`}>
                <SpriteCombattant pokemon={poke} pvActuels={nombreSur(pvE[i], 0)} jauge={jaugeE[i]} camp="ennemi" ultimeEnnemi />
              </div>
            ))}
          </div>

          <div className="terrain-vs"><span className="vs-texte">VS</span></div>

          <div className="terrain-rangee terrain-joueur" style={{ display: 'flex', justifyContent: 'center', gap: 24, width: '92%', margin: '0 auto' }}>
            {equipeJoueur.map((poke, i) => (
              <div className="terrain-slot" key={poke.uid || i}>
                <SpriteCombattant pokemon={poke} pvActuels={nombreSur(pvJ[i], 0)} jauge={jaugeJ[i]} camp="joueur" />
              </div>
            ))}
          </div>
          <div className="arene-combat-restants" style={{ textAlign: 'center', marginTop: 4 }}>
            Ton équipe — {restantsJ} restant{restantsJ > 1 ? 's' : ''}
          </div>
          </div>
        </div>

        {/* Journal de combat */}
        <div className="console arene-combat-journal">
          {journal.length === 0 ? (
            <p className="console-vide">Le combat commence…</p>
          ) : (
            journal.map((l) => <p key={l.id} className={`console-ligne ${l.type}`}>{l.texte}</p>)
          )}
        </div>
      </div>

      {/* Overlay de fin (victoire / défaite) */}
      {resultat && (
        <div className="arene-overlay">
          <div className={`arene-overlay-boite ${resultat === 'victoire' ? 'victoire' : 'defaite'}`}>
            <span className="arene-overlay-emoji">{resultat === 'victoire' ? '🏆' : '💀'}</span>
            <span className="arene-overlay-texte">{resultat === 'victoire' ? 'VICTOIRE !' : 'DÉFAITE'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default CombatArene