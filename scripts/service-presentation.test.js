'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const engine=require('../anteprima-sportello/app/orientamento'),catalog=require('../anteprima-sportello/app/servizi');
test('Presentazione: introduzioni sanitarie dirette senza seconda intestazione identica',()=>{
 const groups=engine.groupServiceResources(engine.chooseServiceResources(['salute'],catalog),['salute'],catalog);
 for(const name of ['medici-pediatri','continuita-assistenziale','visite-private-televisite','farmacie']){
  const group=groups.find(g=>g.id==='salute:'+name);assert.ok(group);assert.equal(group.resources.length,1);
  assert.deepEqual(engine.servicePresentation(group.resources[0],group,catalog),{inline:true,showHeading:false});
 }
});
test('Presentazione: nessun record duplicato o perso in tutte le selezioni di categorie',()=>{
 assert.equal(catalog.resources.length,43);assert.equal(new Set(catalog.resources.map(r=>r.id)).size,43);
 const ids=catalog.areas.map(a=>a.id);
 for(let mask=1;mask<2**ids.length;mask++){
  const selected=ids.filter((_,i)=>mask&(1<<i)),records=engine.chooseHomeResources(selected,catalog),groups=engine.groupServiceResources(records,selected,catalog);
  assert.deepEqual(groups.flatMap(g=>g.resources.map(r=>r.id)).sort(),records.map(r=>r.id).sort());
  assert.equal(new Set(records.map(r=>r.id)).size,records.length);
  for(const group of groups)for(const record of group.resources){const view=engine.servicePresentation(record,group,catalog);if(catalog.isVerifiedResource(record))assert.equal(view.inline,false);}
 }
});
test('Presentazione: introduzioni delle altre categorie senza nuovo clic, titoli utili conservati',()=>{
 for(const id of ['abitare','vicinato','digitale','diritti']){
  const resources=engine.chooseServiceResources([id],catalog),groups=engine.groupServiceResources(resources,[id],catalog);
  const group=groups.find(g=>g.resources.some(r=>r.id==='info-'+id));
  assert.deepEqual(engine.servicePresentation(group.resources.find(r=>r.id==='info-'+id),group,catalog),{inline:true,showHeading:true});
 }
});
test('Presentazione: non appiattisce servizi reali anche quando il titolo coincide',()=>{
 const resource=catalog.resources.find(catalog.isVerifiedResource);assert.ok(resource);
 assert.deepEqual(engine.servicePresentation(resource,{label:resource.name,collapsible:true},catalog),{inline:false,showHeading:false});
 const draft={id:'servizio-demo',name:'Servizio in preparazione',status:'in_preparazione'};
 assert.equal(engine.servicePresentation(draft,{label:draft.name,collapsible:true},catalog).inline,false);
});
