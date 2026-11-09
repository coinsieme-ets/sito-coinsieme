(() => {
  const panel = document.getElementById('robot-demo');
  if (!panel) return;
  const marker = document.getElementById('robot-marker');
  const trail = document.getElementById('robot-trail');
  const status = document.getElementById('robot-status');
  const start = document.getElementById('robot-start');
  const pause = document.getElementById('robot-pause');
  const step = document.getElementById('robot-step');
  const reset = document.getElementById('robot-reset');
  const dust = [...panel.querySelectorAll('[data-robot-dust]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Predetermined illustration, not navigation logic for a real appliance.
  const route = [[40,180],[40,40],[90,40],[90,180],[140,180],[140,40],[270,40],[270,180],[320,180],[320,40],[360,40],[360,180],[40,180]];
  const lengths = route.slice(1).map((p,i) => Math.hypot(p[0]-route[i][0],p[1]-route[i][1]));
  const total = lengths.reduce((a,b) => a+b,0);
  let distance = 0, frame = null, previous = null, running = false;
  function draw() {
    let left = distance, index = 0;
    while (index < lengths.length-1 && left > lengths[index]) left -= lengths[index++];
    const a = route[index], b = route[index+1], t = Math.min(1,left/lengths[index]);
    const x = a[0]+(b[0]-a[0])*t, y = a[1]+(b[1]-a[1])*t;
    marker.setAttribute('transform', `translate(${x} ${y})`);
    trail.setAttribute('d', route.slice(0,index+1).map((p,i) => `${i?'L':'M'}${p[0]} ${p[1]}`).join(' ') + ` L${x} ${y}`);
    for (const dot of dust) if (Math.hypot(Number(dot.getAttribute('cx'))-x, Number(dot.getAttribute('cy'))-y) < 16) dot.style.opacity = '0';
  }
  function stop(message) {
    running = false;
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; previous = null; pause.disabled = true; start.disabled = false;
    if (message) status.textContent = message;
  }
  function advance(amount) {
    distance = Math.min(total,distance+amount); draw();
    if (distance === total) stop('Percorso dimostrativo completato. Non indica la pulizia di una casa reale.');
  }
  function tick(time) {
    if (!running) return;
    if (previous !== null) advance(Math.min(time-previous,100)*0.09);
    previous = time;
    if (running) frame = requestAnimationFrame(tick);
  }
  function oneStep() {
    stop();
    if (distance === total) restart();
    advance(12);
    if (distance !== total) status.textContent = 'Un passo del percorso dimostrativo. Nessun apparecchio reale collegato.';
  }
  function restart() {
    stop(); distance = 0;
    for (const dot of dust) dot.style.opacity = '';
    draw(); status.textContent = 'Simulazione pronta. Nessun apparecchio reale collegato.';
  }
  start.addEventListener('click', () => {
    if (reduced.matches) { oneStep(); return; }
    if (distance === total) restart();
    running = true; previous = null; start.disabled = true; pause.disabled = false;
    status.textContent = 'Il robottino percorre lo schema e mostra le zone attraversate: simulazione in corso.';
    frame = requestAnimationFrame(tick);
  });
  pause.addEventListener('click', () => stop('Simulazione in pausa. Puoi riprendere o ripristinare.'));
  step.addEventListener('click', oneStep);
  reset.addEventListener('click', restart);
  panel.addEventListener('toggle', () => { if (!panel.open && running) stop('Simulazione in pausa: pannello chiuso.'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && running) stop('Simulazione in pausa: pagina non visibile.'); });
  reduced.addEventListener('change', () => { if (reduced.matches && running) stop('Movimento ridotto: usa Un passo per proseguire.'); });
  restart();
})();
