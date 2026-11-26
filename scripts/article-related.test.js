const test=require('node:test'),assert=require('node:assert/strict');
const {relatedArticles}=require('./article-related');
test('Rimandi editoriali: nessun link a bozze o articoli non ancora pubblicati',()=>{
 const a={slug:'farmacia',related_articles:['farmaci','farmacia']};
 assert.deepEqual(relatedArticles(a,[a,{slug:'farmaci',visible:false}]),[]);
 assert.deepEqual(relatedArticles(a,[a,{slug:'farmaci',visible:true}]).map(x=>x.slug),['farmaci']);
 assert.deepEqual(relatedArticles({},[{slug:'altro',visible:true}]),[]);
});
