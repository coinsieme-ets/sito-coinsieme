(() => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (toggle && menu) {
    const closeMenu = () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Apri menu di navigazione');
    };

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      const opening = !menu.classList.contains('open');
      menu.classList.toggle('open', opening);
      toggle.setAttribute('aria-expanded', String(opening));
      toggle.setAttribute('aria-label', opening ? 'Chiudi menu di navigazione' : 'Apri menu di navigazione');
    });

    menu.addEventListener('click', (event) => event.stopPropagation());
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
        toggle.focus();
      }
    });
  }

  const data = window.CASA_PREVIEW_DATA || { solutions: {}, paths: {} };
  const roomLabels = {
    panoramica: 'Panoramica della casa',
    ingresso: 'Ingresso',
    soggiorno: 'Soggiorno',
    cucina: 'Cucina',
    bagno: 'Bagno',
    passaggi: 'Corridoio e passaggi',
    camera: 'Camera da letto',
    'tutta-la-casa': 'Soluzioni per tutta la casa'
  };

  const stage = document.getElementById('house-stage');
  const housePlanImage = document.getElementById('house-plan-image');
  const housePlanPlaceholder = document.getElementById('house-plan-placeholder');
  const roomStatus = document.getElementById('room-selection-status');
  const roomButtons = [...document.querySelectorAll('.house-room-selector button')];
  const hotspots = [...document.querySelectorAll('.hotspot')];

  if (data.assets?.housePlan && housePlanImage && housePlanPlaceholder) {
    housePlanImage.src = data.assets.housePlan;
    housePlanImage.alt = data.assets.housePlanAlt || 'Illustrazione della casa interattiva';
    housePlanImage.hidden = false;
    housePlanPlaceholder.hidden = true;
  }

  const selectRoom = (room) => {
    if (!stage || !roomLabels[room]) return;
    stage.dataset.activeRoom = room;
    roomButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.room === room)));
    hotspots.forEach((button) => {
      const relevant = room === 'panoramica' || button.dataset.room === room || (room !== 'tutta-la-casa' && button.dataset.room === 'tutta-la-casa');
      button.classList.toggle('is-room-active', room !== 'panoramica' && relevant);
      button.classList.toggle('is-room-muted', !relevant);
    });
    if (roomStatus) {
      roomStatus.textContent = room === 'panoramica'
        ? 'Panoramica della casa: scegli una stanza o uno degli oggetti.'
        : `${roomLabels[room]} in evidenza. Gli altri ambienti restano disponibili.`;
    }
  };

  roomButtons.forEach((button) => button.addEventListener('click', () => selectRoom(button.dataset.room)));

  const media = document.getElementById('object-media');
  const title = document.getElementById('object-title');
  const benefit = document.getElementById('object-benefit');
  const how = document.getElementById('object-how');
  const advantages = document.getElementById('object-advantages');
  const limits = document.getElementById('object-limits');
  const requirements = document.getElementById('object-requirements');
  const detailPanel = document.getElementById('object-detail-panel');
  const discoverButton = document.getElementById('discover-solution');
  const roomLink = document.getElementById('object-room-link');

  const closeObjectDetails = () => {
    if (!detailPanel || !discoverButton) return;
    detailPanel.hidden = true;
    discoverButton.setAttribute('aria-expanded', 'false');
    discoverButton.textContent = 'Scopri come funziona';
  };

  hotspots.forEach((button) => {
    button.addEventListener('click', (event) => {
      const solution = data.solutions[button.dataset.solution];
      if (!solution || !media || !title || !benefit || !how || !advantages || !limits || !requirements || !roomLink || !discoverButton) return;

      hotspots.forEach((item) => item.removeAttribute('aria-pressed'));
      button.setAttribute('aria-pressed', 'true');
      selectRoom(button.dataset.room);
      title.textContent = solution.title;
      benefit.textContent = solution.benefit;
      how.textContent = solution.how;
      advantages.textContent = solution.advantages;
      limits.textContent = solution.limits;
      requirements.textContent = solution.requirements;
      roomLink.href = solution.room;
      roomLink.hidden = false;
      discoverButton.disabled = false;
      closeObjectDetails();

      media.replaceChildren();
      const illustration = data.assets?.cardImages?.[solution.title];
      const imageData = illustration || (solution.image ? {
        src: solution.image,
        alt: solution.alt,
        width: 640,
        height: 420
      } : null);
      if (imageData) {
        const image = document.createElement('img');
        image.src = imageData.src;
        image.alt = imageData.alt;
        image.width = imageData.width;
        image.height = imageData.height;
        image.loading = 'lazy';
        image.decoding = 'async';
        media.append(image);
        const imageNote = illustration ? data.assets.solutionImageNote : solution.imageNote;
        if (imageNote) {
          const note = document.createElement('span');
          note.className = 'object-image-note';
          note.textContent = imageNote;
          media.append(note);
        }
      } else {
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.setAttribute('role', 'img');
        placeholder.setAttribute('aria-label', `Immagine definitiva da inserire per ${solution.title}`);
        const label = document.createElement('span');
        label.textContent = 'Immagine del dispositivo da inserire';
        placeholder.append(label);
        media.append(placeholder);
      }

      if (event.detail > 0 && window.matchMedia('(max-width: 900px)').matches) {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.querySelector('.object-preview')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

  document.querySelectorAll('.solution').forEach((card) => {
    const heading = card.querySelector('h3')?.textContent.trim();
    const illustration = heading && data.assets?.cardImages?.[heading];
    if (!illustration || card.querySelector('.solution-media')) return;

    const figure = document.createElement('figure');
    figure.className = 'solution-media';
    const image = document.createElement('img');
    image.src = illustration.src;
    image.alt = illustration.alt;
    image.width = illustration.width;
    image.height = illustration.height;
    image.loading = 'lazy';
    image.decoding = 'async';
    const caption = document.createElement('figcaption');
    caption.textContent = data.assets.solutionImageNote;
    figure.append(image, caption);
    card.prepend(figure);
  });

  discoverButton?.addEventListener('click', () => {
    if (!detailPanel) return;
    const opening = detailPanel.hidden;
    detailPanel.hidden = !opening;
    discoverButton.setAttribute('aria-expanded', String(opening));
    discoverButton.textContent = opening ? 'Nascondi i dettagli' : 'Scopri come funziona';
  });

  const cards = [...document.querySelectorAll('.solution')];
  const status = document.getElementById('path-status');
  const statusText = document.getElementById('path-status-text');
  const clearPath = document.getElementById('clear-path');

  const resetPath = () => {
    cards.forEach((card) => card.classList.remove('is-recommended', 'is-muted'));
    document.querySelectorAll('.path-action').forEach((button) => button.removeAttribute('aria-pressed'));
    if (status) status.hidden = true;
  };

  document.querySelectorAll('.path-action').forEach((button) => {
    button.addEventListener('click', () => {
      const path = data.paths[button.dataset.path];
      if (!path) return;

      resetPath();
      let matches = 0;
      cards.forEach((card) => {
        const heading = card.querySelector('h3')?.textContent || '';
        const relevant = path.terms.some((term) => heading.includes(term));
        card.classList.add(relevant ? 'is-recommended' : 'is-muted');
        if (relevant) matches += 1;
      });
      button.setAttribute('aria-pressed', 'true');
      if (status && statusText) {
        statusText.textContent = `${path.label}: ${matches} soluzioni evidenziate. Tutte le altre restano disponibili.`;
        status.hidden = false;
        status.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  clearPath?.addEventListener('click', resetPath);

  const demos = [
    { title: 'Luci accessibili e automatizzate', kind: 'light', label: 'Illuminazione intelligente', action: 'Accendi la luce', active: 'Spegni la luce', initial: 'Luce spenta', changed: 'Luce accesa' },
    { title: 'Tapparelle e tende motorizzate', kind: 'blind', label: 'Tapparella motorizzata', action: 'Alza la tapparella', active: 'Abbassa la tapparella', initial: 'Tapparella abbassata', changed: 'Tapparella alzata' },
    { title: 'Chiamata di aiuto e telesoccorso', kind: 'help', label: 'Chiamata di aiuto', action: 'Prova il pulsante di aiuto', active: 'Ripeti la simulazione', initial: 'Simulazione pronta. Nessuna richiesta inviata.', changed: 'Percorso illustrato: pulsante, collegamento, contatto designato. Nessuna richiesta inviata e nessun soccorso confermato.' }
  ];
  demos.forEach((demo) => {
    const card = cards.find((item) => item.querySelector('h3')?.textContent.trim() === demo.title);
    if (!card) return;
    const panel = document.createElement('details');
    panel.className = 'casa-demo';
    const summary = document.createElement('summary');
    summary.textContent = 'Prova: ' + demo.label;
    const scene = document.createElement('div');
    scene.className = 'demo-scene demo-' + demo.kind;
    scene.setAttribute('aria-hidden', 'true');
    scene.innerHTML = demo.kind === 'help'
      ? '<span class="demo-step">Pulsante</span><span class="demo-step">Collegamento</span><span class="demo-step">Contatto designato</span>'
      : '<div class="demo-window"><div class="demo-shutter"></div></div><div class="demo-lamp"></div><div class="demo-sofa"></div>';
    const note = document.createElement('p');
    note.className = 'demo-note';
    note.textContent = 'Dimostrazione: non controlla dispositivi reali e non invia comunicazioni.';
    const status = document.createElement('p');
    status.className = 'demo-status';
    status.setAttribute('role', 'status');
    status.textContent = demo.initial;
    const controls = document.createElement('div');
    controls.className = 'demo-controls';
    const action = document.createElement('button');
    action.type = 'button';
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Ripristina';
    reset.setAttribute('aria-label', 'Ripristina: ' + demo.label);
    let on = false;
    const render = () => {
      scene.classList.toggle('is-on', on);
      status.textContent = on ? demo.changed : demo.initial;
      action.textContent = on ? demo.active : demo.action;
      action.setAttribute('aria-label', action.textContent + ': ' + demo.label);
      if (demo.kind !== 'help') action.setAttribute('aria-pressed', String(on));
    };
    render();
    action.addEventListener('click', () => { on = demo.kind === 'help' || !on; render(); });
    reset.addEventListener('click', () => { on = false; render(); });
    controls.append(action, reset);
    panel.append(summary, scene, controls, status, note);
    card.insertBefore(panel, card.querySelector('details'));
  });
})();
