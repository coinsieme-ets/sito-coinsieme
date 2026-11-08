'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {slug}=require('../js/site-search');
const root=path.resolve(__dirname,'..'),app=path.join(root,'anteprima-sportello/app');
const text=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&(?:amp|quot|lt|gt|nbsp|apos);/g,e=>({'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&nbsp;':' ','&apos;':"'"}[e])).replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>String.fromCodePoint(n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n))).replace(/\s+/g,' ').trim();
const short=s=>{const t=text(s);return t.length>190?t.slice(0,187).replace(/\s+\S*$/,'')+'…':t;};
function data(name){const c={window:{}};vm.runInNewContext(fs.readFileSync(path.join(app,name+'.js'),'utf8'),c,{timeout:1000});return Object.values(c.window)[0];}
function target(category,kind,id){return '/anteprima-sportello/#cerca='+[category,kind,id].map(encodeURIComponent).join('/');}
function catalog(){
 const entries=[],seen=new Set();
 function add(title,description,url,type='Sportello',extra='',until){
  if(!title||!url||seen.has(url))return;seen.add(url);
  entries.push({title:text(title),summary:short(description),type,url,text:text([title,description,extra].join(' ')),...(until?{until}:{} )});
 }
 const services=require('../anteprima-sportello/app/servizi');
 const ordinary=[...services.resources,...services.homeOperators,...services.technicalResources];
 const categoryIntros=new Set(['info-domicilio','info-socialita','info-consegne','info-mobilita']);
 const groupIntros=new Set(['case-ambulatori','ospedali','domiciliare-sanitaria','prevenzione']);
 for(const r of ordinary){
  const kind=categoryIntros.has(r.id)||(r.id.startsWith('info-salute-')&&groupIntros.has(r.subcategory))?'ambito':'risorsa';
  const id=kind==='ambito'?(r.subcategory||r.category):r.id;
  add(r.name,r.id.startsWith('info-')?'Informazioni e percorsi di orientamento: consulta le fonti e le condizioni nella scheda.':r.description,target(r.category,kind,id),'Sportello',(r.keywords||[]).join(' '));
 }
 for(const [name,category,kind] of [['diagnostica','salute','diagnostica'],['televisite','salute','televisite'],['farmacie','salute','farmacia'],['residenziali','salute','residenza'],['mobilita','mobilita','risorsa'],['consegne','consegne','risorsa'],['coabitazione','abitare','coabitazione']]){
  const d=data(name+'-data');
  const records=name==='farmacie'?d.choose(data('consegne-data')):d.records;
  for(const r of records)add(r.name,r.description||r.opening||r.services?.map(s=>s.description).join(' ')||r.delivery,target(category,kind,r.id),'Sportello',[r.address,r.coverage,r.reference,(r.fields||[]).join(' ')].filter(Boolean).join(' '));
 }
 const physio=require('../anteprima-sportello/app/fisioterapia-data');
 for(const p of physio.providers)add(p.name,p.description,target('domicilio',p.regime==='privato'?'fisio-privato':'fisio-pubblico',p.id));
 const medici=require('../anteprima-sportello/app/medici-data');add(medici.bookingPlatform.name,medici.bookingPlatform.description,target('salute','cupmedico','cupmedico-medico-famiglia'));
 const continuita=require('../anteprima-sportello/app/continuita-data');
 for(const site of continuita.choose(services))add('AmbuFest — '+site.address,'Cure primarie ad accesso diretto negli orari previsti. '+site.zone,target('salute','ambufest',site.id));
 const c={window:{}};for(const file of ['socialita-data','samaritans','tirrenia-todaro'])vm.runInNewContext(fs.readFileSync(path.join(app,file+'.js'),'utf8'),c,{timeout:1000});
 const social=require('../anteprima-sportello/app/socialita');
 for(const r of [...c.window.SportelloSocialitaData.records,...social.additions])add(r.name,r.description,target('socialita','sociale',r.id),'Sportello',(r.fields||[]).join(' '),r.trip?.start);
 // Solution cards are flat articles in the existing static HTML, never a second catalogue.
 const casa=fs.readFileSync(path.join(root,'casa-che-si-prende-cura/index.html'),'utf8');
 for(const match of casa.matchAll(/<article\b[^>]*class="solution(?: [^"]*)?"[^>]*>([\s\S]*?)<\/article>/g)){
  const title=match[1].match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/)?.[1];
  if(!title)throw Error('Scheda Casa senza titolo');
  const description=match[1].match(/<p\b[^>]*>([\s\S]*?)<\/p>/)?.[1]||'';
  add(title,description,'/casa-che-si-prende-cura/#scheda-'+slug(text(title)),'Casa',text(match[1]));
 }
 for(const file of ['chi-siamo','cosa-facciamo','domotica','formazione','pubblicazioni','trasparenza','contribuisci','contatti']){
  const html=fs.readFileSync(path.join(root,file+'.html'),'utf8');
  add(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1]||file,html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'', '/'+file+'.html','Fondazione');
 }
 return entries;
}
function build({articles=[],news=[],today=new Date().toLocaleDateString('sv-SE',{timeZone:'Europe/Rome'})}={}){
 const entries=catalog(),urls=new Set(entries.map(e=>e.url));
 // Only the validated editorial model reaches this function in production.
 for(const a of articles){
  if(!a.published||!a.date||a.date>today||!/^\/articoli\/[a-z0-9-]+\/$/.test(a.url)||urls.has(a.url))continue;
  entries.push({title:text(a.title),summary:short(a.summary),text:text(a.title+' '+a.summary+' '+a.category),type:'Articolo',url:a.url});urls.add(a.url);
 }
 for(const n of news){
  if(!n.published||!n.date||n.date>today)continue;
  let url;try{url=new URL(n.url);}catch{continue;}
  if(url.origin!=='https://www.coinsieme.it'||!url.pathname.startsWith('/rassegna/notizie-utili/')||urls.has(url.pathname))continue;
  entries.push({title:text(n.title),summary:short(n.summary),text:text(n.title+' '+n.summary),type:'Articolo',url:url.pathname});urls.add(url.pathname);
 }
 return entries;
}
function write(file,options){const entries=build(options);fs.writeFileSync(file,'window.CoinsiemeSearchIndex = '+JSON.stringify(entries).replace(/</g,'\\u003c')+';\n');return entries;}
module.exports={build,catalog,write,target,text};
