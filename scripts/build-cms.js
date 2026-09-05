
const monthsMap = {
  gennaio: '01', febbraio: '02', marzo: '03', aprile: '04', maggio: '05', giugno: '06',
  luglio: '07', agosto: '08', settembre: '09', ottobre: '10', novembre: '11', dicembre: '12'
};

function parseArticleDate(item) {
  if (item.date && /^\d{4}-\d{2}-\d{2}/.test(String(item.date).trim())) {
    return String(item.date).trim().slice(0, 10);
  }
  if (item.data && /^\d{4}-\d{2}-\d{2}/.test(String(item.data).trim())) {
    return String(item.data).trim().slice(0, 10);
  }
  const text = (item.sintesi || '') + ' ' + (item.corpoHtml || '');
  const match = text.match(/\b(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})\b/i);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = monthsMap[match[2].toLowerCase()];
    const year = match[3];
    if (month) return year + '-' + month + '-' + day;
  }
  return '2024-01-01';
}

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const heicConvert = require('heic-convert');

const root = path.join(__dirname, '..');
const newArticlesDir = path.join(root, 'content', 'articoli');
const rassegnaFile = path.join(root, 'content', 'rassegna', 'notizie-esterne.json');
const articlesDir = path.join(root, 'articoli');
const uploadsDir = path.join(root, 'assets', 'uploads');

function webpPathFor(imagePath) {
  return imagePath.replace(/\.(heic|heif)$/i, '.webp');
}

async function convertHeicUploads() {
  if (!fs.existsSync(uploadsDir)) return 0;
  const files = fs.readdirSync(uploadsDir).filter((name) => /\.(heic|heif)$/i.test(name));
  for (const name of files) {
    const source = path.join(uploadsDir, name);
    const destination = path.join(uploadsDir, webpPathFor(name));
    const jpegBuffer = await heicConvert({
      buffer: fs.readFileSync(source),
      format: 'JPEG',
      quality: 0.92
    });
    await sharp(jpegBuffer)
      .rotate()
      .webp({ quality: 82, effort: 4 })
      .toFile(destination);
  }
  return files.length;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderInline(value) {
  let text = escapeHtml(value);
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return text;
}

function markdownToHtml(markdown = '') {
  const trimmed = String(markdown).trim();
  if (/^<[a-z0-9]+/i.test(trimmed)) {
    return trimmed;
  }

  const lines = trimmed.replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let list = null;

  const closeList = () => {
    if (list) out.push(`</${list}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{2,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (list !== 'ul') {
        closeList();
        list = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${renderInline(unordered[1])}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (list !== 'ol') {
        closeList();
        list = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${renderInline(ordered[1])}</li>`);
      continue;
    }

    const quote = line.match(/^>\s+(.+)$/);
    if (quote) {
      closeList();
      out.push(`<blockquote>${renderInline(quote[1])}</blockquote>`);
      continue;
    }

    closeList();
    out.push(`<p>${renderInline(line)}</p>`);
  }

  closeList();
  return out.join('\n');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadAllArticles() {
  if (!fs.existsSync(newArticlesDir)) return [];
  const files = fs.readdirSync(newArticlesDir).filter((name) => name.endsWith('.json')).sort();
  const seen = new Set();

  return files.map((name) => {
    const file = path.join(newArticlesDir, name);
    const item = readJson(file);
    assert(item.title && item.title.trim(), `${name}: titolo mancante`);
    
    // Auto-generate slug from title if omitted or empty
    let slug = item.slug ? item.slug.trim() : '';
    if (!slug) {
      slug = item.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    assert(slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug), `${name}: slug non valido (${slug})`);
    assert(item.summary && item.summary.trim(), `${name}: sintesi mancante`);
    assert(item.body && item.body.trim(), `${name}: testo mancante`);
    assert(!seen.has(slug), `${name}: slug duplicato (${slug})`);
    seen.add(slug);

    let image = '';
    let imageIsExternal = false;
    if (item.image) {
      const rawImage = String(item.image).trim();
      const previewOrigin = 'https://coinsieme-ets-preview.netlify.app/';
      if (rawImage.startsWith(previewOrigin)) {
        image = webpPathFor(rawImage.slice(previewOrigin.length).replace(/^\//, ''));
      } else if (/^https?:\/\//i.test(rawImage)) {
        image = rawImage;
        imageIsExternal = true;
      } else {
        image = webpPathFor(rawImage.replace(/^\//, '').replace(/\\/g, '/'));
      }
      if (!imageIsExternal && !fs.existsSync(path.join(root, image))) {
        image = '';
      }
    }

    const articleDate = parseArticleDate(item);

    return {
      title: item.title.trim(),
      slug,
      category: item.category ? String(item.category).trim() : 'Articolo',
      contentType: item.content_type ? String(item.content_type).trim() : 'approfondimento',
      summary: item.summary.trim(),
      body: item.body,
      author: item.author ? String(item.author).trim() : '',
      date: articleDate,
      image,
      imageIsExternal,
      imageAlt: item.image_alt ? String(item.image_alt).trim() : (image ? `Immagine per: ${item.title.trim()}` : ''),
      image_position: item.image_position ? String(item.image_position).trim() : (item.imagePosition ? String(item.imagePosition).trim() : ''),
      social_title: item.social_title ? String(item.social_title).trim() : '',
      social_description: item.social_description ? String(item.social_description).trim() : '',
      home_summary: item.home_summary ? String(item.home_summary).trim() : ''
    };
  });
}

function renderArticle(item, template) {
  const bodyHtml = markdownToHtml(item.body);
  const words = item.body.trim().split(/\s+/).length;
  const readingMinutes = Math.max(1, Math.ceil(words / 220));
  const authorHtml = item.author
    ? `<span>di <strong style="color:var(--marrone);">${escapeHtml(item.author)}</strong></span><span aria-hidden="true">·</span>`
    : '';
  const dateHtml = item.date
    ? `<time datetime="${escapeHtml(item.date)}">${new Date(`${item.date}T12:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time><span aria-hidden="true">·</span>`
    : '';
  const imageSrc = item.imageIsExternal ? item.image : `../../${item.image}`;
  const imageHtml = item.image
    ? `<figure style="margin:0 0 40px;"><img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.imageAlt)}" style="width:100%; height:auto; border-radius:var(--radius-lg);" loading="lazy"></figure>`
    : '';

  const canonicalUrl = `https://www.coinsieme.it/articoli/${item.slug}/`;
  const ogTitle = item.social_title || `${item.title} — Fondazione COINSIEME ETS`;
  const ogDescription = item.social_description || item.summary;
  const ogImage = item.image
    ? (item.imageIsExternal ? item.image : `https://www.coinsieme.it/${item.image.replace(/^\/+/, '')}`)
    : 'https://www.coinsieme.it/assets/hero_inclusion.jpg';
  const encodedCanonicalUrl = encodeURIComponent(canonicalUrl);
  const encodedTitle = encodeURIComponent(`Articolo COINSIEME: ${item.title}`);
  const encodedBody = encodeURIComponent(`Ti condivido questo articolo di Fondazione COINSIEME ETS:\n"${item.title}"\n\n${canonicalUrl}`);

  let html = template
    .replace(/\{\{TITOLO\}\}/g, escapeHtml(item.title))
    .replace(/\{\{META_DESCRIPTION\}\}/g, escapeHtml(item.summary))
    .replace(/\{\{OG_TITLE\}\}/g, escapeHtml(ogTitle))
    .replace(/\{\{OG_DESCRIPTION\}\}/g, escapeHtml(ogDescription))
    .replace(/\{\{CANONICAL_URL\}\}/g, canonicalUrl)
    .replace(/\{\{OG_IMAGE\}\}/g, escapeHtml(ogImage))
    .replace(/\{\{ENCODED_CANONICAL_URL\}\}/g, encodedCanonicalUrl)
    .replace(/\{\{ENCODED_TITLE\}\}/g, encodedTitle)
    .replace(/\{\{ENCODED_BODY\}\}/g, encodedBody)
    .replace(/\{\{AUTORE_HTML\}\}/g, authorHtml)
    .replace(/\{\{DATA_HTML\}\}/g, dateHtml)
    .replace(/\{\{TEMPO_LETTURA\}\}/g, String(readingMinutes))
    .replace(/\{\{IMMAGINE_HTML\}\}/g, imageHtml)
    .replace(/\{\{CORPO_HTML\}\}/g, bodyHtml)
    .replace(/\{\{SCHEMA_AUTORE\}\}/g, item.author ? `"author": { "@type": "Person", "name": ${JSON.stringify(item.author)} },` : '')
    .replace(/\{\{SCHEMA_DATA\}\}/g, item.date ? `"datePublished": ${JSON.stringify(item.date)},` : '');

  assert(!/\{\{[A-Z_]+\}\}/.test(html), `${item.slug}: segnaposto template residuo`);
  return html;
}

function buildCard(item) {
  const title = escapeHtml(item.title);
  const category = escapeHtml(item.category || 'Articolo');
  const imageType = item.imageType || (item.image ? 'photo' : 'text');
  const imageAvailable = item.image && (item.imageIsExternal || fs.existsSync(path.join(root, item.image)));
  const cardImageSrc = item.imageIsExternal ? item.image : `/${item.image}`;

  let topVisual = '';
  if (imageType === 'document' && imageAvailable) {
    topVisual = `<div class="archivio-card-image-wrap archivio-card-doc-wrap">
      <img src="${escapeHtml(cardImageSrc)}" alt="${title}" class="archivio-card-image-doc" loading="lazy" width="600" height="337">
    </div>`;
  } else if (imageType === 'photo' && imageAvailable) {
    topVisual = `<div class="archivio-card-image-wrap">
      <img src="${escapeHtml(cardImageSrc)}" alt="${title}" class="archivio-card-image" loading="lazy" width="600" height="337">
    </div>`;
  } else if (imageType === 'graphic') {
    topVisual = `<div class="archivio-card-graphic-wrap" aria-hidden="true">
      <div class="archivio-card-graphic-circle">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      </div>
    </div>`;
  }

  const wrapperClass = topVisual ? 'archivio-card-content' : 'archivio-card-text-only';
  return `<a href="/articoli/${escapeHtml(item.slug)}/" class="archivio-card archivio-card-link" data-title="${escapeHtml(item.title.toLowerCase())}">
    ${topVisual}
    <div class="${wrapperClass}">
      <div class="archivio-card-meta">${category}</div>
      <h2 class="archivio-card-title">${title}</h2>
      <div class="archivio-card-action">Leggi l'articolo <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
    </div>
  </a>`;
}

function buildHomeSection(items) {
  if (!items || items.length === 0) {
    return '<p style="color:var(--grigio-testo);">Nessun articolo disponibile.</p>';
  }

  const primary = items[0];
  const secondaries = items.slice(1, 3);

  const primaryImageSrc = primary.image ? (primary.imageIsExternal ? primary.image : `/${primary.image}`) : '';
  const primaryImgPos = primary.image_position || primary.imagePosition || 'center 20%';
  const primaryImageHtml = primaryImageSrc
    ? `<div class="conoscenza-featured-img-wrap"><img src="${escapeHtml(primaryImageSrc)}" alt="${escapeHtml(primary.imageAlt || '')}" class="conoscenza-featured-img" style="object-position: ${escapeHtml(primaryImgPos)};" width="800" height="450" loading="lazy"></div>`
    : '';

  const primaryDateHtml = primary.date
    ? `<time datetime="${escapeHtml(primary.date)}">${new Date(`${primary.date}T12:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time>`
    : '';
  const primaryAuthorHtml = primary.author ? `<span>di ${escapeHtml(primary.author)}</span>` : '';
  const primaryMetaSep = primaryDateHtml && primaryAuthorHtml ? '<span aria-hidden="true">·</span>' : '';
  const primaryCategory = escapeHtml(primary.category || primary.contentType || 'Conoscenza');
  const primarySummary = primary.home_summary || primary.summary;

  const primaryHtml = `<article class="conoscenza-featured-card">
    ${primaryImageHtml}
    <div class="conoscenza-featured-body">
      <div style="margin-bottom:8px;"><span class="badge badge-terracotta" style="font-size:0.75rem;">${primaryCategory}</span></div>
      <h3 style="font-size:1.3rem; color:var(--marrone-scuro); font-weight:700; line-height:1.3; margin-bottom:8px;">${escapeHtml(primary.title)}</h3>
      <p style="font-size:0.95rem; color:var(--grigio-testo); line-height:1.5; margin-bottom:14px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(primarySummary)}</p>
      <div class="article-card-meta" style="font-size:0.85rem; margin-bottom:16px;">${primaryDateHtml}${primaryMetaSep}${primaryAuthorHtml}</div>
      <div style="margin-top:auto;"><a href="/articoli/${escapeHtml(primary.slug)}/" class="btn btn-terracotta" style="display:inline-flex; width:fit-content; align-items:center; gap:6px; padding:8px 18px; font-weight:600; text-decoration:none; border-radius:6px; font-size:0.88rem;">Leggi l'articolo <span aria-hidden="true">→</span></a></div>
    </div>
  </article>`;

  if (secondaries.length === 0) {
    return `<div class="conoscenza-asymmetric-grid" style="grid-template-columns: 1fr;">${primaryHtml}</div>`;
  }

  const secondariesHtml = secondaries.map((sec) => {
    const secImageSrc = sec.image ? (sec.imageIsExternal ? sec.image : `/${sec.image}`) : '';
    const secThumbHtml = secImageSrc
      ? `<img src="${escapeHtml(secImageSrc)}" alt="" class="conoscenza-compact-thumb" width="80" height="64" loading="lazy">`
      : '';
    const secDateHtml = sec.date
      ? `<time datetime="${escapeHtml(sec.date)}">${new Date(`${sec.date}T12:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}</time>`
      : '';
    const secCategory = escapeHtml(sec.category || sec.contentType || 'Approfondimento');

    return `<article class="conoscenza-compact-card">
      ${secThumbHtml}
      <div class="conoscenza-compact-body">
        <div style="margin-bottom:4px;"><span class="badge badge-subtle" style="font-size:0.72rem; background:var(--crema-chiara); color:var(--terracotta); border:1px solid var(--grigio-bordino); border-radius:4px; padding:1px 6px; font-weight:600;">${secCategory}</span></div>
        <h4 style="font-size:0.95rem; font-weight:700; color:var(--marrone-scuro); margin-bottom:6px; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(sec.title)}</h4>
        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.8rem; color:var(--grigio-testo); margin-top:auto;">
          ${secDateHtml}
          <a href="/articoli/${escapeHtml(sec.slug)}/" style="font-weight:600; color:var(--terracotta); text-decoration:none; display:inline-flex; align-items:center; gap:3px; margin-left:auto;">Leggi <span aria-hidden="true">→</span></a>
        </div>
      </div>
    </article>`;
  }).join('\n');

  return `<div class="conoscenza-asymmetric-grid">
    ${primaryHtml}
    <div class="conoscenza-secondary-column">
      ${secondariesHtml}
    </div>
  </div>`;
}

const ALLOWED_RASSEGNA_STATI = new Set(['da_verificare', 'proposta', 'approvata', 'scartata', 'archiviata']);

function formatDateIt(dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(String(dateStr).trim())) {
    return dateStr || '';
  }
  const clean = String(dateStr).trim().slice(0, 10);
  return new Date(`${clean}T12:00:00Z`).toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

function loadRassegnaNews() {
  if (!fs.existsSync(rassegnaFile)) return [];
  const raw = readJson(rassegnaFile);
  assert(Array.isArray(raw), 'content/rassegna/notizie-esterne.json deve contenere un array.');

  return raw.map((item, idx) => {
    const stato = (item.stato || 'da_verificare').trim();
    assert(ALLOWED_RASSEGNA_STATI.has(stato), `Notizia rassegna #${idx + 1} (${item.id || item.titolo_editoriale || 'senza id'}): stato "${stato}" non valido. Valori ammessi: ${[...ALLOWED_RASSEGNA_STATI].join(', ')}`);
    return {
      id: item.id ? String(item.id).trim() : `notizia-${idx + 1}`,
      categoria: item.categoria ? String(item.categoria).trim() : 'Welfare',
      data_fonte: item.data_fonte ? String(item.data_fonte).trim() : '',
      titolo_originale: item.titolo_originale ? String(item.titolo_originale).trim() : '',
      titolo_editoriale: item.titolo_editoriale ? String(item.titolo_editoriale).trim() : (item.titolo_originale ? String(item.titolo_originale).trim() : ''),
      fonte: item.fonte ? String(item.fonte).trim() : 'Fonte esterna',
      url_fonte: item.url_fonte ? String(item.url_fonte).trim() : '#',
      sintesi_editoriale: item.sintesi_editoriale ? String(item.sintesi_editoriale).trim() : '',
      rilevanza_coinsieme: item.rilevanza_coinsieme ? String(item.rilevanza_coinsieme).trim() : '',
      stato
    };
  });
}

function buildRassegnaSection(items) {
  const approved = items
    .filter((item) => item.stato === 'approvata')
    .sort((a, b) => (b.data_fonte || '').localeCompare(a.data_fonte || ''))
    .slice(0, 3);

  if (approved.length === 0) {
    return `<section id="cosa-si-muove" class="rassegna-section" aria-labelledby="rassegna-titolo" style="display: none;" aria-hidden="true">
    <div class="container">
      <div class="rassegna-header">
        <div style="max-width: 780px;">
          <p class="section-tag" style="color: var(--terracotta); font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; font-size: 0.85rem; margin-bottom: 8px;">Osservatorio &amp; Contesto</p>
          <h2 id="rassegna-titolo" class="rassegna-title">Cosa si muove intorno a noi</h2>
          <p class="rassegna-subtitle">
            Notizie e aggiornamenti selezionati su disabilità, Terzo Settore, cooperazione sociale e cambiamenti del welfare.
          </p>
        </div>
      </div>
      <div class="rassegna-grid" role="list" aria-label="Notizie selezionate dal Terzo Settore e dal welfare">
      </div>
    </div>
  </section>`;
  }

  const cardsHtml = approved.map((item) => {
    const formattedDate = formatDateIt(item.data_fonte);
    const dateHtml = item.data_fonte
      ? `<time class="rassegna-card-date" datetime="${escapeHtml(item.data_fonte)}">${escapeHtml(formattedDate)}</time>`
      : '';
    const title = escapeHtml(item.titolo_editoriale || item.titolo_originale);
    const category = escapeHtml(item.categoria);
    const summary = escapeHtml(item.sintesi_editoriale);
    const source = escapeHtml(item.fonte);
    const url = escapeHtml(item.url_fonte);

    return `        <article class="rassegna-card" role="listitem">
          <div class="rassegna-card-meta">
            <span class="rassegna-card-category">${category}</span>
            ${dateHtml}
          </div>
          <h3 class="rassegna-card-title">
            <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>
          </h3>
          <p class="rassegna-card-summary">${summary}</p>
          <div class="rassegna-card-footer">
            <span class="rassegna-card-source">Fonte: <strong>${source}</strong></span>
            <a href="${url}" class="rassegna-card-link" target="_blank" rel="noopener noreferrer">
              Leggi sulla fonte <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg><span class="sr-only">(apre in una nuova scheda)</span>
            </a>
          </div>
        </article>`;
  }).join('\n');

  return `<section id="cosa-si-muove" class="rassegna-section bg-crema-chiara" aria-labelledby="rassegna-titolo">
    <div class="container">
      <div class="rassegna-header">
        <div style="max-width: 780px;">
          <p class="section-tag" style="color: var(--terracotta); font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; font-size: 0.85rem; margin-bottom: 8px;">Osservatorio &amp; Contesto</p>
          <h2 id="rassegna-titolo" class="rassegna-title">Cosa si muove intorno a noi</h2>
          <p class="rassegna-subtitle">
            Notizie e aggiornamenti selezionati su disabilità, Terzo Settore, cooperazione sociale e cambiamenti del welfare.
          </p>
        </div>
      </div>
      <div class="rassegna-grid" role="list" aria-label="Notizie selezionate dal Terzo Settore e dal welfare">
${cardsHtml}
      </div>
    </div>
  </section>`;
}

function buildTopNewsBar(items) {
  const approved = (items || [])
    .filter((item) => item.stato === 'approvata')
    .sort((a, b) => (b.data_fonte || '').localeCompare(a.data_fonte || ''));

  if (approved.length === 0) {
    return `<aside id="top-news-bar" class="top-news-bar" aria-label="Notizia in evidenza" style="display: none;" aria-hidden="true"></aside>`;
  }

  const latest = approved[0];
  const title = escapeHtml(latest.titolo_editoriale || latest.titolo_originale);
  const url = escapeHtml(latest.url_fonte || '#');
  const newsId = escapeHtml(latest.id || 'ultima-notizia');

  return `<aside id="top-news-bar" class="top-news-bar" aria-label="Notizia in evidenza">
  <div class="container top-news-container">
    <div class="top-news-content">
      <span class="top-news-badge">IN EVIDENZA OGGI</span>
      <p class="top-news-title">${title}</p>
      <a href="${url}" class="top-news-link" target="_blank" rel="noopener noreferrer">
        Leggi l'aggiornamento <span aria-hidden="true">→</span>
        <span class="sr-only">(apre in una nuova scheda)</span>
      </a>
    </div>
    <button type="button" class="top-news-close" aria-label="Chiudi notizia in evidenza" onclick="dismissTopNews('${newsId}')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
</aside>
<script>
  (function() {
    var newsId = '${newsId}';
    if (newsId && sessionStorage.getItem('coinsieme_dismiss_news_' + newsId) === 'true') {
      var bar = document.getElementById('top-news-bar');
      if (bar) bar.style.display = 'none';
    }
  })();
  function dismissTopNews(newsId) {
    var bar = document.getElementById('top-news-bar');
    if (bar) bar.style.display = 'none';
    if (newsId) sessionStorage.setItem('coinsieme_dismiss_news_' + newsId, 'true');
  }
</script>`;
}

async function main() {
  const convertedImages = await convertHeicUploads();
  const allArticles = loadAllArticles();
  const articleTemplate = fs.readFileSync(path.join(root, 'templates', 'articolo-template.html'), 'utf8');

  for (const item of allArticles) {
    const outputDir = path.join(articlesDir, item.slug);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderArticle(item, articleTemplate), 'utf8');
  }

  const allForIndex = allArticles.map((item) => ({
    title: item.title,
    slug: item.slug,
    category: item.category || 'Articolo',
    image: item.image ? String(item.image).replace(/^\//, '') : '',
    imageType: item.image ? 'photo' : 'text'
  })).sort((a, b) => a.title.localeCompare(b.title, 'it'));

  const archiveTemplate = fs.readFileSync(path.join(root, 'templates', 'archivio-articoli-template.html'), 'utf8');
  const archiveHtml = archiveTemplate
    .replace('{{COUNT}}', String(allForIndex.length))
    .replace('{{CARDS}}', allForIndex.map(buildCard).join('\n'));
  fs.writeFileSync(path.join(root, 'articoli.html'), archiveHtml, 'utf8');

  // Unified chronological sorting across ALL articles
  const allArticlesForHome = [...allArticles].sort(
    (a, b) => (b.date || '').localeCompare(a.date || '') || a.title.localeCompare(b.title, 'it')
  );

  const latest = allArticlesForHome.slice(0, 3);
  const latestHtml = buildHomeSection(latest);
  const homepagePath = path.join(root, 'index.html');
  const homepage = fs.readFileSync(homepagePath, 'utf8');
  const homepageWithArticles = homepage.replace(
    /(<!-- CMS_ULTIMI_ARTICOLI_START -->)[\s\S]*?(<!-- CMS_ULTIMI_ARTICOLI_END -->)/,
    `$1\n${latestHtml}\n        $2`
  );
  assert(homepageWithArticles !== homepage || homepage.includes(latestHtml), 'Homepage: marcatori ultimi articoli mancanti');

  // Rassegna News processing
  const rassegnaItems = loadRassegnaNews();
  const approvedRassegna = rassegnaItems.filter((i) => i.stato === 'approvata');
  const rassegnaSectionHtml = buildRassegnaSection(rassegnaItems);
  const topNewsBarHtml = buildTopNewsBar(rassegnaItems);

  const homepageWithRassegna = homepageWithArticles.replace(
    /(<!-- CMS_RASSEGNA_SECTION_START -->)[\s\S]*?(<!-- CMS_RASSEGNA_SECTION_END -->)/,
    `$1\n  ${rassegnaSectionHtml}\n  $2`
  );
  assert(homepageWithRassegna !== homepageWithArticles || homepageWithArticles.includes(rassegnaSectionHtml), 'Homepage: marcatori rassegna news mancanti');

  const homepageUpdated = homepageWithRassegna.replace(
    /(<!-- CMS_ULTIMA_NOTIZIA_START -->)[\s\S]*?(<!-- CMS_ULTIMA_NOTIZIA_END -->)/,
    `$1\n${topNewsBarHtml}\n$2`
  );
  assert(homepageUpdated !== homepageWithRassegna || homepageWithRassegna.includes(topNewsBarHtml), 'Homepage: marcatori ultima notizia mancanti');

  fs.writeFileSync(homepagePath, homepageUpdated, 'utf8');

  console.log(`Build CMS completata: ${allArticles.length} articoli interni in content/articoli/, ${allForIndex.length} card nell'archivio, ${latest.length} articoli in homepage, ${rassegnaItems.length} notizie rassegna registrate (${approvedRassegna.length} approvate/online), ${convertedImages} HEIC/HEIF convertiti in WebP.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

