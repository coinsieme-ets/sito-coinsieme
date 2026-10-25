'use strict';
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
const policy=require('./policy.json');
function tier(item,today,config=policy){
  if(validDate(item.until)&&item.until<today)return 3;
  if(validDate(item.until)&&item.until>=today)return 0;
  if(!config.permanentIds.includes(item.kind+':'+item.id)&&Date.parse(today)-Date.parse(item.date)>config.unboundedDays*86400000)return 3;
  return {principale:1,evidenza:2,normale:3}[item.prominence]??3;
}
function eligible(items,today){
  const seen=new Set();
  return items.filter(x=>x.published&&validDate(x.date)&&x.date<=today&&x.prominence!=='solo_archivio'&&x.title&&x.url)
    .filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return true;});
}
function selectCover(items,today){
  const candidates=eligible(items,today);
  const recent=x=>Date.parse(today)-Date.parse(x.date)<=14*86400000;
  const editorial=candidates.filter(x=>tier(x,today)<3);
  const pool=editorial.length?editorial:candidates.some(recent)?candidates.filter(recent):candidates;
  pool.sort((a,b)=>tier(a,today)-tier(b,today)||(tier(a,today)<3?a.order-b.order:0)||b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
  const item=pool[0];
  return item?{...item,reason:tier(item,today)<3?'Scelto dalla redazione':recent(item)?'Da leggere':'Dal nostro archivio'}:null;
}
module.exports={validDate,tier,eligible,selectCover};
