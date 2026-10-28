'use strict';
const {isUsefulNews}=require('./news-kind');
const recordUrl=id=>'https://www.coinsieme.it/rassegna/'+id+'.html';
function canonicalUrl(item,fallbackId){
 if(isUsefulNews(item))return item.url_fonte;
 const id=item.segnalazioni?.[0]||item.notizie?.[0]||fallbackId;
 if(!id)throw Error('Identificativo rassegna mancante');
 return recordUrl(id);
}
function validCanonical(value){
 try{const url=new URL(value);return url.origin==='https://www.coinsieme.it'&&!url.search&&!url.hash&&(/^\/rassegna\/rec[a-zA-Z0-9]{14}\.html$/.test(url.pathname)||/^\/rassegna\/notizie-utili\/[a-z0-9-]+\.html$/.test(url.pathname));}catch{return false;}
}
module.exports={recordUrl,canonicalUrl,validCanonical};
