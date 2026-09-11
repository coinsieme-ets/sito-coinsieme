const fs=require('node:fs');
const {verifyPage}=require('./publish-segnalazioni');
const manifest=JSON.parse(fs.readFileSync('scratch/publication-manifest.json','utf8'));
for(const item of manifest.items){
 const html=fs.readFileSync('rassegna/'+item.recordId+'.html','utf8');
 if(!verifyPage(html,item))throw new Error('Scheda build non verificata '+item.recordId);
}
console.log('Schede verificate prima del deploy: '+manifest.items.length);
