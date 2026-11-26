'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {check,excludeHiddenImages}=require('./check-editorial-privacy');
test('artefatto: rimuove solo copertina privata, blocca riferimenti futuri e directory riservate',()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-privacy-')),root=path.join(temp,'_site');
 const articles=[{name:'segreto.json',slug:'segreto',item:{title:'Titolo riservato',image:'/assets/segreto.jpg'}},{name:'online.json',slug:'online',item:{title:'Online',image:'/assets/logo.jpg'}}];
 const snapshot={articles:{'segreto.json':{visible:false},'online.json':{visible:true}}};
 try{
  fs.mkdirSync(path.join(root,'assets'),{recursive:true});fs.writeFileSync(path.join(root,'assets/segreto.jpg'),'immagine');fs.writeFileSync(path.join(root,'assets/logo.jpg'),'logo');
  excludeHiddenImages(root,articles,snapshot);assert(!fs.existsSync(path.join(root,'assets/segreto.jpg')));assert(fs.existsSync(path.join(root,'assets/logo.jpg')));check(root,articles,snapshot);
  fs.writeFileSync(path.join(root,'index.html'),'Titolo riservato');assert.throws(()=>check(root,articles,snapshot),/anticipato/);
  fs.writeFileSync(path.join(root,'index.html'),'Online');fs.mkdirSync(path.join(root,'scratch'));assert.throws(()=>check(root,articles,snapshot),/privata/);
  assert.throws(()=>excludeHiddenImages(temp,articles,snapshot),/solo/);
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
});
