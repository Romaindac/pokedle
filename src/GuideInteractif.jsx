import { useState, useEffect, useRef, useCallback } from 'react'
import { GUIDES, guideEstVu, marquerGuideVu } from './guides'

// ============================================================
// GuideInteractif — moteur de tuto guide avec surbrillance.
// Props : id (cle dans GUIDES), actif (bool), onTermine().
// Pose un voile sombre avec un "trou" lumineux sur l'element cible
// (repere par [data-guide="..."]) et une bulle explicative.
// Avance : clic sur la cible (action 'clic') ou bouton Suivant (action 'info').
// ============================================================
function GuideInteractif({ id, actif, onTermine }) {
  const etapes = GUIDES[id] || []
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState(null) // position de la cible a l'ecran
  const [pret, setPret] = useState(false)
  const [cibleAbsente, setCibleAbsente] = useState(false) // cible clic jamais trouvee
  const [bullePos, setBullePos] = useState(null) // position FIGEE de la bulle (1 calcul / etape)
  const rafRef = useRef(null)
  const cibleElemRef = useRef(null)
  const minuterieAbsenceRef = useRef(null)
  const bullePosFigeeRef = useRef(false) // empeche de recalculer la bulle a chaque frame

  const etape = etapes[index] || null

  const terminer = useCallback(() => {
    marquerGuideVu(id)
    if (onTermine) onTermine()
  }, [id, onTermine])

  const suivant = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= etapes.length) { terminer(); return i }
      return i + 1
    })
  }, [etapes.length, terminer])

  // Recalcule la position de la cible en continu (suit scroll / changements DOM).
  useEffect(() => {
    if (!actif || !etape) return
    let arrete = false
    setCibleAbsente(false)
    // Nouvelle etape : on autorise UN recalcul de la position de la bulle.
    bullePosFigeeRef.current = false
    setBullePos(null)
    if (minuterieAbsenceRef.current) clearTimeout(minuterieAbsenceRef.current)
    // Sur une etape 'clic', si la cible reste introuvable, on debloque au bout de 2,5s.
    if (etape.action === 'clic' && etape.cible) {
      minuterieAbsenceRef.current = setTimeout(() => {
        if (!cibleElemRef.current) setCibleAbsente(true)
      }, 2500)
    }

    // Calcule la position de la bulle a partir d'un rectangle cible (une seule fois).
    function calculerBullePos(r) {
      const PAD = 8
      const trou = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
      const placeBas = etape.placement !== 'haut'
      const sousLaCible = trou.top + trou.height + 14
      const auDessus = trou.top - 14
      const vh = window.innerHeight
      const metBas = placeBas && sousLaCible < vh - 180
      if (metBas) return { top: sousLaCible, left: '50%', transform: 'translateX(-50%)' }
      if (auDessus > 200) return { top: auDessus, left: '50%', transform: 'translate(-50%, -100%)' }
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }

    function trouverEtPositionner() {
      if (arrete) return
      if (!etape.cible) {
        setRect(null); setPret(true); cibleElemRef.current = null
        if (!bullePosFigeeRef.current) { setBullePos({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }); bullePosFigeeRef.current = true }
        return
      }
      // La cible peut etre un data-guide ("auto") OU un selecteur CSS libre (".eqm-auto").
      const selecteur = etape.cible.startsWith('.') || etape.cible.startsWith('#')
        ? etape.cible
        : `[data-guide="${etape.cible}"]`
      const el = document.querySelector(selecteur)
      cibleElemRef.current = el
      if (el) {
        const r = el.getBoundingClientRect()
        // Le HALO continue de suivre la cible (rect mis a jour chaque frame)...
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
        setPret(true)
        setCibleAbsente(false)
        // ...mais la BULLE n'est positionnee qu'UNE fois (evite qu'elle saute au survol).
        if (!bullePosFigeeRef.current) { setBullePos(calculerBullePos(r)); bullePosFigeeRef.current = true }
      } else {
        // Element pas encore monte (ex : apparait apres une action) : on attend.
        setRect(null); setPret(false)
      }
      rafRef.current = requestAnimationFrame(trouverEtPositionner)
    }
    trouverEtPositionner()
    return () => {
      arrete = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (minuterieAbsenceRef.current) clearTimeout(minuterieAbsenceRef.current)
    }
  }, [actif, etape, index])

  // Pour les etapes 'clic' : on detecte le clic sur la cible (capture) pour avancer.
  useEffect(() => {
    if (!actif || !etape || etape.action !== 'clic') return
    function onClicDoc(e) {
      const el = cibleElemRef.current
      if (el && (el === e.target || el.contains(e.target))) {
        // Laisse l'action native se faire, puis avance a l'etape suivante.
        setTimeout(() => suivant(), 60)
      }
    }
    document.addEventListener('click', onClicDoc, true)
    return () => document.removeEventListener('click', onClicDoc, true)
  }, [actif, etape, index, suivant])

  // Touche Echap = passer tout le guide.
  useEffect(() => {
    if (!actif) return
    function onKey(e) { if (e.key === 'Escape') terminer() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [actif, terminer])

  if (!actif || !etape) return null

  const PAD = 8 // marge autour de la cible pour le trou
  const trou = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null

  // Position de la bulle : FIGEE (calculee une fois par etape dans l'effet ci-dessus).
  // Tant qu'elle n'est pas prete, on la centre (evite tout saut au survol).
  const bulleStyle = bullePos || { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  const numero = `${index + 1} / ${etapes.length}`
  const estClic = etape.action === 'clic'

  return (
    <div className="guide-couche" aria-live="polite">
      {/* Voile avec trou : 4 rectangles autour de la cible (laisse le clic passer dans le trou). */}
      {trou ? (
        <>
          <div className="guide-voile" style={{ top: 0, left: 0, width: '100vw', height: Math.max(0, trou.top) }} />
          <div className="guide-voile" style={{ top: trou.top, left: 0, width: Math.max(0, trou.left), height: trou.height }} />
          <div className="guide-voile" style={{ top: trou.top, left: trou.left + trou.width, width: `calc(100vw - ${trou.left + trou.width}px)`, height: trou.height }} />
          <div className="guide-voile" style={{ top: trou.top + trou.height, left: 0, width: '100vw', height: `calc(100vh - ${trou.top + trou.height}px)` }} />
          <div className="guide-halo" style={{ top: trou.top, left: trou.left, width: trou.width, height: trou.height }} />
        </>
      ) : (
        <div className="guide-voile guide-voile-plein" />
      )}

      {/* Bulle explicative */}
      <div className="guide-bulle" style={bulleStyle} onClick={(e) => e.stopPropagation()}>
        <div className="guide-bulle-num">{numero}</div>
        <h3 className="guide-bulle-titre">{etape.titre}</h3>
        <p className="guide-bulle-texte">{etape.texte}</p>
        <div className="guide-bulle-actions">
          <button className="guide-btn-passer" onClick={terminer}>Passer le guide</button>
          {estClic ? (
            cibleAbsente ? (
              <button className="guide-btn-suivant" onClick={suivant}>Continuer</button>
            ) : (
              <span className="guide-attente">{pret ? '👆 Clique l\'element surligne' : '...'}</span>
            )
          ) : (
            <button className="guide-btn-suivant" onClick={suivant}>
              {index + 1 >= etapes.length ? 'Termine' : 'Suivant'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GuideInteractif