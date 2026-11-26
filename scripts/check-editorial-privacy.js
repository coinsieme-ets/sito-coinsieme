'use strict';
const fs=require('node:fs'),path=require('node:path');
function check(root,articles,snapshot){
 const hidden=articles.filter(a=>!snapshot.articles[a.name]?.visible);
 const visit=dir=>{for(const name of fs.readdirSync(dir)){const file=path.join(dir,name),stat=fs.lstatSync(file);
  if(stat.isSymbolicLink())throw Error('Link simbolico nell’artefatto pubblico');
  if(stat.isDirectory())visit(file);
  else{
   for(const a of hidden)if(path.relative(root,file).includes(a.slug))throw Error('Risorsa privata nell’artefatto: '+a.slug);
   if(/\.(html|json|js|xml|txt)$/i.test(file)){
    const text=fs.readFileSync(file,'utf8');
    for(const a of hidden)if(text.includes(a.slug)||text.includes(a.item.title))throw Error('Riferimento anticipato nell’artefatto: '+a.slug);
   }
  }
 }};visit(root);
 for(const name of ['content','scratch','docs','.git'])if(fs.existsSync(path.join(root,name)))throw Error('Directory privata nel sito: '+name);
}
function excludeHiddenImages(root,articles,snapshot){
 const base=path.resolve(root);
 if(path.basename(base)!=='_site')throw Error('Esclusione consentita solo nella directory _site');
 const normalize=a=>String(a.item.image||'').replace(/^\//,'');
 const visible=new Set(articles.filter(a=>snapshot.articles[a.name]?.visible).map(normalize));
 for(const a of articles.filter(a=>!snapshot.articles[a.name]?.visible)){
  const image=normalize(a);if(!image||visible.has(image)||!image.startsWith('assets/'))continue;
  const file=path.resolve(base,image);
  if(!file.startsWith(path.join(base,'assets')+path.sep))throw Error('Percorso immagine non sicuro');
  if(fs.existsSync(file)){if(fs.lstatSync(file).isSymbolicLink())throw Error('Immagine simbolica');fs.unlinkSync(file);}
 }
}
module.exports={check,excludeHiddenImages};
if(require.main===module){const e=require('./articles-editorial'),root=path.resolve(process.argv[2]||'_site'),articles=e.inventory(),snapshot=e.readSnapshot();excludeHiddenImages(root,articles,snapshot);check(root,articles,snapshot);console.log('Riservatezza editoriale: verificata');}
