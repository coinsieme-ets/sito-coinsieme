const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {build,TARGET,ALIASES}=require('./build-seo');
function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'seo-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const page=(file,url,extra='')=>{const full=path.join(root,file);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,`<link rel="canonical" href="https://www.coinsieme.it${url}">${extra}`);};
 page(`articoli/${TARGET}/index.html`,`/articoli/${TARGET}/`);return {root,page,articles:[{slug:TARGET,visible:true}]};
}
test('published pages only, no stale/draft/noindex/alias/404 URLs; stable sitemap without fabricated lastmod',t=>{
 const {root,page,articles}=fixture(t);
 page('index.html','/');page('404.html','/404.html');page('articoli/nuovo/index.html','/articoli/nuovo/');articles.push({slug:'nuovo',visible:true},{slug:'bozza',visible:false});
 page('articoli/stale/index.html','/articoli/stale/');page('pubblicazioni/libro/index.html','/pubblicazioni/libro/');page('rassegna/news/index.html','/rassegna/news/');
 page('privata.html','/privata.html','<meta name="robots" content="noindex">');page('alias.html','/altro/','<meta http-equiv="refresh" content="0;url=/altro/">');
 assert.equal(build(root,articles).urls,5);
 const xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');assert.match(xml,/articoli\/nuovo\//);assert.doesNotMatch(xml,/stale|bozza|privata|404|altro|lastmod|-copy/);
 build(root,articles);assert.equal(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8'),xml);
 for(const alias of ALIASES){const html=fs.readFileSync(path.join(root,'articoli',alias,'index.html'),'utf8');assert.match(html,/content="0;url=/);assert.ok(html.includes(`href="https://www.coinsieme.it/articoli/${TARGET}/"`));}
});
test('fails on missing target, wrong canonical and unsafe overwrite',t=>{
 const {root,page,articles}=fixture(t);assert.throws(()=>build(root,[]),/target not published/);
 page(`articoli/${TARGET}/index.html`,'/wrong/');assert.throws(()=>build(root,articles),/mismatch/);
 page(`articoli/${TARGET}/index.html`,`/articoli/${TARGET}/`);page(`articoli/${ALIASES[0]}/index.html`,'/existing/');assert.throws(()=>build(root,articles),/refusing to overwrite/);
});
