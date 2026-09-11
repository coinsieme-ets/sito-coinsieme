'use strict';
const fs=require('node:fs');
const todayRome=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Rome',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const day=value=>String(value||'').slice(0,10);
function selectHomeFeature(items,today=todayRome()) {
 const priority={alta:0,media:1,bassa:2};
 const order=x=>x.ordine_editoriale!=null && x.ordine_editoriale!=='' && Number.isFinite(Number(x.ordine_editoriale))?Number(x.ordine_editoriale):999;
 const tier=x=>{const until=day(x.mantieni_in_evidenza_fino_al);if(until && until<today)return 2;if(x.posizione_sito==='home_principale')return 0;return until && until>=today?1:2;};
 return (items||[]).filter(x=>['pubblica','pubblicata'].includes(x.stato) && ['home_principale','home_evidenza','home_normale'].includes(x.posizione_sito) && day(x.data_pubblicazione||x.data_fonte)<=today && /^https?:\/\//i.test(x.url_fonte||'') && (x.titolo_editoriale||x.titolo_originale) && x.fonte)
 .sort((a,b)=>tier(a)-tier(b)||day(b.data_pubblicazione||b.data_fonte).localeCompare(day(a.data_pubblicazione||a.data_fonte))||order(a)-order(b)||(priority[a.priorita]??1)-(priority[b.priorita]??1)||String(a.id).localeCompare(String(b.id)))[0]||null;
}
function loadHomeItems(items) {const file='scratch/home-editorial.json';if(!fs.existsSync(file))return items;const overrides=JSON.parse(fs.readFileSync(file,'utf8'));return items.map(x=>({...x,...overrides[x.id]}));}
module.exports={selectHomeFeature,loadHomeItems,todayRome};
