/**
 * COINSIEME — Popup Editoriale Micro-Pillola per Novità
 *
 * Componente super compatto, leggero, non invasivo.
 * Mostra una pillola sottile a riga singola in basso a destra solo se la novità è attiva
 * e non è ancora stata chiusa nella sessione corrente.
 */

(function () {
  'use strict';

  // 1. CONFIGURAZIONE EDITORIALE DELLA NOVITÀ
  window.COINSIEME_NOVITA = {
    attiva: true,
    id: 'novita-cambio-d-appalto-2026',
    tipo: 'Nuovo articolo',
    titolo: 'Cambio d’appalto: il lavoro sociale',
    ctaUrl: '/articoli/cambio-d-appalto-il-terzo-mondo-del-lavoro-sociale/'
  };

  // 2. LOGICA GRAFICA E INTERAZIONE
  function initNovitaPopup() {
    const config = window.COINSIEME_NOVITA;
    if (!config || !config.attiva) return;

    const storageKey = 'coinsieme_novita_dismissed_' + config.id;
    try {
      if (sessionStorage.getItem(storageKey) === 'true') {
        return;
      }
    } catch (e) {}

    // Iniezione stili micro-pillola
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .novita-toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999;
        background: rgba(255, 255, 255, 0.96);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(196, 94, 26, 0.25);
        border-left: 4px solid var(--terracotta, #c45e1a);
        border-radius: 100px;
        box-shadow: 0 6px 20px rgba(85, 51, 17, 0.12), 0 1px 4px rgba(0, 0, 0, 0.04);
        padding: 5px 10px 5px 12px;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--font-body, system-ui, -apple-system, sans-serif);
        font-size: 0.82rem;
        max-width: min(380px, calc(100vw - 32px));
        opacity: 0;
        transform: translateY(16px);
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      .novita-toast.novita-visible {
        opacity: 1;
        transform: translateY(0);
      }
      @media (prefers-reduced-motion: reduce) {
        .novita-toast {
          transition: none !important;
          transform: none !important;
        }
      }
      .novita-badge-micro {
        background: var(--crema, #f7ede2);
        color: var(--terracotta-deep, #a34d14);
        font-weight: 800;
        font-size: 0.65rem;
        padding: 2px 7px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .novita-link-micro {
        color: var(--marrone-scuro, #3d2208);
        font-weight: 600;
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 0.80rem;
      }
      .novita-link-micro:hover,
      .novita-link-micro:focus-visible {
        color: var(--terracotta, #c45e1a);
        text-decoration: underline;
      }
      .novita-close-btn {
        background: transparent;
        border: none;
        color: var(--grigio-testo, #5a4a3a);
        font-size: 1.15rem;
        line-height: 1;
        padding: 2px 5px;
        cursor: pointer;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: color 0.15s ease, background 0.15s ease;
      }
      .novita-close-btn:hover {
        color: var(--marrone-scuro, #3d2208);
        background: rgba(85, 51, 17, 0.08);
      }
      @media (max-width: 640px) {
        .novita-toast {
          bottom: max(14px, env(safe-area-inset-bottom, 14px));
          left: 14px;
          right: 14px;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(styleEl);

    // Creazione HTML micro-pillola
    const toast = document.createElement('aside');
    toast.className = 'novita-toast';
    toast.setAttribute('role', 'region');
    toast.setAttribute('aria-label', 'Nuovo articolo in evidenza');

    toast.innerHTML = `
      <span class="novita-badge-micro">${config.tipo || 'Nuovo'}</span>
      <a href="${config.ctaUrl}" class="novita-link-micro" title="${config.titolo}">
        <span>${config.titolo}</span>
        <span aria-hidden="true">→</span>
      </a>
      <button type="button" class="novita-close-btn" aria-label="Chiudi notifica novità" title="Chiudi notifica">&times;</button>
    `;

    document.body.appendChild(toast);

    function dismissToast() {
      toast.classList.remove('novita-visible');
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch (e) {}
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
      document.removeEventListener('keydown', handleKeyDown);
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        dismissToast();
      }
    }

    toast.querySelector('.novita-close-btn').addEventListener('click', dismissToast);
    toast.querySelector('.novita-link-micro').addEventListener('click', () => {
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch (e) {}
    });
    document.addEventListener('keydown', handleKeyDown);

    // Mostra con animazione dopo breve intervallo
    setTimeout(() => {
      toast.classList.add('novita-visible');
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNovitaPopup);
  } else {
    initNovitaPopup();
  }
})();
