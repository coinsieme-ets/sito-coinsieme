'use strict';
const filter=document.querySelector('.filter'),select=document.querySelector('#municipio');
if(filter&&select){filter.hidden=false;select.addEventListener('change',()=>{
 let count=0;for(const card of document.querySelectorAll('[data-municipio]')){card.hidden=Boolean(select.value&&card.dataset.municipio!==select.value);if(!card.hidden)count++;}
 document.querySelector('#risultati').textContent=count+' '+(count===1?'sportello documentato':'sportelli documentati');
});}
