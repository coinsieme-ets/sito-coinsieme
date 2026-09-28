/* Comprendere = rileggere le dichiarazioni. Orientare = seguire scelte esplicite.
 * Nessuna AI, interpretazione del racconto o persistenza. */
(() => {
  'use strict';
  const root = document.getElementById('sportello-app');
  const panels = [...root.querySelectorAll('[data-step]')];
  const form = root.querySelector('form');
  const fields = ['racconto'];
  const catalog = window.SportelloOrientamento;
  const areaContainer = root.querySelector('#aree-scelta');
  const areaStatus = root.querySelector('#aree-stato');
  const resourceList = root.querySelector('#risorse-elenco');
  const chosenList = root.querySelector('#aree-riepilogo');
  let permitted = false, confirmed = false;

  for (const area of [...catalog.areas].sort((a,b) => a.order-b.order)) {
    const label = document.createElement('label');
    label.className = 'sp-area-card';
    const photo = document.createElement('span');
    photo.className = 'sp-area-photo sp-photo-'+area.order;
    photo.setAttribute('aria-hidden','true');
    const image = document.createElement('img');
    image.src = area.id === 'relazioni-solitudine' ? '/sportello/images/relazioni-riferimento.webp' : '/sportello/images/aree-riferimento.webp';
    image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
    image.width = area.id === 'relazioni-solitudine' ? 720 : 1536;
    image.height = area.id === 'relazioni-solitudine' ? 540 : 1024;
    photo.append(image);
    const input = document.createElement('input');
    input.type = 'checkbox'; input.value = area.id; input.id = 'area-'+area.id;
    input.setAttribute('aria-labelledby',input.id+'-titolo');
    input.setAttribute('aria-describedby',input.id+'-testo');
    const copy = document.createElement('span'); copy.className = 'sp-area-copy';
    const title = document.createElement('strong'); title.id = input.id+'-titolo'; title.textContent = area.title;
    const text = document.createElement('span'); text.id = input.id+'-testo'; text.className = 'sp-area-description'; text.textContent = area.text;
    copy.append(title,text); label.append(photo,input,copy); areaContainer.append(label);
  }
  const areaInputs = [...areaContainer.querySelectorAll('input')];
  function selectedIds() { return areaInputs.filter(input => input.checked).map(input => input.value); }
  function updateCount(message = '') {
    const count = selectedIds().length;
    areaStatus.textContent = message || (count ? count+' aree selezionate su un massimo di 3.' : 'Nessuna area selezionata.');
  }
  function clearOrientation() {
    areaInputs.forEach(input => { input.checked = false; });
    updateCount(); resourceList.replaceChildren(); chosenList.replaceChildren();
    root.querySelector('#risorse-intro').textContent = '';
    root.querySelector('#nessuna-area').hidden = true;
  }
  areaContainer.addEventListener('change', event => {
    if (selectedIds().length > 3) {
      event.target.checked = false;
      updateCount('Puoi scegliere al massimo 3 aree. Deselezionane una prima di aggiungerne un’altra.');
    } else updateCount();
  });
  function show(step) {
    if (['racconto','rilettura','orientamento','risorse'].includes(step) && !permitted) step = 'perimetro';
    else if (['orientamento','risorse'].includes(step) && !confirmed) step = 'rilettura';
    panels.forEach(panel => { panel.hidden = panel.dataset.step !== step; });
    const progress = root.querySelector('.sp-progress');
    progress.hidden = ['introduzione','perimetro'].includes(step);
    root.querySelectorAll('[data-progress]').forEach(item => {
      if (item.dataset.progress === step) item.setAttribute('aria-current','step');
      else item.removeAttribute('aria-current');
    });
    root.querySelector('[data-step="'+step+'"] '+(step === 'introduzione' ? 'h1' : 'h2')).focus();
  }
  function renderResources() {
    if (!confirmed || !permitted) return show('orientamento');
    const ids = selectedIds();
    resourceList.replaceChildren(); chosenList.replaceChildren();
    for (const area of catalog.selectAreas(ids)) {
      const item = document.createElement('li'); item.textContent = area.title; chosenList.append(item);
    }
    chosenList.hidden = !ids.length;
    root.querySelector('#nessuna-area').hidden = Boolean(ids.length);
    root.querySelector('#risorse-intro').textContent = ids.length
      ? 'Hai indicato alcuni aspetti che senti vicini alla tua situazione. Ti proponiamo poche risorse COINSIEME da cui partire, senza pretendere che siano già una risposta completa.'
      : 'Se vuoi, puoi esplorare queste due pagine generali. Non sono state dedotte indicazioni dal tuo racconto.';
    const resources = catalog.chooseResources(ids);
    if (!resources.length) root.querySelector('#risorse-intro').textContent = 'Per queste aree non sono disponibili risorse in questo momento. Puoi rivedere le scelte oppure usare i contatti qui sotto.';
    for (const resource of resources) {
      const article = document.createElement('article'); article.className = 'sp-resource';
      if (resource.areas.length) {
        const context = document.createElement('p'); context.className = 'sp-resource-context';
        context.textContent = 'Per le aree: '+resource.areas.join(' · '); article.append(context);
      }
      const heading = document.createElement('h3'), link = document.createElement('a');
      link.href = resource.url; link.textContent = resource.title; heading.append(link);
      const text = document.createElement('p'); text.textContent = resource.text;
      article.append(heading,text); resourceList.append(article);
    }
    show('risorse');
  }
  function reset(focus = true) {
    permitted = false; confirmed = false;
    form.reset(); clearOrientation();
    root.querySelector('#racconto-conteggio').textContent = '0 / 3.000 caratteri';
    root.querySelector('.sp-progress').hidden = true;
    root.querySelector('#perimetro-ok').checked = false;
    root.querySelector('#perimetro-ok').removeAttribute('aria-invalid');
    fields.forEach(id => { root.querySelector('[data-answer="'+id+'"]').textContent = ''; });
    root.querySelector('#conferma-esito').textContent = '';
    root.querySelector('#perimetro-errore').hidden = true;
    if (focus) show('introduzione');
    else panels.forEach(panel => { panel.hidden = panel.dataset.step !== 'introduzione'; });
  }
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    if (action === 'perimetro') show('perimetro');
    if (action === 'inizia') show('perimetro');
    if (action === 'avanti') {
      permitted = root.querySelector('#perimetro-ok').checked;
      root.querySelector('#perimetro-errore').hidden = permitted;
      root.querySelector('#perimetro-ok').setAttribute('aria-invalid', String(!permitted));
      if (permitted) show('racconto');
      else root.querySelector('#perimetro-ok').focus();
    }
    if (action === 'correggi') { confirmed = false; clearOrientation(); root.querySelector('#conferma-esito').textContent = ''; show('racconto'); }
    if (action === 'conferma' && permitted) { confirmed = true; show('orientamento'); }
    if (action === 'rivedi-racconto') { confirmed = false; show('rilettura'); }
    if (action === 'risorse') renderResources();
    if (action === 'nessuna-scelta' && confirmed && permitted) { clearOrientation(); renderResources(); }
    if (action === 'cambia-aree') show('orientamento');
    if (action === 'cancella') reset();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!permitted) return show('perimetro');
    confirmed = false; clearOrientation();
    fields.forEach(id => {
      // Preserve words as plain text; never infer or silently truncate.
      root.querySelector('[data-answer="'+id+'"]').textContent = root.querySelector('#'+id).value || 'Non hai inserito un testo.';
    });
    root.querySelector('#conferma-esito').textContent = '';
    show('rilettura');
  });
  form.addEventListener('input', () => { root.querySelector('#racconto-conteggio').textContent = root.querySelector('#racconto').value.length+' / 3.000 caratteri'; confirmed = false; clearOrientation(); });
  window.addEventListener('pagehide', () => reset(false));
  window.addEventListener('pageshow', event => { if (event.persisted) reset(false); });
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (link && !link.getAttribute('href').startsWith('#') && link.target !== '_blank') reset(false);
  });
  root.querySelectorAll('[data-action]').forEach(button => { button.hidden = false; });
  reset(false);
})();
