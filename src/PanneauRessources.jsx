import { useState } from 'react'

/*
  Panneau Ressources avec ONGLETS.
  Regroupe Poke Balls / Pierres / Bonbons / Objets de boss en onglets,
  au lieu d'une longue pile verticale. Son state (onglet actif) est interne,
  donc AUCUN hook n'est ajouté à App.jsx.

  Props attendues :
    balls, pierres, bonbons, objetsBoss
    iconesBalls, iconesPierres, iconesBonbons
    pierresDef (PIERRES), bonbonsDef (BONBONS), objetsBossDef (OBJETS_BOSS)
    iconeCombat, vaincus, nbCaptures
*/
export default function PanneauRessources({
  balls = {}, pierres = {}, bonbons = {}, objetsBoss = {},
  iconesBalls = {}, iconesPierres = {}, iconesBonbons = {},
  pierresDef = {}, bonbonsDef = {}, objetsBossDef = {},
  iconeCombat = '', vaincus = 0, nbCaptures = 0,
}) {
  const pierresActives = Object.entries(pierres).filter(([, n]) => n > 0)
  const bonbonsActifs = Object.entries(bonbons).filter(([, n]) => n > 0)
  const aBoss = (objetsBoss.rouage > 0 || objetsBoss.cristal > 0 || objetsBoss.relique > 0)

  // Onglets disponibles (on masque ceux qui sont vides, sauf Balls toujours là).
  const onglets = [
    { cle: 'balls', nom: 'Balls', actif: true },
    { cle: 'pierres', nom: 'Pierres', actif: pierresActives.length > 0 },
    { cle: 'bonbons', nom: 'Bonbons', actif: bonbonsActifs.length > 0 },
    { cle: 'boss', nom: 'Boss', actif: aBoss },
  ].filter((o) => o.actif)

  const [actif, setActif] = useState('balls')
  const [toutVoir, setToutVoir] = useState(false)
  const ongletCourant = onglets.some((o) => o.cle === actif) ? actif : 'balls'

  const Item = ({ img, emoji, nb, titre }) => (
    <span className="pr-item" title={titre}>
      {img ? <img src={img} alt="" className="pr-item-img" onError={(e) => { e.currentTarget.replaceWith(document.createTextNode(emoji || '')) }} /> : <span className="pr-item-emoji">{emoji}</span>}
      <span className="pr-item-nb">{nb}</span>
    </span>
  )

  // Rendu du contenu d'une catégorie (réutilisé en mode onglet ET tout-voir).
  const contenu = (cle) => {
    if (cle === 'balls') return ['poke', 'super', 'hyper', 'master'].map((c) => <Item key={c} img={iconesBalls[c]} nb={balls[c] ?? 0} titre={c} />)
    if (cle === 'pierres') return pierresActives.map(([c, n]) => <Item key={c} img={iconesPierres[c]} emoji={pierresDef[c]?.emoji || '◆'} nb={n} titre={pierresDef[c]?.nom || c} />)
    if (cle === 'bonbons') return bonbonsActifs.map(([c, n]) => <Item key={c} img={iconesBonbons[c]} emoji={bonbonsDef[c]?.emoji || '●'} nb={n} titre={bonbonsDef[c]?.nom || c} />)
    if (cle === 'boss') return (
      <>
        {objetsBoss.rouage > 0 && <Item img={objetsBossDef.rouage?.sprite} emoji={objetsBossDef.rouage?.emoji} nb={objetsBoss.rouage} titre={objetsBossDef.rouage?.nom} />}
        {objetsBoss.cristal > 0 && <Item img={objetsBossDef.cristal?.sprite} emoji={objetsBossDef.cristal?.emoji} nb={objetsBoss.cristal} titre={objetsBossDef.cristal?.nom} />}
        {objetsBoss.relique > 0 && <Item img={objetsBossDef.relique?.sprite} emoji={objetsBossDef.relique?.emoji} nb={objetsBoss.relique} titre={objetsBossDef.relique?.nom} />}
      </>
    )
    return null
  }

  return (
    <div className="panneau panneau-ressources-v2">
      <div className="panneau-titre">
        <span><img src="/icons/objets.png" alt="" className="panneau-icone" /> Ressources</span>
        <button className="pr-toggle" onClick={() => setToutVoir((v) => !v)} title={toutVoir ? 'Réduire' : 'Tout voir'}>{toutVoir ? '▲ Réduire' : '▼ Tout voir'}</button>
      </div>

      {toutVoir ? (
        /* MODE TOUT VOIR : toutes les catégories empilées */
        <div className="pr-tout">
          {onglets.map((o) => (
            <div key={o.cle} className="pr-section">
              <span className="pr-section-titre">{o.nom}</span>
              <div className="pr-grille">{contenu(o.cle)}</div>
            </div>
          ))}
        </div>
      ) : (
        /* MODE ONGLETS : une catégorie à la fois */
        <>
          <div className="pr-onglets">
            {onglets.map((o) => (
              <button key={o.cle} className={`pr-onglet ${ongletCourant === o.cle ? 'actif' : ''}`} onClick={() => setActif(o.cle)}>{o.nom}</button>
            ))}
          </div>
          <div className="pr-grille">{contenu(ongletCourant)}</div>
        </>
      )}

      {/* Compteurs bas */}
      <div className="pr-compteurs">
        <span>{iconeCombat ? <img src={iconeCombat} alt="" className="pr-compteur-icone" /> : null} {vaincus}</span>
        <span className="pr-compteur-captures">{nbCaptures} captures</span>
      </div>
    </div>
  )
}