'use strict';
// The existing Airtable article table is the only private source of decisions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),ORIGIN='https://www.coinsieme.it';
const PRIVATE='scratch/private-editorial-articles.json',FEED='assets/editoriale/registro-pubblico.json';
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function scheduled(fields){
 const value=fields.programmato_il||'';
 if(value&&!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value))throw Error('Istante editoriale non valido');
 if(value&&!Number.isFinite(Date.parse(value)))throw Error('Istante editoriale non valido');
 if(value&&new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))!==fields.data_pubblicazione)throw Error('Data e ora editoriali incoerenti');
 return value;
}
function privateArticles(records){
 return records.filter(r=>r.fields.contenuto_riservato_json).map(r=>{
  const item=JSON.parse(r.fields.contenuto_riservato_json),name=r.fields.id_cms;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(name)||name!==item.slug+'.json')throw Error('Identificativo contenuto privato non valido');
  if(!item.title||!item.body||!item.summary)throw Error('Contenuto privato incompleto');
  return {name,item,slug:item.slug,date:r.fields.data_pubblicazione,hash:hash(item)};
 });
}
function cachePrivate(records,root=ROOT){
 const articles=privateArticles(records);fs.mkdirSync(path.join(root,'scratch'),{recursive:true});
 fs.writeFileSync(path.join(root,PRIVATE),JSON.stringify(articles));return articles;
}
function readPrivate(root=ROOT){return fs.existsSync(path.join(root,PRIVATE))?JSON.parse(fs.readFileSync(path.join(root,PRIVATE),'utf8')):[];}
function publicItem(a,f,now=new Date()){
 const when=scheduled({...f,data_pubblicazione:f.date||f.data_pubblicazione});
 if(f.stato!=='pubblica'||f.visible===false||!f.autorizza_social||when&&Date.parse(when)>now.getTime())return null;
 if((f.date||a.date)>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(now))return null;
 return {id:a.slug,title:a.item.title,scheduled_at:when||null,published_date:f.date||a.date,status:'pubblicato',url:ORIGIN+'/articoli/'+a.slug+'/',cover_image_url:a.item.image?new URL(a.item.image,ORIGIN).href:null,social_image_url:ORIGIN+'/assets/editoriale/generated/'+a.slug+'.jpg',description:a.item.summary,category:a.item.category||'Articolo',social_authorized:true,promotion_key:'article:'+a.slug};
}
async function materializeImages(articles,snapshot,root=ROOT){
 for(const a of articles){
 const due=snapshot.articles[a.name]?.visible;
  // Private image bytes are materialized only when the article can be published.
  if(due&&a.item._private_image_base64){
   if(a.item.image!=='/assets/editoriale/generated/'+a.slug+'.jpg')throw Error('Percorso immagine privata non valido');
   const dest=path.join(root,a.item.image.slice(1));fs.mkdirSync(path.dirname(dest),{recursive:true});
   await require('sharp')(Buffer.from(a.item._private_image_base64,'base64')).jpeg({quality:85}).toFile(dest);
  }
 }
}
async function build({root=ROOT,articles=require('./articles-editorial').inventory(),snapshot=require('./articles-editorial').readSnapshot(),now=new Date()}={}){
 if(!snapshot)throw Error('Snapshot obbligatorio per il calendario');
 const full=[],published=[];
 for(const a of articles){
  const f=snapshot.articles[a.name];if(!f||f.hash!==a.hash)throw Error('Calendario non coerente: '+a.name);
  const when=scheduled({...f,data_pubblicazione:f.date});
  const due=f.visible&&(!when||Date.parse(when)<=now.getTime());
  const entry=publicItem(a,f,now);
  const row={id:a.slug,title:a.item.title,scheduled_at:when||null,status:f.stato==='bozza'?'bozza':f.verificato_online_il&&due?'pubblicato':when?'programmato':'approvato',url:ORIGIN+'/articoli/'+a.slug+'/',cover_image_url:a.item.image?new URL(a.item.image,ORIGIN).href:null,description:a.item.summary,category:a.item.category||'Articolo',social_authorized:!!f.autorizza_social};
  full.push(row);
  if(!entry)continue;
  const page=path.join(root,'articoli',a.slug,'index.html');
  if(!fs.existsSync(page))throw Error('Articolo autorizzato senza pagina: '+a.slug);
  const image=a.item.image||'';
  if(!image||/^https?:/.test(image))throw Error('Per la promozione serve una copertina ufficiale locale: '+a.slug);
  const dest=path.join(root,'assets/editoriale/generated',a.slug+'.jpg');fs.mkdirSync(path.dirname(dest),{recursive:true});
  const input=path.resolve(root,image.replace(/^\//,''));
  if(!input.startsWith(path.resolve(root,'assets')+path.sep))throw Error('Copertina fuori da assets');
  if(input!==dest)await require('sharp')(input).rotate().resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true}).flatten({background:'#ffffff'}).jpeg({quality:88}).toFile(dest);
  entry.content_revision=hash({title:entry.title,description:entry.description,body:a.item.body,image:fs.readFileSync(dest).toString('base64')});
  published.push(entry);
 }
 published.sort((a,b)=>b.published_date.localeCompare(a.published_date)||a.id.localeCompare(b.id));
 const feed={schema_version:1,timezone:'Europe/Rome',articles:published};
 fs.mkdirSync(path.join(root,'assets/editoriale'),{recursive:true});fs.writeFileSync(path.join(root,FEED),JSON.stringify(feed,null,2)+'\n');
 fs.mkdirSync(path.join(root,'scratch'),{recursive:true});fs.writeFileSync(path.join(root,'scratch/registro-editoriale-riservato.json'),JSON.stringify({schema_version:1,timezone:'Europe/Rome',articles:full},null,2)+'\n');
 return feed;
}
async function changed(api,{root=ROOT,fetcher=require('./verify-publication').fetchPublished,now=new Date()}={}){
 const {TABLE,inventory,decision}=require('./articles-editorial');const records=[];let offset;
 do{const page=await api(TABLE+'?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));records.push(...page.records);offset=page.offset;}while(offset);
 cachePrivate(records,root);
 const expected=inventory().map(a=>{const r=records.find(r=>r.fields.id_cms===a.name);return r&&publicItem(a,{...r.fields,...decision(r.fields)},now);}).filter(Boolean);
 const res=await fetcher(ORIGIN+'/'+FEED);if(!res.ok)return true;
 let feed;try{feed=await res.json();}catch{return true;}
 if(feed.schema_version!==1||!Array.isArray(feed.articles))return true;
 return hash(expected.map(x=>[x.id,x.scheduled_at,x.title,x.description,x.cover_image_url]).sort())!==hash(feed.articles.map(x=>[x.id,x.scheduled_at,x.title,x.description,x.cover_image_url]).sort());
}
async function confirm(api,{root=ROOT,fetcher=require('./verify-publication').fetchPublished,now=new Date()}={}){
 const editorial=require('./articles-editorial'),snapshot=editorial.readSnapshot();
 if(!snapshot)return;
 for(const a of editorial.inventory()){
  const f=snapshot.articles[a.name];if(!f?.visible||f.verificato_online_il)continue;
  const url=ORIGIN+'/articoli/'+a.slug+'/';const res=await fetcher(url);
  if(!res.ok)throw Error('Articolo non verificato online: '+a.slug);
  const html=await res.text();if(!html.includes('rel="canonical" href="'+url+'"'))throw Error('URL canonico non verificato: '+a.slug);
  const current=await api(editorial.TABLE+'/'+f.recordId);
  if(!editorial.decision(current.fields).visible)continue;
  if(current.fields.contenuto_riservato_json&&privateArticles([current])[0].hash!==a.hash)continue;
  await api(editorial.TABLE+'/'+f.recordId,'PATCH',{fields:{verificato_online_il:now.toISOString()}});
 }
}
module.exports={scheduled,materializeImages,privateArticles,cachePrivate,readPrivate,publicItem,build,changed,confirm,FEED};
if(require.main===module){const mode=process.argv[2],api=require('./publish-segnalazioni').createApi(process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN||'');
 (mode==='build'?build():mode==='confirm'?confirm(api):Promise.reject(Error('Modalita calendario non valida'))).catch(e=>{console.error(e.message);process.exitCode=1;});}
