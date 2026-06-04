import { useState, useEffect, useRef } from 'react'
import { ticCombat } from './moteurCombat'
import CartePokemon from './CartePokemon'
import TimerAnneau from './TimerAnneau'
import { VITESSE_COMBAT } from './config'

// ============================================================
// COMBAT D'ARÈNE — combat 1 contre 1 (le suivant entre quand l'actuel est KO).
//
// Composant ISOLÉ : il a sa PROPRE boucle setInterval et son propre état (en refs),
// totalement séparé de la boucle de combat principale d'App.jsx. La boucle principale
// est mise en pause pendant l'arène (modeJeuRef === 'arene' côté App).
//
// Réutilise ticCombat (le même moteur que le combat principal), mais en lui passant
// à chaque tic UNIQUEMENT le Pokémon actif de chaque camp (combat singulier). Quand
// l'un tombe, on passe au suivant de son équipe. Quand une équipe entière est KO,
// le combat se termine (overlay victoire/défaite + callback onTermine).
//
// Props :
//   - dresseur       : le dresseur affronté (peut avoir estBoss = true → timer).
//   - equipeJoueur   : tableau de Pokémon du joueur (ordre = ordre d'entrée).
//   - equipeDresseur : tableau de Pokémon du dresseur.
//   - vitesse        : multiplicateur de vitesse (×1/×2/×4/×8).
//   - onTermine(res) : appelé avec 'victoire' ou 'defaite' à la fin.
//   - onQuitter()    : appelé si le joueur quitte le combat manuellement.
// ============================================================

// Helper anti-NaN : nombre fini >= 0 sinon repli.
function nombreSur(v, repli) {
  return Number.isFinite(v) ? v : repli
}

const TEMPS_BOSS = 45 // secondes pour battre un boss d'arène (sinon défaite)

function CombatArene({ dresseur, equipeJoueur, equipeDresseur, vitesse = 1, onTermine, onQuitter }) {
  const estBoss = !!(dresseur && dresseur.estBoss)

  // --- Index du Pokémon actif dans chaque équipe ---
  const [indexJ, setIndexJ] = useState(0)
  const [indexE, setIndexE] = useState(0)

  // --- PV et jauge du combattant actif de chaque camp ---
  // On garde un tableau de PV pour TOUTE l'équipe (pour savoir qui est encore debout
  // et afficher l'état), mais le combat ne fait s'affronter que les actifs.
  const [pvJoueur, setPvJoueur] = useState(() => (equipeJoueur || []).map((p) => nombreSur(p?.pvMax, 1)))
  const [pvEnnemi, setPvEnnemi] = useState(() => (equipeDresseur || []).map((p) => nombreSur(p?.pvMax, 1)))
  const [jaugeJ, setJaugeJ] = useState(0)
  const [jaugeE, setJaugeE] = useState(0)

  // --- Résultat (null tant que le combat dure, sinon 'victoire' / 'defaite') ---
  const [resultat, setResultat] = useState(null)

  // --- Timer de boss (en secondes, basé sur le temps réel) ---
  const [tempsBoss, setTempsBoss] = useState(TEMPS_BOSS)

  // --- Journal simple du combat d'arène (quelques lignes) ---
  const [journal, setJournal] = useState([])
  const compteurJournal = useRef(0)

  // ===== REFS (la boucle lit/écrit ici pour éviter les soucis de closure) =====
  const indexJRef = useRef(0)
  const indexERef = useRef(0)
  const pvJRef = useRef(pvJoueur)
  const pvERef = useRef(pvEnnemi)
  const jaugeJRef = useRef(0)
  const jaugeERef = useRef(0)
  const resultatRef = useRef(null)

  useEffect(() => { indexJRef.current = indexJ }, [indexJ])
  useEffect(() => { indexERef.current = indexE }, [indexE])
  useEffect(() => { pvJRef.current = pvJoueur }, [pvJoueur])
  useEffect(() => { pvERef.current = pvEnnemi }, [pvEnnemi])
  useEffect(() => { jaugeJRef.current = jaugeJ }, [jaugeJ])
  useEffect(() => { jaugeERef.current = jaugeE }, [jaugeE])
  useEffect(() => { resultatRef.current = resultat }, [resultat])

  function ajouterJournal(texte, type = 'info') {
    compteurJournal.current += 1
    const ligne = { texte, type, id: `a-${compteurJournal.current}` }
    setJournal((l) => [...l, ligne].slice(-5))
  }

  // Trouve l'index du prochain Pokémon vivant (pv > 0) à partir de `depuis`.
  function prochainVivant(pvs, depuis) {
    for (let i = depuis; i < pvs.length; i++) {
      if (nombreSur(pvs[i], 0) > 0) return i
    }
    return -1
  }

  // ===== TIMER DE BOSS (séparé de la boucle de combat, basé sur Date.now) =====
  useEffect(() => {
    if (!estBoss) return
    if (resultat) return
    setTempsBoss(TEMPS_BOSS)
    const debut = Date.now()
    const tic = setInterval(() => {
      const reste = Math.max(0, TEMPS_BOSS - (Date.now() - debut) / 1000)
      setTempsBoss(reste)
      if (reste <= 0) {
        clearInterval(tic)
        if (!resultatRef.current) {
          resultatRef.current = 'defaite'
          setResultat('defaite')
          ajouterJournal('⏱️ Temps écoulé ! Le boss vous a résisté.', 'echec')
        }
      }
    }, 100)
    return () => clearInterval(tic)
    // On relance le timer seulement au montage du combat (pas à chaque tic).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estBoss])

  // ===== BOUCLE DE COMBAT (isolée) =====
  useEffect(() => {
    if (resultat) return // combat terminé : on n'arme pas la boucle

    const horloge = setInterval(() => {
      // Si le combat est déjà résolu (timer boss par ex.), on s'arrête.
      if (resultatRef.current) return

      const iJ = indexJRef.current
      const iE = indexERef.current
      const actifJ = equipeJoueur[iJ]
      const actifE = equipeDresseur[iE]

      // Sécurité : si l'un des actifs n'existe pas, on tente de passer au suivant
      // vivant ; si personne, on termine le combat (évite tout blocage).
      if (!actifJ || !actifE) {
        const vJ = prochainVivant(pvJRef.current, 0)
        const vE = prochainVivant(pvERef.current, 0)
        if (vJ === -1) { finir('defaite'); return }
        if (vE === -1) { finir('victoire'); return }
        if (!equipeJoueur[iJ]) setIndexJ(vJ)
        if (!equipeDresseur[iE]) setIndexE(vE)
        return
      }

      // On fait un tic de combat singulier : 1 Pokémon vs 1 Pokémon.
      // ticCombat attend des tableaux : on lui passe des tableaux d'UN élément.
      const pvJActif = [nombreSur(pvJRef.current[iJ], nombreSur(actifJ.pvMax, 1))]
      const pvEActif = [nombreSur(pvERef.current[iE], nombreSur(actifE.pvMax, 1))]
      const r = ticCombat(
        [actifJ], pvJActif, [nombreSur(jaugeJRef.current, 0)],
        [actifE], pvEActif, [nombreSur(jaugeERef.current, 0)]
      )

      // Récupère les nouveaux PV/jauges du combattant actif.
      const nouveauPvJ = nombreSur(r.pvJoueur[0], 0)
      const nouveauPvE = nombreSur(r.pvEnnemis[0], 0)
      const nouvelleJaugeJ = nombreSur(r.jaugeJoueur[0], 0)
      const nouvelleJaugeE = nombreSur(r.jaugeEnnemis[0], 0)

      // Met à jour le tableau de PV complet (seul l'actif change).
      const pvJArr = [...pvJRef.current]; pvJArr[iJ] = nouveauPvJ
      const pvEArr = [...pvERef.current]; pvEArr[iE] = nouveauPvE
      pvJRef.current = pvJArr
      pvERef.current = pvEArr
      setPvJoueur(pvJArr)
      setPvEnnemi(pvEArr)

      jaugeJRef.current = nouvelleJaugeJ
      jaugeERef.current = nouvelleJaugeE
      setJaugeJ(nouvelleJaugeJ)
      setJaugeE(nouvelleJaugeE)

      // L'ennemi actif est-il KO ? → on passe au suivant, ou victoire si plus aucun.
      if (nouveauPvE <= 0) {
        ajouterJournal(`${actifE.nom} est K.O. !`, 'victoire')
        const suivant = prochainVivant(pvEArr, iE + 1)
        if (suivant === -1) { finir('victoire'); return }
        setIndexE(suivant)
        indexERef.current = suivant
        jaugeERef.current = 0; setJaugeE(0)
        return
      }

      // Le joueur actif est-il KO ? → suivant, ou défaite si plus aucun.
      if (nouveauPvJ <= 0) {
        ajouterJournal(`${actifJ.nom} est K.O. !`, 'echec')
        const suivant = prochainVivant(pvJArr, iJ + 1)
        if (suivant === -1) { finir('defaite'); return }
        setIndexJ(suivant)
        indexJRef.current = suivant
        jaugeJRef.current = 0; setJaugeJ(0)
        return
      }
    }, VITESSE_COMBAT / Math.max(1, vitesse))

    return () => clearInterval(horloge)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultat, vitesse])

  // Termine le combat une seule fois (garde anti-double).
  function finir(res) {
    if (resultatRef.current) return
    resultatRef.current = res
    setResultat(res)
    ajouterJournal(res === 'victoire' ? '🏆 VICTOIRE !' : '💀 DÉFAITE…', res === 'victoire' ? 'victoire' : 'echec')
  }

  // Quand le résultat est posé, on prévient le parent après un court délai
  // (laisse le temps d'afficher l'overlay 🏆 / 💀).
  useEffect(() => {
    if (!resultat) return
    const t = setTimeout(() => { onTermine && onTermine(resultat) }, 1600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultat])

  const actifJ = equipeJoueur[indexJ]
  const actifE = equipeDresseur[indexE]

  // Compteur de Pokémon restants par camp (pour l'affichage).
  const restantsJ = pvJoueur.filter((pv) => nombreSur(pv, 0) > 0).length
  const restantsE = pvEnnemi.filter((pv) => nombreSur(pv, 0) > 0).length

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

        {/* Zone de combat : actif joueur VS actif ennemi */}
        <div className="arene-combat-zone">
          <div className="arene-combat-camp">
            <span className="arene-combat-restants">Ton équipe — {restantsJ} restant{restantsJ > 1 ? 's' : ''}</span>
            {actifJ && (
              <CartePokemon
                pokemon={actifJ}
                pvActuels={nombreSur(pvJoueur[indexJ], 0)}
                jauge={jaugeJ}
                niveau={actifJ.niveau}
                compact
              />
            )}
          </div>

          <div className="vs"><span className="vs-texte">VS</span></div>

          <div className="arene-combat-camp">
            <span className="arene-combat-restants">{dresseur?.nom} — {restantsE} restant{restantsE > 1 ? 's' : ''}</span>
            {actifE && (
              <CartePokemon
                pokemon={actifE}
                pvActuels={nombreSur(pvEnnemi[indexE], 0)}
                jauge={jaugeE}
                niveau={actifE.niveau}
                compact
              />
            )}
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