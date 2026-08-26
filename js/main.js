'use strict';

/* ============================================================
   DATI ARTICOLI (array — sarà sostituito da API CMS)
   ============================================================ */

const ARTICOLI = [
  {
    id: 1,
    titolo: "Smart working e disabilità: diritti, strumenti e buone pratiche",
    abstract: "Un approfondimento sui diritti delle persone con disabilità nel contesto del lavoro agile, con riferimenti normativi e indicazioni pratiche per lavoratori e datori di lavoro.",
    categoria: "diritti-normativa",
    categoriaLabel: "Diritti e normativa",
    autore: "[Autore da definire]",
    data: "2024-09-15",
    url: "articolo.html",
    immagine: "assets/inclusive_workplace.jpg",
    immagineAlt: "Persona al lavoro in un ambiente accessibile e collaborativo",
    coloreBg: "linear-gradient(135deg, rgba(196,94,26,0.85), #a34d14)"
  },
  {
    id: 2,
    titolo: "Innovazione sociale: perché non basta la tecnologia",
    abstract: "La tecnologia da sola non produce inclusione. Serve un approccio integrato che metta al centro la persona, il territorio e le relazioni.",
    categoria: "innovazione-sociale",
    categoriaLabel: "Innovazione sociale",
    autore: "[Autore da definire]",
    data: "2024-06-20",
    url: "articolo.html",
    immagine: "assets/archivio-coinsieme/da-identificare/2000_gi-688ccb928978b.jpg",
    immagineAlt: "Mani di persone diverse unite in un gesto di collaborazione",
    coloreBg: "linear-gradient(135deg, rgba(42,107,74,0.85), #1f6040)"
  },
  {
    id: 3,
    titolo: "Il Manager di Domotica Assistiva: una professione del futuro",
    abstract: "Una nuova figura professionale nata dall'esigenza di integrare competenze tecniche, sociali e relazionali per accompagnare persone con disabilità.",
    categoria: "formazione-professioni",
    categoriaLabel: "Formazione e professioni",
    autore: "[Autore da definire]",
    data: "2024-03-10",
    url: "articolo.html",
    immagine: "assets/gallery_domotics_lab.jpg",
    immagineAlt: "Laboratorio dedicato alle tecnologie assistive e alla domotica",
    coloreBg: "linear-gradient(135deg, rgba(44,79,130,0.85), #1e4478)"
  },
  {
    id: 4,
    titolo: "Domotica assistiva: non solo dispositivi, ma autonomia",
    abstract: "Come un intervento di domotica assistiva cambia concretamente la vita quotidiana. Il racconto di un percorso tipo, dalla valutazione all'accompagnamento.",
    categoria: "domotica-autonomia",
    categoriaLabel: "Domotica e autonomia",
    autore: "[Autore da definire]",
    data: "2023-11-05",
    url: "articolo.html",
    immagine: "assets/domotics_assistive.jpg",
    immagineAlt: "Tecnologia domotica progettata per sostenere autonomia e vita quotidiana",
    coloreBg: "linear-gradient(135deg, rgba(123,63,0,0.85), #7b3f00)"
  },
  {
    id: 5,
    titolo: "Don Franco e la semina silenziosa dell'inclusione",
    abstract: "Un ricordo e una riflessione su chi ha contribuito a costruire la cultura dell'inclusione nel territorio, con la forza della prossimità e della visione.",
    categoria: "storie",
    categoriaLabel: "Storie",
    autore: "[Autore da definire]",
    data: "2023-04-12",
    url: "articolo.html",
    immagine: "assets/archivio-coinsieme/da-identificare/800_6a630d056d02c.jpg",
    immagineAlt: "Fotografia storica dell'archivio COINSIEME durante una celebrazione",
    coloreBg: "linear-gradient(135deg, rgba(74,55,40,0.85), #3d2810)"
  },
  {
    id: 6,
    titolo: "Legge 112/2016 Dopo di Noi: stato di attuazione e prospettive",
    abstract: "Un'analisi aggiornata dell'applicazione della legge sul Dopo di Noi, con focus sulle opportunità di co-progettazione per enti del Terzo Settore.",
    categoria: "diritti-normativa",
    categoriaLabel: "Diritti e normativa",
    autore: "[Autore da definire]",
    data: "2023-01-30",
    url: "articolo.html",
    immagine: "assets/gallery_digital_desk.jpg",
    immagineAlt: "Postazione digitale accessibile per servizi e progettazione inclusiva",
    coloreBg: "linear-gradient(135deg, rgba(26,54,93,0.85), #1a365d)"
  }
];

/* ============================================================
   UTILITIES
   ============================================================ */

function getBadgeClass(cat) {
  const map = {
    'diritti-normativa':      'badge-blu',
    'innovazione-sociale':    'badge-verde',
    'formazione-professioni': 'badge-viola',
    'domotica-autonomia':     'badge-terracotta',
    'storie':                 'badge-grigio'
  };
  return map[cat] || 'badge-grigio';
}

function formatData(str) {
  const mesi = ['gennaio','febbraio','marzo','aprile','maggio','giugno',
                 'luglio','agosto','settembre','ottobre','novembre','dicembre'];
  const d = new Date(str);
  return `${d.getDate()} ${mesi[d.getMonth()]} ${d.getFullYear()}`;
}

/* ============================================================
   GENERAZIONE CARD ARTICOLO (Fallback per pagine prototipo)
   ============================================================ */

function creaCard(a, featured = false) {
  const badge = getBadgeClass(a.categoria);
  const data  = formatData(a.data);

  if (featured) {
    return `
    <article class="article-card article-card--featured" data-categoria="${a.categoria}">
      <div class="article-card-img">
        <img src="${a.immagine}" alt="${a.immagineAlt}" width="800" height="450" loading="lazy">
      </div>
      <div class="article-card-body">
        <div style="margin-bottom:12px;">
          <span class="badge ${badge}">${a.categoriaLabel}</span>
        </div>
        <h2 style="font-size:1.45rem;margin-bottom:10px;">${a.titolo}</h2>
        <p>${a.abstract}</p>
        <div class="article-card-meta">
          <time datetime="${a.data}">${data}</time>
          <span>·</span>
          <span>di ${a.autore}</span>
        </div>
        <div style="margin-top:18px;">
          <a href="${a.url}" class="btn btn-primary btn-sm">Leggi l'articolo →</a>
        </div>
      </div>
    </article>`;
  }

  return `
  <article class="article-card" data-categoria="${a.categoria}">
    <div class="article-card-img">
      <img src="${a.immagine}" alt="${a.immagineAlt}" width="800" height="450" loading="lazy">
    </div>
    <div class="article-card-body">
      <div style="margin-bottom:8px;"><span class="badge ${badge}">${a.categoriaLabel}</span></div>
      <h3>${a.titolo}</h3>
      <p>${a.abstract}</p>
      <div class="article-card-meta">
        <time datetime="${a.data}">${data}</time>
      </div>
      <a href="${a.url}" class="btn btn-secondary btn-sm" style="margin-top:12px;">Leggi →</a>
    </div>
  </article>`;
}

/* ============================================================
   HOMEPAGE — Disattivato: build-cms.js è l'unica fonte per #home-articles
   ============================================================ */

function inizializzaArticoliHome() {
  // Disattivato per eliminare il conflitto: build-cms.js genera la sezione #home-articles
  return;
}

/* ============================================================
   ARCHIVIO — filtri e rendering
   ============================================================ */

let categoriaAttiva = 'tutti';

function renderArchivio() {
  const el = document.getElementById('archivio-grid');
  if (!el) return;
  const ordinati = [...ARTICOLI].sort((a, b) => new Date(b.data) - new Date(a.data));
  const filtrati  = categoriaAttiva === 'tutti'
    ? ordinati
    : ordinati.filter(a => a.categoria === categoriaAttiva);

  if (!filtrati.length) {
    el.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:48px 0;color:var(--grigio-testo);">Nessun articolo in questa categoria.</p>';
    return;
  }
  el.innerHTML = filtrati.map((a, i) => creaCard(a, i === 0)).join('');
}

function inizializzaFiltri() {
  const btns = document.querySelectorAll('.filtro-btn');
  if (!btns.length) return;
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      categoriaAttiva = btn.dataset.categoria;
      renderArchivio();
    });
  });
  renderArchivio();
}

/* ============================================================
   FOCUS TRAP — utility riutilizzabile
   ============================================================ */

const FOCUSABLE = 'a[href]:not([disabled]),button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function trapFocus(container, keydownHandler) {
  const getFocusable = () => [...container.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[hidden]'));

  function handler(e) {
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (!focusable.length) { e.preventDefault(); return; }
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  container.addEventListener('keydown', handler);
  return () => container.removeEventListener('keydown', handler);
}

/* ============================================================
   MENU HAMBURGER — con focus trap e gestione ESC
   ============================================================ */

function inizializzaMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  let removeTrap = null;

  const apri = () => {
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Chiudi menu di navigazione');
    removeTrap = trapFocus(menu);
    const primo = menu.querySelector('.nav-link');
    if (primo) primo.focus();
  };

  const chiudi = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Apri menu di navigazione');
    if (removeTrap) { removeTrap(); removeTrap = null; }
    toggle.focus();
  };

  toggle.addEventListener('click', () => {
    menu.classList.contains('open') ? chiudi() : apri();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) chiudi();
  });

  document.addEventListener('click', e => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) chiudi();
  });

  menu.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', chiudi));
}

/* ============================================================
   MODALE PIATTAFORMA — con focus trap e gestione ESC
   ============================================================ */

function inizializzaOverlayPiattaforma() {
  const overlay = document.getElementById('piattaforma-overlay');
  if (!overlay) return;

  let removeTrap = null;
  let triggerEl  = null;

  const apri = (from) => {
    triggerEl = from;
    overlay.removeAttribute('hidden');
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    removeTrap = trapFocus(overlay);
    const primo = overlay.querySelector('button');
    if (primo) setTimeout(() => primo.focus(), 50);
  };

  const chiudi = () => {
    overlay.classList.remove('open');
    overlay.setAttribute('hidden', '');
    overlay.setAttribute('aria-hidden', 'true');
    if (removeTrap) { removeTrap(); removeTrap = null; }
    if (triggerEl) { triggerEl.focus(); triggerEl = null; }
  };

  document.querySelectorAll('.show-platform').forEach(btn => {
    btn.addEventListener('click', () => apri(btn));
  });

  overlay.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', chiudi);
  });

  overlay.addEventListener('click', e => { if (e.target === overlay) chiudi(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) chiudi();
  });
}

/* ============================================================
   HEADER SCROLL
   ============================================================ */

function inizializzaHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const fn = () => header.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', fn, { passive: true });
  fn();
}

/* ============================================================
   SMOOTH SCROLL
   ============================================================ */

function inizializzaSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      if (!id) return;
      const el = document.getElementById(id);
      if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

/* ============================================================
   FADE IN ANIMATION
   ============================================================ */

function inizializzaFadeIn() {
  const els = document.querySelectorAll('.fade-in');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

function inizializzaElementiDimostrativi() {}

function evidenziaNavAttivo() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === 'index.html' && href === '#')) {
      link.classList.add('active');
    }
  });
}

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  inizializzaMenu();
  inizializzaHeaderScroll();
  inizializzaOverlayPiattaforma();
  inizializzaFadeIn();
  inizializzaSmoothScroll();
  inizializzaElementiDimostrativi();
  evidenziaNavAttivo();
  inizializzaArticoliHome();
  inizializzaFiltri();
});
