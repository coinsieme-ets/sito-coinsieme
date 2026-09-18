'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {editorialFields}=require('./article-home');
const {todayRome}=require('./home-feature');
const TABLE='tbldu5S3r7ZppEF1y';
const root=path.join(__dirname,'..');
const snapshotFile=path.join(root,'scratch/articles-editorial.json');
function inventory(){
 const {parseArticleDate}=require('./build-cms');
 return fs.readdirSync(path.join(root,'content/articoli')).filter(n=>n.endsWith('.json')).sort().map(name=>{
 const raw=fs.readFileSync(path.join(root,'content/articoli',name),'utf8');const item=JSON.parse(raw.replace(/^\uFEFF/,''));
 const slug=item.slug?.trim()||item.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Slug non valido');
 return {name,item,slug,date:parseArticleDate(item),hash:crypto.createHash('sha256').update(raw).digest('hex')};
 });
}
function metadata(a){return {id_cms:a.name,titolo:a.item.title,rubrica:a.item.rubrica==='tecnologie-che-aiutano'?'Tecnologie che aiutano':a.item.rubrica||'',categoria:a.item.category||'',tipo_contenuto:a.item.content_type||'',autore:a.item.author||'',url_articolo:'https://www.coinsieme.it/articoli/'+a.slug+'/'};}
function initialFields(a,existing=false){return {...metadata(a),stato:existing?'pubblica':'bozza',data_pubblicazione:a.date,...editorialFields(a.item),mantieni_in_evidenza_fino_al:a.item.mantieni_in_evidenza_fino_al||null};}
function decision(fields,today=todayRome()){
 if(!['bozza','pubblica'].includes(fields.stato))throw Error('Stato articolo mancante o non valido');
 const date=fields.data_pubblicazione||'';
 if(date&&(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date).toISOString().slice(0,10)!==date))throw Error('Data pubblicazione non valida');
 if(fields.stato==='pubblica'&&!date)throw Error('Data pubblicazione obbligatoria per pubblicare');
 return {...editorialFields(fields),date,stato:fields.stato,visible:fields.stato==='pubblica'&&date<=today};
}
async function sync(api,articles=inventory()){
 const read=async()=>{const result=[];let offset;do{const r=await api(TABLE+'?pageSize=100'+(offset?'&offset='+encodeURIComponent(offset):''));result.push(...r.records);offset=r.offset;}while(offset);return result;};
 let records=await read();const ids=new Set();for(const r of records){if(ids.has(r.fields.id_cms))throw Error('id_cms duplicato');ids.add(r.fields.id_cms);}
 const creates=[],updates=[];
 for(const a of articles){const record=records.find(r=>r.fields.id_cms===a.name);if(!record)creates.push({fields:initialFields(a)});else{const fields=Object.fromEntries(Object.entries(metadata(a)).filter(([k,v])=>(record.fields[k]||'')!==v));if(Object.keys(fields).length)updates.push({id:record.id,fields});}}
 for(const [method,rows] of [['POST',creates],['PATCH',updates]])for(let i=0;i<rows.length;i+=10)await api(TABLE,method,{records:rows.slice(i,i+10)});
 records=await read();const snapshot={generatedAt:new Date().toISOString(),articles:{}};
 for(const a of articles){const matches=records.filter(r=>r.fields.id_cms===a.name);if(matches.length!==1)throw Error('Record editoriale mancante/duplicato: '+a.name);snapshot.articles[a.name]={hash:a.hash,recordId:matches[0].id,...decision(matches[0].fields)};}
 return {snapshot,created:creates.length,updated:updates.length};
}
function readSnapshot(){
 if(!fs.existsSync(snapshotFile)){if(process.env.GITHUB_ACTIONS==='true')throw Error('Snapshot editoriale Airtable obbligatorio in produzione');return null;}
 const s=JSON.parse(fs.readFileSync(snapshotFile,'utf8'));
 if(!Number.isFinite(Date.parse(s.generatedAt))||Date.now()-Date.parse(s.generatedAt)>6*60*60*1000)throw Error('Snapshot editoriale scaduto');
 for(const a of inventory())if(s.articles[a.name]?.hash!==a.hash)throw Error('Snapshot editoriale non aggiornato: '+a.name);
 return s;
}
function apply(item,name,snapshot){if(!snapshot)return item;const f=snapshot.articles[name];if(!f)throw Error('Articolo assente nello snapshot');return {...item,...decision({...f,data_pubblicazione:f.date})};}
async function main(){const token=process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;if(!token)throw Error('Credenziale Airtable mancante');const {createApi}=require('./publish-segnalazioni');const result=await sync(createApi(token));fs.mkdirSync(path.dirname(snapshotFile),{recursive:true});fs.writeFileSync(snapshotFile,JSON.stringify(result.snapshot,null,2));console.log('Articoli Airtable: '+Object.keys(result.snapshot.articles).length+', nuove bozze '+result.created+', metadati aggiornati '+result.updated);}
module.exports={TABLE,inventory,metadata,initialFields,decision,sync,readSnapshot,apply,main};
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
