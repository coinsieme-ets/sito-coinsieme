/* Catalogo editoriale: usa solo le aree scelte, mai il racconto. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SportelloOrientamento = api;
})(typeof window === 'undefined' ? globalThis : window, () => {
  'use strict';
  const {areas,resources} = typeof module === 'object' && module.exports ? require('./risorse') : window.SportelloRisorse;
  const selectAreas = ids => areas.filter(area => ids.includes(area.id)).sort((a,b) => a.order-b.order).slice(0,3);
  function chooseResources(ids, isAvailable = url => Boolean(resources[url])) {
    const selected = selectAreas(ids), result = new Map();
    const valid = url => Boolean(resources[url]) && isAvailable(url);
    const add = url => { if (valid(url) && !result.has(url) && result.size < 4) result.set(url, {url,...resources[url],areas:[]}); };
    // Prima tutte le destinazioni principali, poi le alternative (max 2 per area).
    // Nessuna chiamata di rete: disponibilita' verificata nei test del sito.
    for (const area of selected) add(valid(area.link) ? area.link : area.fallback);
    for (const area of selected) add(area.fallback);
    if (!selected.length) ['/persone-famiglie.html','/articoli.html'].forEach(add);
    for (const resource of result.values()) {
      resource.areas = selected.filter(area => [area.link,area.fallback].includes(resource.url)).map(area => area.title);
    }
    return [...result.values()];
  }
  return {areas,resources,selectAreas,chooseResources};
});
