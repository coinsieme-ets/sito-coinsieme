'use strict';
const {validateAndNormalizeRecord}=require('./sync-rassegna');
function normalizeTarget(news){return validateAndNormalizeRecord(news.fields,news.id,news);}
if(require.main===module){
 const {spawnSync}=require('node:child_process');
 const mode=process.argv[2];
 if(!['prepare','confirm'].includes(mode))throw new Error('Usare il workflow permanente: prepare / confirm');
 const result=spawnSync(process.execPath,[require.resolve('./publish-segnalazioni'),mode],{stdio:'inherit',env:process.env});
 process.exitCode=result.status||0;
}
module.exports={normalizeTarget};
