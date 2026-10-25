'use strict';
const fs=require('node:fs'),path=require('node:path');
const stateModule=require('./homepage-state');
const root=path.resolve(__dirname,'..');
async function build({snapshot,news,outputDir=path.join(root,'assets/home-dinamica'),sourceHtml,writeIndex=true}={}){
 snapshot=snapshot||require('./articles-editorial').readSnapshot();
 if(!snapshot)throw Error('La homepage di produzione richiede lo snapshot editoriale validato');
 news=news||require('./home-feature').loadHomeItems(JSON.parse(fs.readFileSync(path.join(root,'content/rassegna/notizie-esterne.json'),'utf8')));
 const articles=stateModule.snapshotArticles(snapshot),state=stateModule.publicState(articles,news);
 fs.mkdirSync(outputDir,{recursive:true});
 for(const file of ['style.css','navigation.js','clock.js'])fs.copyFileSync(path.join(root,'preview/home-dinamica',file),path.join(outputDir,file));
 const result=await require('../preview/home-dinamica/build').build({articlesInput:articles,newsInput:news,outputDir,production:true,state,sourceHtml});
 if(!stateModule.verify(result.html,state))throw Error('Homepage generata incoerente con lo stato editoriale');
 if(writeIndex)fs.writeFileSync(path.join(root,'index.html'),result.html);
 return {...result,state};
}
module.exports={build};
