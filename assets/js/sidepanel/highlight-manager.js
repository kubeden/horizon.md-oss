// assets/js/sidepanel/highlight-manager.js
import { State } from './state.js';
import { formatDate, formatUrl, getCombinedHighlightContent } from './utils.js';

export function saveHighlightTheme(highlightId, theme) {
    chrome.storage.local.get(['highlights'], function (result) {
        const highlights = result.highlights || [];
        const highlightIndex = highlights.findIndex(h => h.id === highlightId);

        if (highlightIndex !== -1) {
            highlights[highlightIndex].theme = theme;
            chrome.storage.local.set({ highlights }, function () {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, {
                            action: "updateHighlightTheme",
                            highlightId: highlightId,
                            theme: theme
                        }).catch(() => {
                            console.log('Tab was closed or became unavailable');
                        });
                    }
                });
            });
        }
    });
}

export function filterHighlights(highlights) {
    let filtered = highlights;

    if (State.currentSearchQuery) {
        const query = State.currentSearchQuery.toLowerCase();
        filtered = filtered.filter(h => {
            try {
                // Safely get highlight content
                const content = (h.range?.text || h.content || '').toLowerCase();
                const notes = (h.notes || []).map(n => (n.text || '').toLowerCase());
                return content.includes(query) || notes.some(note => note.includes(query));
            } catch (error) {
                console.error('Error filtering highlight:', error);
                return false;
            }
        });
    }

    const now = Date.now();
    switch (State.currentFilter) {
        case 'today':
            const today = new Date().setHours(0, 0, 0, 0);
            filtered = filtered.filter(h => h.timestamp >= today);
            break;
        case 'last-week':
            const lastWeek = now - (7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(h => h.timestamp >= lastWeek);
            break;
        case 'last-month':
            const lastMonth = now - (30 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(h => h.timestamp >= lastMonth);
            break;
        case 'with-notes':
            filtered = filtered.filter(h => h.notes && h.notes.length > 0);
            break;
        case 'no-notes':
            filtered = filtered.filter(h => !h.notes || h.notes.length === 0);
            break;
    }

    return filtered;
}