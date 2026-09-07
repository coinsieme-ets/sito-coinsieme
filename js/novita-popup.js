/**
 * COINSIEME — Widget Bolla Flottante per Novità Editoriale ("Floating Bubble Card")
 *
 * Spezza l'uniformità visiva con una forma a bolla moderna e morbida,
 * mostrando il titolo su 2 righe e una CTA a pillola dedicata.
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

    // Iniezione stili bolla flottante
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .novita-bubble-card {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999;
        width: 290px;
        max-width: calc(100vw - 36px);
        background: rgba(255, 255, 255, 0.98);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border: 1.5px solid rgba(196, 94, 26, 0.28);
        border-radius: 20px 20px 4px 20px;
        box-shadow: 0 12px 32px rgba(85, 51, 17, 0.16), 0 2px 8px rgba(196, 94, 26, 0.08);
        padding: 14px 16px 14px 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-family: var(--font-body, system-ui, -apple-system, sans-serif);
        opacity: 0;
        transform: translateY(24px) scale(0.95);
        transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .novita-bubble-card.novita-visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      @media (prefers-reduced-motion: reduce) {
        .novita-bubble-card {
          transition: none !important;
          transform: none !important;
        }
      }
      .novita-bubble-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .novita-bubble-badge {
        background: var(--crema, #f7ede2);
        color: var(--terracotta-deep, #a34d14);
        font-weight: 800;
        font-size: 0.70rem;
        padding: 3px 8px;
        border-radius: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .novita-bubble-close {
        background: transparent;
        border: none;
        color: var(--grigio-testo, #5a4a3a);
        font-size: 1.25rem;
        line-height: 1;
        padding: 2px 6px;
        cursor: pointer;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s ease, background 0.15s ease;
      }
      .novita-bubble-close:hover,
      .novita-bubble-close:focus-visible {
        color: var(--marrone-scuro, #3d2208);
        background: rgba(85, 51, 17, 0.08);
        outline: none;
      }
      .novita-bubble-title {
        margin: 0;
        font-family: var(--font-heading, 'Outfit', sans-serif);
        font-size: 0.95rem;
        font-weight: 700;
        color: var(--marrone-scuro, #3d2208);
        line-height: 1.35;
        text-decoration: none;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .novita-bubble-title:hover,
      .novita-bubble-title:focus-visible {
        color: var(--terracotta, #c45e1a);
      }
      .novita-bubble-footer {
        display: flex;
        align-items: center;
        margin-top: 2px;
      }
      .novita-bubble-cta {
        background: var(--terracotta, #c45e1a);
        color: #ffffff !important;
        font-size: 0.80rem;
        font-weight: 700;
        padding: 5px 14px;
        border-radius: 100px;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 3px 10px rgba(196, 94, 26, 0.32);
        transition: background 0.15s ease, transform 0.15s ease;
      }
      .novita-bubble-cta:hover,
      .novita-bubble-cta:focus-visible {
        background: var(--terracotta-lite, #d97035);
        transform: translateY(-1px);
      }
      @media (max-width: 640px) {
        .novita-bubble-card {
          bottom: max(16px, env(safe-area-inset-bottom, 16px));
          right: 16px;
          left: 16px;
          width: auto;
          max-width: none;
        }
      }
    `;
    document.head.appendChild(styleEl);

    // Creazione HTML Bolla
    const bubble = document.createElement('aside');
    bubble.className = 'novita-bubble-card';
    bubble.setAttribute('role', 'region');
    bubble.setAttribute('aria-label', 'Nuovo articolo in evidenza');

    bubble.innerHTML = `
      <div class="novita-bubble-top">
        <span class="novita-bubble-badge">
          <span aria-hidden="true">✨</span>
          <span>${config.tipo || 'Nuovo articolo'}</span>
        </span>
        <button type="button" class="novita-bubble-close" aria-label="Chiudi notifica novità" title="Chiudi notifica">&times;</button>
      </div>
      <a href="${config.ctaUrl}" class="novita-bubble-title" title="${config.titolo}">
        ${config.titolo}
      </a>
      <div class="novita-bubble-footer">
        <a href="${config.ctaUrl}" class="novita-bubble-cta">
          Leggi l'articolo <span aria-hidden="true">→</span>
        </a>
      </div>
    `;

    document.body.appendChild(bubble);

    function dismissBubble() {
      bubble.classList.remove('novita-visible');
      try {
        sessionStorage.setItem(storageKey, 'true');
      } catch (e) {}
      setTimeout(() => {
        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      }, 350);
      document.removeEventListener('keydown', handleKeyDown);
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        dismissBubble();
      }
    }

    bubble.querySelector('.novita-bubble-close').addEventListener('click', dismissBubble);
    bubble.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        try {
          sessionStorage.setItem(storageKey, 'true');
        } catch (e) {}
      });
    });
    document.addEventListener('keydown', handleKeyDown);

    // Mostra con animazione morbida dopo 600ms
    setTimeout(() => {
      bubble.classList.add('novita-visible');
    }, 600);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNovitaPopup);
  } else {
    initNovitaPopup();
  }
})();
