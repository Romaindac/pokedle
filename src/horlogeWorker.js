// Horloge basée sur un Web Worker.
// Les setInterval/setTimeout du thread principal sont ralentis par le navigateur
// quand l'onglet est en arrière-plan (souvent 1 tick/seconde max). Un Web Worker
// n'est PAS soumis à ce throttling : il continue à cadence normale.
//
// On crée le worker "inline" via un Blob → aucun fichier séparé à charger,
// aucun souci de chemin avec Vite.

const CODE_WORKER = `
  let timer = null;
  self.onmessage = function (e) {
    const d = e.data || {};
    if (d.type === 'start') {
      if (timer) clearInterval(timer);
      const ms = Math.max(1, d.intervalle || 100);
      timer = setInterval(function () { self.postMessage('tic'); }, ms);
    } else if (d.type === 'stop') {
      if (timer) clearInterval(timer);
      timer = null;
    }
  };
`

// Crée une horloge worker. `onTic` est appelé à chaque tic.
// Renvoie un objet { start(intervalleMs), stop() }.
// Repli automatique sur setInterval si les Workers ne sont pas dispo.
export function creerHorloge(onTic) {
  let worker = null
  let intervalleFallback = null

  try {
    const blob = new Blob([CODE_WORKER], { type: 'application/javascript' })
    const url = URL.createObjectURL(blob)
    worker = new Worker(url)
    worker.onmessage = () => onTic()
  } catch (err) {
    worker = null
  }

  return {
    start(intervalleMs) {
      if (worker) {
        worker.postMessage({ type: 'start', intervalle: intervalleMs })
      } else {
        if (intervalleFallback) clearInterval(intervalleFallback)
        intervalleFallback = setInterval(onTic, intervalleMs)
      }
    },
    stop() {
      if (worker) worker.postMessage({ type: 'stop' })
      if (intervalleFallback) { clearInterval(intervalleFallback); intervalleFallback = null }
    },
    detruire() {
      if (worker) { worker.terminate(); worker = null }
      if (intervalleFallback) { clearInterval(intervalleFallback); intervalleFallback = null }
    },
  }
}