const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {check}=require('./check-pages-sportello');
const root=path.resolve(__dirname,'..');
test('ogni workflow Pages include e verifica il collaudo',()=>{
 for(const name of fs.readdirSync(path.join(root,'.github/workflows'))){
  const text=fs.readFileSync(path.join(root,'.github/workflows',name),'utf8');
  if(!text.includes('actions/upload-pages-artifact@'))continue;
  assert.match(text,/sportello anteprima-sportello casa-che-si-prende-cura/);
  assert.match(text,/node scripts\/check-pages-sportello.js _site/);
 }
});
test('aggiornamento rassegna preserva Sportello; dipendenza assente blocca rilascio',()=>{
 const site=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-pages-'));
 try{
  fs.cpSync(path.join(root,'anteprima-sportello'),path.join(site,'anteprima-sportello'),{recursive:true});
  const html=fs.readFileSync(path.join(root,'anteprima-sportello/index.html'),'utf8');
  for(const m of html.matchAll(/(?:src|href)="(\/[^"#]+)"/g)){
   const relative=decodeURIComponent(m[1].split(/[?#]/)[0]);
   const target=path.join(site,relative);fs.mkdirSync(path.dirname(target),{recursive:true});
   fs.cpSync(path.join(root,relative),target,{recursive:true});
  }
  const before=check(root,site);
  fs.writeFileSync(path.join(site,'index.html'),'<main>Rassegna aggiornata</main>');
  assert.equal(check(root,site),before);
  fs.unlinkSync(path.join(site,'anteprima-sportello/index.html'));
  assert.throws(()=>check(root,site),/mancante/);
 }finally{fs.rmSync(site,{recursive:true,force:true});}
});
