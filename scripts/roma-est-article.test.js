'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const file='roma-est-accessibilita-percorso-quotidiano.json';
const article=JSON.parse(fs.readFileSync(path.join('content/articoli',file),'utf8'));
test('Roma Est: articolo originale, immagine e didascalia autorizzata, stato principale',()=>{
 assert.equal(article.slug,'roma-est-accessibilita-percorso-quotidiano');assert.equal(article.visible,true);assert.equal(article.date_verified,true);assert.equal(article.date,'2026-11-14');assert.equal(article.rilevanza_home,'principale');assert.equal(article.ordine_home,0);
 assert.ok(fs.existsSync('.'+article.image));assert.match(article.image_alt,/sedia a rotelle/);assert.equal(article.image_caption,'A Largo Agosta si può arrivare davanti alla vetrina, scegliere con lo sguardo un libro e avere ancora un ostacolo da superare per entrare. Per chi usa una carrozzina, anche una soglia bassa può cambiare un gesto quotidiano: entrare quando si vuole, oppure fermarsi sulla porta e chiedere una mano.');
 for(const term of ['donna in gravidanza','passeggino','cieca o ipovedente','fermata','non costituisce partnership'])assert.ok(article.body.includes(term));
});
test('Roma Est: didascalia semantica escapata e assente negli articoli senza campo',()=>{
 const filename=path.resolve('scripts/build-cms.js');const context={require:require('node:module').createRequire(filename),module:{exports:{}},__dirname:path.dirname(filename),console,process};
 vm.runInNewContext(fs.readFileSync(filename,'utf8')+'\nmodule.exports.renderForTest=renderArticle;',context);
 const render=context.module.exports.renderForTest,template='{{IMMAGINE_HTML}}';
 const item={...article,imageAlt:article.image_alt,imageCaption:'A & B <script>',imageIsExternal:false};
 const output=render(item,fs.readFileSync('templates/articolo-template.html','utf8'));
 assert.match(output,/<figcaption[^>]*>A &amp; B &lt;script&gt;<\/figcaption>/);
 assert.doesNotMatch(render({...item,imageCaption:''},fs.readFileSync('templates/articolo-template.html','utf8')),/<figcaption/);
});
