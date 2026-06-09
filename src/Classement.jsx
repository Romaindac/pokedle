import { useState, useEffect } from 'react'
import { recupererClassement, chargerIdentite } from './apiClassement'
import { classementPvp } from './apiPvp'
import { formaterTaux } from './tour'

const ONGLETS = [
  { cle: 'pokemon_captures', label: 'Capturés', colonne: 'pokemon_captures', suffixe: '' },
  { cle: 'nb_shiny',         label: 'Shiny',    colonne: 'nb_shiny',         suffixe: '' },
  { cle: 'zones',            label: 'Histoire', colonne: 'zones',            suffixe: ' zones' },
  { cle: 'carte_rare',       label: 'Cartes',   colonne: 'carte_rare',       carte: true },
  { cle: 'nb_prestiges',     label: 'Prestige', colonne: 'nb_prestiges',     suffixe: '' },
  { cle: 'pvp',              label: 'PvP',      pvp: true },
]

function Classement({ onFermer }) {
  const [ongletActif, setOngletActif] = useState('pokemon_captures')
  const [lignes, setLignes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState(false)

  const identite = chargerIdentite()
  const onglet = ONGLETS.find((o) => o.cle === ongletActif)

  useEffect(() => {
    let annule = false
    async function charger() {
      setChargement(true)
      setErreur(false)
      const res = onglet.pvp
        ? await classementPvp(50)
        : await recupererClassement(onglet.colonne, 50)
      if (annule) return
      if (!res.ok) setErreur(true)
      else setLignes(res.lignes)
      setChargement(false)
    }
    charger()
    return () => { annule = true }
  }, [ongletActif])

  function medaille(i) {
    if (i === 0) return '🥇'
    if (i === 1) return '🥈'
    if (i === 2) return '🥉'
    return null
  }

  // Affichage de la valeur pour les onglets "colonne" (hors pvp).
  function afficherValeur(l) {
    const valeur = l[onglet.colonne] ?? 0
    if (onglet.carte) return valeur > 0 ? formaterTaux(valeur) : '—'
    return `${valeur}${onglet.suffixe || ''}`
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="clst-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="clst-entete">
          <h2>🏆 Classement</h2>
          <button className="clst-fermer" onClick={onFermer}>✕</button>
        </div>

        <div className="clst-onglets">
          {ONGLETS.map((o) => (
            <button key={o.cle} className={`clst-onglet ${ongletActif === o.cle ? 'actif' : ''}`} onClick={() => setOngletActif(o.cle)}>
              {o.label}
            </button>
          ))}
        </div>

        {chargement ? (
          <p className="clst-info">Chargement du classement…</p>
        ) : erreur ? (
          <p className="clst-info">Impossible de charger le classement. Vérifie ta connexion.</p>
        ) : lignes.length === 0 ? (
          <p className="clst-info">
            {onglet.pvp
              ? "Personne n'a encore posé de défense PvP. Sois le premier !"
              : "Personne dans le classement pour l'instant. Sois le premier !"}
          </p>
        ) : onglet.pvp ? (
          <div className="clst-liste">
            {lignes.map((l, i) => {
              const estMoi = identite && l.id === identite.id
              return (
                <div key={l.id} className={`clst-ligne ${estMoi ? 'moi' : ''} ${i < 3 ? 'podium podium-' + (i + 1) : ''}`}>
                  <span className="clst-rang">{medaille(i) || (i + 1)}</span>
                  <span className="clst-pseudo">
                    {l.pseudo}{estMoi ? ' (toi)' : ''}
                    <small className="clst-pvp-rang"> · {l.rang}</small>
                  </span>
                  <span className="clst-valeur">
                    {l.points_pvp} pts
                    <small className="clst-pvp-vd"> ({l.victoires || 0}V / {l.defaites || 0}D)</small>
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="clst-liste">
            {lignes.map((l, i) => {
              const estMoi = identite && l.id === identite.id
              return (
                <div key={l.id} className={`clst-ligne ${estMoi ? 'moi' : ''} ${i < 3 ? 'podium podium-' + (i + 1) : ''}`}>
                  <span className="clst-rang">{medaille(i) || (i + 1)}</span>
                  <span className="clst-pseudo">{l.pseudo}{estMoi ? ' (toi)' : ''}</span>
                  <span className="clst-valeur">{afficherValeur(l)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Classement