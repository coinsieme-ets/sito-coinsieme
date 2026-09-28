/* Menu del sito: stesso markup e stile, senza spostare il focus durante il percorso. */
(() => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.getElementById('nav-menu');
  function close(restoreFocus = false) {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open'); toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Apri menu di navigazione');
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    if (menu.classList.contains('open')) return close(true);
    menu.classList.add('open'); toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Chiudi menu di navigazione'); menu.querySelector('a').focus();
  });
  document.addEventListener('click', event => {
    if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (!menu.classList.contains('open')) return;
    if (event.key === 'Escape') { close(true); return; }
    if (event.key !== 'Tab') return;
    const links = [...menu.querySelectorAll('a[href]')];
    if (event.shiftKey && document.activeElement === links[0]) { event.preventDefault(); links.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === links.at(-1)) { event.preventDefault(); links[0].focus(); }
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => close()));
})();
