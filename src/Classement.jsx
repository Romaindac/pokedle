import { useState, useEffect } from 'react'
import { recupererClassement, chargerIdentite } from './apiClassement'
import { classementPvp } from './apiPvp'

// Les onglets du classement. L'onglet PvP lit la table defenses_pvp (et non classement).
const ONGLETS = [
  { cle: 'pokemon_captures', label: 'Capturés', colonne: 'pokemon_captures', suffixe: '' },
  { cle: 'nb_shiny',         label: 'Shiny',    colonne: 'nb_shiny',         suffixe: '' },
  { cle: 'zones',            label: 'Histoire', colonne: 'zones',            suffixe: ' zones' },
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
      // Onglet PvP : on lit la table dédiée defenses_pvp.
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

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-banc panneau-equipe-doree classement-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>🏆 Classement</h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        {/* Onglets */}
        <div className="classement-onglets">
          {ONGLETS.map((o) => (
            <button
              key={o.cle}
              className={`classement-onglet ${ongletActif === o.cle ? 'actif' : ''}`}
              onClick={() => setOngletActif(o.cle)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        {chargement ? (
          <p className="classement-info">Chargement du classement…</p>
        ) : erreur ? (
          <p className="classement-info">Impossible de charger le classement. Vérifie ta connexion.</p>
        ) : lignes.length === 0 ? (
          <p className="classement-info">
            {onglet.pvp
              ? 'Personne n\'a encore posé de défense PvP. Sois le premier !'
              : 'Personne dans le classement pour l\'instant. Sois le premier !'}
          </p>
        ) : onglet.pvp ? (
          /* ===== Classement PvP : points + rang + V/D ===== */
          <div className="classement-liste">
            {lignes.map((l, i) => {
              const estMoi = identite && l.id === identite.id
              return (
                <div key={l.id} className={`classement-ligne ${estMoi ? 'moi' : ''} ${i < 3 ? 'podium podium-' + (i + 1) : ''}`}>
                  <span className="classement-rang">{i + 1}</span>
                  <span className="classement-pseudo">
                    {l.pseudo}{estMoi ? ' (toi)' : ''}
                    <small className="classement-pvp-rang"> · {l.rang}</small>
                  </span>
                  <span className="classement-valeur">
                    {l.points_pvp} pts
                    <small className="classement-pvp-vd"> ({l.victoires || 0}V / {l.defaites || 0}D)</small>
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          /* ===== Classements normaux ===== */
          <div className="classement-liste">
            {lignes.map((l, i) => {
              const estMoi = identite && l.id === identite.id
              const valeur = l[onglet.colonne] ?? 0
              return (
                <div key={l.id} className={`classement-ligne ${estMoi ? 'moi' : ''} ${i < 3 ? 'podium podium-' + (i + 1) : ''}`}>
                  <span className="classement-rang">{i + 1}</span>
                  <span className="classement-pseudo">{l.pseudo}{estMoi ? ' (toi)' : ''}</span>
                  <span className="classement-valeur">{valeur}{onglet.suffixe}</span>
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