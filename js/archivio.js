document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('archivio-search');
    const clearBtn = document.getElementById('archivio-clear');
    const cards = Array.from(document.querySelectorAll('.archivio-card'));
    const noResultsMsg = document.getElementById('archivio-no-results');
    const statsCounter = document.getElementById('archivio-stats-count');
    const loadMoreBtn = document.getElementById('archivio-load-more');

    let isSearching = false;
    let visibleLimit = window.innerWidth < 768 ? 12 : 18;
    let currentlyVisible = visibleLimit;

    function updateProgressiveView() {
        if (isSearching) return;

        let totalVisible = 0;
        for (let i = 0; i < cards.length; i++) {
            if (i < currentlyVisible) {
                cards[i].style.display = '';
                totalVisible++;
            } else {
                cards[i].style.display = 'none';
            }
        }

        if (statsCounter) {
            statsCounter.textContent = totalVisible;
        }

        if (loadMoreBtn) {
            const remaining = cards.length - currentlyVisible;
            if (remaining > 0) {
                loadMoreBtn.style.display = 'inline-flex';
                loadMoreBtn.textContent = `Mostra altri articoli (${remaining})`;
            } else {
                loadMoreBtn.style.display = 'none';
            }
        }

        if (noResultsMsg) {
            noResultsMsg.style.display = totalVisible === 0 ? 'block' : 'none';
        }
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentlyVisible += (window.innerWidth < 768 ? 12 : 18);
            updateProgressiveView();
        });
    }

    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        
        if (query === '') {
            isSearching = false;
            currentlyVisible = window.innerWidth < 768 ? 12 : 18;
            updateProgressiveView();
            return;
        }

        isSearching = true;
        let visibleCount = 0;

        cards.forEach(card => {
            const title = card.getAttribute('data-title') || '';
            
            if (title.includes(query)) {
                card.style.display = '';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        if (statsCounter) {
            statsCounter.textContent = visibleCount;
        }

        if (noResultsMsg) {
            noResultsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        if (loadMoreBtn) {
            loadMoreBtn.style.display = 'none';
        }
    }

    if (searchInput) {
        searchInput.addEventListener('input', performSearch);
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            isSearching = false;
            currentlyVisible = window.innerWidth < 768 ? 12 : 18;
            updateProgressiveView();
            searchInput.focus();
        });
    }

    // Initialize
    updateProgressiveView();
});
