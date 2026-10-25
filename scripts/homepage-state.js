'use strict';
const crypto=require('node:crypto');
const {validDate,selectCover,eligible}=require('../preview/home-dinamica/selection');
const policy=require('../preview/home-dinamica/policy.json');
const {todayRome}=require('./home-feature');
const sorted=x=>Array.isArray(x)?x.map(sorted):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sorted(x[k])])):x;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(sorted(x))).digest('hex');
const order=x=>x!=null&&x!==''&&Number.isFinite(Number(x))?Number(x):999;
const slug=x=>x.slug||x.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const day=x=>String(x||'').slice(0,10);
function normalize(articles,news,today=todayRome()){
 const a=articles.map(x=>({id:slug(x),kind:'article',published:x.visible!==false&&x.date_verified!==false,date:day(x.date||x.data),title:x.title,summary:x.home_summary||x.summary||'',url:'/articoli/'+slug(x)+'/',image:x.image||'',alt:x.image_alt||x.imageAlt||'',position:x.image_position||'center',prominence:x.rilevanza_home||'normale',order:order(x.ordine_home),until:x.mantieni_in_evidenza_fino_al||'',source:x.author||'COINSIEME',category:x.category||'Approfondimento'}));
 const n=news.map(x=>({id:x.id,kind:'news',published:['pubblica','pubblicata'].includes(x.stato)&&day(x.data_pubblicazione||x.data_fonte)<=today,date:day(x.data_fonte),portalDate:day(x.data_pubblicazione),title:x.titolo_editoriale||x.titolo_originale,summary:x.sintesi_editoriale||'',url:x.url_fonte,image:x.immagine_in_evidenza||x.immagine_news||'',alt:'',position:'center',prominence:({home_principale:'principale',home_evidenza:'evidenza',home_normale:'normale'})[x.posizione_sito]||'solo_archivio',order:order(x.ordine_editoriale),until:x.mantieni_in_evidenza_fino_al||'',source:x.fonte,category:x.categoria})).filter(x=>/^https?:\/\//.test(x.url));
 return {articles:a,news:n};
}
function select(model,today=todayRome()){
 const cover=selectCover([...model.articles,...model.news],today);
 const recent=items=>eligible(items,today).filter(x=>!cover||x.kind!==cover.kind||x.id!==cover.id).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
 return {cover,articles:recent(model.articles).slice(0,3),news:recent(model.news).slice(0,4)};
}
function publicState(articles,news,today=todayRome()){
 const model=normalize(articles,news,today),selection=select(model,today);
 // No run time, sync time, draft metadata, or pubblica -> pubblicata transition.
 const visible=x=>x.published&&validDate(x.date)&&x.date<=today;
 // Home-only controls count through their rendered effect, not hidden scheduling metadata.
 const homeOnly=new Set(['rilevanza_home','ordine_home','mantieni_in_evidenza_fino_al','home_summary','image_position']);
 const publicArticles=articles.filter((x,i)=>visible(model.articles[i])).map(x=>Object.fromEntries(Object.entries(x).filter(([key])=>!homeOnly.has(key)))).sort((a,b)=>slug(a).localeCompare(slug(b)));
 const rendered=({order,until,prominence,published,...item})=>item;
 const publicNews=model.news.filter(visible).map(rendered).sort((a,b)=>a.id.localeCompare(b.id));
 const publicSelection={cover:selection.cover&&rendered(selection.cover),articles:selection.articles.map(rendered),news:selection.news.map(rendered)};
 const signature=hash({policy,articles:publicArticles,news:publicNews,selection:publicSelection});
 return {signature,selection,model};
}
async function readArticles(api,items=require('./articles-editorial').inventory(),today=todayRome()){
 const {TABLE,decision}=require('./articles-editorial');const records=[];let offset;
 do{const page=await api(TABLE+'?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));records.push(...page.records);offset=page.offset;}while(offset);
 return items.map(a=>{
  const matches=records.filter(r=>r.fields.id_cms===a.name);
  if(matches.length>1)throw Error('Articolo editoriale duplicato: '+a.name);
  // A newly committed article without a record is a draft until the existing sync creates it.
  if(!matches.length)return {...a.item,slug:a.slug,visible:false,stato:'bozza'};
  return {...a.item,slug:a.slug,...decision(matches[0].fields,today)};
 });
}
function snapshotArticles(snapshot,items=require('./articles-editorial').inventory()){
 const {decision}=require('./articles-editorial');
 return items.map(a=>{
  const f=snapshot.articles[a.name];
  if(!f||f.hash!==a.hash)throw Error('Snapshot articolo non coerente: '+a.name);
  return {...a.item,slug:a.slug,...decision({...f,data_pubblicazione:f.date})};
 });
}
const escape=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function verify(html,state){
 if(!html.includes('<meta name="coinsieme-public-state" content="'+state.signature+'">'))return false;
 if(!html.includes('href="/anteprima-sportello/#esplora-servizi"')||!html.includes('Vivere meglio, insieme'))return false;
 return [state.selection.cover,...state.selection.articles,...state.selection.news].filter(Boolean).every(x=>{
  const url=x.url.startsWith('/')?'https://www.coinsieme.it'+x.url:x.url;
  return html.includes('href="'+escape(url)+'"')&&html.includes('datetime="'+x.date+'"');
 });
}
module.exports={normalize,select,publicState,readArticles,snapshotArticles,verify,hash};
