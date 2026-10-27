/* Catalogo editoriale: usa solo le aree scelte, mai il racconto. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SportelloOrientamento = api;
})(typeof window === 'undefined' ? globalThis : window, () => {
  'use strict';
  const {areas,resources} = typeof module === 'object' && module.exports ? require('./risorse') : window.SportelloRisorse;
  const selectAreas = ids => areas.filter(area => ids.includes(area.id)).sort((a,b) => a.order-b.order).slice(0,3);
  function chooseResources(ids, isAvailable = url => Boolean(resources[url])) {
    const selected = selectAreas(ids), result = new Map();
    const valid = url => Boolean(resources[url]) && isAvailable(url);
    const add = url => { if (valid(url) && !result.has(url) && result.size < 4) result.set(url, {url,...resources[url],areas:[]}); };
    // Prima tutte le destinazioni principali, poi le alternative (max 2 per area).
    // Nessuna chiamata di rete: disponibilita' verificata nei test del sito.
    for (const area of selected) add(valid(area.link) ? area.link : area.fallback);
    for (const area of selected) add(area.fallback);
    if (!selected.length) ['/persone-famiglie.html','/articoli.html'].forEach(add);
    for (const resource of result.values()) {
      resource.areas = selected.filter(area => [area.link,area.fallback].includes(resource.url)).map(area => area.title);
    }
    return [...result.values()];
  }
  function chooseServiceResources(ids,catalog){
    const allowed=new Set(catalog.areas.filter(area=>ids.includes(area.id)).map(area=>area.id));
    const selected=catalog.resources.filter(resource=>(resource.categories||[resource.category]).some(id=>allowed.has(id)));
    const covered=new Set(selected.filter(resource=>resource.kind==='territoriale'&&catalog.isVerifiedResource(resource)).filter(resource=>resource.subcategory).map(resource=>resource.category+':'+resource.subcategory));
    return [...new Map(selected.filter(resource=>resource.kind==='territoriale'||!covered.has(resource.category+':'+resource.subcategory)).map(resource=>[resource.id,resource])).values()];
  }
  function groupServiceResources(items,ids,catalog){
    const groups=new Map();
    for(const item of items){
      const category=(item.categories||[item.category]).find(id=>ids.includes(id));
      const key=category+':'+((item.groupByCategory||{})[category]||item.subcategory||'generale');
      const definition=(catalog.resultGroups||[]).find(group=>group.id===key);
      if(!groups.has(key))groups.set(key,{id:key,label:definition?definition.label:catalog.areas.find(a=>a.id===category).title,collapsible:Boolean(definition),resources:[]});
      groups.get(key).resources.push(item);
    }
    return [...groups.values()];
  }
  function homeTerritoryMatches(resource,territory){
    if(!territory||territory==='tutti')return true;
    if(territory==='nazionale')return resource.coverageClass==='nazionale_dichiarata';
    if(territory==='roma')return resource.allRomeDeclared===true;
    const municipi=[resource.seatMunicipio,...(resource.coverageMunicipi||[])];
    if(territory==='v')return municipi.includes('V');
    if(territory==='est')return municipi.some(m=>['IV','V','VI','VII'].includes(m));
    return false;
  }
  function chooseHomeResources(ids,catalog,options={}){
    if(!ids.includes('domicilio'))return chooseServiceResources(ids,catalog);
    const other=chooseServiceResources(ids.filter(id=>id!=='domicilio'),catalog);
    const publicIds=['territorio-adi-d5','territorio-pua-forteguerri','territorio-pua-togliatti','territorio-sociale-anziani','territorio-sociale-disabilita','territorio-sociale-minori','territorio-sociale-adulti','territorio-sociale-poverta-abitare'];
    // Projections leave the original 25 records and their category selection untouched.
    const publicItems=catalog.resources.filter(r=>publicIds.includes(r.id)).map(r=>({...r,category:'domicilio',categories:['domicilio'],subcategory:'pubblico',homeKind:'pubblico',coverageMunicipi:['V'],publicMunicipi:['V'],allRomeDeclared:false,coverageStatus:'Percorso competente nel Municipio V; accesso individuale da valutare'}));
    const fold=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
    const home=[...(catalog.homeOperators||[]),...publicItems,...(catalog.technicalResources||[])].filter(r=>(!options.kind||options.kind==='tutti'||r.homeKind===options.kind)&&homeTerritoryMatches(r,options.territory)&&fold([r.name,...(r.keywords||[])].join(' ')).includes(fold(options.name))).map(r=>r.categories?.includes('domicilio')?{...r,category:'domicilio',categories:['domicilio']}:r);
    return [...new Map([...home,...other].map(r=>[r.id,r])).values()];
  }
  function hasDocumentedRomeCoverage(catalog){
    return (catalog.homeOperators||[]).some(r=>r.allRomeDeclared===true&&catalog.isVerifiedResource(r));
  }
  return {areas,resources,selectAreas,chooseResources,chooseServiceResources,groupServiceResources,homeTerritoryMatches,chooseHomeResources,hasDocumentedRomeCoverage};
});
