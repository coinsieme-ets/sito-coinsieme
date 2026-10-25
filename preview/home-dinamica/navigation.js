(() => {
  const button=document.querySelector('.nav-toggle'),menu=document.querySelector('#nav-menu');
  if(!button||!menu)return;
  button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',String(open));menu.classList.toggle('open',open);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&button.getAttribute('aria-expanded')==='true'){button.setAttribute('aria-expanded','false');menu.classList.remove('open');button.focus();}});
})();
