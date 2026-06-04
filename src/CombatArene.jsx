import { useState, useRef, useEffect } from 'react'
import CartePokemon from './CartePokemon'
import TimerAnneau from './TimerAnneau'
import { ticCombat } from './moteurCombat'
import { VITESSE_COMBAT } from './config'

// Correspondance thème de dresseur -> décor de fond (réutilise les 14 fonds existants).
const DECOR_PAR_THEME = {
  Roche: '/grotte.png',
  Sol: '/grotte.png',
  Feu: '/volcan.png',
  Eau: '/abysses.png',
  Plante: '/foret.png',
  Insecte: '/foret.png',
  Spectre: '/marais.png',
  Ténèbres: '/marais.png',
  Poison: '/marais.png',
  Psy: '/cristal.png',
  Combat: '/prairie.png',
  Normal: '/prairie.png',
  Dragon: '/dragon.png',
  Acier: '/grotte.png',
  Varié: '/temple.png',
  Légende: '/sanctuaire.png',
}

// Combat animé d'arène : équipe du joueur vs équipe du dresseur, en manches.
// Isolé du mode principal (sa propre boucle setInterval et son propre état).
function CombatArene({ dresseur, equipeJoueur, equipeDresseur, vitesse, onTermine, onQuitter }) {
  // État des PV et jauges, dans des refs (lus par la boucle) + states (pour l'affichage).
  const [pvJ, setPvJ] = useState(() => equipeJoueur.map((p) => p.pvMax))
  const [pvD, setPvD] = useState(() => equipeDresseur.map((p) => p.pvMax))
  const [jaugeJ, setJaugeJ] = useState(() => equipeJoueur.map(() => 0))
  const [jaugeD, setJaugeD] = useState(() => equipeDresseur.map(() => 0))
  const [resultat, setResultat] = useState('en_cours') // 'en_cours' | 'victoire' | 'defaite'

  // Décor de fond selon le thème du dresseur (fallback : temple).
  const decorFond = DECOR_PAR_THEME[dresseur.theme] || '/temple.png'

  // Timer : seulement pour les boss emblématiques. 45 secondes pour gagner, sinon défaite.
  const TEMPS_BOSS = 45
  const estBoss = dresseur.estBoss === true
  const [tempsRestant, setTempsRestant] = useState(TEMPS_BOSS)
  const [log, setLog] = useState([])  // journal de combat (5 derniers messages)

  const etat = useRef({
    pvJ: equipeJoueur.map((p) => p.pvMax),
    jJ: equipeJoueur.map(() => 0),
    pvD: equipeDresseur.map((p) => p.pvMax),
    jD: equipeDresseur.map(() => 0),
  })
  const fini = useRef(false)

  // Décompte du timer (boss uniquement), basé sur le temps réel (indépendant de la vitesse de combat).
  useEffect(() => {
    if (!estBoss) return
    const debut = Date.now()
    const tic = setInterval(() => {
      if (fini.current) return
      const ecoule = (Date.now() - debut) / 1000
      const reste = Math.max(0, TEMPS_BOSS - ecoule)
      setTempsRestant(reste)
      if (reste <= 0) {
        fini.current = true
        setResultat('defaite')
        setTimeout(() => onTermine('defaite'), 800)
      }
    }, 100)
    return () => clearInterval(tic)
  }, [estBoss])

  useEffect(() => {
    const horloge = setInterval(() => {
      if (fini.current) return
      const e = etat.current
      const avantPvJ = [...e.pvJ]
      const avantPvD = [...e.pvD]
      const r = ticCombat(equipeJoueur, e.pvJ, e.jJ, equipeDresseur, e.pvD, e.jD)
      etat.current = { pvJ: r.pvJoueur, jJ: r.jaugeJoueur, pvD: r.pvEnnemis, jD: r.jaugeEnnemis }
      setPvJ(r.pvJoueur); setJaugeJ(r.jaugeJoueur)
      setPvD(r.pvEnnemis); setJaugeD(r.jaugeEnnemis)

      // Journal : détecter les Pokémon mis K.O. ce tic (PV passés de >0 à 0), des deux côtés.
      const messages = []
      r.pvEnnemis.forEach((pv, i) => {
        if (avantPvD[i] > 0 && pv <= 0 && equipeDresseur[i]) {
          messages.push({ txt: `💥 ${equipeDresseur[i].nom} du dresseur est K.O. !`, camp: 'joueur' })
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
        // On prévient le parent après une petite pause (pour voir le dernier coup).
        setTimeout(() => onTermine(r.resultat), 800)
      }
    }, VITESSE_COMBAT / (vitesse || 1))

    return () => clearInterval(horloge)
  }, [])

  return (
    <div className="app app-layout">
      <header className="topbar">
        <div className="topbar-titre">⚔️ {dresseur.emoji} {dresseur.nom}</div>
        {estBoss && resultat === 'en_cours' && (
          <TimerAnneau tempsRestant={tempsRestant} tempsTotal={TEMPS_BOSS} />
        )}
        <button className="bouton-retour-arene" onClick={onQuitter}>
          ✕ Abandonner
        </button>
      </header>

      <div
        className={`arene-combat ${estBoss ? 'arene-combat-boss' : ''}`}
        style={{ backgroundImage: `url("${decorFond}")` }}
      >
        {/* Équipe du dresseur (en haut) */}
        <div className="arene-combat-cote">
          <h3 className="arene-combat-label">{dresseur.titre}</h3>
          <div className="arene-combat-equipe">
            {equipeDresseur.map((poke, i) => (
              <CartePokemon key={i} pokemon={poke} pvActuels={pvD[i]} jauge={jaugeD[i]} niveau={poke.niveau} compact />
            ))}
          </div>
        </div>

        <div className="arene-combat-vs">⚔️</div>

        {/* Équipe du joueur (en bas) */}
        <div className="arene-combat-cote">
          <h3 className="arene-combat-label">Ton équipe</h3>
          <div className="arene-combat-equipe">
            {equipeJoueur.map((poke, i) => (
              <CartePokemon key={poke.uid} pokemon={poke} pvActuels={pvJ[i]} jauge={jaugeJ[i]} niveau={poke.niveau} compact />
            ))}
          </div>
        </div>
      </div>

      {/* Journal de combat d'arène */}
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

export default CombatArene