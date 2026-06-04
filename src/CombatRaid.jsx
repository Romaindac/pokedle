import { useState, useEffect, useRef } from 'react'
import CartePokemon from './CartePokemon'
import { ticCombat } from './moteurCombat'

// Combat de RAID isolé : l'équipe du joueur affronte 3 vagues d'affilée.
// - Les PV du joueur sont CONSERVÉS entre les vagues (soin partiel seulement).
// - Vague 1 (6 petits) → Vague 2 (2 mini-boss) → Vague 3 (1 gros boss).
// - Boucle setInterval + état en refs (totalement isolé du combat principal).
function CombatRaid({ raid, equipeJoueur, vagues, vitesse = 1, onTermine, onQuitter }) {
  // Index de la vague en cours (0, 1, 2).
  const [indexVague, setIndexVague] = useState(0)
  // Équipe ennemie de la vague courante.
  const [equipeEnnemie, setEquipeEnnemie] = useState(vagues[0] || [])

  // PV / jauges joueur (conservés entre vagues).
  const [pvJoueur, setPvJoueur] = useState(equipeJoueur.map((p) => p.pvMax))
  const [jaugeJoueur, setJaugeJoueur] = useState(equipeJoueur.map(() => 0))
  // PV / jauges ennemis (réinitialisés à chaque vague).
  const [pvEnnemis, setPvEnnemis] = useState((vagues[0] || []).map((p) => p.pvMax))
  const [jaugeEnnemis, setJaugeEnnemis] = useState((vagues[0] || []).map(() => 0))

  const [resultat, setResultat] = useState(null) // null | 'victoire' | 'defaite'
  const [messageVague, setMessageVague] = useState('')

  // Refs pour la boucle (évite les closures figées).
  const etat = useRef({
    pvJ: equipeJoueur.map((p) => p.pvMax),
    jJ: equipeJoueur.map(() => 0),
    pvE: (vagues[0] || []).map((p) => p.pvMax),
    jE: (vagues[0] || []).map(() => 0),
  })
  const indexVagueRef = useRef(0)
  const equipeEnnemieRef = useRef(vagues[0] || [])
  const terminePar = useRef(false) // évite les doubles fins

  const NB_VAGUES = vagues.length

  // Affiche un message de vague temporaire.
  function annoncerVague(idx) {
    const labels = ['Vague 1 — Assaut !', 'Vague 2 — Mini-boss !', 'Vague 3 — LE BOSS !']
    setMessageVague(labels[idx] || `Vague ${idx + 1}`)
    setTimeout(() => setMessageVague(''), 1800)
  }

  useEffect(() => {
    annoncerVague(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Passe à la vague suivante : soigne partiellement l'équipe, charge les ennemis suivants.
  function passerVagueSuivante() {
    const prochaine = indexVagueRef.current + 1
    if (prochaine >= NB_VAGUES) return false
    // Soin partiel de l'équipe (PV conservés + soin).
    const soin = raid.soinEntreVagues || 0
    const nouveauxPvJ = etat.current.pvJ.map((pv, i) => {
      if (pv <= 0) return pv // un KO reste KO
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

  // Boucle de combat (isolée). Dépend uniquement de la vitesse.
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
        if (!terminePar.current) {
          terminePar.current = true
          setResultat('defaite')
        }
        return
      }
      if (r.resultat === 'victoire') {
        // Vague nettoyée. Si c'était la dernière (boss) → victoire totale.
        if (indexVagueRef.current >= NB_VAGUES - 1) {
          if (!terminePar.current) {
            terminePar.current = true
            setResultat('victoire')
          }
        } else {
          passerVagueSuivante()
        }
      }
    }, Math.max(60, 400 / vitesse))
    return () => clearInterval(intervalle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vitesse, resultat])

  // Quand le résultat tombe, on prévient le parent (après un court délai d'affichage).
  useEffect(() => {
    if (!resultat) return
    const t = setTimeout(() => { onTermine && onTermine(resultat) }, 2200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultat])

  return (
    <div className="app app-layout">
      <header className="topbar">
        <div className="topbar-titre">{raid.emoji} {raid.nom}</div>
        <button className="bouton-retour-arene" onClick={() => onQuitter && onQuitter()}>
          ← Abandonner
        </button>
      </header>

      <div className="combat-arene-ecran">
        {/* Indicateur de progression des vagues */}
        <div className="raid-vagues-indic">
          {vagues.map((_, i) => (
            <span
              key={i}
              className={`raid-vague-pastille ${i < indexVague ? 'faite' : ''} ${i === indexVague ? 'active' : ''}`}
            >
              {i === NB_VAGUES - 1 ? '👑' : `V${i + 1}`}
            </span>
          ))}
        </div>

        {messageVague && <div className="raid-message-vague">{messageVague}</div>}

        {/* Équipe ennemie (vague courante) */}
        <h3 className="combat-arene-titre">
          {indexVague === NB_VAGUES - 1 ? `Boss : ${raid.boss.nomFr}` : `Vague ${indexVague + 1}`}
        </h3>
        <div className="combat-arene-rangee">
          {equipeEnnemie.map((p, i) => (
            <CartePokemon
              key={`e-${i}`}
              pokemon={p}
              pvActuels={pvEnnemis[i] ?? 0}
              jauge={jaugeEnnemis[i] ?? 0}
              niveau={p.niveau}
              compact
            />
          ))}
        </div>

        <div className="combat-arene-vs">⚔️</div>

        {/* Équipe du joueur */}
        <h3 className="combat-arene-titre">Ton équipe</h3>
        <div className="combat-arene-rangee">
          {equipeJoueur.map((p, i) => (
            <CartePokemon
              key={`j-${i}`}
              pokemon={p}
              pvActuels={pvJoueur[i] ?? 0}
              jauge={jaugeJoueur[i] ?? 0}
              niveau={p.niveau}
              compact
            />
          ))}
        </div>

        {/* Overlay de fin */}
        {resultat && (
          <div className={`combat-arene-overlay ${resultat}`}>
            <div className="combat-arene-overlay-contenu">
              {resultat === 'victoire' ? (
                <>
                  <div className="combat-arene-overlay-titre">🏆 RAID RÉUSSI !</div>
                  <div className="combat-arene-overlay-sous">Tu peux tenter de capturer {raid.boss.nomFr}…</div>
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