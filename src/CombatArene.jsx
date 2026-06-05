import { useState, useEffect, useRef } from 'react'
import { ticCombat } from './moteurCombat'
import CartePokemon from './CartePokemon'
import TimerAnneau from './TimerAnneau'
import { VITESSE_COMBAT } from './config'
import { creerHorloge } from './horlogeWorker'

// ============================================================
// COMBAT D'ARÈNE — combat 6 contre 6 SIMULTANÉ (refonte : avant c'était du 1v1).
//
// Composant ISOLÉ : sa PROPRE boucle (horloge worker) + son propre état (en refs),
// séparé de la boucle principale (mise en pause via modeJeuRef === 'arene' côté App).
// Réutilise ticCombat (même moteur que le combat principal / PvP) sur les ÉQUIPES
// COMPLÈTES → tous les passifs d'équipe (soin, buffs, malus) fonctionnent vraiment.
//
// La boucle est pilotée par un Web Worker (horlogeWorker) → continue à cadence
// normale même quand l'onglet est en arrière-plan (pas de throttling navigateur).
//
// Spécificités arène conservées :
//   - Timer de boss (dresseur.estBoss) : 45s pour gagner, sinon défaite.
//   - Overlay 🏆 VICTOIRE / 💀 DÉFAITE + callback onTermine.
//   - Journal des K.O.
//
// Props :
//   - dresseur       : le dresseur affronté (peut avoir estBoss = true → timer).
//   - equipeJoueur   : tableau de Pokémon du joueur (équipe complète).
//   - equipeDresseur : tableau de Pokémon du dresseur (équipe complète).
//   - vitesse        : multiplicateur de vitesse (×1/×2/×4/×8).
//   - onTermine(res) : 'victoire' | 'defaite' à la fin.
//   - onQuitter()    : si le joueur quitte manuellement.
// ============================================================

function nombreSur(v, repli) {
  return Number.isFinite(v) ? v : repli
}

const TEMPS_BOSS = 45 // secondes pour battre un boss d'arène (sinon défaite)

function CombatArene({ dresseur, equipeJoueur, equipeDresseur, vitesse = 1, onTermine, onQuitter }) {
  const estBoss = !!(dresseur && dresseur.estBoss)

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
    const intervalleCombat = VITESSE_COMBAT / Math.max(1, vitesse)

    const horloge = creerHorloge(() => {
      if (fini.current) return
      const maintenant = Date.now()
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
  }, [vitesse])

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
        {/* Bandeau dresseur + timer si boss */}
        <div className="arene-combat-entete">
          <span className="arene-combat-titre">
            {dresseur?.emoji ? `${dresseur.emoji} ` : ''}{dresseur?.nom}
            {estBoss && <span className="bandeau-badge bandeau-badge-boss"> ★ BOSS</span>}
          </span>
          {estBoss && !resultat && (
            <TimerAnneau tempsRestant={tempsBoss} tempsTotal={TEMPS_BOSS} taille={58} />
          )}
        </div>

        {/* Zone de combat 6v6 : équipe dresseur en haut, équipe joueur en bas */}
        <div className="arene-combat-zone arene-combat-6v6">
          <div className="arene-combat-cote">
            <span className="arene-combat-restants">{dresseur?.nom} — {restantsE} restant{restantsE > 1 ? 's' : ''}</span>
            <div className="arene-combat-equipe">
              {equipeDresseur.map((poke, i) => (
                <CartePokemon
                  key={i}
                  pokemon={poke}
                  pvActuels={nombreSur(pvE[i], 0)}
                  jauge={jaugeE[i]}
                  niveau={poke.niveau}
                  compact
                />
              ))}
            </div>
          </div>

          <div className="vs"><span className="vs-texte">VS</span></div>

          <div className="arene-combat-cote">
            <span className="arene-combat-restants">Ton équipe — {restantsJ} restant{restantsJ > 1 ? 's' : ''}</span>
            <div className="arene-combat-equipe">
              {equipeJoueur.map((poke, i) => (
                <CartePokemon
                  key={poke.uid || i}
                  pokemon={poke}
                  pvActuels={nombreSur(pvJ[i], 0)}
                  jauge={jaugeJ[i]}
                  niveau={poke.niveau}
                  compact
                />
              ))}
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