import { useState } from 'react'
import {
  PALIERS_GLOBAUX,
  PALIERS_GENERATION,
  GENERATIONS as GENS_RECOMP,
  compteGeneration,
  decrireGains,
} from './recompenses'
import { SPECIAUX, SPECIAUX_RAID, TOUS_SPECIAUX, spriteSpecial } from './speciaux'
import { nomShowdown } from './pokedexNoms'
import { urlSpriteFusionSecours } from './fusion'
import { trouverFusion } from './fusionsDisponibles'

const TOTAL_POKEDEX = 1025
const TOTAL_SPECIAUX = TOUS_SPECIAUX.length

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

function Pokedex({ pokedexVus, pokedexShiny, pokedexSpeciaux = [], captures = [], recompensesReclamees = [], onReclamer, onFermer }) {
  const [onglet, setOnglet] = useState('dex') // 'dex' | 'recompenses'
  const [modeShiny, setModeShiny] = useState(false)
  const [modeSpeciaux, setModeSpeciaux] = useState(false)
  const [modeFusions, setModeFusions] = useState(false)
  const [filtre, setFiltre] = useState('tous') // 'tous' | 'obtenus' | 'manquants'

  const idsVus = new Set(pokedexVus || [])
  const idsShiny = new Set(pokedexShiny || [])
  const idsSpeciaux = new Set(pokedexSpeciaux || [])
  const reclamees = new Set(recompensesReclamees || [])

  // Les fusions creees (presentes dans la collection).
  const mesFusions = (captures || []).filter((p) => p && p.estFusion)

  const registreActif = modeShiny ? idsShiny : idsVus

  const completionParGen = GENERATIONS.map((g) => {
    let obtenus = 0
    for (let n = g.debut; n <= g.fin; n++) {
      if (registreActif.has(n)) obtenus++
    }
    return { ...g, obtenus, total: g.fin - g.debut + 1 }
  })

  const numeros = Array.from({ length: TOTAL_POKEDEX }, (_, i) => i + 1).filter((numero) => {
    const vu = registreActif.has(numero)
    if (filtre === 'obtenus') return vu
    if (filtre === 'manquants') return !vu
    return true
  })

  const nbVus = idsVus.size

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
      <div className={`pkx-recomp pkx-recomp-${etat}`}>
        <div className="pkx-recomp-info">
          <span className="pkx-recomp-nom">{palier.nom}</span>
          <span className="pkx-recomp-sous">{sousTitre}</span>
          <span className="pkx-recomp-gains">{decrireGains(palier.gains)}</span>
        </div>
        <div className="pkx-recomp-action">
          {etat === 'reclame' && <span className="pkx-badge-ok">✓ Réclamé</span>}
          {etat === 'verrouille' && <span className="pkx-badge-lock">🔒</span>}
          {etat === 'dispo' && (
            <button className="pkx-reclamer" onClick={() => onReclamer && onReclamer(palier)}>🎁 Réclamer</button>
          )}
        </div>
      </div>
    )
  }

  function CaseSpeciale({ sp, label }) {
    const debloque = idsSpeciaux.has(sp.id)
    const prefixe = sp.emoji ? `${sp.emoji} ` : ''
    return (
      <div className={`pkx-case pkx-case-speciale ${debloque ? 'obtenu' : ''}`}
        title={debloque ? `${sp.nomFr} (${label})` : `??? — ${label}`}>
        <img src={spriteSpecial(sp.id)} alt={sp.nomFr}
          className={`pkx-sprite ${debloque ? '' : 'pkx-non-obtenu'}`} loading="lazy" />
        <span className="pkx-speciale-nom">{debloque ? sp.nomFr : '???'}</span>
        <span className="pkx-speciale-boss">{debloque ? `✓ ${prefixe}${label}` : `🔒 ${prefixe}${label}`}</span>
      </div>
    )
  }

  // Carte d'une fusion creee (reutilise le style des cases speciales).
  function CaseFusion({ f }) {
    // Si le sprite principal echoue, on tente le miroir de secours une fois.
    const erreurSprite = (e) => {
      const img = e.currentTarget
      if (img.dataset.secours === '1') { img.style.visibility = 'hidden'; return }
      const tab = trouverFusion(f.teteId, f.corpsId)
      if (tab) { img.dataset.secours = '1'; img.src = urlSpriteFusionSecours(tab.tetePif, tab.corpsPif) }
      else { img.style.visibility = 'hidden' }
    }
    const typesTexte = (f.types || []).join(' / ')
    return (
      <div className="pkx-case pkx-case-speciale obtenu"
        title={`${f.nom} — ${f.nomTete} + ${f.nomCorps}${typesTexte ? ` (${typesTexte})` : ''}`}>
        <img src={f.sprite} alt={f.nom} className="pkx-sprite" loading="lazy" onError={erreurSprite} />
        <span className="pkx-speciale-nom">🧬 {f.nom}</span>
        <span className="pkx-speciale-boss">{f.nomTete} + {f.nomCorps}</span>
        <span className="pkx-speciale-boss">Niv. {f.niveau || 1}</span>
      </div>
    )
  }

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="pkx-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="pkx-entete">
          <h2>
            {onglet === 'dex'
              ? (modeFusions
                  ? `Pokédex 🧬 Fusions (${mesFusions.length})`
                  : modeSpeciaux
                  ? `Pokédex 🌟 Spéciaux (${idsSpeciaux.size}/${TOTAL_SPECIAUX})`
                  : `Pokédex ${modeShiny ? '✨' : '📖'} (${registreActif.size}/${TOTAL_POKEDEX})`)
              : '🎁 Récompenses'}
          </h2>
          <button className="pkx-fermer" onClick={onFermer}>✕</button>
        </div>

        {/* Onglets principaux */}
        <div className="pkx-onglets">
          <button className={`pkx-onglet ${onglet === 'dex' ? 'actif' : ''}`} onClick={() => setOnglet('dex')}>📖 Pokédex</button>
          <button className={`pkx-onglet ${onglet === 'recompenses' ? 'actif' : ''}`} onClick={() => setOnglet('recompenses')}>
            🎁 Récompenses{nbDispo > 0 ? ` (${nbDispo})` : ''}
          </button>
        </div>

        {onglet === 'dex' && (
          <>
            {!modeSpeciaux && !modeFusions && (
              <div className="pkx-completion">
                {completionParGen.map((g) => {
                  const pct = Math.round((g.obtenus / g.total) * 100)
                  return (
                    <div key={g.nom} className="pkx-gen">
                      <span className="pkx-gen-nom">{g.nom}</span>
                      <span className="pkx-gen-compte">{g.obtenus}/{g.total}</span>
                      <span className="pkx-gen-barre"><span className="pkx-gen-fill" style={{ width: `${pct}%` }}></span></span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Mode Normal / Shiny / Spéciaux / Fusions */}
            <div className="pkx-sous-onglets">
              <button className={`pkx-pilule ${!modeShiny && !modeSpeciaux && !modeFusions ? 'actif' : ''}`} onClick={() => { setModeShiny(false); setModeSpeciaux(false); setModeFusions(false) }}>📖 Normal ({idsVus.size})</button>
              <button className={`pkx-pilule ${modeShiny && !modeSpeciaux && !modeFusions ? 'actif' : ''}`} onClick={() => { setModeShiny(true); setModeSpeciaux(false); setModeFusions(false) }}>✨ Shiny ({idsShiny.size})</button>
              <button className={`pkx-pilule ${modeSpeciaux ? 'actif' : ''}`} onClick={() => { setModeSpeciaux(true); setModeFusions(false) }}>🌟 Spéciaux ({idsSpeciaux.size}/{TOTAL_SPECIAUX})</button>
              <button className={`pkx-pilule ${modeFusions ? 'actif' : ''}`} onClick={() => { setModeFusions(true); setModeSpeciaux(false) }}>🧬 Fusions ({mesFusions.length})</button>
            </div>

            {!modeSpeciaux && !modeFusions && (
              <div className="pkx-sous-onglets">
                <button className={`pkx-pilule ${filtre === 'tous' ? 'actif' : ''}`} onClick={() => setFiltre('tous')}>Tous</button>
                <button className={`pkx-pilule ${filtre === 'obtenus' ? 'actif' : ''}`} onClick={() => setFiltre('obtenus')}>Obtenus</button>
                <button className={`pkx-pilule ${filtre === 'manquants' ? 'actif' : ''}`} onClick={() => setFiltre('manquants')}>Non obtenus</button>
              </div>
            )}

            {modeFusions ? (
              <div className="pkx-speciaux-zone">
                <h3 className="pkx-section-titre">🧬 Mes fusions ({mesFusions.length})</h3>
                {mesFusions.length === 0 ? (
                  <p className="pkx-vide">Aucune fusion créée pour l'instant. Rendez-vous au Centre de Fusion !</p>
                ) : (
                  <div className="pkx-grille pkx-grille-speciaux">
                    {mesFusions.map((f) => (<CaseFusion key={f.uid} f={f} />))}
                  </div>
                )}
              </div>
            ) : modeSpeciaux ? (
              <div className="pkx-speciaux-zone">
                <h3 className="pkx-section-titre">⚔️ Champions d'Arène ({SPECIAUX.filter((s) => idsSpeciaux.has(s.id)).length}/{SPECIAUX.length})</h3>
                <div className="pkx-grille pkx-grille-speciaux">
                  {SPECIAUX.map((sp) => (<CaseSpeciale key={sp.id} sp={sp} label={sp.boss} />))}
                </div>
                <h3 className="pkx-section-titre">🔥 Boss de Raid ({SPECIAUX_RAID.filter((s) => idsSpeciaux.has(s.id)).length}/{SPECIAUX_RAID.length})</h3>
                <div className="pkx-grille pkx-grille-speciaux">
                  {SPECIAUX_RAID.map((sp) => (<CaseSpeciale key={sp.id} sp={sp} label={sp.boss} />))}
                </div>
              </div>
            ) : (
              <div className="pkx-grille">
                {numeros.length === 0 ? (
                  <p className="pkx-vide">Aucun Pokémon dans ce filtre.</p>
                ) : (
                  numeros.map((numero) => {
                    const vu = registreActif.has(numero)
                    const aussiShiny = idsShiny.has(numero)
                    // Sprite statique (PokeAPI par numéro) = base affichée.
                    const urlStatique = modeShiny
                      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${numero}.png`
                      : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`
                    // Sprite animé au survol : Showdown (toutes gen 1-9), par nom anglais.
                    const nomSd = nomShowdown(numero)
                    const dossierSd = modeShiny ? 'ani-shiny' : 'ani'
                    const urlAnimee = nomSd ? `https://play.pokemonshowdown.com/sprites/${dossierSd}/${nomSd}.gif` : null
                    // Au survol d'un Pokémon obtenu : bascule sur l'animé. Si l'animé échoue, on revient au statique.
                    const survol = (e) => { if (vu && urlAnimee) { e.currentTarget.dataset.statique = urlStatique; e.currentTarget.src = urlAnimee } }
                    const sortie = (e) => { e.currentTarget.src = urlStatique }
                    const erreurAnime = (e) => { e.currentTarget.src = e.currentTarget.dataset.statique || urlStatique }
                    return (
                      <div key={numero}
                        className={`pkx-case ${vu ? 'obtenu' : ''} ${modeShiny && vu ? 'pkx-case-shiny' : ''} ${vu && urlAnimee ? 'pkx-animable' : ''}`}
                        title={vu ? `N°${numero}${aussiShiny ? ' ✨' : ''}` : `N°${numero} — ???`}>
                        <img
                          src={urlStatique}
                          alt={`Pokémon ${numero}`}
                          className={`pkx-sprite ${vu ? '' : 'pkx-non-obtenu'}`}
                          loading="lazy"
                          onMouseEnter={survol}
                          onMouseLeave={sortie}
                          onError={erreurAnime} />
                        <span className="pkx-numero">{numero}</span>
                        {!modeShiny && aussiShiny && <span className="pkx-shiny-mark">✨</span>}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </>
        )}

        {onglet === 'recompenses' && (
          <div className="pkx-recomp-liste">
            <p className="pkx-recomp-intro">
              Pokémon vus : <strong>{nbVus}/{TOTAL_POKEDEX}</strong>. Réclame tes paliers de complétion !
            </p>
            <h3 className="pkx-section-titre">Paliers globaux</h3>
            {PALIERS_GLOBAUX.map((p) => (
              <LigneRecompense key={p.id} palier={p} sousTitre={`${p.seuil} Pokémon vus`} etat={etatPalierGlobal(p)} />
            ))}
            <h3 className="pkx-section-titre">Par génération</h3>
            {GENS_RECOMP.map((g) => {
              const palier = PALIERS_GENERATION.find((p) => p.generation === g.cle)
              if (!palier) return null
              const total = g.fin - g.debut + 1
              const obtenus = compteGeneration(idsVus, g)
              return (
                <LigneRecompense key={palier.id} palier={palier} sousTitre={`${obtenus}/${total} capturés`} etat={etatPalierGen(palier, g)} />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Pokedex