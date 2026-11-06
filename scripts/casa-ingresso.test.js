const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),prefix='casa-che-si-prende-cura/';
const read=name=>fs.readFileSync(path.join(root,prefix+name),'utf8');
const dataFrom=source=>{const ctx={window:{}};vm.runInNewContext(source,ctx);return ctx.window.CASA_PREVIEW_DATA;};
const html=read('index.html'),data=dataFrom(read('house-data.js'));
test('Ingresso: identificatori storici, dodici hotspot e quattro schede coordinate',()=>{
 assert.match(html,/data-solution="videocitofono" aria-label="Ingresso e accessi"/);
 assert.equal(data.solutions.videocitofono.title,'Ingresso e accessi');assert.equal(data.solutions.videocitofono.room,'#ingresso');
 const room=html.split('id="ingresso"')[1].split('</section>')[0];
 for(const title of ['Vedere chi arriva e aprire senza spostarsi','Serrature intelligenti: telefono, codice e impronta','Motorizzazione della porta','Maniglioni e soglie raccordate'])assert.ok(room.includes('<h3>'+title+'</h3>'));
 assert.equal((room.match(/class="solution"/g)||[]).length,4);
 assert.equal((html.match(/class="hotspot /g)||[]).length,12);assert.equal(Object.keys(data.solutions).length,12);
 assert.equal((html.match(/class="solution(?: featured)?"/g)||[]).length,34);
 assert.doesNotMatch(html,/33 schede/);
});
test('Ingresso: immagini e percorsi seguono le nuove denominazioni',()=>{
 const item=data.solutions.videocitofono,image=data.assets.cardImages[item.imageTitle];assert.ok(image);assert.match(image.alt,/Videocitofono/);
 assert.ok(html.includes('<h3>'+item.imageTitle+'</h3>'));assert.ok(fs.existsSync(path.join(root,prefix,image.src)));
 for(const title of ['Vedere chi arriva e aprire senza spostarsi','Serrature intelligenti: telefono, codice e impronta','Motorizzazione della porta'])assert.ok(data.paths.fatica.terms.some(t=>title.includes(t)));
 assert.ok(data.paths.tranquillita.terms.some(t=>item.imageTitle.includes(t)));
});
test('Ingresso: limiti espliciti, articolo nel pannello e nella stanza senza prezzi',()=>{
 const room=html.split('id="ingresso"')[1].split('</section>')[0],s=data.solutions.videocitofono;
 assert.match(room,/accessi distinti/);assert.match(room,/senza telefono/);assert.match(room,/non sono funzioni universali/i);
 assert.match(room,/Sbloccare la serratura non significa muovere fisicamente la porta/);
 for(const term of ['batterie','modalità alternativa','raggiungibilità','Internet','privacy'])assert.ok(room.includes(term));
 assert.doesNotMatch(room,/€|\d+[,.]\d{2}/);assert.match(s.article,/aprire-senza-chiavi-rispondere-al-citofono-da-lontano/);
 assert.ok(room.includes(s.article));assert.match(html,/id="object-article-link" hidden/);
 assert.match(read('casa.js'),/articleLink.hidden = !solution.article/);assert.match(read('casa.js'),/articleLink.removeAttribute\('href'\)/);
});
test('Ingresso: altri ambienti, adattamenti e simulazioni conservati',()=>{
 // Baseline 2f9a8bd; hashes also work in the Git-free Pages test workspace.
 const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
 const sections=text=>[...text.replace(/\r\n/g,'\n').matchAll(/<section class="room-section(?: alt)?"[\s\S]*?<\/section>/g)].map(m=>m[0]).filter(s=>!s.includes('id="ingresso"'));
 assert.equal(hash(JSON.stringify(sections(html))),'8de0a710a64c9d6567567d9b3db542a5c09f43321d0dde5e9bb0bda2c874750b');
 assert.equal(hash(JSON.stringify(Object.entries(data.solutions).filter(([id])=>id!=='videocitofono'))),'21344e36ec2ebabee0ba0885227990c651d937bf75203276d0e07bd3edfdbece');
 const js=read('casa.js').replace(/\r\n/g,'\n');
 assert.equal(hash(js.slice(js.indexOf('  const demos ='))),'a976eced7c1f1e679c6d79bbab044e3c7c1d95d83f5a8c69d9d338cddf95f0cf');
});
