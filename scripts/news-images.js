'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=path.join(__dirname,'..'),PLACEHOLDER='/assets/news/placeholder.svg';
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
function safeUrl(value,base){try{const u=new URL(decode(value),base);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[)/i.test(u.hostname))return '';return u.href;}catch{return '';}}
function imageCandidates(html,url){
 const found=[];for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=m[2]??m[3];const key=(a.property||a.name||'').toLowerCase();if(['og:image','og:image:secure_url','twitter:image','twitter:image:src'].includes(key)&&a.content){const image=safeUrl(a.content,url);if(image&&!/logo|placeholder|favicon|default[-_]?image/i.test(new URL(image).pathname))found.push({url:image,kind:key.startsWith('og:')?'og:image':'twitter:image'});}}
 return [...new Map(found.sort((a,b)=>(a.kind==='og:image'?0:1)-(b.kind==='og:image'?0:1)).map(x=>[x.url,x])).values()];
}
async function bytes(response,max){const reader=response.body.getReader(),parts=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('Risorsa troppo grande');}parts.push(Buffer.from(value));}return Buffer.concat(parts);}
async function downloadImage(candidate,fetcher){
 const response=await fetcher(candidate.url,{signal:AbortSignal.timeout(20000)});
 if(!response.ok||!/^image\//i.test(response.headers.get('content-type')||''))throw Error('Immagine HTTP '+response.status+' o MIME non valido');
 const buffer=await bytes(response,10000000),meta=await require('sharp')(buffer).metadata();
 if(!['jpeg','png','webp','avif','gif'].includes(meta.format)||meta.width<200||meta.height<100)throw Error('Formato o dimensioni non idonei');
 return {original:candidate.url,kind:candidate.kind,imageStatus:response.status,width:meta.width,height:meta.height,hash:crypto.createHash('sha256').update(buffer).digest('hex'),format:meta.format,buffer};
}
async function inspectSource(source,{fetcher=fetch,cache}={}){
 if(cache===undefined){const file=path.join(ROOT,'content/rassegna/source-image-cache.json');cache=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};}

 const report={source,original:null,displayed:PLACEHOLDER,kind:'placeholder',attempts:[]};
 try{const url=safeUrl(source);if(!url)throw Error('URL fonte non valido');const response=await fetcher(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Mozilla/5.0 COINSIEME News'}});report.sourceStatus=response.status;if(!response.ok)throw Error('Fonte HTTP '+response.status);
 const html=(await bytes(response,4000000)).toString('utf8');
 for(const candidate of imageCandidates(html,response.url||url)){
  try{return {...report,...await downloadImage(candidate,fetcher)};
  }catch(e){report.attempts.push({image:candidate.url,error:e.message});}
 }
 report.reason='Nessuna immagine OpenGraph/Twitter valida';
 }catch(e){report.reason=e.message;
  const known=cache[source];
  if(known && safeUrl(known.original)){
   try{return {...report,...await downloadImage({url:known.original,kind:known.kind},fetcher),cachedSourceAssociation:true,associationVerifiedAt:known.verifiedAt};}
   catch(error){report.attempts.push({image:known.original,error:error.message});
    if(known.local?.startsWith('/assets/news/source-cache/')&&!known.local.includes('..')){
     try{const buffer=fs.readFileSync(path.join(ROOT,known.local.slice(1))),hash=crypto.createHash('sha256').update(buffer).digest('hex'),meta=await require('sharp')(buffer).metadata();
      if(hash===known.hash && meta.width>=200 && meta.height>=100)return {...report,original:known.original,kind:known.kind,buffer,hash,format:meta.format,width:meta.width,height:meta.height,cachedSourceAssociation:true,cachedImage:true,associationVerifiedAt:known.verifiedAt};
     }catch(cacheError){report.attempts.push({error:'Copia fonte non valida: '+cacheError.message});}
    }
   }
  }
 }return report;
}
async function refreshNewsImages(items,root=ROOT){
 const reports=[];for(const item of items){const r=await inspectSource(item.url_fonte);reports.push(r);}
 const counts=new Map();for(const r of reports)if(r.hash)counts.set(r.hash,(counts.get(r.hash)||0)+1);
 fs.mkdirSync(path.join(root,'assets/news/generated'),{recursive:true});const map={};
 for(const r of reports){if(r.buffer&&counts.get(r.hash)===1){r.displayed='/assets/news/generated/'+r.hash.slice(0,24)+'.'+r.format;fs.writeFileSync(path.join(root,r.displayed.slice(1)),r.buffer);}else if(r.buffer){r.kind='placeholder';r.reason='Immagine condivisa da piu notizie: evita riciclo';}delete r.buffer;map[r.source]=r;}
 fs.mkdirSync(path.join(root,'scratch'),{recursive:true});fs.writeFileSync(path.join(root,'scratch/news-images.json'),JSON.stringify(map,null,2));console.log('Immagini news: '+Object.values(map).filter(r=>r.displayed!==PLACEHOLDER).length+' originali, '+Object.values(map).filter(r=>r.displayed===PLACEHOLDER).length+' placeholder');return map;
}
function resolveNewsImage(item,root=ROOT){const file=path.join(root,'scratch/news-images.json');if(!fs.existsSync(file))return PLACEHOLDER;return JSON.parse(fs.readFileSync(file,'utf8'))[item.url_fonte]?.displayed||PLACEHOLDER;}
module.exports={imageCandidates,inspectSource,refreshNewsImages,resolveNewsImage,PLACEHOLDER};
