'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const escape=x=>String(x||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function build(output=path.join(root,'assistenza-digitale.html')){
 const resources=require('../anteprima-sportello/app/servizi').resources;
 const own=resources.find(x=>x.id==='coinsieme-barriere-digitali');
 const locations=resources.filter(x=>x.id.startsWith('facilitazione-roma-'));
 if(!own||locations.length!==3)throw Error('Catalogo digitale incompleto');
 const coinsieme='<p class="eyebrow">Il servizio della Fondazione</p><h3>'+escape(own.name)+'</h3><p>'+escape(own.description)+'</p><p>'+escape(own.access)+'</p><p class="note">Costi: '+escape(own.costs)+'</p><a class="action" href="/contatti.html">Informati sul supporto COINSIEME →</a><p><a href="'+escape(own.source)+'">Leggi la presentazione del servizio già online</a></p>';
 const cards=locations.map(x=>'<article data-municipio="'+escape(x.municipio)+'"><p class="eyebrow">Municipio '+escape(x.municipio)+'</p><h4>'+escape(x.address)+'</h4><p>'+escape(x.hours)+'</p><p>'+escape(x.description)+'</p><p>'+escape(x.access)+'</p><p class="note">Gestione: '+escape(x.entity)+'. Verifica: <time datetime="'+x.verifiedAt+'">'+x.verifiedAt+'</time>.</p><ul class="links">'+x.links.map(l=>'<li><a href="'+escape(l.url)+'">'+escape(l.label)+'</a></li>').join('')+'</ul></article>').join('');
 const html=fs.readFileSync(path.join(root,'templates/assistenza-digitale-template.html'),'utf8').replace('{{COINSIEME}}',coinsieme).replace('{{SPORTELLI}}',cards);
 fs.writeFileSync(output,html);return html;
}
if(require.main===module){build();console.log('Anteprima locale: assistenza-digitale.html (noindex)');}
module.exports={build};
