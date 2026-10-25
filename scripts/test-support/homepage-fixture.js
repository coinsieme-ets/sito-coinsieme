'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'../..');
function temporary(label){return fs.mkdtempSync(path.join(os.tmpdir(),'coinsieme-'+label+'-'));}
function cleanup(dir){
 const resolved=path.resolve(dir);
 if(path.dirname(resolved)!==path.resolve(os.tmpdir())||!path.basename(resolved).startsWith('coinsieme-'))throw Error('Cartella temporanea non valida');
 fs.rmSync(resolved,{recursive:true,force:true});
}
function snapshot(){
 const editorial=require('../articles-editorial'),result={generatedAt:new Date().toISOString(),articles:{}};
 // Synthetic publication decisions, never read from or written to Airtable.
 for(const item of editorial.inventory())result.articles[item.name]={hash:item.hash,...editorial.decision(editorial.initialFields(item,true))};
 return result;
}
async function productionFixture(){
 const dir=temporary('home-fixture');
 try{
  const news=JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/notizie-esterne.json'),'utf8'));
  const result=await require('../build-homepage').build({snapshot:snapshot(),news,outputDir:dir,writeIndex:false});
  return {...result,dir,cleanup:()=>cleanup(dir)};
 }catch(error){cleanup(dir);throw error;}
}
async function previewFixture(){
 const dir=temporary('preview-fixture');
 try{
  const articles=require('../homepage-state').snapshotArticles(snapshot());
  const news=JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/notizie-esterne.json'),'utf8'));
  for(const file of ['style.css','navigation.js','clock.js'])fs.copyFileSync(path.join(root,'preview/home-dinamica',file),path.join(dir,file));
  const result=await require('../../preview/home-dinamica/build').build({articlesInput:articles,newsInput:news,outputDir:dir});
  return {...result,dir,cleanup:()=>cleanup(dir)};
 }catch(error){cleanup(dir);throw error;}
}
module.exports={root,temporary,cleanup,snapshot,productionFixture,previewFixture};
