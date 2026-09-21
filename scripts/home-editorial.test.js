const {test}=require('node:test');
const assert=require('node:assert/strict');
const {buildHomeSection}=require('./build-cms');
const {selectHomeArticles}=require('./article-home');
const item=(i,extra={})=>({slug:`article-${i}`,title:`Articolo ${i}`,date:`2026-09-${String(i).padStart(2,'0')}`,summary:'Sintesi ordinaria',image:'assets/test.jpg',imageAlt:'Descrizione della foto',...extra});
test('home renders two primary and four secondary articles, never more than six',()=>{
 const html=buildHomeSection(Array.from({length:8},(_,i)=>item(i+1)));
 assert.equal((html.match(/class="conoscenza-featured-card"/g)||[]).length,2);
 assert.equal((html.match(/class="conoscenza-compact-card"/g)||[]).length,4);
 assert(!html.includes('/articoli/article-7/'));
 assert.equal((html.match(/width="800" height="450" loading="lazy"/g)||[]).length,6);
});
test('home summary, rubric and category fallback are independent and escaped',()=>{
 const html=buildHomeSection([item(1,{home_summary:'Breve & chiaro',rubrica:'tecnologie-che-aiutano'}),item(2,{category:'Analisi',title:'Un titolo <sicuro>'})]);
 assert(html.includes('Breve &amp; chiaro'));
 assert(html.includes('Tecnologie che aiutano'));
 assert(html.includes('Analisi'));
 assert(html.includes('Un titolo &lt;sicuro&gt;'));
 assert.equal((html.match(/Sintesi ordinaria/g)||[]).length,1);
});
test('one editorial primary is completed by relevance then date; expired and archive articles do not displace active choices',()=>{
 const items=[item(1,{rilevanza_home:'principale',ordine_home:1}),item(2,{rilevanza_home:'evidenza'}),item(3,{rilevanza_home:'solo_archivio'}),item(4,{rilevanza_home:'principale',mantieni_in_evidenza_fino_al:'2026-09-10'}),item(5),item(6),item(7),item(8)];
 const selected=selectHomeArticles(items,'2026-09-21').slice(0,6);
 assert.deepEqual(selected.map(x=>x.slug),[1,2,8,7,6,5].map(i=>`article-${i}`));
 assert.equal(new Set(selected.map(x=>x.slug)).size,6);
});
test('without editorial choices, newest eligible articles fill slots and sparse datasets render safely',()=>{
 assert.deepEqual(selectHomeArticles([item(1),item(5),item(3)],'2026-09-21').map(x=>x.slug),['article-5','article-3','article-1']);
 assert(buildHomeSection([]).includes('Nessun articolo'));
 const html=buildHomeSection([item(1,{image:''})]);
 assert(html.includes('home-editorial-no-image'));
 assert(!html.includes('home-editorial-secondary'));
});
test('responsive derivatives apply only to home rendering and preserve original image metadata',()=>{
 const article=item(1,{home_image_src:'/assets/home/generated/image-640.webp',home_image_srcset:'/assets/home/generated/image-320.webp 320w, /assets/home/generated/image-640.webp 640w'});
 const html=buildHomeSection([article]);
 assert(html.includes('srcset="/assets/home/generated/image-320.webp 320w'));
 assert(html.includes('sizes="(max-width: 600px)'));
 assert.equal(article.image,'assets/test.jpg');
 assert(html.includes('alt="Descrizione della foto"'));
});
