import { useState } from 'react'
import { SETS_TCG, ORDRE_SETS, RARETE_TCG, FINITIONS, bonusCompletionSet, estimerTauxCarte, formaterTaux, formaterPrix } from './tour'
import AlbumSetsTCG from './AlbumSetsTCG'

const ORDRE_RARETE = ['Common', 'Uncommon', 'Rare', 'Rare Holo', 'Rare Holo EX']
function rangRarete(r) { const idx = ORDRE_RARETE.indexOf(r); return idx === -1 ? 99 : idx }
function infoRareteDe(rarete) {
  return RARETE_TCG[rarete] || Object.values(RARETE_TCG).find((v) => v.label === rarete) || { label: rarete, emoji: '', couleur: '#9e9e9e' }
}
function cleDe(c) { return c.cleCollection || `${c.id}__${c.finition || 'normale'}` }

// Petit rond coloré (remplace les emojis de rareté dans la pop-up taux).
const PASTILLE = {
  display: 'inline-block', width: 9, height: 9, borderRadius: '50%',
  marginRight: 7, verticalAlign: 'middle',
}

// ---- Carte TCG visuelle ----
function CarteTCG({ carte, possedee = true, onClick }) {
  const [imageOk, setImageOk] = useState(true)
  const infoSet = SETS_TCG[carte?.set] || {}
  const fin = carte?.finition || 'normale'
  const estTcgHolo = carte?.rarete?.includes('Holo') || carte?.rarete?.includes('EX')
  const carteChere = (carte?.cote || 0) >= 20    // cote >= 20$ => carte "rare/chassee"
  const carteGraal = (carte?.cote || 0) >= 100   // cote >= 100$ => carte graal

  if (!possedee) {
    return (
      <div className="tcg-carte tcg-carte-manquante" onClick={onClick} title="Carte non obtenue">
        <div className="tcg-carte-vide-inner"><span className="tcg-carte-vide-pt">?</span></div>
      </div>
    )
  }
  return (
    <div className={`tcg-carte fin-${fin} ${estTcgHolo ? 'tcg-holo' : ''} ${carteGraal ? 'tcg-graal' : carteChere ? 'tcg-chere' : ''}`} onClick={onClick} title={`${carte.nom} — ${carte.rarete}${fin !== 'normale' ? ' · ' + FINITIONS[fin].label : ''}${carte.cote != null ? ' · ' + formaterPrix(carte.cote) : ''}`}>
      {imageOk && carte.image ? (
        <img src={carte.imageSmall || carte.image} alt={carte.nom} className="tcg-carte-img" loading="lazy" onError={() => setImageOk(false)} />
      ) : (
        <div className="tcg-carte-fallback" style={{ background: infoSet.couleur || '#333' }}>
          <span className="tcg-carte-fb-emoji">{infoSet.emoji || '🃏'}</span>
          <span className="tcg-carte-fb-nom">{carte.nom}</span>
        </div>
      )}
      {fin === 'brillante' && <div className="tcg-fx-brillante" aria-hidden="true" />}
      {fin === 'prismatique' && <div className="tcg-fx-prismatique" aria-hidden="true" />}
      {fin !== 'normale' && <span className="tcg-badge-fin">{FINITIONS[fin].emoji}</span>}
    </div>
  )
}

// ---- Popup explicatif des taux de drop (SYSTEME BOOSTERS) ----
// Valeurs synchronisees avec inventaireBoosters.js (dropBoosterTour) et
// boosters.js (ouvrirBooster + TABLE_RARE_CLASSIQUE / TABLE_BRILLANT).
function PopupTaux({ onFermer }) {
  return (
    <div className="tcg-apercu-overlay" onClick={onFermer}>
      <div className="tcg-taux-boite" onClick={(e) => e.stopPropagation()}>
        <button className="tcg-apercu-fermer" onClick={onFermer}>✕</button>
        <p className="tcg-taux-titre">Taux de drop</p>
        <p className="tcg-taux-intro">Dans la Tour, tu gagnes des <strong>boosters</strong> (10 cartes chacun). Voici quand ils tombent et ce qu'ils contiennent :</p>

        <div className="tcg-taux-section">
          <span className="tcg-taux-section-titre">Obtenir des boosters</span>
          <ul className="tcg-taux-liste">
            <li><span>Niveau normal</span><span>15%</span></li>
            <li><span>Tous les 5 niveaux</span><span>1 garanti</span></li>
            <li><span>Tous les 10 niveaux</span><span>1 garanti</span></li>
            <li><span>God Pack (sur multiple de 10)</span><span>0,01% → 10 boosters</span></li>
          </ul>
        </div>

        <div className="tcg-taux-section">
          <span className="tcg-taux-section-titre">Contenu d'un booster (10 cartes)</span>
          <ul className="tcg-taux-liste">
            <li><span><i style={{ ...PASTILLE, background: '#9ca3af' }} />Commune (×6 de base)</span><span>~70%</span></li>
            <li><span><i style={{ ...PASTILLE, background: '#22c55e' }} />Peu commune (×6 de base)</span><span>~30%</span></li>
          </ul>
        </div>

        <div className="tcg-taux-section">
          <span className="tcg-taux-section-titre">2 slots « rare »</span>
          <ul className="tcg-taux-liste">
            <li><span><i style={{ ...PASTILLE, background: '#3b82f6' }} />Rare</span><span>80%</span></li>
            <li><span><i style={{ ...PASTILLE, background: '#a855f7' }} />Ultra Rare</span><span>16%</span></li>
            <li><span><i style={{ ...PASTILLE, background: '#ec4899' }} />Illustration</span><span>3%</span></li>
            <li><span><i style={{ ...PASTILLE, background: '#f59e0b' }} />Chromatique</span><span>1%</span></li>
          </ul>
        </div>

        <div className="tcg-taux-section">
          <span className="tcg-taux-section-titre">2 slots « brillant » (plus généreux)</span>
          <ul className="tcg-taux-liste">
            <li><span><i style={{ ...PASTILLE, background: '#3b82f6' }} />Rare</span><span>45%</span></li>
            <li><span><i style={{ ...PASTILLE, background: '#a855f7' }} />Ultra Rare</span><span>38%</span></li>
            <li><span><i style={{ ...PASTILLE, background: '#ec4899' }} />Illustration</span><span>12%</span></li>
            <li><span><i style={{ ...PASTILLE, background: '#f59e0b' }} />Chromatique</span><span>5%</span></li>
          </ul>
        </div>

        <p className="tcg-taux-note"><strong>Cote réelle :</strong> au sein d'une même rareté, plus une carte cote cher dans la vraie vie, plus elle est rare à drop. Un Dracaufeu peut être 100× plus dur à obtenir qu'une autre carte de même rareté ! Clique sur une carte de l'album pour voir sa cote et son taux estimé « 1 sur X ».</p>
      </div>
    </div>
  )
}

// ---- Aperçu grande carte ----
function ApercuCarte({ carte, exemplaires, onFermer }) {
  if (!carte) return null
  const infoSet = SETS_TCG[carte.set] || {}
  const ir = infoRareteDe(carte.rarete)
  const fin = carte.finition || 'normale'
  const infoFin = FINITIONS[fin]
  return (
    <div className="tcg-apercu-overlay" onClick={onFermer}>
      <div className="tcg-apercu-boite" onClick={(e) => e.stopPropagation()}>
        <button className="tcg-apercu-fermer" onClick={onFermer}>✕</button>
        <div className={`tcg-apercu-carte fin-${fin}`}>
          {carte.image ? <img src={carte.image} alt={carte.nom} className="tcg-apercu-img" /> : <div className="tcg-carte-fallback" style={{ background: infoSet.couleur }}><span className="tcg-carte-fb-nom">{carte.nom}</span></div>}
          {fin === 'brillante' && <div className="tcg-fx-brillante" aria-hidden="true" />}
          {fin === 'prismatique' && <div className="tcg-fx-prismatique" aria-hidden="true" />}
        </div>
        <div className="tcg-apercu-infos">
          <p className="tcg-apercu-nom">{carte.nom}</p>
          <p className="tcg-apercu-rarete" style={{ color: ir.couleur }}>{ir.emoji} {carte.rarete}</p>
          {fin !== 'normale' && <p className="tcg-apercu-finition" style={{ color: infoFin.couleur }}>{infoFin.emoji} Finition {infoFin.label}</p>}
          <p className="tcg-apercu-set">{infoSet.emoji} {infoSet.nom || carte.set} · N°{carte.numero}</p>
          {carte.hp && <p className="tcg-apercu-meta">❤️ {carte.hp} PV</p>}
          {carte.types?.length > 0 && <p className="tcg-apercu-meta">Type : {carte.types.join(', ')}</p>}
          {carte.cote != null && <p className="tcg-apercu-cote" title="Cote marché réelle (Cardmarket)">💰 Cote réelle : {formaterPrix(carte.cote)}</p>}
          {(() => {
            const taux = estimerTauxCarte(carte, { poidsCarte: carte._poidsCarte, poidsTotal: carte._poidsTotal, nbCartesRarete: carte._nbRarete })
            return taux ? <p className="tcg-apercu-taux" title="Estimation de la difficulté à obtenir cette carte en jeu">🎲 Drop en jeu : {formaterTaux(taux)}</p> : null
          })()}
          {exemplaires > 1 && <p className="tcg-apercu-meta tcg-apercu-double">📦 {exemplaires} exemplaires</p>}
        </div>
      </div>
    </div>
  )
}

// ---- Onglet Album ----
function OngletAlbum({ collectionCartes }) {
  const [setActif, setSetActif] = useState('base1')
  const [rareteFiltre, setRareteFiltre] = useState('tous')
  const [finitionFiltre, setFinitionFiltre] = useState('tous')
  const [recherche, setRecherche] = useState('')
  const [montrerManquantes, setMontrerManquantes] = useState(true)
  const [carteSel, setCarteSel] = useState(null)
  const [popupTaux, setPopupTaux] = useState(false)

  // Compteur d'exemplaires par cle (carte+finition) + version unique
  const comptes = {}
  const uniquesParCle = {}
  for (const c of collectionCartes) {
    const k = cleDe(c)
    comptes[k] = (comptes[k] || 0) + 1
    if (!uniquesParCle[k]) uniquesParCle[k] = c
  }

  const info = SETS_TCG[setActif]
  const { uniques, nbBrillantes, nbPrismatiques } = bonusCompletionSet(collectionCartes, setActif)
  const pctSet = Math.round((uniques / info.total) * 100)

  // Cartes du set actif (version uniques par cle = chaque finition compte)
  let cartes = Object.values(uniquesParCle).filter((c) => c.set === setActif)
  if (rareteFiltre !== 'tous') cartes = cartes.filter((c) => c.rarete === rareteFiltre)
  if (finitionFiltre !== 'tous') cartes = cartes.filter((c) => (c.finition || 'normale') === finitionFiltre)
  if (recherche.trim()) cartes = cartes.filter((c) => c.nom.toLowerCase().includes(recherche.trim().toLowerCase()))
  cartes.sort((a, b) => {
    const fa = FINITIONS[a.finition || 'normale'].rang, fb = FINITIONS[b.finition || 'normale'].rang
    if (fa !== fb) return fb - fa
    const ra = rangRarete(a.rarete), rb = rangRarete(b.rarete)
    if (ra !== rb) return rb - ra
    return a.nom.localeCompare(b.nom)
  })

  const sansFiltre = rareteFiltre === 'tous' && finitionFiltre === 'tous' && !recherche.trim()
  const nbManquantes = Math.max(0, info.total - uniques)

  return (
    <div className="tcg-album">
      <div className="tcg-set-onglets">
        {ORDRE_SETS.map((sid) => {
          const i = SETS_TCG[sid]
          const u = bonusCompletionSet(collectionCartes, sid).uniques
          const pct = Math.round((u / i.total) * 100)
          return (
            <button key={sid} className={`tcg-set-onglet ${setActif === sid ? 'actif' : ''}`} onClick={() => setSetActif(sid)} style={{ '--c-set': i.couleur }}>
              <span className="tcg-set-onglet-nom">{i.emoji} {i.nom}</span>
              <span className="tcg-set-onglet-pct">{u}/{i.total}</span>
              <span className="tcg-set-onglet-barre"><span className="tcg-set-onglet-fill" style={{ width: `${pct}%` }} /></span>
            </button>
          )
        })}
      </div>

      <div className="tcg-set-bandeau" style={{ '--c-set': info.couleur }}>
        <div className="tcg-set-bandeau-haut">
          <span className="tcg-set-bandeau-titre">{info.emoji} {info.nom}</span>
          <span className="tcg-set-bandeau-compteur">{uniques} / {info.total} <span className="tcg-set-bandeau-pct">({pctSet}%)</span></span>
        </div>
        <div className="tcg-set-bandeau-barre"><span className="tcg-set-bandeau-fill" style={{ width: `${pctSet}%` }} /></div>
        <div className="tcg-set-bandeau-fx">
          <span className="tcg-fx-compteur" title="Cartes brillantes">✨ {nbBrillantes}</span>
          <span className="tcg-fx-compteur" title="Cartes prismatiques">🌈 {nbPrismatiques}</span>
        </div>
        {pctSet === 100 && <span className="tcg-set-complet">★ Set complété ! ★</span>}
      </div>

      <div className="tcg-filtres">
        <input className="tcg-recherche" placeholder="🔍 Rechercher..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
        <select className="tcg-select" value={rareteFiltre} onChange={(e) => setRareteFiltre(e.target.value)}>
          <option value="tous">Toutes raretés</option>
          {ORDRE_RARETE.map((k) => RARETE_TCG[k] && (<option key={k} value={k}>{RARETE_TCG[k].emoji} {RARETE_TCG[k].label}</option>))}
        </select>
        <select className="tcg-select" value={finitionFiltre} onChange={(e) => setFinitionFiltre(e.target.value)}>
          <option value="tous">Toutes finitions</option>
          <option value="normale">Normale</option>
          <option value="brillante">✨ Brillante</option>
          <option value="prismatique">🌈 Prismatique</option>
        </select>
        <button className={`tcg-toggle ${montrerManquantes ? 'actif' : ''}`} onClick={() => setMontrerManquantes((v) => !v)} title="Afficher les emplacements vides">
          {montrerManquantes ? '👁️ Manquantes' : '🚫 Manquantes'}
        </button>
        <button className="tcg-toggle tcg-btn-taux" onClick={() => setPopupTaux(true)} title="Voir les taux de drop">🎲 Taux</button>
      </div>

      <div className="tcg-grille">
        {cartes.map((carte) => {
          const k = cleDe(carte)
          return (
            <div key={k} className="tcg-grille-slot" onClick={() => setCarteSel(carte)}>
              <CarteTCG carte={carte} possedee />
              {comptes[k] > 1 && <span className="tcg-compte">×{comptes[k]}</span>}
            </div>
          )
        })}
        {montrerManquantes && sansFiltre && Array.from({ length: nbManquantes }).map((_, i) => (
          <div key={`vide-${i}`} className="tcg-grille-slot"><CarteTCG possedee={false} carte={null} /></div>
        ))}
      </div>
      {cartes.length === 0 && !montrerManquantes && (<p className="tcg-vide">Aucune carte ici pour l'instant. Monte dans la tour !</p>)}

      {carteSel && <ApercuCarte carte={carteSel} exemplaires={comptes[cleDe(carteSel)] || 1} onFermer={() => setCarteSel(null)} />}
      {popupTaux && <PopupTaux onFermer={() => setPopupTaux(false)} />}
    </div>
  )
}

// ---- Onglet Tour ----
function OngletTour({ meilleurNiveau, onLancer, enCours }) {
  const [popupTaux, setPopupTaux] = useState(false)
  const etapes = [
    { niveau: 1,  label: 'Niveau 1',  drop: '15% booster',     couleur: '#9ca3af' },
    { niveau: 5,  label: 'Mini-Boss', drop: 'Booster garanti', couleur: '#3b82f6' },
    { niveau: 10, label: 'Boss',      drop: 'Booster garanti', couleur: '#a855f7' },
    { niveau: 30, label: 'Boss+',     drop: 'Booster garanti', couleur: '#ec4899' },
  ]
  const T = TOUR_STYLES
  return (
    <div style={T.wrap}>
      {/* Record */}
      <div style={T.record}>
        <div style={T.recordHalo} />
        <span style={T.recordLabel}>Meilleur niveau atteint</span>
        <span style={T.recordVal}>{meilleurNiveau}</span>
      </div>

      <p style={T.desc}>
        Roguelike : chaque run repart du niveau 1, la difficulté monte sans fin.
        Tu gagnes des <b style={{ color: '#fcd34d' }}>boosters</b> en montant
        (garantis tous les 5 niveaux) — ouvre-les pour compléter tes sets !
      </p>

      {/* Bouton taux */}
      <button onClick={() => setPopupTaux(true)} title="Voir les taux de drop" style={T.btnTaux}>
        <span style={T.btnTauxRond}>?</span>
        Voir les taux de drop
      </button>

      {/* Etapes (paliers) */}
      <div style={T.etapes}>
        {etapes.map((e) => (
          <div key={e.niveau} style={{ ...T.etape, borderColor: e.couleur, boxShadow: `0 0 14px ${rgbaT(e.couleur, 0.3)}` }}>
            <span style={{ ...T.etapeNum, color: e.couleur }}>Niv. {e.niveau}</span>
            <span style={T.etapeLabel}>{e.label}</span>
            <span style={T.etapeDrop}>{e.drop}</span>
          </div>
        ))}
        <div style={{ ...T.etape, borderColor: '#f59e0b', boxShadow: `0 0 18px ${rgbaT('#f59e0b', 0.4)}` }}>
          <span style={{ ...T.etapeNum, color: '#f59e0b', fontSize: 20 }}>∞</span>
          <span style={T.etapeLabel}>Infini</span>
          <span style={{ ...T.etapeDrop, color: '#fcd34d' }}>God Pack possible</span>
        </div>
      </div>

      {/* Raretes a collectionner */}
      <div style={T.raretes}>
        <span style={T.raretesTitre}>Raretés à collectionner</span>
        <div style={T.raretesListe}>
          <span style={{ ...T.rareteTag, borderColor: '#3b82f6', color: '#3b82f6' }}>Rare</span>
          <span style={{ ...T.rareteTag, borderColor: '#a855f7', color: '#c084fc' }}>Ultra Rare</span>
          <span style={{ ...T.rareteTag, borderColor: '#ec4899', color: '#ec4899' }}>Illustration</span>
          <span style={{ ...T.rareteTag, borderColor: '#f59e0b', color: '#fcd34d' }}>Chromatique</span>
        </div>
      </div>

      {/* Lancer */}
      <button onClick={onLancer} disabled={enCours} style={{ ...T.btnLancer, ...(enCours ? T.btnLancerOff : {}) }}>
        {enCours ? 'Combat en cours…' : 'Lancer une run !'}
      </button>

      {popupTaux && <PopupTaux onFermer={() => setPopupTaux(false)} />}
    </div>
  )
}

// Hex -> rgba pour les halos de l'onglet Tour.
function rgbaT(hex, a) {
  const h = (hex || '#888').replace('#', '')
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

const TOUR_STYLES = {
  wrap: { color: '#e8ecf6', fontFamily: "'Rubik',system-ui,sans-serif", padding: '8px 14px 16px' },
  record: {
    position: 'relative', textAlign: 'center', padding: '16px 12px', marginBottom: 14,
    background: 'linear-gradient(180deg,rgba(120,90,40,0.35),rgba(40,30,15,0.5))',
    border: '2px solid #fcd34d', borderRadius: 14, overflow: 'hidden',
    boxShadow: '0 0 26px rgba(252,211,77,0.3)',
  },
  recordHalo: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 50% 30%, rgba(252,211,77,0.2) 0%, transparent 60%)', pointerEvents: 'none',
  },
  recordLabel: { display: 'block', fontSize: 11, letterSpacing: 2, color: '#d8c89a', fontWeight: 800, position: 'relative' },
  recordVal: {
    display: 'block', fontSize: 42, fontWeight: 900, color: '#fcd34d', lineHeight: 1.1, position: 'relative',
    textShadow: '0 0 20px rgba(252,211,77,0.6)',
  },
  desc: { fontSize: 13.5, color: '#c3ccde', lineHeight: 1.55, textAlign: 'center', margin: '0 0 14px' },
  btnTaux: {
    display: 'flex', alignItems: 'center', gap: 7, margin: '0 auto 16px', padding: '8px 16px',
    borderRadius: 10, cursor: 'pointer', fontWeight: 800, fontSize: 13,
    border: '2px solid rgba(252,211,77,0.55)', background: 'rgba(252,211,77,0.12)', color: '#fcd34d',
  },
  btnTauxRond: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 18, height: 18, borderRadius: '50%', border: '2px solid currentColor', fontSize: 12, fontWeight: 900,
  },
  etapes: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 18,
  },
  etape: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '12px 8px',
    background: 'rgba(255,255,255,0.04)', border: '2px solid', borderRadius: 12, textAlign: 'center',
  },
  etapeNum: { fontSize: 14, fontWeight: 900 },
  etapeLabel: { fontSize: 12, fontWeight: 700, color: '#fff' },
  etapeDrop: { fontSize: 10.5, color: '#9aa6bd', fontWeight: 600 },
  raretes: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12, padding: '12px 14px', marginBottom: 18,
  },
  raretesTitre: { display: 'block', fontSize: 12, fontWeight: 800, color: '#9aa6bd', marginBottom: 8, textAlign: 'center' },
  raretesListe: { display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  rareteTag: {
    fontSize: 11, fontWeight: 800, padding: '5px 13px', borderRadius: 20,
    border: '1.5px solid', background: 'rgba(255,255,255,0.03)',
  },
  btnLancer: {
    width: '100%', padding: '15px', borderRadius: 12, cursor: 'pointer',
    fontWeight: 900, fontSize: 17, border: 'none',
    background: 'linear-gradient(180deg,#fcd34d,#e0a82e)', color: '#3a2800',
    boxShadow: '0 5px 0 #a87b1e', letterSpacing: 0.5,
  },
  btnLancerOff: {
    background: 'rgba(255,255,255,0.1)', color: '#7a86a0', boxShadow: 'none', cursor: 'not-allowed',
  },
}

function PanneauTour({ collectionCartes = [], meilleurNiveau = 0, onLancer, enCours = false, onFermer }) {
  const [onglet, setOnglet] = useState('tour')
  const nbCartes = new Set(collectionCartes.map((c) => cleDe(c))).size
  const bonusTotalXP = ORDRE_SETS.reduce((total, sid) => total + bonusCompletionSet(collectionCartes, sid).totalBonus, 0)

  return (
    <div className="overlay" onClick={onFermer}>
      <div className="tcg-panneau" onClick={(e) => e.stopPropagation()}>
        <div className="tcg-entete">
          <div className="tcg-entete-titre">
            <span className="tcg-titre">Tour Infinie</span>
            <span className="tcg-sous-titre">Roguelike · Album de cartes TCG</span>
          </div>
          {bonusTotalXP > 0 && <span className="tcg-bonus-actif" title="Bonus XP grâce à ta collection">+{Math.round(bonusTotalXP * 100)}% XP</span>}
          <button className="tcg-fermer" onClick={onFermer}>✕</button>
        </div>
        <div className="tcg-onglets">
          <button className={`tcg-onglet ${onglet === 'tour' ? 'actif' : ''}`} onClick={() => setOnglet('tour')}>Tour</button>
          <button className={`tcg-onglet ${onglet === 'sets' ? 'actif' : ''}`} onClick={() => setOnglet('sets')}>Sets TCG</button>
        </div>
        {onglet === 'tour' && <OngletTour meilleurNiveau={meilleurNiveau} onLancer={onLancer} enCours={enCours} />}
{onglet === 'sets' && <AlbumSetsTCG collection={collectionCartes} />}
      </div>
    </div>
  )
}

export default PanneauTour