const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const heicConvert = require('heic-convert');

const root = path.join(__dirname, '..');
const newArticlesDir = path.join(root, 'content', 'articoli');
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
  const lines = String(markdown).replace(/\r\n?/g, '\n').split('\n');
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

    closeList();
    out.push(`<p>${renderInline(line)}</p>`);
  }

  closeList();
  return out.join('\n');
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function loadNewArticles(historicSlugs) {
  if (!fs.existsSync(newArticlesDir)) return [];
  const files = fs.readdirSync(newArticlesDir).filter((name) => name.endsWith('.json')).sort();
  const seen = new Set();

  return files.map((name) => {
    const file = path.join(newArticlesDir, name);
    const item = readJson(file);
    assert(item.title && item.title.trim(), `${name}: titolo mancante`);
    assert(item.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug), `${name}: slug non valido`);
    assert(item.summary && item.summary.trim(), `${name}: sintesi mancante`);
    assert(item.body && item.body.trim(), `${name}: testo mancante`);
    assert(!historicSlugs.has(item.slug), `${name}: slug gia usato da un articolo storico`);
    assert(!seen.has(item.slug), `${name}: slug duplicato nei nuovi articoli`);
    seen.add(item.slug);

    let image = '';
    let imageIsExternal = false;
    if (item.image) {
      const rawImage = String(item.image).trim();
      const previewOrigin = 'https://coinsieme-ets-preview.netlify.app/';
      if (rawImage.startsWith(previewOrigin)) {
        image = webpPathFor(rawImage.slice(previewOrigin.length).replace(/^\//, ''));
        assert(fs.existsSync(path.join(root, image)), `${name}: immagine non trovata: ${image}`);
      } else if (/^https:\/\//i.test(rawImage)) {
        assert(!/\.(heic|heif)(?:[?#].*)?$/i.test(rawImage), `${name}: URL HEIC esterno non convertibile; carica il file nel CMS`);
        image = rawImage;
        imageIsExternal = true;
      } else {
        image = webpPathFor(rawImage.replace(/^\//, '').replace(/\\/g, '/'));
        assert(fs.existsSync(path.join(root, image)), `${name}: immagine non trovata: ${image}`);
      }
      assert(item.image_alt && item.image_alt.trim(), `${name}: testo alternativo immagine mancante`);
    }

    return {
      title: item.title.trim(),
      slug: item.slug,
      summary: item.summary.trim(),
      body: item.body,
      author: item.author ? String(item.author).trim() : '',
      date: item.date ? String(item.date).slice(0, 10) : '',
      image,
      imageIsExternal,
      imageAlt: item.image_alt ? String(item.image_alt).trim() : ''
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

  let html = template
    .replace(/\{\{TITOLO\}\}/g, escapeHtml(item.title))
    .replace(/\{\{META_DESCRIPTION\}\}/g, escapeHtml(item.summary))
    .replace(/\{\{CANONICAL_URL\}\}/g, `https://www.coinsieme.it/articoli/${item.slug}/`)
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
  const imageAvailable = item.image && (item.imageIsExternal || fs.existsSync(path.join(root, item.image)));
  const cardImageSrc = item.imageIsExternal ? item.image : `/${item.image}`;
  const image = imageAvailable
    ? `<img src="${escapeHtml(cardImageSrc)}" alt="" class="archivio-card-image" loading="lazy" width="600" height="337">`
    : '';
  const wrapperClass = image ? 'archivio-card-content' : 'archivio-card-text-only';
  return `<a href="/articoli/${escapeHtml(item.slug)}/" class="archivio-card archivio-card-link" data-title="${escapeHtml(item.title.toLowerCase())}">
    ${image}
    <div class="${wrapperClass}">
      <div class="archivio-card-meta">Articolo</div>
      <h2 class="archivio-card-title">${title}</h2>
      <div class="archivio-card-action">Leggi l'articolo <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
    </div>
  </a>`;
}

async function main() {
  const convertedImages = await convertHeicUploads();
  const historicData = readJson(path.join(root, 'data', 'articoli.json'));
  const historic = historicData
    .filter((item) => item.indicizzabile === true)
    .filter((item) => fs.existsSync(path.join(articlesDir, item.slug, 'index.html')))
    .map((item) => ({
      title: item.titolo,
      slug: item.slug,
      image: item.immagineCopertina ? String(item.immagineCopertina).replace(/^\//, '') : ''
    }));

  const historicSlugs = new Set(historic.map((item) => item.slug));
  const fresh = loadNewArticles(historicSlugs);
  const articleTemplate = fs.readFileSync(path.join(root, 'templates', 'articolo-template.html'), 'utf8');

  for (const item of fresh) {
    const outputDir = path.join(articlesDir, item.slug);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderArticle(item, articleTemplate), 'utf8');
  }

  const allForIndex = [...historic, ...fresh].sort((a, b) => a.title.localeCompare(b.title, 'it'));
  const archiveTemplate = fs.readFileSync(path.join(root, 'templates', 'archivio-articoli-template.html'), 'utf8');
  const archiveHtml = archiveTemplate
    .replace('{{COUNT}}', String(allForIndex.length))
    .replace('{{CARDS}}', allForIndex.map(buildCard).join('\n'));
  fs.writeFileSync(path.join(root, 'articoli.html'), archiveHtml, 'utf8');

  console.log(`Build CMS completata: ${historic.length} articoli storici, ${fresh.length} nuovi articoli, ${allForIndex.length} card, ${convertedImages} HEIC/HEIF convertiti in WebP.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
