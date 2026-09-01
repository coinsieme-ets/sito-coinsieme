/**
 * COINSIEME — Popup Editoriale per Novità (Articoli / Pubblicazioni)
 *
 * Componente leggero, accessibile, non invasivo e riutilizzabile.
 * Mostra una card discreta in basso a destra solo se la novità è attiva
 * e non è ancora stata chiusa nella sessione corrente.
 */

(function () {
  'use strict';

  // 1. CONFIGURAZIONE EDITORIALE DELLA NOVITÀ
  // Modificare questo oggetto per attivare/disattivare o cambiare la novità da promuovere.
  window.COINSIEME_NOVITA = {
    attiva: true,
    id: 'novita-il-presente-che-abitiamo-2026',
    tipo: 'Nuovo articolo', // 'Nuovo articolo' | 'Nuova pubblicazione'
    badgeClass: 'badge-terracotta',
    titolo: 'Il presente che abitiamo',
    testo: 'La vita cambia insieme ai bisogni, alle relazioni e agli strumenti che utilizziamo. COINSIEME sceglie di stare dentro questo presente e provare a costruire nuove possibilità.',
    ctaTesto: "Leggi l'articolo →",
    ctaUrl: '/articoli/il-presente-che-abitiamo/'
  };

  // 2. LOGICA GRAFICA E INTERAZIONE
  function initNovitaPopup() {
    const config = window.COINSIEME_NOVITA;
    if (!config || !config.attiva) return;

    const storageKey = 'coinsieme_novita_dismissed_' + config.id;
    try {
      if (sessionStorage.getItem(storageKey) === 'true') {
        return; // Già visualizzato e chiuso in questa sessione
      }
    } catch (e) {
      // Fallback trasparente in caso di blocco sessionStorage
    }

    // Iniezione stili dedicati
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      .novita-toast {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999;
        width: calc(100% - 48px);
        max-width: 380px;
        background: #ffffff;
        border: 1px solid rgba(85, 51, 17, 0.14);
        border-left: 5px solid var(--terracotta-deep, #a34d14);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(85, 51, 17, 0.16), 0 2px 8px rgba(0, 0, 0, 0.04);
        padding: 18px 20px;
        font-family: var(--font-body, system-ui, -apple-system, sans-serif);
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.32s ease, transform 0.32s ease;
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
      .novita-toast-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
      }
      .novita-close-btn {
        background: transparent;
        border: none;
        color: var(--grigio-testo, #685848);
        font-size: 1.45rem;
        line-height: 1;
        padding: 2px 6px;
        cursor: pointer;
        border-radius: 4px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s ease, background 0.15s ease;
      }
      .novita-close-btn:hover {
        color: var(--marrone-scuro, #2b1808);
        background: rgba(85, 51, 17, 0.08);
      }
      .novita-close-btn:focus-visible {
        outline: 3px solid var(--terracotta-deep, #a34d14);
        outline-offset: 2px;
      }
      .novita-titolo {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--marrone-scuro, #2b1808);
        margin: 0 0 6px 0;
        line-height: 1.35;
        font-family: var(--font-heading, inherit);
      }
      .novita-testo {
        font-size: 0.90rem;
        color: var(--grigio-testo, #554433);
        line-height: 1.52;
        margin: 0 0 14px 0;
      }
      .novita-cta {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        gap: 6px;
        font-size: 0.86rem;
        padding: 7px 16px;
        font-weight: 600;
        border-radius: 6px;
        text-decoration: none;
        background-color: var(--terracotta-deep, #a34d14);
        color: #ffffff;
      }
      .novita-cta:hover {
        background-color: var(--terracotta, #c45e1a);
        color: #ffffff;
      }
      @media (max-width: 640px) {
        .novita-toast {
          bottom: max(16px, env(safe-area-inset-bottom, 16px));
          left: 16px;
          right: 16px;
          width: auto;
          max-width: none;
          padding: 13px 15px;
          border-radius: 10px;
          border-left-width: 4px;
          box-shadow: 0 6px 20px rgba(85, 51, 17, 0.18), 0 1px 4px rgba(0, 0, 0, 0.05);
        }
        .novita-toast-header {
          margin-bottom: 6px;
        }
        .novita-toast-header .badge {
          font-size: 0.70rem !important;
          padding: 2px 7px !important;
          letter-spacing: 0.04em;
        }
        .novita-close-btn {
          font-size: 1.25rem;
          min-width: 32px;
          min-height: 32px;
          padding: 0;
        }
        .novita-titolo {
          font-size: 0.96rem;
          line-height: 1.26;
          margin: 0 0 4px 0;
        }
        .novita-testo {
          font-size: 0.84rem;
          line-height: 1.38;
          margin: 0 0 10px 0;
        }
        .novita-cta {
          font-size: 0.82rem;
          padding: 7px 14px;
          gap: 4px;
        }
      }
    `;
    document.head.appendChild(styleEl);

    // Creazione del container HTML
    const toast = document.createElement('aside');
    toast.className = 'novita-toast';
    toast.setAttribute('role', 'region');
    toast.setAttribute('aria-label', 'Novità in evidenza');
    toast.setAttribute('aria-live', 'polite');

    toast.innerHTML = `
      <div class="novita-toast-header">
        <span class="badge ${config.badgeClass || 'badge-terracotta'}" style="font-size:0.75rem; padding:3px 10px;">
          ${config.tipo || 'Novità'}
        </span>
        <button type="button" class="novita-close-btn" aria-label="Chiudi notifica novità" title="Chiudi notifica">&times;</button>
      </div>
      <h3 class="novita-titolo" id="novita-titolo">${config.titolo}</h3>
      <p class="novita-testo">${config.testo}</p>
      <a href="${config.ctaUrl}" class="btn btn-primary btn-sm novita-cta">
        ${config.ctaTesto}
      </a>
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
    toast.querySelector('.novita-cta').addEventListener('click', () => {
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
