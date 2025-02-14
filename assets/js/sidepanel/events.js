// assets/js/sidepanel/events.js
import { State, updateState } from './state.js';
import { renderHighlights } from './index.js';
import * as HighlightManager from './highlight-manager.js';

export function updateHighlights() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (!tabs[0]) return;
        updateState({ currentUrl: tabs[0].url });

        chrome.storage.local.get(['highlights'], function (result) {
            const allHighlights = result.highlights || [];
            const pageHighlights = allHighlights.filter(h => h.url === State.currentUrl);

            // Update counters
            document.getElementById('page-counter').textContent = pageHighlights.length;
            document.getElementById('all-counter').textContent = allHighlights.length;

            // Determine which highlights to show based on current tab
            let highlightsToShow = State.currentTab === 'page' ? pageHighlights : allHighlights;
            
            // Apply filters
            highlightsToShow = HighlightManager.filterHighlights(highlightsToShow);
            
            // Debug logging
            console.log('Current tab:', State.currentTab);
            console.log('Highlights to show:', highlightsToShow.length);
            
            renderHighlights(highlightsToShow);
        });
    });
}