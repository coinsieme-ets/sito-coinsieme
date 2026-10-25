'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function check(root,site){
  const base=path.join(root,'anteprima-sportello');
  function visit(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const file=path.join(dir,entry.name);
      if(entry.isDirectory()){visit(file);continue;}
      const target=path.join(site,path.relative(root,file));
      if(!fs.existsSync(target)||!fs.readFileSync(file).equals(fs.readFileSync(target)))throw Error('Sportello mancante o alterato: '+target);
    }
  }
  visit(base);
  const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
  for(const match of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)){
    const relative=decodeURIComponent(match[1].split(/[?#]/)[0]);
    const file=path.join(root,relative),target=path.join(site,relative);
    if(!fs.existsSync(target))throw Error('Dipendenza Sportello assente: '+relative);
    if(!relative.endsWith('.html')&&fs.statSync(file).isFile()&&!fs.readFileSync(file).equals(fs.readFileSync(target)))throw Error('Dipendenza Sportello alterata: '+relative);
  }
  if(fs.existsSync(path.join(site,'preview/quartiere-che-si-prende-cura')))throw Error('Prototipo Quartiere incluso');
  return crypto.createHash('sha256').update(html).digest('hex');
}
if(require.main===module)console.log('Sportello preservato:',check(path.resolve(__dirname,'..'),path.resolve(process.argv[2]||'_site')));
module.exports={check};
