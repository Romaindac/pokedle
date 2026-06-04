import { useState, useRef, useEffect } from 'react'
import CartePokemon from './CartePokemon'
import { ticCombat } from './moteurCombat'
import { VITESSE_COMBAT } from './config'

// Combat PvP animé : équipe d'attaque du joueur vs équipe de défense de l'adversaire.
// Isolé du mode principal (sa propre boucle setInterval + son propre état en refs),
// exactement comme CombatArene. Pas de timer (le PvP n'en a pas).
// `onTermine(resultat)` est appelé avec 'victoire' ou 'defaite' à la fin.
function CombatPvp({ pseudoAdversaire, equipeJoueur, equipeAdverse, vitesse, onTermine, onQuitter }) {
  const [pvJ, setPvJ] = useState(() => equipeJoueur.map((p) => p.pvMax))
  const [pvD, setPvD] = useState(() => equipeAdverse.map((p) => p.pvMax))
  const [jaugeJ, setJaugeJ] = useState(() => equipeJoueur.map(() => 0))
  const [jaugeD, setJaugeD] = useState(() => equipeAdverse.map(() => 0))
  const [resultat, setResultat] = useState('en_cours') // 'en_cours' | 'victoire' | 'defaite'
  const [log, setLog] = useState([])

  const etat = useRef({
    pvJ: equipeJoueur.map((p) => p.pvMax),
    jJ: equipeJoueur.map(() => 0),
    pvD: equipeAdverse.map((p) => p.pvMax),
    jD: equipeAdverse.map(() => 0),
  })
  const fini = useRef(false)

  useEffect(() => {
    const horloge = setInterval(() => {
      if (fini.current) return
      const e = etat.current
      const avantPvJ = [...e.pvJ]
      const avantPvD = [...e.pvD]
      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, equipeAdverse, e.pvD, e.jD)
      etat.current = { pvJ: r.pvJoueur, jJ: r.jaugeJoueur, pvD: r.pvEnnemis, jD: r.jaugeEnnemis }
      setPvJ(r.pvJoueur); setJaugeJ(r.jaugeJoueur)
      setPvD(r.pvEnnemis); setJaugeD(r.jaugeEnnemis)

      // Journal : K.O. détectés ce tic, des deux côtés.
      const messages = []
      r.pvEnnemis.forEach((pv, i) => {
        if (avantPvD[i] > 0 && pv <= 0 && equipeAdverse[i]) {
          messages.push({ txt: `💥 ${equipeAdverse[i].nom} adverse est K.O. !`, camp: 'joueur' })
        }
      })
      r.pvJoueur.forEach((pv, i) => {
        if (avantPvJ[i] > 0 && pv <= 0 && equipeJoueur[i]) {
          messages.push({ txt: `😵 Ton ${equipeJoueur[i].nom} est K.O. !`, camp: 'ennemi' })
        }
      })
      if (messages.length > 0) {
        setLog((prev) => [...messages.reverse(), ...prev].slice(0, 5))
      }

      if (r.resultat !== 'en_cours') {
        fini.current = true
        setResultat(r.resultat)
        setTimeout(() => onTermine(r.resultat), 1000)
      }
    }, VITESSE_COMBAT / (vitesse || 1))

    return () => clearInterval(horloge)
  }, [])

  return (
    <div className="app app-layout">
      <header className="topbar">
        <div className="topbar-titre">⚔️ Combat PvP — vs {pseudoAdversaire}</div>
        <button className="bouton-retour-arene" onClick={onQuitter}>
          ✕ Abandonner
        </button>
      </header>

      <div
        className="arene-combat arene-combat-pvp"
        style={{ backgroundImage: 'url("/sanctuaire.png")' }}
      >
        {/* Équipe adverse (en haut) */}
        <div className="arene-combat-cote">
          <h3 className="arene-combat-label">Défense de {pseudoAdversaire}</h3>
          <div className="arene-combat-equipe">
            {equipeAdverse.map((poke, i) => (
              <CartePokemon key={i} pokemon={poke} pvActuels={pvD[i]} jauge={jaugeD[i]} niveau={poke.niveau} compact />
            ))}
          </div>
        </div>

        <div className="arene-combat-vs">⚔️</div>

        {/* Équipe du joueur (en bas) */}
        <div className="arene-combat-cote">
          <h3 className="arene-combat-label">Ton équipe d'attaque</h3>
          <div className="arene-combat-equipe">
            {equipeJoueur.map((poke, i) => (
              <CartePokemon key={poke.uid || i} pokemon={poke} pvActuels={pvJ[i]} jauge={jaugeJ[i]} niveau={poke.niveau} compact />
            ))}
          </div>
        </div>
      </div>

      {/* Journal de combat */}
      <div className="arene-journal">
        {log.length === 0 ? (
          <p className="arene-journal-vide">Le combat commence…</p>
        ) : (
          log.map((m, i) => (
            <p key={i} className={`arene-journal-ligne ${m.camp}`}>{m.txt}</p>
          ))
        )}
      </div>

      {/* Overlay de résultat */}
      {resultat !== 'en_cours' && (
        <div className={`arene-resultat ${resultat}`}>
          <div className="arene-resultat-texte">
            {resultat === 'victoire' ? '🏆 VICTOIRE !' : '💀 DÉFAITE'}
          </div>
        </div>
      )}
    </div>
  )
}

export default CombatPvp