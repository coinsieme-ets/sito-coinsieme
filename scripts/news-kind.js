'use strict';
function isUsefulNews(item){
 const source=item.fonte||item.source;
 try{
  const url=new URL(item.url_fonte||item.url);
  return source==='COINSIEME · Notizia utile'&&url.origin==='https://www.coinsieme.it'&&/^\/rassegna\/notizie-utili\/[a-z0-9-]+\.html$/.test(url.pathname);
 }catch{return false;}
}
const usefulBadge='<span class="useful-news-badge" style="display:inline-block;background:#e7f3e9;color:#173e2b;border:1px solid #86aa91;border-radius:4px;padding:5px 9px;font-size:12px;font-weight:700;line-height:1.5">NOTIZIA UTILE · COINSIEME</span>';
module.exports={isUsefulNews,usefulBadge};
