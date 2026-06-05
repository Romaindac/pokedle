import { useState } from 'react'
import {
  PALIERS_GLOBAUX,
  PALIERS_GENERATION,
  GENERATIONS as GENS_RECOMP,
  compteGeneration,
  decrireGains,
} from './recompenses'
import { SPECIAUX, SPECIAUX_RAID, TOUS_SPECIAUX, spriteSpecial } from './speciaux'

// Grille du Pokédex national (1025 Pokémon, Gen 1-9).
const TOTAL_POKEDEX = 1025

// Total des spéciaux (arène + raid) pour le compteur de l'onglet Spéciaux.
const TOTAL_SPECIAUX = TOUS_SPECIAUX.length

// Bornes des générations (pour le compteur de complétion).
const GENERATIONS = [
  { nom: 'Gen 1', debut: 1, fin: 151 },
  { nom: 'Gen 2', debut: 152, fin: 251 },
  { nom: 'Gen 3', debut: 252, fin: 386 },
  { nom: 'Gen 4', debut: 387, fin: 493 },
  { nom: 'Gen 5', debut: 494, fin: 649 },
  { nom: 'Gen 6', debut: 650, fin: 721 },
  { nom: 'Gen 7', debut: 722, fin: 809 },
  { nom: 'Gen 8', debut: 810, fin: 905 },
  { nom: 'Gen 9', debut: 906, fin: 1025 },
]

function Pokedex({ pokedexVus, pokedexShiny, pokedexSpeciaux = [], recompensesReclamees = [], onReclamer, onFermer }) {
  const [onglet, setOnglet] = useState('dex') // 'dex' | 'recompenses'
  const [modeShiny, setModeShiny] = useState(false)
  const [modeSpeciaux, setModeSpeciaux] = useState(false) // affiche la galerie des spéciaux
  const [filtre, setFiltre] = useState('tous') // 'tous' | 'obtenus' | 'manquants'

  const idsVus = new Set(pokedexVus || [])
  const idsShiny = new Set(pokedexShiny || [])
  const idsSpeciaux = new Set(pokedexSpeciaux || [])
  const reclamees = new Set(recompensesReclamees || [])

  // Selon le mode, on illumine d'après le registre normal ou shiny.
  const registreActif = modeShiny ? idsShiny : idsVus

  // Compteur de complétion par génération (sur le registre actif).
  const completionParGen = GENERATIONS.map((g) => {
    let obtenus = 0
    for (let n = g.debut; n <= g.fin; n++) {
      if (registreActif.has(n)) obtenus++
    }
    return { ...g, obtenus, total: g.fin - g.debut + 1 }
  })

  // Liste des numéros à afficher selon le filtre obtenu/manquant.
  const numeros = Array.from({ length: TOTAL_POKEDEX }, (_, i) => i + 1).filter((numero) => {
    const vu = registreActif.has(numero)
    if (filtre === 'obtenus') return vu
    if (filtre === 'manquants') return !vu
    return true
  })

  // --- Données pour l'onglet Récompenses ---
  const nbVus = idsVus.size

  // État d'un palier global : 'reclame' | 'dispo' | 'verrouille'
  function etatPalierGlobal(p) {
    if (reclamees.has(p.id)) return 'reclame'
    if (nbVus >= p.seuil) return 'dispo'
    return 'verrouille'
  }
  function etatPalierGen(palier, gen) {
    if (reclamees.has(palier.id)) return 'reclame'
    const total = gen.fin - gen.debut + 1
    if (compteGeneration(idsVus, gen) >= total) return 'dispo'
    return 'verrouille'
  }

  const nbDispo =
    PALIERS_GLOBAUX.filter((p) => etatPalierGlobal(p) === 'dispo').length +
    GENS_RECOMP.filter((g) => {
      const palier = PALIERS_GENERATION.find((p) => p.generation === g.cle)
      return palier && etatPalierGen(palier, g) === 'dispo'
    }).length

  function LigneRecompense({ palier, sousTitre, etat }) {
    return (
      <div className={`recomp-ligne recomp-${etat}`}>
        <div className="recomp-info">
          <span className="recomp-nom">{palier.nom}</span>
          <span className="recomp-sous">{sousTitre}</span>
          <span className="recomp-gains">{decrireGains(palier.gains)}</span>
        </div>
        <div className="recomp-action">
          {etat === 'reclame' && <span className="recomp-badge-ok">✓ Réclamé</span>}
          {etat === 'verrouille' && <span className="recomp-badge-lock">🔒</span>}
          {etat === 'dispo' && (
            <button className="bouton-reclamer" onClick={() => onReclamer && onReclamer(palier)}>
              🎁 Réclamer
            </button>
          )}
        </div>
      </div>
    )
  }

  // Affiche une case de Pokémon spécial (factorisé pour arène + raid).
  // sp = { id, nomFr, boss, emoji? }, label = texte sous le nom (boss / raid).
  function CaseSpeciale({ sp, label }) {
    const debloque = idsSpeciaux.has(sp.id)
    const prefixe = sp.emoji ? `${sp.emoji} ` : ''
    return (
      <div
        className={`case-pokedex case-speciale ${debloque ? 'capturee' : ''}`}
        title={debloque ? `${sp.nomFr} (${label})` : `??? — ${label}`}
      >
        <img
          src={spriteSpecial(sp.id)}
          alt={sp.nomFr}
          className={`sprite-pokedex ${debloque ? '' : 'non-capture'}`}
          loading="lazy"
        />
        <span className="case-speciale-nom">{debloque ? sp.nomFr : '???'}</span>
        <span className="case-speciale-boss">{debloque ? `✓ ${prefixe}${label}` : `🔒 ${prefixe}${label}`}</span>
      </div>
    )
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="panneau-pokedex panneau-pokedex-doree pokedex-v2" onClick={(e) => e.stopPropagation()}>
        <div className="pokedex-entete">
          <h2>
            {onglet === 'dex'
              ? (modeSpeciaux
                  ? `Pokédex 🌟 Spéciaux (${idsSpeciaux.size}/${TOTAL_SPECIAUX})`
                  : `Pokédex ${modeShiny ? '✨' : '📖'} (${registreActif.size}/${TOTAL_POKEDEX})`)
              : '🎁 Récompenses'}
          </h2>
          <button className="bouton-fermer" onClick={onFermer}>✕</button>
        </div>

        {/* Onglets Pokédex / Récompenses */}
        <div className="pokedex-modes">
          <button className={`mode-btn ${onglet === 'dex' ? 'actif' : ''}`} onClick={() => setOnglet('dex')}>
            📖 Pokédex
          </button>
          <button className={`mode-btn ${onglet === 'recompenses' ? 'actif' : ''}`} onClick={() => setOnglet('recompenses')}>
            🎁 Récompenses{nbDispo > 0 ? ` (${nbDispo})` : ''}
          </button>
        </div>

        {onglet === 'dex' && (
          <>
            {/* Compteur de complétion par génération (masqué en mode spéciaux) */}
            {!modeSpeciaux && (
            <div className="dex-completion">
              {completionParGen.map((g) => {
                const pct = Math.round((g.obtenus / g.total) * 100)
                return (
                  <div key={g.nom} className="dex-gen">
                    <span className="dex-gen-nom">{g.nom}</span>
                    <span className="dex-gen-compte">{g.obtenus}/{g.total}</span>
                    <span className="dex-gen-barre">
                      <span className="dex-gen-fill" style={{ width: `${pct}%` }}></span>
                    </span>
                  </div>
                )
              })}
            </div>
            )}

            {/* Mode Normal / Shiny / Spéciaux */}
            <div className="pokedex-modes">
              <button className={`mode-btn ${!modeShiny && !modeSpeciaux ? 'actif' : ''}`} onClick={() => { setModeShiny(false); setModeSpeciaux(false) }}>
                📖 Normal ({idsVus.size})
              </button>
              <button className={`mode-btn ${modeShiny && !modeSpeciaux ? 'actif' : ''}`} onClick={() => { setModeShiny(true); setModeSpeciaux(false) }}>
                ✨ Shiny ({idsShiny.size})
              </button>
              <button className={`mode-btn ${modeSpeciaux ? 'actif' : ''}`} onClick={() => setModeSpeciaux(true)}>
                🌟 Spéciaux ({idsSpeciaux.size}/{TOTAL_SPECIAUX})
              </button>
            </div>

            {/* Filtre obtenu / non obtenu (masqué en mode spéciaux) */}
            {!modeSpeciaux && (
            <div className="pokedex-modes">
              <button className={`mode-btn ${filtre === 'tous' ? 'actif' : ''}`} onClick={() => setFiltre('tous')}>
                Tous
              </button>
              <button className={`mode-btn ${filtre === 'obtenus' ? 'actif' : ''}`} onClick={() => setFiltre('obtenus')}>
                Obtenus
              </button>
              <button className={`mode-btn ${filtre === 'manquants' ? 'actif' : ''}`} onClick={() => setFiltre('manquants')}>
                Non obtenus
              </button>
            </div>
            )}

            {modeSpeciaux ? (
              <div className="pokedex-speciaux-zone">
                {/* --- Section 1 : spéciaux d'ARÈNE (mégas/formes des 15 boss) --- */}
                <h3 className="speciaux-section-titre">⚔️ Champions d'Arène ({SPECIAUX.filter((s) => idsSpeciaux.has(s.id)).length}/{SPECIAUX.length})</h3>
                <div className="pokedex-grille pokedex-grille-speciaux">
                  {SPECIAUX.map((sp) => (
                    <CaseSpeciale key={sp.id} sp={sp} label={sp.boss} />
                  ))}
                </div>

                {/* --- Section 2 : spéciaux de RAID (gros boss capturables) --- */}
                <h3 className="speciaux-section-titre">🔥 Boss de Raid ({SPECIAUX_RAID.filter((s) => idsSpeciaux.has(s.id)).length}/{SPECIAUX_RAID.length})</h3>
                <div className="pokedex-grille pokedex-grille-speciaux">
                  {SPECIAUX_RAID.map((sp) => (
                    <CaseSpeciale key={sp.id} sp={sp} label={sp.boss} />
                  ))}
                </div>
              </div>
            ) : (
            <div className="pokedex-grille">
              {numeros.length === 0 ? (
                <p className="banc-vide">Aucun Pokémon dans ce filtre.</p>
              ) : (
                numeros.map((numero) => {
                  const vu = registreActif.has(numero)
                  const aussiShiny = idsShiny.has(numero)
                  return (
                    <div
                      key={numero}
                      className={`case-pokedex ${vu ? 'capturee' : ''} ${modeShiny && vu ? 'case-shiny' : ''}`}
                      title={vu ? `N°${numero}${aussiShiny ? ' ✨' : ''}` : `N°${numero} — ???`}
                    >
                      <img
                        src={
                          modeShiny
                            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${numero}.png`
                            : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`
                        }
                        alt={`Pokémon ${numero}`}
                        className={`sprite-pokedex ${vu ? '' : 'non-capture'}`}
                        loading="lazy"
                      />
                      <span className="numero">{numero}</span>
                      {!modeShiny && aussiShiny && <span className="dex-shiny-mark">✨</span>}
                    </div>
                  )
                })
              )}
            </div>
            )}
          </>
        )}

        {onglet === 'recompenses' && (
          <div className="recomp-liste">
            <p className="recomp-intro">
              Pokémon vus : <strong>{nbVus}/{TOTAL_POKEDEX}</strong>. Réclame tes paliers de complétion !
            </p>

            <h3 className="recomp-titre">Paliers globaux</h3>
            {PALIERS_GLOBAUX.map((p) => (
              <LigneRecompense
                key={p.id}
                palier={p}
                sousTitre={`${p.seuil} Pokémon vus`}
                etat={etatPalierGlobal(p)}
              />
            ))}

            <h3 className="recomp-titre">Par génération</h3>
            {GENS_RECOMP.map((g) => {
              const palier = PALIERS_GENERATION.find((p) => p.generation === g.cle)
              if (!palier) return null
              const total = g.fin - g.debut + 1
              const obtenus = compteGeneration(idsVus, g)
              return (
                <LigneRecompense
                  key={palier.id}
                  palier={palier}
                  sousTitre={`${obtenus}/${total} capturés`}
                  etat={etatPalierGen(palier, g)}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Pokedex