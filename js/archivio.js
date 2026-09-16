document.addEventListener('DOMContentLoaded', () => {
    const search = document.getElementById('archivio-search');
    const filter = document.getElementById('archivio-rubrica');
    const clear = document.getElementById('archivio-clear');
    const cards = Array.from(document.querySelectorAll('#archivio-results .archivio-card'));
    const empty = document.getElementById('archivio-no-results');
    const count = document.getElementById('archivio-stats-count');
    const more = document.getElementById('archivio-load-more');
    const pageSize = window.innerWidth < 768 ? 12 : 18;
    let limit = pageSize;
    function render() {
        const query = (search?.value || '').toLocaleLowerCase('it').trim();
        const rubrica = filter?.value || '';
        let total = 0;
        cards.forEach(card => {
            const matches = (card.dataset.title || '').includes(query) &&
                (!rubrica || card.dataset.rubrica === rubrica);
            card.style.display = matches && total < limit ? '' : 'none';
            if (matches) total++;
        });
        if (count) count.textContent = `${Math.min(limit, total)} di ${total}`;
        if (empty) empty.style.display = total ? 'none' : '';
        if (more) {
            more.style.display = total > limit ? '' : 'none';
            more.textContent = `Mostra altri articoli (${Math.max(0, total - limit)})`;
        }
    }
    const reset = () => { limit = pageSize; render(); };
    search?.addEventListener('input', reset);
    filter?.addEventListener('change', reset);
    more?.addEventListener('click', () => { limit += pageSize; render(); });
    clear?.addEventListener('click', () => {
        if (search) search.value = '';
        if (filter) filter.value = '';
        reset(); search?.focus();
    });
    render();
});
