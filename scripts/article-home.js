'use strict';
const {todayRome}=require('./home-feature');
const levels={principale:0,evidenza:1,normale:2,solo_archivio:3};
function editorialFields(item){
 const relevance=item.rilevanza_home||'normale';
 if(!(relevance in levels))throw Error('rilevanza_home non valida');
 const order=item.ordine_home==null||item.ordine_home===''?999:Number(item.ordine_home);
 if(!Number.isInteger(order)||order<0)throw Error('ordine_home deve essere un intero non negativo');
 const until=item.mantieni_in_evidenza_fino_al||'';
 if(until&&!/^\d{4}-\d{2}-\d{2}$/.test(until))throw Error('Scadenza articolo non valida');
 return {rilevanza_home:relevance,ordine_home:order,mantieni_in_evidenza_fino_al:until};
}
function selectHomeArticles(items,today=todayRome()){
 const tier=x=>x.mantieni_in_evidenza_fino_al&&x.mantieni_in_evidenza_fino_al<today?2:levels[x.rilevanza_home];
 const pinned=x=>x.mantieni_in_evidenza_fino_al>=today?0:1;
 return items.map(x=>({...x,...editorialFields(x)})).filter(x=>x.rilevanza_home!=='solo_archivio'&&(!x.date||x.date<=today))
 .sort((a,b)=>tier(a)-tier(b)||pinned(a)-pinned(b)||a.ordine_home-b.ordine_home||(b.date||'').localeCompare(a.date||'')||a.slug.localeCompare(b.slug));
}
module.exports={editorialFields,selectHomeArticles};
