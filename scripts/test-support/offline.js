'use strict';
// Preloaded only by local release tests. Never used by deployment workflows.
global.fetch=async()=>{throw Error('OFFLINE_TEST: accesso HTTP vietato');};
for(const module of ['node:http','node:https']){
 const transport=require(module);
 transport.request=transport.get=()=>{throw Error('OFFLINE_TEST: accesso HTTP vietato');};
}
