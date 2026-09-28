const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.SPORTELLO_QA_DIR || require('node:path').join(require('node:os').tmpdir(),'sportello-qa');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});let checks=0;
for(const [name,width,height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844]]){
 const context=await browser.newContext({viewport:{width,height}}),page=await context.newPage();const errors=[],leaks=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if((r.url()+' '+(r.postData()||'')).includes('PROVA_PRIVATA'))leaks.push(r.url());});
 await page.goto((process.env.SPORTELLO_URL || 'http://127.0.0.1:8780/sportello/'));
 assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');checks++;
 await page.screenshot({path:out+'/'+name+'-home.png',fullPage:true});
 const cases=['Sono una persona vedova e vorrei esplorare occasioni di incontro.','Sto rientrando a casa dopo un ricovero e vorrei capire come organizzarmi.','Aiuto un familiare e cerco informazioni per la sua autonomia.'];
 for(let i=0;i<cases.length;i++){
  await page.locator('[data-action=inizia]').click();assert.equal(await page.locator('[data-step=perimetro] h2').evaluate(e=>e===document.activeElement),true);checks++;
  await page.locator('[data-action=avanti]').click();assert.equal(await page.locator('[data-step=perimetro]').isVisible(),true);checks++;
  await page.locator('#perimetro-ok').check();await page.locator('[data-action=avanti]').click();
  const probe='PROVA_PRIVATA '+cases[i];await page.locator('#racconto').fill(probe);
  await page.locator('[data-action=perimetro]').click();await page.locator('[data-action=avanti]').click();assert.equal(await page.locator('#racconto').inputValue(),probe);checks++;
  await page.locator('form button[type=submit]').click();assert.equal(await page.locator('[data-answer=racconto]').textContent(),probe);checks++;
  await page.locator('[data-action=correggi]').first().click();await page.locator('#racconto').fill(probe+' Vorrei rileggere questa frase.');await page.locator('form button[type=submit]').click();
  assert.match(await page.locator('[data-answer=racconto]').textContent(),/Vorrei rileggere questa frase\./);checks++;
  await page.locator('[data-action=conferma]').click();assert.equal(await page.locator('#aree-scelta input:checked').count(),0);checks++;
  for(const box of (await page.locator('#aree-scelta input').all()).slice(0,3))await box.check();
  await page.locator('#aree-scelta input').nth(3).click();assert.equal(await page.locator('#aree-scelta input:checked').count(),3);checks++;
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks++;await page.screenshot({path:out+'/'+name+'-aree.png',fullPage:true});
  await page.locator('[data-action=risorse]').click();const urls=await page.locator('#risorse-elenco a').evaluateAll(els=>els.map(a=>a.getAttribute('href')));
  assert.ok(urls.length>=2 && urls.length<=4);assert.equal(new Set(urls).size,urls.length);checks+=2;
  assert.equal(await page.locator('.sp-message-fallback a').getAttribute('href'),'/contatti.html');checks++;
  if(i===0)await page.screenshot({path:out+'/'+name+'-risorse.png',fullPage:true});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));checks++;
  await page.locator('[data-action=cambia-aree]').click();assert.equal(await page.locator('#aree-scelta input:checked').count(),3);checks++;
  await page.locator('[data-action=nessuna-scelta]').click();assert.equal(await page.locator('#risorse-elenco a').count(),2);checks++;
  await page.locator('[data-step=risorse] [data-action=cancella]').click();assert.equal(await page.locator('#racconto').inputValue(),'');assert.equal(await page.locator('[data-answer=racconto]').textContent(),'');checks+=2;
 }
 await page.locator('[data-action=inizia]').click();assert.equal(await page.locator('[data-step=perimetro] h2').evaluate(e=>e===document.activeElement),true);checks++;await page.locator('#perimetro-ok').check();await page.locator('[data-action=avanti]').click();await page.locator('#racconto').fill('PROVA_PRIVATA reset');await page.reload();assert.equal(await page.locator('#racconto').inputValue(),'');checks++;
 assert.deepEqual(leaks,[]);assert.deepEqual(errors,[]);checks+=2;
 assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);checks++;
 // Base accessibility: labels and keyboard focus, no horizontal overflow at each stage.
 await page.locator('[data-action=inizia]').focus();assert.ok(await page.locator('[data-action=inizia]').evaluate(e=>e===document.activeElement));checks++;
 await context.close();
}
await browser.close();fs.writeFileSync(out+'/result.json',JSON.stringify({checks,status:'passed',viewports:['1440','820','390'],cases:3},null,2));console.log(JSON.stringify({checks,status:'passed',out}));
})().catch(e=>{console.error(e);process.exit(1)});
