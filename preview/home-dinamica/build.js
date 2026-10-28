'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {validDate,eligible}=require('./selection');
const {isUsefulNews,usefulBadge}=require('../../scripts/news-kind');
const root=path.resolve(__dirname,'../..'),origin='https://www.coinsieme.it';
const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=s=>new Date(s+'T12:00:00Z').toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
const slug=x=>x.slug||x.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const plain=s=>String(s||'').replace(/&laquo;/g,'«').replace(/&raquo;/g,'»').replace(/&amp;/g,'&').replace(/&#0?39;/g,"'").replace(/&quot;/g,'"');
const short=s=>{const t=plain(s).replace(/\s+/g,' ').trim();return t.length>220?t.slice(0,217).replace(/\s+\S*$/,'')+'…':t;};
function localImage(url){if(!url||!url.startsWith('/assets/')||url.includes('..'))return '';return fs.existsSync(path.join(root,url))?url:'';}
async function build({withoutImages=false,outputDir=__dirname,articlesInput,newsInput,production=false,state,sourceHtml,today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome'}).format(new Date())}={}){
  const snapshotFile=path.join(root,'scratch/home-preview-publication.json');
  let snapshot;
  if(articlesInput){
    snapshot={checkedAt:new Date().toISOString(),publishedUrls:articlesInput.filter(x=>x.visible!==false).map(x=>'/articoli/'+slug(x)+'/')};
  }else if(process.argv.includes('--refresh')){
    const pages=await Promise.all(['/','/articoli.html'].map(async p=>{const r=await fetch(origin+p);if(!r.ok)throw Error(p+': HTTP '+r.status);return r.text();}));
    // Only links in the published home/archive establish publication; a local JSON alone does not.
    const urls=new Set();for(const html of pages)for(const m of html.matchAll(/href=["']([^"']+)["']/g)){try{const u=new URL(m[1],origin);if(u.origin===origin&&/^\/articoli\/[a-z0-9-]+\/$/.test(u.pathname))urls.add(u.pathname);}catch{}}
    if(!urls.size)throw Error('Nessun articolo pubblico verificabile');
    snapshot={checkedAt:new Date().toISOString(),publishedUrls:[...urls]};
    fs.mkdirSync(path.dirname(snapshotFile),{recursive:true});fs.writeFileSync(snapshotFile,JSON.stringify(snapshot,null,2));
  }else{
    if(!fs.existsSync(snapshotFile))throw Error('Eseguire build.js --refresh per verificare gli articoli pubblici');
    snapshot=JSON.parse(fs.readFileSync(snapshotFile,'utf8'));
  }
  const articleRecords=articlesInput||fs.readdirSync(path.join(root,'content/articoli')).filter(n=>n.endsWith('.json')).map(name=>JSON.parse(fs.readFileSync(path.join(root,'content/articoli',name),'utf8').replace(/^\uFEFF/,'')));
  const {normalize,select}=require('../../scripts/homepage-state');
  const rawModel=normalize(articleRecords.map(x=>({...x,visible:snapshot.publishedUrls.includes('/articoli/'+slug(x)+'/')&&x.visible!==false})),newsInput||JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/notizie-esterne.json'),'utf8')),today);
  const articles=rawModel.articles.map(x=>({...x,title:plain(x.title),summary:short(x.summary),image:localImage(x.image)}));
  const cache=JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/source-image-cache.json'),'utf8'));
  const news=rawModel.news.map(x=>{
    const known=cache[x.url],cached=localImage(known?.local);
    const verifiedCache=cached&&crypto.createHash('sha256').update(fs.readFileSync(path.join(root,cached))).digest('hex')===known.hash?cached:'';
    const image=localImage(x.image)||verifiedCache;
    return {...x,title:plain(x.title),summary:short(x.summary),image};
  }).filter(x=>/^https?:\/\//.test(x.url));
  const all=[...articles,...news];
  if(withoutImages)for(const item of all)item.image='';
  const selected=select({articles,news},today);
  const cover=selected.cover||{id:'nessun-contenuto',kind:'empty',title:'Informazioni per vivere meglio, insieme',summary:'Casa e servizi restano disponibili. I contenuti editoriali saranno visibili dopo la pubblicazione.',url:'/articoli.html',image:'',date:'',reason:'COINSIEME'};
  const recentArticles=selected.articles;
  const recentNews=selected.news;
  const media=path.join(outputDir,'media');fs.mkdirSync(media,{recursive:true});
  async function picture(x,hero=false){
    if(!x.image)return '';
    try {
    const buffer=fs.readFileSync(path.join(root,x.image));
    const key=crypto.createHash('sha256').update(buffer).digest('hex').slice(0,16);
    const sharp=require('sharp'),sizes=hero?[480,1120]:[480];
    for(const width of sizes){const f=path.join(media,key+'-'+width+'.webp');if(!fs.existsSync(f))await sharp(buffer).rotate().resize({width,withoutEnlargement:true}).webp({quality:80}).toFile(f);}
    return `<img src="media/${key}-${sizes[0]}.webp" ${hero?`srcset="media/${key}-480.webp 480w, media/${key}-1120.webp 1120w" sizes="(max-width: 760px) 100vw, 65vw" fetchpriority="high"`:'loading="lazy"'} width="1120" height="630" alt="${escape(x.alt)}" style="object-position:${escape(x.position)}" decoding="async">`;
    } catch(error) {
      console.warn('Immagine non utilizzabile, resa testuale:',x.id,error.message);
      return '';
    }
  }
  const current=sourceHtml||fs.readFileSync(path.join(root,'index.html'),'utf8');
  const absolute=html=>html.replace(/(href|src)="(?!\/|#|https?:|mailto:|tel:)([^" ]+)/g,'$1="/$2');
  const header=absolute(current.match(/<header class="site-header"[\s\S]*?<\/header>/)[0]);
  const footer=absolute(current.match(/<footer class="site-footer"[\s\S]*?<\/footer>/)[0]).replace(/<a\b(?=[^>]*\bclass="[^"]*\biubenda-cs-preferences-link\b[^"]*")[^>]*>[\s\S]*?<\/a>/g,'');
  const project=`<div id="progetto" class="project-overview">
    <article class="project-entry" aria-labelledby="project-autonomia"><p class="project-phase">Attività informativa · sviluppo tecnologico</p><a class="project-destination" href="/domotica.html" aria-labelledby="project-autonomia"><figure class="project-media"><img src="/assets/home-progetti/domotica-800.webp" srcset="/assets/home-progetti/domotica-400.webp 400w, /assets/home-progetti/domotica-800.webp 800w" sizes="(max-width:760px) calc(100vw - 32px), (max-width:1280px) 46vw, 590px" width="800" height="450" loading="lazy" decoding="async" alt="Serratura elettronica con comando da smartphone"><figcaption>Immagine tecnica di esempio già utilizzata nel sito.</figcaption></figure><h3 id="project-autonomia">Domotica assistiva e autonomia</h3><span class="project-more" aria-hidden="true">Approfondisci →</span></a><p>Informazioni e orientamento sulle tecnologie per l’abitare autonomo. La Casa interattiva presenta ausili e adattamenti domestici. L’eventuale supporto personalizzato va concordato con la Fondazione, verificandone disponibilità e modalità.</p></article>
    <article class="project-entry" aria-labelledby="project-turismo"><p class="project-phase">Patrimonio storico CO.IN.</p><a class="project-destination" href="/pubblicazioni.html#pub-storico-titolo" aria-labelledby="project-turismo"><figure class="project-media"><img src="/assets/home-progetti/turismo-800.webp" srcset="/assets/home-progetti/turismo-400.webp 400w, /assets/home-progetti/turismo-800.webp 800w" sizes="(max-width:760px) calc(100vw - 32px), (max-width:1280px) 46vw, 590px" width="800" height="450" loading="lazy" decoding="async" alt="Copertina della guida Lazio, una guida per tutti"><figcaption>Guida del 2003 · CO.IN. Cooperative Integrate Onlus.</figcaption></figure><h3 id="project-turismo">Turismo per tutti</h3><span class="project-more" aria-hidden="true">Approfondisci →</span></a><p>Guide, ricerche e strumenti per l’accoglienza accessibile realizzati da CO.IN. e dai soggetti della sua rete. Un patrimonio storico documentato, distinto dalle attività attuali della Fondazione.</p></article>
    <article class="project-entry" aria-labelledby="project-formazione"><p class="project-phase">Materiali storici · proposte in studio</p><a class="project-destination" href="/formazione.html" aria-labelledby="project-formazione"><figure class="project-media"><img src="/assets/home-progetti/formazione-800.webp" srcset="/assets/home-progetti/formazione-400.webp 400w, /assets/home-progetti/formazione-800.webp 800w" sizes="(max-width:760px) calc(100vw - 32px), (max-width:1280px) 46vw, 590px" width="800" height="450" loading="lazy" decoding="async" alt="Copertina del manuale Qualità nell’accoglienza turistica di clienti con bisogni speciali"><figcaption>Manuale del 1998 · CO.IN., progetto Italia per Tutti.</figcaption></figure><h3 id="project-formazione">Formazione e nuove competenze</h3><span class="project-more" aria-hidden="true">Approfondisci →</span></a><p>Manuali e materiali per gli operatori, realizzati nel percorso CO.IN., documentano l’esperienza formativa. Le nuove proposte COINSIEME sono in studio: corsi non attivi e iscrizioni non aperte.</p></article>
    <article class="project-entry" aria-labelledby="progetto-titolo"><p class="project-phase">Candidatura in valutazione</p><a class="project-destination" href="/domotica.html" aria-labelledby="progetto-titolo"><figure class="project-media"><img src="/assets/home-progetti/trilogia-800.webp" srcset="/assets/home-progetti/trilogia-400.webp 400w, /assets/home-progetti/trilogia-800.webp 800w" sizes="(max-width:760px) calc(100vw - 32px), (max-width:1280px) 46vw, 590px" width="800" height="450" loading="lazy" decoding="async" alt="Illustrazione di un gruppo al lavoro su una pianta della casa"><figcaption>Illustrazione IA: non documenta attività avviate del progetto.</figcaption></figure><h3 id="progetto-titolo">Trilogia di Vita</h3><span class="project-more" aria-hidden="true">Approfondisci →</span></a><p>Proposta candidata e ancora in valutazione, con Fondazione Make4Work ETS capofila e COINSIEME partner per la domotica assistiva. Non è un progetto finanziato o avviato.</p></article>
  </div>`;
  const external=x=>x.kind==='news'&&!isUsefulNews(x)?' target="_blank" rel="noopener noreferrer"':'';
  const meta=x=>(isUsefulNews(x)?usefulBadge+'<p class="meta">A cura di Fondazione COINSIEME ETS</p>':'')+(validDate(x.date)?`<p class="meta"><span>${escape(x.kind==='article'?'COINSIEME · '+x.category:x.source)}</span><span>${x.kind==='news'&&!isUsefulNews(x)?'Fonte: ':''}<time datetime="${x.date}">${date(x.date)}</time></span></p>`:'');
  const articleCards=await Promise.all(recentArticles.map(async x=>`<article class="editorial-row">${await picture(x)}<div>${meta(x)}<h3><a href="${escape(x.url)}">${escape(x.title)}</a></h3><p>${escape(x.summary)}</p><a class="read" href="${escape(x.url)}">Leggi l’approfondimento <span aria-hidden="true">→</span></a></div></article>`));
  const homeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/></svg>';
  const serviceIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 22s8-8 8-14a8 8 0 1 0-16 0c0 6 8 14 8 14Z"/><circle cx="12" cy="8" r="2.5"/></svg>';
  let html=`<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>COINSIEME — Attualità, Casa e servizi · Anteprima</title><link rel="stylesheet" href="/css/style.css"><link rel="stylesheet" href="style.css"></head><body><a class="skip-link" href="#main-content">Vai al contenuto principale</a><div class="preview-label">Anteprima locale · Proposta di homepage · Nessuna modifica al sito pubblico</div>${header}
  <main id="main-content"><div class="container introduction"><div><p class="eyebrow">Fondazione COINSIEME ETS</p><h1>Attualità, Casa e servizi</h1></div><a href="/chi-siamo.html">Conosci la Fondazione <span aria-hidden="true">→</span></a></div>
  <section class="container opening" aria-label="Attualità, Casa e servizi"><article class="cover" data-cover="${escape(cover.id)}">${await picture(cover,true)}<div class="cover-shade"></div><div class="cover-label">${escape(cover.reason)}</div><div class="cover-copy">${meta(cover)}<h2><a href="${escape(cover.url)}"${external(cover)}>${escape(cover.title)}</a></h2><p>${escape(cover.summary)}</p><a class="cover-link" href="${escape(cover.url)}"${external(cover)}>${isUsefulNews(cover)?'Leggi la scheda COINSIEME':`Leggi ${cover.kind==='news'?'sulla fonte originale':'l’articolo'}`} <span aria-hidden="true">${cover.kind==='news'&&!isUsefulNews(cover)?'↗':'→'}</span>${cover.kind==='news'&&!isUsefulNews(cover)?'<span class="sr-only"> (nuova scheda)</span>':''}</a></div></article>
  <div class="tools"><article class="tool tool-house">${homeIcon}<div><p class="eyebrow">Esplora gli ambienti</p><h2>La Casa che si prende cura</h2><p>Stanze, ausili e tecnologie per vivere meglio a casa, un oggetto alla volta.</p><a class="tool-link" href="/casa-che-si-prende-cura/">Entra nella Casa <span aria-hidden="true">→</span></a></div></article><article class="tool tool-services">${serviceIcon}<div><p class="eyebrow">Sportello COINSIEME · Collaudo</p><h2>Esplora i servizi del tuo quartiere</h2><p>Scopri risorse e opportunità. Il percorso di ascolto è facoltativo.</p><a class="tool-link" href="/anteprima-sportello/">Esplora i servizi <span aria-hidden="true">→</span></a><small>Catalogo in verifica: la presenza di una sede non garantisce la disponibilità del servizio.</small></div></article></div></section>
  <section class="updates" aria-labelledby="updates-title"><div class="container"><div class="section-heading"><div><p class="eyebrow">Per capire ciò che cambia</p><h2 id="updates-title">Notizie e approfondimenti</h2></div><p>Le date sono quelle dei contenuti, non della visita.</p></div><div class="updates-grid"><div class="news-column"><div class="column-heading"><h3>Notizie e informazioni utili</h3><a href="/rassegna.html">Tutta la rassegna →</a></div><ul class="news-list">${recentNews.map(x=>`<li>${meta(x)}<h4><a href="${escape(x.url)}"${external(x)}>${escape(x.title)} ${isUsefulNews(x)?'':'<span aria-hidden="true">↗</span><span class="sr-only"> (fonte esterna, nuova scheda)</span>'}</a></h4>${isUsefulNews(x)?`<a class="read" href="${escape(x.url)}">Leggi la scheda COINSIEME</a>`:''}${x.portalDate&&x.portalDate!==x.date?`<small>Nella rassegna dal ${date(x.portalDate)}</small>`:''}</li>`).join('')}</ul></div><div class="articles-column"><div class="column-heading"><h3>Le riflessioni di COINSIEME</h3><a href="/articoli.html">Tutti gli articoli →</a></div>${articleCards.join('')}</div></div></div></section>
  <section class="projects" aria-labelledby="projects-title"><div class="container"><div class="section-heading"><div><p class="eyebrow">Iniziative e lavoro in rete</p><h2 id="projects-title">Progetti, esperienze e nuove iniziative</h2><p class="projects-intro">Attività di oggi, patrimonio di esperienze e proposte per il futuro, con il loro stato di sviluppo.</p></div><a class="projects-hub" href="/cosa-facciamo.html">Vai a Cosa facciamo <span aria-hidden="true">→</span></a></div>${project}</div></section>
  <section class="about-band"><div class="container"><div><h2>Le persone, prima di tutto.</h2><p>Competenze sociali, accessibilità e tecnologie assistive al servizio dell’autonomia.</p></div><a href="/cosa-facciamo.html">Scopri come lavoriamo →</a><a href="/contatti.html">Parliamone →</a></div></section></main>${footer}<script src="navigation.js" defer></script></body></html>`;
  // Generated article/archive pages may exist only in Pages, not in a fresh checkout.
  html=html.replace(/href="(\/articoli\/[^"#]*|\/rassegna.html)"/g,`href="${origin}$1"`);
  html=html.replace('</head>','<noscript><style>.nav-toggle{display:none}.navbar{flex-wrap:wrap}.nav-menu{display:flex;flex-wrap:wrap;flex-basis:100%;position:static}</style></noscript></head>');
  html=html.replaceAll('Attualità, Casa e servizi','Vivere meglio, insieme')
    .replace('<h1>Vivere meglio, insieme</h1>','<h1>Vivere meglio, insieme</h1><p class="introduction-subtitle">Informazioni, tecnologie e servizi per l’autonomia e la vita quotidiana</p>')
    .replace('href="/anteprima-sportello/"','href="/anteprima-sportello/#esplora-servizi"');
  const now=new Date(),clock=require('./clock').format(now);
  html=html.replace('</header>','</header><!-- CMS_TOP_STATUS_START --><div id="top-news-bar" class="current-status"><div class="container"><span>Ora italiana · Europe/Rome</span><span id="top-news-live-date">'+escape(clock.date)+'</span><time id="top-news-live-clock" datetime="'+now.toISOString()+'">'+clock.clock+'</time></div></div><!-- CMS_TOP_STATUS_END -->');
  html=html.replace('</body>','<script src="clock.js" defer></script></body>');
  const styleVersion=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'style.css'))).digest('hex').slice(0,12);
  html=html.replace('href="style.css"','href="style.css?v='+styleVersion+'"');
  if(state)html=html.replace('</head>','<meta name="coinsieme-public-state" content="'+state.signature+'"></head>');
  if(production){
    const {organization}=JSON.parse(fs.readFileSync(path.join(root,'content/organization.json'),'utf8'));
    const jsonLd=JSON.stringify(organization).replace(/</g,'\\u003c');
    html=html.replace('</head>','<script type="application/ld+json" id="coinsieme-organization">'+jsonLd+'</script></head>');
    const privacy=(current.match(/<!-- HOME_PRIVACY_START -->([\s\S]*?)<!-- HOME_PRIVACY_END -->/)||current.match(/(<!-- iubenda Cookie Solution -->[\s\S]*?)(?=<link rel="stylesheet" href="css\/home.css)/))?.[1];
    if(!privacy)throw Error('Blocco privacy della homepage mancante');
    html=html.replace('<meta name="robots" content="noindex,nofollow">','<link rel="canonical" href="https://www.coinsieme.it/"><meta name="description" content="Informazioni, tecnologie e servizi per l’autonomia e la vita quotidiana.">')
      .replace(' · Anteprima</title>','</title>')
      .replace(/<div class="preview-label">[\s\S]*?<\/div>/,'')
      .replace('href="style.css?','href="/assets/home-dinamica/style.css?')
      .replaceAll('src="media/','src="/assets/home-dinamica/media/')
      .replaceAll('srcset="media/','srcset="/assets/home-dinamica/media/')
      .replaceAll(', media/',', /assets/home-dinamica/media/')
      .replace('src="navigation.js"','src="/assets/home-dinamica/navigation.js"')
      .replace('src="clock.js"','src="/assets/home-dinamica/clock.js"')
      .replace('</head>','<!-- HOME_PRIVACY_START -->'+privacy+'<!-- HOME_PRIVACY_END --></head>')
      .replace('</footer>','<a class="iubenda-cs-preferences-link" href="#">Preferenze cookie</a></footer>');
  }
  fs.writeFileSync(path.join(outputDir,'index.html'),html);
  const report={generatedAt:new Date().toISOString(),today,publicationCheckedAt:snapshot.checkedAt,localArticleFiles:articles.length,publicArticleLinks:snapshot.publishedUrls.length,eligibleArticles:eligible(articles,today).length,newsRecords:news.length,eligibleNews:eligible(news,today).length,cover:{id:cover.id,title:cover.title,date:cover.date,reason:cover.reason,sourceImage:cover.image},missingCoverImages:eligible(all,today).filter(x=>!x.image).length,articles:recentArticles.map(x=>x.id),news:recentNews.map(x=>x.id)};
  fs.writeFileSync(path.join(outputDir,'build-report.json'),JSON.stringify(report,null,2));console.log(report);
  return {html,report};
}
if(require.main===module)build().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={build,localImage};
